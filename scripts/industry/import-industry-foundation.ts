import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { drizzle } from "drizzle-orm/postgres-js";
import { config } from "dotenv";
import postgres from "postgres";
import { z } from "zod";

import {
  commodities,
  industryCompanies,
  industryCompanyFinancials,
  industryCompanyProduction,
  industryOperationSites,
  industryReports,
  measurementUnits,
  sources,
} from "../../src/db/schema";

config({ path: ".env.local" });

const MANIFEST_PATH = resolve(
  "data",
  "staging",
  "industry",
  "company-foundation.json",
);

const EXPECTED_COUNTS = {
  sources: 12,
  production: 75,
  reportedProduction: 69,
  financials: 108,
  operationSites: 39,
} as const;

const decimalSchema = z.string().regex(/^-?\d+(?:\.\d+)?$/);
const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const nullableTextSchema = z.string().min(1).nullable();

const sourceSchema = z.object({
  companySlug: slugSchema,
  slug: slugSchema,
  name: z.string().min(1).max(200),
  organization: z.string().min(1).max(200),
  type: z.literal("company_report"),
  url: z.string().url(),
  description: z.string().min(1),
  isOfficial: z.literal(true),
  verificationStatus: z.literal("verified"),
  isActive: z.literal(true),
});

const productionSchema = z
  .object({
    companySlug: slugSchema,
    commoditySlug: slugSchema,
    year: z.number().int().min(2023).max(2025),
    metricCode: z.string().regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/),
    metricName: z.string().min(1).max(180),
    productName: z.string().min(1).max(180),
    productionValue: decimalSchema.nullable(),
    unitCode: z.enum([
      "metric_ton",
      "wet_metric_ton",
      "kilogram",
      "troy_ounce",
      "pound",
    ]).nullable(),
    reportedValue: decimalSchema.nullable(),
    valueScale: z.number().int().positive().nullable(),
    reportedUnitLabel: z.string().min(1).max(80),
    productionBasis: z.string().min(1),
    dataAvailability: z.enum([
      "reported",
      "not_normalized",
      "not_reported",
    ]),
    recordType: z.literal("actual"),
    sourceSlug: slugSchema,
    sourceReportYear: z.number().int().min(2023).max(2025),
    sourceUrl: z.string().url(),
    pageReference: nullableTextSchema,
    verificationStatus: z.enum(["pending", "verified"]),
    publicationStatus: z.enum(["draft", "published"]),
    notes: nullableTextSchema,
  })
  .superRefine((record, context) => {
    const fields = [
      record.productionValue,
      record.unitCode,
      record.reportedValue,
      record.valueScale,
    ];
    const allPresent = fields.every((value) => value !== null);
    const allAbsent = fields.every((value) => value === null);

    if (record.dataAvailability === "reported" && !allPresent) {
      context.addIssue({
        code: "custom",
        message: "Record reported wajib memiliki nilai dan unit lengkap.",
      });
    }

    if (record.dataAvailability !== "reported" && !allAbsent) {
      context.addIssue({
        code: "custom",
        message: "Record yang belum tersedia tidak boleh memiliki nilai dasar.",
      });
    }

    if (
      record.publicationStatus === "published" &&
      (record.dataAvailability !== "reported" ||
        record.verificationStatus !== "verified")
    ) {
      context.addIssue({
        code: "custom",
        message: "Hanya record reported dan verified yang boleh dipublikasikan.",
      });
    }
  });

const financialSchema = z.object({
  companySlug: slugSchema,
  year: z.number().int().min(2023).max(2025),
  metric: z.enum([
    "total_assets",
    "revenue",
    "net_income",
    "profit_for_year",
    "operating_income",
  ]),
  metricLabel: z.string().min(1).max(180),
  amount: decimalSchema,
  currencyCode: z.enum(["USD", "IDR"]),
  reportedValue: decimalSchema,
  valueScale: z.number().int().positive(),
  reportedUnitLabel: z.string().min(1).max(80),
  statementScope: z.string().min(1).max(180),
  profitDefinition: nullableTextSchema,
  auditStatus: z.enum(["audited", "unaudited", "unknown"]),
  sourceSlug: slugSchema,
  sourceReportYear: z.number().int().min(2023).max(2025),
  sourceUrl: z.string().url(),
  pageReference: nullableTextSchema,
  verificationStatus: z.literal("verified"),
  publicationStatus: z.literal("published"),
  notes: nullableTextSchema,
});

