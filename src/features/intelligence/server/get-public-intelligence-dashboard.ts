import "server-only";

import { and, asc, desc, eq, inArray, isNotNull } from "drizzle-orm";

import { db } from "@/db";
import {
  commodities,
  commodityDomesticPrices,
  commodityPriceSeries,
  commodityPriceStandards,
  commodityProduction,
  commodityProductionLocations,
  commodityProductionSeries,
  commodityProductionSources,
  commodityRegionCoverage,
  measurementUnits,
  regions,
  sources,
} from "@/db/schema";

import type { IntelligenceDashboardQuery } from "../schemas/dashboard-query";
import type {
  IntelligenceCommoditySlug,
  PublicIntelligenceCommodity,
  PublicIntelligenceDashboard,
  PublicIntelligenceSource,
} from "../types/dashboard";
import { intelligenceCommoditySlugs } from "../types/dashboard";
import { publicPriceSeriesConditions } from "./public-price-series";
import { publicProductionSeriesConditions } from "./public-production-series";

function publicSource(row: {
  sourceName: string;
  sourceSlug: string;
  sourceOrganization: string;
  sourceUrl: string | null;
}): PublicIntelligenceSource {
  return {
    name: row.sourceName,
    slug: row.sourceSlug,
    organization: row.sourceOrganization,
    url: row.sourceUrl,
  };
}

