import { REQUIRED_CAREER_PROFILE_SECTIONS } from "../schemas/career-import";
import { CAREER_IMPORT_TABLES, careerContentKey, careerMismatchedFields,
  createCareerExpectedRows, scopeCareerRows, type CareerSnapshot } from "./career-import-model";
import { evaluateCareerPreflight } from "./preflight-career-import";
import type { ValidatedCareerImport } from "./validate-career-import";

export function evaluateCareerVerification(dataset: ValidatedCareerImport, snapshot: CareerSnapshot) {
  const expected = createCareerExpectedRows(dataset);
  const actual = scopeCareerRows(dataset, snapshot.rows);
  const preflight = evaluateCareerPreflight(dataset, snapshot);
  const tables = CAREER_IMPORT_TABLES.map((table) => {
    const expectedKeys = new Set(expected[table].map((row) => row.key));
    const actualByKey = new Map(actual[table].map((row) => [row.key, row]));
    const missing = expected[table].filter((row) => !actualByKey.has(row.key)).map((row) => row.key);
    const unexpected = actual[table].filter((row) => !expectedKeys.has(row.key)).map((row) => row.key);
    const mismatched = expected[table].flatMap((row) => {
      const existing = actualByKey.get(row.key);
      const fields = existing ? careerMismatchedFields(row, existing) : [];
      return fields.length ? [{ key: row.key, fields }] : [];
    });
    const duplicates = actual[table].length - actualByKey.size;
    return { table, expected: expected[table].length, actual: actual[table].length,
      missing, mismatched, duplicates, unexpected,
      passed: !missing.length && !mismatched.length && !duplicates && !unexpected.length };
  });
  const perCategory = dataset.categoryFiles.map(({ data }) => {
    const key = careerContentKey(data.categorySlug);
    const items = actual.career_profile_items.filter((row) => row.values.content_id === key);
    const sections = Object.fromEntries(REQUIRED_CAREER_PROFILE_SECTIONS.map((section) => [section,
      items.filter((row) => row.values.section === section).length]));
    return { slug: data.categorySlug,
      professions: actual.career_professions.filter((row) => row.values.content_id === key).length,
      profileItems: items.length,
      sources: actual.content_sources.filter((row) => row.values.content_id === key).length,
      sections, missingSections: REQUIRED_CAREER_PROFILE_SECTIONS.filter((section) => !sections[section]) };
  });
  return { passed: preflight.passed && tables.every((table) => table.passed) &&
    actual.contents.length === 13 && actual.content_categories.length === 13 &&
    perCategory.every((category) => category.sources > 0 && !category.missingSections.length),
    issues: preflight.issues, tables, perCategory };
}
