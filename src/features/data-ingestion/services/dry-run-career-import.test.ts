import { describe, expect, it, vi } from "vitest";
import { createCareerDryRunPlan } from "./dry-run-career-import";
import { careerFixture, careerSnapshot } from "./career-import-test-helpers";
import { evaluateCareerPreflight } from "./preflight-career-import";
import { parseCareerArguments } from "../../../../scripts/career/cli";
import { withCareerReadOnly } from "../../../../scripts/career/database";
import type postgres from "postgres";

describe("Career dry-run", () => {
  it("plans the full staging dataset and all five section totals", () => {
    const plan = createCareerDryRunPlan(careerFixture(), careerSnapshot());
    expect(plan.passed).toBe(true);
    expect(Object.fromEntries(plan.tables.map((row) => [row.table, row.inserts]))).toEqual({
      sources: 166, content_categories: 13, contents: 13, content_sources: 187,
      career_professions: 2477, career_profile_items: 2675,
    });
    expect(plan.perCategory).toHaveLength(13);
    expect(plan.softwareTables).toBe(13);
    expect(plan.totalUpdates).toBe(0);
    expect(plan.totalUnchanged).toBe(0);
    const totals = Object.fromEntries(["work_scope", "competency", "education", "software", "training"].map((section) =>
      [section, plan.perCategory.reduce((sum, row) => sum + row.sections[section], 0)]));
    expect(totals).toEqual({ work_scope: 305, competency: 1016, education: 412, software: 274, training: 668 });
    expect(plan.sectionTotals).toEqual(totals);
  });
  it("classifies insert/update/unchanged by field values", () => {
    const dataset = careerFixture(); const snapshot = careerSnapshot(dataset);
    snapshot.rows.career_professions.pop();
    snapshot.rows.career_profile_items[0].values.value = "changed";
    const plan = createCareerDryRunPlan(dataset, snapshot);
    expect(plan.totalInserts).toBe(1); expect(plan.totalUpdates).toBe(1);
    expect(plan.totalUnchanged).toBe(plan.expectedTotal - 2);
  });
  it("compares nested JSON independent of object order and timestamps by instant", () => {
    const dataset = careerFixture();
    dataset.categoryFiles[0].data.profile.metadata = { b: 2, a: { y: 2, x: 1 } };
    const snapshot = careerSnapshot(dataset);
    const row = snapshot.rows.contents.find((row) => row.values.slug === dataset.categoryFiles[0].data.categorySlug)!;
    row.values.metadata = { a: { x: 1, y: 2 }, b: 2 };
    row.values.published_at = "2026-09-05T07:00:00+07:00";
    expect(createCareerDryRunPlan(dataset, snapshot).totalUpdates).toBe(0);
  });
  it("preflight and planning do not mutate their inputs or invoke write callbacks", () => {
    const dataset = careerFixture(); const snapshot = careerSnapshot(dataset);
    const before = structuredClone({ dataset, snapshot });
    const write = vi.fn();
    const state = { ...snapshot, write };
    evaluateCareerPreflight(dataset, state); createCareerDryRunPlan(dataset, state);
    expect({ dataset, snapshot }).toEqual(before); expect(write).not.toHaveBeenCalled();
  });
  it.each(["preflight", "dry-run", "verify"] as const)("requires a manifest and rejects write flags for %s", (mode) => {
    expect(() => parseCareerArguments(mode, [])).toThrow();
    expect(() => parseCareerArguments(mode, ["manifest.json", "--commit"])).toThrow();
    expect(parseCareerArguments(mode, ["manifest.json"])).toBe("manifest.json");
  });
  it("read-only transaction checks its mode and unassigned xid then rolls back", async () => {
    const statements: string[] = [];
    const sql = vi.fn(async (parts: TemplateStringsArray) => {
      statements.push(parts.join("")); return [{ read_only: "on", xid: null }];
    });
    const client = { begin: vi.fn(async (mode: string, work: (sql: unknown) => Promise<unknown>) => {
      statements.push(`BEGIN ${mode}`);
      try { return await work(sql); } catch (error) { statements.push("ROLLBACK"); throw error; }
    }) };
    const result = await withCareerReadOnly(client as unknown as postgres.Sql<Record<string, never>>, async () => 42);
    expect(result).toEqual({ value: 42, proof: { transactionReadOnly: "on", transactionIdAssigned: false, rolledBack: true } });
    expect(statements[0]).toContain("read only"); expect(statements.at(-1)).toBe("ROLLBACK");
    expect(statements.join(" ")).not.toMatch(/\b(INSERT|UPDATE|DELETE|TRUNCATE|CREATE|ALTER|nextval|setval)\b/i);
  });
});
