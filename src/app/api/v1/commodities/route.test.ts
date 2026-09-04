import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getPublicCommoditiesMock } = vi.hoisted(() => ({
  getPublicCommoditiesMock: vi.fn(),
}));

vi.mock("@/features/commodity/server/get-public-commodities", () => ({
  getPublicCommodities: getPublicCommoditiesMock,
}));

import { GET } from "./route";

const sampleCommodity = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Nikel",
  slug: "nikel",
  symbol: "Ni",
  category: "metal_mineral",
  description: "Komoditas mineral logam strategis.",
  specification: "Nama internasional: Nickel",
  image: null,
  isIntelligenceTracked: true,
  displayOrder: 1,
  profile: {
    title: "Nikel: Profil Komoditas Pertambangan",
    excerpt: "Profil singkat nikel.",
    readingTimeMinutes: 2,
    isFeatured: false,
    publishedAt: "2026-09-02T00:00:00.000Z",
  },
};

describe("GET /api/v1/commodities", () => {
  beforeEach(() => {
    getPublicCommoditiesMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("mengembalikan katalog dengan filter valid", async () => {
    getPublicCommoditiesMock.mockResolvedValue([sampleCommodity]);

    const request = new NextRequest(
      "http://localhost/api/v1/commodities" +
        "?search=nikel" +
        "&category=metal_mineral" +
        "&intelligenceTracked=true",
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=300, stale-while-revalidate=600",
    );

    expect(getPublicCommoditiesMock).toHaveBeenCalledWith({
      search: "nikel",
      category: "metal_mineral",
      intelligenceTracked: true,
    });

    expect(body).toEqual({
      success: true,
      data: [sampleCommodity],
      meta: {
        count: 1,
        filters: {
          search: "nikel",
          category: "metal_mineral",
          intelligenceTracked: true,
        },
      },
    });
  });

  it("menerima request tanpa filter", async () => {
    getPublicCommoditiesMock.mockResolvedValue([]);

    const request = new NextRequest("http://localhost/api/v1/commodities");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getPublicCommoditiesMock).toHaveBeenCalledWith({});
    expect(body.meta.count).toBe(0);
  });

  it("mengembalikan 400 untuk filter tidak valid", async () => {
    const request = new NextRequest(
      "http://localhost/api/v1/commodities" +
        "?category=mineral" +
        "&intelligenceTracked=yes",
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toMatchObject({
      success: false,
      error: {
        code: "INVALID_QUERY",
      },
    });
    expect(getPublicCommoditiesMock).not.toHaveBeenCalled();
  });

  it("mengembalikan 500 ketika akses data gagal", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    getPublicCommoditiesMock.mockRejectedValue(
      new Error("Database unavailable"),
    );

    const request = new NextRequest("http://localhost/api/v1/commodities");

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toEqual({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Daftar komoditas belum dapat dimuat.",
      },
    });
    expect(consoleErrorSpy).toHaveBeenCalledOnce();
  });
});
