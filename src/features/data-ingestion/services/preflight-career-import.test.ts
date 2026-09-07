import { describe, expect, it } from "vitest";
import { evaluateCareerPreflight } from "./preflight-career-import";
import { careerFixture, careerSnapshot } from "./career-import-test-helpers";
import { normalizeCareerSnapshot, evaluateCareerCatalog, type CareerCatalog } from "../../../../scripts/career/database";
import { emptyCareerRows } from "./career-import-model";

describe("Career preflight", () => {
  it("accepts valid staging and insertable parent references", () => {
    expect(evaluateCareerPreflight(careerFixture(), careerSnapshot()).passed).toBe(true);
  });
  it.each(["module", "type"])("rejects conflicting content %s", (field) => {
    const dataset = careerFixture();
    const snapshot = careerSnapshot(dataset);
    snapshot.rows.contents[0].values[field] = field === "module" ? "education" : "article";
    expect(evaluateCareerPreflight(dataset, snapshot).issues.join()).toContain(`conflicting ${field}`);
  });
  it("rejects non-Career category slug collision", () => {
    const dataset = careerFixture(); const snapshot = careerSnapshot(dataset);
    snapshot.rows.content_categories[0].values.module = "industry";
    expect(evaluateCareerPreflight(dataset, snapshot).passed).toBe(false);
  });
  it.each(["name", "organization", "type", "url"])("rejects source identity change: %s", (field) => {
    const dataset = careerFixture(); const snapshot = careerSnapshot(dataset);
    snapshot.rows.sources[0].values[field] = "different";
    expect(evaluateCareerPreflight(dataset, snapshot).issues.join()).toContain("conflicting source identity");
  });
  it("accepts equivalent source trailing slash", () => {
    const dataset = careerFixture(); const snapshot = careerSnapshot(dataset);
    snapshot.rows.sources.find((row) => typeof row.values.url === "string")!.values.url += "/";
    expect(evaluateCareerPreflight(dataset, snapshot).passed).toBe(true);
  });
  it("rejects unknown staging source through existing validator", () => {
    const dataset = careerFixture(); dataset.categoryFiles[0].data.profile.sources[0].sourceSlug = "unknown-source";
    expect(evaluateCareerPreflight(dataset, careerSnapshot()).issues.join()).toContain("unknown_source");
  });
  it("detects a missing database source reference rather than losing the relation in an inner join", () => {
    const raw = { ...emptyCareerRows(), contents: [{ id: "c", module: "career", slug: "test", category_id: null }],
      content_sources: [{ content_id: "c", source_id: "missing" }] };
    const snapshot = normalizeCareerSnapshot(raw);
    expect(snapshot.rows.content_sources).toHaveLength(1);
    expect(snapshot.referenceIssues.join()).toContain("Missing database reference");
    expect(evaluateCareerPreflight(careerFixture(), snapshot).passed).toBe(false);
  });
  it("rejects missing schema and enum/index/FK/check requirements", () => {
    const catalog: CareerCatalog = { columns: [], indexes: [], foreignKeys: [], enums: [], checks: [] };
    const issues = evaluateCareerCatalog(catalog).join();
    for (const kind of ["column", "enum", "unique index", "foreign key", "check"])
      expect(issues).toContain(`Schema ${kind}`);
    const snapshot = careerSnapshot(); snapshot.schemaIssues = evaluateCareerCatalog(catalog);
    expect(evaluateCareerPreflight(careerFixture(), snapshot).passed).toBe(false);
  });
  it("rejects duplicate natural keys", () => {
    const dataset = careerFixture(); const snapshot = careerSnapshot(dataset);
    snapshot.rows.career_professions.push(snapshot.rows.career_professions[0]);
    expect(evaluateCareerPreflight(dataset, snapshot).issues.join()).toContain("duplicate database natural key");
  });
  it.each(["partial", "invalid", "non-unique", "wrong-columns", "deferred"])("rejects %s natural-key index", (problem) => {
    const catalog: CareerCatalog = { columns: [], indexes: [{ table_name: "career_professions",
      columns: problem === "wrong-columns" ? ["content_id", "slug"] : ["content_id", "group_key", "slug"],
      is_unique: problem !== "non-unique", valid: problem !== "invalid", partial: problem === "partial", immediate: problem !== "deferred" }],
      foreignKeys: [], enums: [], checks: [] };
    expect(evaluateCareerCatalog(catalog).join()).toContain("unique index missing/incompatible: career_professions(content_id,group_key,slug)");
  });
});
