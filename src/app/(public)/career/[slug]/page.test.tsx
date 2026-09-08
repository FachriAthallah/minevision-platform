import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CareerDetail } from "@/features/career/types/career";

const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("@/features/career/server/public-career-queries", () => ({ getPublicCareerBySlug: query }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NEXT_NOT_FOUND"); } }));
vi.mock("@/features/career/components/career-detail", () => ({ CareerDetail: () => null }));
import Page, { generateMetadata } from "./page";

describe("Career category page", () => {
  beforeEach(() => { query.mockReset(); });
  it("rejects invalid slugs without querying", async () => {
    await expect(Page({ params: Promise.resolve({ slug: "Invalid_slug" }) })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(query).not.toHaveBeenCalled();
  });
  it("renders not-found for unavailable content", async () => {
    query.mockResolvedValue(null);
    await expect(Page({ params: Promise.resolve({ slug: "missing" }) })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(await generateMetadata({ params: Promise.resolve({ slug: "missing" }) })).toMatchObject({ robots: { index: false } });
  });
  it("uses the published profile for metadata and page composition", async () => {
    const data = { category: { slug: "geologi", description: "Bidang geologi" }, profile: { title: "Geologi", excerpt: "Materi geologi" } } as CareerDetail;
    query.mockResolvedValue(data);
    expect(await generateMetadata({ params: Promise.resolve({ slug: "geologi" }) })).toMatchObject({ title: "Geologi", description: "Materi geologi", alternates: { canonical: "/career/geologi" } });
    expect((await Page({ params: Promise.resolve({ slug: "geologi" }) })).props.career).toBe(data);
  });
});
