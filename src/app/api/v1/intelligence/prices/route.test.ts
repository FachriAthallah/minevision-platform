import { beforeEach, describe, expect, it, vi } from "vitest";

const getPublicDomesticPricesMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/intelligence/server/get-public-domestic-prices", () => ({
  getPublicDomesticPrices: getPublicDomesticPricesMock,
}));

import { NextRequest } from "next/server";

import { GET } from "./route";

describe("GET /api/v1/intelligence/prices", () => {
  beforeEach(() => {
    getPublicDomesticPricesMock.mockReset();
  });

  it("mengembalikan semua harga ketika commodity tidak diberikan", async () => {
    getPublicDomesticPricesMock.mockResolvedValue([]);

    const request = new NextRequest(
      "http://localhost/api/v1/intelligence/prices",
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);

    expect(getPublicDomesticPricesMock).toHaveBeenCalledWith({
      commodity: undefined,
      standard: undefined,
      fromDate: undefined,
      toDate: undefined,
      period: undefined,
    });

    expect(body).toEqual({
      success: true,
      data: [],
      meta: {
        count: 0,
        filters: {
          commodity: undefined,
          standard: undefined,
          fromDate: undefined,
          toDate: undefined,
          period: undefined,
        },
      },
    });
  });

  it("menolak query harga domestik yang tidak valid", async () => {
    const request = new NextRequest(
      "http://localhost/api/v1/intelligence/prices?period=yearly",
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_QUERY");
    expect(getPublicDomesticPricesMock).not.toHaveBeenCalled();
  });

  it("mengembalikan 500 ketika query database gagal", async () => {
    const consoleErrorMock = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    getPublicDomesticPricesMock.mockRejectedValue(
      new Error("Database unavailable"),
    );

    const request = new NextRequest(
      "http://localhost/api/v1/intelligence/prices?commodity=batubara",
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);

    expect(body).toEqual({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Data harga domestik belum dapat dimuat.",
      },
    });

    consoleErrorMock.mockRestore();
  });
});
