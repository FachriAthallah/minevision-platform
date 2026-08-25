import "server-only";

import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";

import { db } from "@/db";
import {
  economicGdpAnnualMetrics,
  economicGdpSources,
  sources,
} from "@/db/schema";
import { isPubliclyVisible } from "@/features/shared/policies/publication-visibility";

import type { GdpQuery } from "../schemas/gdp-query";
import type { PublicGdpRecord, PublicGdpSource } from "../types/gdp";

export async function getPublicGdp(
  query: GdpQuery,
): Promise<PublicGdpRecord[]> {
  const metricRows = await db
    .select({
      id: economicGdpAnnualMetrics.id,

      regionCode: economicGdpAnnualMetrics.regionCode,
      regionName: economicGdpAnnualMetrics.regionName,

      year: economicGdpAnnualMetrics.year,

      priceBasis: economicGdpAnnualMetrics.priceBasis,
      baseYear: economicGdpAnnualMetrics.baseYear,

      nationalGdpValue: economicGdpAnnualMetrics.nationalGdpValue,

      miningQuarryingGdpValue: economicGdpAnnualMetrics.miningQuarryingGdpValue,

      contributionPercentage: economicGdpAnnualMetrics.contributionPercentage,

      nominalYoyChangePercentage:
        economicGdpAnnualMetrics.nominalYoyChangePercentage,

      currencyCode: economicGdpAnnualMetrics.currencyCode,
      valueScale: economicGdpAnnualMetrics.valueScale,

      dataStatus: economicGdpAnnualMetrics.dataStatus,
      recordType: economicGdpAnnualMetrics.recordType,

      sourcePublishedAt: economicGdpAnnualMetrics.sourcePublishedAt,

      verificationStatus: economicGdpAnnualMetrics.verificationStatus,

      publicationStatus: economicGdpAnnualMetrics.publicationStatus,
    })
    .from(economicGdpAnnualMetrics)
    .where(
      and(
        eq(economicGdpAnnualMetrics.verificationStatus, "verified"),

        eq(economicGdpAnnualMetrics.publicationStatus, "published"),

        query.region !== undefined
          ? eq(economicGdpAnnualMetrics.regionCode, query.region)
          : undefined,

        query.priceBasis !== undefined
          ? eq(economicGdpAnnualMetrics.priceBasis, query.priceBasis)
          : undefined,

        query.fromYear !== undefined
          ? gte(economicGdpAnnualMetrics.year, query.fromYear)
          : undefined,

        query.toYear !== undefined
          ? lte(economicGdpAnnualMetrics.year, query.toYear)
          : undefined,
      ),
    )
    .orderBy(
      asc(economicGdpAnnualMetrics.regionName),
      asc(economicGdpAnnualMetrics.year),
      asc(economicGdpAnnualMetrics.priceBasis),
    );

  const publiclyVisibleRows = metricRows.filter((row) => {
    if (row.verificationStatus === null || row.publicationStatus === null) {
      return false;
    }

    return isPubliclyVisible({
      verificationStatus: row.verificationStatus,
      publicationStatus: row.publicationStatus,
    });
  });

  const gdpIds = publiclyVisibleRows.flatMap((row) =>
    row.id === null ? [] : [row.id],
  );

  if (gdpIds.length === 0) {
    return [];
  }

  const citationRows = await db
    .select({
      economicGdpId: economicGdpSources.economicGdpId,

      citationLabel: economicGdpSources.citationLabel,
      pageReference: economicGdpSources.pageReference,
      citationUrl: economicGdpSources.sourceUrl,
      isPrimary: economicGdpSources.isPrimary,

      sourceName: sources.name,
      sourceSlug: sources.slug,
      sourceOrganization: sources.organization,
      sourceUrl: sources.url,
    })
    .from(economicGdpSources)
    .innerJoin(sources, eq(economicGdpSources.sourceId, sources.id))
    .where(
      and(
        inArray(economicGdpSources.economicGdpId, gdpIds),
        eq(sources.isActive, true),
        eq(sources.verificationStatus, "verified"),
      ),
    )
    .orderBy(
      asc(economicGdpSources.economicGdpId),
      desc(economicGdpSources.isPrimary),
      asc(sources.name),
    );

  const citationsByGdpId = new Map<string, PublicGdpSource[]>();

  for (const citation of citationRows) {
    const currentCitations = citationsByGdpId.get(citation.economicGdpId) ?? [];

    currentCitations.push({
      label: citation.citationLabel ?? citation.sourceName,

      pageReference: citation.pageReference,

      url: citation.citationUrl ?? citation.sourceUrl ?? null,

      isPrimary: citation.isPrimary,

      source: {
        name: citation.sourceName,
        slug: citation.sourceSlug,
        organization: citation.sourceOrganization,
      },
    });

    citationsByGdpId.set(citation.economicGdpId, currentCitations);
  }

  return publiclyVisibleRows.flatMap((row) => {
    if (
      row.id === null ||
      row.regionCode === null ||
      row.regionName === null ||
      row.year === null ||
      row.priceBasis === null ||
      row.nationalGdpValue === null ||
      row.miningQuarryingGdpValue === null ||
      row.currencyCode === null ||
      row.valueScale === null ||
      row.dataStatus === null ||
      row.recordType === null
    ) {
      return [];
    }

    const nationalGdpValue = Number(row.nationalGdpValue);

    const miningQuarryingGdpValue = Number(row.miningQuarryingGdpValue);

    const contributionPercentage =
      row.contributionPercentage === null
        ? null
        : Number(row.contributionPercentage);

    const nominalYoyChangePercentage =
      row.nominalYoyChangePercentage === null
        ? null
        : Number(row.nominalYoyChangePercentage);

    const requiredNumbers = [nationalGdpValue, miningQuarryingGdpValue];

    if (
      requiredNumbers.some((value) => !Number.isFinite(value)) ||
      (contributionPercentage !== null &&
        !Number.isFinite(contributionPercentage)) ||
      (nominalYoyChangePercentage !== null &&
        !Number.isFinite(nominalYoyChangePercentage))
    ) {
      return [];
    }

    return [
      {
        id: row.id,

        region: {
          code: row.regionCode,
          name: row.regionName,
        },

        year: row.year,

        priceBasis: row.priceBasis,
        baseYear: row.baseYear,

        nationalGdpValue,
        miningQuarryingGdpValue,

        contributionPercentage,
        nominalYoyChangePercentage,

        currencyCode: row.currencyCode,
        valueScale: row.valueScale,

        dataStatus: row.dataStatus,
        recordType: row.recordType,

        sourcePublishedAt: row.sourcePublishedAt,

        sources: citationsByGdpId.get(row.id) ?? [],
      },
    ];
  });
}