const operationSiteSchema = z.object({
  companySlug: slugSchema,
  name: z.string().min(1).max(200),
  slug: slugSchema,
  operatorName: z.string().min(1).max(200),
  siteType: z.enum([
    "mine",
    "underground_mine",
    "smelter",
    "refinery",
    "port",
    "industrial_complex",
    "project",
    "operating_area",
  ]),
  currentStatus: z.enum([
    "operating",
    "ramp_up",
    "development",
    "construction",
    "limited_operation",
    "care_and_maintenance",
    "closed",
  ]),
  statusLabel: z.string().min(1).max(120),
  commoditySlugs: z.array(slugSchema).min(1),
  provinceName: z.string().min(1).max(160),
  regencyName: z.string().min(1).max(180).nullable(),
  locationDescription: z.string().min(1),
  latitude: decimalSchema.nullable(),
  longitude: decimalSchema.nullable(),
  coordinatePrecision: z
    .enum([
      "exact",
      "approximate",
      "regency_centroid",
      "province_centroid",
      "withheld",
    ])
    .nullable(),
  displayOrder: z.number().int().nonnegative(),
  isActive: z.boolean(),
  sourceSlug: slugSchema,
  sourceReportYear: z.number().int().min(2023).max(2025),
  sourceUrl: z.string().url(),
  pageReference: nullableTextSchema,
  verificationStatus: z.literal("pending"),
  publicationStatus: z.literal("draft"),
  notes: nullableTextSchema,
});

const manifestSchema = z.object({
  schemaVersion: z.literal(1),
  generatedFrom: z.string().min(1),
  normalization: z.object({
    production: z.string().min(1),
    financials: z.string().min(1),
    operationSites: z.string().min(1),
  }),
  counts: z.object({
    sources: z.number().int(),
    production: z.number().int(),
    reportedProduction: z.number().int(),
    financials: z.number().int(),
    operationSites: z.number().int(),
  }),
  sources: z.array(sourceSchema),
  production: z.array(productionSchema),
  financials: z.array(financialSchema),
  operationSites: z.array(operationSiteSchema),
});

type Manifest = z.infer<typeof manifestSchema>;

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

