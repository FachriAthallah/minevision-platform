import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { intelligenceCanonicalFileSchema, intelligenceDecimalSchema, intelligenceLocationSchema, intelligenceCoverageSchema, isPublicIntelligenceMarker } from "./intelligence-canonical";
import { loadIntelligenceCanonical, validateIntelligenceCanonical, type CanonicalDataset } from "../services/validate-intelligence-canonical";
import { applyIntelligenceCanonical, emptyIntelligenceSnapshot, legacyFingerprint, legacyPriceFingerprint, planIntelligenceCanonical, planIntelligencePromotion, promoteIntelligenceCanonical, type IntelligenceAdapter, type IntelligencePromotionAdapter, type IntelligenceSnapshot } from "../services/intelligence-canonical-plan";

let dataset: CanonicalDataset;
beforeAll(async () => {
  const result = await loadIntelligenceCanonical(resolve("data/staging/intelligence/manifest.json"));
  if (!result.success) throw new Error(JSON.stringify(result.issues));
  dataset = result.data;
});
const fixture = () => structuredClone(dataset.files[1]);
function snapshot(): IntelligenceSnapshot {
  const state = emptyIntelligenceSnapshot();
  state.measurement_units = ["metric_ton", "kilogram", "dry_metric_ton", "troy_ounce"].map((code) => ({ code, is_active: true }));
  for (const file of dataset.files) {
    state.commodities.push({ id: file.commoditySlug, slug: file.commoditySlug, is_active: true });
    for (const region of file.regionCoverage) if (!state.regions.some((row) => row.slug === region.regionSlug)) state.regions.push({ id: region.regionSlug, slug: region.regionSlug, code: "TEST-CODE", parent_id: "TEST-COUNTRY", level: "province", is_active: true });
    if (file.priceSeries.standardCode) state.commodity_price_standards.push({ id: file.priceSeries.standardCode, code: file.priceSeries.standardCode, commodity_id: file.commoditySlug, default_unit_code: file.priceSeries.unitCode, default_currency_code: "USD", is_active: true });
  }
  state.commodity_production_series.push({ id: "legacy", series_code: "nikel-national-legacy-unclassified-metric-ton", commodity_id: "nikel", is_canonical: false, is_public_default: false });
  state.commodity_production.push({ id: "old", series_id: "legacy", commodity_id: "nikel", year: 2024, record_type: "actual", production_value: "173600000.000000", publication_status: "published" });
  state.commodity_price_series.push(
    { id: "hba-legacy", commodity_id: "batubara", price_standard_id: "HBA_6322", series_code: "hba-annual-legacy-v1", period: "annual", aggregation_method: "unclassified", is_canonical: false, is_public_default: false, publication_status: "draft", verification_status: "pending" },
    { id: "nickel-price-legacy", commodity_id: "nikel", price_standard_id: "HMA_NIKEL", series_code: "hma-nikel-annual-legacy-v1", period: "annual", aggregation_method: "unclassified", is_canonical: false, is_public_default: false, publication_status: "draft", verification_status: "pending" },
    { id: "gold-price-legacy", commodity_id: "emas", price_standard_id: "HMA_EMAS", series_code: "hma-emas-annual-legacy-v1", period: "annual", aggregation_method: "unclassified", is_canonical: false, is_public_default: false, publication_status: "draft", verification_status: "pending" },
  );
  state.commodity_domestic_prices.push(
    { id: "hba-2020-old", price_series_id: "hba-legacy", commodity_id: "batubara", price_standard_id: "HBA_6322", effective_date: "2020-01-01", period: "annual", record_type: "actual", price_value: "58.170000", unit_code: "metric_ton", currency_code: "USD", source_id: "legacy-source", verification_status: "pending", publication_status: "draft" },
    { id: "hba-2025-old", price_series_id: "hba-legacy", commodity_id: "batubara", price_standard_id: "HBA_6322", effective_date: "2025-01-01", period: "annual", record_type: "actual", price_value: "120.200000", unit_code: "metric_ton", currency_code: "USD", source_id: "legacy-source", verification_status: "verified", publication_status: "published" },
    { id: "nickel-2025-old", price_series_id: "nickel-price-legacy", commodity_id: "nikel", price_standard_id: "HMA_NIKEL", effective_date: "2025-01-01", period: "annual", record_type: "actual", price_value: "15900.000000", unit_code: "dry_metric_ton", currency_code: "USD", source_id: "legacy-source", verification_status: "verified", publication_status: "published" },
    { id: "gold-2025-old", price_series_id: "gold-price-legacy", commodity_id: "emas", price_standard_id: "HMA_EMAS", effective_date: "2025-01-01", period: "annual", record_type: "actual", price_value: "4165.000000", unit_code: "troy_ounce", currency_code: "USD", source_id: "legacy-source", verification_status: "verified", publication_status: "published" },
  );
  return state;
}
function promotionAdapter(initial: IntelligenceSnapshot, fail = false) {
  let state = structuredClone(initial);
  let opened = 0;
  const adapter: IntelligencePromotionAdapter = {
    transaction: async (work) => {
      opened++;
      const pending = structuredClone(state);
      const result = await work({
        snapshot: async () => structuredClone(pending),
        promote: async (plan) => {
          const groups = [
            [pending.commodity_production_series, plan.productionSeriesIds],
            [pending.commodity_production, plan.productionObservationIds],
            [pending.commodity_price_series, plan.priceSeriesIds],
            [pending.commodity_domestic_prices, plan.priceObservationIds],
          ] as const;
          for (const [rows, ids] of groups) for (const row of rows) if (ids.includes(String(row.id))) {
            row.verification_status = "verified";
            row.publication_status = "published";
          }
          if (fail) throw new Error("Injected promotion failure");
        },
      });
      state = pending;
      return result;
    },
  };
  return { adapter, state: () => state, opened: () => opened };
}
function memoryAdapter(initial: IntelligenceSnapshot, failure?: "batch" | "verify") {
  let state = structuredClone(initial);
  let opened = 0;
  let calls = 0;
  const adapter: IntelligenceAdapter = {
    transaction: async (work) => {
      opened++;
      const pending = structuredClone(state);
      const result = await work({ snapshot: async () => structuredClone(pending), insert: async (batch) => {
        calls++;
        if (failure === "batch" && calls === 2) throw new Error("Injected batch failure");
        for (const entry of batch) pending[entry.table].push(structuredClone(entry.row));
        if (failure === "verify") pending.commodity_production[0].production_value = "0";
      } });
      state = pending;
      return result;
    },
  };
  return { adapter, state: () => state, opened: () => opened };
}

