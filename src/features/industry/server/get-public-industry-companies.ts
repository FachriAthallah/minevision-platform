import "server-only";

import { and, asc, desc, eq, ilike, inArray, or } from "drizzle-orm";

import { db } from "@/db";
import { industryCompanies, industryReports } from "@/db/schema";

import type { IndustryCompanyQuery } from "../schemas/industry-query";
import type {
  PublicIndustryCompanySummary,
  PublicIndustryReportType,
} from "../types/industry";

export async function getPublicIndustryCompanies(
  query: IndustryCompanyQuery,
): Promise<PublicIndustryCompanySummary[]> {
  const companyRows = await db
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
        eq(industryCompanies.isActive, true),
        eq(industryCompanies.verificationStatus, "verified"),
        eq(industryCompanies.publicationStatus, "published"),
        query.search !== undefined
          ? or(
              ilike(industryCompanies.name, `%${query.search}%`),
              ilike(industryCompanies.description, `%${query.search}%`),
              ilike(industryCompanies.businessField, `%${query.search}%`),
            )
          : undefined,
      ),
    )
    .orderBy(asc(industryCompanies.displayOrder), asc(industryCompanies.name));

  if (companyRows.length === 0) {
    return [];
  }

  const reportRows = await db
    .select({
      companyId: industryReports.companyId,
      reportYear: industryReports.reportYear,
      reportType: industryReports.reportType,
    })
    .from(industryReports)
    .where(
      and(
        inArray(
          industryReports.companyId,
          companyRows.map((company) => company.id),
        ),
        eq(industryReports.verificationStatus, "verified"),
        eq(industryReports.publicationStatus, "published"),
        query.reportYear !== undefined
          ? eq(industryReports.reportYear, query.reportYear)
          : undefined,
        query.reportType !== undefined
          ? eq(industryReports.reportType, query.reportType)
          : undefined,
      ),
    )
    .orderBy(
      asc(industryReports.companyId),
      desc(industryReports.reportYear),
      asc(industryReports.reportType),
    );

  const reportsByCompanyId = new Map<
    string,
    Array<{
      reportYear: number;
      reportType: PublicIndustryReportType;
    }>
  >();

  for (const report of reportRows) {
    const companyReports = reportsByCompanyId.get(report.companyId) ?? [];

    companyReports.push({
      reportYear: report.reportYear,
      reportType: report.reportType,
    });

    reportsByCompanyId.set(report.companyId, companyReports);
  }

  const reportFilterIsActive =
    query.reportYear !== undefined || query.reportType !== undefined;

  return companyRows.flatMap((company) => {
    const reports = reportsByCompanyId.get(company.id) ?? [];

    if (reportFilterIsActive && reports.length === 0) {
      return [];
    }

    return [
      {
        ...company,
        reportCount: reports.length,
        availableReportYears: Array.from(
          new Set(reports.map((report) => report.reportYear)),
        ).sort((left, right) => right - left),
        availableReportTypes: Array.from(
          new Set(reports.map((report) => report.reportType)),
        ).sort(),
      },
    ];
  });
}
