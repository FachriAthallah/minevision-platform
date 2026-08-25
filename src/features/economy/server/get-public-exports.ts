import "server-only";

import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";

import { db } from "@/db";
import {
  commodities,
  minerbaExportsAnnual,
  minerbaExportsAnnualMetrics,
  minerbaExportSources,
  sources,
} from "@/db/schema";
import { isPubliclyVisible } from "@/features/shared/policies/publication-visibility";

import type { ExportQuery } from "../schemas/export-query";
import type {
  PublicExportRecord,
  PublicExportSource,
} from "../types/export";

function toNullableNumber(value: string | number | null): number | null {
  return value === null ? null : Number(value);
}

export async function getPublicExports(
  query: ExportQuery,
): Promise<PublicExportRecord[]> {
  const exportRows = await db
    .select({
      id: minerbaExportsAnnual.id,
      commodityName: commodities.name,
      commoditySlug: commodities.slug,
      commoditySymbol: commodities.symbol,
      originRegionCode: minerbaExportsAnnualMetrics.originRegionCode,
      originRegionName: minerbaExportsAnnualMetrics.originRegionName,
      destinationRegionCode:
        minerbaExportsAnnualMetrics.destinationRegionCode,
      destinationRegionName:
        minerbaExportsAnnualMetrics.destinationRegionName,
      year: minerbaExportsAnnual.year,
      sourceCommodityLabel: minerbaExportsAnnual.sourceCommodityLabel,
      hsCode: minerbaExportsAnnual.hsCode,
      coverageType: minerbaExportsAnnual.coverageType,
      exportVolume: minerbaExportsAnnual.exportVolume,
      volumeUnitCode: minerbaExportsAnnual.volumeUnitCode,
      volumeScale: minerbaExportsAnnual.volumeScale,
      normalizedVolumeMetricTon:
        minerbaExportsAnnualMetrics.normalizedVolumeMetricTon,
      fobValue: minerbaExportsAnnual.fobValue,
      currencyCode: minerbaExportsAnnual.currencyCode,
      fobValueScale: minerbaExportsAnnual.fobValueScale,
      normalizedFobValueUsd:
        minerbaExportsAnnualMetrics.normalizedFobValueUsd,
      averageFobUsdPerMetricTon:
        minerbaExportsAnnualMetrics.averageFobUsdPerMetricTon,
      nominalFobYoyChangePercentage:
        minerbaExportsAnnualMetrics.nominalFobYoyChangePercentage,
      dataAvailability: minerbaExportsAnnual.dataAvailability,
      dataStatus: minerbaExportsAnnual.dataStatus,
      recordType: minerbaExportsAnnual.recordType,
      sourcePublishedAt: minerbaExportsAnnual.sourcePublishedAt,
      verificationStatus: minerbaExportsAnnual.verificationStatus,
      publicationStatus: minerbaExportsAnnual.publicationStatus,
    })
    .from(minerbaExportsAnnual)
    .innerJoin(
      commodities,
      eq(minerbaExportsAnnual.commodityId, commodities.id),
    )
    .innerJoin(
      minerbaExportsAnnualMetrics,
      eq(minerbaExportsAnnual.id, minerbaExportsAnnualMetrics.id),
    )
    .where(
      and(
        eq(minerbaExportsAnnual.verificationStatus, "verified"),
        eq(minerbaExportsAnnual.publicationStatus, "published"),
        eq(commodities.isActive, true),
        query.commodity !== undefined
          ? eq(commodities.slug, query.commodity)
          : undefined,
        query.origin !== undefined
          ? eq(minerbaExportsAnnualMetrics.originRegionCode, query.origin)
          : undefined,
        query.destination !== undefined
          ? eq(
              minerbaExportsAnnualMetrics.destinationRegionCode,
              query.destination,
            )
          : undefined,
        query.availability !== undefined
          ? eq(minerbaExportsAnnual.dataAvailability, query.availability)
          : undefined,
        query.coverage !== undefined
          ? eq(minerbaExportsAnnual.coverageType, query.coverage)
          : undefined,
        query.fromYear !== undefined
          ? gte(minerbaExportsAnnual.year, query.fromYear)
          : undefined,
        query.toYear !== undefined
          ? lte(minerbaExportsAnnual.year, query.toYear)
          : undefined,
      ),
    )
    .orderBy(
      asc(minerbaExportsAnnual.year),
      asc(commodities.name),
      asc(minerbaExportsAnnualMetrics.destinationRegionName),
    );

  const publiclyVisibleRows = exportRows.filter(isPubliclyVisible);

  if (publiclyVisibleRows.length === 0) {
    return [];
  }

  const completeRows = publiclyVisibleRows.filter(
    (
      record,
    ): record is (typeof publiclyVisibleRows)[number] & {
      originRegionCode: string;
      originRegionName: string;
    } =>
      record.originRegionCode !== null && record.originRegionName !== null,
  );

  if (completeRows.length !== publiclyVisibleRows.length) {
    throw new Error(
      "Data ekspor publik memiliki record tanpa wilayah asal yang lengkap.",
    );
  }

  const exportIds = completeRows.map((record) => record.id);

  const citationRows = await db
    .select({
      exportId: minerbaExportSources.minerbaExportId,
      citationLabel: minerbaExportSources.citationLabel,
      pageReference: minerbaExportSources.pageReference,
      citationUrl: minerbaExportSources.sourceUrl,
      isPrimary: minerbaExportSources.isPrimary,
      sourceName: sources.name,
      sourceSlug: sources.slug,
      sourceOrganization: sources.organization,
      canonicalSourceUrl: sources.url,
    })
    .from(minerbaExportSources)
    .innerJoin(sources, eq(minerbaExportSources.sourceId, sources.id))
    .where(
      and(
        inArray(minerbaExportSources.minerbaExportId, exportIds),
        eq(sources.isActive, true),
        eq(sources.verificationStatus, "verified"),
      ),
    )
    .orderBy(
      asc(minerbaExportSources.minerbaExportId),
      desc(minerbaExportSources.isPrimary),
      asc(sources.name),
    );

  const citationsByExportId = new Map<string, PublicExportSource[]>();

  for (const citation of citationRows) {
    const currentCitations =
      citationsByExportId.get(citation.exportId) ?? [];

    currentCitations.push({
      label: citation.citationLabel,
      pageReference: citation.pageReference,
      url: citation.citationUrl ?? citation.canonicalSourceUrl ?? null,
      isPrimary: citation.isPrimary,
      source: {
        name: citation.sourceName,
        slug: citation.sourceSlug,
        organization: citation.sourceOrganization,
      },
    });

    citationsByExportId.set(citation.exportId, currentCitations);
  }

  return completeRows.map((record) => ({
    id: record.id,
    commodity: {
      name: record.commodityName,
      slug: record.commoditySlug,
      symbol: record.commoditySymbol,
      sourceLabel: record.sourceCommodityLabel,
      hsCode: record.hsCode,
    },
    origin: {
      code: record.originRegionCode,
      name: record.originRegionName,
    },
    destination:
      record.destinationRegionCode === null &&
      record.destinationRegionName === null
        ? null
        : {
            code: record.destinationRegionCode,
            name: record.destinationRegionName,
          },
    year: record.year,
    coverageType: record.coverageType,
    availability: record.dataAvailability,
    volume:
      record.exportVolume === null
        ? null
        : {
            value: Number(record.exportVolume),
            unitCode: record.volumeUnitCode,
            scale: record.volumeScale,
            normalizedMetricTon: toNullableNumber(
              record.normalizedVolumeMetricTon,
            ),
          },
    fob:
      record.fobValue === null
        ? null
        : {
            value: Number(record.fobValue),
            currencyCode: record.currencyCode,
            scale: record.fobValueScale,
            normalizedUsd: toNullableNumber(record.normalizedFobValueUsd),
            averageUsdPerMetricTon: toNullableNumber(
              record.averageFobUsdPerMetricTon,
            ),
            nominalYoyChangePercentage: toNullableNumber(
              record.nominalFobYoyChangePercentage,
            ),
          },
    dataStatus: record.dataStatus,
    recordType: record.recordType,
    sourcePublishedAt:
      record.sourcePublishedAt === null
        ? null
        : record.sourcePublishedAt.toISOString().slice(0, 10),
    sources: citationsByExportId.get(record.id) ?? [],
  }));
}
