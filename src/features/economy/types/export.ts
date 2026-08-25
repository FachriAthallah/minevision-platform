import type { ExportQuery } from "../schemas/export-query";

export type TradeDataAvailability =
  | "reported"
  | "not_reported"
  | "reported_zero"
  | "estimated";

export type PublicExportSource = {
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

export type PublicExportRecord = {
  id: string;
  commodity: {
    name: string;
    slug: string;
    symbol: string | null;
    sourceLabel: string;
    hsCode: string | null;
  };
  origin: {
    code: string;
    name: string;
  };
  destination: {
    code: string | null;
    name: string | null;
  } | null;
  year: number;
  coverageType: string;
  availability: TradeDataAvailability;
  volume: {
    value: number;
    unitCode: string | null;
    scale: string | null;
    normalizedMetricTon: number | null;
  } | null;
  fob: {
    value: number;
    currencyCode: string;
    scale: string | null;
    normalizedUsd: number | null;
    averageUsdPerMetricTon: number | null;
    nominalYoyChangePercentage: number | null;
  } | null;
  dataStatus: "final" | "preliminary" | "very_preliminary";
  recordType: "actual" | "provisional" | "projection" | "revised";
  sourcePublishedAt: string | null;
  sources: PublicExportSource[];
};

export type ExportApiResponse =
  | {
      success: true;
      data: PublicExportRecord[];
      meta: {
        count: number;
        filters: ExportQuery;
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
