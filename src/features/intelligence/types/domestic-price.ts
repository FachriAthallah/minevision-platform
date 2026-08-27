export type DomesticPricePeriod =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "annual"
  | "custom";

export type DomesticPriceRecordType =
  | "actual"
  | "provisional"
  | "projection"
  | "revised";

export type PublicDomesticPriceRecord = {
  commodity: {
    name: string;
    slug: string;
    symbol: string | null;
  };

  standard: {
    code: string;
    name: string;
  };

  effectiveDate: string;
  period: DomesticPricePeriod;
  periodLabel: string | null;

  value: number;
  currencyCode: string;

  unit: {
    code: string;
    name: string;
    symbol: string;
  };

  recordType: DomesticPriceRecordType;

  source: {
    name: string;
    slug: string;
    organization: string;
    url: string | null;
  };
};

export type DomesticPriceApiResponse =
  | {
      success: true;
      data: PublicDomesticPriceRecord[];
      meta: {
        count: number;
        filters: {
          commodity: string;
          standard?: string;
          fromDate?: string;
          toDate?: string;
          period?: DomesticPricePeriod;
        };
      };
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        details?: unknown;
      };
    };
