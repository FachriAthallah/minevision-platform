import { config } from "dotenv";
import postgres from "postgres";

config({
  path: ".env.local",
});

const BUCKET_NAME = "industry-reports";
const EXPECTED_COMPANY_COUNT = 12;
const EXPECTED_REPORT_COUNT = 35;

const EXPECTED_REPORTS_PER_COMPANY = new Map<string, number>([
  ["alamtri-resources", 3],
  ["amman-mineral", 3],
  ["antam", 3],
  ["bayan-resources", 3],
  ["bukit-asam", 3],
  ["bumi-resources", 3],
  ["freeport-indonesia", 2],
  ["harum-energy", 3],
  ["merdeka-copper-gold", 3],
  ["timah", 3],
  ["trimegah-bangun-persada", 3],
  ["vale-indonesia", 3],
]);

const databaseUrl = process.env.DATABASE_MIGRATION_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_MIGRATION_URL tidak ditemukan di .env.local.");
}

const sqlClient = postgres(databaseUrl, {
  ssl: "require",
  max: 1,
  prepare: false,
});

type CountRow = {
  company_count: number;
  report_count: number;
  storage_object_count: number;
};

type SingleCountRow = {
  invalid_count: number;
};

type CompanyReportCountRow = {
  slug: string;
  report_count: number;
};

type ReportYearRow = {
  slug: string;
  report_year: number;
};

