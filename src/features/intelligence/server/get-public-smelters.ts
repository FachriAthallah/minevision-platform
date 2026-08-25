import "server-only";

import { and, asc, desc, eq, ilike, inArray, isNull, or } from "drizzle-orm";

import { db } from "@/db";
import {
  commodities,
  regions,
  smelterFacilities,
  smelterFacilityOutputs,
  smelterFacilitySources,
  smelterOperators,
  sources,
} from "@/db/schema";
import { isPubliclyVisible } from "@/features/shared/policies/publication-visibility";

import type { SmelterQuery } from "../schemas/smelter-query";
import type {
  PublicSmelterFacility,
  PublicSmelterOutput,
  PublicSmelterSource,
} from "../types/smelter";

export async function getPublicSmelters(
  query: SmelterQuery,
): Promise<PublicSmelterFacility[]> {
  const facilityRows = await db
    .selectDistinct({
      id: smelterFacilities.id,
      facilityCode: smelterFacilities.facilityCode,
      name: smelterFacilities.name,
      slug: smelterFacilities.slug,
      facilityType: smelterFacilities.facilityType,
      currentStatus: smelterFacilities.currentStatus,
      cityRegencyName: smelterFacilities.cityRegencyName,
      address: smelterFacilities.address,
      latitude: smelterFacilities.latitude,
      longitude: smelterFacilities.longitude,
      reportedOperationYear: smelterFacilities.reportedOperationYear,
      constructionYear: smelterFacilities.constructionYear,
      commissioningYear: smelterFacilities.commissioningYear,
      commercialOperationYear: smelterFacilities.commercialOperationYear,
      verificationStatus: smelterFacilities.verificationStatus,
      publicationStatus: smelterFacilities.publicationStatus,
      updatedAt: smelterFacilities.updatedAt,
      operatorName: smelterOperators.legalName,
      operatorSlug: smelterOperators.slug,
      operatorWebsiteUrl: smelterOperators.websiteUrl,
      provinceName: regions.name,
    })
    .from(smelterFacilities)
    .innerJoin(
      smelterOperators,
      eq(smelterFacilities.operatorId, smelterOperators.id),
    )
    .innerJoin(regions, eq(smelterFacilities.provinceRegionId, regions.id))
    .innerJoin(
      smelterFacilityOutputs,
      eq(smelterFacilityOutputs.facilityId, smelterFacilities.id),
    )
    .innerJoin(
      commodities,
      eq(smelterFacilityOutputs.commodityId, commodities.id),
    )
    .where(
      and(
        eq(smelterFacilities.isActive, true),
        eq(smelterFacilities.verificationStatus, "verified"),
        eq(smelterFacilities.publicationStatus, "published"),
        eq(smelterOperators.isActive, true),
        eq(commodities.isActive, true),
        query.commodity !== undefined
          ? eq(commodities.slug, query.commodity)
          : undefined,
        query.province !== undefined
          ? ilike(regions.name, query.province)
          : undefined,
        query.operator !== undefined
          ? eq(smelterOperators.slug, query.operator)
          : undefined,
        query.facilityType !== undefined
          ? eq(smelterFacilities.facilityType, query.facilityType)
          : undefined,
        query.status !== undefined
          ? eq(smelterFacilities.currentStatus, query.status)
          : undefined,
      ),
    )
    .orderBy(asc(regions.name), asc(smelterFacilities.name));

  const publiclyVisibleFacilities = facilityRows.filter(isPubliclyVisible);

  if (publiclyVisibleFacilities.length === 0) {
    return [];
  }

  const facilityIds = publiclyVisibleFacilities.map((facility) => facility.id);

  const [outputRows, sourceRows] = await Promise.all([
    db
      .select({
        facilityId: smelterFacilityOutputs.facilityId,
        commodityName: commodities.name,
        commoditySlug: commodities.slug,
        commoditySymbol: commodities.symbol,
        inputMaterial: smelterFacilityOutputs.inputMaterial,
        outputProduct: smelterFacilityOutputs.outputProduct,
        processType: smelterFacilityOutputs.processType,
        inputCapacityValue: smelterFacilityOutputs.inputCapacityValue,
        inputCapacityUnitCode: smelterFacilityOutputs.inputCapacityUnitCode,
        outputCapacityValue: smelterFacilityOutputs.outputCapacityValue,
        outputCapacityUnitCode: smelterFacilityOutputs.outputCapacityUnitCode,
        capacityReferenceYear: smelterFacilityOutputs.capacityReferenceYear,
        isPrimary: smelterFacilityOutputs.isPrimary,
      })
      .from(smelterFacilityOutputs)
      .innerJoin(
        commodities,
        eq(smelterFacilityOutputs.commodityId, commodities.id),
      )
      .where(
        and(
          inArray(smelterFacilityOutputs.facilityId, facilityIds),
          eq(commodities.isActive, true),
        ),
      )
      .orderBy(
        asc(smelterFacilityOutputs.facilityId),
        desc(smelterFacilityOutputs.isPrimary),
        asc(commodities.name),
      ),
    db
      .select({
        facilityId: smelterFacilitySources.facilityId,
        publisherName: smelterFacilitySources.publisherName,
        documentTitle: smelterFacilitySources.documentTitle,
        sourceUrl: smelterFacilitySources.sourceUrl,
        publishedDate: smelterFacilitySources.publishedDate,
        accessedAt: smelterFacilitySources.accessedAt,
        supportsFields: smelterFacilitySources.supportsFields,
        isOfficial: smelterFacilitySources.isOfficial,
        sourceName: sources.name,
        sourceSlug: sources.slug,
        sourceOrganization: sources.organization,
        canonicalSourceUrl: sources.url,
      })
      .from(smelterFacilitySources)
      .leftJoin(sources, eq(smelterFacilitySources.sourceId, sources.id))
      .where(
        and(
          inArray(smelterFacilitySources.facilityId, facilityIds),
          or(
            isNull(smelterFacilitySources.sourceId),
            and(
              eq(sources.isActive, true),
              eq(sources.verificationStatus, "verified"),
            ),
          ),
        ),
      )
      .orderBy(
        asc(smelterFacilitySources.facilityId),
        desc(smelterFacilitySources.isOfficial),
        asc(smelterFacilitySources.publisherName),
      ),
  ]);

  const outputsByFacilityId = new Map<string, PublicSmelterOutput[]>();
  const sourcesByFacilityId = new Map<string, PublicSmelterSource[]>();

  for (const output of outputRows) {
    const currentOutputs = outputsByFacilityId.get(output.facilityId) ?? [];

    currentOutputs.push({
      commodity: {
        name: output.commodityName,
        slug: output.commoditySlug,
        symbol: output.commoditySymbol,
      },
      inputMaterial: output.inputMaterial,
      outputProduct: output.outputProduct,
      processType: output.processType,
      inputCapacity:
        output.inputCapacityValue !== null &&
        output.inputCapacityUnitCode !== null
          ? {
              value: Number(output.inputCapacityValue),
              unitCode: output.inputCapacityUnitCode,
            }
          : null,
      outputCapacity:
        output.outputCapacityValue !== null &&
        output.outputCapacityUnitCode !== null
          ? {
              value: Number(output.outputCapacityValue),
              unitCode: output.outputCapacityUnitCode,
            }
          : null,
      capacityReferenceYear: output.capacityReferenceYear,
      isPrimary: output.isPrimary,
    });

    outputsByFacilityId.set(output.facilityId, currentOutputs);
  }

  for (const source of sourceRows) {
    const currentSources = sourcesByFacilityId.get(source.facilityId) ?? [];

    const canonicalSource =
      source.sourceName === null ||
      source.sourceSlug === null ||
      source.sourceOrganization === null
        ? null
        : {
            name: source.sourceName,
            slug: source.sourceSlug,
            organization: source.sourceOrganization,
            url: source.canonicalSourceUrl,
          };

    currentSources.push({
      publisherName: source.publisherName,
      documentTitle: source.documentTitle,
      url: source.sourceUrl,
      publishedDate: source.publishedDate,
      accessedAt: source.accessedAt,
      supportsFields: source.supportsFields,
      isOfficial: source.isOfficial,
      source: canonicalSource,
    });

    sourcesByFacilityId.set(source.facilityId, currentSources);
  }

  return publiclyVisibleFacilities.map((facility) => ({
    id: facility.id,
    facilityCode: facility.facilityCode,
    name: facility.name,
    slug: facility.slug,
    facilityType: facility.facilityType,
    currentStatus: facility.currentStatus,
    operator: {
      name: facility.operatorName,
      slug: facility.operatorSlug,
      websiteUrl: facility.operatorWebsiteUrl,
    },
    location: {
      province: facility.provinceName,
      cityRegency: facility.cityRegencyName,
      address: facility.address,
      latitude: facility.latitude === null ? null : Number(facility.latitude),
      longitude:
        facility.longitude === null ? null : Number(facility.longitude),
    },
    operationTimeline: {
      reportedOperationYear: facility.reportedOperationYear,
      constructionYear: facility.constructionYear,
      commissioningYear: facility.commissioningYear,
      commercialOperationYear: facility.commercialOperationYear,
    },
    outputs: outputsByFacilityId.get(facility.id) ?? [],
    sources: sourcesByFacilityId.get(facility.id) ?? [],
    updatedAt: facility.updatedAt.toISOString(),
  }));
}
