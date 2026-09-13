import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

import type { EconomyDataset } from "./validate-economy-import";
import { loadEconomyImport } from "./validate-economy-import";
import {
  applyEconomyImport,
  emptyEconomySnapshot,
  planEconomyImport,
  planEconomyPromotion,
  type EconomySnapshot,
} from "./economy-import-plan";

let dataset: EconomyDataset;

beforeAll(async () => {
  const result = await loadEconomyImport(resolve("data/staging/economy/manifest.json"));
  if (!result.success) throw new Error("Fixture Economy tidak valid");
  dataset = result.data;
});

function sourceId(slug: string) {
  return `source-${slug}`;
}

function buildSnapshot(): EconomySnapshot {
  const snapshot = emptyEconomySnapshot();
  snapshot.sources = dataset.manifest.sourceCatalog.map((source) => ({
    id: sourceId(source.slug),
    slug: source.slug,
    name: source.name,
    type: source.type,
    organization: source.organization,
    url: source.url,
    description: source.description,
    is_official: true,
    verification_status: "verified",
    is_active: true,
  }));
  const regionSlugs = new Set([
    "indonesia",
    ...dataset.files.exports.records.flatMap((row) => [row.originRegionSlug, row.destinationRegionSlug].filter(Boolean) as string[]),
    ...dataset.files.smelters.records.map((row) => row.provinceRegionSlug),
  ]);
  snapshot.regions = [...regionSlugs].map((slug) => ({ id: `region-${slug}`, slug, is_active: true }));
  snapshot.measurement_units = [{ id: "unit-ton", code: "metric_ton", is_active: true }];
  snapshot.commodities = [...new Set(dataset.files.exports.records.map((row) => row.commoditySlug))].map((slug) => ({ id: `commodity-${slug}`, slug, is_active: true }));
  snapshot.economic_gdp_annual = dataset.files.gdp.records.map((row) => ({
    id: `gdp-${row.year}`,
    region_id: "region-indonesia",
    year: row.year,
    price_basis: row.priceBasis,
    record_type: row.recordType,
    national_gdp_value: row.nationalGdpValue,
    mining_quarrying_gdp_value: row.miningQuarryingGdpValue,
    currency_code: row.currencyCode,
    value_scale: row.valueScale,
    data_status: row.dataStatus,
    verification_status: row.verificationStatus,
    publication_status: row.publicationStatus,
  }));
  snapshot.economic_gdp_sources = snapshot.economic_gdp_annual.map((row) => ({
    id: `gdp-source-${row.year}`,
    economic_gdp_id: row.id,
    source_id: sourceId("bps"),
    source_url: `https://www.bps.go.id/id/statistics-table/gdp-${row.year}`,
    citation_label: "BPS - Produk Domestik Bruto ADHB Menurut Lapangan Usaha",
    page_reference: null,
    notes: null,
    is_primary: true,
  }));
  snapshot.mining_investment_annual = dataset.files.investment.records.map((row) => ({
    id: `investment-${row.year}-${row.investmentOrigin}`,
    region_id: "region-indonesia",
    year: row.year,
    sector_code: row.sectorCode,
    sector_name: row.sectorName,
    investment_origin: row.investmentOrigin,
    investment_value: row.investmentValue,
    currency_code: row.currencyCode,
    value_scale: row.valueScale,
    project_count: row.projectCount,
    data_status: row.dataStatus,
    record_type: row.recordType,
    source_id: sourceId(row.sourceSlugs[0]),
    source_published_at: row.sourcePublishedAt,
    verification_status: row.verificationStatus,
    publication_status: row.publicationStatus,
  }));
  snapshot.minerba_exports_annual = dataset.files.exports.records.map((row, index) => ({
    id: `export-${index}`,
    commodity_id: `commodity-${row.commoditySlug}`,
    origin_region_id: `region-${row.originRegionSlug}`,
    destination_region_id: row.destinationRegionSlug ? `region-${row.destinationRegionSlug}` : null,
    year: row.year,
    source_commodity_label: row.sourceCommodityLabel,
    hs_code: row.hsCode,
    product_form: row.productForm,
    coverage_type: row.coverageType,
    export_volume: row.netWeightValue,
    volume_unit_code: row.netWeightUnitCode,
    volume_scale: row.netWeightScale,
    fob_value: row.fobValue,
    currency_code: row.currencyCode,
    fob_value_scale: row.fobValueScale,
    data_availability: row.availability,
    data_status: row.dataStatus,
    record_type: row.recordType,
    source_id: sourceId(row.sourceSlugs[0]),
    source_published_at:
      dataset.files.exports.expectedExistingSourcePublishedAtByYear[
        String(row.year) as keyof typeof dataset.files.exports.expectedExistingSourcePublishedAtByYear
      ],
    verification_status: row.verificationStatus,
    publication_status: row.publicationStatus,
  }));
  snapshot.smelter_facilities = dataset.files.smelters.records.map((row) => ({
    id: `facility-${row.facilityCode}`,
    facility_code: row.facilityCode,
    source_id: row.canonicalSourceSlug ? sourceId(row.canonicalSourceSlug) : null,
    verification_status: row.verificationStatus,
    publication_status: row.publicationStatus,
  }));
  return snapshot;
}

