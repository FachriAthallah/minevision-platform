import { createHash } from "node:crypto";
import { config } from "dotenv";
import postgres from "postgres";

import {
  applyEconomyImport,
  ECONOMY_TABLES,
  economyPublishedFingerprint,
  emptyEconomySnapshot,
  planEconomyImport,
  planEconomyPromotion,
  promoteEconomy,
  stableEconomyValue,
  type EconomyCorrection,
  type EconomyInsert,
  type EconomyPromotionPlan,
  type EconomySnapshot,
  type EconomyTransaction,
} from "../../src/features/data-ingestion/services/economy-import-plan";
import { loadEconomyImport } from "../../src/features/data-ingestion/services/validate-economy-import";

type Mode = "preflight" | "dry-run" | "import" | "verify";
const WRITABLE_TABLES = new Set([
  "sources",
  "economic_gdp_sources",
  "mining_investment_annual",
  "minerba_exports_annual",
]);

const fingerprint = (snapshot: EconomySnapshot) =>
  createHash("sha256").update(stableEconomyValue(snapshot)).digest("hex");

export async function readEconomySnapshot(tx: postgres.TransactionSql) {
  const tables = await tx<{ tablename: string; rowsecurity: boolean }[]>`
    select tablename, rowsecurity from pg_tables where schemaname = 'public'
  `;
  const columns = await tx<{ table_name: string; column_name: string }[]>`
    select table_name, column_name from information_schema.columns where table_schema = 'public'
  `;
  const data = emptyEconomySnapshot();
  const issues: string[] = [];

  for (const table of ECONOMY_TABLES) {
    const tableInfo = tables.find((entry) => entry.tablename === table);
    if (!tableInfo) {
      issues.push(`${table}: tabel tidak tersedia`);
      continue;
    }
    if (!tableInfo.rowsecurity) issues.push(`${table}: RLS tidak aktif`);
    const rows = table === "economic_gdp_annual"
      ? await tx<{ value: Record<string, unknown> }[]>`select to_jsonb(t) || jsonb_build_object('national_gdp_value', t.national_gdp_value::text, 'mining_quarrying_gdp_value', t.mining_quarrying_gdp_value::text) as value from economic_gdp_annual t`
      : table === "mining_investment_annual"
        ? await tx<{ value: Record<string, unknown> }[]>`select to_jsonb(t) || jsonb_build_object('investment_value', t.investment_value::text) as value from mining_investment_annual t`
        : table === "minerba_exports_annual"
          ? await tx<{ value: Record<string, unknown> }[]>`select to_jsonb(t) || jsonb_build_object('export_volume', t.export_volume::text, 'fob_value', t.fob_value::text) as value from minerba_exports_annual t`
          : await tx<{ value: Record<string, unknown> }[]>`select to_jsonb(t) as value from ${tx(table)} t`;
    data[table] = rows.map((row) => row.value).sort((left, right) => stableEconomyValue(left).localeCompare(stableEconomyValue(right)));
  }

  if (!columns.some((entry) => entry.table_name === "minerba_exports_annual" && entry.column_name === "product_form")) {
    issues.push("minerba_exports_annual.product_form: migration Economy belum diterapkan");
  }
  const policies = await tx<{ tablename: string; policyname: string }[]>`
    select tablename, policyname from pg_policies where schemaname = 'public'
  `;
  for (const [table, name] of [
    ["economic_gdp_annual", "public_read_published_verified_gdp"],
    ["mining_investment_annual", "public_read_published_verified_mining_investment"],
    ["minerba_exports_annual", "public_read_published_verified_minerba_exports"],
    ["smelter_facilities", "smelter_facilities_public_read"],
  ]) {
    if (!policies.some((policy) => policy.tablename === table && policy.policyname === name)) issues.push(`${table}: policy ${name} tidak tersedia`);
  }
  const views = await tx<{ viewname: string; reloptions: string[] | null }[]>`
    select c.relname as viewname, c.reloptions
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'v'
  `;
  for (const name of ["economic_gdp_annual_metrics", "mining_investment_annual_metrics", "mining_investment_annual_summary", "minerba_exports_annual_metrics", "smelter_facility_catalog", "smelter_summary_by_commodity"]) {
    const view = views.find((entry) => entry.viewname === name);
    if (!view || !(view.reloptions ?? []).includes("security_invoker=true")) issues.push(`${name}: security_invoker=true tidak tersedia`);
  }
  return { data, issues };
}

