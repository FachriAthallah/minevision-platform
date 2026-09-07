import { describe, expect, it } from "vitest";
import { evaluateCareerVerification } from "./verify-career-import";
import { careerFixture, careerSnapshot } from "./career-import-test-helpers";
import { CAREER_IMPORT_TABLES, careerContentKey } from "./career-import-model";

describe("Career verifier", () => {
  it("accepts exact staging fields and 13 categories with all five sections", () => {
    const dataset = careerFixture(); const report = evaluateCareerVerification(dataset, careerSnapshot(dataset));
    expect(report.passed).toBe(true); expect(report.perCategory).toHaveLength(13);
    expect(report.perCategory.every((category) => category.missingSections.length === 0 && category.sources > 0)).toBe(true);
  });
  it.each(CAREER_IMPORT_TABLES)("detects a missing record in %s", (table) => {
    const dataset = careerFixture(); const snapshot = careerSnapshot(dataset);
    const missing = snapshot.rows[table].pop()!;
    const report = evaluateCareerVerification(dataset, snapshot);
    expect(report.passed).toBe(false);
    expect(report.tables.find((row) => row.table === table)!.missing).toContain(missing.key);
  });
  it.each([
    ["sources", "is_active"], ["sources", "verification_status"],
    ["content_categories", "description"], ["contents", "body"], ["contents", "category_id"],
    ["contents", "type"], ["contents", "status"], ["contents", "metadata"],
    ["content_sources", "citation_label"], ["career_professions", "name"],
    ["career_professions", "display_order"], ["career_profile_items", "value"],
    ["career_profile_items", "section"],
  ] as const)("detects field mismatch in %s.%s", (table, field) => {
    const dataset = careerFixture(); const snapshot = careerSnapshot(dataset);
    snapshot.rows[table][0].values[field] = "incorrect";
    const report = evaluateCareerVerification(dataset, snapshot);
    expect(report.passed).toBe(false);
    expect(report.tables.find((entry) => entry.table === table)!.mismatched[0].fields).toContain(field);
  });
  it("detects duplicate and unexpected children within target scope", () => {
    const dataset = careerFixture(); const snapshot = careerSnapshot(dataset);
    const row = snapshot.rows.career_profile_items[0];
    snapshot.rows.career_profile_items.push(structuredClone(row));
    snapshot.rows.career_profile_items.push({ ...structuredClone(row), key: "extra-item" });
    const report = evaluateCareerVerification(dataset, snapshot);
    expect(report.passed).toBe(false);
    expect(report.tables.find((entry) => entry.table === "career_profile_items")).toMatchObject({ duplicates: 1, unexpected: ["extra-item"] });
  });
  it("reports absent sections and source relations per category", () => {
    const dataset = careerFixture(); const snapshot = careerSnapshot(dataset);
    const slug = dataset.categoryFiles[0].data.categorySlug; const key = careerContentKey(slug);
    snapshot.rows.career_profile_items = snapshot.rows.career_profile_items.filter((row) =>
      row.values.content_id !== key || row.values.section !== "software");
    snapshot.rows.content_sources = snapshot.rows.content_sources.filter((row) => row.values.content_id !== key);
    const report = evaluateCareerVerification(dataset, snapshot);
    expect(report.passed).toBe(false);
    expect(report.perCategory.find((row) => row.slug === slug)).toMatchObject({ missingSections: ["software"], sources: 0 });
  });
  it("ignores unrelated module data and Career records outside the 13 manifest slugs", () => {
    const dataset = careerFixture(); const snapshot = careerSnapshot(dataset);
    snapshot.rows.sources.push({ key: "unrelated", values: { is_active: false } });
    snapshot.rows.contents.push({ key: careerContentKey("outside"), values: { module: "career", slug: "outside" } });
    snapshot.rows.career_profile_items.push({ key: "outside-item", values: { content_id: careerContentKey("outside") } });
    expect(evaluateCareerVerification(dataset, snapshot).passed).toBe(true);
  });
  it("detects an unexpected source linked to target content", () => {
    const dataset = careerFixture(); const snapshot = careerSnapshot(dataset);
    snapshot.rows.content_sources.push({ key: "extra-link", values: {
      content_id: careerContentKey(dataset.categoryFiles[0].data.categorySlug), source_id: "extra-source" } });
    snapshot.rows.sources.push({ key: "extra-source", values: { is_active: true, verification_status: "verified" } });
    const report = evaluateCareerVerification(dataset, snapshot);
    expect(report.passed).toBe(false);
    expect(report.tables[0].unexpected).toContain("extra-source");
  });
});
