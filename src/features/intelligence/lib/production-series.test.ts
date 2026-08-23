import { describe, expect, it } from "vitest";

import {
  calculateProductionStatistics,
  getProductionCitations,
  transformProductionRecords,
} from "./production-series";
import type {
  ProductionRecordType,
  PublicProductionRecord,
} from "../types/production";

function createRecord({
  year,
  value,
  recordType,
  unitCode = "million_ton",
}: {
  year: number;
  value: number;
  recordType: ProductionRecordType;
  unitCode?: string;
}): PublicProductionRecord {
  return {
    commodity: {
      name: "Batubara",
      slug: "batubara",
      symbol: null,
    },
    year,
    value,
    unit: {
      code: unitCode,
      name: unitCode === "million_ton" ? "Juta Ton" : "Ton",
      symbol: unitCode === "million_ton" ? "juta ton" : "ton",
    },
    recordType,
    sources: [],
  };
}

describe("transformProductionRecords", () => {
  it("memisahkan projection dan memilih revised sebagai historis utama", () => {
    const points = transformProductionRecords([
      createRecord({ year: 2023, value: 10, recordType: "actual" }),
      createRecord({ year: 2023, value: 12, recordType: "revised" }),
      createRecord({ year: 2024, value: 14, recordType: "projection" }),
    ]);

    expect(points).toEqual([
      {
        year: 2023,
        historical: 12,
        historicalType: "revised",
        projection: null,
      },
      {
        year: 2024,
        historical: null,
        historicalType: null,
        projection: 14,
      },
    ]);
  });
});

describe("calculateProductionStatistics", () => {
  it("menghitung statistik hanya dari record historis", () => {
    const statistics = calculateProductionStatistics([
      createRecord({ year: 2022, value: 10, recordType: "actual" }),
      createRecord({ year: 2023, value: 20, recordType: "revised" }),
      createRecord({ year: 2024, value: 100, recordType: "projection" }),
    ]);

    expect(statistics).toMatchObject({
      latestYear: 2023,
      latestValue: 20,
      averageValue: 15,
      changePercentage: 100,
      historicalCount: 2,
      projectionCount: 1,
    });
  });

  it("menolak penggabungan record dengan satuan berbeda", () => {
    const statistics = calculateProductionStatistics([
      createRecord({ year: 2022, value: 10, recordType: "actual" }),
      createRecord({
        year: 2023,
        value: 20,
        recordType: "actual",
        unitCode: "ton",
      }),
    ]);

    expect(statistics).toBeNull();
  });
});

describe("getProductionCitations", () => {
  it("menghapus citation duplikat dan mendahulukan sumber utama", () => {
    const supportingRecord = createRecord({
      year: 2022,
      value: 10,
      recordType: "actual",
    });
    const primaryRecord = createRecord({
      year: 2023,
      value: 20,
      recordType: "actual",
    });

    supportingRecord.sources = [
      {
        label: "Laporan pendukung",
        pageReference: null,
        url: null,
        isPrimary: false,
        source: {
          name: "Sumber B",
          slug: "sumber-b",
          organization: "Organisasi B",
        },
      },
    ];
    primaryRecord.sources = [
      ...supportingRecord.sources,
      {
        label: "Laporan utama",
        pageReference: "Halaman 10",
        url: "https://example.com/report",
        isPrimary: true,
        source: {
          name: "Sumber A",
          slug: "sumber-a",
          organization: "Organisasi A",
        },
      },
    ];

    const citations = getProductionCitations([
      supportingRecord,
      primaryRecord,
    ]);

    expect(citations).toHaveLength(2);
    expect(citations[0]?.isPrimary).toBe(true);
  });
});
