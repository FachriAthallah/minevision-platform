import { beforeEach, describe, expect, it, vi } from "vitest";

const getDashboardMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/intelligence/server/get-public-intelligence-dashboard", () => ({
  getPublicIntelligenceDashboard: getDashboardMock,
}));

import { NextRequest } from "next/server";
import { GET } from "./route";

describe("GET /api/v1/intelligence/dashboard", () => {
  beforeEach(() => getDashboardMock.mockReset());

  it("returns the public dashboard", async () => {
    const dashboard = { commodities: [], meta: { commodityCount: 0, productionObservationCount: 0, priceObservationCount: 0, coverageRegionCount: 0, mappableLocationCount: 0 } };
    getDashboardMock.mockResolvedValue(dashboard);
    const response = await GET(new NextRequest("http://localhost/api/v1/intelligence/dashboard?commodity=nikel"));
    expect(response.status).toBe(200);
    expect(getDashboardMock).toHaveBeenCalledWith({ commodity: "nikel" });
    expect(await response.json()).toEqual({ success: true, data: dashboard });
  });

  it("rejects an unknown commodity", async () => {
    const response = await GET(new NextRequest("http://localhost/api/v1/intelligence/dashboard?commodity=uranium"));
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("INVALID_QUERY");
    expect(getDashboardMock).not.toHaveBeenCalled();
  });

  it("returns a safe server error", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    getDashboardMock.mockImplementationOnce(() => {
      throw new Error("Database unavailable");
    });
    const response = await GET(new NextRequest("http://localhost/api/v1/intelligence/dashboard?commodity=batubara"));
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body).toEqual({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Dashboard Intelligence belum dapat dimuat." } });
    log.mockRestore();
  });
});
