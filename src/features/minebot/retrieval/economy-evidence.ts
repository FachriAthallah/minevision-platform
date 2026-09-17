import "server-only";

import {
  formatEconomyCurrency,
  formatEconomyNumber,
  formatEconomyPercentage,
} from "@/features/economy/lib/economy-format";

import type { MineBotEconomyMetric } from "../types/orchestrator";
import type { Evidence } from "../types/orchestrator";

export type EconomyEvidenceQuery = {
  metric: MineBotEconomyMetric;
  years?: number[];
  commodity?: string;
};

const SCALE_LABEL: Record<string, string> = {
  unit: "unit",
  thousand: "ribu",
  million: "juta",
  billion: "miliar",
  trillion: "triliun",
};

export async function retrieveEconomyEvidence(
  query: EconomyEvidenceQuery
): Promise<Evidence[]> {
  const { metric, years } = query;
  const resolvedYears = uniqueYears(years);

  switch (metric) {
    case "national_gdp":
    case "mining_gdp":
    case "gdp_contribution":
    case "gdp_growth":
      return retrieveGdpEvidence(metric, resolvedYears);
    case "exports":
      return retrieveExportEvidence(query, resolvedYears);
    case "investment":
      return retrieveInvestmentEvidence(resolvedYears);
    default:
      return [];
  }
}

async function retrieveGdpEvidence(
  metric: MineBotEconomyMetric,
  years: number[]
): Promise<Evidence[]> {
  const { getPublicGdp } = await import(
    "@/features/economy/server/get-public-gdp"
  );
  let records: Awaited<ReturnType<typeof getPublicGdp>>;
  try {
    records = await getPublicGdp({
      priceBasis: "current_prices",
      ...yearRange(years),
    });
  } catch {
    return [];
  }

  const byYear = new Map<number, (typeof records)[number]>();
  for (const record of records) {
    if (!isIndonesiaRecord(record.region)) continue;
    if (!byYear.has(record.year)) byYear.set(record.year, record);
  }

  const effectiveYears =
    years.length > 0 ? years : [Math.max(0, ...byYear.keys())].filter((year) => year > 0);

  const results: Evidence[] = [];
  for (const year of effectiveYears) {
    const record = byYear.get(year);
    if (!record) continue;

    if (metric === "national_gdp" || metric === "mining_gdp") {
      const isMining = metric === "mining_gdp";
      const value = isMining
        ? record.miningQuarryingGdpValue
        : record.nationalGdpValue;
      const scope = isMining
        ? "PDB sektor Pertambangan dan Penggalian Indonesia"
        : "PDB nasional Indonesia";

      results.push(
        buildEconomyEvidence({
          evidenceId: `economy-gdp-${metric}-${record.year}`,
          entityType: isMining ? "economy_gdp_mining" : "economy_gdp_national",
          title: `${scope} ${record.year}`,
          facts: `${scope} tahun ${record.year} tercatat ${formatEconomyCurrency(
            value,
            record.currencyCode,
            record.valueScale,
          )} pada harga berlaku (nilai sumber ${formatEconomyNumber(
            value,
          )} ${scaleLabel(record.valueScale)} ${record.currencyCode}).`,
          value,
          unit: displayGdpUnit(record),
          period: { year: record.year },
          recordType: record.recordType,
          sourceIds: primarySourceIds(record.sources),
        }),
      );
    }

    if (metric === "gdp_contribution") {
      const contribution = record.contributionPercentage;
      if (contribution === null) continue;

      results.push(
        buildEconomyEvidence({
          evidenceId: `economy-gdp-contribution-${record.year}`,
          entityType: "economy_gdp_contribution",
          title: `Kontribusi Pertambangan terhadap PDB ${record.year}`,
          facts: `Kontribusi sektor Pertambangan dan Penggalian terhadap PDB nasional Indonesia tahun ${record.year} tercatat ${formatEconomyPercentage(
            contribution,
          )}.`,
          value: contribution,
          unit: "%",
          period: { year: record.year },
          recordType: record.recordType,
          sourceIds: primarySourceIds(record.sources),
        }),
      );
    }

    if (metric === "gdp_growth") {
      const change = record.nominalYoyChangePercentage;
      if (change === null) continue;

      results.push(
        buildEconomyEvidence({
          evidenceId: `economy-gdp-growth-${record.year}`,
          entityType: "economy_gdp_growth",
          title: `Pertumbuhan nominal PDB Pertambangan ${record.year}`,
          facts: `Perubahan nominal PDB sektor Pertambangan dan Penggalian Indonesia tahun ${record.year} tercatat ${formatEconomyPercentage(
            change,
            true,
          )} dibanding observasi publik sebelumnya.`,
          value: change,
          unit: "%",
          period: { year: record.year },
          recordType: record.recordType,
          sourceIds: primarySourceIds(record.sources),
        }),
      );
    }
  }

  return results;
}

