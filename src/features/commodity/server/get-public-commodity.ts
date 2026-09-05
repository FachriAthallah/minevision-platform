import "server-only";

import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNull,
  or,
} from "drizzle-orm";

import { db } from "@/db";
import {
  commodities,
  commodityContents,
  commodityGlobalStatisticEntries,
  commodityGlobalStatisticSets,
  commodityGlobalStatisticSetSources,
  commodityProducers,
  commodityProductionLocations,
  commodityResourceStatistics,
  commodityResourceStatisticSources,
  contents,
  contentSources,
  measurementUnits,
  regions,
  sources,
} from "@/db/schema";

import type {
  PublicCommodityDetail,
  PublicCommoditySourceReference,
} from "../types/commodity";

type SourceReferenceInput = {
  sourceName: string;
  sourceSlug: string;
  sourceType: PublicCommoditySourceReference["type"];
  sourceOrganization: string;
  sourceMasterUrl: string | null;
  sourceIsOfficial: boolean;
  citationLabel?: string | null;
  sourceUrl?: string | null;
  pageReference?: string | null;
  sourceRole?: string | null;
};

function createSourceReference(
  input: SourceReferenceInput,
): PublicCommoditySourceReference {
  return {
    name: input.sourceName,
    slug: input.sourceSlug,
    type: input.sourceType,
    organization: input.sourceOrganization,
    url: input.sourceMasterUrl,
    isOfficial: input.sourceIsOfficial,
    citationLabel: input.citationLabel ?? null,
    sourceUrl: input.sourceUrl ?? null,
    pageReference: input.pageReference ?? null,
    sourceRole: input.sourceRole ?? null,
  };
}