async function insertBatches(tx: postgres.TransactionSql, rows: EconomyInsert[]) {
  if (rows.some((entry) => !WRITABLE_TABLES.has(entry.table))) throw new Error("Tabel importer tidak diizinkan");
  for (const table of WRITABLE_TABLES) {
    const tableRows = rows.filter((entry) => entry.table === table).map((entry) => {
      const row = entry.row as Record<string, postgres.ParameterOrJSON<never>>;
      return "metadata" in row ? { ...row, metadata: tx.json(entry.row.metadata as postgres.JSONValue) } : row;
    });
    if (tableRows.length) await tx`insert into ${tx(table)} ${tx(tableRows)}`;
  }
}

async function correctFacilities(tx: postgres.TransactionSql, corrections: EconomyCorrection[]) {
  for (const correction of corrections) {
    const updated = correction.expectedSourceId === null
      ? await tx`update smelter_facilities set source_id = ${correction.canonicalSourceId}::uuid, updated_at = now() where id = ${correction.facilityId}::uuid and source_id is null returning id`
      : await tx`update smelter_facilities set source_id = ${correction.canonicalSourceId}::uuid, updated_at = now() where id = ${correction.facilityId}::uuid and source_id = ${correction.expectedSourceId}::uuid returning id`;
    if (updated.length !== 1) throw new Error(`Fingerprint fasilitas ${correction.facilityCode} berubah; koreksi dibatalkan`);
    await tx`update smelter_facility_sources set source_id = ${correction.canonicalSourceId}::uuid, updated_at = now() where facility_id = ${correction.facilityId}::uuid and source_id is null`;
  }
}

function printValidationIssues(result: Awaited<ReturnType<typeof loadEconomyImport>>) {
  if (result.success) return;
  for (const issue of result.issues) console.error(`${issue.filePath}: ${issue.path} [${issue.code}] ${issue.message}`);
}

export async function runEconomyCli(mode: Mode) {
  const manifestPath = process.argv[2];
  if (!manifestPath) throw new Error("Berikan lokasi manifest Economy");
  if (mode === "import" && !process.argv.includes("--commit")) throw new Error("Tanpa --commit: importer berhenti sebelum koneksi/transaksi");
  const validated = await loadEconomyImport(manifestPath);
  if (!validated.success) {
    printValidationIssues(validated);
    process.exitCode = 1;
    return;
  }
  config({ path: ".env.local", quiet: true });
  const url = mode === "import" ? process.env.DATABASE_MIGRATION_URL : process.env.DATABASE_URL;
  if (!url) throw new Error("Konfigurasi koneksi Economy belum tersedia");
  const client = postgres(url, { ssl: "require", max: 1, prepare: false, connect_timeout: 15 });
  try {
    if (mode === "import") {
      const result = await applyEconomyImport(validated.data, {
        transaction: (work) => client.begin("isolation level serializable", async (tx) => {
          const transaction: EconomyTransaction = {
            snapshot: async () => {
              const snapshot = await readEconomySnapshot(tx);
              if (snapshot.issues.length) throw new Error("Schema Economy belum memenuhi prasyarat");
              return snapshot.data;
            },
            insert: (rows) => insertBatches(tx, rows),
            correctFacilities: (rows) => correctFacilities(tx, rows),
          };
          return work(transaction);
        }),
      }, true);
      console.log(JSON.stringify({ mode, transaction: "SERIALIZABLE / COMMIT", ...result }, null, 2));
      return;
    }

    const rollback = new Error("ECONOMY_READ_ONLY_COMPLETE");
    let report: object | undefined;
    await client.begin("isolation level repeatable read read only", async (tx) => {
      const [readOnly] = await tx<{ value: string }[]>`select current_setting('transaction_read_only') as value`;
      if (readOnly.value !== "on") throw new Error("Transaksi bukan READ ONLY");
      const before = await readEconomySnapshot(tx);
      const plan = planEconomyImport(validated.data, before.data);
      const promotion = planEconomyPromotion(validated.data, before.data);
      const after = await readEconomySnapshot(tx);
      const issues = [...before.issues, ...plan.issues, ...promotion.issues];
      if (fingerprint(before.data) !== fingerprint(after.data)) issues.push("Fingerprint database berubah di transaksi read-only");
      if (mode === "verify" && (plan.inserts.length || plan.corrections.length)) issues.push("Dataset Economy belum selesai diimpor/dikoreksi");
      report = {
        mode,
        transaction: "READ ONLY / ROLLBACK",
        writes: 0,
        fingerprintBefore: fingerprint(before.data),
        fingerprintAfter: fingerprint(after.data),
        protectedPublishedFingerprint: economyPublishedFingerprint(before.data),
        proposedInserts: plan.inserts.reduce<Record<string, number>>((counts, entry) => ({ ...counts, [entry.table]: (counts[entry.table] ?? 0) + 1 }), {}),
        proposedInsertRecords: plan.inserts.map((entry) => ({
          table: entry.table,
          key: entry.table === "sources"
            ? entry.row.slug
            : entry.table === "economic_gdp_sources"
              ? `${entry.row.economic_gdp_id}:${entry.row.source_id}`
              : entry.row.id,
        })),
        proposedCorrections: { smelterSources: plan.corrections.length },
        proposedCorrectionRecords: plan.corrections.map((entry) => ({
          facilityCode: entry.facilityCode,
          fromSourceSlug: entry.expectedSourceSlug,
          toSourceSlug: entry.canonicalSourceSlug,
        })),
        promotionTargets: { investments: promotion.investmentIds.length, exports: promotion.exportIds.length, smelters: promotion.smelterIds.length },
        unchanged: plan.unchanged,
        hold: plan.hold,
        issues,
      };
      if (issues.length) process.exitCode = 1;
      throw rollback;
    }).catch((error: unknown) => { if (error !== rollback) throw error; });
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await client.end({ timeout: 5 });
  }
}

