import { beforeEach, describe, expect, it, vi } from "vitest";

const getPublicSmeltersMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/intelligence/server/get-public-smelters", () => ({
  getPublicSmelters: getPublicSmeltersMock,
}));

import { NextRequest } from "next/server";

import { GET } from "./route";

describe("GET /api/v1/intelligence/smelters", () => {
  beforeEach(() => {
    getPublicSmeltersMock.mockReset();
  });

  it("mengembalikan data fasilitas dan filter yang sudah divalidasi", async () => {
    getPublicSmeltersMock.mockResolvedValue([]);

    const request = new NextRequest(
      "http://localhost/api/v1/intelligence/smelters?commodity=nikel&facilityType=smelter&status=operating",
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=300");
    expect(getPublicSmeltersMock).toHaveBeenCalledWith({
      commodity: "nikel",
      facilityType: "smelter",
      status: "operating",
    });
    expect(body).toEqual({
      success: true,
      data: [],
      meta: {
        count: 0,
        filters: {
          commodity: "nikel",
          facilityType: "smelter",
          status: "operating",
        },
      },
    });
  });

  it("menolak query yang tidak valid dengan HTTP 400", async () => {
    const request = new NextRequest(
      "http://localhost/api/v1/intelligence/smelters?facilityType=factory",
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_QUERY");
    expect(getPublicSmeltersMock).not.toHaveBeenCalled();
  });

  it("mengembalikan HTTP 500 saat data access gagal", async () => {
    const consoleErrorMock = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    getPublicSmeltersMock.mockRejectedValue(new Error("Database unavailable"));

    const request = new NextRequest(
      "http://localhost/api/v1/intelligence/smelters",
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toEqual({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Data fasilitas smelter belum dapat dimuat.",
      },
    });

    consoleErrorMock.mockRestore();
  });
});
