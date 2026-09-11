import { createHash } from "node:crypto";
import type { CanonicalDataset } from "./validate-intelligence-canonical";

export const INTELLIGENCE_TABLES = ["sources", "commodities", "measurement_units", "regions", "industry_companies", "commodity_price_standards", "commodity_production_series", "commodity_price_series", "commodity_production", "commodity_production_sources", "commodity_domestic_prices", "commodity_region_coverage", "commodity_production_locations"] as const;
export type IntelligenceTable = typeof INTELLIGENCE_TABLES[number];
export type Row = Record<string, unknown>;
export type IntelligenceSnapshot = Record<IntelligenceTable, Row[]>;
export type PlannedInsert = { table: IntelligenceTable; row: Row };
export type IntelligencePlan = { inserts: PlannedInsert[]; unchanged: number; issues: string[]; legacyRecords: number; legacyPriceObservations: number; counts: Record<string, number> };
export const emptyIntelligenceSnapshot = (): IntelligenceSnapshot => ({ sources: [], commodities: [], measurement_units: [], regions: [], industry_companies: [], commodity_price_standards: [], commodity_production_series: [], commodity_price_series: [], commodity_production: [], commodity_production_sources: [], commodity_domestic_prices: [], commodity_region_coverage: [], commodity_production_locations: [] });
function id(key: string) {
  const hex = createHash("sha256").update(`minevision:intelligence:v2:${key}`).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
export function stableValue(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableValue).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stableValue(item)}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}
const numericColumns = new Set(["production_value", "price_value", "latitude", "longitude"]);
function same(column: string, a: unknown, b: unknown) {
  if (numericColumns.has(column) && a !== null && b !== null) {
    const normalized = (value: unknown) => String(value).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
    return normalized(a) === normalized(b);
  }
  return stableValue(a) === stableValue(b);
}

