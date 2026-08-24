export type ProductionRecordType =
  | "actual"
  | "provisional"
  | "projection"
  | "revised";

export type PublicProductionSource = {
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

export type PublicProductionRecord = {
  commodity: {
    name: string;
    slug: string;
    symbol: string | null;
  };
  year: number;
  value: number;
  unit: {
    code: string;
    name: string;
    symbol: string;
  };
  recordType: ProductionRecordType;
  sources: PublicProductionSource[];
};

export type ProductionApiResponse =
  | {
      success: true;
      data: PublicProductionRecord[];
      meta: {
        count: number;
        filters: {
          commodity: string;
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
      };
    };

export type PublicProductionOption = {
  name: string;
  slug: string;
  symbol: string | null;
  fromYear: number;
  toYear: number;
};