describe("Intelligence canonical contract", () => {
  it("validates seven source-backed files and retains exact production strings", () => {
    expect(dataset.files).toHaveLength(7);
    expect(dataset.files.flatMap((file) => file.productionSeries.records)).toHaveLength(38);
    expect(dataset.files.flatMap((file) => file.priceSeries.records)).toHaveLength(10);
    expect(dataset.files[3].productionSeries.records.find((record) => record.year === 2024)?.value).toBe("4491356");
    expect(dataset.files[2].productionSeries.unitCode).toBe("kilogram");
    expect(dataset.files[2].productionSeries.records.find((record) => record.year === 2024)?.value).toBe("60803");
    expect(dataset.files.find((file) => file.commoditySlug === "batubara")?.priceSeries.missingYears).toEqual([2025]);
    expect(dataset.files.find((file) => file.commoditySlug === "nikel")?.priceSeries.missingYears).toContain(2025);
    expect(dataset.files.find((file) => file.commoditySlug === "emas")?.priceSeries.records.find((record) => record.year === 2025)?.value).toBe("3376.02");
  });
  it.each(["27.358.862.495", "27,1", "2e10", "-1", 27358862495, NaN, Infinity, "1234567890123456789", "1.1234567"])("rejects noncanonical numeric %s", (value) => {
    expect(intelligenceDecimalSchema.safeParse(value).success).toBe(false);
  });
  it("accepts decimal precision and does not fill absent years with zero", () => {
    expect(intelligenceDecimalSchema.parse("27358862495.123456")).toBe("27358862495.123456");
    expect(fixture().productionSeries.missingYears).toEqual([2025]);
    expect(fixture().productionSeries.records.some((row) => row.year === 2025)).toBe(false);
  });
  it("rejects mixed product form, wrong unit, duplicate year, and unproven zero", () => {
    for (const mutate of [
      (file: ReturnType<typeof fixture>) => { file.productionSeries.productForm = "metal"; },
      (file: ReturnType<typeof fixture>) => { file.productionSeries.unitCode = "kilogram"; },
      (file: ReturnType<typeof fixture>) => { file.productionSeries.records.push(file.productionSeries.records[0]); },
      (file: ReturnType<typeof fixture>) => { file.productionSeries.records[0].value = "0"; },
    ]) { const file = fixture(); mutate(file); expect(intelligenceCanonicalFileSchema.safeParse(file).success).toBe(false); }
  });
  it("rejects global or retail substitutions for domestic standards", () => {
    const file = fixture();
    expect(intelligenceCanonicalFileSchema.safeParse({ ...file, priceSeries: { ...file.priceSeries, standardCode: "LME_NICKEL" } }).success).toBe(false);
    file.priceSeries.currencyCode = null;
    expect(intelligenceCanonicalFileSchema.safeParse(file).success).toBe(false);
  });
  it("allows coverage without rank but rejects unsupported verified ranking", () => {
    const row = fixture().regionCoverage[0];
    expect(intelligenceCoverageSchema.safeParse(row).success).toBe(true);
    const result = intelligenceCoverageSchema.safeParse({ ...row, rankingStatus: "verified", rank: 1 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.path[0] === "rankingStatus")).toBe(true);
  });
  it("keeps unknown coordinates off public markers and rejects partial coordinates", () => {
    const site = fixture().locations[0];
    expect(intelligenceLocationSchema.safeParse(site).success).toBe(true);
    expect(isPublicIntelligenceMarker(site)).toBe(false);
    expect(intelligenceLocationSchema.safeParse({ ...site, latitude: -2 }).success).toBe(false);
    expect(isPublicIntelligenceMarker({ ...site, latitude: -2, longitude: 120, locationAccuracy: "regency_centroid", geometrySourceUrl: "https://example.test/map" })).toBe(false);
  });
  it("preserves smelter identity and prevents operating project/deposit", () => {
    const site = fixture().locations[0];
    expect(intelligenceLocationSchema.parse({ ...site, siteType: "smelter" }).siteType).toBe("smelter");
    for (const siteType of ["project", "deposit"]) expect(intelligenceLocationSchema.safeParse({ ...site, siteType, operationStatus: "operating" }).success).toBe(false);
    expect(intelligenceLocationSchema.safeParse({ ...site, isPrimary: true }).success).toBe(false);
  });
  it("collects cross-file source, missing file, unexpected file, and slug conflicts", () => {
    const files = dataset.files.map((data) => ({ filePath: `${data.commoditySlug}.json`, data: structuredClone(data) }));
    files[0].data.productionSeries.records[0].sources[0].sourceSlug = "unknown-source";
    files.pop();
    files.push({ filePath: "extra.json", data: fixture() });
    const result = validateIntelligenceCanonical(dataset.manifest, files);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining(["missing_file", "unexpected_file", "reference_conflict"]));
  });
});

