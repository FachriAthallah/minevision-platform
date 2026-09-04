import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  commodityDecimalStringSchema,
  commodityImportFileSchema,
  commodityImportManifestSchema,
  REQUIRED_COMMODITY_SLUGS,
  type CommodityImportFile,
  type CommodityImportManifest,
} from "./commodity-import";
import { validateCommodityImport } from "../services/validate-commodity-import";

type CommoditySlug = (typeof REQUIRED_COMMODITY_SLUGS)[number];

const sourceReference = {
  sourceSlug: "source-primary",
  citationLabel: "Sumber utama",
  sourceUrl: "https://example.com/source",
  pageReference: null,
};

const primarySourceReference = {
  sourceSlug: sourceReference.sourceSlug,
  sourceUrl: sourceReference.sourceUrl,
  pageReference: sourceReference.pageReference,
};

function createValidManifest(): CommodityImportManifest {
  return {
    schemaVersion: "1.0",
    datasetName: "MineVision Commodity Dataset",
    description: null,
    effectiveDate: "2026-09-03",
    commodityFiles: REQUIRED_COMMODITY_SLUGS.map((commoditySlug) => ({
      commoditySlug,
      filePath: `commodities/${commoditySlug}.json`,
    })),
    sourceCatalog: [
      {
        slug: "source-primary",
        name: "Sumber Primer",
        type: "government",
        organization: "Institusi Resmi",
        url: "https://example.com/source",
        description: null,
        isOfficial: true,
        verificationStatus: "verified",
      },
    ],
    countryCatalog: Array.from({ length: 5 }, (_, index) => ({
      code: `A${String.fromCharCode(65 + index)}`,
      name: `Negara ${index + 1}`,
      slug: `negara-${index + 1}`,
    })),
  };
}

function createValidCommodityFile(
  commoditySlug: CommoditySlug = "nikel",
): CommodityImportFile {
  return {
    schemaVersion: "1.0",
    commoditySlug,
    commodity: {
      description: `Deskripsi ${commoditySlug}`,
      specification: `Spesifikasi ${commoditySlug}`,
      image: null,
    },
    profile: {
      title: `Profil ${commoditySlug}`,
      slug: commoditySlug,
      excerpt: `Ringkasan ${commoditySlug}`,
      body: `# ${commoditySlug}\n\nKonten profil komoditas.`,
      readingTimeMinutes: 5,
      isFeatured: false,
      publicationStatus: "published",
      publishedAt: "2026-09-03T10:00:00+07:00",
      sources: [
        {
          sourceSlug: sourceReference.sourceSlug,
          citationLabel: sourceReference.citationLabel,
          pageReference: sourceReference.pageReference,
        },
      ],
    },
    resourceStatistics: [
      {
        statisticYear: 2025,
        statisticType: "reserve",
        materialBasis: "ore",
        availabilityStatus: "reported",
        value: "27358862495",
        unitCode: "tonne",
        recordType: "actual",
        primarySource: { sourceSlug: sourceReference.sourceSlug },
        supportingSources: [],
        verificationStatus: "verified",
        publicationStatus: "published",
        notes: null,
      },
    ],
    productionLocations: [
      {
        regionSlug: "jawa-timur",
        locationDetail: "Wilayah operasi utama",
        recordType: "actual",
        primarySource: { sourceSlug: sourceReference.sourceSlug },
        verificationStatus: "verified",
        publicationStatus: "published",
        notes: null,
      },
    ],
    globalStatisticSets: [
      {
        statisticYear: 2025,
        metricCode:
          commoditySlug === "panas-bumi"
            ? "installed_capacity"
            : "mine_production",
        basisCode: "official_reported_value",
        unitCode: commoditySlug === "panas-bumi" ? "megawatt" : "tonne",
        availabilityStatus: "reported",
        recordType: "actual",
        primarySource: { ...primarySourceReference },
        supportingSources: [],
        entries: Array.from({ length: 5 }, (_, index) => ({
          countryRegionSlug: `negara-${index + 1}`,
          rank: index + 1,
          value: String(5_000_000 - index * 500_000),
          notes: null,
        })),
        verificationStatus: "verified",
        publicationStatus: "published",
        notes: null,
      },
    ],
    producers: [
      {
        producerKey: `${commoditySlug}-producer-1`,
        companyName: "Produsen Utama",
        industryCompanySlug: null,
        operationArea: "Indonesia",
        primaryRegionSlug: null,
        producerRole: null,
        displayOrder: 0,
        primarySource: { ...primarySourceReference },
        isActive: true,
        verificationStatus: "verified",
        publicationStatus: "published",
        notes: null,
      },
    ],
  };
}

