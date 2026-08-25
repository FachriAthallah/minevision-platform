export type PublicGdpPriceBasis = "current_prices" | "constant_prices";

export type PublicGdpDataStatus = "final" | "preliminary" | "very_preliminary";

export type PublicGdpRecordType =
  | "actual"
  | "provisional"
  | "projection"
  | "revised";

export type PublicGdpSource = {
  label: string;
  pageReference: string | null;
  url: string | null;
  isPrimary: boolean;
  source: {
    name: string;
    slug: string;
    organization: string;
  };
};

export type PublicGdpRecord = {
  id: string;

  region: {
    code: string;
    name: string;
  };

  year: number;

  priceBasis: PublicGdpPriceBasis;
  baseYear: number | null;

  nationalGdpValue: number;
  miningQuarryingGdpValue: number;

  contributionPercentage: number | null;
  nominalYoyChangePercentage: number | null;

  currencyCode: string;
  valueScale: string;

  dataStatus: PublicGdpDataStatus;
  recordType: PublicGdpRecordType;

  sourcePublishedAt: string | null;

  sources: PublicGdpSource[];
};

export type GdpApiResponse =
  | {
      success: true;
      data: PublicGdpRecord[];
      meta: {
        count: number;
        filters: {
          region?: string;
          priceBasis?: PublicGdpPriceBasis;
          fromYear?: number;
          toYear?: number;
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
