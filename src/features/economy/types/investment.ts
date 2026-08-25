import type { InvestmentQuery } from "../schemas/investment-query";

export type InvestmentOrigin = "pma" | "pmdn";

export type PublicInvestmentSource = {
  label: string | null;
  pageReference: string | null;
  url: string | null;
  isPrimary: boolean;
  source: {
    name: string;
    slug: string;
    organization: string;
  };
};

export type PublicInvestmentRecord = {
  id: string;
  region: {
    code: string;
    name: string;
  };
  year: number;
  sector: {
    code: string;
    name: string;
  };
  origin: InvestmentOrigin;
  investmentValue: number;
  currency: {
    code: string;
    scale: string;
  };
  projectCount: number | null;
  annualMetrics: {
    totalInvestmentValue: number | null;
    totalProjectCount: number | null;
    valueSharePercentage: number | null;
    nominalYoyChangePercentage: number | null;
  };
  dataStatus: "final" | "preliminary" | "very_preliminary";
  recordType: "actual" | "provisional" | "projection" | "revised";
  sourcePublishedAt: string | null;
  sources: PublicInvestmentSource[];
};

export type InvestmentApiResponse =
  | {
      success: true;
      data: PublicInvestmentRecord[];
      meta: {
        count: number;
        filters: InvestmentQuery;
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