function expectIssuePath(
  result: ReturnType<typeof commodityImportFileSchema.safeParse>,
  expectedPath: string,
) {
  expect(result.success).toBe(false);

  if (result.success) {
    throw new Error("Input seharusnya tidak valid");
  }

  expect(result.error.issues.map((issue) => issue.path.join("."))).toContain(
    expectedPath,
  );
}

function writeValidDataset(rootDirectory: string) {
  const manifest = createValidManifest();
  const manifestPath = resolve(rootDirectory, "manifest.json");

  for (const entry of manifest.commodityFiles) {
    const filePath = resolve(rootDirectory, entry.filePath);
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(
      filePath,
      JSON.stringify(createValidCommodityFile(entry.commoditySlug)),
      "utf8",
    );
  }

  writeFileSync(manifestPath, JSON.stringify(manifest), "utf8");

  return { manifest, manifestPath };
}

function runValidator(manifestPath: string) {
  const scriptPath = resolve(
    process.cwd(),
    "scripts/validate-commodity-import.ts",
  );

  return spawnSync(
    process.execPath,
    ["--import", "tsx", scriptPath, manifestPath],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );
}

describe("commodityImportManifestSchema", () => {
  it("menerima manifest valid dengan tepat 23 komoditas", () => {
    expect(commodityImportManifestSchema.safeParse(createValidManifest()).success)
      .toBe(true);
  });

  it("menolak manifest yang kehilangan satu komoditas", () => {
    const manifest = createValidManifest();
    manifest.commodityFiles.pop();

    expect(commodityImportManifestSchema.safeParse(manifest).success).toBe(
      false,
    );
  });

  it("menolak slug dan file path manifest yang duplikat dengan path presisi", () => {
    const manifest = createValidManifest();
    manifest.commodityFiles[1] = { ...manifest.commodityFiles[0] };

    const result = commodityImportManifestSchema.safeParse(manifest);

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Manifest seharusnya tidak valid");
    }

    const paths = result.error.issues.map((issue) => issue.path.join("."));
    expect(paths).toContain("commodityFiles.1.commoditySlug");
    expect(paths).toContain("commodityFiles.1.filePath");
  });

  it("menolak file path yang tidak cocok dan path traversal", () => {
    const manifest = createValidManifest();
    manifest.commodityFiles[0].filePath = "../nikel.json";

    const result = commodityImportManifestSchema.safeParse(manifest);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join("."))).toContain(
        "commodityFiles.0.filePath",
      );
    }
  });

  it("menolak effectiveDate yang bukan tanggal kalender valid", () => {
    const manifest = {
      ...createValidManifest(),
      effectiveDate: "2026-02-30",
    };

    expect(commodityImportManifestSchema.safeParse(manifest).success).toBe(
      false,
    );
  });

  it.each([
    ["source slug", (manifest: CommodityImportManifest) => {
      manifest.sourceCatalog[0].slug = "a".repeat(221);
    }, "sourceCatalog.0.slug"],
    ["source name", (manifest: CommodityImportManifest) => {
      manifest.sourceCatalog[0].name = "a".repeat(201);
    }, "sourceCatalog.0.name"],
    ["source organization", (manifest: CommodityImportManifest) => {
      manifest.sourceCatalog[0].organization = "a".repeat(201);
    }, "sourceCatalog.0.organization"],
    ["country name", (manifest: CommodityImportManifest) => {
      manifest.countryCatalog[0].name = "a".repeat(161);
    }, "countryCatalog.0.name"],
    ["country slug", (manifest: CommodityImportManifest) => {
      manifest.countryCatalog[0].slug = "a".repeat(181);
    }, "countryCatalog.0.slug"],
  ] as const)("menolak %s yang melebihi batas database", (_label, mutate, path) => {
    const manifest = createValidManifest();
    mutate(manifest);

    const result = commodityImportManifestSchema.safeParse(manifest);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join("."))).toContain(
        path,
      );
    }
  });
});

