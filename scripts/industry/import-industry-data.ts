import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { config } from "dotenv";
import postgres from "postgres";
import { z } from "zod";

import { industryCompanies, industryReports } from "../../src/db/schema";

config({
  path: ".env.local",
});

const BUCKET_NAME = "industry-reports";
const EXPECTED_COMPANY_COUNT = 12;
const EXPECTED_REPORT_COUNT = 35;
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

const COMPANIES_PATH = resolve("data", "staging", "industry", "companies.json");

const REPORTS_PATH = resolve("data", "staging", "industry", "reports.json");

const databaseUrl = process.env.DATABASE_MIGRATION_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_MIGRATION_URL tidak ditemukan di .env.local.");
}

const sqlClient = postgres(databaseUrl, {
  ssl: "require",
  max: 1,
  prepare: false,
});

const database = drizzle(sqlClient);

const companySchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().min(1).nullable(),
  companyType: z.string().min(1).max(160).nullable(),
  businessField: z.string().min(1).nullable(),
  headquartersAddress: z.string().min(1).nullable(),
  establishedYear: z.number().int().min(1800).max(2100).nullable(),
  operationAreaDescription: z.string().min(1).nullable(),
  officialWebsiteUrl: z.string().url().nullable(),
  logoPath: z.string().regex(/^\/images\/industry\/logos\/[a-z0-9_-]+\.png$/),
  displayOrder: z.number().int().nonnegative(),
  isActive: z.boolean(),
  verificationStatus: z.enum(["pending", "verified", "rejected"]),
  publicationStatus: z.enum(["draft", "in_review", "published", "archived"]),
  notes: z.string().min(1).nullable(),
});

const companiesManifestSchema = z.object({
  schemaVersion: z.literal(1),
  companyCount: z.number().int().positive(),
  companies: z.array(companySchema),
});

const reportSchema = z.object({
  companySlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  reportYear: z.number().int().min(2023).max(2025),
  reportType: z.enum(["annual_report", "sustainability_report"]),
  title: z.string().min(1).max(240),
  localRelativePath: z.string().min(1),
  storagePath: z.string().min(1),
  fileName: z.string().min(1).max(255),
  mimeType: z.literal("application/pdf"),
  fileSizeBytes: z.number().int().positive().max(MAX_FILE_SIZE_BYTES),
  sourceUrl: z.string().url().nullable(),
  verificationStatus: z.enum(["pending", "verified", "rejected"]),
  publicationStatus: z.enum(["draft", "in_review", "published", "archived"]),
});

const reportsManifestSchema = z.object({
  schemaVersion: z.literal(1),
  reportCount: z.number().int().positive(),
  companyCount: z.number().int().positive(),
  totalSizeBytes: z.number().int().positive(),
  reports: z.array(reportSchema),
});

type CompanyInput = z.infer<typeof companySchema>;
type ReportInput = z.infer<typeof reportSchema>;

type EntitySummary = {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
};

type StorageObjectRow = {
  name: string;
  file_size_bytes: number | null;
};

function normalizeNullable<T>(value: T | null | undefined) {
  return value ?? null;
}

async function readJsonFile(filePath: string) {
  const fileContent = await readFile(filePath, "utf8");

  try {
    return JSON.parse(fileContent) as unknown;
  } catch {
    throw new Error(`File bukan JSON yang valid: ${filePath}`);
  }
}

async function validateLogoFiles(companies: CompanyInput[]) {
  for (const company of companies) {
    const logoFilePath = resolve(
      "public",
      company.logoPath.replace(/^\/+/, ""),
    );

    const fileInformation = await stat(logoFilePath);

    if (!fileInformation.isFile()) {
      throw new Error(`Logo bukan file: ${logoFilePath}`);
    }
  }
}