function assertCondition(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  console.log("Memverifikasi data Industri MineVision...");

  const countRows = await sqlClient<CountRow[]>`
    select
      (select count(*)::integer from public.industry_companies) as company_count,
      (select count(*)::integer from public.industry_reports) as report_count,
      (
        select count(*)::integer
        from storage.objects
        where bucket_id = ${BUCKET_NAME}
      ) as storage_object_count
  `;

  const counts = countRows[0];

  if (!counts) {
    throw new Error("Hasil pemeriksaan jumlah data tidak tersedia.");
  }

  assertCondition(
    counts.company_count === EXPECTED_COMPANY_COUNT,
    `industry_companies harus ${EXPECTED_COMPANY_COUNT} record, ditemukan ${counts.company_count}.`,
  );

  assertCondition(
    counts.report_count === EXPECTED_REPORT_COUNT,
    `industry_reports harus ${EXPECTED_REPORT_COUNT} record, ditemukan ${counts.report_count}.`,
  );

  assertCondition(
    counts.storage_object_count === EXPECTED_REPORT_COUNT,
    `Storage harus ${EXPECTED_REPORT_COUNT} objek, ditemukan ${counts.storage_object_count}.`,
  );

  console.log(`[OK] industry_companies: ${counts.company_count} record`);
  console.log(`[OK] industry_reports: ${counts.report_count} record`);
  console.log(
    `[OK] Storage ${BUCKET_NAME}: ${counts.storage_object_count} objek`,
  );

  const invalidCompanyRows = await sqlClient<SingleCountRow[]>`
    select count(*)::integer as invalid_count
    from public.industry_companies
    where
      is_active is not true
      or verification_status <> 'verified'
      or publication_status <> 'published'
      or logo_path not like '/images/industry/logos/%'
  `;

  const invalidCompanyCount = invalidCompanyRows[0]?.invalid_count ?? -1;

  assertCondition(
    invalidCompanyCount === 0,
    `Ditemukan ${invalidCompanyCount} perusahaan dengan status atau logo tidak valid.`,
  );

  console.log(
    "[OK] Seluruh perusahaan aktif, verified, published, dan memiliki logo",
  );

  const invalidReportRows = await sqlClient<SingleCountRow[]>`
    select count(*)::integer as invalid_count
    from public.industry_reports
    where
      report_year not between 2023 and 2025
      or mime_type <> 'application/pdf'
      or file_size_bytes <= 0
      or verification_status <> 'verified'
      or publication_status <> 'published'
  `;

  const invalidReportCount = invalidReportRows[0]?.invalid_count ?? -1;

  assertCondition(
    invalidReportCount === 0,
    `Ditemukan ${invalidReportCount} laporan dengan metadata atau status tidak valid.`,
  );

  console.log(
    "[OK] Seluruh laporan memiliki metadata dan status publik yang valid",
  );

  const duplicateStoragePathRows = await sqlClient<SingleCountRow[]>`
    select count(*)::integer as invalid_count
    from (
      select storage_path
      from public.industry_reports
      group by storage_path
      having count(*) > 1
    ) as duplicates
  `;

  const duplicateStoragePathCount =
    duplicateStoragePathRows[0]?.invalid_count ?? -1;

  assertCondition(
    duplicateStoragePathCount === 0,
    `Ditemukan ${duplicateStoragePathCount} storage_path duplikat.`,
  );

  console.log("[OK] Tidak ada storage_path duplikat");

  const storageMismatchRows = await sqlClient<SingleCountRow[]>`
    select count(*)::integer as invalid_count
    from public.industry_reports as report
    left join storage.objects as object
      on object.bucket_id = ${BUCKET_NAME}
      and object.name = report.storage_path
    where
      object.id is null
      or object.metadata ->> 'size' is null
      or (object.metadata ->> 'size')::bigint <> report.file_size_bytes
  `;

  const storageMismatchCount = storageMismatchRows[0]?.invalid_count ?? -1;

  assertCondition(
    storageMismatchCount === 0,
    `Ditemukan ${storageMismatchCount} laporan tanpa objek Storage atau ukuran tidak cocok.`,
  );

  const unregisteredStorageRows = await sqlClient<SingleCountRow[]>`
    select count(*)::integer as invalid_count
    from storage.objects as object
    left join public.industry_reports as report
      on report.storage_path = object.name
    where
      object.bucket_id = ${BUCKET_NAME}
      and report.id is null
  `;

  const unregisteredStorageCount =
    unregisteredStorageRows[0]?.invalid_count ?? -1;

  assertCondition(
    unregisteredStorageCount === 0,
    `Ditemukan ${unregisteredStorageCount} objek Storage tanpa metadata laporan.`,
  );

  console.log("[OK] Seluruh metadata laporan cocok dengan objek Storage");

  const companyReportCounts = await sqlClient<CompanyReportCountRow[]>`
    select
      company.slug,
      count(report.id)::integer as report_count
    from public.industry_companies as company
    left join public.industry_reports as report
      on report.company_id = company.id
    group by company.id, company.slug
    order by company.slug
  `;

  for (const company of companyReportCounts) {
    const expectedCount = EXPECTED_REPORTS_PER_COMPANY.get(company.slug);

    assertCondition(
      expectedCount !== undefined,
      `Slug perusahaan tidak diharapkan: ${company.slug}.`,
    );

    assertCondition(
      company.report_count === expectedCount,
      `${company.slug} harus memiliki ${expectedCount} laporan, ditemukan ${company.report_count}.`,
    );
  }

  assertCondition(
    companyReportCounts.length === EXPECTED_REPORTS_PER_COMPANY.size,
    "Jumlah perusahaan pada distribusi laporan tidak sesuai.",
  );

  console.log("[OK] Distribusi laporan per perusahaan sesuai");

  const reportYears = await sqlClient<ReportYearRow[]>`
    select
      company.slug,
      report.report_year
    from public.industry_reports as report
    inner join public.industry_companies as company
      on company.id = report.company_id
    order by company.slug, report.report_year
  `;

  const yearsByCompany = new Map<string, number[]>();

  for (const report of reportYears) {
    const years = yearsByCompany.get(report.slug) ?? [];
    years.push(report.report_year);
    yearsByCompany.set(report.slug, years);
  }

  for (const [slug, years] of yearsByCompany) {
    const expectedYears =
      slug === "freeport-indonesia" ? [2024, 2025] : [2023, 2024, 2025];

    assertCondition(
      JSON.stringify(years) === JSON.stringify(expectedYears),
      `Rentang tahun ${slug} tidak sesuai: ${years.join(", ")}.`,
    );
  }

  console.log(
    "[OK] Tahun laporan 2023-2025 sesuai, termasuk pengecualian Freeport",
  );
  console.log("");
  console.log("Data Industri MineVision berhasil diverifikasi.");
}

main()
  .catch((error: unknown) => {
    console.error("");
    console.error("Verifikasi data Industri gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sqlClient.end();
  });