function assertCondition(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function validateManifestRelationships(manifest: Manifest) {
  assertCondition(
    JSON.stringify(manifest.counts) === JSON.stringify(EXPECTED_COUNTS),
    `Jumlah manifest tidak sesuai: ${JSON.stringify(manifest.counts)}.`,
  );
  assertCondition(manifest.sources.length === EXPECTED_COUNTS.sources, "Jumlah sumber tidak sesuai.");
  assertCondition(manifest.production.length === EXPECTED_COUNTS.production, "Jumlah produksi tidak sesuai.");
  assertCondition(manifest.financials.length === EXPECTED_COUNTS.financials, "Jumlah keuangan tidak sesuai.");
  assertCondition(manifest.operationSites.length === EXPECTED_COUNTS.operationSites, "Jumlah lokasi tidak sesuai.");

  const sourceSlugs = new Set(manifest.sources.map((source) => source.slug));
  const companySlugs = new Set(manifest.sources.map((source) => source.companySlug));
  const productionKeys = new Set<string>();
  const financialKeys = new Set<string>();
  const siteKeys = new Set<string>();

  for (const record of manifest.production) {
    assertCondition(companySlugs.has(record.companySlug), `Perusahaan produksi tidak dikenal: ${record.companySlug}.`);
    assertCondition(sourceSlugs.has(record.sourceSlug), `Sumber produksi tidak dikenal: ${record.sourceSlug}.`);
    const key = `${record.companySlug}:${record.year}:${record.metricCode}`;
    assertCondition(!productionKeys.has(key), `Produksi duplikat: ${key}.`);
    productionKeys.add(key);
  }

  for (const record of manifest.financials) {
    assertCondition(companySlugs.has(record.companySlug), `Perusahaan keuangan tidak dikenal: ${record.companySlug}.`);
    assertCondition(sourceSlugs.has(record.sourceSlug), `Sumber keuangan tidak dikenal: ${record.sourceSlug}.`);
    const key = `${record.companySlug}:${record.year}:${record.metric}:${record.statementScope}`;
    assertCondition(!financialKeys.has(key), `Keuangan duplikat: ${key}.`);
    financialKeys.add(key);
  }

  for (const record of manifest.operationSites) {
    assertCondition(companySlugs.has(record.companySlug), `Perusahaan lokasi tidak dikenal: ${record.companySlug}.`);
    assertCondition(sourceSlugs.has(record.sourceSlug), `Sumber lokasi tidak dikenal: ${record.sourceSlug}.`);
    const key = `${record.companySlug}:${record.slug}`;
    assertCondition(!siteKeys.has(key), `Lokasi duplikat: ${key}.`);
    siteKeys.add(key);
  }
}

async function readManifest() {
  const raw = JSON.parse(await readFile(MANIFEST_PATH, "utf8")) as unknown;
  const manifest = manifestSchema.parse(raw);
  validateManifestRelationships(manifest);
  return manifest;
}

async function validateDatabaseDependencies(manifest: Manifest) {
  const [companyRows, commodityRows, unitRows] = await Promise.all([
    database.select({ id: industryCompanies.id, slug: industryCompanies.slug }).from(industryCompanies),
    database.select({ id: commodities.id, slug: commodities.slug }).from(commodities),
    database.select({ code: measurementUnits.code }).from(measurementUnits),
  ]);

  const companySlugs = new Set(companyRows.map((row) => row.slug));
  const commoditySlugs = new Set(commodityRows.map((row) => row.slug));
  const unitCodes = new Set(unitRows.map((row) => row.code));

  for (const source of manifest.sources) {
    assertCondition(companySlugs.has(source.companySlug), `Perusahaan tidak tersedia: ${source.companySlug}.`);
  }
  for (const record of manifest.production) {
    assertCondition(commoditySlugs.has(record.commoditySlug), `Komoditas tidak tersedia: ${record.commoditySlug}.`);
    if (record.unitCode) {
      const isSeededByImporter = record.unitCode === "wet_metric_ton" || record.unitCode === "pound";
      assertCondition(unitCodes.has(record.unitCode) || isSeededByImporter, `Unit tidak tersedia: ${record.unitCode}.`);
    }
  }
}

async function importManifest(manifest: Manifest) {
  return database.transaction(async (transaction) => {
    const now = new Date();

    await transaction.insert(measurementUnits).values([
      { name: "Wet Metric Ton", code: "wet_metric_ton", symbol: "wmt", category: "mass", description: "Satuan metrik ton berdasarkan berat material dalam kondisi basah.", isActive: true },
      { name: "Pound", code: "pound", symbol: "lb", category: "mass", description: "Satuan massa avoirdupois setara dengan 0,45359237 kilogram.", isActive: true },
    ]).onConflictDoNothing();

    for (const source of manifest.sources) {
      await transaction.insert(sources).values({
        slug: source.slug,
        name: source.name,
        organization: source.organization,
        type: source.type,
        url: source.url,
        description: source.description,
        isOfficial: source.isOfficial,
        verificationStatus: source.verificationStatus,
        verifiedAt: now,
        isActive: source.isActive,
      }).onConflictDoUpdate({
        target: sources.slug,
        set: {
          name: source.name,
          organization: source.organization,
          type: source.type,
          url: source.url,
          description: source.description,
          isOfficial: source.isOfficial,
          verificationStatus: source.verificationStatus,
          verifiedAt: now,
          isActive: source.isActive,
          updatedAt: now,
        },
      });
    }

    const [companyRows, commodityRows, sourceRows, reportRows] = await Promise.all([
      transaction.select({ id: industryCompanies.id, slug: industryCompanies.slug }).from(industryCompanies),
      transaction.select({ id: commodities.id, slug: commodities.slug }).from(commodities),
      transaction.select({ id: sources.id, slug: sources.slug }).from(sources),
      transaction.select({ id: industryReports.id, companyId: industryReports.companyId, reportYear: industryReports.reportYear, reportType: industryReports.reportType }).from(industryReports),
    ]);

    const companyBySlug = new Map(companyRows.map((row) => [row.slug, row.id]));
    const commodityBySlug = new Map(commodityRows.map((row) => [row.slug, row.id]));
    const sourceBySlug = new Map(sourceRows.map((row) => [row.slug, row.id]));
    const reportByKey = new Map(reportRows.filter((row) => row.reportType === "annual_report").map((row) => [`${row.companyId}:${row.reportYear}`, row.id]));

    for (const record of manifest.production) {
      const companyId = companyBySlug.get(record.companySlug)!;
      const sourceReportId = reportByKey.get(`${companyId}:${record.sourceReportYear}`) ?? null;
      const values = {
        companyId,
        commodityId: commodityBySlug.get(record.commoditySlug)!,
        year: record.year,
        metricCode: record.metricCode,
        metricName: record.metricName,
        productName: record.productName,
        productionValue: record.productionValue,
        unitCode: record.unitCode,
        reportedValue: record.reportedValue,
        valueScale: record.valueScale,
        reportedUnitLabel: record.reportedUnitLabel,
        productionBasis: record.productionBasis,
        dataAvailability: record.dataAvailability,
        recordType: record.recordType,
        sourceId: sourceBySlug.get(record.sourceSlug)!,
        sourceReportId,
        sourceUrl: record.sourceUrl,
        pageReference: record.pageReference,
        verificationStatus: record.verificationStatus,
        publicationStatus: record.publicationStatus,
        notes: record.notes,
      };
      await transaction.insert(industryCompanyProduction).values(values).onConflictDoUpdate({
        target: [industryCompanyProduction.companyId, industryCompanyProduction.year, industryCompanyProduction.metricCode],
        set: { ...values, updatedAt: now },
      });
    }

    for (const record of manifest.financials) {
      const companyId = companyBySlug.get(record.companySlug)!;
      const sourceReportId = reportByKey.get(`${companyId}:${record.sourceReportYear}`) ?? null;
      const values = {
        companyId,
        year: record.year,
        metric: record.metric,
        metricLabel: record.metricLabel,
        amount: record.amount,
        currencyCode: record.currencyCode,
        reportedValue: record.reportedValue,
        valueScale: record.valueScale,
        reportedUnitLabel: record.reportedUnitLabel,
        statementScope: record.statementScope,
        profitDefinition: record.profitDefinition,
        auditStatus: record.auditStatus,
        sourceId: sourceBySlug.get(record.sourceSlug)!,
        sourceReportId,
        sourceUrl: record.sourceUrl,
        pageReference: record.pageReference,
        verificationStatus: record.verificationStatus,
        publicationStatus: record.publicationStatus,
        notes: record.notes,
      };
      await transaction.insert(industryCompanyFinancials).values(values).onConflictDoUpdate({
        target: [industryCompanyFinancials.companyId, industryCompanyFinancials.year, industryCompanyFinancials.metric, industryCompanyFinancials.statementScope],
        set: { ...values, updatedAt: now },
      });
    }

    for (const record of manifest.operationSites) {
      const companyId = companyBySlug.get(record.companySlug)!;
      const sourceReportId = reportByKey.get(`${companyId}:${record.sourceReportYear}`) ?? null;
      const values = {
        companyId,
        name: record.name,
        slug: record.slug,
        operatorName: record.operatorName,
        siteType: record.siteType,
        currentStatus: record.currentStatus,
        statusLabel: record.statusLabel,
        commoditySlugs: record.commoditySlugs,
        provinceName: record.provinceName,
        regencyName: record.regencyName,
        locationDescription: record.locationDescription,
        latitude: record.latitude,
        longitude: record.longitude,
        coordinatePrecision: record.coordinatePrecision,
        displayOrder: record.displayOrder,
        isActive: record.isActive,
        sourceId: sourceBySlug.get(record.sourceSlug)!,
        sourceReportId,
        sourceUrl: record.sourceUrl,
        pageReference: record.pageReference,
        verificationStatus: record.verificationStatus,
        publicationStatus: record.publicationStatus,
        notes: record.notes,
      };
      await transaction.insert(industryOperationSites).values(values).onConflictDoUpdate({
        target: [industryOperationSites.companyId, industryOperationSites.slug],
        set: { ...values, updatedAt: now },
      });
    }

    return {
      sources: manifest.sources.length,
      production: manifest.production.length,
      financials: manifest.financials.length,
      operationSites: manifest.operationSites.length,
    };
  });
}

async function main() {
  const shouldCommit = process.argv.includes("--commit");
  console.log("Memvalidasi staging fondasi data Industri...");
  console.log(`Manifest: ${MANIFEST_PATH}`);
  const manifest = await readManifest();
  await validateDatabaseDependencies(manifest);
  console.log(`[OK] ${manifest.counts.production} produksi (${manifest.counts.reportedProduction} reported), ${manifest.counts.financials} keuangan, ${manifest.counts.operationSites} lokasi valid.`);

  if (!shouldCommit) {
    console.log("\nDRY-RUN selesai. Database belum diubah.");
    console.log("Jalankan kembali dengan --commit untuk mengimpor data.");
    return;
  }

  const imported = await importManifest(manifest);
  console.log("\nImport fondasi data Industri berhasil:");
  console.log(`Sumber     : ${imported.sources}`);
  console.log(`Produksi   : ${imported.production}`);
  console.log(`Keuangan   : ${imported.financials}`);
  console.log(`Lokasi     : ${imported.operationSites}`);
}

main().catch((error: unknown) => {
  console.error("\nImport fondasi data Industri gagal:", error);
  process.exitCode = 1;
}).finally(async () => {
  await sqlClient.end();
});
