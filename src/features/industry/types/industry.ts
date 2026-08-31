export type PublicIndustryReportType =
  | "annual_report"
  | "sustainability_report";

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
