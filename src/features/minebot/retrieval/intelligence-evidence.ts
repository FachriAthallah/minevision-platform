import "server-only";

import { getPublicDomesticPrices } from "@/features/intelligence/server/get-public-domestic-prices";
import { getPublicProduction } from "@/features/intelligence/server/get-public-production";

import { formatMineBotPrice, formatMineBotQuantity } from "../lib/formatter";
import type { Evidence } from "../types/orchestrator";

export type IntelligenceEvidenceQuery = {
  commodity?: string;
  year?: number;
  topic?: "production" | "price" | null;
};

export async function retrieveProductionEvidence(
  query: IntelligenceEvidenceQuery
): Promise<Evidence[]> {
  const { commodity, year } = query;
  if (!commodity) return [];

  try {
    const rows = await getPublicProduction({
      commodity,
      fromYear: year !== undefined ? Math.max(year - 1, 1900) : undefined,
      toYear: year ?? undefined,
    });

    return rows.slice(0, 8).map((row) => ({
      evidenceId: `production-${row.commodity.slug}-${row.year}`,
      kind: "structured" as const,
      module: "intelligence",
      entityType: "commodity_production",
      title: `Produksi ${row.commodity.name} ${row.year}`,
      facts: `Produksi ${row.commodity.name} Indonesia tahun ${row.year} tercatat sebesar ${formatMineBotQuantity(row.value, row.unit.symbol)}.`,
      value: row.value,
      period: { year: row.year },
      unit: formatDisplayUnit(row.unit.symbol),
      recordType: row.recordType,
      verificationStatus: "verified" as const,
      publicationStatus: "published" as const,
      sourceIds: row.sources
        .filter((source) => source.isPrimary)
        .map((source) => source.source.slug),
      canonicalUrl: `/intelligence?commodity=${row.commodity.slug}`,
      limitations: [],
    }));
  } catch {
    return [];
  }
}

export async function retrievePriceEvidence(
  query: IntelligenceEvidenceQuery
): Promise<Evidence[]> {
  const { commodity } = query;
  if (!commodity) return [];

  try {
    const rows = await getPublicDomesticPrices({ commodity });

    return rows.slice(0, 8).map((row) => ({
      evidenceId: `price-${row.commodity.slug}-${row.standard.code}`,
      kind: "structured" as const,
      module: "intelligence",
      entityType: "commodity_domestic_price",
      title: `Harga ${row.commodity.name} (${row.standard.name})`,
      facts: `Harga ${row.commodity.name} berdasarkan ${row.standard.name} periode ${row.effectiveDate} adalah ${formatMineBotPrice(row.value, row.currencyCode, row.unit.symbol)}.`,
      period: { startDate: row.effectiveDate.toString() },
      unit: formatDisplayUnit(row.unit.symbol),
      recordType: row.recordType,
      verificationStatus: "verified" as const,
      publicationStatus: "published" as const,
      sourceIds: row.source.slug ? [row.source.slug] : [],
      canonicalUrl: `/intelligence?commodity=${row.commodity.slug}`,
      limitations: [],
    }));
  } catch {
    return [];
  }
}

function formatDisplayUnit(unit: string): string {
  const normalized = unit.trim().toLocaleLowerCase("id-ID");
  if (["t", "ton", "tons", "metric ton"].includes(normalized)) return "ton";
  return unit.trim();
}