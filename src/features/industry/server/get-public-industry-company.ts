import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { industryCompanies, industryReports } from "@/db/schema";

import type {
  PublicIndustryCompanyDetail,
  PublicIndustryReport,
} from "../types/industry";

export async function getPublicIndustryCompanyBySlug(
  slug: string,
): Promise<PublicIndustryCompanyDetail | null> {
  const [company] = await db
    .select({
      id: industryCompanies.id,
      name: industryCompanies.name,
      slug: industryCompanies.slug,
      description: industryCompanies.description,
      companyType: industryCompanies.companyType,
      businessField: industryCompanies.businessField,
      headquartersAddress: industryCompanies.headquartersAddress,
      establishedYear: industryCompanies.establishedYear,
      operationAreaDescription: industryCompanies.operationAreaDescription,
      officialWebsiteUrl: industryCompanies.officialWebsiteUrl,
      logoPath: industryCompanies.logoPath,
      displayOrder: industryCompanies.displayOrder,
    })
    .from(industryCompanies)
    .where(
      and(
        eq(industryCompanies.slug, slug),
        eq(industryCompanies.isActive, true),
        eq(industryCompanies.verificationStatus, "verified"),
        eq(industryCompanies.publicationStatus, "published"),
      ),
    )
    .limit(1);

  if (!company) {
    return null;
  }

  const reportRows = await db
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
    })
    .from(industryReports)
    .where(
      and(
        eq(industryReports.companyId, company.id),
        eq(industryReports.verificationStatus, "verified"),
        eq(industryReports.publicationStatus, "published"),
      ),
    )
    .orderBy(
      desc(industryReports.reportYear),
      asc(industryReports.reportType),
    );

  const reports: PublicIndustryReport[] = reportRows.map((report) => ({
    id: report.id,
    reportYear: report.reportYear,
    reportType: report.reportType,
    title: report.title,
    fileName: report.fileName,
    mimeType: report.mimeType,
    fileSizeBytes: report.fileSizeBytes,
    sourceUrl: report.sourceUrl,
    publishedAt: report.publishedAt?.toISOString() ?? null,
    downloadUrl: `/api/v1/industry/reports/${report.id}/download`,
  }));

  return {
    ...company,
    reportCount: reports.length,
    availableReportYears: Array.from(
      new Set(reports.map((report) => report.reportYear)),
    ).sort((left, right) => right - left),
    availableReportTypes: Array.from(
      new Set(reports.map((report) => report.reportType)),
    ).sort(),
    reports,
  };
}
