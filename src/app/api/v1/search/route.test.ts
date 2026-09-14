import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const search = vi.hoisted(() => vi.fn());

vi.mock("@/features/search/server/search-public-site", () => ({
  searchPublicSite: search,
}));

import { GET } from "./route";

describe("GET /api/v1/search", () => {
  beforeEach(() => search.mockReset());

  it("rejects an empty query", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/v1/search"),
    );

    expect(response.status).toBe(400);
  });

  it("returns public search results", async () => {
    search.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      pageCount: 1,
      query: "nikel",
    });

    const response = await GET(
      new NextRequest("http://localhost/api/v1/search?q=nikel"),
    );

    expect(response.status).toBe(200);
    expect(search).toHaveBeenCalledWith({ q: "nikel", page: 1, limit: 20 });
  });

});