export async function getPublicCommodityBySlug(
  slug: string,
): Promise<PublicCommodityDetail | null> {
  const [commodityRow] = await db
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

      profileId: contents.id,
      profileTitle: contents.title,
      profileSlug: contents.slug,
      profileExcerpt: contents.excerpt,
      profileBody: contents.body,
      profileCoverImageUrl: contents.coverImageUrl,
      profileReadingTimeMinutes: contents.readingTimeMinutes,
      profileIsFeatured: contents.isFeatured,
      profilePublishedAt: contents.publishedAt,
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
        eq(commodities.slug, slug),
        eq(commodities.isActive, true),
      ),
    )
    .limit(1);

  if (!commodityRow) {
    return null;
  }

  const [
    profileSourceRows,
    resourceRows,
    productionLocationRows,
    globalSetRows,
    producerRows,
  ] = await Promise.all([
    db
      .select({
        sourceName: sources.name,
        sourceSlug: sources.slug,
        sourceType: sources.type,
        sourceOrganization: sources.organization,
        sourceMasterUrl: sources.url,
        sourceIsOfficial: sources.isOfficial,
        citationLabel: contentSources.citationLabel,
        pageReference: contentSources.pageReference,
        displayOrder: contentSources.displayOrder,
      })
      .from(contentSources)
      .innerJoin(sources, eq(sources.id, contentSources.sourceId))
      .where(
        and(
          eq(contentSources.contentId, commodityRow.profileId),
          eq(sources.isActive, true),
          eq(sources.verificationStatus, "verified"),
        ),
      )
      .orderBy(
        asc(contentSources.displayOrder),
        asc(sources.name),
      ),

    db
      .select({
        id: commodityResourceStatistics.id,
        statisticYear:
          commodityResourceStatistics.statisticYear,
        statisticType:
          commodityResourceStatistics.statisticType,
        materialBasis:
          commodityResourceStatistics.materialBasis,
        availabilityStatus:
          commodityResourceStatistics.availabilityStatus,
        value: commodityResourceStatistics.value,
        recordType: commodityResourceStatistics.recordType,
        notes: commodityResourceStatistics.notes,
        sourceUrl: commodityResourceStatistics.sourceUrl,
        pageReference:
          commodityResourceStatistics.pageReference,

        unitCode: measurementUnits.code,
        unitName: measurementUnits.name,
        unitSymbol: measurementUnits.symbol,

        sourceName: sources.name,
        sourceSlug: sources.slug,
        sourceType: sources.type,
        sourceOrganization: sources.organization,
        sourceMasterUrl: sources.url,
        sourceIsOfficial: sources.isOfficial,
      })
      .from(commodityResourceStatistics)
      .innerJoin(
        sources,
        eq(sources.id, commodityResourceStatistics.sourceId),
      )
      .leftJoin(
        measurementUnits,
        eq(
          measurementUnits.code,
          commodityResourceStatistics.unitCode,
        ),
      )
      .where(
        and(
          eq(
            commodityResourceStatistics.commodityId,
            commodityRow.id,
          ),
          eq(
            commodityResourceStatistics.verificationStatus,
            "verified",
          ),
          eq(
            commodityResourceStatistics.publicationStatus,
            "published",
          ),
          eq(sources.isActive, true),
          eq(sources.verificationStatus, "verified"),
        ),
      )
      .orderBy(
        desc(commodityResourceStatistics.statisticYear),
        asc(commodityResourceStatistics.statisticType),
        asc(commodityResourceStatistics.materialBasis),
      ),

    db
      .select({
        id: commodityProductionLocations.id,
        year: commodityProductionLocations.year,
        productionValue:
          commodityProductionLocations.productionValue,
        sharePercentage:
          commodityProductionLocations.sharePercentage,
        producerRank:
          commodityProductionLocations.producerRank,
        recordType: commodityProductionLocations.recordType,
        locationDetail:
          commodityProductionLocations.locationDetail,
        notes: commodityProductionLocations.notes,

        unitCode: measurementUnits.code,
        unitName: measurementUnits.name,
        unitSymbol: measurementUnits.symbol,

        regionName: regions.name,
        regionSlug: regions.slug,
        regionCode: regions.code,
        regionLatitude: regions.latitude,
        regionLongitude: regions.longitude,

        sourceName: sources.name,
        sourceSlug: sources.slug,
        sourceType: sources.type,
        sourceOrganization: sources.organization,
        sourceMasterUrl: sources.url,
        sourceIsOfficial: sources.isOfficial,
      })
      .from(commodityProductionLocations)
      .innerJoin(
        regions,
        eq(regions.id, commodityProductionLocations.regionId),
      )
      .innerJoin(
        sources,
        eq(sources.id, commodityProductionLocations.sourceId),
      )
      .leftJoin(
        measurementUnits,
        eq(
          measurementUnits.code,
          commodityProductionLocations.unitCode,
        ),
      )
      .where(
        and(
          eq(
            commodityProductionLocations.commodityId,
            commodityRow.id,
          ),
          eq(
            commodityProductionLocations.verificationStatus,
            "verified",
          ),
          eq(
            commodityProductionLocations.publicationStatus,
            "published",
          ),
          eq(regions.isActive, true),
          eq(sources.isActive, true),
          eq(sources.verificationStatus, "verified"),
        ),
      )
      .orderBy(
        asc(commodityProductionLocations.producerRank),
        asc(regions.name),
      ),

    db
      .select({
        id: commodityGlobalStatisticSets.id,
        statisticYear:
          commodityGlobalStatisticSets.statisticYear,
        metricCode: commodityGlobalStatisticSets.metricCode,
        basisCode: commodityGlobalStatisticSets.basisCode,
        availabilityStatus:
          commodityGlobalStatisticSets.availabilityStatus,
        recordType: commodityGlobalStatisticSets.recordType,
        sourceId: commodityGlobalStatisticSets.sourceId,
        sourceUrl: commodityGlobalStatisticSets.sourceUrl,
        pageReference:
          commodityGlobalStatisticSets.pageReference,
        notes: commodityGlobalStatisticSets.notes,

        unitCode: measurementUnits.code,
        unitName: measurementUnits.name,
        unitSymbol: measurementUnits.symbol,

        sourceName: sources.name,
        sourceSlug: sources.slug,
        sourceType: sources.type,
        sourceOrganization: sources.organization,
        sourceMasterUrl: sources.url,
        sourceIsOfficial: sources.isOfficial,
      })
      .from(commodityGlobalStatisticSets)
      .leftJoin(
        measurementUnits,
        eq(
          measurementUnits.code,
          commodityGlobalStatisticSets.unitCode,
        ),
      )
      .leftJoin(
        sources,
        eq(sources.id, commodityGlobalStatisticSets.sourceId),
      )
      .where(
        and(
          eq(
            commodityGlobalStatisticSets.commodityId,
            commodityRow.id,
          ),
          eq(
            commodityGlobalStatisticSets.verificationStatus,
            "verified",
          ),
          eq(
            commodityGlobalStatisticSets.publicationStatus,
            "published",
          ),
          or(
            isNull(commodityGlobalStatisticSets.sourceId),
            and(
              eq(sources.isActive, true),
              eq(sources.verificationStatus, "verified"),
            ),
          ),
        ),
      )
      .orderBy(
        desc(commodityGlobalStatisticSets.statisticYear),
        asc(commodityGlobalStatisticSets.metricCode),
      ),

    db
      .select({
        id: commodityProducers.id,
        producerKey: commodityProducers.producerKey,
        companyName: commodityProducers.companyName,
        operationArea: commodityProducers.operationArea,
        producerRole: commodityProducers.producerRole,
        displayOrder: commodityProducers.displayOrder,
        notes: commodityProducers.notes,
        industryCompanyId:
          commodityProducers.industryCompanyId,
        sourceUrl: commodityProducers.sourceUrl,
        pageReference: commodityProducers.pageReference,

        regionName: regions.name,
        regionSlug: regions.slug,

        sourceName: sources.name,
        sourceSlug: sources.slug,
        sourceType: sources.type,
        sourceOrganization: sources.organization,
        sourceMasterUrl: sources.url,
        sourceIsOfficial: sources.isOfficial,
      })
      .from(commodityProducers)
      .innerJoin(
        sources,
        eq(sources.id, commodityProducers.sourceId),
      )
      .leftJoin(
        regions,
        eq(regions.id, commodityProducers.primaryRegionId),
      )
      .where(
        and(
          eq(commodityProducers.commodityId, commodityRow.id),
          eq(commodityProducers.isActive, true),
          eq(
            commodityProducers.verificationStatus,
            "verified",
          ),
          eq(
            commodityProducers.publicationStatus,
            "published",
          ),
          eq(sources.isActive, true),
          eq(sources.verificationStatus, "verified"),
        ),
      )
      .orderBy(
        asc(commodityProducers.displayOrder),
        asc(commodityProducers.companyName),
      ),
  ]);

  const resourceIds = resourceRows.map((row) => row.id);
  const globalSetIds = globalSetRows.map((row) => row.id);

  const [
    resourceSupportingRows,
    globalEntryRows,
    globalSupportingRows,
  ] = await Promise.all([
    resourceIds.length === 0
      ? Promise.resolve([])
      : db
          .select({
            resourceStatisticId:
              commodityResourceStatisticSources.resourceStatisticId,
            sourceRole:
              commodityResourceStatisticSources.sourceRole,
            citationLabel:
              commodityResourceStatisticSources.citationLabel,
            sourceUrl:
              commodityResourceStatisticSources.sourceUrl,
            pageReference:
              commodityResourceStatisticSources.pageReference,

            sourceName: sources.name,
            sourceSlug: sources.slug,
            sourceType: sources.type,
            sourceOrganization: sources.organization,
            sourceMasterUrl: sources.url,
            sourceIsOfficial: sources.isOfficial,
          })
          .from(commodityResourceStatisticSources)
          .innerJoin(
            sources,
            eq(
              sources.id,
              commodityResourceStatisticSources.sourceId,
            ),
          )
          .where(
            and(
              inArray(
                commodityResourceStatisticSources.resourceStatisticId,
                resourceIds,
              ),
              eq(sources.isActive, true),
              eq(sources.verificationStatus, "verified"),
            ),
          )
          .orderBy(
            asc(
              commodityResourceStatisticSources.resourceStatisticId,
            ),
            asc(
              commodityResourceStatisticSources.sourceRole,
            ),
          ),

    globalSetIds.length === 0
      ? Promise.resolve([])
      : db
          .select({
            id: commodityGlobalStatisticEntries.id,
            statisticSetId:
              commodityGlobalStatisticEntries.statisticSetId,
            rank: commodityGlobalStatisticEntries.rank,
            value: commodityGlobalStatisticEntries.value,
            notes: commodityGlobalStatisticEntries.notes,
            countryName: regions.name,
            countrySlug: regions.slug,
            countryCode: regions.code,
          })
          .from(commodityGlobalStatisticEntries)
          .innerJoin(
            regions,
            eq(
              regions.id,
              commodityGlobalStatisticEntries.countryRegionId,
            ),
          )
          .where(
            and(
              inArray(
                commodityGlobalStatisticEntries.statisticSetId,
                globalSetIds,
              ),
              eq(regions.isActive, true),
              eq(regions.level, "country"),
            ),
          )
          .orderBy(
            asc(
              commodityGlobalStatisticEntries.statisticSetId,
            ),
            asc(commodityGlobalStatisticEntries.rank),
          ),

    globalSetIds.length === 0
      ? Promise.resolve([])
      : db
          .select({
            statisticSetId:
              commodityGlobalStatisticSetSources.statisticSetId,
            sourceRole:
              commodityGlobalStatisticSetSources.sourceRole,
            citationLabel:
              commodityGlobalStatisticSetSources.citationLabel,
            sourceUrl:
              commodityGlobalStatisticSetSources.sourceUrl,
            pageReference:
              commodityGlobalStatisticSetSources.pageReference,

            sourceName: sources.name,
            sourceSlug: sources.slug,
            sourceType: sources.type,
            sourceOrganization: sources.organization,
            sourceMasterUrl: sources.url,
            sourceIsOfficial: sources.isOfficial,
          })
          .from(commodityGlobalStatisticSetSources)
          .innerJoin(
            sources,
            eq(
              sources.id,
              commodityGlobalStatisticSetSources.sourceId,
            ),
          )
          .where(
            and(
              inArray(
                commodityGlobalStatisticSetSources.statisticSetId,
                globalSetIds,
              ),
              eq(sources.isActive, true),
              eq(sources.verificationStatus, "verified"),
            ),
          )
          .orderBy(
            asc(
              commodityGlobalStatisticSetSources.statisticSetId,
            ),
            asc(
              commodityGlobalStatisticSetSources.sourceRole,
            ),
          ),
  ]);

  const resourceSourcesById = new Map<
    string,
    PublicCommoditySourceReference[]
  >();

  for (const row of resourceSupportingRows) {
    const references =
      resourceSourcesById.get(row.resourceStatisticId) ?? [];

    references.push(
      createSourceReference({
        ...row,
        sourceRole: row.sourceRole,
      }),
    );

    resourceSourcesById.set(
      row.resourceStatisticId,
      references,
    );
  }

  const globalSourcesById = new Map<
    string,
    PublicCommoditySourceReference[]
  >();

  for (const row of globalSupportingRows) {
    const references =
      globalSourcesById.get(row.statisticSetId) ?? [];

    references.push(
      createSourceReference({
        ...row,
        sourceRole: row.sourceRole,
      }),
    );

    globalSourcesById.set(row.statisticSetId, references);
  }

  const globalEntriesById = new Map<
    string,
    typeof globalEntryRows
  >();

  for (const row of globalEntryRows) {
    const entries =
      globalEntriesById.get(row.statisticSetId) ?? [];

    entries.push(row);
    globalEntriesById.set(row.statisticSetId, entries);
  }

  const resourceStatistics = resourceRows.map((row) => ({
    id: row.id,
    statisticYear: row.statisticYear,
    statisticType: row.statisticType,
    materialBasis: row.materialBasis,
    availabilityStatus: row.availabilityStatus,
    value: row.value,
    recordType: row.recordType,
    notes: row.notes,
    unit:
      row.unitCode === null
        ? null
        : {
            code: row.unitCode,
            name: row.unitName!,
            symbol: row.unitSymbol!,
          },
    primarySource: createSourceReference({
      ...row,
      sourceRole: "primary",
    }),
    supportingSources:
      resourceSourcesById.get(row.id) ?? [],
  }));

  const productionLocations = productionLocationRows.map(
    (row) => ({
      id: row.id,
      year: row.year,
      productionValue: row.productionValue,
      sharePercentage: row.sharePercentage,
      producerRank: row.producerRank,
      recordType: row.recordType,
      locationDetail: row.locationDetail,
      notes: row.notes,
      unit:
        row.unitCode === null
          ? null
          : {
              code: row.unitCode,
              name: row.unitName!,
              symbol: row.unitSymbol!,
            },
      region: {
        name: row.regionName,
        slug: row.regionSlug,
        code: row.regionCode,
        latitude: row.regionLatitude,
        longitude: row.regionLongitude,
      },
      source: createSourceReference({
        ...row,
        sourceRole: "primary",
      }),
    }),
  );

  const globalStatisticSets = globalSetRows.map((row) => ({
    id: row.id,
    statisticYear: row.statisticYear,
    metricCode: row.metricCode,
    basisCode: row.basisCode,
    availabilityStatus: row.availabilityStatus,
    recordType: row.recordType,
    sourceUrl: row.sourceUrl,
    pageReference: row.pageReference,
    notes: row.notes,
    unit:
      row.unitCode === null
        ? null
        : {
            code: row.unitCode,
            name: row.unitName!,
            symbol: row.unitSymbol!,
          },
    primarySource:
      row.sourceId === null ||
      row.sourceName === null ||
      row.sourceSlug === null ||
      row.sourceType === null ||
      row.sourceOrganization === null ||
      row.sourceIsOfficial === null
        ? null
        : createSourceReference({
            sourceName: row.sourceName,
            sourceSlug: row.sourceSlug,
            sourceType: row.sourceType,
            sourceOrganization: row.sourceOrganization,
            sourceMasterUrl: row.sourceMasterUrl,
            sourceIsOfficial: row.sourceIsOfficial,
            sourceUrl: row.sourceUrl,
            pageReference: row.pageReference,
            sourceRole: "primary",
          }),
    supportingSources: globalSourcesById.get(row.id) ?? [],
    entries: (globalEntriesById.get(row.id) ?? []).map(
      (entry) => ({
        id: entry.id,
        rank: entry.rank,
        value: entry.value,
        notes: entry.notes,
        country: {
          name: entry.countryName,
          slug: entry.countrySlug,
          code: entry.countryCode,
        },
      }),
    ),
  }));

  const producers = producerRows.map((row) => ({
    id: row.id,
    producerKey: row.producerKey,
    companyName: row.companyName,
    operationArea: row.operationArea,
    producerRole: row.producerRole,
    displayOrder: row.displayOrder,
    notes: row.notes,
    industryCompanyId: row.industryCompanyId,
    primaryRegion:
      row.regionName === null || row.regionSlug === null
        ? null
        : {
            name: row.regionName,
            slug: row.regionSlug,
          },
    source: createSourceReference({
      ...row,
      sourceRole: "primary",
    }),
  }));

  return {
    id: commodityRow.id,
    name: commodityRow.name,
    slug: commodityRow.slug,
    symbol: commodityRow.symbol,
    category: commodityRow.category,
    description: commodityRow.description,
    specification: commodityRow.specification,
    image:
      commodityRow.imageUrl === null
        ? null
        : {
            url: commodityRow.imageUrl,
            alt: commodityRow.imageAlt,
            credit: commodityRow.imageCredit,
            sourceUrl: commodityRow.imageSourceUrl,
          },
    isIntelligenceTracked:
      commodityRow.isIntelligenceTracked,
    displayOrder: commodityRow.displayOrder,
    profile: {
      title: commodityRow.profileTitle,
      slug: commodityRow.profileSlug,
      excerpt: commodityRow.profileExcerpt,
      body: commodityRow.profileBody,
      coverImageUrl: commodityRow.profileCoverImageUrl,
      readingTimeMinutes:
        commodityRow.profileReadingTimeMinutes,
      isFeatured: commodityRow.profileIsFeatured,
      publishedAt:
        commodityRow.profilePublishedAt?.toISOString() ?? null,
      sources: profileSourceRows.map((row) =>
        createSourceReference({
          ...row,
          sourceRole: "profile",
        }),
      ),
    },
    resourceStatistics,
    productionLocations,
    globalStatisticSets,
    producers,
    dataSummary: {
      resourceStatisticCount: resourceStatistics.length,
      productionLocationCount: productionLocations.length,
      globalStatisticSetCount: globalStatisticSets.length,
      globalStatisticEntryCount: globalStatisticSets.reduce(
        (total, set) => total + set.entries.length,
        0,
      ),
      producerCount: producers.length,
    },
  };
}