function validateManifestRelationships(
  companies: CompanyInput[],
  reports: ReportInput[],
) {
  if (companies.length !== EXPECTED_COMPANY_COUNT) {
    throw new Error(
      `Jumlah perusahaan harus ${EXPECTED_COMPANY_COUNT}, ditemukan ${companies.length}.`,
    );
  }

  if (reports.length !== EXPECTED_REPORT_COUNT) {
    throw new Error(
      `Jumlah laporan harus ${EXPECTED_REPORT_COUNT}, ditemukan ${reports.length}.`,
    );
  }

  const companySlugs = new Set<string>();
  const displayOrders = new Set<number>();

  for (const company of companies) {
    if (companySlugs.has(company.slug)) {
      throw new Error(`Slug perusahaan duplikat: ${company.slug}`);
    }

    if (displayOrders.has(company.displayOrder)) {
      throw new Error(
        `displayOrder perusahaan duplikat: ${company.displayOrder}`,
      );
    }

    companySlugs.add(company.slug);
    displayOrders.add(company.displayOrder);
  }

  const reportKeys = new Set<string>();
  const storagePaths = new Set<string>();

  for (const report of reports) {
    if (!companySlugs.has(report.companySlug)) {
      throw new Error(
        `Perusahaan laporan tidak tersedia: ${report.companySlug}`,
      );
    }

    const reportKey = [
      report.companySlug,
      report.reportYear,
      report.reportType,
    ].join(":");

    if (reportKeys.has(reportKey)) {
      throw new Error(`Record laporan duplikat: ${reportKey}`);
    }

    if (storagePaths.has(report.storagePath)) {
      throw new Error(`storagePath laporan duplikat: ${report.storagePath}`);
    }

    if (!report.storagePath.endsWith(`/${report.fileName}`)) {
      throw new Error(
        `fileName tidak cocok dengan storagePath: ${report.storagePath}`,
      );
    }

    reportKeys.add(reportKey);
    storagePaths.add(report.storagePath);
  }

  const reportCompanyCount = new Set(
    reports.map((report) => report.companySlug),
  ).size;

  if (reportCompanyCount !== EXPECTED_COMPANY_COUNT) {
    throw new Error(
      `Laporan harus mencakup ${EXPECTED_COMPANY_COUNT} perusahaan, ditemukan ${reportCompanyCount}.`,
    );
  }
}

async function validateStorageObjects(reports: ReportInput[]) {
  const storageRows = await sqlClient<StorageObjectRow[]>`
    select
      name,
      case
        when metadata ->> 'size' ~ '^[0-9]+$'
          then (metadata ->> 'size')::integer
        else null
      end as file_size_bytes
    from storage.objects
    where bucket_id = ${BUCKET_NAME}
    order by name
  `;

  if (storageRows.length !== EXPECTED_REPORT_COUNT) {
    throw new Error(
      `Storage harus memiliki ${EXPECTED_REPORT_COUNT} objek, ditemukan ${storageRows.length}.`,
    );
  }

  const storageByPath = new Map(
    storageRows.map((storageObject) => [storageObject.name, storageObject]),
  );

  const manifestPaths = new Set(reports.map((report) => report.storagePath));

  for (const report of reports) {
    const storageObject = storageByPath.get(report.storagePath);

    if (!storageObject) {
      throw new Error(`Objek Storage tidak ditemukan: ${report.storagePath}`);
    }

    if (storageObject.file_size_bytes !== report.fileSizeBytes) {
      throw new Error(
        [
          `Ukuran objek Storage tidak cocok: ${report.storagePath}`,
          `Manifest: ${report.fileSizeBytes} byte`,
          `Storage: ${storageObject.file_size_bytes ?? "tidak diketahui"} byte`,
        ].join("\n"),
      );
    }
  }

  for (const storageObject of storageRows) {
    if (!manifestPaths.has(storageObject.name)) {
      throw new Error(
        `Objek Storage tidak tercantum dalam manifest: ${storageObject.name}`,
      );
    }
  }
}

