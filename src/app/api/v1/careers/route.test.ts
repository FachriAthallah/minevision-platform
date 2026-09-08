import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const { list } = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock("@/features/career/server/public-career-queries", () => ({ getPublicCareers: list }));
import { GET } from "./route";
import { aggregateCareerCounts } from "@/features/career/lib/career-view";
describe("GET /api/v1/careers", () => {
  beforeEach(() => { list.mockReset(); });
  it.each(["", "?q=%20geologi%20"])("returns envelope and validated search %s", async (suffix) => {
    list.mockResolvedValue({ categories: [], counts: aggregateCareerCounts([]) });
    const response = await GET(new NextRequest(`http://localhost/api/v1/careers${suffix}`));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, data: [], meta: { totalCategories: 0 } });
    expect(list).toHaveBeenCalledWith(suffix ? { q: "geologi" } : {});
  });
  it.each([`?q=${"a".repeat(101)}`, "?other=yes", "?q=a&q=b"])("rejects invalid input %s", async (suffix) => {
    const response = await GET(new NextRequest(`http://localhost/api/v1/careers${suffix}`));
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("INVALID_QUERY");
    expect(list).not.toHaveBeenCalled();
  });
  it("never leaks driver failures", async () => {
    list.mockRejectedValue(new Error("private SQL credential"));
    const response = await GET(new NextRequest("http://localhost/api/v1/careers"));
    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.text()).not.toContain("credential");
  });
});
