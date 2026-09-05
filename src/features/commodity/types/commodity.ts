export type PublicCommodityCategory =
  | "metal_mineral"
  | "non_metal_mineral"
  | "energy";

export type PublicCommoditySummary = {
  id: string;
  name: string;
  slug: string;
  symbol: string | null;
  category: PublicCommodityCategory;
  description: string | null;
  specification: string | null;
  image: {
    url: string;
    alt: string | null;
    credit: string | null;
    sourceUrl: string | null;
  } | null;
  isIntelligenceTracked: boolean;
  displayOrder: number;
  profile: {
    title: string;
    excerpt: string | null;
    readingTimeMinutes: number | null;
    isFeatured: boolean;
    publishedAt: string | null;
  };
};

export type CommodityListApiResponse =
  | {
      success: true;
      data: PublicCommoditySummary[];
      meta: {
        count: number;
        filters: {
          search?: string;
          category?: PublicCommodityCategory;
          intelligenceTracked?: boolean;
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

export type PublicCommoditySourceType =
  | "government"
  | "statistics_agency"
  | "company_report"
  | "academic"
  | "regulation"
  | "market_data"
  | "other";

export type PublicCommodityRecordType =
  | "actual"
  | "provisional"
  | "projection"
  | "revised";

export type PublicCommoditySourceReference = {
  name: string;
  slug: string;
  type: PublicCommoditySourceType;
  organization: string;
  url: string | null;
  isOfficial: boolean;
  citationLabel: string | null;
  sourceUrl: string | null;
  pageReference: string | null;
  sourceRole: string | null;
};

export type PublicCommodityUnit = {
  code: string;
  name: string;
  symbol: string;
};

export type PublicCommodityProfile = {
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  coverImageUrl: string | null;
  readingTimeMinutes: number | null;
  isFeatured: boolean;
  publishedAt: string | null;
  sources: PublicCommoditySourceReference[];
};

export type PublicCommodityResourceStatistic = {
  id: string;
  statisticYear: number;
  statisticType: string;
  materialBasis: string | null;
  availabilityStatus: string;
  value: string | null;
  recordType: PublicCommodityRecordType;
  notes: string | null;
  unit: PublicCommodityUnit | null;
  primarySource: PublicCommoditySourceReference;
  supportingSources: PublicCommoditySourceReference[];
};

export type PublicCommodityProductionLocation = {
  id: string;
  year: number | null;
  productionValue: string | null;
  sharePercentage: string | null;
  producerRank: number | null;
  recordType: PublicCommodityRecordType;
  locationDetail: string | null;
  notes: string | null;
  unit: PublicCommodityUnit | null;
  region: {
    name: string;
    slug: string;
    code: string | null;
    latitude: string | null;
    longitude: string | null;
  };
  source: PublicCommoditySourceReference;
};

export type PublicCommodityGlobalStatisticEntry = {
  id: string;
  rank: number;
  value: string;
  notes: string | null;
  country: {
    name: string;
    slug: string;
    code: string | null;
  };
};

export type PublicCommodityGlobalStatisticSet = {
  id: string;
  statisticYear: number;
  metricCode: string;
  basisCode: string;
  availabilityStatus: string;
  recordType: PublicCommodityRecordType;
  sourceUrl: string | null;
  pageReference: string | null;
  notes: string | null;
  unit: PublicCommodityUnit | null;
  primarySource: PublicCommoditySourceReference | null;
  supportingSources: PublicCommoditySourceReference[];
  entries: PublicCommodityGlobalStatisticEntry[];
};

export type PublicCommodityProducer = {
  id: string;
  producerKey: string;
  companyName: string;
  operationArea: string;
  producerRole: string | null;
  displayOrder: number;
  notes: string | null;
  industryCompanyId: string | null;
  primaryRegion: {
    name: string;
    slug: string;
  } | null;
  source: PublicCommoditySourceReference;
};

export type PublicCommodityDetail = Omit<PublicCommoditySummary, "profile"> & {
  profile: PublicCommodityProfile;
  resourceStatistics: PublicCommodityResourceStatistic[];
  productionLocations: PublicCommodityProductionLocation[];
  globalStatisticSets: PublicCommodityGlobalStatisticSet[];
  producers: PublicCommodityProducer[];
  dataSummary: {
    resourceStatisticCount: number;
    productionLocationCount: number;
    globalStatisticSetCount: number;
    globalStatisticEntryCount: number;
    producerCount: number;
  };
};

export type CommodityDetailApiResponse =
  | {
      success: true;
      data: PublicCommodityDetail;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        details?: Record<string, string[] | undefined>;
      };
    };
