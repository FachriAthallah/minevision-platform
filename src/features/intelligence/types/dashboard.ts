import type { DomesticPricePeriod, DomesticPriceRecordType } from "./domestic-price";
import type { ProductionRecordType, PublicProductionSource } from "./production";

export const intelligenceCommoditySlugs = [
  "batubara",
  "nikel",
  "emas",
  "tembaga",
  "timah",
  "bijih-besi",
  "bauksit",
] as const;

export type IntelligenceCommoditySlug =
  (typeof intelligenceCommoditySlugs)[number];

export type PublicIntelligenceSource = {
  name: string;
  slug: string;
  organization: string;
  url: string | null;
};

export type PublicIntelligenceProduction = {
  id: string;
  year: number;
  value: number;
  recordType: ProductionRecordType;
  unit: { code: string; name: string; symbol: string };
  sources: PublicProductionSource[];
};

export type PublicIntelligencePrice = {
  id: string;
  effectiveDate: string;
  period: DomesticPricePeriod;
  periodLabel: string | null;
  value: number;
  currencyCode: string;
  recordType: DomesticPriceRecordType;
  standard: { code: string; name: string };
  unit: { code: string; name: string; symbol: string };
  source: PublicIntelligenceSource;
};

export type PublicIntelligenceCoverage = {
  id: string;
  commoditySlug: IntelligenceCommoditySlug;
  region: {
    id: string;
    code: string | null;
    name: string;
    slug: string;
    level: string;
  };
  coverageType: "primary" | "secondary" | "known_occurrence" | "historical";
  productionValue: number | null;
  productionYear: number | null;
  unitCode: string | null;
  rank: number | null;
  rankingStatus: "verified" | "unverified" | "unavailable";
  relatedCompanyName: string | null;
  notes: string | null;
  verificationStatus: "verified";
  publicationStatus: "published";
  source: PublicIntelligenceSource | null;
};

export type PublicIntelligenceLocation = {
  id: string;
  siteSlug: string;
  siteName: string;
  siteType: string;
  region: {
    id: string;
    code: string | null;
    name: string;
    slug: string;
    level: string;
  };
  companyName: string | null;
  latitude: number | null;
  longitude: number | null;
  locationAccuracy: "exact" | "approximate" | "regency_centroid" | "unknown";
  operationStatus: string;
  isPrimary: boolean;
  notes: string | null;
  source: PublicIntelligenceSource;
};

export type PublicIntelligenceCommodity = {
  name: string;
  slug: IntelligenceCommoditySlug;
  symbol: string | null;
  description: string | null;
  displayOrder: number;
  production: PublicIntelligenceProduction[];
  prices: PublicIntelligencePrice[];
  coverage: PublicIntelligenceCoverage[];
  locations: PublicIntelligenceLocation[];
};

export type PublicIntelligenceDashboard = {
  commodities: PublicIntelligenceCommodity[];
  meta: {
    commodityCount: number;
    productionObservationCount: number;
    priceObservationCount: number;
    coverageRegionCount: number;
    mappableLocationCount: number;
  };
};

export type IntelligenceDashboardApiResponse =
  | { success: true; data: PublicIntelligenceDashboard }
  | {
      success: false;
      error: { code: string; message: string; details?: unknown };
    };
