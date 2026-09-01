import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { industryCompanies, industryReports } from "@/db/schema";

import type { IndustryReportCatalogItem } from "../types/industry-view";

export async function getPublicIndustryReports(): Promise<
  IndustryReportCatalogItem[]
> {
  const rows = await db
    .select({
      id: industryReports.id,
      reportYear: industryReports.reportYear,
      reportType: industryReports.reportType,
      title: industryReports.title,
      fileName: industryReports.fileName,
      mimeType: industryReports.mimeType,
      fileSizeBytes: industryReports.fileSizeBytes,
      sourceUrl: industryReports.sourceUrl,
      publishedAt: industryReports.publishedAt,
      companyId: industryCompanies.id,
      companyName: industryCompanies.name,
      companySlug: industryCompanies.slug,
      companyLogoPath: industryCompanies.logoPath,
      companyDisplayOrder: industryCompanies.displayOrder,
    })
    .from(industryReports)
    .innerJoin(
      industryCompanies,
      eq(industryReports.companyId, industryCompanies.id),
    )
    .where(
      and(
        eq(industryReports.verificationStatus, "verified"),
        eq(industryReports.publicationStatus, "published"),
        eq(industryCompanies.isActive, true),
        eq(industryCompanies.verificationStatus, "verified"),
        eq(industryCompanies.publicationStatus, "published"),
      ),
    )
    .orderBy(
      desc(industryReports.reportYear),
      asc(industryCompanies.displayOrder),
      asc(industryReports.reportType),
    );

  return rows.map((report) => ({
    ...report,
    publishedAt: report.publishedAt?.toISOString() ?? null,
    downloadUrl: `/api/v1/industry/reports/${report.id}/download`,
  }));
}
