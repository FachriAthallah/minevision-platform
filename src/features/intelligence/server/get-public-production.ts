import "server-only";

import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";

import { db } from "@/db";
import {
  commodities,
  commodityProduction,
  commodityProductionSources,
  measurementUnits,
  sources,
} from "@/db/schema";

import { isPubliclyVisible } from "../policies/publication-visibility";
import type { ProductionQuery } from "../schemas/production-query";

export async function getPublicProduction(query: ProductionQuery) {
  const productionRows = await db
    .select({
      id: commodityProduction.id,

      commodityName: commodities.name,
      commoditySlug: commodities.slug,
      commoditySymbol: commodities.symbol,

      year: commodityProduction.year,
      productionValue: commodityProduction.productionValue,
      recordType: commodityProduction.recordType,

      verificationStatus: commodityProduction.verificationStatus,
      publicationStatus: commodityProduction.publicationStatus,

      unitCode: measurementUnits.code,
      unitName: measurementUnits.name,
      unitSymbol: measurementUnits.symbol,
    })
    .from(commodityProduction)
    .innerJoin(commodities, eq(commodityProduction.commodityId, commodities.id))
    .innerJoin(
      measurementUnits,
      eq(commodityProduction.unitCode, measurementUnits.code),
    )
    .where(
      and(
        eq(commodities.slug, query.commodity),
        eq(commodities.isActive, true),
        eq(commodities.isIntelligenceTracked, true),
        eq(measurementUnits.isActive, true),

        // Lapisan keamanan pertama: filter langsung di database.
        eq(commodityProduction.verificationStatus, "verified"),
        eq(commodityProduction.publicationStatus, "published"),

        query.fromYear !== undefined
          ? gte(commodityProduction.year, query.fromYear)
          : undefined,

        query.toYear !== undefined
          ? lte(commodityProduction.year, query.toYear)
          : undefined,
      ),
    )
    .orderBy(asc(commodityProduction.year));

  // Lapisan keamanan kedua: policy aplikasi.
  // Ini mencegah data non-publik lolos jika query berubah di masa depan.
  const publiclyVisibleRows = productionRows.filter(isPubliclyVisible);

  if (publiclyVisibleRows.length === 0) {
    return [];
  }

  const productionIds = publiclyVisibleRows.map((record) => record.id);

  const citationRows = await db
    .select({
      productionId: commodityProductionSources.productionId,

      citationLabel: commodityProductionSources.citationLabel,
      pageReference: commodityProductionSources.pageReference,
      citationUrl: commodityProductionSources.sourceUrl,
      isPrimary: commodityProductionSources.isPrimary,

      sourceName: sources.name,
      sourceSlug: sources.slug,
      sourceOrganization: sources.organization,
      sourceUrl: sources.url,
    })
    .from(commodityProductionSources)
    .innerJoin(sources, eq(commodityProductionSources.sourceId, sources.id))
    .where(
      and(
        inArray(commodityProductionSources.productionId, productionIds),
        eq(sources.isActive, true),
        eq(sources.verificationStatus, "verified"),
      ),
    );

  const citationsByProductionId = new Map<
    string,
    Array<{
      label: string;
      pageReference: string | null;
      url: string | null;
      isPrimary: boolean;
      source: {
        name: string;
        slug: string;
        organization: string;
      };
    }>
  >();

  for (const citation of citationRows) {
    const currentCitations =
      citationsByProductionId.get(citation.productionId) ?? [];

    currentCitations.push({
      label: citation.citationLabel,
      pageReference: citation.pageReference,
      url: citation.citationUrl ?? citation.sourceUrl ?? null,
      isPrimary: citation.isPrimary,
      source: {
        name: citation.sourceName,
        slug: citation.sourceSlug,
        organization: citation.sourceOrganization,
      },
    });

    citationsByProductionId.set(citation.productionId, currentCitations);
  }

  return publiclyVisibleRows.map((record) => ({
    commodity: {
      name: record.commodityName,
      slug: record.commoditySlug,
      symbol: record.commoditySymbol,
    },

    year: record.year,

    value: Number(record.productionValue),

    unit: {
      code: record.unitCode,
      name: record.unitName,
      symbol: record.unitSymbol,
    },

    recordType: record.recordType,

    sources: citationsByProductionId.get(record.id) ?? [],
  }));
}
