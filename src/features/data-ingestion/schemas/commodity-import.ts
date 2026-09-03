import { z } from "zod";

export const REQUIRED_COMMODITY_SLUGS = [
  "nikel",
  "emas",
  "tembaga",
  "timah",
  "bauksit",
  "perak",
  "bijih-besi",
  "mangan",
  "kobalt",
  "timbal",
  "seng",
  "batu-kapur",
  "marmer",
  "granit",
  "kaolin",
  "pasir-silika",
  "bentonit",
  "zeolit",
  "feldspar",
  "fosfat",
  "gipsum",
  "batubara",
  "panas-bumi",
] as const;

const POSTGRES_INTEGER_MAX = 2_147_483_647;

function createSlugSchema(maxLength: number, label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} wajib diisi`)
    .max(maxLength, `${label} maksimal ${maxLength} karakter`)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      `${label} hanya boleh menggunakan huruf kecil, angka, dan tanda hubung`,
    );
}

const sourceSlugSchema = createSlugSchema(220, "Source slug");
const regionSlugSchema = createSlugSchema(180, "Region slug");
const industryCompanySlugSchema = createSlugSchema(
  180,
  "Industry company slug",
);
const producerKeySchema = createSlugSchema(180, "Producer key");

const nonEmptyTextSchema = z.string().trim().min(1, "Nilai wajib diisi");

function createBoundedTextSchema(maxLength: number, label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} wajib diisi`)
    .max(maxLength, `${label} maksimal ${maxLength} karakter`);
}

const unitCodeSchema = z
  .string()
  .trim()
  .min(1, "Unit code wajib diisi")
  .max(50, "Unit code maksimal 50 karakter")
  .regex(
    /^[a-z0-9]+(?:_[a-z0-9]+)*$/,
    "Unit code harus menggunakan snake_case huruf kecil",
  );

const basisCodeSchema = z
  .string()
  .trim()
  .min(1, "Basis code wajib diisi")
  .max(50, "Basis code maksimal 50 karakter")
  .regex(
    /^[a-z0-9]+(?:_[a-z0-9]+)*$/,
    "Basis code harus menggunakan snake_case huruf kecil",
  );

const nullableTextSchema = nonEmptyTextSchema.nullable();

