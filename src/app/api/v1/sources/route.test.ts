import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSources = vi.hoisted(() => vi.fn());

vi.mock("@/features/sources/server/get-public-sources", () => ({
  getPublicSources: getSources,
}));

import { GET } from "./route";

describe("GET /api/v1/sources", () => {
  beforeEach(() => getSources.mockReset());

  it("rejects invalid pagination", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/v1/sources?page=0"),
    );

    expect(response.status).toBe(400);
  });

  it("returns only the catalog produced by the public source query", async () => {
    getSources.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 18,
      pageCount: 1,
      filters: { publishers: [], types: [], modules: [] },
    });

    const response = await GET(
      new NextRequest("http://localhost/api/v1/sources?module=economy"),
    );

    expect(response.status).toBe(200);
    expect(getSources).toHaveBeenCalledWith({
      module: "economy",
      page: 1,
      limit: 18,
    });
  });
});
