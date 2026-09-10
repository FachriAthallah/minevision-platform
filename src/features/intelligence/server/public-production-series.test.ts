import { PgDialect, getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { commodityProduction, commodityProductionSeries, commodityDomesticPrices, commodityProductionLocations } from "@/db/schema";
import { publicProductionSeriesConditions } from "./public-production-series";

describe("explicit canonical public production selection", () => {
  it("requires canonical/default/public/verified national series, not recency", () => {
    const condition = publicProductionSeriesConditions();
    if (!condition) throw new Error("Public series condition missing");
    const compiled = new PgDialect().sqlToQuery(condition);
    expect(compiled.sql).toContain('"is_canonical"');
    expect(compiled.sql).toContain('"is_public_default"');
    expect(compiled.sql).toContain('"publication_status"');
    expect(compiled.sql).toContain('"verification_status"');
    expect(compiled.params).toEqual([true, true, "national", "published", "verified"]);
  });
  it("uses series/year/type natural key and enforces commodity+unit identity", () => {
    const config = getTableConfig(commodityProduction);
    const natural = config.indexes.find((index) => index.config.name === "commodity_production_unique_record_idx");
    expect(natural?.config.columns.map((column) => "name" in column ? column.name : null)).toEqual(["series_id", "year", "record_type"]);
    const fk = config.foreignKeys.find((key) => key.getName() === "production_series_identity_fk");
    expect(fk?.reference().columns.map((column) => column.name)).toEqual(["series_id", "commodity_id", "unit_code"]);
    expect(fk?.reference().foreignColumns.map((column) => column.name)).toEqual(["id", "commodity_id", "unit_code"]);
  });
  it("has one partial public-default index and no overlong new FK identifiers", () => {
    const config = getTableConfig(commodityProductionSeries);
    const index = config.indexes.find((item) => item.config.name === "production_series_public_default_unique_idx");
    expect(index?.config.unique).toBe(true);
    expect(index?.config.where).toBeDefined();
    expect(index?.config.columns.map((column) => "name" in column ? column.name : null)).toEqual(["commodity_id", "production_scope"]);
    for (const fk of config.foreignKeys) expect(Buffer.byteLength(fk.getName(), "utf8")).toBeLessThanOrEqual(63);
  });
  it("reflects price drift and site natural keys without removing old regional keys", () => {
    expect(commodityDomesticPrices.commodityId.notNull).toBe(true);
    expect(getTableConfig(commodityDomesticPrices).foreignKeys.some((key) => key.getName() === "domestic_price_standard_identity_fk")).toBe(true);
    const indexes = getTableConfig(commodityProductionLocations).indexes.map((index) => index.config.name);
    expect(indexes).toEqual(expect.arrayContaining(["production_locations_site_unique_idx", "commodity_production_locations_annual_unique_idx", "commodity_production_locations_undated_unique_idx"]));
  });
});