describe("planner Economy", () => {
  it("bersifat idempoten dan menahan investasi/ekspor", () => {
    const snapshot = buildSnapshot();
    const initial = planEconomyImport(dataset, snapshot);
    expect(initial.issues).toEqual([]);
    expect(initial.inserts).toHaveLength(0);
    const second = planEconomyImport(dataset, snapshot);
    expect(second.inserts).toHaveLength(0);
    expect(second.corrections).toHaveLength(0);
    expect(second.hold).toEqual({ investment: 14, exports: 49, smelters: 2 });
  });

  it("mempertahankan source_published_at ekspor sebagai bagian fingerprint", () => {
    const snapshot = buildSnapshot();
    snapshot.minerba_exports_annual[0].source_published_at = "1999-01-01";

    const plan = planEconomyImport(dataset, snapshot);

    expect(plan.issues).toContain(
      "exports/2019/batubara: existing record berbeda pada source_published_at; tidak ditimpa",
    );
  });

  it("menggunakan relasi sumber PDB existing tanpa menduplikasi URL atau peran", () => {
    const snapshot = buildSnapshot();
    const plan = planEconomyImport(dataset, snapshot);

    expect(
      plan.inserts.filter((entry) => entry.table === "economic_gdp_sources"),
    ).toEqual([]);
  });

  it("mendeteksi konflik published tanpa menimpa nilai", () => {
    const snapshot = buildSnapshot();
    snapshot.economic_gdp_annual[0].mining_quarrying_gdp_value = "1";
    const plan = planEconomyImport(dataset, snapshot);
    expect(plan.issues.some((issue) => issue.includes("published record berbeda"))).toBe(true);
  });

  it("hanya mempromosikan verified/draft dengan source eligible", () => {
    const snapshot = buildSnapshot();
    snapshot.mining_investment_annual[0].verification_status = "verified";
    const plan = planEconomyPromotion(dataset, snapshot);
    expect(plan.investmentIds).toEqual([snapshot.mining_investment_annual[0].id]);
    expect(plan.exportIds).toEqual([]);
    snapshot.sources.find((source) => source.id === snapshot.mining_investment_annual[0].source_id)!.is_active = false;
    expect(planEconomyPromotion(dataset, snapshot).investmentIds).toEqual([]);
  });

  it("rollback adapter tidak meneruskan state ketika batch gagal", async () => {
    const snapshot = buildSnapshot();
    snapshot.smelter_facilities.find(
      (row) => row.facility_code === "S001",
    )!.source_id = null;
    const initial = structuredClone(snapshot);
    await expect(applyEconomyImport(dataset, {
      transaction: async (work) => {
        const working = structuredClone(snapshot);
        return work({
          snapshot: async () => working,
          insert: async () => undefined,
          correctFacilities: async () => { throw new Error("forced failure"); },
        });
      },
    }, true)).rejects.toThrow("forced failure");
    expect(snapshot).toEqual(initial);
  });

  it("menolak importer tanpa --commit sebelum transaksi", async () => {
    let opened = false;
    await expect(applyEconomyImport(dataset, {
      transaction: async () => { opened = true; throw new Error("tidak boleh"); },
    }, false)).rejects.toThrow("--commit");
    expect(opened).toBe(false);
  });
});
