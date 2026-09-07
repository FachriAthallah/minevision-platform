import type postgres from "postgres";
import { createCareerExpectedRows, type CareerImportTable } from "../../src/features/data-ingestion/services/career-import-model";
import type { CareerPlannedRow } from "../../src/features/data-ingestion/services/dry-run-career-import";
import type { CareerImportDatabase, CareerImportTransaction } from "../../src/features/data-ingestion/services/import-career";
import type { ValidatedCareerImport } from "../../src/features/data-ingestion/services/validate-career-import";
import { CAREER_NATURAL_COLUMNS, careerIdMap, readCareerSnapshot, type CareerSql } from "./database";

// Identifiers only come from these schema-owned column lists, never CLI/staging text.
const quote = (identifier: string) => `"${identifier.replaceAll('"', '""')}"`;
export class PostgresCareerWriter implements CareerImportTransaction {
  private sourceIds = new Map<string, string>();
  private categoryIds = new Map<string, string>();
  private contentIds = new Map<string, string>();
  private readonly expected;
  constructor(private readonly sql: CareerSql, private readonly dataset: ValidatedCareerImport) {
    this.expected = createCareerExpectedRows(dataset);
  }
  async readSnapshot() {
    const snapshot = await readCareerSnapshot(this.sql, this.dataset);
    this.sourceIds = careerIdMap(snapshot, "sources");
    this.categoryIds = careerIdMap(snapshot, "content_categories");
    this.contentIds = careerIdMap(snapshot, "contents");
    return snapshot;
  }
  private requireId(map: Map<string, string>, key: unknown, label: string) {
    const id = map.get(String(key));
    if (!id) throw new Error(`Missing database reference: ${label}`);
    return id;
  }
  async writeBatch(table: CareerImportTable, records: CareerPlannedRow[]) {
    if (!records.length) return 0;
    const expected = new Map(this.expected[table].map((row) => [row.key, row]));
    // Reject keys outside the manifest even if this adapter is called directly.
    for (const row of records) {
      if (!expected.has(row.key)) throw new Error(`Career write outside manifest: ${table}`);
      if (row.action === "unchanged") throw new Error("Unchanged rows must not be written");
    }
    const columns = Object.keys(this.expected[table][0].values);
    const values = records.map((record) => {
      // Use the validated payload, never arbitrary values supplied to writeBatch.
      const value = { ...expected.get(record.key)!.values };
      if ("category_id" in value) value.category_id = this.requireId(this.categoryIds, value.category_id, "category_id");
      if ("content_id" in value) value.content_id = this.requireId(this.contentIds, value.content_id, "content_id");
      if ("source_id" in value) value.source_id = this.requireId(this.sourceIds, value.source_id, "source_id");
      return value;
    });
    const parameters: (string | number | boolean | null)[] = [];
    const tuples = values.map((row) => `(${columns.map((column) => {
      const value = row[column];
      if (table === "contents" && column === "metadata") {
        // Bind serialized JSON as text before casting to jsonb. A bare jsonb
        // parameter makes Postgres.js JSON.stringify this string a second time.
        parameters.push(JSON.stringify(value));
        return `$${parameters.length}::text::jsonb`;
      }
      parameters.push(value === null ? null : typeof value === "object" ? JSON.stringify(value) :
        typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? value :
          (() => { throw new Error(`Invalid Career database value: ${column}`); })());
      return `$${parameters.length}`;
    }).join(", ")})`);
    const keys = CAREER_NATURAL_COLUMNS[table];
    const mutable = columns.filter((column) => !keys.includes(column));
    const assignments = mutable.map((column) => `${quote(column)} = EXCLUDED.${quote(column)}`);
    assignments.push('"updated_at" = NOW()');
    const difference = mutable.map((column) => `target.${quote(column)} IS DISTINCT FROM EXCLUDED.${quote(column)}`).join(" OR ");
    const returning = table === "content_sources" ? '"content_id", "source_id"' : '"id", "slug"';
    const result = await this.sql.unsafe<Record<string, string>[]>(`
      INSERT INTO public.${quote(table)} AS target (${columns.map(quote).join(", ")})
      VALUES ${tuples.join(", ")}
      ON CONFLICT (${keys.map(quote).join(", ")}) DO UPDATE SET ${assignments.join(", ")}
      WHERE ${difference}
      RETURNING ${table === "career_profile_items" ? '"id", "item_key"' : returning}`, parameters);
    for (const row of result) {
      if (table === "sources") this.sourceIds.set(row.slug, row.id);
      if (table === "content_categories" || table === "contents") {
        const key = JSON.stringify(["career", row.slug]);
        (table === "contents" ? this.contentIds : this.categoryIds).set(key, row.id);
      }
    }
    return result.length;
  }
}

export function createPostgresCareerDatabase(client: postgres.Sql<Record<string, never>>,
  dataset: ValidatedCareerImport): CareerImportDatabase {
  return {
    async transaction<T>(work: (transaction: CareerImportTransaction) => Promise<T>): Promise<T> {
      // SERIALIZABLE prevents a stale plan silently overwriting concurrent changes.
      // Any serialization failure is surfaced; there is no automatic write retry.
      let result: T | undefined;
      await client.begin("isolation level serializable", async (sql) => {
        await sql`SELECT pg_advisory_xact_lock(hashtext('minevision:career-import:v1'))`;
        result = await work(new PostgresCareerWriter(sql, dataset));
      });
      return result as T;
    },
  };
}