describe("commodityDecimalStringSchema", () => {
  it.each(["27358862495", "23741.35", "0", "1200000.500000"])(
    "menerima string angka presisi %s",
    (value) => {
      expect(commodityDecimalStringSchema.safeParse(value).success).toBe(true);
    },
  );

  it.each([27358862495, "27.358.862.495", "27.358,86", "-100", "2.7e10"])(
    "menolak representasi angka tidak valid %s",
    (value) => {
      expect(commodityDecimalStringSchema.safeParse(value).success).toBe(false);
    },
  );

  it("menerapkan batas tepat 24 digit integer dan 6 digit desimal", () => {
    expect(commodityDecimalStringSchema.safeParse("9".repeat(24)).success).toBe(
      true,
    );
    expect(commodityDecimalStringSchema.safeParse("9".repeat(25)).success).toBe(
      false,
    );
    expect(commodityDecimalStringSchema.safeParse("1.123456").success).toBe(
      true,
    );
    expect(commodityDecimalStringSchema.safeParse("1.1234567").success).toBe(
      false,
    );
  });
});

describe("commodityImportFileSchema", () => {
  it("menerima file komoditas lengkap", () => {
    expect(commodityImportFileSchema.safeParse(createValidCommodityFile()).success)
      .toBe(true);
  });

  it("menolak ranking reported dengan kurang dari lima negara", () => {
    const commodityFile = createValidCommodityFile();
    commodityFile.globalStatisticSets[0].entries.pop();

    expect(commodityImportFileSchema.safeParse(commodityFile).success).toBe(
      false,
    );
  });

  it("memakai nama countryRegionSlug pada entry peringkat", () => {
    const commodityFile = createValidCommodityFile();
    const entry = commodityFile.globalStatisticSets[0].entries[0];

    expect(entry.countryRegionSlug).toBe("negara-1");
    expect(
      commodityImportFileSchema.safeParse({
        ...commodityFile,
        globalStatisticSets: [
          {
            ...commodityFile.globalStatisticSets[0],
            entries: [
              {
                ...entry,
                countryRegionSlug: undefined,
                countrySlug: "negara-1",
              },
              ...commodityFile.globalStatisticSets[0].entries.slice(1),
            ],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("menolak rank atau negara duplikat", () => {
    const duplicateRank = createValidCommodityFile();
    duplicateRank.globalStatisticSets[0].entries[1].rank = 1;

    const duplicateCountry = createValidCommodityFile();
    duplicateCountry.globalStatisticSets[0].entries[1].countryRegionSlug =
      duplicateCountry.globalStatisticSets[0].entries[0].countryRegionSlug;

    expectIssuePath(
      commodityImportFileSchema.safeParse(duplicateRank),
      "globalStatisticSets.0.entries.1.rank",
    );
    expectIssuePath(
      commodityImportFileSchema.safeParse(duplicateCountry),
      "globalStatisticSets.0.entries.1.countryRegionSlug",
    );
  });

  it("menerima source_unavailable tanpa sumber dan entries", () => {
    const commodityFile = createValidCommodityFile("batu-kapur");
    const statisticSet = commodityFile.globalStatisticSets[0];

    statisticSet.availabilityStatus = "source_unavailable";
    statisticSet.unitCode = null;
    statisticSet.primarySource = null;
    statisticSet.supportingSources = [];
    statisticSet.entries = [];

    expect(commodityImportFileSchema.safeParse(commodityFile).success).toBe(
      true,
    );
  });

  it("menolak source_unavailable yang masih memiliki entries", () => {
    const commodityFile = createValidCommodityFile("batu-kapur");
    const statisticSet = commodityFile.globalStatisticSets[0];

    statisticSet.availabilityStatus = "source_unavailable";
    statisticSet.unitCode = null;
    statisticSet.primarySource = null;
    statisticSet.supportingSources = [];

    expect(commodityImportFileSchema.safeParse(commodityFile).success).toBe(
      false,
    );
  });

  it("menolak panas bumi tanpa metric installed_capacity", () => {
    const commodityFile = createValidCommodityFile("panas-bumi");
    commodityFile.globalStatisticSets[0].metricCode = "mine_production";

    expect(commodityImportFileSchema.safeParse(commodityFile).success).toBe(
      false,
    );
  });

  it("menolak production location duplikat", () => {
    const commodityFile = createValidCommodityFile();
    commodityFile.productionLocations.push({
      ...commodityFile.productionLocations[0],
    });

    expect(commodityImportFileSchema.safeParse(commodityFile).success).toBe(
      false,
    );
  });

  it("menolak source profil duplikat sesuai primary key content_sources", () => {
    const commodityFile = createValidCommodityFile();
    commodityFile.profile.sources.push({ ...commodityFile.profile.sources[0] });

    expectIssuePath(
      commodityImportFileSchema.safeParse(commodityFile),
      "profile.sources.1.sourceSlug",
    );
  });

  it("menolak supporting source identik sesuai unique index junction", () => {
    const commodityFile = createValidCommodityFile();
    const supportingSource = {
      ...sourceReference,
      sourceRole: "supporting" as const,
    };

    commodityFile.resourceStatistics[0].supportingSources = [
      supportingSource,
      { ...supportingSource },
    ];

    expectIssuePath(
      commodityImportFileSchema.safeParse(commodityFile),
      "resourceStatistics.0.supportingSources.1.sourceSlug",
    );

    const globalFile = createValidCommodityFile();
    globalFile.globalStatisticSets[0].supportingSources = [
      supportingSource,
      { ...supportingSource },
    ];
    expectIssuePath(
      commodityImportFileSchema.safeParse(globalFile),
      "globalStatisticSets.0.supportingSources.1.sourceSlug",
    );
  });

  it("mewajibkan sourceRole pada supporting source", () => {
    const commodityFile = createValidCommodityFile();
    const result = commodityImportFileSchema.safeParse({
      ...commodityFile,
      resourceStatistics: [
        {
          ...commodityFile.resourceStatistics[0],
          supportingSources: [{ ...sourceReference }],
        },
      ],
    });

    expectIssuePath(
      result,
      "resourceStatistics.0.supportingSources.0.sourceRole",
    );
  });

  it("memvalidasi state statistik resource reported dan non-reported", () => {
    const missingReportedValue = createValidCommodityFile();
    missingReportedValue.resourceStatistics[0].value = null;

    expectIssuePath(
      commodityImportFileSchema.safeParse(missingReportedValue),
      "resourceStatistics.0.value",
    );

    const validNotReported = createValidCommodityFile();
    validNotReported.resourceStatistics[0].availabilityStatus = "not_reported";
    validNotReported.resourceStatistics[0].value = null;
    validNotReported.resourceStatistics[0].unitCode = null;

    expect(commodityImportFileSchema.safeParse(validNotReported).success).toBe(
      true,
    );

    const invalidNotReported = createValidCommodityFile();
    invalidNotReported.resourceStatistics[0].availabilityStatus = "not_reported";

    expectIssuePath(
      commodityImportFileSchema.safeParse(invalidNotReported),
      "resourceStatistics.0.value",
    );

    const missingPrimarySource = createValidCommodityFile();
    missingPrimarySource.resourceStatistics[0].availabilityStatus =
      "not_reported";
    missingPrimarySource.resourceStatistics[0].value = null;
    missingPrimarySource.resourceStatistics[0].unitCode = null;
    Reflect.deleteProperty(
      missingPrimarySource.resourceStatistics[0],
      "primarySource",
    );
    expectIssuePath(
      commodityImportFileSchema.safeParse(missingPrimarySource),
      "resourceStatistics.0.primarySource",
    );
  });

  it("memvalidasi working_area_count dan installed_capacity", () => {
    const workingArea = createValidCommodityFile();
    workingArea.resourceStatistics[0] = {
      ...workingArea.resourceStatistics[0],
      statisticType: "working_area_count",
      materialBasis: null,
      value: "42.0",
      unitCode: "count",
    };

    expect(commodityImportFileSchema.safeParse(workingArea).success).toBe(true);

    workingArea.resourceStatistics[0].value = "42.5";
    expectIssuePath(
      commodityImportFileSchema.safeParse(workingArea),
      "resourceStatistics.0.value",
    );

    const installedCapacity = createValidCommodityFile("panas-bumi");
    installedCapacity.resourceStatistics[0] = {
      ...installedCapacity.resourceStatistics[0],
      statisticType: "installed_capacity",
      materialBasis: "ore",
      unitCode: "megawatt",
    };
    expectIssuePath(
      commodityImportFileSchema.safeParse(installedCapacity),
      "resourceStatistics.0.materialBasis",
    );
  });

  it("menolak natural key resource statistic yang duplikat", () => {
    const commodityFile = createValidCommodityFile();
    commodityFile.resourceStatistics.push({
      ...commodityFile.resourceStatistics[0],
    });

    expectIssuePath(
      commodityImportFileSchema.safeParse(commodityFile),
      "resourceStatistics.1.statisticType",
    );
  });

  it("mewajibkan tepat satu global statistic set", () => {
    const noSet = createValidCommodityFile();
    noSet.globalStatisticSets = [];
    expect(commodityImportFileSchema.safeParse(noSet).success).toBe(false);

    const twoSets = createValidCommodityFile();
    twoSets.globalStatisticSets.push({ ...twoSets.globalStatisticSets[0] });
    expect(commodityImportFileSchema.safeParse(twoSets).success).toBe(false);
  });

  it.each([
    ["unitCode", (file: CommodityImportFile) => {
      file.globalStatisticSets[0].unitCode = "tonne";
    }],
    ["primarySource", (file: CommodityImportFile) => {
      file.globalStatisticSets[0].primarySource = {
        ...primarySourceReference,
      };
    }],
    ["supportingSources", (file: CommodityImportFile) => {
      file.globalStatisticSets[0].supportingSources = [
        { ...sourceReference, sourceRole: "supporting" },
      ];
    }],
    ["entries", (file: CommodityImportFile) => {
      file.globalStatisticSets[0].entries = [
        {
          countryRegionSlug: "negara-1",
          rank: 1,
          value: "1",
          notes: null,
        },
      ];
    }],
  ] as const)("menolak source_unavailable yang masih memiliki %s", (_field, mutate) => {
    const commodityFile = createValidCommodityFile("batu-kapur");
    const statisticSet = commodityFile.globalStatisticSets[0];
    statisticSet.availabilityStatus = "source_unavailable";
    statisticSet.unitCode = null;
    statisticSet.primarySource = null;
    statisticSet.supportingSources = [];
    statisticSet.entries = [];
    mutate(commodityFile);

    expect(commodityImportFileSchema.safeParse(commodityFile).success).toBe(
      false,
    );
  });

  it("menolak lebih dari lima produsen", () => {
    const commodityFile = createValidCommodityFile();

    for (let index = 1; index <= 5; index += 1) {
      commodityFile.producers.push({
        ...commodityFile.producers[0],
        producerKey: `nikel-producer-${index + 1}`,
        displayOrder: index,
      });
    }

    expect(commodityImportFileSchema.safeParse(commodityFile).success).toBe(
      false,
    );
  });

  it("menerima produsen kosong serta menolak key/order duplikat dan URL non-HTTPS", () => {
    const emptyProducers = createValidCommodityFile();
    emptyProducers.producers = [];
    expect(commodityImportFileSchema.safeParse(emptyProducers).success).toBe(
      true,
    );

    const duplicates = createValidCommodityFile();
    duplicates.producers.push({ ...duplicates.producers[0] });
    const duplicateResult = commodityImportFileSchema.safeParse(duplicates);
    expectIssuePath(duplicateResult, "producers.1.producerKey");
    expectIssuePath(duplicateResult, "producers.1.displayOrder");

    const invalidUrl = createValidCommodityFile();
    invalidUrl.producers[0] = {
      ...invalidUrl.producers[0],
      primarySource: {
        ...invalidUrl.producers[0].primarySource,
        sourceUrl: "http://example.com/source",
      },
    };
    expect(commodityImportFileSchema.safeParse(invalidUrl).success).toBe(false);
  });

  it("menerapkan batas varchar dan integer pada profil serta produsen", () => {
    const longProducerKey = createValidCommodityFile();
    longProducerKey.producers[0].producerKey = "a".repeat(181);
    expectIssuePath(
      commodityImportFileSchema.safeParse(longProducerKey),
      "producers.0.producerKey",
    );

    const longRole = createValidCommodityFile();
    longRole.producers[0].producerRole = "a".repeat(61);
    expectIssuePath(
      commodityImportFileSchema.safeParse(longRole),
      "producers.0.producerRole",
    );

    const longTitle = createValidCommodityFile();
    longTitle.profile.title = "a".repeat(241);
    expectIssuePath(
      commodityImportFileSchema.safeParse(longTitle),
      "profile.title",
    );

    const excessiveOrder = createValidCommodityFile();
    excessiveOrder.producers[0].displayOrder = 2_147_483_648;
    expectIssuePath(
      commodityImportFileSchema.safeParse(excessiveOrder),
      "producers.0.displayOrder",
    );
  });

  it("menerapkan seluruh batas kolom referensi database", () => {
    const longUnit = createValidCommodityFile();
    longUnit.resourceStatistics[0].unitCode = "a".repeat(51);
    expectIssuePath(
      commodityImportFileSchema.safeParse(longUnit),
      "resourceStatistics.0.unitCode",
    );

    const longPage = createValidCommodityFile();
    longPage.resourceStatistics[0].primarySource.pageReference = "a".repeat(101);
    expectIssuePath(
      commodityImportFileSchema.safeParse(longPage),
      "resourceStatistics.0.primarySource.pageReference",
    );

    const longBasis = createValidCommodityFile();
    longBasis.globalStatisticSets[0].basisCode = "a".repeat(51);
    expectIssuePath(
      commodityImportFileSchema.safeParse(longBasis),
      "globalStatisticSets.0.basisCode",
    );

    const longCompany = createValidCommodityFile();
    longCompany.producers[0].companyName = "a".repeat(201);
    expectIssuePath(
      commodityImportFileSchema.safeParse(longCompany),
      "producers.0.companyName",
    );

    const longIndustrySlug = createValidCommodityFile();
    longIndustrySlug.producers[0].industryCompanySlug = "a".repeat(181);
    expectIssuePath(
      commodityImportFileSchema.safeParse(longIndustrySlug),
      "producers.0.industryCompanySlug",
    );

    const longRegionSlug = createValidCommodityFile();
    longRegionSlug.producers[0].primaryRegionSlug = "a".repeat(181);
    expectIssuePath(
      commodityImportFileSchema.safeParse(longRegionSlug),
      "producers.0.primaryRegionSlug",
    );

    const excessiveReadingTime = createValidCommodityFile();
    excessiveReadingTime.profile.readingTimeMinutes = 2_147_483_648;
    expectIssuePath(
      commodityImportFileSchema.safeParse(excessiveReadingTime),
      "profile.readingTimeMinutes",
    );
  });

  it("menolak unknown property pada strict schema", () => {
    const commodityFile = createValidCommodityFile();
    const result = commodityImportFileSchema.safeParse({
      ...commodityFile,
      unknownProperty: true,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.code === "unrecognized_keys"))
        .toBe(true);
    }
  });
});

describe("validateCommodityImport", () => {
  it("menerima seluruh file ketika referensi catalog tersedia", () => {
    const manifest = createValidManifest();
    const files = manifest.commodityFiles.map((entry) => ({
      filePath: entry.filePath,
      input: createValidCommodityFile(entry.commoditySlug),
    }));

    const result = validateCommodityImport(manifest, files);

    expect(result.success).toBe(true);
    expect(result.success && result.data.commodityFiles).toHaveLength(23);
  });

  it("menolak source dan country yang tidak tersedia di catalog", () => {
    const manifest = createValidManifest();
    const files = manifest.commodityFiles.map((entry) => ({
      filePath: entry.filePath,
      input: createValidCommodityFile(entry.commoditySlug),
    }));
    const firstFile = files[0].input;

    firstFile.profile.sources[0].sourceSlug = "source-tidak-dikenal";
    firstFile.globalStatisticSets[0].entries[0].countryRegionSlug =
      "negara-tidak-dikenal";

    const result = validateCommodityImport(manifest, files);

    expect(result.success).toBe(false);
    expect(
      !result.success && result.issues.some((issue) => issue.code === "unknown_source"),
    ).toBe(true);
    expect(
      !result.success && result.issues.some((issue) => issue.code === "unknown_country"),
    ).toBe(true);

    if (!result.success) {
      expect(
        result.issues.some(
          (issue) =>
            issue.path ===
            "globalStatisticSets.0.entries.0.countryRegionSlug",
        ),
      ).toBe(true);
    }
  });

  it("menolak commoditySlug file yang tidak cocok dengan manifest", () => {
    const manifest = createValidManifest();
    const files = manifest.commodityFiles.map((entry) => ({
      filePath: entry.filePath,
      input: createValidCommodityFile(entry.commoditySlug),
    }));
    files[0].input = createValidCommodityFile("emas");

    const result = validateCommodityImport(manifest, files);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          filePath: "commodities/nikel.json",
          path: "commoditySlug",
          code: "commodity_slug_mismatch",
        }),
      );
    }
  });

  it("menolak input file yang diberikan dua kali", () => {
    const manifest = createValidManifest();
    const files = manifest.commodityFiles.map((entry) => ({
      filePath: entry.filePath,
      input: createValidCommodityFile(entry.commoditySlug),
    }));
    files.push({ ...files[0] });

    const result = validateCommodityImport(manifest, files);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          filePath: "commodities/nikel.json",
          code: "duplicate_file_input",
        }),
      );
    }
  });
});