const httpsUrlSchema = z
  .string()
  .trim()
  .url("URL harus berupa URL yang valid")
  .regex(/^https:\/\//, "URL wajib menggunakan HTTPS");

export const commoditySlugSchema = z.enum(REQUIRED_COMMODITY_SLUGS);

export const commodityDecimalStringSchema = z
  .string()
  .regex(
    /^\d{1,24}(?:\.\d{1,6})?$/,
    "Nilai harus berupa string desimal non-negatif dengan maksimal 24 digit integer dan 6 digit desimal",
  );

export const commoditySourceTypeSchema = z.enum([
  "government",
  "statistics_agency",
  "company_report",
  "academic",
  "regulation",
  "market_data",
  "other",
]);

const sourceKeyReferenceSchema = z
  .object({
    sourceSlug: sourceSlugSchema,
  })
  .strict();

const citationLabelSchema = createBoundedTextSchema(
  255,
  "Citation label",
)
  .nullable()
  .optional();

const pageReferenceSchema = createBoundedTextSchema(100, "Page reference")
  .nullable()
  .optional();

const profileSourceReferenceSchema = sourceKeyReferenceSchema
  .extend({
    citationLabel: citationLabelSchema,
    pageReference: pageReferenceSchema,
  })
  .strict();

export const commoditySourceReferenceSchema = sourceKeyReferenceSchema
  .extend({
    sourceUrl: httpsUrlSchema.nullable().optional(),
    pageReference: pageReferenceSchema,
  })
  .strict();

export const commoditySupportingSourceReferenceSchema =
  commoditySourceReferenceSchema
    .extend({
      sourceRole: z.enum(["supporting", "cross_check"]),
      citationLabel: citationLabelSchema,
    })
    .strict();

const producerPrimarySourceSchema = commoditySourceReferenceSchema
  .extend({
    sourceUrl: httpsUrlSchema,
  })
  .strict();

/*
 * commodity_production_locations hanya menyimpan source_id. Metadata sitasi
 * rinci harus berada pada sourceCatalog atau notes lokasi, sehingga kontrak
 * lokasi sengaja hanya menerima sourceSlug dan tidak membuang field diam-diam.
 */
const productionLocationSourceReferenceSchema = sourceKeyReferenceSchema;

const sourceCatalogEntrySchema = z
  .object({
    slug: sourceSlugSchema,
    name: createBoundedTextSchema(200, "Source name"),
    type: commoditySourceTypeSchema,
    organization: createBoundedTextSchema(200, "Source organization"),
    url: httpsUrlSchema.nullable(),
    description: nullableTextSchema,
    isOfficial: z.boolean(),
    verificationStatus: z.literal("verified"),
  })
  .strict();

const countryCatalogEntrySchema = z
  .object({
    code: z
      .string()
      .trim()
      .regex(/^[A-Z]{2,3}$/, "Kode negara harus berupa 2–3 huruf kapital"),
    name: createBoundedTextSchema(160, "Country name"),
    slug: regionSlugSchema,
  })
  .strict();

const commodityFileReferenceSchema = z
  .object({
    commoditySlug: commoditySlugSchema,
    filePath: z.string().trim().min(1, "File path wajib diisi"),
  })
  .strict();

function addDuplicateIssues(
  values: readonly string[],
  pathForIndex: (index: number) => (string | number)[],
  fieldName: string,
  context: z.RefinementCtx,
) {
  const firstIndexByValue = new Map<string, number>();

  values.forEach((value, index) => {
    if (firstIndexByValue.has(value)) {
      context.addIssue({
        code: "custom",
        message: `${fieldName} duplikat: ${value}`,
        path: pathForIndex(index),
      });
      return;
    }

    firstIndexByValue.set(value, index);
  });
}

export const commodityImportManifestSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    datasetName: nonEmptyTextSchema,
    description: nullableTextSchema.optional(),
    effectiveDate: z.iso.date({
      error: "Tanggal efektif harus menggunakan format YYYY-MM-DD",
    }),
    commodityFiles: z
      .array(commodityFileReferenceSchema)
      .length(23, "Manifest wajib memiliki tepat 23 file komoditas"),
    sourceCatalog: z
      .array(sourceCatalogEntrySchema)
      .min(1, "Manifest wajib memiliki minimal satu source"),
    countryCatalog: z.array(countryCatalogEntrySchema),
  })
  .strict()
  .superRefine((manifest, context) => {
    addDuplicateIssues(
      manifest.commodityFiles.map((entry) => entry.commoditySlug),
      (index) => ["commodityFiles", index, "commoditySlug"],
      "Commodity slug",
      context,
    );

    addDuplicateIssues(
      manifest.commodityFiles.map((entry) => entry.filePath),
      (index) => ["commodityFiles", index, "filePath"],
      "File path",
      context,
    );

    manifest.commodityFiles.forEach((entry, index) => {
      const expectedPath = `commodities/${entry.commoditySlug}.json`;

      if (entry.filePath !== expectedPath) {
        context.addIssue({
          code: "custom",
          message: `File path harus berupa ${expectedPath}`,
          path: ["commodityFiles", index, "filePath"],
        });
      }
    });

    const availableSlugs = new Set(
      manifest.commodityFiles.map((entry) => entry.commoditySlug),
    );

    for (const requiredSlug of REQUIRED_COMMODITY_SLUGS) {
      if (!availableSlugs.has(requiredSlug)) {
        context.addIssue({
          code: "custom",
          message: `Komoditas wajib belum tersedia: ${requiredSlug}`,
          path: ["commodityFiles"],
        });
      }
    }

    addDuplicateIssues(
      manifest.sourceCatalog.map((source) => source.slug),
      (index) => ["sourceCatalog", index, "slug"],
      "Source slug",
      context,
    );

    addDuplicateIssues(
      manifest.countryCatalog.map((country) => country.slug),
      (index) => ["countryCatalog", index, "slug"],
      "Country slug",
      context,
    );

    addDuplicateIssues(
      manifest.countryCatalog.map((country) => country.code),
      (index) => ["countryCatalog", index, "code"],
      "Country code",
      context,
    );
  });

