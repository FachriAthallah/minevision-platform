import { beforeEach, describe, expect, it, vi } from "vitest";

const getPublicInvestmentMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/economy/server/get-public-investment", () => ({
  getPublicInvestment: getPublicInvestmentMock,
}));

import { NextRequest } from "next/server";

import { GET } from "./route";

describe("GET /api/v1/economy/investment", () => {
  beforeEach(() => {
    getPublicInvestmentMock.mockReset();
  });

  it("mengembalikan data dan filter yang sudah divalidasi", async () => {
    getPublicInvestmentMock.mockResolvedValue([]);

    const request = new NextRequest(
      "http://localhost/api/v1/economy/investment?region=id&origin=pma&fromYear=2020&toYear=2025",
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=300");
    expect(getPublicInvestmentMock).toHaveBeenCalledWith({
      region: "ID",
      origin: "pma",
      fromYear: 2020,
      toYear: 2025,
    });
    expect(body).toEqual({
      success: true,
      data: [],
      meta: {
        count: 0,
        filters: {
          region: "ID",
          origin: "pma",
          fromYear: 2020,
          toYear: 2025,
        },
      },
    });
  });

  it("menolak rentang tahun tidak valid dengan HTTP 400", async () => {
    const request = new NextRequest(
      "http://localhost/api/v1/economy/investment?fromYear=2025&toYear=2020",
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_QUERY");
    expect(getPublicInvestmentMock).not.toHaveBeenCalled();
  });

  it("mengembalikan HTTP 500 saat data access gagal", async () => {
    const consoleErrorMock = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    getPublicInvestmentMock.mockRejectedValue(
      new Error("Database unavailable"),
    );

    const request = new NextRequest(
      "http://localhost/api/v1/economy/investment",
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toEqual({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Data investasi pertambangan belum dapat dimuat.",
      },
    });

    consoleErrorMock.mockRestore();
  });
});
