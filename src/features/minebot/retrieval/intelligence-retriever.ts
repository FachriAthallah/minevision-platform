import "server-only";

import { getPublicProduction } from "@/features/intelligence/server/get-public-production";
import { getPublicDomesticPrices } from "@/features/intelligence/server/get-public-domestic-prices";
import { isPubliclyVisible } from "@/features/shared/policies/publication-visibility";

import type { MineBotContext, MineBotSource } from "../types/minebot";
import type { MineBotRetriever } from "./types";

const COMMODITY_KEYWORDS: Record<string, string> = {
  batubara: "batubara",
  nikel: "nikel",
  emas: "emas",
  tembaga: "tembaga",
  timah: "timah",
  "bijih besi": "bijih-besi",
  bauksit: "bauksit",
};

const TOPIC_KEYWORDS = {
  production: ["produksi", "produsen", "output", "hasil"],
  price: ["harga", "hba", "hma", "nilai jual"],
  trend: ["tren", "trend", "perkembangan"],
};

function detectCommodity(query: string): string | null {
  const normalizedQuery = query.toLowerCase();

  for (const [keyword, slug] of Object.entries(COMMODITY_KEYWORDS)) {
    if (normalizedQuery.includes(keyword)) {
      return slug;
    }
  }

  return null;
}

function detectTopic(query: string): "production" | "price" | "trend" | null {
  const normalizedQuery = query.toLowerCase();

  for (const keyword of TOPIC_KEYWORDS.production) {
    if (normalizedQuery.includes(keyword)) return "production";
  }

  for (const keyword of TOPIC_KEYWORDS.price) {
    if (normalizedQuery.includes(keyword)) return "price";
  }

  for (const keyword of TOPIC_KEYWORDS.trend) {
    if (normalizedQuery.includes(keyword)) return "trend";
  }

  return null;
}

function extractYear(query: string): number | null {
  const yearMatch = query.match(/\b(20\d{2}|19\d{2})\b/);
  return yearMatch ? parseInt(yearMatch[1], 10) : null;
}

export class IntelligenceRetriever implements MineBotRetriever {
  async retrieve(query: string): Promise<MineBotContext[]> {
    const commodity = detectCommodity(query);
    const topic = detectTopic(query);
    const year = extractYear(query);

    if (!commodity) {
      return [];
    }

    const contexts: MineBotContext[] = [];
    let sourceIndex = 1;

    if (topic === "production" || topic === "trend" || topic === null) {
      const productionData = await getPublicProduction({
        commodity,
        fromYear: year ? year - 2 : undefined,
        toYear: year || undefined,
      });

      const publicProductionData = productionData.filter(() => {
        const visibilityRecord = {
          verificationStatus: "verified" as const,
          publicationStatus: "published" as const,
        };
        return isPubliclyVisible(visibilityRecord);
      });

      for (const record of publicProductionData.slice(0, 5)) {
        const primarySource = record.sources.find((s) => s.isPrimary);
        const sourceId = `source-${sourceIndex}`;

        const source: MineBotSource = {
          id: sourceId,
          title: `Produksi ${record.commodity.name} ${record.year}`,
          module: "intelligence",
          sourceName: primarySource?.source.name,
          sourceUrl: primarySource?.url ?? undefined,
          year: record.year,
          value: record.value,
          unit: record.unit.name,
          recordType: record.recordType,
        };

        const content = [
          `Data Produksi ${record.commodity.name}`,
          `Tahun: ${record.year}`,
          `Nilai: ${record.value.toLocaleString("id-ID")} ${record.unit.name}`,
          `Status: ${record.recordType}`,
          primarySource ? `Sumber: ${primarySource.source.name}` : null,
        ]
          .filter(Boolean)
          .join("\n");

        contexts.push({ sourceId, content, source });
        sourceIndex++;
      }
    }

    if (topic === "price" || topic === null) {
      const priceData = await getPublicDomesticPrices({
        commodity,
      });

      const publicPriceData = priceData.filter(() => {
        const visibilityRecord = {
          verificationStatus: "verified" as const,
          publicationStatus: "published" as const,
        };
        return isPubliclyVisible(visibilityRecord);
      });

      for (const record of publicPriceData.slice(0, 3)) {
        const sourceId = `source-${sourceIndex}`;

        const source: MineBotSource = {
          id: sourceId,
          title: `Harga ${record.commodity.name} - ${record.standard.name}`,
          module: "intelligence",
          sourceName: record.source.name,
          sourceUrl: record.source.url ?? undefined,
          year: new Date(record.effectiveDate).getFullYear(),
          value: record.value,
          unit: `${record.currencyCode}/${record.unit.name}`,
          recordType: record.recordType,
        };

        const content = [
          `Data Harga ${record.commodity.name}`,
          `Standar: ${record.standard.name}`,
          `Tanggal Efektif: ${record.effectiveDate}`,
          `Nilai: ${record.value.toLocaleString("id-ID")} ${record.currencyCode}/${record.unit.name}`,
          `Sumber: ${record.source.name}`,
        ].join("\n");

        contexts.push({ sourceId, content, source });
        sourceIndex++;
      }
    }

    return contexts;
  }
}

export async function retrieveIntelligenceContext(
  query: string
): Promise<MineBotContext[]> {
  const retriever = new IntelligenceRetriever();
  return retriever.retrieve(query);
}