describe("Commodity validator CLI", () => {
  it("memvalidasi dataset lengkap dan mencetak ringkasan", () => {
    const directory = mkdtempSync(resolve(tmpdir(), "commodity-valid-"));

    try {
      const { manifestPath } = writeValidDataset(directory);
      const result = runValidator(manifestPath);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Dataset Commodity valid.");
      expect(result.stdout).toContain("Commodity : 23");
      expect(result.stdout).toContain("Sources   : 1");
      expect(result.stdout).toContain("Countries : 5");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("mengumpulkan JSON invalid dan file hilang dalam satu eksekusi", () => {
    const directory = mkdtempSync(resolve(tmpdir(), "commodity-invalid-"));

    try {
      const { manifest, manifestPath } = writeValidDataset(directory);
      const invalidPath = resolve(
        directory,
        manifest.commodityFiles[0].filePath,
      );
      const missingPath = resolve(
        directory,
        manifest.commodityFiles[1].filePath,
      );
      writeFileSync(invalidPath, "{invalid-json", "utf8");
      rmSync(missingPath);

      const result = runValidator(manifestPath);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("commodities/nikel.json");
      expect(result.stderr).toContain("[invalid_json]");
      expect(result.stderr).toContain("commodities/emas.json");
      expect(result.stderr).toContain("[file_read_error]");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("menolak target yang bukan regular file", () => {
    const directory = mkdtempSync(resolve(tmpdir(), "commodity-regular-"));

    try {
      const { manifest, manifestPath } = writeValidDataset(directory);
      const targetPath = resolve(
        directory,
        manifest.commodityFiles[0].filePath,
      );
      rmSync(targetPath);
      mkdirSync(targetPath);

      const result = runValidator(manifestPath);

      expect(result.status).toBe(1);
      expect(result.stderr).toContain("commodities/nikel.json");
      expect(result.stderr).toContain("[not_regular_file]");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
