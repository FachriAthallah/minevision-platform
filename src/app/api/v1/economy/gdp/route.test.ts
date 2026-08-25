import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getPublicGdpMock } = vi.hoisted(() => ({
  getPublicGdpMock: vi.fn(),
}));

vi.mock("@/features/economy/server/get-public-gdp", () => ({
  getPublicGdp: getPublicGdpMock,
}));

import { GET } from "./route";

const sampleGdpRecord = {
  id: "11111111-1111-4111-8111-111111111111",

  region: {
    code: "IDN",
    name: "Indonesia",
  },

  year: 2022,

  priceBasis: "current_prices",
  baseYear: null,

  nationalGdpValue: 19588445.6,
  miningQuarryingGdpValue: 2393451.9,

  contributionPercentage: 12.2186,
  nominalYoyChangePercentage: 35.12,

  currencyCode: "IDR",
  valueScale: "billion",

  dataStatus: "final",
  recordType: "actual",

  sourcePublishedAt: "2023-02-06",

  sources: [
    {
      label: "BPS Indonesia",
      pageReference: null,
      url: "https://www.bps.go.id",
      isPrimary: true,
      source: {
        name: "Badan Pusat Statistik",
        slug: "bps",
        organization: "Badan Pusat Statistik",
      },
    },
  ],
};

describe("GET /api/v1/economy/gdp", () => {
  beforeEach(() => {
    getPublicGdpMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("mengembalikan data GDP dengan query yang valid", async () => {
    getPublicGdpMock.mockResolvedValue([sampleGdpRecord]);

    const request = new NextRequest(
      "http://localhost/api/v1/economy/gdp" +
        "?region=idn" +
        "&priceBasis=current_prices" +
        "&fromYear=2020" +
        "&toYear=2022",
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);

    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=300, stale-while-revalidate=600",
    );

    expect(getPublicGdpMock).toHaveBeenCalledOnce();

    expect(getPublicGdpMock).toHaveBeenCalledWith({
      region: "IDN",
      priceBasis: "current_prices",
      fromYear: 2020,
      toYear: 2022,
    });

    expect(body).toEqual({
      success: true,
      data: [sampleGdpRecord],
      meta: {
        count: 1,
        filters: {
          region: "IDN",
          priceBasis: "current_prices",
          fromYear: 2020,
          toYear: 2022,
        },
      },
    });
  });

  it("mengembalikan 400 untuk rentang tahun tidak valid", async () => {
    const request = new NextRequest(
      "http://localhost/api/v1/economy/gdp" + "?fromYear=2025" + "&toYear=2019",
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);

    expect(response.headers.get("Cache-Control")).toBe("no-store");

    expect(body).toMatchObject({
      success: false,
      error: {
        code: "INVALID_QUERY",
        message: "Parameter data PDB tidak valid.",
      },
    });

    expect(getPublicGdpMock).not.toHaveBeenCalled();
  });

  it("mengembalikan 500 ketika data access gagal", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    getPublicGdpMock.mockRejectedValue(new Error("Database unavailable"));

    const request = new NextRequest("http://localhost/api/v1/economy/gdp");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);

    expect(response.headers.get("Cache-Control")).toBe("no-store");

    expect(body).toEqual({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Data PDB belum dapat dimuat.",
      },
    });

    expect(consoleErrorSpy).toHaveBeenCalledOnce();
  });
});