const commodityImageSchema = z
  .object({
    imageUrl: z
      .string()
      .trim()
      .regex(
        /^\/images\/commodity\/[a-zA-Z0-9][a-zA-Z0-9._-]*\.(?:avif|jpeg|jpg|png|webp)$/,
        "Image URL harus berada di /images/commodity/ dengan format gambar yang didukung",
      ),
    imageAlt: nonEmptyTextSchema,
    imageCredit: nullableTextSchema,
    imageSourceUrl: httpsUrlSchema.nullable(),
  })
  .strict();

const commodityProfileSchema = z
  .object({
    title: createBoundedTextSchema(240, "Profile title"),
    slug: commoditySlugSchema,
    excerpt: nonEmptyTextSchema,
    body: nonEmptyTextSchema,
    readingTimeMinutes: z
      .number()
      .int()
      .positive()
      .max(POSTGRES_INTEGER_MAX)
      .optional(),
    isFeatured: z.boolean(),
    publicationStatus: z.literal("published"),
    publishedAt: z.iso.datetime({
      offset: true,
      error: "Published at harus berupa ISO datetime dengan timezone",
    }),
    sources: z
      .array(profileSourceReferenceSchema)
      .min(1, "Profil wajib memiliki minimal satu sumber"),
  })
  .strict()
  .superRefine((profile, context) => {
    addDuplicateIssues(
      profile.sources.map((source) => source.sourceSlug),
      (index) => ["sources", index, "sourceSlug"],
      "Profile source",
      context,
    );
  });

const commodityResourceStatisticSchema = z
  .object({
    statisticYear: z.number().int().min(1900).max(2100),
    statisticType: z.enum([
      "reserve",
      "resource",
      "installed_capacity",
      "working_area_count",
    ]),
    materialBasis: z
      .enum([
        "ore",
        "contained_metal",
        "alumina",
        "raw_material",
        "energy_capacity",
      ])
      .nullable(),
    availabilityStatus: z.enum([
      "reported",
      "not_reported",
      "not_applicable",
    ]),
    value: commodityDecimalStringSchema.nullable(),
    unitCode: unitCodeSchema.nullable(),
    recordType: z.literal("actual"),
    primarySource: commoditySourceReferenceSchema,
    supportingSources: z.array(commoditySupportingSourceReferenceSchema),
    verificationStatus: z.literal("verified"),
    publicationStatus: z.literal("published"),
    notes: nullableTextSchema,
  })
  .strict()
  .superRefine((statistic, context) => {
    if (statistic.availabilityStatus === "reported") {
      if (statistic.value === null) {
        context.addIssue({
          code: "custom",
          message: "Statistik reported wajib memiliki value",
          path: ["value"],
        });
      }

      if (statistic.unitCode === null) {
        context.addIssue({
          code: "custom",
          message: "Statistik reported wajib memiliki unitCode",
          path: ["unitCode"],
        });
      }
    } else {
      if (statistic.value !== null) {
        context.addIssue({
          code: "custom",
          message: "Statistik non-reported wajib memiliki value null",
          path: ["value"],
        });
      }

      if (statistic.unitCode !== null) {
        context.addIssue({
          code: "custom",
          message: "Statistik non-reported wajib memiliki unitCode null",
          path: ["unitCode"],
        });
      }
    }

    if (statistic.statisticType === "working_area_count") {
      if (statistic.materialBasis !== null) {
        context.addIssue({
          code: "custom",
          message: "working_area_count wajib memiliki materialBasis null",
          path: ["materialBasis"],
        });
      }

      if (
        statistic.value !== null &&
        !/^\d+(?:\.0{1,6})?$/.test(statistic.value)
      ) {
        context.addIssue({
          code: "custom",
          message: "working_area_count wajib berupa bilangan bulat",
          path: ["value"],
        });
      }
    }

    if (
      statistic.statisticType === "installed_capacity" &&
      statistic.materialBasis !== "energy_capacity"
    ) {
      context.addIssue({
        code: "custom",
        message: "installed_capacity wajib memakai materialBasis energy_capacity",
        path: ["materialBasis"],
      });
    }

    addDuplicateIssues(
      statistic.supportingSources.map((source) =>
        [
          source.sourceSlug,
          source.sourceRole,
          source.citationLabel ?? "",
          source.pageReference ?? "",
        ].join("\u0000"),
      ),
      (index) => ["supportingSources", index, "sourceSlug"],
      "Supporting source",
      context,
    );
  });