export async function runEconomyPromotionCli() {
  const manifestPath = process.argv[2];
  if (!manifestPath) throw new Error("Berikan lokasi manifest Economy");
  const commit = process.argv.includes("--commit");
  const validated = await loadEconomyImport(manifestPath);
  if (!validated.success) {
    printValidationIssues(validated);
    process.exitCode = 1;
    return;
  }
  config({ path: ".env.local", quiet: true });
  const url = commit ? process.env.DATABASE_MIGRATION_URL : process.env.DATABASE_URL;
  if (!url) throw new Error("Konfigurasi koneksi Economy belum tersedia");
  const client = postgres(url, { ssl: "require", max: 1, prepare: false, connect_timeout: 15 });
  try {
    if (commit) {
      const result = await promoteEconomy(validated.data, {
        transaction: (work) => client.begin("isolation level serializable", async (tx) => work({
          snapshot: async () => {
            const snapshot = await readEconomySnapshot(tx);
            if (snapshot.issues.length) throw new Error("Schema Economy belum memenuhi prasyarat");
            return snapshot.data;
          },
          promote: async (plan: EconomyPromotionPlan) => {
            const update = async (table: "mining_investment_annual" | "smelter_facilities", ids: string[]) => {
              if (!ids.length) return;
              await tx`update ${tx(table)} set publication_status = 'published', updated_at = now() where id = any(${tx.array(ids)}::uuid[]) and verification_status = 'verified' and publication_status = 'draft'`;
            };
            await update("mining_investment_annual", plan.investmentIds);
            await update("smelter_facilities", plan.smelterIds);
          },
        })),
      }, true);
      console.log(JSON.stringify({ mode: "promotion", transaction: "SERIALIZABLE / COMMIT", ...result }, null, 2));
      return;
    }
    const rollback = new Error("ECONOMY_PROMOTION_DRY_RUN_COMPLETE");
    let report: object | undefined;
    await client.begin("isolation level repeatable read read only", async (tx) => {
      const before = await readEconomySnapshot(tx);
      const plan = planEconomyPromotion(validated.data, before.data);
      const after = await readEconomySnapshot(tx);
      const issues = [...before.issues, ...plan.issues];
      if (fingerprint(before.data) !== fingerprint(after.data)) issues.push("Fingerprint database berubah di promotion dry-run");
      report = { mode: "promotion-dry-run", transaction: "READ ONLY / ROLLBACK", writes: 0, fingerprintBefore: fingerprint(before.data), fingerprintAfter: fingerprint(after.data), targets: { investments: plan.investmentIds.length, exports: plan.exportIds.length, smelters: plan.smelterIds.length }, issues };
      if (issues.length) process.exitCode = 1;
      throw rollback;
    }).catch((error: unknown) => { if (error !== rollback) throw error; });
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await client.end({ timeout: 5 });
  }
}

export function economyCli(mode: Mode) {
  if (mode === "import" && !process.argv.includes("--commit")) {
    console.error("Tanpa --commit: importer berhenti sebelum koneksi/transaksi. Writes = 0.");
    process.exitCode = 1;
    return;
  }
  runEconomyCli(mode).catch(() => {
    console.error(`Economy ${mode} gagal secara aman; transaksi dibatalkan dan detail koneksi tidak ditampilkan.`);
    process.exitCode = 1;
  });
}

export function economyPromotionCli() {
  runEconomyPromotionCli().catch(() => {
    console.error("Promotion Economy gagal secara aman; transaksi dibatalkan dan detail koneksi tidak ditampilkan.");
    process.exitCode = 1;
  });
}
