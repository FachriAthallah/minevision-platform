import { createHash } from "node:crypto";
import { config } from "dotenv";
import postgres from "postgres";
import { loadIntelligenceCanonical } from "../../src/features/data-ingestion/services/validate-intelligence-canonical";
import { applyIntelligenceCanonical, emptyIntelligenceSnapshot, INTELLIGENCE_TABLES, planIntelligenceCanonical, planIntelligencePromotion, promoteIntelligenceCanonical, stableValue, type IntelligencePromotionPlan, type IntelligenceSnapshot, type IntelligenceTransaction, type Row } from "../../src/features/data-ingestion/services/intelligence-canonical-plan";

type Mode = "preflight" | "dry-run" | "import" | "verify";
const WRITABLE_TABLES = new Set(["sources", "commodity_production_series", "commodity_price_series", "commodity_production", "commodity_production_sources", "commodity_domestic_prices", "commodity_region_coverage", "commodity_production_locations"]);
export async function readIntelligenceSnapshot(tx: postgres.TransactionSql): Promise<{ data: IntelligenceSnapshot; issues: string[] }> {
  const tables = await tx<{ tablename: string; rowsecurity: boolean }[]>`select tablename, rowsecurity from pg_tables where schemaname = 'public'`;
  const columns = await tx<{ table_name: string; column_name: string }[]>`select table_name, column_name from information_schema.columns where table_schema = 'public'`;
  const data = emptyIntelligenceSnapshot();
  const issues: string[] = [];
  for (const table of INTELLIGENCE_TABLES) {
    const entry = tables.find((row) => row.tablename === table);
    if (!entry) { issues.push(`${table}: migration lokal belum diterapkan`); continue; }
    if (!entry.rowsecurity) issues.push(`${table}: RLS tidak aktif`);
    // PostgreSQL numeric must not pass through JSON's floating-point number parser.
    // Table/column choices are source-code constants, never staging-supplied SQL.
    const rows = table === "commodity_production" || table === "commodity_region_coverage"
      ? await tx<{ value: Row }[]>`select to_jsonb(t) || jsonb_build_object('production_value', t.production_value::text) as value from ${tx(table)} t`
      : table === "commodity_domestic_prices"
        ? await tx<{ value: Row }[]>`select to_jsonb(t) || jsonb_build_object('price_value', t.price_value::text) as value from commodity_domestic_prices t`
        : table === "commodity_production_locations" && columns.some((column) => column.table_name === table && column.column_name === "latitude")
          ? await tx<{ value: Row }[]>`select to_jsonb(t) || jsonb_build_object('production_value', t.production_value::text, 'latitude', t.latitude::text, 'longitude', t.longitude::text, 'share_percentage', t.share_percentage::text) as value from commodity_production_locations t`
          : table === "commodity_production_locations"
            ? await tx<{ value: Row }[]>`select to_jsonb(t) || jsonb_build_object('production_value', t.production_value::text, 'share_percentage', t.share_percentage::text) as value from commodity_production_locations t`
            : await tx<{ value: Row }[]>`select to_jsonb(t) as value from ${tx(table)} t`;
    data[table] = rows.map((row) => row.value).sort((a, b) => stableValue(a).localeCompare(stableValue(b)));
  }
  for (const [table, column] of [["commodity_production", "series_id"], ["commodity_production_locations", "site_slug"], ["commodity_domestic_prices", "commodity_id"], ["commodity_domestic_prices", "price_series_id"]]) {
    if (!columns.some((row) => row.table_name === table && row.column_name === column)) issues.push(`${table}.${column}: schema prasyarat belum tersedia`);
  }
  const constraints = await tx<{ conname: string; convalidated: boolean }[]>`select c.conname, c.convalidated from pg_constraint c join pg_namespace n on n.oid=c.connamespace where n.nspname='public'`;
  for (const name of ["production_series_identity_fk", "price_series_standard_commodity_fk", "domestic_price_series_identity_fk", "domestic_price_standard_identity_fk", "production_series_default_check", "price_series_default_check", "region_coverage_ranking_check", "production_locations_site_check"]) {
    if (!constraints.some((constraint) => constraint.conname === name && constraint.convalidated)) issues.push(`${name}: constraint tervalidasi belum tersedia`);
  }
  const indexes = await tx<{ indexname: string; indexdef: string }[]>`select indexname, indexdef from pg_indexes where schemaname='public'`;
  for (const name of ["production_series_public_default_unique_idx", "price_series_public_default_unique_idx", "production_locations_site_unique_idx"]) {
    const index = indexes.find((entry) => entry.indexname === name);
    if (!index?.indexdef.includes("UNIQUE INDEX") || !index.indexdef.includes("WHERE")) issues.push(`${name}: partial unique index belum tersedia`);
  }
  return { data, issues };
}
const fingerprint = (data: IntelligenceSnapshot) => createHash("sha256").update(stableValue(data)).digest("hex");
const distinctGroupCount = (rows: Row[], columns: string[]) => new Set(
  rows.map((row) => columns.map((column) => String(row[column])).join("\u001f")),
).size;

