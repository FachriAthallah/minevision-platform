import "server-only";

import { getPublicIndustryCompanies } from "./get-public-industry-companies";
import { getPublicIndustryCompanyBySlug } from "./get-public-industry-company";
import type { PublicIndustryCompanySummary } from "../types/industry";
import type { IndustryReportCatalogItem } from "../types/industry-view";

export type PublicIndustryExperience = {
  companies: PublicIndustryCompanySummary[];
  reports: IndustryReportCatalogItem[];
};

export async function getPublicIndustryExperience(
  includeReports: boolean,
): Promise<PublicIndustryExperience> {
  const companies = await getPublicIndustryCompanies({});

  if (!includeReports || companies.length === 0) {
    return {
      companies,
      reports: [],
    };
  }

  const companyDetails = await Promise.all(
    companies.map((company) => getPublicIndustryCompanyBySlug(company.slug)),
  );

  const reports = companyDetails
    .flatMap((company) =>
      company
        ? company.reports.map((report) => ({
            ...report,
            companyId: company.id,
            companyName: company.name,
            companySlug: company.slug,
            companyLogoPath: company.logoPath,
            companyDisplayOrder: company.displayOrder,
          }))
        : [],
    )
    .sort(
      (left, right) =>
        right.reportYear - left.reportYear ||
        left.companyDisplayOrder - right.companyDisplayOrder ||
        left.reportType.localeCompare(right.reportType),
    );

  return {
    companies,
    reports,
  };
}
