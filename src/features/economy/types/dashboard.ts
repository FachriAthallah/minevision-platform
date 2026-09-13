import type { PublicSmelterFacility } from "@/features/intelligence/types/smelter";

import type { PublicExportRecord } from "./export";
import type { PublicGdpRecord } from "./gdp";
import type { PublicInvestmentRecord } from "./investment";

export const economySections = [
  "gdp",
  "exports",
  "investment",
  "downstream",
  "regulations",
] as const;

export type EconomySection = (typeof economySections)[number];

export type EconomyRegulationStatus =
  | "active"
  | "amended"
  | "revoked"
  | "unknown";

export type EconomyRegulation = {
  id: string;
  year: number;
  type: string;
  number: string;
  title: string;
  subject: string;
  status: EconomyRegulationStatus;
  officialUrl: string;
  verifiedAt: string | null;
  relatedRegulationIds: string[];
  notes: string | null;
};

export type PublicEconomyDashboard = {
  gdp: PublicGdpRecord[];
  exports: PublicExportRecord[];
  investment: PublicInvestmentRecord[];
  smelters: PublicSmelterFacility[];
  regulations: EconomyRegulation[];
  meta: {
    gdpYearFrom: number | null;
    gdpYearTo: number | null;
    smelterFacilityCount: number;
    smelterCommodityCount: number;
    smelterProvinceCount: number;
    regulationCount: number;
  };
};
