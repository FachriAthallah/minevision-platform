import type {
  PublicIndustryCompanyDetail,
  PublicIndustryCompanySummary,
  PublicIndustryFinancialRecord,
  PublicIndustryOperationSite,
  PublicIndustryProductionRecord,
} from "../types/industry";
import { getIndustryCompanyPresentation } from "../content/industry-company-content";

export const INDUSTRY_YEARS = [2023, 2024, 2025] as const;

export type IndustryHeroStatistics = {
  companyCount: number;
  reportCount: number;
  operationSiteCount: number;
};

export type IndustryProductionAvailability =
  | "reported"
  | "not_normalized"
  | "not_reported";

export type IndustryProductionCellInput = {
  dataAvailability: IndustryProductionAvailability;
  reportedValue: string | null;
};

export type IndustryProductionBasisInput = {
  dataAvailability: IndustryProductionAvailability;
  reportedUnitLabel: string;
};

export type IndustryDataTableRow = {
  key: string;
  label: string;
  basis: string;
  values: Record<(typeof INDUSTRY_YEARS)[number], string>;
};

export type IndustryOfficialReference = {
  title: string;
  institution: string;
  year: number | null;
  url: string;
  documentType: string;
};

const numberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 6,
});

export function formatIndustryNumber(value: string): string {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? numberFormatter.format(parsed) : value;
}

export function formatIndustryProductionCell(
  input: IndustryProductionCellInput,
): string {
  if (input.dataAvailability === "not_reported" || input.reportedValue === null) {
    return "—";
  }

  return formatIndustryNumber(input.reportedValue);
}

export function formatIndustryProductionBasis(
  input: IndustryProductionBasisInput,
): string {
  return input.dataAvailability === "not_normalized"
    ? `${input.reportedUnitLabel} · basis resmi belum dinormalisasi`
    : input.reportedUnitLabel;
}

export function getIndustryHeroStatistics(
  companies: PublicIndustryCompanySummary[],
  operationSites: PublicIndustryOperationSite[],
): IndustryHeroStatistics {
  return {
    companyCount: companies.length,
    reportCount: companies.reduce(
      (total, company) => total + company.reportCount,
      0,
    ),
    operationSiteCount: operationSites.length,
  };
}

export function filterOperationSitesByCompany(
  sites: PublicIndustryOperationSite[],
  companySlug: string,
): PublicIndustryOperationSite[] {
  return companySlug
    ? sites.filter((site) => site.company.slug === companySlug)
    : sites;
}

export function getIndustryMarkerColor(companySlug: string): string {
  return getIndustryCompanyPresentation(companySlug)?.markerColor ?? "#64748b";
}

export function buildPrimaryProductionRows(
  company: Pick<PublicIndustryCompanyDetail, "slug" | "production">,
): IndustryDataTableRow[] {
  const configuration = getIndustryCompanyPresentation(company.slug);
  if (!configuration) {
    return [];
  }

  const records = company.production.filter((record) =>
    configuration.primaryMetricCodes.includes(record.metricCode),
  );
  const metricCodes = Array.from(
    new Set(records.map((record) => record.metricCode)),
  );

  return metricCodes.map((metricCode) => {
    const metricRecords = records.filter(
      (record) => record.metricCode === metricCode,
    );
    const first = metricRecords[0]!;

    return {
      key: metricCode,
      label: first.metricName,
      basis: first.reportedUnitLabel,
      values: Object.fromEntries(
        INDUSTRY_YEARS.map((year) => {
          const record = metricRecords.find((item) => item.year === year);
          return [
            year,
            record ? formatIndustryNumber(record.reportedValue) : "—",
          ];
        }),
      ) as IndustryDataTableRow["values"],
    };
  });
}

function getFinancialMetricOrder(metric: PublicIndustryFinancialRecord["metric"]): number {
  if (metric === "total_assets") return 0;
  if (metric === "revenue") return 1;
  return 2;
}

export function buildFinancialRows(
  records: PublicIndustryFinancialRecord[],
): IndustryDataTableRow[] {
  const metricKeys = Array.from(new Set(records.map((record) => record.metric))).sort(
    (left, right) => getFinancialMetricOrder(left) - getFinancialMetricOrder(right),
  );

  return metricKeys.map((metric) => {
    const metricRecords = records.filter((record) => record.metric === metric);
    const first = metricRecords[0]!;

    return {
      key: metric,
      label: first.metricLabel,
      basis: first.reportedUnitLabel,
      values: Object.fromEntries(
        INDUSTRY_YEARS.map((year) => {
          const record = metricRecords.find((item) => item.year === year);
          return [year, record ? formatIndustryNumber(record.reportedValue) : "—"];
        }),
      ) as IndustryDataTableRow["values"],
    };
  });
}

export function buildOfficialReferences(
  company: PublicIndustryCompanyDetail,
): IndustryOfficialReference[] {
  const references: IndustryOfficialReference[] = [];
  const seen = new Set<string>();

  function add(reference: IndustryOfficialReference) {
    if (!seen.has(reference.url)) {
      seen.add(reference.url);
      references.push(reference);
    }
  }

  if (company.officialWebsiteUrl) {
    add({
      title: "Website resmi perusahaan",
      institution: company.name,
      year: null,
      url: company.officialWebsiteUrl,
      documentType: "Website resmi",
    });
  }

  company.reports.forEach((report) => {
    if (report.sourceUrl) {
      add({
        title: report.title,
        institution: company.name,
        year: report.reportYear,
        url: report.sourceUrl,
        documentType:
          report.reportType === "annual_report"
            ? "Laporan Tahunan"
            : "Laporan Keberlanjutan",
      });
    }
  });

  [...company.production, ...company.financials].forEach((record) => {
    add({
      title: record.source.name,
      institution: company.name,
      year: record.year,
      url: record.source.url,
      documentType: "Dokumen perusahaan",
    });
  });

  return references;
}

export function isPrimaryProductionRecord(
  companySlug: string,
  record: Pick<PublicIndustryProductionRecord, "metricCode">,
): boolean {
  return (
    getIndustryCompanyPresentation(companySlug)?.primaryMetricCodes.includes(
      record.metricCode,
    ) ?? false
  );
}
