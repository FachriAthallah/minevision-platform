import type { CareerAggregateCounts, CareerCategoryLink, CareerCategorySummary, CareerProfessionGroup, CareerProfessionItem, CareerSectionCode, CareerSectionCollection, CareerSectionCounts } from "../types/career";

export const careerSections = [
  { key: "workScope", code: "work_scope", label: "Ruang Lingkup Pekerjaan" },
  { key: "competency", code: "competency", label: "Kompetensi" },
  { key: "education", code: "education", label: "Pendidikan" },
  { key: "software", code: "software", label: "Software" },
  { key: "training", code: "training", label: "Pelatihan" },
] as const;
export const emptySectionCounts = (): CareerSectionCounts => ({ workScope: 0, competency: 0, education: 0, software: 0, training: 0 });
export const formatCareerCount = (value: number) => new Intl.NumberFormat("id-ID").format(value);
const compareKey = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
export function orderCareerCategories<T extends CareerCategoryLink>(rows: readonly T[]): T[] {
  return [...rows].sort((a, b) => a.displayOrder - b.displayOrder || compareKey(a.slug, b.slug));
}
export function filterCareerCategories(rows: readonly CareerCategorySummary[], query: string) {
  const q = query.trim().toLocaleLowerCase("id-ID");
  return orderCareerCategories(rows).filter((row) => [row.name, row.title, row.excerpt, row.description].some((value) => value?.toLocaleLowerCase("id-ID").includes(q)));
}
export function aggregateCareerCounts(rows: readonly CareerCategorySummary[]): CareerAggregateCounts {
  const sectionTotals = emptySectionCounts();
  for (const row of rows) for (const { key } of careerSections) sectionTotals[key] += row.sectionCounts[key];
  return { totalCategories: rows.length, totalProfessions: rows.reduce((sum, row) => sum + row.professionCount, 0), totalProfileItems: Object.values(sectionTotals).reduce((a, b) => a + b, 0), sectionTotals };
}
export function adjacentCareerCategories(rows: readonly CareerCategoryLink[], slug: string) {
  const sorted = orderCareerCategories(rows);
  const index = sorted.findIndex((row) => row.slug === slug);
  return { previous: index > 0 ? sorted[index - 1] : null, next: index >= 0 ? sorted[index + 1] ?? null : null };
}
export function groupCareerProfessions(rows: readonly (CareerProfessionItem & { groupKey: string; groupLabel: string })[]): CareerProfessionGroup[] {
  const groups = new Map<string, CareerProfessionGroup>();
  for (const row of [...rows].sort((a, b) => a.displayOrder - b.displayOrder || compareKey(a.slug, b.slug))) {
    const group = groups.get(row.groupKey) ?? { groupKey: row.groupKey, groupLabel: row.groupLabel, displayOrder: row.displayOrder, professionCount: 0, professions: [] };
    group.professions.push({ name: row.name, slug: row.slug, description: row.description, displayOrder: row.displayOrder });
    group.professionCount++;
    groups.set(row.groupKey, group);
  }
  return [...groups.values()].sort((a, b) => a.displayOrder - b.displayOrder || compareKey(a.groupKey, b.groupKey));
}
export function filterCareerProfessions(groups: readonly CareerProfessionGroup[], query: string): CareerProfessionGroup[] {
  const q = query.trim().toLocaleLowerCase("id-ID");
  return groups.map((group) => {
    const professions = group.professions.filter((item) => [item.name, item.description].some((value) => value?.toLocaleLowerCase("id-ID").includes(q)));
    return { ...group, professions, professionCount: professions.length };
  }).filter((group) => group.professionCount > 0);
}
export function groupCareerItems(rows: readonly { section: CareerSectionCode; groupKey: string; groupLabel: string; itemKey: string; value: string; displayOrder: number }[]): CareerSectionCollection {
  const result: CareerSectionCollection = { workScope: [], competency: [], education: [], software: [], training: [] };
  for (const { key, code } of careerSections) {
    const groups = new Map<string, CareerSectionCollection[typeof key][number]>();
    for (const row of [...rows].filter((item) => item.section === code).sort((a, b) => a.displayOrder - b.displayOrder || compareKey(a.itemKey, b.itemKey))) {
      const group = groups.get(row.groupKey) ?? { section: row.section, groupKey: row.groupKey, groupLabel: row.groupLabel, displayOrder: row.displayOrder, values: [] };
      group.values.push({ itemKey: row.itemKey, value: row.value, displayOrder: row.displayOrder });
      groups.set(row.groupKey, group);
    }
    result[key] = [...groups.values()].sort((a, b) => a.displayOrder - b.displayOrder || compareKey(a.groupKey, b.groupKey));
  }
  return result;
}
export function safeCareerSourceUrl(value: string | null): string | null {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:" ? value : null; } catch { return null; }
}
