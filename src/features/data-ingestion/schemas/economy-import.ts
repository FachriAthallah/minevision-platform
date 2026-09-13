import { z } from "zod";

export const ECONOMY_DATASETS = [
  "gdp",
  "investment",
  "exports",
  "smelters",
  "regulations",
] as const;

const nonEmptyText = z
  .string()
  .refine((value) => value.trim().length > 0, "Teks tidak boleh kosong");
const slugSchema = z
  .string()
  .max(220)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug harus kebab-case");
const sha256Schema = z
  .string()
  .regex(/^[A-F0-9]{64}$/, "Hash sumber harus SHA-256 uppercase");
const decimalSchema = z
  .string()
  .regex(
    /^(?:0|[1-9]\d{0,23})(?:\.\d{1,6})?$/,
    "Nilai harus berupa string numerik non-negatif, bukan angka tampilan",
  );
const yearSchema = z.number().int().min(1900).max(2100);
const verificationStatusSchema = z.enum(["pending", "verified"]);
const publicationStatusSchema = z.enum(["draft", "published"]);
const recordTypeSchema = z.enum([
  "actual",
  "provisional",
  "projection",
  "revised",
]);
const statisticalStatusSchema = z.enum([
  "final",
  "preliminary",
  "very_preliminary",
]);

export const economySourceSchema = z
  .object({
    slug: slugSchema,
    name: nonEmptyText.max(200),
    type: z.enum([
      "government",
      "statistics_agency",
      "company_report",
      "academic",
      "regulation",
      "market_data",
      "other",
    ]),
    organization: nonEmptyText.max(200),
    url: z.url().startsWith("https://", "URL sumber harus HTTPS"),
    description: nonEmptyText.nullable(),
    isOfficial: z.literal(true),
    verificationStatus: z.literal("verified"),
  })
  .strict();

export const economyDatasetDescriptorSchema = z
  .object({
    dataset: z.enum(ECONOMY_DATASETS),
    filePath: nonEmptyText,
    sourceFileName: nonEmptyText,
    sourceSha256: sha256Schema,
    extractedAt: z.iso.datetime(),
    institution: nonEmptyText,
    officialSourceUrl: z.url().startsWith("https://"),
    accessedAt: z.iso.date(),
    yearRange: z
      .object({ from: yearSchema, to: yearSchema })
      .strict()
      .refine((range) => range.from <= range.to, {
        message: "Rentang tahun tidak valid",
      }),
    recordCount: z.number().int().nonnegative(),
    missingYears: z.array(yearSchema),
    methodologyNotes: nonEmptyText,
    verificationStatus: verificationStatusSchema,
    publicationStatus: publicationStatusSchema,
    unresolvedIssues: z.array(nonEmptyText),
  })
  .strict();

export const economyManifestSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    datasetName: nonEmptyText,
    effectiveDate: z.iso.date(),
    datasets: z.array(economyDatasetDescriptorSchema).length(5),
    sourceCatalog: z.array(economySourceSchema).min(1),
  })
  .strict()
  .superRefine((manifest, ctx) => {
    const datasets = manifest.datasets.map((entry) => entry.dataset);
    for (const required of ECONOMY_DATASETS) {
      if (datasets.filter((dataset) => dataset === required).length !== 1) {
        ctx.addIssue({
          code: "custom",
          path: ["datasets"],
          message: `Dataset ${required} wajib tersedia tepat satu kali`,
        });
      }
    }
    const paths = manifest.datasets.map((entry) => entry.filePath);
    if (new Set(paths).size !== paths.length) {
      ctx.addIssue({
        code: "custom",
        path: ["datasets"],
        message: "filePath dataset tidak boleh duplikat",
      });
    }
    const sourceSlugs = manifest.sourceCatalog.map((source) => source.slug);
    if (new Set(sourceSlugs).size !== sourceSlugs.length) {
      ctx.addIssue({
        code: "custom",
        path: ["sourceCatalog"],
        message: "Slug sourceCatalog tidak boleh duplikat",
      });
    }
  });

const recordSourceSlugsSchema = z.array(slugSchema).min(1);

