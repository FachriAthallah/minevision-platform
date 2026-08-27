import "server-only";

import { and, desc, eq, gte, lte } from "drizzle-orm";

import { db } from "@/db";
import {
  commodities,
  commodityDomesticPrices,
  commodityPriceStandards,
  measurementUnits,
  sources,
} from "@/db/schema";

import { isPubliclyVisible } from "../policies/publication-visibility";
import type { DomesticPriceQuery } from "../schemas/domestic-price-query";

export async function getPublicDomesticPrices(query: DomesticPriceQuery) {
  const priceRows = await db
    .select({
      id: commodityDomesticPrices.id,

      commodityName: commodities.name,
      commoditySlug: commodities.slug,
      commoditySymbol: commodities.symbol,

      standardCode: commodityPriceStandards.code,
      standardName: commodityPriceStandards.name,

      effectiveDate: commodityDomesticPrices.effectiveDate,

      period: commodityDomesticPrices.period,

      periodLabel: commodityDomesticPrices.periodLabel,

      priceValue: commodityDomesticPrices.priceValue,

      currencyCode: commodityDomesticPrices.currencyCode,

      recordType: commodityDomesticPrices.recordType,

      verificationStatus: commodityDomesticPrices.verificationStatus,

      publicationStatus: commodityDomesticPrices.publicationStatus,

      unitCode: measurementUnits.code,
      unitName: measurementUnits.name,
      unitSymbol: measurementUnits.symbol,

      sourceName: sources.name,
      sourceSlug: sources.slug,
      sourceOrganization: sources.organization,
      sourceUrl: sources.url,
    })
    .from(commodityDomesticPrices)
    .innerJoin(
      commodityPriceStandards,
      eq(commodityDomesticPrices.priceStandardId, commodityPriceStandards.id),
    )
    .innerJoin(
      commodities,
      eq(commodityPriceStandards.commodityId, commodities.id),
    )
    .innerJoin(
      measurementUnits,
      eq(commodityDomesticPrices.unitCode, measurementUnits.code),
    )
    .innerJoin(sources, eq(commodityDomesticPrices.sourceId, sources.id))
    .where(
      and(
        query.commodity !== undefined
          ? eq(commodities.slug, query.commodity)
          : undefined,

        eq(commodities.isActive, true),
        eq(commodities.isIntelligenceTracked, true),

        eq(commodityPriceStandards.isActive, true),

        eq(measurementUnits.isActive, true),

        eq(sources.isActive, true),
        eq(sources.verificationStatus, "verified"),

        eq(commodityDomesticPrices.verificationStatus, "verified"),
        eq(commodityDomesticPrices.publicationStatus, "published"),

        query.standard !== undefined
          ? eq(commodityPriceStandards.code, query.standard)
          : undefined,

        query.fromDate !== undefined
          ? gte(commodityDomesticPrices.effectiveDate, query.fromDate)
          : undefined,

        query.toDate !== undefined
          ? lte(commodityDomesticPrices.effectiveDate, query.toDate)
          : undefined,

        query.period !== undefined
          ? eq(commodityDomesticPrices.period, query.period)
          : undefined,
      ),
    )
    .orderBy(
      desc(commodityDomesticPrices.effectiveDate),
      desc(commodityDomesticPrices.createdAt),
    );

  const publiclyVisibleRows = priceRows.filter(isPubliclyVisible);

  return publiclyVisibleRows.map((record) => ({
    commodity: {
      name: record.commodityName,
      slug: record.commoditySlug,
      symbol: record.commoditySymbol,
    },

    standard: {
      code: record.standardCode,
      name: record.standardName,
    },

    effectiveDate: record.effectiveDate,
    period: record.period,
    periodLabel: record.periodLabel,

    value: Number(record.priceValue),
    currencyCode: record.currencyCode,

    unit: {
      code: record.unitCode,
      name: record.unitName,
      symbol: record.unitSymbol,
    },

    recordType: record.recordType,

    source: {
      name: record.sourceName,
      slug: record.sourceSlug,
      organization: record.sourceOrganization,
      url: record.sourceUrl,
    },
  }));
}
