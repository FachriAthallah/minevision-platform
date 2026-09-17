export type MineBotRequestContext = {
  module?: string;
  pageUrl?: string;
  entitySlug?: string;
  commodity?: string;
  section?: string;
  year?: number;
};

export type MineBotIntent =
  | "greeting"
  | "capability"
  | "platform_info"
  | "navigation"
  | "data_query"
  | "content_query"
  | "follow_up"
  | "ambiguous"
  | "out_of_scope";

export type MineBotDataTopic =
  | "production"
  | "price"
  | "coverage"
  | "economy"
  | null;

export type MineBotEconomyMetric =
  | "national_gdp"
  | "mining_gdp"
  | "gdp_contribution"
  | "gdp_growth"
  | "exports"
  | "investment";

export type MineBotHistory = {
  role: "user" | "assistant";
  content: string;
};

export type MineBotRequestBody = {
  question: string;
  conversationId?: string;
  history?: MineBotHistory[];
  context?: MineBotRequestContext;
};

export type MineBotCitation = {
  id: string;
  label: string;
  organization: string | null;
  url: string;
  pageReference: string | null;
};

export type MineBotRelatedLink = {
  label: string;
  href: string;
  module: string;
};

export type MineBotResponseData = {
  answer: string;
  citations: MineBotCitation[];
  relatedLinks: MineBotRelatedLink[];
  sourceType: "structured" | "document" | "mixed" | "navigation" | "none";
  conversationId: string;
  limitations: string[];
  generatedAt: string;
};

export type MineBotStreamEvent =
  | { type: "meta"; data: { conversationId: string; sourceType: string } }
  | { type: "delta"; data: { text: string } }
  | {
      type: "final";
      data: {
        answer: string;
        citations: MineBotCitation[];
        relatedLinks: MineBotRelatedLink[];
        limitations: string[];
        generatedAt: string;
        fallbackCategory?: MineBotFallbackCategory;
      };
    }
  | {
      type: "error";
      data: {
        code: string;
        message: string;
        retryable?: boolean;
        fallbackCategory?: MineBotFallbackCategory;
      };
    };

export type MineBotErrorCode =
  | "INVALID_REQUEST"
  | "QUESTION_TOO_LONG"
  | "HISTORY_LIMIT_EXCEEDED"
  | "UNSUPPORTED_CONTEXT"
  | "AMBIGUOUS_QUESTION"
  | "NO_ELIGIBLE_EVIDENCE"
  | "RATE_LIMITED"
  | "AI_SERVICE_UNAVAILABLE"
  | "AI_TIMEOUT"
  | "AI_MALFORMED_RESPONSE"
  | "DATABASE_UNAVAILABLE"
  | "STREAM_INTERRUPTED"
  | "INTERNAL_ERROR";

export type MineBotFallbackCategory =
  | "clarification_commodity"
  | "clarification_year"
  | "content_unavailable"
  | "dataset_unavailable"
  | "no_public_evidence"
  | "service_unavailable"
  | "out_of_scope";

export type EvidenceKind =
  | "structured"
  | "curated_public"
  | "navigation"
  | "none";

export type Evidence = {
  evidenceId: string;
  kind: EvidenceKind;
  module: string;
  entityType: string;
  entitySlug?: string;
  title: string;
  facts: string;
  period?: {
    year?: number;
    startDate?: string;
    endDate?: string;
  };
  unit?: string;
  recordType?: "actual" | "provisional" | "projection" | "revised" | "price";
  value?: number;
  verificationStatus?: "verified" | "pending" | "rejected";
  publicationStatus?: "published" | "draft" | "in_review" | "archived";
  sourceIds: string[];
  canonicalUrl: string;
  limitations: string[];
};

export type CitationRegistryEntry = {
  id: string;
  label: string;
  organization: string | null;
  url: string;
  pageReference: string | null;
  evidence: Evidence;
};

export type Intent = MineBotIntent;

export interface IntentRouterResult {
  intent: Intent;
  entity?: {
    type: string;
    slug?: string;
    id?: string;
  };
  commodity?: string | null;
  year?: number;
  years?: number[];
  topic?: MineBotDataTopic;
  section?: string | null;
  confidence: number;
}

export type ResolvedConversationContext = {
  intent: MineBotIntent;
  commodity?: string;
  years?: number[];
  standard?: string;
  module?: string;
  company?: string;
  topic?: MineBotDataTopic;
  economyMetric?: MineBotEconomyMetric;
  inheritedFrom?: "question" | "history" | "page" | "none";
  needsClarification: boolean;
  clarification?: "commodity" | "year";
};