const gdpRecordSchema = z
  .object({
    regionSlug: slugSchema,
    year: yearSchema,
    priceBasis: z.literal("current_prices"),
    baseYear: z.null(),
    nationalGdpValue: decimalSchema,
    miningQuarryingGdpValue: decimalSchema,
    currencyCode: z.literal("IDR"),
    valueScale: z.literal("billion"),
    dataStatus: statisticalStatusSchema,
    recordType: z.literal("actual"),
    sourcePublishedAt: z.iso.date().nullable(),
    sourceSlugs: recordSourceSlugsSchema,
    verificationStatus: z.literal("verified"),
    publicationStatus: z.literal("published"),
    notes: nonEmptyText,
  })
  .strict();

export const economyGdpFileSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    dataset: z.literal("gdp"),
    publicMetricLabel: z.literal("Perubahan nominal PDB Pertambangan ADHB"),
    records: z.array(gdpRecordSchema).min(1),
  })
  .strict();

const investmentRecordSchema = z
  .object({
    regionSlug: slugSchema,
    year: yearSchema,
    sectorCode: z.literal("mining"),
    sectorName: z.literal("Pertambangan"),
    investmentOrigin: z.enum(["pma", "pmdn"]),
    investmentValue: decimalSchema,
    currencyCode: z.literal("IDR"),
    valueScale: z.literal("trillion"),
    projectCount: z.number().int().nonnegative(),
    dataStatus: statisticalStatusSchema,
    recordType: z.literal("actual"),
    sourcePublishedAt: z.iso.date().nullable(),
    sourceSlugs: recordSourceSlugsSchema,
    verificationStatus: z.literal("pending"),
    publicationStatus: z.literal("draft"),
    holdReason: nonEmptyText,
    notes: nonEmptyText,
  })
  .strict();

export const economyInvestmentFileSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    dataset: z.literal("investment"),
    records: z.array(investmentRecordSchema).min(1),
  })
  .strict();

export const exportProductFormSchema = z.enum([
  "ore",
  "concentrate",
  "refined_metal",
  "processed_product",
  "coal",
  "other",
]);

const exportRecordSchema = z
  .object({
    year: yearSchema,
    commoditySlug: slugSchema,
    sourceCommodityLabel: nonEmptyText.max(160),
    hsCode: z.string().regex(/^[0-9]{2,10}$/).nullable(),
    productForm: exportProductFormSchema.nullable(),
    originRegionSlug: slugSchema,
    destinationCountryCode: z
      .string()
      .regex(/^[A-Z]{2}$/)
      .nullable(),
    destinationRegionSlug: slugSchema.nullable(),
    coverageType: z.literal("destination_country"),
    netWeightValue: decimalSchema.nullable(),
    netWeightUnitCode: z.literal("metric_ton").nullable(),
    netWeightScale: z.enum(["unit", "thousand"]).nullable(),
    fobValue: decimalSchema.nullable(),
    currencyCode: z.literal("USD"),
    fobValueScale: z.literal("thousand").nullable(),
    availability: z.enum([
      "reported",
      "reported_zero",
      "not_reported",
      "estimated",
    ]),
    dataStatus: statisticalStatusSchema,
    recordType: recordTypeSchema,
    sourcePublishedAt: z.iso.date().nullable(),
    sourceSlugs: recordSourceSlugsSchema,
    verificationStatus: z.literal("pending"),
    publicationStatus: z.literal("draft"),
    methodologyNotes: nonEmptyText.nullable(),
    holdReason: nonEmptyText,
  })
  .strict()
  .superRefine((record, ctx) => {
    const hasWeight = record.netWeightValue !== null;
    const hasFob = record.fobValue !== null;
    const completeWeight =
      hasWeight &&
      record.netWeightUnitCode !== null &&
      record.netWeightScale !== null;
    const completeFob = hasFob && record.fobValueScale !== null;

    if (record.availability === "not_reported") {
      if (
        hasWeight ||
        hasFob ||
        record.netWeightUnitCode !== null ||
        record.netWeightScale !== null ||
        record.fobValueScale !== null
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["availability"],
          message: "not_reported wajib mempunyai payload numerik dan unit null",
        });
      }
      return;
    }

    if (!completeWeight || !completeFob || record.destinationCountryCode === null) {
      ctx.addIssue({
        code: "custom",
        path: ["availability"],
        message: "Record tersedia wajib mempunyai berat, FOB, unit, dan negara tujuan lengkap",
      });
    }
    if (
      record.availability === "reported_zero" &&
      (record.netWeightValue === null ||
        Number(record.netWeightValue) !== 0 ||
        record.fobValue === null ||
        Number(record.fobValue) !== 0)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["availability"],
        message: "reported_zero mewajibkan berat dan FOB bernilai nol secara eksplisit",
      });
    }
    if (record.availability === "estimated" && record.methodologyNotes === null) {
      ctx.addIssue({
        code: "custom",
        path: ["methodologyNotes"],
        message: "estimated wajib mempunyai catatan metodologi",
      });
    }
  });