/** Insert-only reconciliation: an existing differing row is a conflict, never an update. */
export function planIntelligenceCanonical(dataset: CanonicalDataset, snapshot: IntelligenceSnapshot): IntelligencePlan {
  const state = structuredClone(snapshot);
  const plan: IntelligencePlan = {
    inserts: [], unchanged: 0, issues: [],
    legacyRecords: snapshot.commodity_production.filter((row) => !snapshot.commodity_production_series.some((series) => series.id === row.series_id && series.is_canonical === true)).length,
    legacyPriceObservations: snapshot.commodity_domestic_prices.filter((row) => !snapshot.commodity_price_series.some((series) => series.id === row.price_series_id && series.is_canonical === true)).length,
    counts: {},
  };
  const ensure = (table: IntelligenceTable, key: string[], row: Row): string => {
    const matches = state[table].filter((existing) => key.every((column) => same(column, existing[column], row[column])));
    const identity = key.map((column) => String(row[column])).join(":");
    if (matches.length > 1) plan.issues.push(`${table}: natural key duplikat (${identity})`);
    const existing = matches[0];
    if (existing) {
      // A separate authorized publication step may have promoted an otherwise
      // identical verified record. Re-import must neither downgrade nor rewrite it.
      const promoted = row.publication_status === "draft"
        && existing.publication_status === "published"
        && existing.verification_status === "verified"
        && (row.verification_status === "pending" || row.verification_status === "verified");
      const differences = Object.keys(row).filter((column) => column !== "id"
        && !(promoted && (column === "publication_status" || column === "verification_status"))
        && !same(column, existing[column], row[column]));
      if (differences.length) plan.issues.push(`${table}: konflik identitas/nilai (${identity}); kolom ${differences.join(", ")}; tidak akan ditimpa`);
      else plan.unchanged++;
      return String(existing.id);
    }
    state[table].push(row);
    plan.inserts.push({ table, row });
    plan.counts[table] = (plan.counts[table] ?? 0) + 1;
    return String(row.id);
  };
  const reference = (table: IntelligenceTable, column: string, value: string): Row | undefined => {
    const row = snapshot[table].find((item) => item[column] === value && item.is_active !== false);
    if (!row) plan.issues.push(`${table}: referensi aktif tidak tersedia (${value})`);
    return row;
  };
  const sourceIds = new Map<string, string>();
  for (const source of dataset.manifest.sourceCatalog) sourceIds.set(source.slug, ensure("sources", ["slug"], {
    id: id(source.slug), slug: source.slug, name: source.name, type: source.type, organization: source.organization,
    url: source.url, description: source.description, is_official: source.isOfficial, is_active: true, verification_status: source.verificationStatus,
  }));
  for (const file of dataset.files) {
    const commodity = reference("commodities", "slug", file.commoditySlug);
    if (!commodity) continue;
    const commodityId = String(commodity.id);
    const production = file.productionSeries;
    reference("measurement_units", "code", production.unitCode);
    const existingDefault = snapshot.commodity_production_series.find((series) => series.commodity_id === commodityId && series.production_scope === production.productionScope && series.is_public_default === true && series.series_code !== production.seriesCode);
    if (existingDefault) plan.issues.push(`${file.commoditySlug}: seri public-default lain sudah tersedia; perlu keputusan eksplisit`);
    const seriesId = ensure("commodity_production_series", ["series_code"], {
      id: id(production.seriesCode), commodity_id: commodityId, series_code: production.seriesCode, name: production.name,
      product_form: production.productForm, production_scope: production.productionScope, unit_code: production.unitCode,
      specification: production.specification, methodology_notes: production.methodologyNotes,
      primary_source_id: sourceIds.get(production.records[0].sources[0].sourceSlug), is_canonical: true, is_public_default: true,
      publication_status: "published", verification_status: "verified", valid_from_year: 2019, valid_to_year: 2025,
      metadata: { missingYears: production.missingYears, sourceDocument: dataset.manifest.canonicalDocument.sha256 },
    });
    const expectedRecords = new Set(production.records.map((record) => `${record.year}:${record.recordType}`));
    if (snapshot.commodity_production.some((row) => row.series_id === seriesId && !expectedRecords.has(`${row.year}:${row.record_type}`))) plan.issues.push(`${production.seriesCode}: terdapat record tambahan di luar manifest; perlu audit, tidak dihapus`);
    for (const record of production.records) {
      const productionId = ensure("commodity_production", ["series_id", "year", "record_type"], {
        id: id(`${production.seriesCode}:${record.year}:${record.recordType}`), series_id: seriesId, commodity_id: commodityId,
        year: record.year, record_type: record.recordType, production_value: record.value, unit_code: production.unitCode,
        source_id: sourceIds.get(record.sources[0].sourceSlug), verification_status: "verified", publication_status: "draft", notes: record.notes,
      });
      record.sources.forEach((source, index) => ensure("commodity_production_sources", ["production_id", "source_id", "citation_label"], {
        id: id(`${productionId}:${source.sourceSlug}:${source.citationLabel}`), production_id: productionId, source_id: sourceIds.get(source.sourceSlug),
        citation_label: source.citationLabel, source_url: source.sourceUrl, page_reference: source.pageReference, is_primary: index === 0,
      }));
      const citationKeys = new Set(record.sources.map((source) => `${sourceIds.get(source.sourceSlug)}:${source.citationLabel}`));
      if (snapshot.commodity_production_sources.some((source) => source.production_id === productionId && !citationKeys.has(`${source.source_id}:${source.citation_label}`))) plan.issues.push(`${production.seriesCode}/${record.year}: referensi tambahan berbeda dari manifest`);
    }
    const price = file.priceSeries;
    if (price.standardCode && price.seriesCode) {
      const standard = reference("commodity_price_standards", "code", price.standardCode);
      if (standard) {
        if (standard.commodity_id !== commodityId || standard.default_unit_code !== price.unitCode || standard.default_currency_code !== price.currencyCode) plan.issues.push(`${price.standardCode}: commodity/unit/currency berbeda dari price standard`);
        const existingPriceDefault = snapshot.commodity_price_series.find((series) => series.commodity_id === commodityId && series.price_standard_id === standard.id && series.period === price.period && series.is_public_default === true && series.series_code !== price.seriesCode);
        if (existingPriceDefault) plan.issues.push(`${price.seriesCode}: price series public-default lain sudah tersedia; perlu audit`);
        const priceSeriesId = ensure("commodity_price_series", ["series_code"], {
          id: id(price.seriesCode), commodity_id: commodityId, price_standard_id: standard.id,
          series_code: price.seriesCode, name: price.name, period: price.period,
          aggregation_method: price.aggregationMethod,
          primary_source_id: sourceIds.get(price.records[0].sources[0].sourceSlug),
          methodology_notes: price.methodologyNotes, is_canonical: true,
          is_public_default: true, verification_status: "pending", publication_status: "draft",
          valid_from_year: Math.min(...price.records.map((record) => record.year)),
          valid_to_year: Math.max(...price.records.map((record) => record.year)),
        });
        const expectedPriceRecords = new Set(price.records.map((record) => `${record.year}-01-01:${record.recordType}`));
        if (snapshot.commodity_domestic_prices.some((row) => row.price_series_id === priceSeriesId && !expectedPriceRecords.has(`${row.effective_date}:${row.record_type}`))) plan.issues.push(`${price.seriesCode}: terdapat observation tambahan di luar manifest; tidak dihapus`);
        for (const record of price.records) ensure("commodity_domestic_prices", ["price_series_id", "effective_date", "record_type"], {
          id: id(`${price.seriesCode}:${record.year}:actual`), price_series_id: priceSeriesId,
          commodity_id: commodityId, price_standard_id: standard.id,
          effective_date: `${record.year}-01-01`, period: price.period, period_label: String(record.year), price_value: record.value,
          currency_code: price.currencyCode, unit_code: price.unitCode, record_type: "actual", source_id: sourceIds.get(record.sources[0].sourceSlug),
          verification_status: "verified", publication_status: "draft",
          notes: [record.notes, price.methodologyNotes, ...record.sources.map((source) => `${source.citationLabel}: ${source.sourceUrl}`)].filter(Boolean).join("\n"),
        });
      }
    }
    const region = (slug: string) => {
      const row = reference("regions", "slug", slug);
      if (row && (!row.code || !row.parent_id || row.level !== "province")) plan.issues.push(`${slug}: kode resmi/hierarki provinsi belum lengkap; tidak membuat kode berdasarkan asumsi`);
      return row;
    };
    const companyId = (slug: string | null) => slug ? reference("industry_companies", "slug", slug)?.id ?? null : null;
    for (const coverage of file.regionCoverage) {
      const area = region(coverage.regionSlug);
      if (!area) continue;
      const source = coverage.sources[0];
      ensure("commodity_region_coverage", ["commodity_id", "region_id"], {
        id: id(`${file.commoditySlug}:coverage:${coverage.regionSlug}`), commodity_id: commodityId, region_id: area.id,
        coverage_type: coverage.coverageType, production_value: coverage.productionValue, production_year: coverage.productionYear,
        unit_code: coverage.unitCode, rank: coverage.rank, ranking_status: coverage.rankingStatus, ranking_evidence: coverage.rankingEvidence,
        related_company_id: companyId(coverage.industryCompanySlug), related_company_name: coverage.relatedCompanyName,
        source_id: source ? sourceIds.get(source.sourceSlug) : null, source_url: source?.sourceUrl ?? null,
        verification_status: coverage.verificationStatus, publication_status: "draft",
        notes: [coverage.areaDescription, coverage.notes, ...coverage.sources.map((item) => `${item.citationLabel}: ${item.sourceUrl}`)].join("\n"),
      });
    }
    for (const site of file.locations) {
      const area = region(site.regionSlug);
      if (!area) continue;
      ensure("commodity_production_locations", ["commodity_id", "region_id", "site_slug"], {
        id: id(`${file.commoditySlug}:site:${site.regionSlug}:${site.siteSlug}`), commodity_id: commodityId, region_id: area.id,
        site_slug: site.siteSlug, site_name: site.siteName, site_type: site.siteType, location_detail: site.siteName,
        company_id: companyId(site.industryCompanySlug), company_name: site.companyName,
        latitude: site.latitude === null ? null : String(site.latitude), longitude: site.longitude === null ? null : String(site.longitude),
        location_accuracy: site.locationAccuracy, geometry_source_url: site.geometrySourceUrl, operation_status: site.operationStatus,
        is_primary: site.isPrimary, primary_reason: site.primaryReason, source_id: sourceIds.get(site.sources[0].sourceSlug), record_type: "actual",
        year: null, production_value: null, unit_code: null, share_percentage: null, producer_rank: null,
        verification_status: site.verificationStatus, publication_status: "draft",
        notes: [site.notes, ...site.sources.map((source) => `${source.citationLabel}: ${source.sourceUrl}`)].join("\n"),
      });
    }
  }
  plan.issues = [...new Set(plan.issues)];
  // Parent tables precede children, allowing bounded multi-row SQL batches.
  plan.inserts.sort((a, b) => INTELLIGENCE_TABLES.indexOf(a.table) - INTELLIGENCE_TABLES.indexOf(b.table));
  return plan;
}