function companyDataMatches(
  existingCompany: typeof industryCompanies.$inferSelect,
  company: CompanyInput,
) {
  return (
    existingCompany.name === company.name &&
    normalizeNullable(existingCompany.description) === company.description &&
    normalizeNullable(existingCompany.companyType) === company.companyType &&
    normalizeNullable(existingCompany.businessField) ===
      company.businessField &&
    normalizeNullable(existingCompany.headquartersAddress) ===
      company.headquartersAddress &&
    normalizeNullable(existingCompany.establishedYear) ===
      company.establishedYear &&
    normalizeNullable(existingCompany.operationAreaDescription) ===
      company.operationAreaDescription &&
    normalizeNullable(existingCompany.officialWebsiteUrl) ===
      company.officialWebsiteUrl &&
    existingCompany.logoPath === company.logoPath &&
    existingCompany.displayOrder === company.displayOrder &&
    existingCompany.isActive === company.isActive &&
    existingCompany.verificationStatus === company.verificationStatus &&
    existingCompany.publicationStatus === company.publicationStatus &&
    normalizeNullable(existingCompany.notes) === company.notes
  );
}

function reportDataMatches(
  existingReport: typeof industryReports.$inferSelect,
  report: ReportInput,
) {
  return (
    existingReport.reportYear === report.reportYear &&
    existingReport.reportType === report.reportType &&
    existingReport.title === report.title &&
    existingReport.storagePath === report.storagePath &&
    existingReport.fileName === report.fileName &&
    existingReport.mimeType === report.mimeType &&
    existingReport.fileSizeBytes === report.fileSizeBytes &&
    normalizeNullable(existingReport.sourceUrl) === report.sourceUrl &&
    existingReport.verificationStatus === report.verificationStatus &&
    existingReport.publicationStatus === report.publicationStatus
  );
}

