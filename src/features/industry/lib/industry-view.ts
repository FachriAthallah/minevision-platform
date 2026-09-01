import type { PublicIndustryCompanySummary } from "../types/industry";
import { getIndustryCompanyPresentation } from "../content/industry-company-content";
import type {
  IndustryCategory,
  IndustryReportCatalogItem,
  IndustryReportFilters,
} from "../types/industry-view";

const INDUSTRY_CATEGORIES: IndustryCategory[] = [
  "companies",
  "reports",
  "operations",
];

function normalizeSearchValue(value: string): string {
  return value.trim().toLocaleLowerCase("id-ID");
}

function includesSearchValue(
  search: string,
  values: Array<string | null | undefined>,
): boolean {
  if (!search) {
    return true;
  }

  return values.some((value) =>
    value?.toLocaleLowerCase("id-ID").includes(search),
  );
}

export function parseIndustryCategory(
  value: string | string[] | undefined,
): IndustryCategory {
  const candidate = Array.isArray(value) ? value[0] : value;

  return INDUSTRY_CATEGORIES.includes(candidate as IndustryCategory)
    ? (candidate as IndustryCategory)
    : "companies";
}

export function filterIndustryCompanies(
  companies: PublicIndustryCompanySummary[],
  query: string,
): PublicIndustryCompanySummary[] {
  const search = normalizeSearchValue(query);

  return companies.filter((company) =>
    {
      const presentation = getIndustryCompanyPresentation(company.slug);

      return includesSearchValue(search, [
        company.name,
        company.companyType,
        company.businessField,
        company.operationAreaDescription,
        presentation?.mainOperation,
        presentation?.primaryCommodity,
      ]);
    },
  );
}

export function filterIndustryReports(
  reports: IndustryReportCatalogItem[],
  filters: IndustryReportFilters,
): IndustryReportCatalogItem[] {
  const search = normalizeSearchValue(filters.search);

  return reports.filter((report) => {
    const matchesSearch = includesSearchValue(search, [
      report.companyName,
      report.title,
      report.fileName,
    ]);
    const matchesCompany =
      !filters.companySlug || report.companySlug === filters.companySlug;
    const matchesYear =
      !filters.reportYear ||
      report.reportYear === Number.parseInt(filters.reportYear, 10);
    const matchesType =
      !filters.reportType || report.reportType === filters.reportType;

    return matchesSearch && matchesCompany && matchesYear && matchesType;
  });
}

export function formatIndustryReportType(
  reportType: IndustryReportCatalogItem["reportType"],
): string {
  return reportType === "annual_report"
    ? "Laporan Tahunan"
    : "Laporan Keberlanjutan";
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "Ukuran tidak tersedia";
  }

  const units = ["B", "KB", "MB", "GB"] as const;
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** unitIndex;

  return `${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: unitIndex === 0 ? 0 : 1,
  }).format(value)} ${units[unitIndex]}`;
}

export function getIndustryReportDownloadUrl(reportId: string): string {
  return `/api/v1/industry/reports/${reportId}/download`;
}