export function legacyFingerprint(snapshot: IntelligenceSnapshot): string {
  const canonicalIds = new Set(snapshot.commodity_production_series.filter((series) => series.is_canonical === true).map((series) => series.id));
  return createHash("sha256").update(stableValue(snapshot.commodity_production.filter((row) => !canonicalIds.has(row.series_id)).sort((a, b) => String(a.id).localeCompare(String(b.id))))).digest("hex");
}
export function legacyPriceFingerprint(snapshot: IntelligenceSnapshot): string {
  const canonicalIds = new Set(snapshot.commodity_price_series.filter((series) => series.is_canonical === true).map((series) => series.id));
  return createHash("sha256").update(stableValue(snapshot.commodity_domestic_prices.filter((row) => !canonicalIds.has(row.price_series_id)).sort((a, b) => String(a.id).localeCompare(String(b.id))))).digest("hex");
}
export function regionCoverageFingerprint(snapshot: IntelligenceSnapshot): string {
  const rows = snapshot.commodity_region_coverage
    .map((row) => Object.fromEntries(
      Object.entries(row).filter(([column]) => column !== "publication_status"),
    ))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));
  return createHash("sha256").update(stableValue(rows)).digest("hex");
}
export interface IntelligenceTransaction {
  snapshot(): Promise<IntelligenceSnapshot>;
  insert(batch: PlannedInsert[]): Promise<void>;
}
export interface IntelligenceAdapter {
  transaction(work: (tx: IntelligenceTransaction) => Promise<IntelligenceApplyResult>): Promise<IntelligenceApplyResult>;
}
export type IntelligenceApplyResult = { inserted: number; updated: number; unchanged: number; legacyPreserved: number; legacyPricesPreserved: number };
export async function applyIntelligenceCanonical(dataset: CanonicalDataset, adapter: IntelligenceAdapter, apply: boolean) {
  if (!apply) throw new Error("Actual import memerlukan --commit; transaksi belum dibuka");
  return adapter.transaction(async (tx) => {
    const before = await tx.snapshot();
    const plan = planIntelligenceCanonical(dataset, before);
    if (plan.issues.length) throw new Error("Preflight mengandung konflik; tidak ada record yang ditulis");
    for (let index = 0; index < plan.inserts.length; index += 100) await tx.insert(plan.inserts.slice(index, index + 100));
    const after = await tx.snapshot();
    const verify = planIntelligenceCanonical(dataset, after);
    if (legacyFingerprint(before) !== legacyFingerprint(after) || legacyPriceFingerprint(before) !== legacyPriceFingerprint(after) || verify.issues.length || verify.inserts.length) throw new Error("Post-write verification gagal; rollback seluruh transaksi");
    return { inserted: plan.inserts.length, updated: 0, unchanged: plan.unchanged, legacyPreserved: plan.legacyRecords, legacyPricesPreserved: plan.legacyPriceObservations };
  });
}

