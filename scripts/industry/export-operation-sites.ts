import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_MIGRATION_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_MIGRATION_URL tidak ditemukan di .env.local.",
  );
}

const outputPath = resolve(
  "data",
  "staging",
  "industry",
  "operation-sites.json",
);

type OperationSiteRow = {
  company_slug: string;
  name: string;
  slug: string;
  operator_name: string;
  site_type: string;
  current_status: string;
  status_label: string;
  commodity_slugs: string[];
  province_name: string;
  regency_name: string | null;
  location_description: string;
  latitude: string | null;
  longitude: string | null;
  coordinate_precision: string | null;
  display_order: number;
  is_active: boolean;
  source_slug: string;
  source_report_year: number;
  source_url: string;
  page_reference: string | null;
  verification_status: string;
  publication_status: string;
  notes: string | null;
};

const sqlClient = postgres(databaseUrl, {
  ssl: "require",
  max: 1,
  prepare: false,
});

function assertCondition(
  condition: boolean,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  console.log("Mengekspor lokasi operasi dari database development...");

  const rows = await sqlClient<OperationSiteRow[]>`
    select
      company.slug as company_slug,
      site.name,
      site.slug,
      site.operator_name,
      site.site_type::text as site_type,
      site.current_status::text as current_status,
      site.status_label,
      site.commodity_slugs,
      site.province_name,
      site.regency_name,
      site.location_description,
      site.latitude::text,
      site.longitude::text,
      site.coordinate_precision::text,
      site.display_order,
      site.is_active,
      source.slug as source_slug,
      coalesce(report.report_year, 2025)::integer
        as source_report_year,
      site.source_url,
      site.page_reference,
      site.verification_status::text
        as verification_status,
      site.publication_status::text
        as publication_status,
      site.notes
    from public.industry_operation_sites as site
    inner join public.industry_companies as company
      on company.id = site.company_id
    inner join public.sources as source
      on source.id = site.source_id
    left join public.industry_reports as report
      on report.id = site.source_report_id
    order by
      company.display_order,
      site.display_order,
      site.name
  `;

  const coordinateCount = rows.filter(
    (row) =>
      row.latitude !== null &&
      row.longitude !== null &&
      row.coordinate_precision !== null,
  ).length;

  const publishedCount = rows.filter(
    (row) =>
      row.verification_status === "verified" &&
      row.publication_status === "published",
  ).length;

  const pendingDraftCount = rows.filter(
    (row) =>
      row.verification_status === "pending" &&
      row.publication_status === "draft",
  ).length;

  assertCondition(
    rows.length === 47,
    `Lokasi harus 47, ditemukan ${rows.length}.`,
  );

  assertCondition(
    coordinateCount === 46,
    `Lokasi berkoordinat harus 46, ditemukan ${coordinateCount}.`,
  );

  assertCondition(
    publishedCount === 46,
    `Lokasi published harus 46, ditemukan ${publishedCount}.`,
  );

  assertCondition(
    pendingDraftCount === 1,
    `Lokasi pending/draft harus 1, ditemukan ${pendingDraftCount}.`,
  );

  const operationSites = rows.map((row) => ({
    companySlug: row.company_slug,
    name: row.name,
    slug: row.slug,
    operatorName: row.operator_name,
    siteType: row.site_type,
    currentStatus: row.current_status,
    statusLabel: row.status_label,
    commoditySlugs: row.commodity_slugs,
    provinceName: row.province_name,
    regencyName: row.regency_name,
    locationDescription: row.location_description,
    latitude: row.latitude,
    longitude: row.longitude,
    coordinatePrecision: row.coordinate_precision,
    displayOrder: row.display_order,
    isActive: row.is_active,
    sourceSlug: row.source_slug,
    sourceReportYear: row.source_report_year,
    sourceUrl: row.source_url,
    pageReference: row.page_reference,
    verificationStatus: row.verification_status,
    publicationStatus: row.publication_status,
    notes: row.notes,
  }));

  await mkdir(resolve("data", "staging", "industry"), {
    recursive: true,
  });

  await writeFile(
    outputPath,
    `${JSON.stringify(operationSites, null, 2)}\n`,
    "utf8",
  );

  console.log(`File berhasil dibuat: ${outputPath}`);
  console.log(`Total lokasi       : ${rows.length}`);
  console.log(`Memiliki koordinat : ${coordinateCount}`);
  console.log(`Published          : ${publishedCount}`);
  console.log(`Pending/draft      : ${pendingDraftCount}`);
}

main()
  .catch((error: unknown) => {
    console.error("\nEkspor lokasi gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sqlClient.end();
  });