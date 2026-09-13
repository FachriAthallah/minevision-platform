import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  gdp: vi.fn(),
  exports: vi.fn(),
  investment: vi.fn(),
  smelters: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./get-public-gdp", () => ({ getPublicGdp: mocks.gdp }));
vi.mock("./get-public-exports", () => ({ getPublicExports: mocks.exports }));
vi.mock("./get-public-investment", () => ({ getPublicInvestment: mocks.investment }));
vi.mock("@/features/intelligence/server/get-public-smelters", () => ({
  getPublicSmelters: mocks.smelters,
}));

import { getPublicEconomyDashboard } from "./get-public-economy-dashboard";

describe("public Economy dashboard composition", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.gdp.mockResolvedValue([]);
    mocks.exports.mockResolvedValue([]);
    mocks.investment.mockResolvedValue([]);
    mocks.smelters.mockResolvedValue([]);
  });

  it("uses bounded public queries and never reads staging", async () => {
    const dashboard = await getPublicEconomyDashboard();
    expect(mocks.gdp).toHaveBeenCalledWith({
      priceBasis: "current_prices",
      fromYear: 2019,
      toYear: 2025,
    });
    expect(mocks.exports).toHaveBeenCalledWith({ fromYear: 2019, toYear: 2025 });
    expect(mocks.investment).toHaveBeenCalledWith({ fromYear: 2019, toYear: 2025 });
    expect(mocks.smelters).toHaveBeenCalledWith({});
    expect(dashboard.exports).toEqual([]);
    expect(dashboard.investment).toEqual([]);
    expect(dashboard.regulations).toHaveLength(20);
  });

  it("does not manufacture public investment or export records when queries return HOLD-filtered arrays", async () => {
    const dashboard = await getPublicEconomyDashboard();
    expect(dashboard.exports).toHaveLength(0);
    expect(dashboard.investment).toHaveLength(0);
    expect(dashboard.meta.gdpYearFrom).toBeNull();
    expect(dashboard.meta.smelterFacilityCount).toBe(0);
  });
});