const commodityProductionLocationSchema = z
  .object({
    regionSlug: regionSlugSchema,
    locationDetail: nonEmptyTextSchema,
    recordType: z.literal("actual"),
    primarySource: productionLocationSourceReferenceSchema,
    verificationStatus: z.literal("verified"),
    publicationStatus: z.literal("published"),
    notes: nullableTextSchema,
  })
  .strict();

const commodityGlobalStatisticEntrySchema = z
  .object({
    countryRegionSlug: regionSlugSchema,
    rank: z.number().int().min(1).max(5),
    value: commodityDecimalStringSchema,
    notes: nullableTextSchema.optional(),
  })
  .strict();

const commodityGlobalStatisticSetSchema = z
  .object({
    statisticYear: z.number().int().min(1900).max(2100),
    metricCode: z.enum(["mine_production", "installed_capacity"]),
    basisCode: basisCodeSchema,
    unitCode: unitCodeSchema.nullable(),
    availabilityStatus: z.enum(["reported", "source_unavailable"]),
    recordType: z.literal("actual"),
    primarySource: commoditySourceReferenceSchema.nullable(),
    supportingSources: z.array(commoditySupportingSourceReferenceSchema),
    entries: z.array(commodityGlobalStatisticEntrySchema),
    verificationStatus: z.literal("verified"),
    publicationStatus: z.literal("published"),
    notes: nullableTextSchema,
  })
  .strict()
  .superRefine((statisticSet, context) => {
    if (statisticSet.availabilityStatus === "source_unavailable") {
      if (statisticSet.unitCode !== null) {
        context.addIssue({
          code: "custom",
          message: "source_unavailable wajib memiliki unitCode null",
          path: ["unitCode"],
        });
      }

      if (statisticSet.primarySource !== null) {
        context.addIssue({
          code: "custom",
          message: "source_unavailable wajib memiliki primarySource null",
          path: ["primarySource"],
        });
      }

      if (statisticSet.supportingSources.length > 0) {
        context.addIssue({
          code: "custom",
          message: "source_unavailable wajib memiliki supportingSources kosong",
          path: ["supportingSources"],
        });
      }

      if (statisticSet.entries.length > 0) {
        context.addIssue({
          code: "custom",
          message: "source_unavailable wajib memiliki entries kosong",
          path: ["entries"],
        });
      }

      return;
    }

    if (statisticSet.unitCode === null) {
      context.addIssue({
        code: "custom",
        message: "Dataset reported wajib memiliki unitCode",
        path: ["unitCode"],
      });
    }

    if (statisticSet.primarySource === null) {
      context.addIssue({
        code: "custom",
        message: "Dataset reported wajib memiliki primarySource",
        path: ["primarySource"],
      });
    }

    if (statisticSet.entries.length !== 5) {
      context.addIssue({
        code: "custom",
        message: "Dataset reported wajib memiliki tepat lima negara",
        path: ["entries"],
      });
    }

    addDuplicateIssues(
      statisticSet.entries.map((entry) => String(entry.rank)),
      (index) => ["entries", index, "rank"],
      "Rank",
      context,
    );

    addDuplicateIssues(
      statisticSet.entries.map((entry) => entry.countryRegionSlug),
      (index) => ["entries", index, "countryRegionSlug"],
      "Negara",
      context,
    );

    addDuplicateIssues(
      statisticSet.supportingSources.map((source) =>
        [
          source.sourceSlug,
          source.sourceRole,
          source.citationLabel ?? "",
          source.pageReference ?? "",
        ].join("\u0000"),
      ),
      (index) => ["supportingSources", index, "sourceSlug"],
      "Supporting source",
      context,
    );

    const ranks = new Set(statisticSet.entries.map((entry) => entry.rank));

    for (let rank = 1; rank <= 5; rank += 1) {
      if (!ranks.has(rank)) {
        context.addIssue({
          code: "custom",
          message: `Rank ${rank} belum tersedia`,
          path: ["entries"],
        });
      }
    }
  });

