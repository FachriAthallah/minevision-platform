import "server-only";

import { regulations } from "../data/regulations";
import type { PublicEconomyDashboard } from "../types/dashboard";
import { getPublicExports } from "./get-public-exports";
import { getPublicGdp } from "./get-public-gdp";
import { getPublicInvestment } from "./get-public-investment";
import { getPublicSmelters } from "@/features/intelligence/server/get-public-smelters";

export async function getPublicEconomyDashboard(): Promise<PublicEconomyDashboard> {
  const [gdp, exports, investment, smelters] = await Promise.all([
    getPublicGdp({ priceBasis: "current_prices", fromYear: 2019, toYear: 2025 }),
    getPublicExports({ fromYear: 2019, toYear: 2025 }),
    getPublicInvestment({ fromYear: 2019, toYear: 2025 }),
    getPublicSmelters({}),
  ]);

  const gdpYears = gdp.map((record) => record.year);
  const smelterCommodities = new Set(
    smelters.flatMap((facility) =>
      facility.outputs
        .filter((output) => output.isPrimary)
        .map((output) => output.commodity.slug),
    ),
  );
  const smelterProvinces = new Set(
    smelters.map((facility) => facility.location.province),
  );

  return {
    gdp,
    exports,
    investment,
    smelters,
    regulations,
    meta: {
      gdpYearFrom: gdpYears.length ? Math.min(...gdpYears) : null,
      gdpYearTo: gdpYears.length ? Math.max(...gdpYears) : null,
      smelterFacilityCount: smelters.length,
      smelterCommodityCount: smelterCommodities.size,
      smelterProvinceCount: smelterProvinces.size,
      regulationCount: regulations.length,
    },
  };
}
