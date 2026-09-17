export type MineBotQuery = {
  query: string;
};

export type MineBotSource = {
  id: string;
  title: string;
  module: string;
  sourceName?: string;
  sourceUrl?: string;
  year?: number;
  value?: number;
  unit?: string;
  recordType?: string;
};

export type MineBotContext = {
  sourceId: string;
  content: string;
  source: MineBotSource;
};

export type MineBotCitation = {
  id: string;
  title: string;
  sourceName?: string;
  sourceUrl?: string;
};

export type MineBotAnswer = {
  answer: string;
  citations: MineBotCitation[];
  fallback: boolean;
};

export type MineBotResponse = {
  success: true;
  data: MineBotAnswer;
  meta: {
    timestamp: string;
    requestId: string;
  };
};

export type MineBotErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
};

export const FALLBACK_INSUFFICIENT_CONTEXT =
  "Maaf, MineBot belum memiliki informasi MineVision yang cukup untuk menjawab pertanyaan tersebut.";

export const FALLBACK_SERVICE_UNAVAILABLE =
  "Maaf, layanan MineBot sedang tidak tersedia. Silakan coba kembali nanti.";
