import "server-only";

import { getPublicIndustryCompanies } from "./get-public-industry-companies";
import { getPublicIndustryOperationSites } from "./get-public-industry-operation-sites";
import { getPublicIndustryReports } from "./get-public-industry-reports";
import type {
  PublicIndustryCompanySummary,
  PublicIndustryOperationSite,
} from "../types/industry";
import type { IndustryReportCatalogItem } from "../types/industry-view";

export type PublicIndustryExperience = {
  companies: PublicIndustryCompanySummary[];
  reports: IndustryReportCatalogItem[];
  operationSites: PublicIndustryOperationSite[];
};

export async function getPublicIndustryExperience(
  includeReports: boolean,
): Promise<PublicIndustryExperience> {
  const [companies, operationSites] = await Promise.all([
    getPublicIndustryCompanies({}),
    getPublicIndustryOperationSites({}),
  ]);

  if (!includeReports || companies.length === 0) {
    return {
      companies,
      reports: [],
      operationSites,
    };
  }

  const reports = await getPublicIndustryReports();

  return {
    companies,
    reports,
    operationSites,
  };
}
