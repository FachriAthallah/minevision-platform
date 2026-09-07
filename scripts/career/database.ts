import { createHash } from "node:crypto";
import type postgres from "postgres";
import { getTableConfig, type PgColumn } from "drizzle-orm/pg-core";

import { sources } from "../../src/db/schema/sources";
import { contentCategories, contents } from "../../src/db/schema/content";
import { contentSources } from "../../src/db/schema/content-sources";
import { careerProfessions } from "../../src/db/schema/career-professions";
import { careerProfileItems } from "../../src/db/schema/career-profile-items";
import { CAREER_IMPORT_TABLES, canonicalCareerValue, careerKey, emptyCareerRows,
  type CareerImportTable, type CareerRow, type CareerSnapshot } from "../../src/features/data-ingestion/services/career-import-model";
import type { ValidatedCareerImport } from "../../src/features/data-ingestion/services/validate-career-import";

export type CareerSql = postgres.TransactionSql<Record<string, never>>;
const schemaTables = { sources, content_categories: contentCategories, contents,
  content_sources: contentSources, career_professions: careerProfessions, career_profile_items: careerProfileItems };
export const CAREER_NATURAL_COLUMNS: Record<CareerImportTable, string[]> = {
  sources: ["slug"], content_categories: ["module", "slug"], contents: ["module", "slug"],
  content_sources: ["content_id", "source_id"],
  career_professions: ["content_id", "group_key", "slug"],
  career_profile_items: ["content_id", "item_key"],
};
export type CareerCatalog = {
  columns: { table_name: string; column_name: string; sql_type: string; not_null: boolean; has_default: boolean }[];
  indexes: { table_name: string; columns: string[]; is_unique: boolean; valid: boolean; partial: boolean; immediate: boolean }[];
  foreignKeys: { table_name: string; columns: string[]; target_schema: string; target_table: string;
    target_columns: string[]; validated: boolean; delete_action: string; update_action: string }[];
  enums: { name: string; value: string }[];
  checks: { table_name: string; name: string; validated: boolean }[];
};

const normalizeType = (type: string) => type.replaceAll('"', "").replace(/^public\./, "")
  .replace("character varying", "varchar").replace("timestamp with time zone", "timestamptz")
  .replace("timestamp without time zone", "timestamp");
const sameColumns = (left: string[], right: string[]) => JSON.stringify(left) === JSON.stringify(right);
const actionCodes: Record<string, string> = { "no action": "a", restrict: "r", cascade: "c", "set null": "n", "set default": "d" };

// Requirements come from the existing Drizzle schema, not another Zod contract.
export function evaluateCareerCatalog(catalog: CareerCatalog): string[] {
  const issues: string[] = [];
  for (const table of CAREER_IMPORT_TABLES) {
    const config = getTableConfig(schemaTables[table]);
    for (const column of config.columns) {
      const actual = catalog.columns.find((entry) => entry.table_name === table && entry.column_name === column.name);
      if (!actual || normalizeType(actual.sql_type) !== normalizeType(column.getSQLType()) ||
        actual.not_null !== column.notNull || (column.hasDefault && !actual.has_default)) {
        issues.push(`Schema column unavailable/incompatible: ${table}.${column.name}`);
      }
      if (column.enumValues?.length) {
        const name = normalizeType(column.getSQLType());
        for (const value of column.enumValues) {
          if (!catalog.enums.some((entry) => entry.name === name && entry.value === value))
            issues.push(`Schema enum missing: ${name}.${value}`);
        }
      }
    }
    const requiredUnique = [CAREER_NATURAL_COLUMNS[table],
      ...config.columns.filter((column) => column.primary).map((column) => [column.name])];
    for (const columns of requiredUnique) {
      if (!catalog.indexes.some((index) => index.table_name === table && index.is_unique &&
        index.valid && index.immediate && !index.partial && sameColumns(index.columns, columns)))
        issues.push(`Schema unique index missing/incompatible: ${table}(${columns.join(",")})`);
    }
    // Check all schema indexes, including non-unique indexes used by scoped reads.
    for (const index of config.indexes) {
      const columns = index.config.columns.map((column) => (column as PgColumn).name);
      if (!catalog.indexes.some((actual) => actual.table_name === table && actual.valid && !actual.partial &&
        sameColumns(actual.columns, columns) && (!index.config.unique || actual.is_unique)))
        issues.push(`Schema index missing/incompatible: ${table}.${index.config.name}`);
    }
    for (const fk of config.foreignKeys) {
      const reference = fk.reference();
      const target = getTableConfig(reference.foreignTable);
      if (!catalog.foreignKeys.some((actual) => actual.table_name === table && actual.validated &&
        actual.target_schema === "public" && actual.target_table === target.name &&
        sameColumns(actual.columns, reference.columns.map((column) => column.name)) &&
        sameColumns(actual.target_columns, reference.foreignColumns.map((column) => column.name)) &&
        actual.delete_action === actionCodes[fk.onDelete ?? "no action"] &&
        actual.update_action === actionCodes[fk.onUpdate ?? "no action"]))
        issues.push(`Schema foreign key missing/incompatible: ${table}.${fk.getName()}`);
    }
    for (const check of config.checks) {
      if (!catalog.checks.some((actual) => actual.table_name === table && actual.name === check.name && actual.validated))
        issues.push(`Schema check missing/unvalidated: ${table}.${check.name}`);
    }
  }
  return issues;
}

