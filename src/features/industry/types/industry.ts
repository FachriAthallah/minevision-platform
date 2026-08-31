export type PublicIndustryReportType =
  | "annual_report"
  | "sustainability_report";

export type PublicIndustrySourceReference = {
  name: string;
  url: string;
  pageReference: string | null;
  reportId: string | null;
};

export type PublicIndustryProductionRecord = {
  id: string;
  year: number;
  metricCode: string;
  metricName: string;
  productName: string;
  commodity: {
    name: string;
    slug: string;
    symbol: string | null;
  };
  productionValue: string;
  reportedValue: string;
  valueScale: number;
  unit: {
    code: string;
    name: string;
    symbol: string;
  };
  reportedUnitLabel: string;
  productionBasis: string;
  recordType: "actual" | "provisional" | "projection" | "revised";
  source: PublicIndustrySourceReference;
};

export type PublicIndustryFinancialRecord = {
  id: string;
  year: number;
  metric:
    | "total_assets"
    | "revenue"
    | "net_income"
    | "profit_for_year"
    | "operating_income";
  metricLabel: string;
  amount: string;
  currencyCode: string;
  reportedValue: string;
  valueScale: number;
  reportedUnitLabel: string;
  statementScope: string;
  profitDefinition: string | null;
  auditStatus: "audited" | "unaudited" | "unknown";
  presentation: {
    value: string;
    unitCode: "million_usd" | "trillion_idr" | "base_currency";
    unitLabel: string;
    fractionDigits: 2;
  };
  source: PublicIndustrySourceReference;
};

export type PublicIndustryOperationSite = {
  id: string;
  name: string;
  slug: string;
  operatorName: string;
  siteType:
    | "mine"
    | "underground_mine"
    | "smelter"
    | "refinery"
    | "port"
    | "industrial_complex"
    | "project"
    | "operating_area";
  currentStatus:
    | "operating"
    | "ramp_up"
    | "development"
    | "construction"
    | "limited_operation"
    | "care_and_maintenance"
    | "closed";
  statusLabel: string;
  commoditySlugs: string[];
  provinceName: string;
  regencyName: string | null;
  locationDescription: string;
  latitude: string;
  longitude: string;
  coordinatePrecision:
    | "exact"
    | "approximate"
    | "regency_centroid"
    | "province_centroid"
    | "withheld";
  displayOrder: number;
  company: {
    name: string;
    slug: string;
    logoPath: string;
  };
  source: PublicIndustrySourceReference;
};

export type PublicIndustryReport = {
  id: string;
  reportYear: number;
  reportType: PublicIndustryReportType;
  title: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  sourceUrl: string | null;
  publishedAt: string | null;
  downloadUrl: string;
};

export type PublicIndustryCompanySummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  companyType: string | null;
  businessField: string | null;
  headquartersAddress: string | null;
  establishedYear: number | null;
  operationAreaDescription: string | null;
  officialWebsiteUrl: string | null;
  logoPath: string;
  displayOrder: number;
  reportCount: number;
  availableReportYears: number[];
  availableReportTypes: PublicIndustryReportType[];
};

export type PublicIndustryCompanyDetail =
  PublicIndustryCompanySummary & {
    reports: PublicIndustryReport[];
    production: PublicIndustryProductionRecord[];
    financials: PublicIndustryFinancialRecord[];
    operationSites: PublicIndustryOperationSite[];
    dataSummary: {
      productionRecordCount: number;
      financialRecordCount: number;
      operationSiteCount: number;
      productionYears: number[];
      financialYears: number[];
    };
  };

export type IndustryCompanyApiResponse =
  | {
      success: true;
      data: PublicIndustryCompanySummary[];
      meta: {
        count: number;
        filters: {
          search?: string;
          reportYear?: number;
          reportType?: PublicIndustryReportType;
        };
      };
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        details?: Record<string, string[] | undefined>;
      };
    };

export type IndustryCompanyDetailApiResponse =
  | {
      success: true;
      data: PublicIndustryCompanyDetail;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        details?: Record<string, string[] | undefined>;
      };
    };

export type IndustryOperationSiteApiResponse =
  | {
      success: true;
      data: PublicIndustryOperationSite[];
      meta: {
        count: number;
        filters: {
          companySlug?: string;
        };
      };
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        details?: Record<string, string[] | undefined>;
      };
    };
