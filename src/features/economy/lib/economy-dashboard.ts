import type { PublicSmelterFacility } from "@/features/intelligence/types/smelter";

import type { PublicGdpRecord } from "../types/gdp";
import {
  economySections,
  type EconomySection,
} from "../types/dashboard";

export function resolveEconomySection(value: string | null): EconomySection {
  return economySections.includes(value as EconomySection)
    ? (value as EconomySection)
    : "gdp";
}

export function getNextEconomySection(
  section: EconomySection,
  direction: "next" | "previous",
): EconomySection {
  const currentIndex = economySections.indexOf(section);
  const offset = direction === "next" ? 1 : -1;
  const nextIndex =
    (currentIndex + offset + economySections.length) % economySections.length;
  return economySections[nextIndex] ?? "gdp";
}

export function getGdpTrend(records: PublicGdpRecord[]): PublicGdpRecord[] {
  return [...records].sort((left, right) => left.year - right.year);
}

export function resolveGdpYear(
  selectedYear: number | null,
  records: PublicGdpRecord[],
): number | null {
  const years = getGdpTrend(records).map((record) => record.year);
  if (years.length === 0) return null;
  if (selectedYear !== null && years.includes(selectedYear)) return selectedYear;
  return years.at(-1) ?? null;
}

export function getPrimarySmelterOutputs(
  facilities: PublicSmelterFacility[],
) {
  return facilities.flatMap((facility) =>
    facility.outputs
      .filter((output) => output.isPrimary)
      .map((output) => ({ facility, output })),
  );
}

export function getSmelterCommoditySummary(
  facilities: PublicSmelterFacility[],
) {
  const summary = new Map<
    string,
    {
      slug: string;
      name: string;
      facilityCount: number;
      primaryCapacity: Array<{
        outputProduct: string;
        value: number;
        unitCode: string;
      }>;
    }
  >();

  for (const { output } of getPrimarySmelterOutputs(facilities)) {
    const current = summary.get(output.commodity.slug) ?? {
      slug: output.commodity.slug,
      name: output.commodity.name,
      facilityCount: 0,
      primaryCapacity: [],
    };
    current.facilityCount += 1;
    if (output.outputCapacity) {
      current.primaryCapacity.push({
        outputProduct: output.outputProduct,
        ...output.outputCapacity,
      });
    }
    summary.set(output.commodity.slug, current);
  }

  return [...summary.values()].sort(
    (left, right) =>
      right.facilityCount - left.facilityCount ||
      left.name.localeCompare(right.name, "id"),
  );
}

export function createGdpInsight(record: PublicGdpRecord | undefined): string {
  if (!record) return "Data PDB publik belum tersedia.";
  const contribution = record.contributionPercentage;
  const change = record.nominalYoyChangePercentage;
  if (contribution === null) {
    return `Nilai nominal PDB Pertambangan dan Penggalian tahun ${record.year} tersedia, tetapi kontribusinya belum dapat dihitung.`;
  }
  if (change === null) {
    return `Kontribusi Pertambangan dan Penggalian terhadap PDB nasional tahun ${record.year} tercatat ${contribution.toLocaleString("id-ID", { maximumFractionDigits: 2 })}%. Perubahan nominal tahunan belum dapat dihitung.`;
  }
  const direction = change > 0 ? "meningkat" : change < 0 ? "menurun" : "tidak berubah";
  return `Pada ${record.year}, kontribusi sektor tercatat ${contribution.toLocaleString("id-ID", { maximumFractionDigits: 2 })}%. Nilai nominal PDB Pertambangan ADHB ${direction} ${Math.abs(change).toLocaleString("id-ID", { maximumFractionDigits: 2 })}% dibanding observasi publik sebelumnya.`;
}
