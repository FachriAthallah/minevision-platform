import { describe, expect, it } from "vitest";
import { adjacentCareerCategories, aggregateCareerCounts, emptySectionCounts, filterCareerCategories, filterCareerProfessions, formatCareerCount, groupCareerItems, groupCareerProfessions, safeCareerSourceUrl } from "./career-view";
import type { CareerCategorySummary } from "../types/career";

const category = (slug: string, order: number): CareerCategorySummary => ({ slug, name: slug, displayOrder: order, title: "Judul", description: "Bidang pertambangan", excerpt: "Geologi dan sumber daya", professionCount: 3, sourceCount: 1, sectionCounts: { ...emptySectionCounts(), competency: 4, training: 2 } });
describe("Career public presentation", () => {
  const categories = [category("beta", 2), category("alfa", 1), category("gamma", 2)];
  it("filters all supported fields and sorts without mutating input", () => {
    expect(filterCareerCategories(categories, " GEOLOGI ").map((x) => x.slug)).toEqual(["alfa", "beta", "gamma"]);
    expect(filterCareerCategories(categories, "beta")).toHaveLength(1);
    expect(filterCareerCategories(categories, "tidak-ada")).toEqual([]);
    expect(categories[0].slug).toBe("beta");
  });
  it("aggregates counts including empty catalog", () => {
    expect(aggregateCareerCounts(categories)).toMatchObject({ totalCategories: 3, totalProfessions: 9, totalProfileItems: 18, sectionTotals: { competency: 12, training: 6 } });
    expect(aggregateCareerCounts([]).totalProfileItems).toBe(0);
  });
  it("resolves neighbors by displayOrder then slug and handles boundaries", () => {
    expect(adjacentCareerCategories(categories, "beta")).toMatchObject({ previous: { slug: "alfa" }, next: { slug: "gamma" } });
    expect(adjacentCareerCategories(categories, "alfa").previous).toBeNull();
    expect(adjacentCareerCategories(categories, "gamma").next).toBeNull();
    expect(adjacentCareerCategories(categories, "missing")).toEqual({ previous: null, next: null });
  });
  it("preserves profession groups and deterministic order", () => {
    const groups = groupCareerProfessions([
      { groupKey: "b", groupLabel: "Kelompok B", slug: "z", name: "Engineer", description: null, displayOrder: 2 },
      { groupKey: "a", groupLabel: "Kelompok A", slug: "b", name: "Surveyor", description: "Pemetaan", displayOrder: 0 },
      { groupKey: "a", groupLabel: "Kelompok A", slug: "a", name: "Geologist", description: null, displayOrder: 0 },
    ]);
    expect(groups.map((x) => x.groupKey)).toEqual(["a", "b"]);
    expect(groups[0].professions.map((x) => x.slug)).toEqual(["a", "b"]);
    expect(groups[0].professionCount).toBe(2);
    expect(filterCareerProfessions(groups, "PEMETAAN")[0].professions[0].name).toBe("Surveyor");
    expect(filterCareerProfessions(groups, "geol")[0].professionCount).toBe(1);
    expect(filterCareerProfessions(groups, "zzz")).toEqual([]);
  });
  it("groups profile items by section and stable key", () => {
    const base = { groupKey: "utama", groupLabel: "Utama", value: "Materi", displayOrder: 0 };
    const sections = groupCareerItems([{ ...base, section: "education", itemKey: "z" }, { ...base, section: "education", itemKey: "a" }, { ...base, section: "work_scope", itemKey: "w" }]);
    expect(sections.education[0].values.map((x) => x.itemKey)).toEqual(["a", "z"]);
    expect(sections.workScope[0].section).toBe("work_scope");
    expect(sections.training).toEqual([]);
  });
  it("formats counts and rejects unsafe source links", () => {
    expect(formatCareerCount(2477)).toBe("2.477");
    expect(formatCareerCount(0)).toBe("0");
    expect(safeCareerSourceUrl("javascript:alert(1)")).toBeNull();
    expect(safeCareerSourceUrl(null)).toBeNull();
    expect(safeCareerSourceUrl("https://example.org")).toBe("https://example.org");
  });
});