export async function readCareerCatalog(sql: CareerSql): Promise<CareerCatalog> {
  const tables = [...CAREER_IMPORT_TABLES];
  const columns = await sql<CareerCatalog["columns"]>`
    SELECT c.relname AS table_name, a.attname AS column_name,
      format_type(a.atttypid, a.atttypmod) AS sql_type, a.attnotnull AS not_null,
      a.atthasdef AS has_default
    FROM pg_catalog.pg_attribute a
    JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname IN ${sql(tables)}
      AND a.attnum > 0 AND NOT a.attisdropped`;
  const indexes = await sql<CareerCatalog["indexes"]>`
    SELECT c.relname AS table_name, i.indisunique AS is_unique,
      (i.indisvalid AND i.indisready) AS valid, i.indpred IS NOT NULL AS partial,
      i.indimmediate AS immediate,
      ARRAY(SELECT a.attname::text FROM unnest(i.indkey) WITH ORDINALITY k(attnum, ord)
        LEFT JOIN pg_catalog.pg_attribute a ON a.attrelid = c.oid AND a.attnum = k.attnum
        WHERE k.ord <= i.indnkeyatts ORDER BY k.ord) AS columns
    FROM pg_catalog.pg_index i JOIN pg_catalog.pg_class c ON c.oid = i.indrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname IN ${sql(tables)}`;
  const foreignKeys = await sql<CareerCatalog["foreignKeys"]>`
    SELECT c.relname AS table_name, f.convalidated AS validated,
      tn.nspname AS target_schema, t.relname AS target_table,
      f.confdeltype::text AS delete_action, f.confupdtype::text AS update_action,
      ARRAY(SELECT a.attname::text FROM unnest(f.conkey) WITH ORDINALITY k(num, ord)
        JOIN pg_catalog.pg_attribute a ON a.attrelid = c.oid AND a.attnum = k.num ORDER BY k.ord) AS columns,
      ARRAY(SELECT a.attname::text FROM unnest(f.confkey) WITH ORDINALITY k(num, ord)
        JOIN pg_catalog.pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.num ORDER BY k.ord) AS target_columns
    FROM pg_catalog.pg_constraint f JOIN pg_catalog.pg_class c ON c.oid = f.conrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_catalog.pg_class t ON t.oid = f.confrelid
    JOIN pg_catalog.pg_namespace tn ON tn.oid = t.relnamespace
    WHERE f.contype = 'f' AND n.nspname = 'public' AND c.relname IN ${sql(tables)}`;
  const enums = await sql<CareerCatalog["enums"]>`
    SELECT t.typname AS name, e.enumlabel AS value FROM pg_catalog.pg_enum e
    JOIN pg_catalog.pg_type t ON t.oid = e.enumtypid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public'`;
  const checks = await sql<CareerCatalog["checks"]>`
    SELECT c.relname AS table_name, f.conname AS name, f.convalidated AS validated
    FROM pg_catalog.pg_constraint f JOIN pg_catalog.pg_class c ON c.oid = f.conrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE f.contype = 'c' AND n.nspname = 'public' AND c.relname IN ${sql(tables)}`;
  return { columns, indexes, foreignKeys, enums, checks };
}

