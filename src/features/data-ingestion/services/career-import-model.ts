import type { ValidatedCareerImport } from "./validate-career-import";

export const CAREER_IMPORT_TABLES = [
  "sources", "content_categories", "contents", "content_sources",
  "career_professions", "career_profile_items",
] as const;
export type CareerImportTable = (typeof CAREER_IMPORT_TABLES)[number];
export type CareerRow = { key: string; values: Record<string, unknown>; id?: string };
export type CareerRows = Record<CareerImportTable, CareerRow[]>;
export type CareerSnapshot = {
  rows: CareerRows;
  schemaIssues: string[];
  referenceIssues: string[];
};

// Foreign keys in the pure model use the parent's natural key. Only the SQL
// adapter translates these to UUIDs, after the parents have been resolved.
export const careerKey = (...parts: string[]) => JSON.stringify(parts);
export const careerContentKey = (slug: string) => careerKey("career", slug);
export function emptyCareerRows(): CareerRows {
  return { sources: [], content_categories: [], contents: [], content_sources: [],
    career_professions: [], career_profile_items: [] };
}

export function canonicalCareerValue(value: unknown): string {
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(canonicalCareerValue).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalCareerValue(entry)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "undefined";
}

export function careerMismatchedFields(expected: CareerRow, actual: CareerRow) {
  return Object.keys(expected.values).filter((field) => {
    const normalize = (value: unknown) => field === "published_at" &&
      (typeof value === "string" || value instanceof Date)
      ? new Date(value).toISOString() : value;
    return canonicalCareerValue(normalize(expected.values[field])) !==
      canonicalCareerValue(normalize(actual.values[field]));
  });
}

export function createCareerExpectedRows(dataset: ValidatedCareerImport): CareerRows {
  const rows = emptyCareerRows();
  for (const source of dataset.manifest.sourceCatalog) {
    rows.sources.push({ key: source.slug, values: {
      slug: source.slug, name: source.name, type: source.type,
      organization: source.organization, url: source.url,
      description: source.description, is_official: source.isOfficial,
      verification_status: source.verificationStatus, is_active: true,
    } });
  }
  for (const { data } of dataset.categoryFiles) {
    const key = careerContentKey(data.categorySlug);
    const category = data.category;
    rows.content_categories.push({ key, values: {
      module: "career", slug: category.slug, name: category.name,
      description: category.description, display_order: category.displayOrder,
      is_active: category.isActive,
    } });
    const profile = data.profile;
    rows.contents.push({ key, values: {
      module: "career", type: "profession", slug: profile.slug, category_id: key,
      title: profile.title, excerpt: profile.excerpt, body: profile.body,
      cover_image_url: profile.coverImageUrl, status: profile.status,
      published_at: new Date(profile.publishedAt).toISOString(),
      reading_time_minutes: profile.readingTimeMinutes,
      is_featured: profile.isFeatured, metadata: profile.metadata,
    } });
    for (const source of profile.sources) {
      rows.content_sources.push({ key: careerKey(key, source.sourceSlug), values: {
        content_id: key, source_id: source.sourceSlug, citation_label: source.citationLabel,
        page_reference: source.pageReference, display_order: source.displayOrder,
      } });
    }
    for (const profession of data.professions) {
      rows.career_professions.push({ key: careerKey(key, profession.groupKey, profession.slug), values: {
        content_id: key, group_key: profession.groupKey, group_label: profession.groupLabel,
        name: profession.name, slug: profession.slug, description: profession.description,
        display_order: profession.displayOrder,
      } });
    }
    for (const item of data.profileItems) {
      rows.career_profile_items.push({ key: careerKey(key, item.itemKey), values: {
        content_id: key, item_key: item.itemKey, section: item.section,
        group_key: item.groupKey, group_label: item.groupLabel,
        value: item.value, display_order: item.displayOrder,
      } });
    }
  }
  for (const table of CAREER_IMPORT_TABLES) rows[table].sort((a, b) => a.key.localeCompare(b.key));
  return rows;
}

export function scopeCareerRows(dataset: ValidatedCareerImport, rows: CareerRows): CareerRows {
  const keys = new Set(dataset.manifest.categoryFiles.map((file) => careerContentKey(file.categorySlug)));
  const scoped = emptyCareerRows();
  for (const table of CAREER_IMPORT_TABLES) {
    if (table === "sources") continue;
    scoped[table] = rows[table].filter((row) =>
      table === "contents" || table === "content_categories"
        ? keys.has(row.key) : keys.has(String(row.values.content_id)));
  }
  const sources = new Set([
    ...dataset.manifest.sourceCatalog.map((source) => source.slug),
    ...scoped.content_sources.map((row) => String(row.values.source_id)),
  ]);
  scoped.sources = rows.sources.filter((row) => sources.has(row.key));
  return scoped;
}
