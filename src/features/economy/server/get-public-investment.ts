import "server-only";

import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";

import { db } from "@/db";
import {
  miningInvestmentAnnual,
  miningInvestmentAnnualMetrics,
  miningInvestmentSources,
  regions,
  sources,
} from "@/db/schema";
import { isPubliclyVisible } from "@/features/shared/policies/publication-visibility";

import type { InvestmentQuery } from "../schemas/investment-query";
import type {
  PublicInvestmentRecord,
  PublicInvestmentSource,
} from "../types/investment";

function toNullableNumber(value: string | number | null): number | null {
  return value === null ? null : Number(value);
}

export async function getPublicInvestment(
  query: InvestmentQuery,
): Promise<PublicInvestmentRecord[]> {
  const investmentRows = await db
    .select({
      id: miningInvestmentAnnual.id,
      regionCode: regions.code,
      regionName: regions.name,
      year: miningInvestmentAnnual.year,
      sectorCode: miningInvestmentAnnual.sectorCode,
      sectorName: miningInvestmentAnnual.sectorName,
      investmentOrigin: miningInvestmentAnnual.investmentOrigin,
      investmentValue: miningInvestmentAnnual.investmentValue,
      currencyCode: miningInvestmentAnnual.currencyCode,
      valueScale: miningInvestmentAnnual.valueScale,
      projectCount: miningInvestmentAnnual.projectCount,
      annualTotalInvestmentValue:
        miningInvestmentAnnualMetrics.annualTotalInvestmentValue,
      annualTotalProjectCount:
        miningInvestmentAnnualMetrics.annualTotalProjectCount,
      annualValueSharePercentage:
        miningInvestmentAnnualMetrics.annualValueSharePercentage,
      nominalYoyChangePercentage:
        miningInvestmentAnnualMetrics.nominalYoyChangePercentage,
      dataStatus: miningInvestmentAnnual.dataStatus,
      recordType: miningInvestmentAnnual.recordType,
      sourcePublishedAt: miningInvestmentAnnual.sourcePublishedAt,
      verificationStatus: miningInvestmentAnnual.verificationStatus,
      publicationStatus: miningInvestmentAnnual.publicationStatus,
    })
    .from(miningInvestmentAnnual)
    .innerJoin(regions, eq(miningInvestmentAnnual.regionId, regions.id))
    .innerJoin(
      miningInvestmentAnnualMetrics,
      eq(miningInvestmentAnnual.id, miningInvestmentAnnualMetrics.id),
    )
    .where(
      and(
        eq(miningInvestmentAnnual.verificationStatus, "verified"),
        eq(miningInvestmentAnnual.publicationStatus, "published"),
        query.region !== undefined ? eq(regions.code, query.region) : undefined,
        query.origin !== undefined
          ? eq(miningInvestmentAnnual.investmentOrigin, query.origin)
          : undefined,
        query.fromYear !== undefined
          ? gte(miningInvestmentAnnual.year, query.fromYear)
          : undefined,
        query.toYear !== undefined
          ? lte(miningInvestmentAnnual.year, query.toYear)
          : undefined,
      ),
    )
    .orderBy(
      asc(miningInvestmentAnnual.year),
      asc(miningInvestmentAnnual.investmentOrigin),
    );

  const publiclyVisibleRows = investmentRows.filter(isPubliclyVisible);

  if (publiclyVisibleRows.length === 0) {
    return [];
  }

  const investmentIds = publiclyVisibleRows.map((record) => record.id);

  const citationRows = await db
    .select({
      investmentId: miningInvestmentSources.miningInvestmentId,
      citationLabel: miningInvestmentSources.citationLabel,
      pageReference: miningInvestmentSources.pageReference,
      citationUrl: miningInvestmentSources.sourceUrl,
      isPrimary: miningInvestmentSources.isPrimary,
      sourceName: sources.name,
      sourceSlug: sources.slug,
      sourceOrganization: sources.organization,
      canonicalSourceUrl: sources.url,
    })
    .from(miningInvestmentSources)
    .innerJoin(sources, eq(miningInvestmentSources.sourceId, sources.id))
    .where(
      and(
        inArray(miningInvestmentSources.miningInvestmentId, investmentIds),
        eq(sources.isActive, true),
        eq(sources.verificationStatus, "verified"),
      ),
    )
    .orderBy(
      asc(miningInvestmentSources.miningInvestmentId),
      desc(miningInvestmentSources.isPrimary),
      asc(sources.name),
    );

  const citationsByInvestmentId = new Map<string, PublicInvestmentSource[]>();

  for (const citation of citationRows) {
    const currentCitations =
      citationsByInvestmentId.get(citation.investmentId) ?? [];

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

    citationsByInvestmentId.set(citation.investmentId, currentCitations);
  }

  const rowsWithRegionCode = publiclyVisibleRows.filter(
    (
      record,
    ): record is (typeof publiclyVisibleRows)[number] & {
      regionCode: string;
    } => record.regionCode !== null,
  );

  if (rowsWithRegionCode.length !== publiclyVisibleRows.length) {
    throw new Error(
      "Data investasi publik memiliki record tanpa kode wilayah.",
    );
  }

  return rowsWithRegionCode.map((record) => ({
    id: record.id,
    region: {
      code: record.regionCode,
      name: record.regionName,
    },
    year: record.year,
    sector: {
      code: record.sectorCode,
      name: record.sectorName,
    },
    origin: record.investmentOrigin,
    investmentValue: Number(record.investmentValue),
    currency: {
      code: record.currencyCode,
      scale: record.valueScale,
    },
    projectCount: record.projectCount,
    annualMetrics: {
      totalInvestmentValue: toNullableNumber(record.annualTotalInvestmentValue),
      totalProjectCount: record.annualTotalProjectCount,
      valueSharePercentage: toNullableNumber(record.annualValueSharePercentage),
      nominalYoyChangePercentage: toNullableNumber(
        record.nominalYoyChangePercentage,
      ),
    },
    dataStatus: record.dataStatus,
    recordType: record.recordType,
    sourcePublishedAt:
      record.sourcePublishedAt === null
        ? null
        : record.sourcePublishedAt.toISOString().slice(0, 10),
    sources: citationsByInvestmentId.get(record.id) ?? [],
  }));
}