export type IntelligencePromotionPlan = {
  productionSeriesIds: string[];
  productionObservationIds: string[];
  priceSeriesIds: string[];
  priceObservationIds: string[];
  regionCoverageIds: string[];
  issues: string[];
};

export function planIntelligencePromotion(
  dataset: CanonicalDataset,
  snapshot: IntelligenceSnapshot,
): IntelligencePromotionPlan {
  const reconciliation = planIntelligenceCanonical(dataset, snapshot);
  const result: IntelligencePromotionPlan = {
    productionSeriesIds: [], productionObservationIds: [],
    priceSeriesIds: [], priceObservationIds: [],
    regionCoverageIds: [],
    issues: [...reconciliation.issues],
  };
  if (reconciliation.inserts.length) result.issues.push("Import kanonik belum lengkap; promotion ditolak");
  for (const file of dataset.files) {
    const productionSeries = snapshot.commodity_production_series.find(
      (row) => row.series_code === file.productionSeries.seriesCode
        && row.is_canonical === true && row.is_public_default === true,
    );
    if (!productionSeries) continue;
    if (productionSeries.verification_status !== "verified"
      || productionSeries.publication_status !== "published") {
      result.productionSeriesIds.push(String(productionSeries.id));
    }
    for (const record of file.productionSeries.records) {
      const observation = snapshot.commodity_production.find((row) =>
        row.series_id === productionSeries.id
          && row.year === record.year
          && row.record_type === record.recordType,
      );
      if (observation && (observation.verification_status !== "verified"
        || observation.publication_status !== "published")) {
        result.productionObservationIds.push(String(observation.id));
      }
    }
    if (file.priceSeries.seriesCode) {
      const priceSeries = snapshot.commodity_price_series.find(
        (row) => row.series_code === file.priceSeries.seriesCode
          && row.is_canonical === true && row.is_public_default === true,
      );
      if (priceSeries) {
        if (priceSeries.verification_status !== "verified"
          || priceSeries.publication_status !== "published") {
          result.priceSeriesIds.push(String(priceSeries.id));
        }
        for (const record of file.priceSeries.records) {
          const observation = snapshot.commodity_domestic_prices.find((row) =>
            row.price_series_id === priceSeries.id
              && row.effective_date === `${record.year}-01-01`
              && row.record_type === record.recordType,
          );
          if (observation && (observation.verification_status !== "verified"
            || observation.publication_status !== "published")) {
            result.priceObservationIds.push(String(observation.id));
          }
        }
      }
    }

    const commodity = snapshot.commodities.find((row) =>
      row.slug === file.commoditySlug && row.is_active !== false,
    );
    if (!commodity) continue;
    for (const coverage of file.regionCoverage) {
      const region = snapshot.regions.find((row) =>
        row.slug === coverage.regionSlug && row.is_active !== false,
      );
      if (!region) continue;
      const row = snapshot.commodity_region_coverage.find((candidate) =>
        candidate.commodity_id === commodity.id
          && candidate.region_id === region.id,
      );
      if (!row) continue;

      if (row.publication_status === "published") {
        if (coverage.verificationStatus !== "verified"
          || row.verification_status !== "verified") {
          result.issues.push(
            `${file.commoditySlug}/${coverage.regionSlug}: coverage pending tidak boleh published`,
          );
        }
      } else if (row.publication_status !== "draft") {
        result.issues.push(
          `${file.commoditySlug}/${coverage.regionSlug}: status coverage tidak dapat dipromosikan`,
        );
        continue;
      } else if (row.verification_status !== "verified") {
        continue;
      }

      if (row.verification_status !== "verified"
        || coverage.verificationStatus !== "verified") continue;
      const sourceReference = coverage.sources[0];
      if (!sourceReference || row.source_id === null || row.source_id === undefined) {
        result.issues.push(
          `${file.commoditySlug}/${coverage.regionSlug}: coverage verified wajib mempunyai sumber`,
        );
        continue;
      }
      const source = snapshot.sources.find((candidate) =>
        candidate.slug === sourceReference.sourceSlug,
      );
      if (!source || source.is_active === false
        || source.verification_status !== "verified") {
        result.issues.push(
          `${file.commoditySlug}/${coverage.regionSlug}: sumber coverage tidak aktif atau belum verified`,
        );
        continue;
      }
      if (row.source_id !== source.id) {
        result.issues.push(
          `${file.commoditySlug}/${coverage.regionSlug}: sumber coverage berbeda dari manifest`,
        );
        continue;
      }
      if (row.publication_status === "draft") {
        result.regionCoverageIds.push(String(row.id));
      }
    }
  }
  result.issues = [...new Set(result.issues)];
  return result;
}

