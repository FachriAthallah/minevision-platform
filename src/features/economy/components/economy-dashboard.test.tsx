import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("./economy-charts", () => ({
  GdpContributionChart: () => <div data-chart="contribution" />,
  GdpValueChart: () => <div data-chart="value" />,
  EconomyReadyBarChart: () => <div data-chart="ready" />,
  EconomyGroupedInvestmentChart: () => <div data-chart="grouped-investment" />,
}));

import type { PublicEconomyDashboard } from "../types/dashboard";
import { EconomyDashboard } from "./economy-dashboard";

const emptyDashboard: PublicEconomyDashboard = {
  gdp: [],
  exports: [],
  investment: [],
  smelters: [],
  regulations: [],
  meta: {
    gdpYearFrom: null,
    gdpYearTo: null,
    smelterFacilityCount: 0,
    smelterCommodityCount: 0,
    smelterProvinceCount: 0,
    regulationCount: 0,
  },
};

describe("EconomyDashboard", () => {
  it("renders keyboard-accessible section navigation", () => {
    const html = renderToStaticMarkup(
      <EconomyDashboard dashboard={emptyDashboard} initialSection="gdp" />,
    );
    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain("Data Economy");
    expect(html).toContain("PDB");
    expect(html).toContain("Hilirisasi");
  });

  it("shows a professional public empty state for export HOLD records", () => {
    const html = renderToStaticMarkup(
      <EconomyDashboard dashboard={emptyDashboard} initialSection="exports" />,
    );
    expect(html).toContain(
      "Data ekspor sedang melalui proses verifikasi dan belum tersedia untuk publik.",
    );
    expect(html).toContain(
      "Record tetap ditahan agar bijih, konsentrat, logam",
    );
  });

  it("shows a public empty state for investment HOLD records", () => {
    const html = renderToStaticMarkup(
      <EconomyDashboard dashboard={emptyDashboard} initialSection="investment" />,
    );
    expect(html).toContain(
      "Data investasi sedang melalui proses verifikasi dan belum tersedia untuk publik.",
    );
    expect(html).toContain("Total investasi tidak dihitung");
  });
});