async function retrieveExportEvidence(
  query: EconomyEvidenceQuery,
  years: number[]
): Promise<Evidence[]> {
  const { getPublicExports } = await import(
    "@/features/economy/server/get-public-exports"
  );
  let records: Awaited<ReturnType<typeof getPublicExports>>;
  try {
    records = await getPublicExports({
      ...yearRange(years),
      ...(query.commodity ? { commodity: query.commodity } : {}),
    });
  } catch {
    return [];
  }

  const availableYears = records.map((record) => record.year);
  const effectiveYears =
    years.length > 0
      ? years
      : [Math.max(0, ...availableYears)].filter((year) => year > 0);
  const requested = new Set(effectiveYears);
  const usable = records.filter(
    (record) =>
      requested.has(record.year) &&
      record.fob !== null &&
      record.availability !== "not_reported" &&
      record.availability !== "reported_zero",
  );

  const results = usable.flatMap((record) => {
    const fob = record.fob;
    if (!fob) return [];

    const destination = record.destination?.name ?? "seluruh negara tujuan";
    return [
      buildEconomyEvidence({
        evidenceId: `economy-export-${record.id}`,
        entityType: "economy_export",
        title: `Ekspor ${record.commodity.name} ${record.year}`,
        facts: `Nilai ekspor ${record.commodity.name} dari Indonesia ke ${destination} tahun ${record.year} tercatat ${formatEconomyCurrency(
          fob.value,
          fob.currencyCode,
          fob.scale ?? "unit",
        )} (nilai FOB).`,
        value: fob.value,
        unit: `${fob.currencyCode} (${scaleLabel(fob.scale ?? "unit")})`,
        period: { year: record.year },
        recordType: record.recordType,
        sourceIds: primarySourceIds(record.sources),
      }),
    ];
  });

  return results.slice(0, 10);
}

