import type {
  PublicCommodityCategory,
  PublicCommodityDetail,
  PublicCommoditySourceReference,
  PublicCommoditySummary,
  PublicCommodityUnit,
} from "../types/commodity";

export const commodityCategoryLabels: Record<PublicCommodityCategory, string> = {
  metal_mineral: "Mineral Logam",
  non_metal_mineral: "Mineral Non-Logam",
  energy: "Energi",
};

export type CommodityCatalogCategory = "all" | PublicCommodityCategory;

export type CommodityCatalogFilters = {
  search: string;
  category: CommodityCatalogCategory;
};

export type CommodityMarkdownBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] };

export type CommodityContentSection = {
  title: string;
  blocks: CommodityMarkdownBlock[];
};

const sectionIdByTitle: Record<string, string> = {
  definisi: "overview",
  karakteristik: "characteristics",
  "jenis-jenis": "types",
  "metode penambangan": "mining-methods",
  kegunaan: "uses",
  "dampak lingkungan": "environment",
};

function firstSearchParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export function parseCommodityCatalogFilters(input: {
  search?: string | string[];
  category?: string | string[];
}): CommodityCatalogFilters {
  const search = firstSearchParam(input.search).trim().slice(0, 100);
  const categoryValue = firstSearchParam(input.category);
  const category: CommodityCatalogCategory =
    categoryValue === "metal_mineral" ||
    categoryValue === "non_metal_mineral" ||
    categoryValue === "energy"
      ? categoryValue
      : "all";

  return { search, category };
}

export function filterCommodityCatalog(
  commodities: PublicCommoditySummary[],
  filters: CommodityCatalogFilters,
): PublicCommoditySummary[] {
  const query = filters.search.toLocaleLowerCase("id-ID");

  return commodities.filter((commodity) => {
    if (filters.category !== "all" && commodity.category !== filters.category) {
      return false;
    }

    if (!query) {
      return true;
    }

    return [
      commodity.name,
      commodity.symbol,
      commodity.description,
      commodity.specification,
      commodity.profile.title,
      commodity.profile.excerpt,
    ].some((value) => value?.toLocaleLowerCase("id-ID").includes(query));
  });
}

export function getCommodityHref(slug: string): string {
  return `/commodity/${slug}`;
}

export function shouldShowCommodityIntelligence(
  commodity: Pick<PublicCommoditySummary, "isIntelligenceTracked">,
): boolean {
  return commodity.isIntelligenceTracked;
}

export function getCommodityImage(
  commodity: Pick<PublicCommoditySummary, "name" | "image">,
) {
  if (!commodity.image) {
    return null;
  }

  return {
    src: commodity.image.url,
    alt: commodity.image.alt?.trim() || `Gambar komoditas ${commodity.name}`,
  };
}

export function getAdjacentCommodities(
  commodities: PublicCommoditySummary[],
  currentSlug: string,
) {
  const ordered = [...commodities].sort(
    (left, right) =>
      left.displayOrder - right.displayOrder ||
      left.name.localeCompare(right.name, "id-ID"),
  );
  const index = ordered.findIndex((commodity) => commodity.slug === currentSlug);

  return {
    previous: index > 0 ? ordered[index - 1] : null,
    next: index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null,
  };
}

export function parseCommoditySpecification(specification: string | null) {
  if (!specification) {
    return [];
  }

  return specification
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const separatorIndex = item.indexOf(":");

      if (separatorIndex === -1) {
        return { label: "Keterangan", value: item };
      }

      return {
        label: item.slice(0, separatorIndex).trim(),
        value: item.slice(separatorIndex + 1).trim(),
      };
    })
    .filter((item) => item.value.length > 0);
}

function cleanTableCell(value: string) {
  return value.trim().replace(/^\||\|$/g, "").trim();
}

function parseTableRow(line: string) {
  return cleanTableCell(line)
    .split("|")
    .map((cell) => cell.trim());
}

function isTableSeparator(line: string) {
  return /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/.test(line);
}

function parseSectionBlocks(lines: string[]): CommodityMarkdownBlock[] {
  const blocks: CommodityMarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index]?.trim() ?? "";

    if (!line) {
      index += 1;
      continue;
    }

    if (
      line.includes("|") &&
      index + 1 < lines.length &&
      isTableSeparator(lines[index + 1] ?? "")
    ) {
      const headers = parseTableRow(line);
      const rows: string[][] = [];
      index += 2;

      while (index < lines.length && (lines[index] ?? "").includes("|")) {
        rows.push(parseTableRow(lines[index] ?? ""));
        index += 1;
      }

      blocks.push({ type: "table", headers, rows });
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];

      while (index < lines.length) {
        const candidate = (lines[index] ?? "").trim();
        const match = candidate.match(/^[-*]\s+(.+)$/);

        if (!match) {
          break;
        }

        items.push(match[1]);
        index += 1;
      }

      blocks.push({ type: "list", items });
      continue;
    }

    const paragraphLines = [line];
    index += 1;

    while (index < lines.length) {
      const candidate = (lines[index] ?? "").trim();

      if (!candidate || candidate.startsWith("## ") || candidate.includes("|")) {
        break;
      }

      paragraphLines.push(candidate);
      index += 1;
    }

    blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
  }

  return blocks;
}