const commodityProducerSchema = z
  .object({
    producerKey: producerKeySchema,
    companyName: createBoundedTextSchema(200, "Company name"),
    industryCompanySlug: industryCompanySlugSchema.nullable(),
    operationArea: nonEmptyTextSchema,
    primaryRegionSlug: regionSlugSchema.nullable(),
    producerRole: createBoundedTextSchema(60, "Producer role").nullable(),
    displayOrder: z.number().int().nonnegative().max(POSTGRES_INTEGER_MAX),
    primarySource: producerPrimarySourceSchema,
    isActive: z.literal(true),
    verificationStatus: z.literal("verified"),
    publicationStatus: z.literal("published"),
    notes: nullableTextSchema,
  })
  .strict();

export const commodityImportFileSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    commoditySlug: commoditySlugSchema,
    commodity: z
      .object({
        description: nonEmptyTextSchema,
        specification: nonEmptyTextSchema,
        image: commodityImageSchema.nullable(),
      })
      .strict(),
    profile: commodityProfileSchema,
    resourceStatistics: z
      .array(commodityResourceStatisticSchema)
      .min(1, "Setiap komoditas wajib memiliki minimal satu statistik resource"),
    productionLocations: z
      .array(commodityProductionLocationSchema)
      .min(1, "Setiap komoditas wajib memiliki minimal satu daerah penghasil"),
    globalStatisticSets: z
      .array(commodityGlobalStatisticSetSchema)
      .length(1, "Setiap komoditas wajib memiliki tepat satu global statistic set"),
    producers: z
      .array(commodityProducerSchema)
      .min(1, "Setiap komoditas wajib memiliki minimal satu produsen")
      .max(5, "Setiap komoditas hanya boleh memiliki maksimal lima produsen"),
  })
  .strict()
  .superRefine((commodityFile, context) => {
    if (commodityFile.profile.slug !== commodityFile.commoditySlug) {
      context.addIssue({
        code: "custom",
        message: "Profile slug harus sama dengan commoditySlug",
        path: ["profile", "slug"],
      });
    }

    const expectedMetric =
      commodityFile.commoditySlug === "panas-bumi"
        ? "installed_capacity"
        : "mine_production";

    commodityFile.globalStatisticSets.forEach((statisticSet, index) => {
      if (statisticSet.metricCode !== expectedMetric) {
        context.addIssue({
          code: "custom",
          message: `${commodityFile.commoditySlug} wajib memakai metricCode ${expectedMetric}`,
          path: ["globalStatisticSets", index, "metricCode"],
        });
      }
    });

    const resourceKeys = commodityFile.resourceStatistics.map((statistic) =>
      [
        statistic.statisticYear,
        statistic.statisticType,
        statistic.materialBasis ?? "null",
        statistic.recordType,
      ].join(":"),
    );

    addDuplicateIssues(
      resourceKeys,
      (index) => ["resourceStatistics", index, "statisticType"],
      "Natural key resource statistic",
      context,
    );

    addDuplicateIssues(
      commodityFile.productionLocations.map((location) => location.regionSlug),
      (index) => ["productionLocations", index, "regionSlug"],
      "Region slug",
      context,
    );

    addDuplicateIssues(
      commodityFile.producers.map((producer) => producer.producerKey),
      (index) => ["producers", index, "producerKey"],
      "Producer key",
      context,
    );

    addDuplicateIssues(
      commodityFile.producers.map((producer) => String(producer.displayOrder)),
      (index) => ["producers", index, "displayOrder"],
      "Display order produsen",
      context,
    );
  });

export type CommodityImportManifest = z.infer<
  typeof commodityImportManifestSchema
>;

export type CommodityImportFile = z.infer<typeof commodityImportFileSchema>;

export type CommoditySourceReference = z.infer<
  typeof sourceKeyReferenceSchema
>;

export type CommoditySupportingSourceReference = z.infer<
  typeof commoditySupportingSourceReferenceSchema
>;
