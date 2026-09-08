import "server-only";

import { and, asc, count, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { careerProfessions, careerProfileItems, contentCategories, contents, contentSources, sources } from "@/db/schema";
import { adjacentCareerCategories, aggregateCareerCounts, careerSections, emptySectionCounts, filterCareerCategories, groupCareerItems, groupCareerProfessions, safeCareerSourceUrl } from "../lib/career-view";
import type { CareerListQuery } from "../schemas/career-query";
import type { CareerCatalog, CareerCategorySummary, CareerDetail } from "../types/career";

// Required even when the server connection has privileges that bypass RLS.
const eligibleCategory = and(eq(contentCategories.module, "career"), eq(contentCategories.isActive, true));
const eligibleContent = and(eq(contents.module, "career"), eq(contents.type, "profession"), eq(contents.status, "published"));
const eligibleSource = and(eq(sources.isActive, true), eq(sources.verificationStatus, "verified"));
const profileJoin = and(eq(contents.categoryId, contentCategories.id), eq(contents.slug, contentCategories.slug), eligibleContent);

// Some imported summaries contain the document heading rather than its prose.
// Project only the original introductory paragraph, never the entire catalog body.
const firstParagraph = sql<string>`split_part(replace(${contents.body}, chr(13), ''), chr(10) || chr(10), 1)`;
const introduction = sql<string>`case when btrim(${firstParagraph}) = 'Deskripsi Kategori'
  then split_part(replace(${contents.body}, chr(13), ''), chr(10) || chr(10), 2)
  else ${firstParagraph} end`;
const publicDescription = sql<string | null>`coalesce(nullif(nullif(btrim(${contentCategories.description}), 'Deskripsi Kategori'), ''), nullif(${introduction}, ''))`;
const publicExcerpt = sql<string | null>`coalesce(nullif(nullif(btrim(${contents.excerpt}), 'Deskripsi Kategori'), ''), ${publicDescription})`;

export async function getPublicCareers(query: CareerListQuery = {}): Promise<CareerCatalog> {
  const rows = await db.select({ contentId: contents.id, slug: contentCategories.slug, name: contentCategories.name, title: contents.title, excerpt: publicExcerpt, description: publicDescription, displayOrder: contentCategories.displayOrder })
    .from(contentCategories).innerJoin(contents, profileJoin).where(eligibleCategory)
    .orderBy(asc(contentCategories.displayOrder), asc(contentCategories.slug));
  if (rows.length === 0) return { categories: [], counts: aggregateCareerCounts([]) };
  const ids = rows.map((row) => row.contentId);
  // Three grouped queries for the whole catalog; no profession bodies are loaded.
  const [professions, items, citations] = await Promise.all([
    db.select({ contentId: careerProfessions.contentId, total: count() }).from(careerProfessions).where(inArray(careerProfessions.contentId, ids)).groupBy(careerProfessions.contentId),
    db.select({ contentId: careerProfileItems.contentId, section: careerProfileItems.section, total: count() }).from(careerProfileItems).where(inArray(careerProfileItems.contentId, ids)).groupBy(careerProfileItems.contentId, careerProfileItems.section),
    db.select({ contentId: contentSources.contentId, total: count() }).from(contentSources).innerJoin(sources, and(eq(sources.id, contentSources.sourceId), eligibleSource)).where(inArray(contentSources.contentId, ids)).groupBy(contentSources.contentId),
  ]);
  const professionCounts = new Map(professions.map((row) => [row.contentId, row.total]));
  const sourceCounts = new Map(citations.map((row) => [row.contentId, row.total]));
  const categories: CareerCategorySummary[] = rows.map(({ contentId, ...row }) => {
    const sectionCounts = emptySectionCounts();
    for (const { key, code } of careerSections) sectionCounts[key] = items.find((item) => item.contentId === contentId && item.section === code)?.total ?? 0;
    return { ...row, professionCount: professionCounts.get(contentId) ?? 0, sourceCount: sourceCounts.get(contentId) ?? 0, sectionCounts };
  });
  const filtered = filterCareerCategories(categories, query.q ?? "");
  return { categories: filtered, counts: aggregateCareerCounts(filtered) };
}

export async function getPublicCareerBySlug(slug: string): Promise<CareerDetail | null> {
  const [row] = await db.select({ contentId: contents.id, slug: contentCategories.slug, name: contentCategories.name, description: publicDescription, displayOrder: contentCategories.displayOrder, title: contents.title, excerpt: publicExcerpt, body: contents.body, publishedAt: contents.publishedAt, readingTimeMinutes: contents.readingTimeMinutes })
    .from(contentCategories).innerJoin(contents, profileJoin).where(and(eligibleCategory, eq(contentCategories.slug, slug))).limit(1);
  if (!row) return null;
  const [professions, items, citations, neighbors] = await Promise.all([
    db.select({ groupKey: careerProfessions.groupKey, groupLabel: careerProfessions.groupLabel, name: careerProfessions.name, slug: careerProfessions.slug, description: careerProfessions.description, displayOrder: careerProfessions.displayOrder }).from(careerProfessions).where(eq(careerProfessions.contentId, row.contentId)).orderBy(asc(careerProfessions.displayOrder), asc(careerProfessions.groupKey), asc(careerProfessions.slug)),
    db.select({ section: careerProfileItems.section, groupKey: careerProfileItems.groupKey, groupLabel: careerProfileItems.groupLabel, itemKey: careerProfileItems.itemKey, value: careerProfileItems.value, displayOrder: careerProfileItems.displayOrder }).from(careerProfileItems).where(eq(careerProfileItems.contentId, row.contentId)).orderBy(asc(careerProfileItems.displayOrder), asc(careerProfileItems.groupKey), asc(careerProfileItems.itemKey)),
    db.select({ name: sources.name, organization: sources.organization, type: sources.type, url: sources.url, citationLabel: contentSources.citationLabel, pageReference: contentSources.pageReference, displayOrder: contentSources.displayOrder }).from(contentSources).innerJoin(sources, and(eq(sources.id, contentSources.sourceId), eligibleSource)).where(eq(contentSources.contentId, row.contentId)).orderBy(asc(contentSources.displayOrder), asc(sources.slug)),
    db.select({ slug: contentCategories.slug, name: contentCategories.name, displayOrder: contentCategories.displayOrder }).from(contentCategories).innerJoin(contents, profileJoin).where(eligibleCategory).orderBy(asc(contentCategories.displayOrder), asc(contentCategories.slug)),
  ]);
  const sections = groupCareerItems(items);
  const sectionCounts = emptySectionCounts();
  for (const { key } of careerSections) sectionCounts[key] = sections[key].reduce((sum, group) => sum + group.values.length, 0);
  return {
    category: { slug: row.slug, name: row.name, description: row.description, displayOrder: row.displayOrder },
    // Arbitrary ingestion metadata is intentionally not part of the public DTO.
    profile: { title: row.title, excerpt: row.excerpt, body: row.body, publishedAt: row.publishedAt?.toISOString() ?? null, readingTimeMinutes: row.readingTimeMinutes },
    counts: { ...sectionCounts, professions: professions.length, sources: citations.length },
    professionGroups: groupCareerProfessions(professions), sections,
    sources: citations.map((source) => ({ ...source, url: safeCareerSourceUrl(source.url) })),
    navigation: adjacentCareerCategories(neighbors, row.slug),
  };
}