export function parseCommodityBody(body: string): CommodityContentSection[] {
  const sections: CommodityContentSection[] = [];
  let currentTitle: string | null = null;
  let currentLines: string[] = [];

  const flush = () => {
    if (currentTitle) {
      sections.push({
        title: currentTitle,
        blocks: parseSectionBlocks(currentLines),
      });
    }

    currentLines = [];
  };

  for (const rawLine of body.split(/\r?\n/)) {
    if (rawLine.startsWith("## ")) {
      flush();
      currentTitle = rawLine.slice(3).trim();
      continue;
    }

    if (rawLine.startsWith("# ")) {
      continue;
    }

    if (currentTitle) {
      currentLines.push(rawLine);
    }
  }

  flush();
  return sections;
}

export function getCommoditySectionId(title: string): string {
  return (
    sectionIdByTitle[title.toLocaleLowerCase("id-ID")] ??
    title
      .toLocaleLowerCase("id-ID")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
}

export function formatCommodityNumber(value: string): string {
  const [integerPart, decimalPart] = value.split(".");
  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, "");
  const grouped = normalizedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const normalizedDecimal = decimalPart?.replace(/0+$/, "");

  return normalizedDecimal ? `${grouped},${normalizedDecimal}` : grouped;
}

export function formatResourceStatisticValue(
  value: string | null,
  unit: PublicCommodityUnit | null,
): string {
  if (value === null) {
    return "—";
  }

  if (unit?.code === "metric_ton") {
    const integerDigits = value
      .split(".")[0]
      .replace(/^0+(?=\d)/, "").length;

    if (integerDigits >= 7 && integerDigits <= 13) {
      const millionTonnes = (Number(value) / 1_000_000).toFixed(2);
      return `${formatCommodityNumber(millionTonnes)} juta ton`;
    }

    return `${formatCommodityNumber(value)} ton`;
  }

  const unitLabel = unit?.symbol || unit?.name;
  return unitLabel
    ? `${formatCommodityNumber(value)} ${unitLabel}`
    : formatCommodityNumber(value);
}

export function formatResourceMaterialLabel(
  materialBasis: string | null,
  commodityName: string,
): string | null {
  if (materialBasis === "ore") {
    return `Bijih komoditas (${commodityName})`;
  }

  if (materialBasis === "contained_metal") {
    return `Logam komoditas (${commodityName})`;
  }

  if (materialBasis === "alumina") {
    return `Alumina komoditas (${commodityName})`;
  }

  if (materialBasis === "raw_material") {
    return `Bahan baku komoditas (${commodityName})`;
  }

  if (materialBasis === "energy_capacity") {
    return "Kapasitas energi";
  }

  return null;
}

export function formatStatisticType(value: string): string {
  const labels: Record<string, string> = {
    reserve: "Cadangan",
    resource: "Sumber Daya",
    installed_capacity: "Kapasitas Terpasang",
    working_area_count: "Jumlah Wilayah Kerja",
  };

  return labels[value] ?? value.replaceAll("_", " ");
}

export function formatMaterialBasis(value: string | null): string | null {
  if (!value) return null;

  const labels: Record<string, string> = {
    ore: "Bijih",
    contained_metal: "Kandungan logam",
    alumina: "Alumina",
    raw_material: "Bahan baku",
    energy_capacity: "Kapasitas energi",
  };

  return labels[value] ?? value.replaceAll("_", " ");
}

export function formatAvailability(value: string): string {
  const labels: Record<string, string> = {
    reported: "Dilaporkan",
    not_reported: "Tidak dilaporkan",
    not_applicable: "Tidak berlaku",
    source_unavailable: "Sumber pemeringkatan belum tersedia",
  };

  return labels[value] ?? value.replaceAll("_", " ");
}

export function formatGlobalMetric(value: string): string {
  return value === "installed_capacity"
    ? "Kapasitas terpasang dunia"
    : "Produksi tambang dunia";
}

export function collectCommoditySources(
  commodity: PublicCommodityDetail,
): PublicCommoditySourceReference[] {
  const sources = [
    ...commodity.profile.sources,
    ...commodity.resourceStatistics.flatMap((statistic) => [
      statistic.primarySource,
      ...statistic.supportingSources,
    ]),
    ...commodity.productionLocations.map((location) => location.source),
    ...commodity.globalStatisticSets.flatMap((set) => [
      ...(set.primarySource ? [set.primarySource] : []),
      ...set.supportingSources,
    ]),
    ...commodity.producers.map((producer) => producer.source),
  ];
  const uniqueSources = new Map<string, PublicCommoditySourceReference>();

  for (const source of sources) {
    const key = [
      source.slug,
      source.citationLabel ?? "",
      source.pageReference ?? "",
      source.sourceUrl ?? source.url ?? "",
    ].join(":");

    if (!uniqueSources.has(key)) {
      uniqueSources.set(key, source);
    }
  }

  return [...uniqueSources.values()];
}
