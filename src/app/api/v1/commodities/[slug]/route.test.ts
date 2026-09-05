import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getPublicCommodityBySlugMock } = vi.hoisted(() => ({
  getPublicCommodityBySlugMock: vi.fn(),
}));

vi.mock("@/features/commodity/server/get-public-commodity", () => ({
  getPublicCommodityBySlug: getPublicCommodityBySlugMock,
}));

import { GET } from "./route";

describe("GET /api/v1/commodities/[slug]", () => {
  beforeEach(() => {
    getPublicCommodityBySlugMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("mengembalikan detail komoditas", async () => {
    const commodity = {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Nikel",
      slug: "nikel",
    };

    getPublicCommodityBySlugMock.mockResolvedValue(commodity);

    const response = await GET(
      new NextRequest("http://localhost/api/v1/commodities/nikel"),
      {
        params: Promise.resolve({
          slug: "NIKEL",
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=300, stale-while-revalidate=600",
    );
    expect(getPublicCommodityBySlugMock).toHaveBeenCalledWith("nikel");

    expect(await response.json()).toEqual({
      success: true,
      data: commodity,
    });
  });

  it("mengembalikan 400 untuk slug tidak valid", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/v1/commodities/invalid"),
      {
        params: Promise.resolve({
          slug: "../invalid",
        }),
      },
    );

    expect(response.status).toBe(400);
    expect(getPublicCommodityBySlugMock).not.toHaveBeenCalled();
  });

  it("mengembalikan 404 ketika komoditas tidak ada", async () => {
    getPublicCommodityBySlugMock.mockResolvedValue(null);

    const response = await GET(
      new NextRequest("http://localhost/api/v1/commodities/tidak-ada"),
      {
        params: Promise.resolve({
          slug: "tidak-ada",
        }),
      },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      success: false,
      error: {
        code: "COMMODITY_NOT_FOUND",
        message: "Komoditas tidak ditemukan.",
      },
    });
  });

  it("mengembalikan 500 ketika akses database gagal", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    getPublicCommodityBySlugMock.mockRejectedValue(
      new Error("Database unavailable"),
    );

    const response = await GET(
      new NextRequest("http://localhost/api/v1/commodities/nikel"),
      {
        params: Promise.resolve({
          slug: "nikel",
        }),
      },
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Detail komoditas belum dapat dimuat.",
      },
    });
    expect(consoleErrorSpy).toHaveBeenCalledOnce();
  });
});
