import type {
  IntelligenceCommoditySlug,
  PublicIntelligenceCoverage,
  PublicIntelligenceLocation,
  PublicIntelligencePrice,
  PublicIntelligenceProduction,
} from "../types/dashboard";

export type IntelligenceTab = "production" | "price";
export type IntelligenceSelectionState = {
  commodity: string;
  tab: IntelligenceTab;
  productionYears: Record<string, string>;
  priceYears: Record<string, string>;
};

export type IntelligenceSelectionAction =
  | { type: "commodity"; value: string }
  | { type: "tab"; value: IntelligenceTab }
  | { type: "year"; tab: IntelligenceTab; commodity: string; value: string };

export function intelligenceSelectionReducer(
  state: IntelligenceSelectionState,
  action: IntelligenceSelectionAction,
): IntelligenceSelectionState {
  if (action.type === "commodity") return { ...state, commodity: action.value };
  if (action.type === "tab") return { ...state, tab: action.value };
  const target = action.tab === "production" ? "productionYears" : "priceYears";
  return {
    ...state,
    [target]: { ...state[target], [action.commodity]: action.value },
  };
}

const recordPriority = { revised: 4, actual: 3, provisional: 2, projection: 1 };

function choosePreferred<T extends { recordType: keyof typeof recordPriority }>(
  current: T | undefined,
  candidate: T,
): T {
  if (!current) return candidate;
  return recordPriority[candidate.recordType] > recordPriority[current.recordType]
    ? candidate
    : current;
}

export function getProductionTrend(records: PublicIntelligenceProduction[]) {
  const byYear = new Map<number, PublicIntelligenceProduction>();
  for (const record of records) {
    byYear.set(record.year, choosePreferred(byYear.get(record.year), record));
  }
  return [...byYear.values()].sort((a, b) => a.year - b.year);
}

export function getPriceYear(record: PublicIntelligencePrice): number {
  return Number(record.effectiveDate.slice(0, 4));
}

export function getPriceTrend(records: PublicIntelligencePrice[]) {
  const byYear = new Map<number, PublicIntelligencePrice>();
  for (const record of records) {
    const year = getPriceYear(record);
    byYear.set(year, choosePreferred(byYear.get(year), record));
  }
  return [...byYear.values()].sort(
    (a, b) => getPriceYear(a) - getPriceYear(b),
  );
}

export function resolveYear(
  selected: string | undefined,
  availableYears: number[],
): "all" | number {
  if (!selected || selected === "all") return "all";
  const year = Number(selected);
  return availableYears.includes(year) ? year : "all";
}

export function getActiveObservation<T>(
  records: T[],
  year: "all" | number,
  getYear: (record: T) => number,
): T | null {
  if (records.length === 0) return null;
  if (year === "all") return records[records.length - 1] ?? null;
  return records.find((record) => getYear(record) === year) ?? null;
}

export function calculateObservationChange<T extends { value: number }>(
  records: T[],
  active: T | null,
): number | null {
  if (!active) return null;
  const index = records.indexOf(active);
  if (index <= 0) return null;
  const previous = records[index - 1];
  if (!previous || previous.value === 0) return null;
  return ((active.value - previous.value) / previous.value) * 100;
}

export function createTrendInsight(
  label: string,
  year: number | null,
  change: number | null,
): string {
  if (year === null) return `${label} belum memiliki observation publik yang dapat dianalisis.`;
  if (change === null) return `${label} tahun ${year} tersedia, tetapi belum memiliki observasi sebelumnya yang sebanding.`;
  const magnitude = Math.abs(change).toLocaleString("id-ID", { maximumFractionDigits: 1 });
  if (change > 0) return `${label} tahun ${year} meningkat ${magnitude}% dibanding observasi sebelumnya yang tersedia.`;
  if (change < 0) return `${label} tahun ${year} menurun ${magnitude}% dibanding observasi sebelumnya yang tersedia.`;
  return `${label} tahun ${year} tidak berubah dibanding observasi sebelumnya yang tersedia.`;
}

export function getMappableLocations(locations: PublicIntelligenceLocation[]) {
  return locations.filter(
    (location) =>
      location.latitude !== null &&
      location.longitude !== null &&
      Number.isFinite(location.latitude) &&
      Number.isFinite(location.longitude) &&
      location.latitude >= -90 &&
      location.latitude <= 90 &&
      location.longitude >= -180 &&
      location.longitude <= 180 &&
      location.locationAccuracy !== "unknown" &&
      location.locationAccuracy !== "regency_centroid",
  );
}

export function getCoverageMapState(
  coverage: PublicIntelligenceCoverage[],
  activeCoverageId: string | null,
  commoditySlug: IntelligenceCommoditySlug,
) {
  const renderable = coverage.filter(
    (item) =>
      item.commoditySlug === commoditySlug &&
      item.region.level === "province" &&
      item.region.code !== null,
  );
  const regionCodes = [...new Set(renderable.map((item) => item.region.code!))];
  const activeRegionCode =
    renderable.find((item) => item.id === activeCoverageId)?.region.code ?? null;

  return { renderable, regionCodes, activeRegionCode };
}

export function getCoverageOpacity(
  coverageId: string,
  activeCoverageId: string | null,
) {
  return coverageId === activeCoverageId ? 0.7 : 0.38;
}

export function getNextOptionIndex(
  current: number,
  direction: "next" | "previous",
  length: number,
): number {
  if (length <= 0) return -1;
  return direction === "next"
    ? (current + 1) % length
    : (current - 1 + length) % length;
}
