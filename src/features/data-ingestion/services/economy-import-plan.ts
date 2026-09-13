import { createHash } from "node:crypto";

import type { EconomyDataset } from "./validate-economy-import";

export const ECONOMY_TABLES = [
  "sources",
  "regions",
  "commodities",
  "measurement_units",
  "economic_gdp_annual",
  "economic_gdp_sources",
  "mining_investment_annual",
  "minerba_exports_annual",
  "smelter_facilities",
  "smelter_facility_sources",
] as const;

export type EconomyTable = (typeof ECONOMY_TABLES)[number];
export type EconomyRow = Record<string, unknown>;
export type EconomySnapshot = Record<EconomyTable, EconomyRow[]>;

export type EconomyInsert = {
  table: "sources" | "economic_gdp_sources" | "mining_investment_annual" | "minerba_exports_annual";
  row: EconomyRow;
};

export type EconomyCorrection = {
  facilityId: string;
  facilityCode: string;
  expectedSourceId: string | null;
  expectedSourceSlug: string | null;
  canonicalSourceId: string;
  canonicalSourceSlug: string;
};

export type EconomyPlan = {
  inserts: EconomyInsert[];
  corrections: EconomyCorrection[];
  unchanged: number;
  hold: { investment: number; exports: number; smelters: number };
  issues: string[];
};

export const emptyEconomySnapshot = (): EconomySnapshot => ({
  sources: [],
  regions: [],
  commodities: [],
  measurement_units: [],
  economic_gdp_annual: [],
  economic_gdp_sources: [],
  mining_investment_annual: [],
  minerba_exports_annual: [],
  smelter_facilities: [],
  smelter_facility_sources: [],
});