export async function runCanonicalCli(mode: Mode) {
  const input = process.argv[2];
  if (!input) throw new Error("Berikan manifest Intelligence versi 2.0");
  // This gate deliberately precedes configuration, connection, and transaction creation.
  if (mode === "import" && !process.argv.includes("--commit")) throw new Error("Tanpa --commit: tidak membuka koneksi/transaksi dan tidak menulis data");
  const validated = await loadIntelligenceCanonical(input);
  if (!validated.success) {
    for (const issue of validated.issues) console.error(`${issue.filePath}: ${issue.path} [${issue.code}] ${issue.message}`);
    process.exitCode = 1;
    return;
  }
  config({ path: ".env.local", quiet: true });
  const url = mode === "import" ? process.env.DATABASE_MIGRATION_URL : process.env.DATABASE_URL;
  if (!url) throw new Error("Konfigurasi koneksi belum tersedia");
  const client = postgres(url, { ssl: "require", max: 1, prepare: false, connect_timeout: 15 });
  try {
    if (mode === "import") {
      const result = await applyIntelligenceCanonical(validated.data, {
        transaction: (work) => client.begin("isolation level serializable", async (tx) => {
          const adapter: IntelligenceTransaction = {
            snapshot: async () => {
              const result = await readIntelligenceSnapshot(tx);
              if (result.issues.length) throw new Error("Schema/RLS prasyarat belum terpenuhi");
              return result.data;
            },
            insert: async (batch) => {
              if (batch.some((entry) => !WRITABLE_TABLES.has(entry.table))) throw new Error("Tabel tidak diizinkan untuk importer");
              for (const table of WRITABLE_TABLES) {
                const entries = batch.filter((entry) => entry.table === table);
                if (!entries.length) continue;
                const values = entries.map((entry) => {
                  const row = entry.row as Record<string, postgres.ParameterOrJSON<never>>;
                  return table === "commodity_production_series" ? { ...row, metadata: tx.json(entry.row.metadata as postgres.JSONValue) } : row;
                });
                await tx`insert into ${tx(table)} ${tx(values)}`;
              }
            },
          };
          return work(adapter);
        }),
      }, true);
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    const rollback = new Error("INTELLIGENCE_READ_ONLY_COMPLETE");
    let report: object | undefined;
    await client.begin("isolation level repeatable read read only", async (tx) => {
      const [modeRow] = await tx<{ read_only: string }[]>`select current_setting('transaction_read_only') as read_only`;
      if (modeRow.read_only !== "on") throw new Error("Transaksi bukan READ ONLY");
      const before = await readIntelligenceSnapshot(tx);
      const plan = planIntelligenceCanonical(validated.data, before.data);
      const after = await readIntelligenceSnapshot(tx);
      const issues = [...before.issues, ...plan.issues];
      if (fingerprint(before.data) !== fingerprint(after.data)) issues.push("Fingerprint transaksi berubah");
      if (mode === "verify" && plan.inserts.length) issues.push("Dataset belum lengkap: masih ada record yang belum diimpor");
      report = { mode, transaction: "READ ONLY / ROLLBACK", writes: 0, fingerprintBefore: fingerprint(before.data), fingerprintAfter: fingerprint(after.data),
        legacySeries: before.data.commodity_production_series.filter((row) => row.is_canonical === false).length,
        plannedLegacySeriesBackfill: before.data.commodity_production_series.length === 0
          ? distinctGroupCount(before.data.commodity_production, ["commodity_id", "unit_code"])
          : 0,
        legacyRecordsPreserved: plan.legacyRecords,
        canonicalSeries: before.data.commodity_production_series.filter((row) => row.is_canonical === true).length,
        legacyPriceSeries: before.data.commodity_price_series.filter((row) => row.is_canonical === false).length,
        plannedLegacyPriceSeriesBackfill: before.data.commodity_price_series.length === 0
          ? distinctGroupCount(before.data.commodity_domestic_prices, ["commodity_id", "price_standard_id", "period"])
          : 0,
        legacyPriceObservationsPreserved: plan.legacyPriceObservations,
        canonicalPriceSeries: before.data.commodity_price_series.filter((row) => row.is_canonical === true).length,
        proposedInserts: plan.counts, unchanged: plan.unchanged, updates: 0, deletes: 0, issues,
      };
      if (issues.length) process.exitCode = 1;
      throw rollback;
    }).catch((error: unknown) => { if (error !== rollback) throw error; });
    console.log(JSON.stringify(report, null, 2));
  } finally { await client.end({ timeout: 5 }); }
}

export async function runPromotionCli() {
  const input = process.argv[2];
  if (!input) throw new Error("Berikan manifest Intelligence versi 2.0");
  const commit = process.argv.includes("--commit");
  const validated = await loadIntelligenceCanonical(input);
  if (!validated.success) {
    for (const issue of validated.issues) console.error(`${issue.filePath}: ${issue.path} [${issue.code}] ${issue.message}`);
    process.exitCode = 1;
    return;
  }
  config({ path: ".env.local", quiet: true });
  const url = commit ? process.env.DATABASE_MIGRATION_URL : process.env.DATABASE_URL;
  if (!url) throw new Error("Konfigurasi koneksi belum tersedia");
  const client = postgres(url, { ssl: "require", max: 1, prepare: false, connect_timeout: 15 });
  const update = async (tx: postgres.TransactionSql, table: "commodity_production_series" | "commodity_production" | "commodity_price_series" | "commodity_domestic_prices", ids: string[]) => {
    if (!ids.length) return;
    await tx`update ${tx(table)} set verification_status = 'verified', publication_status = 'published', updated_at = now()
      where id = any(${tx.array(ids)}::uuid[])
        and (verification_status <> 'verified' or publication_status <> 'published')`;
  };
  try {
    if (commit) {
      const result = await promoteIntelligenceCanonical(validated.data, {
        transaction: (work) => client.begin("isolation level serializable", async (tx) => work({
          snapshot: async () => {
            const state = await readIntelligenceSnapshot(tx);
            if (state.issues.length) throw new Error("Schema/RLS prasyarat belum terpenuhi");
            return state.data;
          },
          promote: async (plan: IntelligencePromotionPlan) => {
            await update(tx, "commodity_production_series", plan.productionSeriesIds);
            await update(tx, "commodity_production", plan.productionObservationIds);
            await update(tx, "commodity_price_series", plan.priceSeriesIds);
            await update(tx, "commodity_domestic_prices", plan.priceObservationIds);
          },
        })),
      }, true);
      console.log(JSON.stringify({ mode: "promotion", transaction: "COMMIT", ...result }, null, 2));
      return;
    }
    const rollback = new Error("INTELLIGENCE_PROMOTION_DRY_RUN_COMPLETE");
    let report: object | undefined;
    await client.begin("isolation level repeatable read read only", async (tx) => {
      const [modeRow] = await tx<{ read_only: string }[]>`select current_setting('transaction_read_only') as read_only`;
      if (modeRow.read_only !== "on") throw new Error("Transaksi bukan READ ONLY");
      const before = await readIntelligenceSnapshot(tx);
      const plan = planIntelligencePromotion(validated.data, before.data);
      const after = await readIntelligenceSnapshot(tx);
      const issues = [...before.issues, ...plan.issues];
      if (fingerprint(before.data) !== fingerprint(after.data)) issues.push("Fingerprint transaksi berubah");
      report = { mode: "promotion-dry-run", transaction: "READ ONLY / ROLLBACK", writes: 0,
        fingerprintBefore: fingerprint(before.data), fingerprintAfter: fingerprint(after.data),
        targets: { productionSeries: plan.productionSeriesIds.length, productionObservations: plan.productionObservationIds.length,
          priceSeries: plan.priceSeriesIds.length, priceObservations: plan.priceObservationIds.length }, issues };
      if (issues.length) process.exitCode = 1;
      throw rollback;
    }).catch((error: unknown) => { if (error !== rollback) throw error; });
    console.log(JSON.stringify(report, null, 2));
  } finally { await client.end({ timeout: 5 }); }
}

export function promotionCli() {
  runPromotionCli().catch(() => {
    console.error("Promotion Intelligence gagal. Tidak ada detail koneksi atau SQL ditampilkan; transaksi yang sudah dibuka dibatalkan.");
    process.exitCode = 1;
  });
}

export function canonicalCli(mode: Mode) {
  if (mode === "import" && !process.argv.includes("--commit")) {
    console.error("Tanpa --commit: importer berhenti sebelum koneksi/transaksi. Tidak ada perubahan yang perlu di-rollback.");
    process.exitCode = 1;
    return;
  }
  runCanonicalCli(mode).catch(() => {
    console.error(`Intelligence ${mode} gagal. Periksa manifest, prasyarat schema, dan koneksi. Tidak ada detail koneksi atau SQL ditampilkan; transaksi yang sudah dibuka dibatalkan.`);
    process.exitCode = 1;
  });
}
