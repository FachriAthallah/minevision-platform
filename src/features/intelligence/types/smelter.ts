import type { SmelterQuery } from "../schemas/smelter-query";

export type SmelterFacilityType =
  | "smelter"
  | "refinery"
  | "integrated_processing"
  | "other";

export type SmelterFacilityStatus =
  | "planned"
  | "construction"
  | "commissioning"
  | "operating"
  | "temporarily_suspended"
  | "inactive"
  | "unknown";

export type PublicSmelterCapacity = {
  value: number;
  unitCode: string;
};

export type PublicSmelterOutput = {
  commodity: {
    name: string;
    slug: string;
    symbol: string | null;
  };
  inputMaterial: string;
  outputProduct: string;
  processType: string | null;
  inputCapacity: PublicSmelterCapacity | null;
  outputCapacity: PublicSmelterCapacity | null;
  capacityReferenceYear: number | null;
  isPrimary: boolean;
};

export type PublicSmelterSource = {
  publisherName: string;
  documentTitle: string;
  url: string;
  publishedDate: string | null;
  accessedAt: string;
  supportsFields: string[];
  isOfficial: boolean;
  source: {
    name: string;
    slug: string;
    organization: string;
    url: string | null;
  } | null;
};

export type PublicSmelterFacility = {
  id: string;
  facilityCode: string;
  name: string;
  slug: string;
  facilityType: SmelterFacilityType;
  currentStatus: SmelterFacilityStatus;
  operator: {
    name: string;
    slug: string;
    websiteUrl: string | null;
  };
  location: {
    province: string;
    cityRegency: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  operationTimeline: {
    reportedOperationYear: number | null;
    constructionYear: number | null;
    commissioningYear: number | null;
    commercialOperationYear: number | null;
  };
  outputs: PublicSmelterOutput[];
  sources: PublicSmelterSource[];
  updatedAt: string;
};

export type SmelterApiResponse =
  | {
      success: true;
      data: PublicSmelterFacility[];
      meta: {
        count: number;
        filters: SmelterQuery;
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