type RawRow = Record<string, unknown>;
export function normalizeCareerSnapshot(raw: Record<CareerImportTable, RawRow[]>): CareerSnapshot {
  const rows = emptyCareerRows();
  const referenceIssues: string[] = [];
  const sourceKeys = new Map(raw.sources.map((row) => [row.id, String(row.slug)]));
  const categoryKeys = new Map(raw.content_categories.map((row) => [row.id, careerKey(String(row.module), String(row.slug))]));
  const contentKeys = new Map(raw.contents.map((row) => [row.id, careerKey(String(row.module), String(row.slug))]));
  const resolve = (map: Map<unknown, string>, id: unknown, label: string) => {
    const key = map.get(id);
    if (!key) referenceIssues.push(`Missing database reference: ${label}`);
    return key ?? `unresolved:${String(id)}`;
  };
  for (const table of CAREER_IMPORT_TABLES) {
    for (const rawRow of raw[table]) {
      const values = { ...rawRow };
      let key: string;
      if (table === "sources") key = String(values.slug);
      else if (table === "contents" || table === "content_categories") {
        key = careerKey(String(values.module), String(values.slug));
        if (table === "contents" && values.category_id !== null) {
          values.category_id = resolve(categoryKeys, values.category_id, `${table}.${key}.category_id`);
          const category = raw.content_categories.find((row) => row.id === rawRow.category_id);
          if (values.module === "career" && category && category.module !== "career")
            referenceIssues.push(`Conflicting category module: ${key}`);
        }
      } else {
        values.content_id = resolve(contentKeys, values.content_id, `${table}.content_id`);
        if (table === "content_sources") {
          values.source_id = resolve(sourceKeys, values.source_id, `${table}.source_id`);
          key = careerKey(String(values.content_id), String(values.source_id));
        } else if (table === "career_professions") {
          key = careerKey(String(values.content_id), String(values.group_key), String(values.slug));
        } else key = careerKey(String(values.content_id), String(values.item_key));
      }
      rows[table].push({ key, values, ...(typeof rawRow.id === "string" ? { id: rawRow.id } : {}) });
    }
    rows[table].sort((a, b) => a.key.localeCompare(b.key));
  }
  return { rows, schemaIssues: [], referenceIssues };
}

export async function readCareerSnapshot(sql: CareerSql, dataset: ValidatedCareerImport): Promise<CareerSnapshot> {
  const schemaIssues = evaluateCareerCatalog(await readCareerCatalog(sql));
  if (schemaIssues.length) return { rows: emptyCareerRows(), schemaIssues, referenceIssues: [] };
  const slugs = dataset.manifest.categoryFiles.map((file) => file.categorySlug);
  const sourceSlugs = dataset.manifest.sourceCatalog.map((source) => source.slug);
  const raw = {} as Record<CareerImportTable, RawRow[]>;
  raw.contents = await sql`SELECT * FROM public.contents WHERE slug IN ${sql(slugs)}`;
  raw.content_categories = await sql`
    SELECT * FROM public.content_categories WHERE slug IN ${sql(slugs)} OR id IN
      (SELECT category_id FROM public.contents WHERE slug IN ${sql(slugs)})`;
  raw.sources = await sql`
    SELECT * FROM public.sources WHERE slug IN ${sql(sourceSlugs)} OR id IN
      (SELECT cs.source_id FROM public.content_sources cs JOIN public.contents c ON c.id = cs.content_id
       WHERE c.module = 'career' AND c.slug IN ${sql(slugs)})`;
  for (const table of ["content_sources", "career_professions", "career_profile_items"] as const) {
    raw[table] = await sql`
      SELECT child.* FROM ${sql(`public.${table}`)} child
      JOIN public.contents c ON c.id = child.content_id
      WHERE c.module = 'career' AND c.slug IN ${sql(slugs)}`;
  }
  return normalizeCareerSnapshot(raw);
}

export function careerFingerprint(snapshot: CareerSnapshot) {
  return createHash("sha256").update(canonicalCareerValue(snapshot)).digest("hex");
}

// BEGIN is explicitly READ ONLY. Throwing this private sentinel makes Postgres.js
// send ROLLBACK even on success; no write is attempted to demonstrate safety.
export async function withCareerReadOnly<T>(client: postgres.Sql<Record<string, never>>,
  work: (sql: CareerSql) => Promise<T>) {
  const rollback = new Error("career-read-only-complete");
  let result: { value: T; proof: { transactionReadOnly: string; transactionIdAssigned: boolean; rolledBack: boolean } } | undefined;
  try {
    await client.begin("isolation level repeatable read read only", async (sql) => {
      const value = await work(sql);
      const [proof] = await sql<{ read_only: string; xid: string | null }[]>`
        SELECT current_setting('transaction_read_only') AS read_only,
          pg_current_xact_id_if_assigned()::text AS xid`;
      if (proof.read_only !== "on" || proof.xid !== null) throw new Error("Career read-only proof failed");
      result = { value, proof: { transactionReadOnly: proof.read_only, transactionIdAssigned: false, rolledBack: false } };
      throw rollback;
    });
  } catch (error) { if (error !== rollback) throw error; }
  if (!result) throw new Error("Career read-only transaction did not finish");
  result.proof.rolledBack = true;
  return result;
}

export function careerIdMap(snapshot: CareerSnapshot, table: "sources" | "content_categories" | "contents") {
  return new Map(snapshot.rows[table].flatMap((row: CareerRow) => row.id ? [[row.key, row.id] as const] : []));
}