describe("transactional insert-only reconciliation", () => {
  it("preserves published legacy while permitting canonical values in the same year", async () => {
    const before = snapshot();
    const memory = memoryAdapter(before);
    const result = await applyIntelligenceCanonical(dataset, memory.adapter, true);
    expect(result.inserted).toBeGreaterThan(0);
    expect(result.updated).toBe(0);
    expect(legacyFingerprint(memory.state())).toBe(legacyFingerprint(before));
    expect(legacyPriceFingerprint(memory.state())).toBe(legacyPriceFingerprint(before));
    expect(memory.state().commodity_production.filter((row) => row.commodity_id === "nikel" && row.year === 2024)).toHaveLength(2);
    expect(memory.state().commodity_production_series.filter((row) => row.is_public_default === true)).toHaveLength(7);
    expect(memory.state().commodity_price_series.filter((row) => row.is_public_default === true)).toHaveLength(3);
    expect(memory.state().commodity_domestic_prices.filter((row) => row.price_standard_id === "HBA_6322" && row.effective_date === "2020-01-01")).toHaveLength(2);
    expect(memory.state().commodity_domestic_prices.find((row) => row.id === "gold-2025-old")).toMatchObject({ price_value: "4165.000000", publication_status: "published", verification_status: "verified", price_series_id: "gold-price-legacy" });
    const canonicalGold2025 = memory.state().commodity_domestic_prices.find((row) => row.price_series_id !== "gold-price-legacy" && row.price_standard_id === "HMA_EMAS" && row.effective_date === "2025-01-01");
    expect(canonicalGold2025).toMatchObject({ price_value: "3376.02", publication_status: "draft", verification_status: "verified" });
    expect(memory.state().commodity_domestic_prices.some((row) => row.price_series_id !== "hba-legacy" && row.price_standard_id === "HBA_6322" && row.effective_date === "2025-01-01")).toBe(false);
    expect(memory.state().commodity_domestic_prices.some((row) => row.price_series_id !== "nickel-price-legacy" && row.price_standard_id === "HMA_NIKEL" && row.effective_date === "2025-01-01")).toBe(false);
    const second = await applyIntelligenceCanonical(dataset, memory.adapter, true);
    expect(second.inserted).toBe(0);
    expect(second.updated).toBe(0);
    expect(second.unchanged).toBe(result.inserted);
    const metadata = memory.state().commodity_production_series.find((row) => row.is_canonical === true)?.metadata;
    expect(typeof metadata).toBe("object");
  });
  it.each(["batch", "verify"] as const)("rolls back every batch on %s failure", async (failure) => {
    const before = snapshot();
    const memory = memoryAdapter(before, failure);
    await expect(applyIntelligenceCanonical(dataset, memory.adapter, true)).rejects.toThrow();
    expect(memory.state()).toEqual(before);
  });
  it("does not open a transaction without explicit apply", async () => {
    const memory = memoryAdapter(snapshot());
    await expect(applyIntelligenceCanonical(dataset, memory.adapter, false)).rejects.toThrow("transaksi belum dibuka");
    expect(memory.opened()).toBe(0);
  });
  it("rejects another public default and a different source with the same slug", () => {
    const state = snapshot();
    state.commodity_production_series.push({ id: "other", commodity_id: "nikel", production_scope: "national", series_code: "other", is_public_default: true });
    state.sources.push({ id: "source", slug: dataset.manifest.sourceCatalog[0].slug, name: "Different source", url: "https://example.test/other" });
    const plan = planIntelligenceCanonical(dataset, state);
    expect(plan.issues.some((issue) => issue.includes("public-default"))).toBe(true);
    expect(plan.issues.some((issue) => issue.includes("sources: konflik"))).toBe(true);
  });
  it("supports multiple deterministic sites and detects canonical price source/status conflicts", async () => {
    const state = snapshot();
    const changed = structuredClone(dataset);
    const site = changed.files[1].locations[0];
    changed.files[1].locations.push({ ...site, siteSlug: "second-test-site" });
    const plan = planIntelligenceCanonical(changed, state);
    expect(plan.issues).toEqual([]);
    expect(plan.inserts.filter((entry) => entry.table === "commodity_production_locations" && entry.row.region_id === site.regionSlug).length).toBeGreaterThan(1);
    const memory = memoryAdapter(state);
    await applyIntelligenceCanonical(changed, memory.adapter, true);
    const canonical = memory.state().commodity_domestic_prices.find((row) => row.price_series_id !== "hba-legacy" && row.price_standard_id === "HBA_6322")!;
    canonical.source_id = "different-source";
    canonical.publication_status = "published";
    expect(planIntelligenceCanonical(changed, memory.state()).issues.some((issue) => issue.includes("source_id"))).toBe(true);
  });
  it("migration contains deterministic legacy price backfill and preservation guards", async () => {
    const sql = await readFile(resolve("drizzle/0020_intelligence-canonical-series.sql"), "utf8");
    expect(sql).toContain("intelligence_production_before");
    expect(sql).toContain("(to_jsonb(p) - 'series_id') IS DISTINCT FROM b.original");
    expect(sql).toContain("ALTER COLUMN \"series_id\" SET NOT NULL");
    expect(sql).toContain('("series_id","year","record_type")');
    expect(sql).toContain("IF column_type IS NULL THEN");
    expect(sql).toContain("intelligence_prices_before");
    expect(sql).toContain("minevision:legacy-price:");
    expect(sql.match(/ON CONFLICT \(id\) DO NOTHING/g)).toHaveLength(2);
    expect(sql).toContain("ALTER COLUMN \"price_series_id\" SET NOT NULL");
    expect(sql).toContain('("price_series_id","effective_date","record_type")');
    expect(sql).not.toMatch(/DELETE FROM/i);
  });
});

