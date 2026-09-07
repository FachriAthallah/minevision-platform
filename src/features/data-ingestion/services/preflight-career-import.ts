import { CAREER_IMPORT_TABLES, careerContentKey, createCareerExpectedRows,
  scopeCareerRows, type CareerSnapshot } from "./career-import-model";
import { validateCareerImport, type ValidatedCareerImport } from "./validate-career-import";

export function evaluateCareerPreflight(dataset: ValidatedCareerImport, snapshot: CareerSnapshot) {
  const issues = [...snapshot.schemaIssues, ...snapshot.referenceIssues];
  // Reuse the existing contract even for direct service callers.
  const validation = validateCareerImport(dataset.manifest,
    dataset.categoryFiles.map((file) => ({ filePath: file.filePath, input: file.data })));
  if (!validation.success) issues.push(...validation.issues.map((issue) =>
    `${issue.code}: ${issue.filePath} :: ${issue.path}`));
  const slugs = new Set<string>(dataset.manifest.categoryFiles.map((file) => file.categorySlug));
  for (const table of ["contents", "content_categories"] as const) {
    for (const row of snapshot.rows[table]) {
      if (!slugs.has(String(row.values.slug))) continue;
      if (row.values.module !== "career") issues.push(`${table}: conflicting module for ${row.values.slug}`);
      if (table === "contents" && row.values.type !== "profession")
        issues.push(`contents: conflicting type for ${row.values.slug}`);
    }
  }
  const expected = createCareerExpectedRows(dataset);
  const scoped = scopeCareerRows(dataset, snapshot.rows);
  for (const table of CAREER_IMPORT_TABLES) {
    for (const [label, rows] of [["database", scoped[table]], ["staging", expected[table]]] as const) {
      const seen = new Set<string>();
      for (const row of rows) {
        if (seen.has(row.key)) issues.push(`${table}: duplicate ${label} natural key ${row.key}`);
        seen.add(row.key);
      }
    }
  }
  const sources = new Map(scoped.sources.map((row) => [row.key, row]));
  for (const source of expected.sources) {
    const existing = sources.get(source.key);
    if (!existing) continue;
    const normalizeUrl = (value: unknown) => typeof value === "string" ? value.replace(/\/+$/, "") : value;
    const identityDifferences = ["name", "type", "organization", "url"].filter((field) =>
      (field === "url" ? normalizeUrl(existing.values[field]) : existing.values[field]) !==
      (field === "url" ? normalizeUrl(source.values[field]) : source.values[field]));
    if (identityDifferences.length) {
      issues.push(`sources: conflicting source identity ${source.key} (fields: ${identityDifferences.join(", ")})`);
    }
  }
  const availableSources = new Set(expected.sources.map((row) => row.key));
  const categories = new Set(expected.content_categories.map((row) => row.key));
  for (const { data } of dataset.categoryFiles) {
    if (!categories.has(careerContentKey(data.profile.slug))) issues.push(`Missing category reference: ${data.profile.slug}`);
    for (const source of data.profile.sources) {
      if (!availableSources.has(source.sourceSlug)) issues.push(`Missing source reference: ${source.sourceSlug}`);
    }
  }
  return { passed: issues.length === 0, issues };
}
