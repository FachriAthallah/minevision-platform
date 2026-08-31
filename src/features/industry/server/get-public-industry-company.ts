import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  commodities,
  industryCompanies,
  industryCompanyFinancials,
  industryCompanyProduction,
  industryReports,
  measurementUnits,
  sources,
} from "@/db/schema";

import { buildFinancialPresentation } from "../lib/industry-financial-presentation";
import { getPublicIndustryOperationSites } from "./get-public-industry-operation-sites";
import type {
  PublicIndustryCompanyDetail,
  PublicIndustryFinancialRecord,
  PublicIndustryProductionRecord,
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

  const [reportRows, productionRows, financialRows, operationSites] =
    await Promise.all([
      db
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
        ),
      db
        .select({
          id: industryCompanyProduction.id,
          year: industryCompanyProduction.year,
          metricCode: industryCompanyProduction.metricCode,
          metricName: industryCompanyProduction.metricName,
          productName: industryCompanyProduction.productName,
          commodityName: commodities.name,
          commoditySlug: commodities.slug,
          commoditySymbol: commodities.symbol,
          productionValue: industryCompanyProduction.productionValue,
          reportedValue: industryCompanyProduction.reportedValue,
          valueScale: industryCompanyProduction.valueScale,
          unitCode: measurementUnits.code,
          unitName: measurementUnits.name,
          unitSymbol: measurementUnits.symbol,
          reportedUnitLabel: industryCompanyProduction.reportedUnitLabel,
          productionBasis: industryCompanyProduction.productionBasis,
          recordType: industryCompanyProduction.recordType,
          sourceName: sources.name,
          sourceUrl: industryCompanyProduction.sourceUrl,
          pageReference: industryCompanyProduction.pageReference,
          sourceReportId: industryCompanyProduction.sourceReportId,
        })
        .from(industryCompanyProduction)
        .innerJoin(
          commodities,
          eq(industryCompanyProduction.commodityId, commodities.id),
        )
        .innerJoin(
          measurementUnits,
          eq(industryCompanyProduction.unitCode, measurementUnits.code),
        )
        .innerJoin(sources, eq(industryCompanyProduction.sourceId, sources.id))
        .where(
          and(
            eq(industryCompanyProduction.companyId, company.id),
            eq(industryCompanyProduction.dataAvailability, "reported"),
            eq(industryCompanyProduction.verificationStatus, "verified"),
            eq(industryCompanyProduction.publicationStatus, "published"),
            eq(commodities.isActive, true),
            eq(measurementUnits.isActive, true),
            eq(sources.isActive, true),
            eq(sources.verificationStatus, "verified"),
          ),
        )
        .orderBy(
          desc(industryCompanyProduction.year),
          asc(industryCompanyProduction.metricCode),
        ),
      db
        .select({
          id: industryCompanyFinancials.id,
          year: industryCompanyFinancials.year,
          metric: industryCompanyFinancials.metric,
          metricLabel: industryCompanyFinancials.metricLabel,
          amount: industryCompanyFinancials.amount,
          currencyCode: industryCompanyFinancials.currencyCode,
          reportedValue: industryCompanyFinancials.reportedValue,
          valueScale: industryCompanyFinancials.valueScale,
          reportedUnitLabel: industryCompanyFinancials.reportedUnitLabel,
          statementScope: industryCompanyFinancials.statementScope,
          profitDefinition: industryCompanyFinancials.profitDefinition,
          auditStatus: industryCompanyFinancials.auditStatus,
          sourceName: sources.name,
          sourceUrl: industryCompanyFinancials.sourceUrl,
          pageReference: industryCompanyFinancials.pageReference,
          sourceReportId: industryCompanyFinancials.sourceReportId,
        })
        .from(industryCompanyFinancials)
        .innerJoin(sources, eq(industryCompanyFinancials.sourceId, sources.id))
        .where(
          and(
            eq(industryCompanyFinancials.companyId, company.id),
            eq(industryCompanyFinancials.verificationStatus, "verified"),
            eq(industryCompanyFinancials.publicationStatus, "published"),
            eq(sources.isActive, true),
            eq(sources.verificationStatus, "verified"),
          ),
        )
        .orderBy(
          desc(industryCompanyFinancials.year),
          asc(industryCompanyFinancials.metric),
        ),
      getPublicIndustryOperationSites({ companySlug: company.slug }),
    ]);

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

  const production: PublicIndustryProductionRecord[] = productionRows.map(
    (record) => ({
      id: record.id,
      year: record.year,
      metricCode: record.metricCode,
      metricName: record.metricName,
      productName: record.productName,
      commodity: {
        name: record.commodityName,
        slug: record.commoditySlug,
        symbol: record.commoditySymbol,
      },
      productionValue: record.productionValue!,
      reportedValue: record.reportedValue!,
      valueScale: record.valueScale!,
      unit: {
        code: record.unitCode,
        name: record.unitName,
        symbol: record.unitSymbol,
      },
      reportedUnitLabel: record.reportedUnitLabel!,
      productionBasis: record.productionBasis,
      recordType: record.recordType,
      source: {
        name: record.sourceName,
        url: record.sourceUrl,
        pageReference: record.pageReference,
        reportId: record.sourceReportId,
      },
    }),
  );

  const financials: PublicIndustryFinancialRecord[] = financialRows.map(
    (record) => ({
      id: record.id,
      year: record.year,
      metric: record.metric,
      metricLabel: record.metricLabel,
      amount: record.amount,
      currencyCode: record.currencyCode,
      reportedValue: record.reportedValue,
      valueScale: record.valueScale,
      reportedUnitLabel: record.reportedUnitLabel,
      statementScope: record.statementScope,
      profitDefinition: record.profitDefinition,
      auditStatus: record.auditStatus,
      presentation: buildFinancialPresentation(
        record.amount,
        record.currencyCode,
      ),
      source: {
        name: record.sourceName,
        url: record.sourceUrl,
        pageReference: record.pageReference,
        reportId: record.sourceReportId,
      },
    }),
  );

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
    production,
    financials,
    operationSites,
    dataSummary: {
      productionRecordCount: production.length,
      financialRecordCount: financials.length,
      operationSiteCount: operationSites.length,
      productionYears: Array.from(
        new Set(production.map((record) => record.year)),
      ).sort((left, right) => right - left),
      financialYears: Array.from(
        new Set(financials.map((record) => record.year)),
      ).sort((left, right) => right - left),
    },
  };
}
