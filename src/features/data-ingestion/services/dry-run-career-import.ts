import { CAREER_IMPORT_TABLES, createCareerExpectedRows, careerMismatchedFields,
  scopeCareerRows, type CareerRow, type CareerSnapshot } from "./career-import-model";
import { evaluateCareerPreflight } from "./preflight-career-import";
import type { ValidatedCareerImport } from "./validate-career-import";
import { REQUIRED_CAREER_PROFILE_SECTIONS } from "../schemas/career-import";

export type CareerPlannedRow = CareerRow & { action: "insert" | "update" | "unchanged" };

export function createCareerDryRunPlan(dataset: ValidatedCareerImport, snapshot: CareerSnapshot) {
  const expected = createCareerExpectedRows(dataset);
  const actual = scopeCareerRows(dataset, snapshot.rows);
  const preflight = evaluateCareerPreflight(dataset, snapshot);
  const tables = CAREER_IMPORT_TABLES.map((table) => {
    const existing = new Map(actual[table].map((row) => [row.key, row]));
    const records = expected[table].map<CareerPlannedRow>((row) => {
      const prior = existing.get(row.key);
      return { ...row, action: !prior ? "insert" :
        careerMismatchedFields(row, prior).length ? "update" : "unchanged" };
    });
    return { table, expected: records.length,
      inserts: records.filter((row) => row.action === "insert").length,
      updates: records.filter((row) => row.action === "update").length,
      unchanged: records.filter((row) => row.action === "unchanged").length,
      records };
  });
  const perCategory = dataset.categoryFiles.map(({ data }) => ({
    slug: data.categorySlug, categories: 1, contents: 1,
    content_sources: data.profile.sources.length,
    career_professions: data.professions.length, career_profile_items: data.profileItems.length,
    sections: Object.fromEntries(REQUIRED_CAREER_PROFILE_SECTIONS
      .map((section) => [section, data.profileItems.filter((item) => item.section === section).length])),
  }));
  return { passed: preflight.passed, issues: preflight.issues, tables, perCategory,
    sectionTotals: Object.fromEntries(REQUIRED_CAREER_PROFILE_SECTIONS.map((section) =>
      [section, perCategory.reduce((sum, category) => sum + category.sections[section], 0)])),
    softwareTables: dataset.categoryFiles.reduce((sum, { data }) =>
      sum + (data.profile.body.match(/^\|(?:\s*:?-+:?\s*\|)+\s*$/gm)?.length ?? 0), 0),
    expectedTotal: tables.reduce((sum, table) => sum + table.expected, 0),
    totalInserts: tables.reduce((sum, table) => sum + table.inserts, 0),
    totalUpdates: tables.reduce((sum, table) => sum + table.updates, 0),
    totalUnchanged: tables.reduce((sum, table) => sum + table.unchanged, 0) };
}
