import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_MIGRATION_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_MIGRATION_URL tidak ditemukan di .env.local.");
}

const sqlClient = postgres(databaseUrl, {
  ssl: "require",
  max: 1,
  prepare: false,
});

type SummaryRow = {
  source_count: number;
  production_count: number;
  reported_production_count: number;
  not_normalized_count: number;
  not_reported_count: number;
  financial_count: number;
  usd_financial_count: number;
  idr_financial_count: number;
  site_count: number;
  draft_site_count: number;
  published_site_count: number;
};

type InvalidRow = { invalid_count: number };
type ValueRow = { value: string | null };

function assertCondition(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function singleInvalidCount(query: Promise<InvalidRow[]>) {
  return (await query)[0]?.invalid_count ?? -1;
}

async function main() {
  console.log("Memverifikasi fondasi data perusahaan Industri...");

  const summary = (await sqlClient<SummaryRow[]>`
    select
      (select count(*)::integer from public.sources where slug like 'industry-%-reports') as source_count,
      (select count(*)::integer from public.industry_company_production) as production_count,
      (select count(*)::integer from public.industry_company_production where data_availability = 'reported') as reported_production_count,
      (select count(*)::integer from public.industry_company_production where data_availability = 'not_normalized') as not_normalized_count,
      (select count(*)::integer from public.industry_company_production where data_availability = 'not_reported') as not_reported_count,
      (select count(*)::integer from public.industry_company_financials) as financial_count,
      (select count(*)::integer from public.industry_company_financials where currency_code = 'USD') as usd_financial_count,
      (select count(*)::integer from public.industry_company_financials where currency_code = 'IDR') as idr_financial_count,
      (select count(*)::integer from public.industry_operation_sites) as site_count,
      (select count(*)::integer from public.industry_operation_sites where publication_status = 'draft' and verification_status = 'pending') as draft_site_count,
      (select count(*)::integer from public.industry_operation_sites where publication_status = 'published') as published_site_count
  `)[0];

  assertCondition(Boolean(summary), "Ringkasan data tidak tersedia.");
  assertCondition(summary.source_count === 12, `Sumber harus 12, ditemukan ${summary.source_count}.`);
  assertCondition(summary.production_count === 75, `Produksi harus 75, ditemukan ${summary.production_count}.`);
  assertCondition(summary.reported_production_count === 69, `Produksi reported harus 69, ditemukan ${summary.reported_production_count}.`);
  assertCondition(summary.not_normalized_count === 4, `Produksi not_normalized harus 4, ditemukan ${summary.not_normalized_count}.`);
  assertCondition(summary.not_reported_count === 2, `Produksi not_reported harus 2, ditemukan ${summary.not_reported_count}.`);
  assertCondition(summary.financial_count === 108, `Keuangan harus 108, ditemukan ${summary.financial_count}.`);
  assertCondition(summary.usd_financial_count === 72, `Keuangan USD harus 72, ditemukan ${summary.usd_financial_count}.`);
  assertCondition(summary.idr_financial_count === 36, `Keuangan IDR harus 36, ditemukan ${summary.idr_financial_count}.`);
  assertCondition(summary.site_count === 39, `Lokasi harus 39, ditemukan ${summary.site_count}.`);
  assertCondition(summary.draft_site_count === 39, `Lokasi draft/pending harus 39, ditemukan ${summary.draft_site_count}.`);
  assertCondition(summary.published_site_count === 0, `Belum boleh ada lokasi published, ditemukan ${summary.published_site_count}.`);

  console.log(`[OK] sumber: ${summary.source_count}`);
  console.log(`[OK] produksi: ${summary.production_count} (${summary.reported_production_count} reported, ${summary.not_normalized_count} not_normalized, ${summary.not_reported_count} not_reported)`);
  console.log(`[OK] keuangan: ${summary.financial_count} (${summary.usd_financial_count} USD, ${summary.idr_financial_count} IDR)`);
  console.log(`[OK] lokasi operasi: ${summary.site_count} draft/pending; belum ada marker publik`);

  const invalidProduction = await singleInvalidCount(sqlClient<InvalidRow[]>`
    select count(*)::integer as invalid_count
    from public.industry_company_production
    where
      (data_availability = 'reported' and (
        production_value is null
        or unit_code is null
        or reported_value is null
        or value_scale is null
        or production_value <> reported_value * value_scale
        or verification_status <> 'verified'
        or publication_status <> 'published'
      ))
      or
      (data_availability <> 'reported' and (
        production_value is not null
        or unit_code is not null
        or reported_value is not null
        or value_scale is not null
        or verification_status <> 'pending'
        or publication_status <> 'draft'
      ))
  `);
  assertCondition(invalidProduction === 0, `Ditemukan ${invalidProduction} produksi dengan normalisasi/status tidak valid.`);

  const invalidFinancials = await singleInvalidCount(sqlClient<InvalidRow[]>`
    select count(*)::integer as invalid_count
    from public.industry_company_financials
    where
      amount <> reported_value * value_scale
      or currency_code not in ('USD', 'IDR')
      or verification_status <> 'verified'
      or publication_status <> 'published'
      or audit_status <> 'audited'
  `);
  assertCondition(invalidFinancials === 0, `Ditemukan ${invalidFinancials} keuangan dengan normalisasi/status tidak valid.`);

  const invalidCompanyYearFinancials = await singleInvalidCount(sqlClient<InvalidRow[]>`
    select count(*)::integer as invalid_count
    from (
      select company_id, year
      from public.industry_company_financials
      group by company_id, year
      having count(*) <> 3
    ) as invalid_groups
  `);
  assertCondition(invalidCompanyYearFinancials === 0, `Ditemukan ${invalidCompanyYearFinancials} pasangan perusahaan-tahun tanpa tiga metrik keuangan.`);

  const invalidSites = await singleInvalidCount(sqlClient<InvalidRow[]>`
    select count(*)::integer as invalid_count
    from public.industry_operation_sites
    where
      latitude is not null
      or longitude is not null
      or coordinate_precision is not null
      or verification_status <> 'pending'
      or publication_status <> 'draft'
  `);
  assertCondition(invalidSites === 0, `Ditemukan ${invalidSites} lokasi yang terpublikasi atau memakai koordinat belum terverifikasi.`);

  const timahLoss = (await sqlClient<ValueRow[]>`
    select financial.amount::text as value
    from public.industry_company_financials as financial
    inner join public.industry_companies as company on company.id = financial.company_id
    where company.slug = 'timah' and financial.year = 2023 and financial.metric = 'profit_for_year'
  `)[0]?.value;
  assertCondition(Number(timahLoss) === -449_670_000_000, `Rugi TIMAH 2023 tidak sesuai: ${timahLoss}.`);

  const harumCoal = await singleInvalidCount(sqlClient<InvalidRow[]>`
    select count(*)::integer as invalid_count
    from public.industry_company_production as production
    inner join public.industry_companies as company on company.id = production.company_id
    where company.slug = 'harum-energy'
      and production.metric_code = 'coal_production'
      and (
        production.value_scale <> 1
        or production.unit_code <> 'metric_ton'
        or production.reported_unit_label <> 'ton'
      )
  `);
  assertCondition(harumCoal === 0, "Seri batubara Harum belum dinormalisasi sebagai ton penuh.");

  const freeportEarnings = await singleInvalidCount(sqlClient<InvalidRow[]>`
    select count(*)::integer as invalid_count
    from public.industry_company_financials as financial
    inner join public.industry_companies as company on company.id = financial.company_id
    where company.slug = 'freeport-indonesia'
      and financial.metric in ('net_income', 'profit_for_year')
  `);
  assertCondition(freeportEarnings === 0, "Laba operasi Freeport tidak boleh dilabeli laba bersih/tahun berjalan.");

  console.log("[OK] normalisasi nilai produksi dan keuangan konsisten");
  console.log("[OK] koreksi Harum, TIMAH, Freeport, dan data kosong Harita terkunci");
  console.log("[OK] RLS situs tidak dapat menampilkan marker sebelum koordinat verified/published");
  console.log("\nFondasi data perusahaan Industri berhasil diverifikasi.");
}

main().catch((error: unknown) => {
  console.error("\nVerifikasi fondasi data Industri gagal:", error);
  process.exitCode = 1;
}).finally(async () => {
  await sqlClient.end();
});
