import { PgDialect, getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import {
  commodityDomesticPrices,
  commodityPriceSeries,
} from "@/db/schema";

import {
  isPublicPriceSeries,
  publicPriceSeriesConditions,
} from "./public-price-series";

describe("explicit canonical public price selection", () => {
  it("requires canonical/default/published/verified series", () => {
    const condition = publicPriceSeriesConditions();
    if (!condition) throw new Error("Public price-series condition missing");
    const compiled = new PgDialect().sqlToQuery(condition);
    expect(compiled.sql).toContain('"is_canonical"');
    expect(compiled.sql).toContain('"is_public_default"');
    expect(compiled.sql).toContain('"publication_status"');
    expect(compiled.sql).toContain('"verification_status"');
    expect(compiled.params).toEqual([true, true, "published", "verified"]);
  });

  it("allows only one public default for commodity/standard/period", () => {
    const index = getTableConfig(commodityPriceSeries).indexes.find(
      (entry) => entry.config.name === "price_series_public_default_unique_idx",
    );
    expect(index?.config.unique).toBe(true);
    expect(index?.config.where).toBeDefined();
    expect(index?.config.columns.map((column) =>
      "name" in column ? column.name : null,
    )).toEqual(["commodity_id", "price_standard_id", "period"]);
  });

  it("keys observations by series/date/type and enforces parent identity", () => {
    const config = getTableConfig(commodityDomesticPrices);
    const natural = config.indexes.find(
      (entry) => entry.config.name === "commodity_domestic_prices_unique_record_idx",
    );
    expect(natural?.config.columns.map((column) =>
      "name" in column ? column.name : null,
    )).toEqual(["price_series_id", "effective_date", "record_type"]);
    const identity = config.foreignKeys.find(
      (entry) => entry.getName() === "domestic_price_series_identity_fk",
    );
    expect(identity?.reference().columns.map((column) => column.name)).toEqual([
      "price_series_id", "commodity_id", "price_standard_id", "period",
    ]);
  });

  it("never falls back to a published legacy series for a missing canonical year", () => {
    const legacy2025 = {
      isCanonical: false,
      isPublicDefault: false,
      publicationStatus: "published",
      verificationStatus: "verified",
    };
    const canonicalSeries = {
      isCanonical: true,
      isPublicDefault: true,
      publicationStatus: "published",
      verificationStatus: "verified",
    };

    expect(isPublicPriceSeries(legacy2025)).toBe(false);
    expect(isPublicPriceSeries(canonicalSeries)).toBe(true);
  });
});
