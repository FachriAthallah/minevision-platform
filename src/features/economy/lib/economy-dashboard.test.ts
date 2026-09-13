import { describe, expect, it } from "vitest";

import type { PublicSmelterFacility } from "@/features/intelligence/types/smelter";

import {
  getGdpTrend,
  getNextEconomySection,
  getPrimarySmelterOutputs,
  getSmelterCommoditySummary,
  resolveEconomySection,
  resolveGdpYear,
} from "./economy-dashboard";
import type { PublicGdpRecord } from "../types/gdp";

function gdp(year: number): PublicGdpRecord {
  return {
    id: String(year),
    region: { code: "IDN", name: "Indonesia" },
    year,
    priceBasis: "current_prices",
    baseYear: null,
    nationalGdpValue: 100,
    miningQuarryingGdpValue: 10,
    contributionPercentage: 10,
    nominalYoyChangePercentage: null,
    currencyCode: "IDR",
    valueScale: "billion",
    dataStatus: "final",
    recordType: "actual",
    sourcePublishedAt: null,
    sources: [],
  };
}

function smelter(): PublicSmelterFacility {
  return {
    id: "facility-1",
    facilityCode: "S001",
    name: "Fasilitas",
    slug: "fasilitas",
    facilityType: "smelter",
    currentStatus: "operating",
    operator: { name: "Operator", slug: "operator", websiteUrl: null },
    location: {
      province: "Maluku Utara",
      cityRegency: "Halmahera",
      address: null,
      latitude: null,
      longitude: null,
    },
    operationTimeline: {
      reportedOperationYear: null,
      constructionYear: null,
      commissioningYear: null,
      commercialOperationYear: null,
    },
    outputs: [
      {
        commodity: { name: "Nikel", slug: "nikel", symbol: "Ni" },
        inputMaterial: "Bijih nikel",
        outputProduct: "Nickel pig iron",
        processType: null,
        inputCapacity: null,
        outputCapacity: { value: 100, unitCode: "t" },
        capacityReferenceYear: 2025,
        isPrimary: true,
      },
      {
        commodity: { name: "Nikel", slug: "nikel", symbol: "Ni" },
        inputMaterial: "Bijih nikel",
        outputProduct: "Produk samping",
        processType: null,
        inputCapacity: null,
        outputCapacity: { value: 25, unitCode: "t" },
        capacityReferenceYear: 2025,
        isPrimary: false,
      },
    ],
    sources: [],
    updatedAt: "2026-09-12T00:00:00.000Z",
  };
}

describe("Economy dashboard helpers", () => {
  it("resolves sections and supports wrapped keyboard navigation", () => {
    expect(resolveEconomySection("exports")).toBe("exports");
    expect(resolveEconomySection("unknown")).toBe("gdp");
    expect(getNextEconomySection("gdp", "previous")).toBe("regulations");
    expect(getNextEconomySection("regulations", "next")).toBe("gdp");
  });

  it("orders PDB and only selects a year that really exists", () => {
    const records = [gdp(2025), gdp(2019), gdp(2024)];
    expect(getGdpTrend(records).map((record) => record.year)).toEqual([
      2019,
      2024,
      2025,
    ]);
    expect(resolveGdpYear(2024, records)).toBe(2024);
    expect(resolveGdpYear(2020, records)).toBe(2025);
  });

  it("does not double-count non-primary smelter outputs", () => {
    const facilities = [smelter()];
    expect(getPrimarySmelterOutputs(facilities)).toHaveLength(1);
    expect(getSmelterCommoditySummary(facilities)).toEqual([
      {
        slug: "nikel",
        name: "Nikel",
        facilityCount: 1,
        primaryCapacity: [
          {
            outputProduct: "Nickel pig iron",
            value: 100,
            unitCode: "t",
          },
        ],
      },
    ]);
  });
});
