import { describe, expect, it } from "vitest";

import type { ValidatedCommodityImport } from "./validate-commodity-import";
import {
  collectCommodityPreflightRequirements,
  evaluateCommodityPreflight,
  type CommodityPreflightDatabaseState,
  type CommodityPreflightRequirements,
} from "./preflight-commodity-import";

function createRequirements(): CommodityPreflightRequirements {
  return {
    commoditySlugs: ["nikel"],
    unitCodes: ["metric_ton"],
    provinceRegionSlugs: ["sulawesi-tenggara"],
    industryCompanySlugs: [],
    sourceCatalog: [
      {
        slug: "esdm-neraca-2025",
        name: "Neraca 2025",
        type: "government",
        organization: "Kementerian ESDM",
        url: "https://example.com/neraca",
        description: null,
        isOfficial: true,
        verificationStatus: "verified",
      },
    ],
    countryCatalog: [
      { code: "ID", name: "Indonesia", slug: "indonesia" },
    ],
    profiles: [{ commoditySlug: "nikel", contentSlug: "nikel" }],
  };
}

function createDatabaseState(): CommodityPreflightDatabaseState {
  return {
    activeCommoditySlugs: ["nikel"],
    activeUnitCodes: ["metric_ton"],
    regions: [
      {
        id: "province-id",
        slug: "sulawesi-tenggara",
        code: "ID-SG",
        level: "province",
        isActive: true,
      },
    ],
    sources: [],
    activeIndustryCompanySlugs: [],
    commodityContents: [],
    primaryContentLinks: [],
  };
}

describe("collectCommodityPreflightRequirements", () => {
  it("mengumpulkan unit, region, dan relasi opsional secara unik", () => {
    const validatedImport = {
      manifest: {
        sourceCatalog: [],
        countryCatalog: [],
      },
      commodityFiles: [
        {
          filePath: "commodities/panas-bumi.json",
          data: {
            commoditySlug: "panas-bumi",
            profile: { slug: "panas-bumi" },
            resourceStatistics: [
              { unitCode: "megawatt" },
              { unitCode: "count" },
            ],
            globalStatisticSets: [{ unitCode: "megawatt" }],
            productionLocations: [
              { regionSlug: "jawa-barat" },
              { regionSlug: "jawa-barat" },
            ],
            producers: [
              {
                primaryRegionSlug: "jawa-tengah",
                industryCompanySlug: "pertamina-geothermal-energy",
              },
            ],
          },
        },
      ],
    } as unknown as ValidatedCommodityImport;

    const requirements =
      collectCommodityPreflightRequirements(validatedImport);

    expect(requirements.unitCodes).toEqual(["count", "megawatt"]);
    expect(requirements.provinceRegionSlugs).toEqual([
      "jawa-barat",
      "jawa-tengah",
    ]);
    expect(requirements.industryCompanySlugs).toEqual([
      "pertamina-geothermal-energy",
    ]);
  });
});

describe("evaluateCommodityPreflight", () => {
  it("menerima referensi wajib dan merencanakan source/country/profile baru", () => {
    const report = evaluateCommodityPreflight(
      createRequirements(),
      createDatabaseState(),
    );

    expect(report.passed).toBe(true);
    expect(report.plan.sourcesToCreate).toEqual(["esdm-neraca-2025"]);
    expect(report.plan.countriesToCreate).toEqual(["indonesia"]);
    expect(report.plan.profilesToCreate).toEqual(["nikel"]);
  });

  it("menolak commodity dan unit aktif yang hilang", () => {
    const databaseState = createDatabaseState();
    databaseState.activeCommoditySlugs = [];
    databaseState.activeUnitCodes = [];

    const report = evaluateCommodityPreflight(
      createRequirements(),
      databaseState,
    );

    expect(report.passed).toBe(false);
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ category: "commodity", key: "nikel" }),
        expect.objectContaining({ category: "unit", key: "metric_ton" }),
      ]),
    );
  });

  it("menolak region lokasi yang bukan provinsi aktif", () => {
    const databaseState = createDatabaseState();
    databaseState.regions[0] = {
      ...databaseState.regions[0],
      level: "country",
      isActive: false,
    };

    const report = evaluateCommodityPreflight(
      createRequirements(),
      databaseState,
    );

    expect(report.issues).toContainEqual(
      expect.objectContaining({
        category: "province",
        key: "sulawesi-tenggara",
      }),
    );
  });

  it("menolak source slug dengan identitas berbeda", () => {
    const databaseState = createDatabaseState();
    databaseState.sources = [
      {
        slug: "esdm-neraca-2025",
        name: "Sumber berbeda",
        organization: "Organisasi berbeda",
        type: "other",
        url: "https://example.com/lain",
      },
    ];

    const report = evaluateCommodityPreflight(
      createRequirements(),
      databaseState,
    );

    expect(report.issues).toContainEqual(
      expect.objectContaining({
        category: "source",
        key: "esdm-neraca-2025",
      }),
    );
  });

  it("menerima source yang sama meski URL hanya berbeda trailing slash", () => {
    const databaseState = createDatabaseState();
    databaseState.sources = [
      {
        slug: "esdm-neraca-2025",
        name: "Neraca 2025",
        organization: "Kementerian ESDM",
        type: "government",
        url: "https://example.com/neraca/",
      },
    ];

    const report = evaluateCommodityPreflight(
      createRequirements(),
      databaseState,
    );

    expect(report.passed).toBe(true);
    expect(report.plan.sourcesToUpdate).toEqual(["esdm-neraca-2025"]);
  });

  it("menolak benturan slug atau kode country region", () => {
    const databaseState = createDatabaseState();
    databaseState.regions.push({
      id: "country-id",
      slug: "negara-lain",
      code: "ID",
      level: "country",
      isActive: true,
    });

    const report = evaluateCommodityPreflight(
      createRequirements(),
      databaseState,
    );

    expect(report.issues).toContainEqual(
      expect.objectContaining({
        category: "country",
        key: "indonesia/ID",
      }),
    );
  });

  it("menolak relasi Industry opsional yang tidak tersedia", () => {
    const requirements = createRequirements();
    requirements.industryCompanySlugs = ["vale-indonesia"];

    const report = evaluateCommodityPreflight(
      requirements,
      createDatabaseState(),
    );

    expect(report.issues).toContainEqual(
      expect.objectContaining({
        category: "industry_company",
        key: "vale-indonesia",
      }),
    );
  });

  it("menolak content profile yang terhubung ke komoditas lain", () => {
    const databaseState = createDatabaseState();
    databaseState.commodityContents = [
      {
        id: "content-id",
        slug: "nikel",
        type: "commodity_profile",
        linkedCommoditySlug: "emas",
      },
    ];

    const report = evaluateCommodityPreflight(
      createRequirements(),
      databaseState,
    );

    expect(report.issues).toContainEqual(
      expect.objectContaining({ category: "content", key: "nikel" }),
    );
  });

  it("menolak primary content lama yang memakai slug berbeda", () => {
    const databaseState = createDatabaseState();
    databaseState.primaryContentLinks = [
      { commoditySlug: "nikel", contentSlug: "profil-nikel-lama" },
    ];

    const report = evaluateCommodityPreflight(
      createRequirements(),
      databaseState,
    );

    expect(report.issues).toContainEqual(
      expect.objectContaining({ category: "content", key: "nikel" }),
    );
  });
});