export const economyExportsFileSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    dataset: z.literal("exports"),
    expectedExistingSourcePublishedAtByYear: z
      .object({
        "2019": z.iso.date(),
        "2020": z.iso.date(),
        "2021": z.iso.date(),
        "2022": z.iso.date(),
        "2023": z.iso.date(),
        "2024": z.iso.date(),
        "2025": z.iso.date(),
      })
      .strict(),
    records: z.array(exportRecordSchema).min(1),
  })
  .strict();

const expectedSmelterStateSchema = z
  .object({
    sourceSlug: slugSchema.nullable(),
    verificationStatus: verificationStatusSchema,
    publicationStatus: publicationStatusSchema,
  })
  .strict();

const smelterRecordSchema = z
  .object({
    facilityCode: z.string().regex(/^S\d{3}$/),
    facilityName: nonEmptyText,
    facilityType: z.enum([
      "smelter",
      "refinery",
      "integrated_processing",
      "other",
    ]),
    operatorName: nonEmptyText,
    commoditySlug: slugSchema,
    inputMaterial: nonEmptyText,
    outputProduct: nonEmptyText,
    provinceRegionSlug: slugSchema,
    cityRegencyName: nonEmptyText,
    reportedOperationYear: yearSchema.nullable(),
    commissioningYear: yearSchema.nullable(),
    commercialOperationYear: yearSchema.nullable(),
    canonicalSourceSlug: slugSchema.nullable(),
    verificationStatus: verificationStatusSchema,
    publicationStatus: publicationStatusSchema,
    expectedState: expectedSmelterStateSchema,
    holdReason: nonEmptyText.nullable(),
  })
  .strict();

export const economySmeltersFileSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    dataset: z.literal("smelters"),
    records: z.array(smelterRecordSchema).min(1),
  })
  .strict();

const regulationRecordSchema = z
  .object({
    id: z.string().regex(/^R\d{3}$/),
    year: yearSchema,
    type: nonEmptyText,
    number: nonEmptyText,
    title: nonEmptyText,
    subject: nonEmptyText,
    status: z.enum(["active", "amended", "revoked", "unknown"]),
    officialUrl: z.url().startsWith("https://"),
    verifiedAt: z.iso.date().nullable(),
    relatedRegulationIds: z.array(z.string().regex(/^R\d{3}$/)),
    notes: nonEmptyText.nullable(),
  })
  .strict();

export const economyRegulationsFileSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    dataset: z.literal("regulations"),
    storage: z.literal("static_curated"),
    records: z.array(regulationRecordSchema).min(1),
  })
  .strict();

export type EconomyManifest = z.infer<typeof economyManifestSchema>;
export type EconomyGdpFile = z.infer<typeof economyGdpFileSchema>;
export type EconomyInvestmentFile = z.infer<typeof economyInvestmentFileSchema>;
export type EconomyExportsFile = z.infer<typeof economyExportsFileSchema>;
export type EconomySmeltersFile = z.infer<typeof economySmeltersFileSchema>;
export type EconomyRegulationsFile = z.infer<typeof economyRegulationsFileSchema>;

export type EconomyDatasetFiles = {
  gdp: EconomyGdpFile;
  investment: EconomyInvestmentFile;
  exports: EconomyExportsFile;
  smelters: EconomySmeltersFile;
  regulations: EconomyRegulationsFile;
};