export async function getPublicIntelligenceDashboard(
  query: IntelligenceDashboardQuery = {},
): Promise<PublicIntelligenceDashboard> {
  const commodityRows = await db
    .select({
      id: commodities.id,
      name: commodities.name,
      slug: commodities.slug,
      symbol: commodities.symbol,
      description: commodities.description,
      displayOrder: commodities.displayOrder,
    })
    .from(commodities)
    .where(
      and(
        eq(commodities.isActive, true),
        eq(commodities.isIntelligenceTracked, true),
        inArray(commodities.slug, [...intelligenceCommoditySlugs]),
        query.commodity ? eq(commodities.slug, query.commodity) : undefined,
      ),
    )
    .orderBy(asc(commodities.displayOrder), asc(commodities.slug));

  if (commodityRows.length === 0) {
    return {
      commodities: [],
      meta: {
        commodityCount: 0,
        productionObservationCount: 0,
        priceObservationCount: 0,
        coverageRegionCount: 0,
        mappableLocationCount: 0,
      },
    };
  }

  const commodityIds = commodityRows.map((commodity) => commodity.id);

  const productionRows = await db
    .select({
      id: commodityProduction.id,
      commodityId: commodityProduction.commodityId,
      year: commodityProduction.year,
      value: commodityProduction.productionValue,
      recordType: commodityProduction.recordType,
      unitCode: measurementUnits.code,
      unitName: measurementUnits.name,
      unitSymbol: measurementUnits.symbol,
    })
    .from(commodityProduction)
    .innerJoin(
      commodityProductionSeries,
      eq(commodityProduction.seriesId, commodityProductionSeries.id),
    )
    .innerJoin(
      measurementUnits,
      eq(commodityProduction.unitCode, measurementUnits.code),
    )
    .where(
      and(
        inArray(commodityProduction.commodityId, commodityIds),
        publicProductionSeriesConditions(),
        eq(commodityProduction.verificationStatus, "verified"),
        eq(commodityProduction.publicationStatus, "published"),
        eq(measurementUnits.isActive, true),
      ),
    )
    .orderBy(
      asc(commodityProduction.commodityId),
      asc(commodityProduction.year),
      asc(commodityProduction.recordType),
    );

  const citationRows = productionRows.length
    ? await db
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
            inArray(
              commodityProductionSources.productionId,
              productionRows.map((row) => row.id),
            ),
            eq(sources.isActive, true),
            eq(sources.verificationStatus, "verified"),
          ),
        )
        .orderBy(
          asc(commodityProductionSources.productionId),
          desc(commodityProductionSources.isPrimary),
          asc(sources.name),
        )
    : [];

  const priceRows = await db
    .select({
      id: commodityDomesticPrices.id,
      commodityId: commodityDomesticPrices.commodityId,
      effectiveDate: commodityDomesticPrices.effectiveDate,
      period: commodityDomesticPrices.period,
      periodLabel: commodityDomesticPrices.periodLabel,
      value: commodityDomesticPrices.priceValue,
      currencyCode: commodityDomesticPrices.currencyCode,
      recordType: commodityDomesticPrices.recordType,
      standardCode: commodityPriceStandards.code,
      standardName: commodityPriceStandards.name,
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
      commodityPriceSeries,
      eq(commodityDomesticPrices.priceSeriesId, commodityPriceSeries.id),
    )
    .innerJoin(
      commodityPriceStandards,
      eq(commodityDomesticPrices.priceStandardId, commodityPriceStandards.id),
    )
    .innerJoin(
      measurementUnits,
      eq(commodityDomesticPrices.unitCode, measurementUnits.code),
    )
    .innerJoin(sources, eq(commodityDomesticPrices.sourceId, sources.id))
    .where(
      and(
        inArray(commodityDomesticPrices.commodityId, commodityIds),
        publicPriceSeriesConditions(),
        eq(commodityDomesticPrices.verificationStatus, "verified"),
        eq(commodityDomesticPrices.publicationStatus, "published"),
        eq(commodityPriceStandards.isActive, true),
        eq(measurementUnits.isActive, true),
        eq(sources.isActive, true),
        eq(sources.verificationStatus, "verified"),
      ),
    )
    .orderBy(
      asc(commodityDomesticPrices.commodityId),
      asc(commodityDomesticPrices.effectiveDate),
      asc(commodityDomesticPrices.recordType),
    );

  const coverageRows = await db
    .select({
      id: commodityRegionCoverage.id,
      commodityId: commodityRegionCoverage.commodityId,
      regionId: commodityRegionCoverage.regionId,
      coverageType: commodityRegionCoverage.coverageType,
      productionValue: commodityRegionCoverage.productionValue,
      productionYear: commodityRegionCoverage.productionYear,
      unitCode: commodityRegionCoverage.unitCode,
      rank: commodityRegionCoverage.rank,
      rankingStatus: commodityRegionCoverage.rankingStatus,
      relatedCompanyName: commodityRegionCoverage.relatedCompanyName,
      notes: commodityRegionCoverage.notes,
      verificationStatus: commodityRegionCoverage.verificationStatus,
      publicationStatus: commodityRegionCoverage.publicationStatus,
      regionCode: regions.code,
      regionName: regions.name,
      regionSlug: regions.slug,
      regionLevel: regions.level,
      sourceName: sources.name,
      sourceSlug: sources.slug,
      sourceOrganization: sources.organization,
      sourceUrl: sources.url,
    })
    .from(commodityRegionCoverage)
    .innerJoin(regions, eq(commodityRegionCoverage.regionId, regions.id))
    .innerJoin(sources, eq(commodityRegionCoverage.sourceId, sources.id))
    .where(
      and(
        inArray(commodityRegionCoverage.commodityId, commodityIds),
        eq(commodityRegionCoverage.verificationStatus, "verified"),
        eq(commodityRegionCoverage.publicationStatus, "published"),
        eq(regions.isActive, true),
        eq(sources.isActive, true),
        eq(sources.verificationStatus, "verified"),
      ),
    )
    .orderBy(
      asc(commodityRegionCoverage.commodityId),
      asc(regions.name),
    );

  const locationRows = await db
    .select({
      id: commodityProductionLocations.id,
      commodityId: commodityProductionLocations.commodityId,
      regionId: commodityProductionLocations.regionId,
      siteSlug: commodityProductionLocations.siteSlug,
      siteName: commodityProductionLocations.siteName,
      siteType: commodityProductionLocations.siteType,
      companyName: commodityProductionLocations.companyName,
      latitude: commodityProductionLocations.latitude,
      longitude: commodityProductionLocations.longitude,
      locationAccuracy: commodityProductionLocations.locationAccuracy,
      operationStatus: commodityProductionLocations.operationStatus,
      isPrimary: commodityProductionLocations.isPrimary,
      notes: commodityProductionLocations.notes,
      regionCode: regions.code,
      regionName: regions.name,
      regionSlug: regions.slug,
      regionLevel: regions.level,
      sourceName: sources.name,
      sourceSlug: sources.slug,
      sourceOrganization: sources.organization,
      sourceUrl: sources.url,
    })
    .from(commodityProductionLocations)
    .innerJoin(regions, eq(commodityProductionLocations.regionId, regions.id))
    .innerJoin(sources, eq(commodityProductionLocations.sourceId, sources.id))
    .where(
      and(
        inArray(commodityProductionLocations.commodityId, commodityIds),
        isNotNull(commodityProductionLocations.siteSlug),
        eq(commodityProductionLocations.verificationStatus, "verified"),
        eq(commodityProductionLocations.publicationStatus, "published"),
        eq(regions.isActive, true),
        eq(sources.isActive, true),
        eq(sources.verificationStatus, "verified"),
      ),
    )
    .orderBy(
      asc(commodityProductionLocations.commodityId),
      desc(commodityProductionLocations.isPrimary),
      asc(commodityProductionLocations.siteName),
    );

  const citations = new Map<string, typeof citationRows>();
  for (const citation of citationRows) {
    const current = citations.get(citation.productionId) ?? [];
    current.push(citation);
    citations.set(citation.productionId, current);
  }

  const result: PublicIntelligenceCommodity[] = commodityRows.map((commodity) => ({
    name: commodity.name,
    slug: commodity.slug as IntelligenceCommoditySlug,
    symbol: commodity.symbol,
    description: commodity.description,
    displayOrder: commodity.displayOrder,
    production: productionRows
      .filter((row) => row.commodityId === commodity.id)
      .map((row) => ({
        id: row.id,
        year: row.year,
        value: Number(row.value),
        recordType: row.recordType,
        unit: { code: row.unitCode, name: row.unitName, symbol: row.unitSymbol },
        sources: (citations.get(row.id) ?? []).map((citation) => ({
          label: citation.citationLabel,
          pageReference: citation.pageReference,
          url: citation.citationUrl ?? citation.sourceUrl,
          isPrimary: citation.isPrimary,
          source: {
            name: citation.sourceName,
            slug: citation.sourceSlug,
            organization: citation.sourceOrganization,
          },
        })),
      })),
    prices: priceRows
      .filter((row) => row.commodityId === commodity.id)
      .map((row) => ({
        id: row.id,
        effectiveDate: row.effectiveDate,
        period: row.period,
        periodLabel: row.periodLabel,
        value: Number(row.value),
        currencyCode: row.currencyCode,
        recordType: row.recordType,
        standard: { code: row.standardCode, name: row.standardName },
        unit: { code: row.unitCode, name: row.unitName, symbol: row.unitSymbol },
        source: publicSource(row),
      })),
    coverage: coverageRows
      .filter((row) => row.commodityId === commodity.id)
      .map((row) => ({
        id: row.id,
        commoditySlug: commodity.slug as IntelligenceCommoditySlug,
        region: {
          id: row.regionId,
          code: row.regionCode,
          name: row.regionName,
          slug: row.regionSlug,
          level: row.regionLevel,
        },
        coverageType: row.coverageType as PublicIntelligenceCommodity["coverage"][number]["coverageType"],
        productionValue: row.productionValue === null ? null : Number(row.productionValue),
        productionYear: row.productionYear,
        unitCode: row.unitCode,
        rank: row.rank,
        rankingStatus: row.rankingStatus as PublicIntelligenceCommodity["coverage"][number]["rankingStatus"],
        relatedCompanyName: row.relatedCompanyName,
        notes: row.notes,
        verificationStatus: "verified" as const,
        publicationStatus: "published" as const,
        source: publicSource(row),
      })),
    locations: locationRows
      .filter((row) => row.commodityId === commodity.id)
      .flatMap((row) => {
        if (!row.siteSlug || !row.siteName || !row.siteType || !row.locationAccuracy || !row.operationStatus) return [];
        return [{
          id: row.id,
          siteSlug: row.siteSlug,
          siteName: row.siteName,
          siteType: row.siteType,
          region: {
            id: row.regionId,
            code: row.regionCode,
            name: row.regionName,
            slug: row.regionSlug,
            level: row.regionLevel,
          },
          companyName: row.companyName,
          latitude: row.latitude === null ? null : Number(row.latitude),
          longitude: row.longitude === null ? null : Number(row.longitude),
          locationAccuracy: row.locationAccuracy as PublicIntelligenceCommodity["locations"][number]["locationAccuracy"],
          operationStatus: row.operationStatus,
          isPrimary: row.isPrimary,
          notes: row.notes,
          source: publicSource(row),
        }];
      }),
  }));
  result.sort(
    (left, right) =>
      intelligenceCommoditySlugs.indexOf(left.slug) -
      intelligenceCommoditySlugs.indexOf(right.slug),
  );

  return {
    commodities: result,
    meta: {
      commodityCount: result.length,
      productionObservationCount: productionRows.length,
      priceObservationCount: priceRows.length,
      coverageRegionCount: coverageRows.length,
      mappableLocationCount: result.reduce(
        (count, commodity) =>
          count +
          commodity.locations.filter(
            (location) =>
              location.latitude !== null &&
              location.longitude !== null &&
              location.locationAccuracy !== "unknown" &&
              location.locationAccuracy !== "regency_centroid",
          ).length,
        0,
      ),
    },
  };
}
