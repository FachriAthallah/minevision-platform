import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const { detail } = vi.hoisted(() => ({ detail: vi.fn() }));
vi.mock("@/features/career/server/public-career-queries", () => ({ getPublicCareerBySlug: detail }));
import { GET } from "./route";
const request = new NextRequest("http://localhost/api/v1/careers/geologi");
describe("GET /api/v1/careers/[slug]", () => {
  beforeEach(() => { detail.mockReset(); });
  it("returns eligible detail", async () => {
    detail.mockResolvedValue({ category: { slug: "geologi" } });
    const response = await GET(request, { params: Promise.resolve({ slug: "geologi" }) });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true, data: { category: { slug: "geologi" } } });
  });
  it.each(["../private", "invalid_slug", "", "a".repeat(181)])("rejects invalid slug", async (slug) => {
    expect((await GET(request, { params: Promise.resolve({ slug }) })).status).toBe(400);
    expect(detail).not.toHaveBeenCalled();
  });
  it.each(["unknown", "unpublished", "inactive"])("returns safe 404 for %s", async (slug) => {
    detail.mockResolvedValue(null);
    const response = await GET(request, { params: Promise.resolve({ slug }) });
    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("CAREER_NOT_FOUND");
  });
  it("returns safe failure", async () => {
    detail.mockRejectedValue(new Error("private SQL"));
    const response = await GET(request, { params: Promise.resolve({ slug: "geologi" }) });
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("private SQL");
  });
});
