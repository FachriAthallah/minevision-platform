import "server-only";

import { and, asc, eq, ilike, or } from "drizzle-orm";

import { db } from "@/db";
import { commodities, commodityContents, contents } from "@/db/schema";

import type { CommodityListQuery } from "../schemas/commodity-query";
import type { PublicCommoditySummary } from "../types/commodity";

export async function getPublicCommodities(
  query: CommodityListQuery,
): Promise<PublicCommoditySummary[]> {
  const rows = await db
    .select({
      id: commodities.id,
      name: commodities.name,
      slug: commodities.slug,
      symbol: commodities.symbol,
      category: commodities.category,
      description: commodities.description,
      specification: commodities.specification,
      imageUrl: commodities.imageUrl,
      imageAlt: commodities.imageAlt,
      imageCredit: commodities.imageCredit,
      imageSourceUrl: commodities.imageSourceUrl,
      isIntelligenceTracked: commodities.isIntelligenceTracked,
      displayOrder: commodities.displayOrder,
      profileTitle: contents.title,
      profileExcerpt: contents.excerpt,
      readingTimeMinutes: contents.readingTimeMinutes,
      isFeatured: contents.isFeatured,
      publishedAt: contents.publishedAt,
    })
    .from(commodities)
    .innerJoin(
      commodityContents,
      and(
        eq(commodityContents.commodityId, commodities.id),
        eq(commodityContents.isPrimary, true),
      ),
    )
    .innerJoin(
      contents,
      and(
        eq(contents.id, commodityContents.contentId),
        eq(contents.module, "commodities"),
        eq(contents.type, "commodity_profile"),
        eq(contents.status, "published"),
      ),
    )
    .where(
      and(
        eq(commodities.isActive, true),
        query.category !== undefined
          ? eq(commodities.category, query.category)
          : undefined,
        query.intelligenceTracked !== undefined
          ? eq(commodities.isIntelligenceTracked, query.intelligenceTracked)
          : undefined,
        query.search !== undefined
          ? or(
              ilike(commodities.name, `%${query.search}%`),
              ilike(commodities.description, `%${query.search}%`),
              ilike(commodities.specification, `%${query.search}%`),
              ilike(contents.title, `%${query.search}%`),
              ilike(contents.excerpt, `%${query.search}%`),
            )
          : undefined,
      ),
    )
    .orderBy(asc(commodities.displayOrder), asc(commodities.name));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    symbol: row.symbol,
    category: row.category,
    description: row.description,
    specification: row.specification,
    image:
      row.imageUrl === null
        ? null
        : {
            url: row.imageUrl,
            alt: row.imageAlt,
            credit: row.imageCredit,
            sourceUrl: row.imageSourceUrl,
          },
    isIntelligenceTracked: row.isIntelligenceTracked,
    displayOrder: row.displayOrder,
    profile: {
      title: row.profileTitle,
      excerpt: row.profileExcerpt,
      readingTimeMinutes: row.readingTimeMinutes,
      isFeatured: row.isFeatured,
      publishedAt: row.publishedAt?.toISOString() ?? null,
    },
  }));
}
