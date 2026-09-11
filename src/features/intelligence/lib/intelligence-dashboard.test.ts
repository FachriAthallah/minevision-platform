import { describe, expect, it } from "vitest";

import type {
  PublicIntelligenceCoverage,
  PublicIntelligenceLocation,
  PublicIntelligencePrice,
  PublicIntelligenceProduction,
} from "../types/dashboard";
import {
  calculateObservationChange,
  getCoverageMapState,
  getCoverageOpacity,
  getActiveObservation,
  getMappableLocations,
  getNextOptionIndex,
  getPriceTrend,
  getPriceYear,
  getProductionTrend,
  intelligenceSelectionReducer,
  resolveYear,
} from "./intelligence-dashboard";
import type { IntelligenceSelectionState } from "./intelligence-dashboard";

const production = (year: number, value: number): PublicIntelligenceProduction => ({
  id: String(year),
  year,
  value,
  recordType: "actual",
  unit: { code: "t", name: "Ton", symbol: "ton" },
  sources: [],
});

const price = (year: number, value: number): PublicIntelligencePrice => ({
  id: String(year),
  effectiveDate: `${year}-12-31`,
  period: "annual",
  periodLabel: String(year),
  value,
  currencyCode: "USD",
  recordType: "actual",
  standard: { code: "HBA", name: "Harga Batubara Acuan" },
  unit: { code: "t", name: "Ton", symbol: "ton" },
  source: { name: "ESDM", slug: "esdm", organization: "ESDM", url: null },
});

describe("Intelligence dashboard interaction state", () => {
  it("switches commodity and tab without mixing production and price years", () => {
    let state: IntelligenceSelectionState = { commodity: "batubara", tab: "production", productionYears: {}, priceYears: {} };
    state = intelligenceSelectionReducer(state, { type: "year", tab: "production", commodity: "batubara", value: "2024" });
    state = intelligenceSelectionReducer(state, { type: "tab", value: "price" });
    state = intelligenceSelectionReducer(state, { type: "year", tab: "price", commodity: "batubara", value: "2023" });
    state = intelligenceSelectionReducer(state, { type: "commodity", value: "nikel" });

    expect(state).toMatchObject({ commodity: "nikel", tab: "price" });
    expect(state.productionYears).toEqual({ batubara: "2024" });
    expect(state.priceYears).toEqual({ batubara: "2023" });
  });

  it("supports wrapped keyboard navigation", () => {
    expect(getNextOptionIndex(0, "previous", 7)).toBe(6);
    expect(getNextOptionIndex(6, "next", 7)).toBe(0);
  });
});

describe("Intelligence observations", () => {
  it("does not create missing years or turn them into zero", () => {
    const trend = getProductionTrend([production(2019, 10), production(2021, 30)]);
    expect(trend.map((item) => item.year)).toEqual([2019, 2021]);
    expect(trend.some((item) => item.year === 2020)).toBe(false);
  });

  it("uses the active year and previous available observation for statistics", () => {
    const trend = getProductionTrend([production(2019, 10), production(2021, 30)]);
    const active = getActiveObservation(trend, 2021, (item) => item.year);
    expect(active?.value).toBe(30);
    expect(calculateObservationChange(trend, active)).toBe(200);
    expect(resolveYear("2020", trend.map((item) => item.year))).toBe("all");
  });

  it("keeps price years deterministic", () => {
    const trend = getPriceTrend([price(2024, 121.44), price(2022, 276.58)]);
    expect(trend.map(getPriceYear)).toEqual([2022, 2024]);
  });
});

describe("Intelligence map markers", () => {
  const location = (
    accuracy: PublicIntelligenceLocation["locationAccuracy"],
    latitude: number | null,
    longitude: number | null = latitude === null ? null : 110,
  ): PublicIntelligenceLocation => ({
    id: accuracy,
    siteSlug: `site-${accuracy}`,
    siteName: "Lokasi",
    siteType: "mine",
    region: { id: "region-id", code: null, name: "Wilayah", slug: "wilayah", level: "province" },
    companyName: null,
    latitude,
    longitude,
    locationAccuracy: accuracy,
    operationStatus: "operating",
    isPrimary: false,
    notes: null,
    source: { name: "Sumber", slug: "sumber", organization: "Org", url: null },
  });

  it("only creates markers for complete non-centroid coordinates", () => {
    expect(getMappableLocations([
      location("exact", -6),
      location("unknown", -7),
      location("regency_centroid", -8),
      location("approximate", null),
      location("exact", -6, null),
      location("exact", 91, 110),
      location("exact", -6, 181),
    ])).toHaveLength(1);
  });
});

describe("Intelligence coverage map", () => {
  const coverage = (
    id: string,
    commoditySlug: PublicIntelligenceCoverage["commoditySlug"],
    code: string | null,
    level = "province",
  ): PublicIntelligenceCoverage => ({
    id,
    commoditySlug,
    region: {
      id: `region-${id}`,
      code,
      name: id,
      slug: id,
      level,
    },
    coverageType: "known_occurrence",
    productionValue: null,
    productionYear: null,
    unitCode: null,
    rank: null,
    rankingStatus: "unavailable",
    relatedCompanyName: null,
    notes: null,
    verificationStatus: "verified",
    publicationStatus: "published",
    source: null,
  });

  const allCoverage = [
    coverage("nikel-sultra", "nikel", "ID-SG"),
    coverage("nikel-sulteng", "nikel", "ID-ST"),
    coverage("emas-papua", "emas", "ID-PT"),
    coverage("nikel-kabupaten", "nikel", "74.01", "regency"),
  ];

  it("matches province polygons by stable region code", () => {
    const state = getCoverageMapState(allCoverage, null, "nikel");
    expect(state.regionCodes).toEqual(["ID-SG", "ID-ST"]);
    expect(state.renderable.map((item) => item.id)).toEqual([
      "nikel-sultra",
      "nikel-sulteng",
    ]);
  });

  it("does not mix coverage from another commodity and updates on switch", () => {
    expect(getCoverageMapState(allCoverage, null, "nikel").regionCodes).toEqual([
      "ID-SG",
      "ID-ST",
    ]);
    expect(getCoverageMapState(allCoverage, null, "emas").regionCodes).toEqual([
      "ID-PT",
    ]);
  });

  it("resolves selected polygon and gives it a stronger opacity", () => {
    const state = getCoverageMapState(
      allCoverage,
      "nikel-sulteng",
      "nikel",
    );
    expect(state.activeRegionCode).toBe("ID-ST");
    expect(getCoverageOpacity("nikel-sulteng", "nikel-sulteng")).toBe(0.7);
    expect(getCoverageOpacity("nikel-sultra", "nikel-sulteng")).toBe(0.38);
  });
});
