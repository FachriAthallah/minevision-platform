import { beforeEach, describe, expect, it, vi } from "vitest";

const getPublicExportsMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/economy/server/get-public-exports", () => ({
  getPublicExports: getPublicExportsMock,
}));

import { NextRequest } from "next/server";

import { GET } from "./route";

describe("GET /api/v1/economy/exports", () => {
  beforeEach(() => {
    getPublicExportsMock.mockReset();
  });

  it("mengembalikan data dan filter yang sudah divalidasi", async () => {
    getPublicExportsMock.mockResolvedValue([]);

    const request = new NextRequest(
      "http://localhost/api/v1/economy/exports?commodity=tembaga&origin=id&availability=reported&fromYear=2019&toYear=2025",
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=300");
    expect(getPublicExportsMock).toHaveBeenCalledWith({
      commodity: "tembaga",
      origin: "ID",
      availability: "reported",
      fromYear: 2019,
      toYear: 2025,
    });
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
    expect(body.meta.count).toBe(0);
  });

  it("menolak availability yang tidak valid dengan HTTP 400", async () => {
    const request = new NextRequest(
      "http://localhost/api/v1/economy/exports?availability=missing",
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_QUERY");
    expect(getPublicExportsMock).not.toHaveBeenCalled();
  });

  it("mengembalikan HTTP 500 saat data access gagal", async () => {
    const consoleErrorMock = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    getPublicExportsMock.mockRejectedValue(new Error("Database unavailable"));

    const request = new NextRequest(
      "http://localhost/api/v1/economy/exports",
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toEqual({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Data ekspor minerba belum dapat dimuat.",
      },
    });

    consoleErrorMock.mockRestore();
  });
});