async function retrieveInvestmentEvidence(years: number[]): Promise<Evidence[]> {
  const { getPublicInvestment } = await import(
    "@/features/economy/server/get-public-investment"
  );
  let records: Awaited<ReturnType<typeof getPublicInvestment>>;
  try {
    records = await getPublicInvestment({ ...yearRange(years) });
  } catch {
    return [];
  }
  const availableYears = records.map((record) => record.year);
  const effectiveYears =
    years.length > 0
      ? years
      : [Math.max(0, ...availableYears)].filter((year) => year > 0);
  const requested = new Set(effectiveYears);
  const yearRecordsByYear = new Map<number, (typeof records)[number][]>();
  for (const record of records) {
    if (!requested.has(record.year)) continue;
    const bucket = yearRecordsByYear.get(record.year) ?? [];
    bucket.push(record);
    yearRecordsByYear.set(record.year, bucket);
  }

  const results: Evidence[] = [];

  for (const year of effectiveYears) {
    const yearRecords = yearRecordsByYear.get(year) ?? [];
    if (yearRecords.length === 0) continue;

    for (const record of yearRecords) {
      if (record.annualMetrics.totalInvestmentValue !== null) {
        results.push(
          buildEconomyEvidence({
            evidenceId: `economy-investment-total-${record.year}`,
            entityType: "economy_investment",
            title: `Investasi Pertambangan Indonesia ${record.year}`,
            facts: `Total investasi sektor Pertambangan Indonesia tahun ${record.year} tercatat ${formatEconomyCurrency(
              record.annualMetrics.totalInvestmentValue,
              record.currency.code,
              record.currency.scale,
            )} (sumber resmi PMA dan PMDN).`,
            value: record.annualMetrics.totalInvestmentValue,
            unit: `${record.currency.code} (${scaleLabel(record.currency.scale)})`,
            period: { year: record.year },
            recordType: record.recordType,
            sourceIds: primarySourceIds(record.sources),
          }),
        );
        break;
      }
    }

    for (const record of yearRecords) {
      const originLabel =
        record.origin === "pma" ? "Penanaman Modal Asing (PMA)" : "Penanaman Modal Dalam Negeri (PMDN)";
      results.push(
        buildEconomyEvidence({
          evidenceId: `economy-investment-${record.origin}-${record.year}`,
          entityType: "economy_investment",
          title: `${originLabel} ${record.year}`,
          facts: `${originLabel} di sektor Pertambangan Indonesia tahun ${record.year} tercatat ${formatEconomyCurrency(
            record.investmentValue,
            record.currency.code,
            record.currency.scale,
          )}${record.projectCount !== null ? `, dengan ${record.projectCount} proyek` : ""}.`,
          value: record.investmentValue,
          unit: `${record.currency.code} (${scaleLabel(record.currency.scale)})`,
          period: { year: record.year },
          recordType: record.recordType,
          sourceIds: primarySourceIds(record.sources),
        }),
      );
    }
  }

  return results;
}

function buildEconomyEvidence({
  evidenceId,
  entityType,
  title,
  facts,
  value,
  unit,
  period,
  recordType,
  sourceIds,
}: {
  evidenceId: string;
  entityType: string;
  title: string;
  facts: string;
  value: number;
  unit: string;
  period: { year: number };
  recordType: string;
  sourceIds: string[];
}): Evidence {
  return {
    evidenceId,
    kind: "structured",
    module: "economy",
    entityType,
    title,
    facts,
    value,
    unit,
    period,
    recordType: (recordType as Evidence["recordType"]) ?? "actual",
    verificationStatus: "verified",
    publicationStatus: "published",
    sourceIds,
    canonicalUrl: "/economy",
    limitations: [],
  };
}

function primarySourceIds(
  sources: Array<{ isPrimary: boolean; source: { slug: string } }>
): string[] {
  const ids = sources
    .filter((source) => source.isPrimary)
    .map((source) => source.source.slug);
  return ids.length > 0 ? ids : sources.map((source) => source.source.slug);
}

function isIndonesiaRecord(region: { code: string; name: string }): boolean {
  const name = region.name.toLocaleLowerCase("id-ID");
  const code = region.code.toLocaleUpperCase("id-ID");
  return name.includes("indonesia") || code === "ID";
}

function scaleLabel(scale: string): string {
  return SCALE_LABEL[scale.toLocaleLowerCase("id-ID")] ?? scale;
}

function displayGdpUnit(record: {
  currencyCode: string;
  valueScale: string;
}): string {
  return `${record.currencyCode} (${scaleLabel(record.valueScale)})`;
}

function yearRange(
  years: number[]
): { fromYear?: number; toYear?: number } {
  if (years.length === 0) return {};
  return {
    fromYear: Math.min(...years),
    toYear: Math.max(...years),
  };
}

function uniqueYears(years?: number[]): number[] {
  return Array.from(new Set(years ?? []));
}