async function main() {
  const commitEnabled = process.argv.includes("--commit");

  console.log("Memvalidasi staging data Industri...");
  console.log(`Companies: ${COMPANIES_PATH}`);
  console.log(`Reports  : ${REPORTS_PATH}`);

  const rawCompanies = await readJsonFile(COMPANIES_PATH);
  const rawReports = await readJsonFile(REPORTS_PATH);

  const companiesManifest = companiesManifestSchema.parse(rawCompanies);
  const reportsManifest = reportsManifestSchema.parse(rawReports);

  if (companiesManifest.companyCount !== companiesManifest.companies.length) {
    throw new Error(
      "companyCount pada companies.json tidak sama dengan jumlah record.",
    );
  }

  if (reportsManifest.reportCount !== reportsManifest.reports.length) {
    throw new Error(
      "reportCount pada reports.json tidak sama dengan jumlah record.",
    );
  }

  if (reportsManifest.companyCount !== companiesManifest.companyCount) {
    throw new Error(
      "companyCount pada reports.json dan companies.json tidak sama.",
    );
  }

  const calculatedTotalSize = reportsManifest.reports.reduce(
    (total, report) => total + report.fileSizeBytes,
    0,
  );

  if (calculatedTotalSize !== reportsManifest.totalSizeBytes) {
    throw new Error(
      `totalSizeBytes tidak cocok: ${calculatedTotalSize} != ${reportsManifest.totalSizeBytes}.`,
    );
  }

  validateManifestRelationships(
    companiesManifest.companies,
    reportsManifest.reports,
  );

  await validateLogoFiles(companiesManifest.companies);
  await validateStorageObjects(reportsManifest.reports);

  console.log(
    `[OK] ${companiesManifest.companyCount} perusahaan, ${reportsManifest.reportCount} laporan, logo, dan objek Storage valid.`,
  );

  if (!commitEnabled) {
    console.log("");
    console.log("DRY-RUN selesai. Database belum diubah.");
    console.log("Jalankan kembali dengan --commit untuk mengimpor data.");
    return;
  }

  const companySummary: EntitySummary = {
    total: companiesManifest.companies.length,
    inserted: 0,
    updated: 0,
    skipped: 0,
  };

  const reportSummary: EntitySummary = {
    total: reportsManifest.reports.length,
    inserted: 0,
    updated: 0,
    skipped: 0,
  };

  await database.transaction(async (transaction) => {
    for (const company of companiesManifest.companies) {
      const existingRows = await transaction
        .select()
        .from(industryCompanies)
        .where(eq(industryCompanies.slug, company.slug))
        .limit(1);

      const existingCompany = existingRows[0];

      if (!existingCompany) {
        await transaction.insert(industryCompanies).values(company);
        companySummary.inserted += 1;
        continue;
      }

      if (companyDataMatches(existingCompany, company)) {
        companySummary.skipped += 1;
        continue;
      }

      if (existingCompany.publicationStatus !== "draft") {
        throw new Error(
          `Perusahaan ${company.slug} berstatus ${existingCompany.publicationStatus} dan tidak boleh ditimpa importer.`,
        );
      }

      await transaction
        .update(industryCompanies)
        .set({
          ...company,
          updatedAt: new Date(),
        })
        .where(eq(industryCompanies.id, existingCompany.id));

      companySummary.updated += 1;
    }

    const companyRows = await transaction
      .select({
        id: industryCompanies.id,
        slug: industryCompanies.slug,
      })
      .from(industryCompanies);

    const companyBySlug = new Map(
      companyRows.map((company) => [company.slug, company]),
    );

    for (const report of reportsManifest.reports) {
      const company = companyBySlug.get(report.companySlug);

      if (!company) {
        throw new Error(`Perusahaan tidak ditemukan: ${report.companySlug}`);
      }

      const existingRows = await transaction
        .select()
        .from(industryReports)
        .where(
          and(
            eq(industryReports.companyId, company.id),
            eq(industryReports.reportYear, report.reportYear),
            eq(industryReports.reportType, report.reportType),
          ),
        )
        .limit(1);

      const existingReport = existingRows[0];

      if (!existingReport) {
        await transaction.insert(industryReports).values({
          companyId: company.id,
          reportYear: report.reportYear,
          reportType: report.reportType,
          title: report.title,
          storagePath: report.storagePath,
          fileName: report.fileName,
          mimeType: report.mimeType,
          fileSizeBytes: report.fileSizeBytes,
          sourceUrl: report.sourceUrl,
          verificationStatus: report.verificationStatus,
          publicationStatus: report.publicationStatus,
          publishedAt:
            report.publicationStatus === "published" ? new Date() : null,
          notes: null,
        });

        reportSummary.inserted += 1;
        continue;
      }

      if (reportDataMatches(existingReport, report)) {
        reportSummary.skipped += 1;
        continue;
      }

      if (existingReport.publicationStatus !== "draft") {
        throw new Error(
          `Laporan ${report.storagePath} berstatus ${existingReport.publicationStatus} dan tidak boleh ditimpa importer.`,
        );
      }

      await transaction
        .update(industryReports)
        .set({
          title: report.title,
          storagePath: report.storagePath,
          fileName: report.fileName,
          mimeType: report.mimeType,
          fileSizeBytes: report.fileSizeBytes,
          sourceUrl: report.sourceUrl,
          verificationStatus: report.verificationStatus,
          publicationStatus: report.publicationStatus,
          publishedAt:
            report.publicationStatus === "published" ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(industryReports.id, existingReport.id));

      reportSummary.updated += 1;
    }
  });

  console.log("");
  console.log("Import data Industri berhasil:");
  console.log(
    `Perusahaan — total: ${companySummary.total}, inserted: ${companySummary.inserted}, updated: ${companySummary.updated}, skipped: ${companySummary.skipped}`,
  );
  console.log(
    `Laporan    — total: ${reportSummary.total}, inserted: ${reportSummary.inserted}, updated: ${reportSummary.updated}, skipped: ${reportSummary.skipped}`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("");
    console.error("Import data Industri gagal:", error);
    console.error(
      "Perubahan database dibatalkan jika transaksi telah dimulai.",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await sqlClient.end();
  });