export function stableEconomyValue(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableEconomyValue).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableEconomyValue(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function stableId(key: string) {
  const hex = createHash("sha256")
    .update(`minevision:economy:v1:${key}`)
    .digest("hex")
    .slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const normalizeNumeric = (value: unknown) =>
  String(value).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");

function same(column: string, left: unknown, right: unknown) {
  if (left === null || right === null) return left === right;
  if (["national_gdp_value", "mining_quarrying_gdp_value", "investment_value", "export_volume", "fob_value"].includes(column)) {
    return normalizeNumeric(left) === normalizeNumeric(right);
  }
  return stableEconomyValue(left) === stableEconomyValue(right);
}

function differences(existing: EconomyRow, expected: EconomyRow, ignored: string[] = []) {
  return Object.keys(expected).filter(
    (column) => column !== "id" && !ignored.includes(column) && !same(column, existing[column], expected[column]),
  );
}

export function economyPublishedFingerprint(snapshot: EconomySnapshot) {
  const protectedRows = [
    ...snapshot.economic_gdp_annual,
    ...snapshot.mining_investment_annual,
    ...snapshot.minerba_exports_annual,
    ...snapshot.smelter_facilities,
  ]
    .filter((row) => row.publication_status === "published")
    .map((row) => Object.fromEntries(Object.entries(row).filter(([column]) => !["source_id", "updated_at"].includes(column))))
    .sort((left, right) => String(left.id).localeCompare(String(right.id)));
  return createHash("sha256").update(stableEconomyValue(protectedRows)).digest("hex");
}

export function planEconomyImport(dataset: EconomyDataset, snapshot: EconomySnapshot): EconomyPlan {
  const state = structuredClone(snapshot);
  const plan: EconomyPlan = {
    inserts: [],
    corrections: [],
    unchanged: 0,
    hold: {
      investment: dataset.files.investment.records.length,
      exports: dataset.files.exports.records.length,
      smelters: dataset.files.smelters.records.filter((row) => row.holdReason !== null).length,
    },
    issues: [],
  };

  const findOne = (table: EconomyTable, columns: string[], row: EconomyRow) => {
    const matches = state[table].filter((candidate) => columns.every((column) => same(column, candidate[column], row[column])));
    if (matches.length > 1) plan.issues.push(`${table}: natural key duplikat (${columns.map((column) => row[column]).join(":")})`);
    return matches[0];
  };
  const reference = (table: EconomyTable, column: string, value: string) => {
    const row = snapshot[table].find((candidate) => candidate[column] === value && candidate.is_active !== false);
    if (!row) plan.issues.push(`${table}: referensi aktif tidak tersedia (${value})`);
    return row;
  };
  const sourceIds = new Map<string, string>();
  for (const source of dataset.manifest.sourceCatalog) {
    const expected = {
      id: stableId(`source:${source.slug}`),
      slug: source.slug,
      name: source.name,
      type: source.type,
      organization: source.organization,
      url: source.url,
      description: source.description,
      is_official: true,
      verification_status: "verified",
      is_active: true,
    };
    const existing = findOne("sources", ["slug"], expected);
    if (existing) {
      if (existing.is_active === false || existing.verification_status !== "verified") {
        plan.issues.push(`sources/${source.slug}: source existing tidak aktif atau belum verified; tidak ditimpa`);
      } else {
        plan.unchanged++;
      }
      sourceIds.set(source.slug, String(existing.id));
    } else {
      plan.inserts.push({ table: "sources", row: expected });
      state.sources.push(expected);
      sourceIds.set(source.slug, String(expected.id));
    }
  }

  const indonesia = reference("regions", "slug", "indonesia");
  const metricTon = reference("measurement_units", "code", "metric_ton");
  void metricTon;

  for (const record of dataset.files.gdp.records) {
    const region = record.regionSlug === "indonesia" ? indonesia : reference("regions", "slug", record.regionSlug);
    if (!region) continue;
    const expected = {
      region_id: region.id,
      year: record.year,
      price_basis: record.priceBasis,
      record_type: record.recordType,
      national_gdp_value: record.nationalGdpValue,
      mining_quarrying_gdp_value: record.miningQuarryingGdpValue,
      currency_code: record.currencyCode,
      value_scale: record.valueScale,
      data_status: record.dataStatus,
      verification_status: record.verificationStatus,
      publication_status: record.publicationStatus,
    };
    const existing = findOne("economic_gdp_annual", ["region_id", "year", "price_basis", "record_type"], expected);
    if (!existing) {
      plan.issues.push(`gdp/${record.year}: baseline published tidak ditemukan; importer tidak membuat published record baru`);
      continue;
    }
    const changed = differences(existing, expected);
    if (changed.length) plan.issues.push(`gdp/${record.year}: published record berbeda pada ${changed.join(", ")}; koreksi eksplisit diperlukan`);
    else plan.unchanged++;
    for (const [index, sourceSlug] of record.sourceSlugs.entries()) {
      const sourceId = sourceIds.get(sourceSlug);
      if (!sourceId) continue;
      const gdpDescriptor = dataset.manifest.datasets.find((entry) => entry.dataset === "gdp");
      const relation = {
        id: stableId(`gdp-source:${existing.id}:${sourceId}`),
        economic_gdp_id: existing.id,
        source_id: sourceId,
        citation_label: index === 0
          ? "BPS - Produk Domestik Bruto ADHB Menurut Lapangan Usaha"
          : "Sumber pendukung",
        source_url: gdpDescriptor?.officialSourceUrl ?? null,
        page_reference: null,
        notes: record.notes,
        is_primary: index === 0,
      };
      // Source identity and role are the semantic key. Preserve the richer URL and
      // citation metadata already attached to the verified database relation.
      if (findOne("economic_gdp_sources", ["economic_gdp_id", "source_id"], relation)) plan.unchanged++;
      else plan.inserts.push({ table: "economic_gdp_sources", row: relation });
    }
  }

  for (const record of dataset.files.investment.records) {
    const region = record.regionSlug === "indonesia" ? indonesia : reference("regions", "slug", record.regionSlug);
    const sourceId = sourceIds.get(record.sourceSlugs[0]);
    if (!region || !sourceId) continue;
    const expected = {
      id: stableId(`investment:${record.regionSlug}:${record.year}:${record.investmentOrigin}:${record.recordType}`),
      region_id: region.id,
      year: record.year,
      sector_code: record.sectorCode,
      sector_name: record.sectorName,
      investment_origin: record.investmentOrigin,
      investment_value: record.investmentValue,
      currency_code: record.currencyCode,
      value_scale: record.valueScale,
      project_count: record.projectCount,
      data_status: record.dataStatus,
      record_type: record.recordType,
      source_id: sourceId,
      source_published_at: record.sourcePublishedAt,
      verification_status: "pending",
      publication_status: "draft",
      notes: `${record.holdReason}\n${record.notes}`,
      metadata: { holdReason: record.holdReason, sourceSlugs: record.sourceSlugs },
    };
    const existing = findOne("mining_investment_annual", ["region_id", "year", "sector_code", "investment_origin", "record_type"], expected);
    if (!existing) {
      plan.inserts.push({ table: "mining_investment_annual", row: expected });
      continue;
    }
    const changed = differences(existing, expected, ["id", "notes", "metadata"]);
    if (changed.length) plan.issues.push(`investment/${record.year}/${record.investmentOrigin}: existing record berbeda pada ${changed.join(", ")}; tidak ditimpa`);
    else plan.unchanged++;
  }

  for (const record of dataset.files.exports.records) {
    const commodity = reference("commodities", "slug", record.commoditySlug);
    const origin = record.originRegionSlug === "indonesia" ? indonesia : reference("regions", "slug", record.originRegionSlug);
    const destination = record.destinationRegionSlug ? reference("regions", "slug", record.destinationRegionSlug) : undefined;
    const sourceId = sourceIds.get(record.sourceSlugs[0]);
    if (!commodity || !origin || !sourceId || (record.destinationRegionSlug && !destination)) continue;
    const expected = {
      id: stableId(`export:${record.year}:${record.commoditySlug}:${record.hsCode ?? "hold"}:${record.productForm ?? "hold"}:${record.destinationCountryCode ?? "none"}:${record.recordType}`),
      commodity_id: commodity.id,
      origin_region_id: origin.id,
      destination_region_id: destination?.id ?? null,
      year: record.year,
      source_commodity_label: record.sourceCommodityLabel,
      hs_code: record.hsCode,
      product_form: record.productForm,
      coverage_type: record.coverageType,
      export_volume: record.netWeightValue,
      volume_unit_code: record.netWeightUnitCode,
      volume_scale: record.netWeightScale,
      fob_value: record.fobValue,
      currency_code: record.currencyCode,
      fob_value_scale: record.fobValueScale,
      data_availability: record.availability,
      data_status: record.dataStatus,
      record_type: record.recordType,
      source_id: sourceId,
      source_published_at:
        dataset.files.exports.expectedExistingSourcePublishedAtByYear[
          String(record.year) as keyof typeof dataset.files.exports.expectedExistingSourcePublishedAtByYear
        ],
      verification_status: "pending",
      publication_status: "draft",
      notes: [record.holdReason, record.methodologyNotes].filter(Boolean).join("\n"),
      metadata: { holdReason: record.holdReason, destinationCountryCode: record.destinationCountryCode },
    };
    const key = ["commodity_id", "origin_region_id", "destination_region_id", "year", "hs_code", "product_form", "record_type"];
    const existing = findOne("minerba_exports_annual", key, expected);
    if (!existing) {
      plan.inserts.push({ table: "minerba_exports_annual", row: expected });
      continue;
    }
    const changed = differences(existing, expected, ["id", "notes", "metadata", "product_form"]);
    if (changed.length) plan.issues.push(`exports/${record.year}/${record.commoditySlug}: existing record berbeda pada ${changed.join(", ")}; tidak ditimpa`);
    else plan.unchanged++;
  }

  for (const record of dataset.files.smelters.records) {
    const facility = snapshot.smelter_facilities.find((row) => row.facility_code === record.facilityCode);
    if (!facility) {
      plan.issues.push(`smelter/${record.facilityCode}: fasilitas existing tidak ditemukan; foundation ini tidak membuat fasilitas baru`);
      continue;
    }
    if (facility.verification_status !== record.expectedState.verificationStatus || facility.publication_status !== record.expectedState.publicationStatus) {
      plan.issues.push(`smelter/${record.facilityCode}: fingerprint status awal tidak cocok`);
      continue;
    }
    const expectedSourceId = record.expectedState.sourceSlug ? sourceIds.get(record.expectedState.sourceSlug) ?? null : null;
    const canonicalSourceId = record.canonicalSourceSlug ? sourceIds.get(record.canonicalSourceSlug) : undefined;
    const currentSourceId = facility.source_id ?? null;
    if (currentSourceId !== expectedSourceId && currentSourceId !== canonicalSourceId) {
      plan.issues.push(`smelter/${record.facilityCode}: fingerprint source awal tidak cocok`);
      continue;
    }
    if (record.canonicalSourceSlug === null) {
      plan.unchanged++;
      continue;
    }
    if (!canonicalSourceId) continue;
    if (facility.source_id === canonicalSourceId) plan.unchanged++;
    else plan.corrections.push({
      facilityId: String(facility.id),
      facilityCode: record.facilityCode,
      expectedSourceId,
      expectedSourceSlug: record.expectedState.sourceSlug,
      canonicalSourceId,
      canonicalSourceSlug: record.canonicalSourceSlug,
    });
  }

  plan.issues = [...new Set(plan.issues)];
  return plan;
}

export type EconomyApplyResult = { inserted: number; corrected: number; unchanged: number; hold: EconomyPlan["hold"] };
export interface EconomyTransaction {
  snapshot(): Promise<EconomySnapshot>;
  insert(rows: EconomyInsert[]): Promise<void>;
  correctFacilities(rows: EconomyCorrection[]): Promise<void>;
}
export interface EconomyAdapter {
  transaction(work: (transaction: EconomyTransaction) => Promise<EconomyApplyResult>): Promise<EconomyApplyResult>;
}

export async function applyEconomyImport(dataset: EconomyDataset, adapter: EconomyAdapter, commit: boolean) {
  if (!commit) throw new Error("Actual import memerlukan --commit; koneksi write belum dibuka");
  return adapter.transaction(async (transaction) => {
    const before = await transaction.snapshot();
    const plan = planEconomyImport(dataset, before);
    if (plan.issues.length) throw new Error("Preflight Economy mengandung konflik; transaksi dibatalkan");
    for (let index = 0; index < plan.inserts.length; index += 100) await transaction.insert(plan.inserts.slice(index, index + 100));
    await transaction.correctFacilities(plan.corrections);
    const after = await transaction.snapshot();
    const verification = planEconomyImport(dataset, after);
    if (verification.issues.length || verification.inserts.length || verification.corrections.length || economyPublishedFingerprint(before) !== economyPublishedFingerprint(after)) {
      throw new Error("Post-write verification Economy gagal; transaksi dibatalkan");
    }
    return { inserted: plan.inserts.length, corrected: plan.corrections.length, unchanged: plan.unchanged, hold: plan.hold };
  });
}

export type EconomyPromotionPlan = {
  investmentIds: string[];
  exportIds: string[];
  smelterIds: string[];
  issues: string[];
};

export function planEconomyPromotion(dataset: EconomyDataset, snapshot: EconomySnapshot): EconomyPromotionPlan {
  const plan: EconomyPromotionPlan = { investmentIds: [], exportIds: [], smelterIds: [], issues: [] };
  const eligibleSource = (sourceId: unknown) => snapshot.sources.some((source) => source.id === sourceId && source.is_active !== false && source.verification_status === "verified");
  const inInvestmentManifest = new Set(dataset.files.investment.records.map((row) => `${row.regionSlug}:${row.year}:${row.investmentOrigin}:${row.recordType}`));
  const indonesia = snapshot.regions.find((row) => row.slug === "indonesia");
  for (const row of snapshot.mining_investment_annual) {
    const key = `indonesia:${row.year}:${row.investment_origin}:${row.record_type}`;
    if (!inInvestmentManifest.has(key) || row.region_id !== indonesia?.id) continue;
    if (row.verification_status === "verified" && row.publication_status === "draft" && eligibleSource(row.source_id)) plan.investmentIds.push(String(row.id));
  }
  const manifestFacilities = new Set(dataset.files.smelters.records.map((row) => row.facilityCode));
  for (const row of snapshot.smelter_facilities) {
    if (!manifestFacilities.has(String(row.facility_code))) continue;
    if (row.verification_status === "verified" && row.publication_status === "draft" && eligibleSource(row.source_id)) plan.smelterIds.push(String(row.id));
  }
  // Export staging is intentionally HOLD because HS/product form are unresolved.
  plan.exportIds = [];
  return plan;
}

export interface EconomyPromotionTransaction {
  snapshot(): Promise<EconomySnapshot>;
  promote(plan: EconomyPromotionPlan): Promise<void>;
}
export interface EconomyPromotionAdapter {
  transaction(work: (transaction: EconomyPromotionTransaction) => Promise<EconomyApplyResult>): Promise<EconomyApplyResult>;
}

export async function promoteEconomy(dataset: EconomyDataset, adapter: EconomyPromotionAdapter, commit: boolean) {
  if (!commit) throw new Error("Promotion Economy memerlukan --commit; koneksi write belum dibuka");
  return adapter.transaction(async (transaction) => {
    const before = await transaction.snapshot();
    const plan = planEconomyPromotion(dataset, before);
    if (plan.issues.length) throw new Error("Pre-promotion verification gagal");
    await transaction.promote(plan);
    const after = await transaction.snapshot();
    const remaining = planEconomyPromotion(dataset, after);
    if (remaining.issues.length || remaining.investmentIds.length || remaining.exportIds.length || remaining.smelterIds.length) throw new Error("Post-promotion verification gagal");
    return { inserted: 0, corrected: plan.investmentIds.length + plan.exportIds.length + plan.smelterIds.length, unchanged: 0, hold: { investment: 0, exports: dataset.files.exports.records.length, smelters: 0 } };
  });
}