describe("atomic promotion", () => {
  it("defaults to no transaction without --commit", async () => {
    const imported = memoryAdapter(snapshot());
    await applyIntelligenceCanonical(dataset, imported.adapter, true);
    const promotion = promotionAdapter(imported.state());
    await expect(promoteIntelligenceCanonical(dataset, promotion.adapter, false)).rejects.toThrow("transaksi belum dibuka");
    expect(promotion.opened()).toBe(0);
  });

  it("promotes canonical series and observations without touching legacy", async () => {
    const imported = memoryAdapter(snapshot());
    await applyIntelligenceCanonical(dataset, imported.adapter, true);
    const before = imported.state();
    const promotion = promotionAdapter(before);
    const result = await promoteIntelligenceCanonical(dataset, promotion.adapter, true);
    expect(result).toEqual({ productionSeries: 7, productionObservations: 38, priceSeries: 3, priceObservations: 10 });
    expect(legacyFingerprint(promotion.state())).toBe(legacyFingerprint(before));
    expect(legacyPriceFingerprint(promotion.state())).toBe(legacyPriceFingerprint(before));
    expect(promotion.state().commodity_domestic_prices.find((row) => row.id === "gold-2025-old")?.price_value).toBe("4165.000000");
    expect(planIntelligencePromotion(dataset, promotion.state()).issues).toEqual([]);
  });

  it("rolls back promotion atomically on failure", async () => {
    const imported = memoryAdapter(snapshot());
    await applyIntelligenceCanonical(dataset, imported.adapter, true);
    const before = imported.state();
    const promotion = promotionAdapter(before, true);
    await expect(promoteIntelligenceCanonical(dataset, promotion.adapter, true)).rejects.toThrow("Injected promotion failure");
    expect(promotion.state()).toEqual(before);
  });
});
