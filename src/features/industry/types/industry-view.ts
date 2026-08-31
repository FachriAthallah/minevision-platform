import type { PublicIndustryReport } from "./industry";

export type IndustryCategory = "companies" | "reports" | "operations";

export type IndustryReportCatalogItem = PublicIndustryReport & {
  companyId: string;
  companyName: string;
  companySlug: string;
  companyLogoPath: string;
  companyDisplayOrder: number;
};

export type IndustryReportFilters = {
  search: string;
  companySlug: string;
  reportYear: string;
  reportType: string;
};