export interface IntelligencePromotionTransaction {
  snapshot(): Promise<IntelligenceSnapshot>;
  promote(plan: IntelligencePromotionPlan): Promise<void>;
}
export interface IntelligencePromotionAdapter {
  transaction(work: (tx: IntelligencePromotionTransaction) => Promise<IntelligencePromotionResult>): Promise<IntelligencePromotionResult>;
}
export type IntelligencePromotionResult = {
  productionSeries: number;
  productionObservations: number;
  priceSeries: number;
  priceObservations: number;
  regionCoverage: number;
};

export async function promoteIntelligenceCanonical(
  dataset: CanonicalDataset,
  adapter: IntelligencePromotionAdapter,
  commit: boolean,
): Promise<IntelligencePromotionResult> {
  if (!commit) throw new Error("Promotion --commit diperlukan; transaksi belum dibuka");
  return adapter.transaction(async (tx) => {
    const before = await tx.snapshot();
    const plan = planIntelligencePromotion(dataset, before);
    if (plan.issues.length) throw new Error("Pre-promotion verification gagal; tidak ada status yang diubah");
    const productionLegacy = legacyFingerprint(before);
    const priceLegacy = legacyPriceFingerprint(before);
    const coverageIdentity = regionCoverageFingerprint(before);
    await tx.promote(plan);
    const after = await tx.snapshot();
    const verified = planIntelligencePromotion(dataset, after);
    const targets = [
      ...plan.productionSeriesIds.map((id) => after.commodity_production_series.find((row) => row.id === id)),
      ...plan.productionObservationIds.map((id) => after.commodity_production.find((row) => row.id === id)),
      ...plan.priceSeriesIds.map((id) => after.commodity_price_series.find((row) => row.id === id)),
      ...plan.priceObservationIds.map((id) => after.commodity_domestic_prices.find((row) => row.id === id)),
      ...plan.regionCoverageIds.map((id) => after.commodity_region_coverage.find((row) => row.id === id)),
    ];
    if (verified.issues.length || targets.some((row) => row?.verification_status !== "verified" || row?.publication_status !== "published")
      || productionLegacy !== legacyFingerprint(after) || priceLegacy !== legacyPriceFingerprint(after)
      || coverageIdentity !== regionCoverageFingerprint(after)) {
      throw new Error("Post-promotion verification gagal; rollback seluruh transaksi");
    }
    return {
      productionSeries: plan.productionSeriesIds.length,
      productionObservations: plan.productionObservationIds.length,
      priceSeries: plan.priceSeriesIds.length,
      priceObservations: plan.priceObservationIds.length,
      regionCoverage: plan.regionCoverageIds.length,
    };
  });
}
