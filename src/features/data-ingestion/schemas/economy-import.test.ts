import { describe, expect, it } from "vitest";

import {
  economyExportsFileSchema,
  economyGdpFileSchema,
  economyInvestmentFileSchema,
} from "./economy-import";

const exportRecord = {
  year: 2021,
  commoditySlug: "emas",
  sourceCommodityLabel: "Bijih Emas",
  hsCode: null,
  productForm: null,
  originRegionSlug: "indonesia",
  destinationCountryCode: null,
  destinationRegionSlug: null,
  coverageType: "destination_country" as const,
  netWeightValue: null,
  netWeightUnitCode: null,
  netWeightScale: null,
  fobValue: null,
  currencyCode: "USD" as const,
  fobValueScale: null,
  availability: "not_reported" as const,
  dataStatus: "final" as const,
  recordType: "actual" as const,
  sourcePublishedAt: null,
  sourceSlugs: ["bps"],
  verificationStatus: "pending" as const,
  publicationStatus: "draft" as const,
  methodologyNotes: "Formula sumber tidak menghasilkan nilai yang sah.",
  holdReason: "Payload numerik tidak tersedia.",
};

describe("kontrak staging Economy", () => {
  it("mempertahankan not_reported sebagai null, bukan nol", () => {
    const result = economyExportsFileSchema.safeParse({
      schemaVersion: "1.0",
      dataset: "exports",
      expectedExistingSourcePublishedAtByYear: {
        "2019": "2020-07-06",
        "2020": "2021-07-06",
        "2021": "2022-07-06",
        "2022": "2023-07-07",
        "2023": "2024-07-05",
        "2024": "2025-07-07",
        "2025": "2026-02-27",
      },
      records: [exportRecord],
    });
    expect(result.success).toBe(true);
  });

  it("menolak not_reported dengan payload numerik", () => {
    const result = economyExportsFileSchema.safeParse({
      schemaVersion: "1.0",
      dataset: "exports",
      expectedExistingSourcePublishedAtByYear: {
        "2019": "2020-07-06",
        "2020": "2021-07-06",
        "2021": "2022-07-06",
        "2022": "2023-07-07",
        "2023": "2024-07-05",
        "2024": "2025-07-07",
        "2025": "2026-02-27",
      },
      records: [{ ...exportRecord, netWeightValue: "0" }],
    });
    expect(result.success).toBe(false);
  });

  it("menolak reported tanpa unit dan tujuan lengkap", () => {
    const result = economyExportsFileSchema.safeParse({
      schemaVersion: "1.0",
      dataset: "exports",
      expectedExistingSourcePublishedAtByYear: {
        "2019": "2020-07-06",
        "2020": "2021-07-06",
        "2021": "2022-07-06",
        "2022": "2023-07-07",
        "2023": "2024-07-05",
        "2024": "2025-07-07",
        "2025": "2026-02-27",
      },
      records: [{ ...exportRecord, availability: "reported", netWeightValue: "10", fobValue: "2" }],
    });
    expect(result.success).toBe(false);
  });

  it("menolak reported_zero ketika salah satu payload masih nonzero", () => {
    const result = economyExportsFileSchema.safeParse({
      schemaVersion: "1.0",
      dataset: "exports",
      expectedExistingSourcePublishedAtByYear: {
        "2019": "2020-07-06",
        "2020": "2021-07-06",
        "2021": "2022-07-06",
        "2022": "2023-07-07",
        "2023": "2024-07-05",
        "2024": "2025-07-07",
        "2025": "2026-02-27",
      },
      records: [{
        ...exportRecord,
        destinationCountryCode: "JP",
        destinationRegionSlug: "jepang",
        netWeightValue: "0",
        netWeightUnitCode: "metric_ton",
        netWeightScale: "unit",
        fobValue: "30.5",
        fobValueScale: "thousand",
        availability: "reported_zero",
      }],
    });
    expect(result.success).toBe(false);
  });

  it("menerima HS code sebagai string dan product form terstruktur", () => {
    const result = economyExportsFileSchema.safeParse({
      schemaVersion: "1.0",
      dataset: "exports",
      expectedExistingSourcePublishedAtByYear: {
        "2019": "2020-07-06",
        "2020": "2021-07-06",
        "2021": "2022-07-06",
        "2022": "2023-07-07",
        "2023": "2024-07-05",
        "2024": "2025-07-07",
        "2025": "2026-02-27",
      },
      records: [{
        ...exportRecord,
        hsCode: "26030000",
        productForm: "concentrate",
        destinationCountryCode: "JP",
        destinationRegionSlug: "jepang",
        netWeightValue: "10.25",
        netWeightUnitCode: "metric_ton",
        netWeightScale: "unit",
        fobValue: "30.5",
        fobValueScale: "thousand",
        availability: "reported",
      }],
    });
    expect(result.success).toBe(true);
  });

  it("menolak angka tampilan dan object dengan unknown key", () => {
    const result = economyInvestmentFileSchema.safeParse({
      schemaVersion: "1.0",
      dataset: "investment",
      records: [{ investmentValue: "24,1T" }],
      extra: true,
    });
    expect(result.success).toBe(false);
  });

  it("mengunci label PDB sebagai perubahan nominal ADHB", () => {
    const result = economyGdpFileSchema.safeParse({
      schemaVersion: "1.0",
      dataset: "gdp",
      publicMetricLabel: "Pertumbuhan ekonomi",
      records: [],
    });
    expect(result.success).toBe(false);
  });
});
