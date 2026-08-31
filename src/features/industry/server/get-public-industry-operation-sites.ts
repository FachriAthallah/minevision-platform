import "server-only";

import { and, asc, eq, isNotNull } from "drizzle-orm";

import { db } from "@/db";
import {
  industryCompanies,
  industryOperationSites,
  sources,
} from "@/db/schema";

import type { IndustryOperationSiteQuery } from "../schemas/industry-query";
import type { PublicIndustryOperationSite } from "../types/industry";

export async function getPublicIndustryOperationSites(
  query: IndustryOperationSiteQuery,
): Promise<PublicIndustryOperationSite[]> {
  const rows = await db
    .select({
      id: industryOperationSites.id,
      name: industryOperationSites.name,
      slug: industryOperationSites.slug,
      operatorName: industryOperationSites.operatorName,
      siteType: industryOperationSites.siteType,
      currentStatus: industryOperationSites.currentStatus,
      statusLabel: industryOperationSites.statusLabel,
      commoditySlugs: industryOperationSites.commoditySlugs,
      provinceName: industryOperationSites.provinceName,
      regencyName: industryOperationSites.regencyName,
      locationDescription: industryOperationSites.locationDescription,
      latitude: industryOperationSites.latitude,
      longitude: industryOperationSites.longitude,
      coordinatePrecision: industryOperationSites.coordinatePrecision,
      displayOrder: industryOperationSites.displayOrder,
      companyName: industryCompanies.name,
      companySlug: industryCompanies.slug,
      companyLogoPath: industryCompanies.logoPath,
      sourceName: sources.name,
      sourceUrl: industryOperationSites.sourceUrl,
      pageReference: industryOperationSites.pageReference,
      sourceReportId: industryOperationSites.sourceReportId,
    })
    .from(industryOperationSites)
    .innerJoin(
      industryCompanies,
      eq(industryOperationSites.companyId, industryCompanies.id),
    )
    .innerJoin(sources, eq(industryOperationSites.sourceId, sources.id))
    .where(
      and(
        eq(industryOperationSites.isActive, true),
        eq(industryOperationSites.verificationStatus, "verified"),
        eq(industryOperationSites.publicationStatus, "published"),
        isNotNull(industryOperationSites.latitude),
        isNotNull(industryOperationSites.longitude),
        isNotNull(industryOperationSites.coordinatePrecision),
        eq(industryCompanies.isActive, true),
        eq(industryCompanies.verificationStatus, "verified"),
        eq(industryCompanies.publicationStatus, "published"),
        eq(sources.isActive, true),
        eq(sources.verificationStatus, "verified"),
        query.companySlug !== undefined
          ? eq(industryCompanies.slug, query.companySlug)
          : undefined,
      ),
    )
    .orderBy(
      asc(industryCompanies.displayOrder),
      asc(industryOperationSites.displayOrder),
      asc(industryOperationSites.name),
    );

  return rows.map((site) => ({
    id: site.id,
    name: site.name,
    slug: site.slug,
    operatorName: site.operatorName,
    siteType: site.siteType,
    currentStatus: site.currentStatus,
    statusLabel: site.statusLabel,
    commoditySlugs: site.commoditySlugs,
    provinceName: site.provinceName,
    regencyName: site.regencyName,
    locationDescription: site.locationDescription,
    latitude: site.latitude!,
    longitude: site.longitude!,
    coordinatePrecision: site.coordinatePrecision!,
    displayOrder: site.displayOrder,
    company: {
      name: site.companyName,
      slug: site.companySlug,
      logoPath: site.companyLogoPath,
    },
    source: {
      name: site.sourceName,
      url: site.sourceUrl,
      pageReference: site.pageReference,
      reportId: site.sourceReportId,
    },
  }));
}
