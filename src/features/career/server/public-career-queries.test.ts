import { beforeEach, describe, expect, it, vi } from "vitest";

const { execute } = vi.hoisted(() => ({ execute: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/db", async () => {
  const { drizzle } = await import("drizzle-orm/pg-proxy");
  return { db: drizzle(execute) };
});
import { getPublicCareers, getPublicCareerBySlug } from "./public-career-queries";

const summaryRow = ["content-1", "geologi", "Geologi", "Profil geologi", "Ringkasan", "Deskripsi", 1];
describe("Career Drizzle public queries (no database connection)", () => {
  beforeEach(() => { execute.mockReset(); });
  it("uses active/published predicates and four bounded catalog queries", async () => {
    execute.mockResolvedValueOnce({ rows: [summaryRow] }).mockResolvedValueOnce({ rows: [["content-1", 7]] }).mockResolvedValueOnce({ rows: [["content-1", "competency", 9], ["content-1", "training", 4]] }).mockResolvedValueOnce({ rows: [["content-1", 2]] });
    const result = await getPublicCareers();
    expect(result.categories[0]).toMatchObject({ slug: "geologi", professionCount: 7, sourceCount: 2, sectionCounts: { competency: 9, training: 4 } });
    expect(result.counts).toMatchObject({ totalCategories: 1, totalProfessions: 7, totalProfileItems: 13 });
    expect(JSON.stringify(result)).not.toContain("content-1");
    expect(execute).toHaveBeenCalledTimes(4);
    const [sql, params] = execute.mock.calls[0];
    expect(sql).toContain('"content_categories"."is_active"');
    expect(sql).toContain('"contents"."module"');
    expect(sql).toContain('"contents"."type"');
    expect(sql).toContain('"contents"."status"');
    expect(params).toEqual(expect.arrayContaining(["career", "profession", "published", true]));
    expect(sql).toContain('order by "content_categories"."display_order" asc, "content_categories"."slug" asc');
    expect(sql).toContain("split_part");
    expect(sql).toContain("Deskripsi Kategori");
    expect(result.categories[0]).not.toHaveProperty("body");
    const sourceQuery = execute.mock.calls.find(([sql]) => sql.includes('inner join "sources"'));
    expect(sourceQuery?.[0]).toContain('"sources"."is_active"');
    expect(sourceQuery?.[0]).toContain('"sources"."verification_status"');
    expect(sourceQuery?.[1]).toContain("verified");
  });
  it("catalog query count stays fixed for 13 categories", async () => {
    execute.mockResolvedValueOnce({ rows: Array.from({ length: 13 }, (_, i) => [`content-${i}`, `category-${i}`, "Category", "Title", null, null, i]) }).mockResolvedValue({ rows: [] });
    expect((await getPublicCareers()).categories).toHaveLength(13);
    expect(execute).toHaveBeenCalledTimes(4);
  });
  it("search is literal and aggregates describe matched rows", async () => {
    execute.mockResolvedValueOnce({ rows: [summaryRow] }).mockResolvedValue({ rows: [] });
    expect((await getPublicCareers({ q: "%" })).categories).toEqual([]);
    expect(execute.mock.calls.flatMap(([, params]) => params)).not.toContain("%");
  });
  it("empty eligible catalog performs no child queries", async () => {
    execute.mockResolvedValue({ rows: [] });
    expect((await getPublicCareers()).counts.totalCategories).toBe(0);
    expect(execute).toHaveBeenCalledTimes(1);
  });
  it("missing or unpublished parent returns null before any child query", async () => {
    execute.mockResolvedValue({ rows: [] });
    expect(await getPublicCareerBySlug("missing")).toBeNull();
    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute.mock.calls[0][1]).toEqual(expect.arrayContaining(["career", "profession", "published", true, "missing"]));
  });
  it("detail maps selected children, citations and neighbors without UUIDs", async () => {
    execute.mockResolvedValueOnce({ rows: [["content-1", "geologi", "Geologi", "Deskripsi", 1, "Judul", "Excerpt", "Materi", "2026-09-05T00:00:00Z", null]] })
      .mockResolvedValueOnce({ rows: [["utama", "Utama", "Geologist", "geologist", null, 0]] })
      .mockResolvedValueOnce({ rows: [["software", "utama", "Utama", "gis", "GIS", 0]] })
      .mockResolvedValueOnce({ rows: [["Referensi", "Institusi", "academic", "https://example.org", "Bab I", "2", 0]] })
      .mockResolvedValueOnce({ rows: [["geologi", "Geologi", 1], ["operasi", "Operasi", 2]] });
    const detail = await getPublicCareerBySlug("geologi");
    expect(detail).toMatchObject({ category: { slug: "geologi" }, profile: { body: "Materi", publishedAt: "2026-09-05T00:00:00.000Z" }, counts: { professions: 1, software: 1, sources: 1 }, navigation: { previous: null, next: { slug: "operasi" } } });
    expect(detail?.professionGroups[0].professions[0].slug).toBe("geologist");
    expect(detail?.sections.software[0].values[0].value).toBe("GIS");
    expect(detail?.sources[0].citationLabel).toBe("Bab I");
    expect(JSON.stringify(detail)).not.toContain("content-1");
    expect(execute).toHaveBeenCalledTimes(5);
    for (const [, params] of execute.mock.calls.slice(1, 4)) expect(params).toContain("content-1");
  });
});
