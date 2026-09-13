import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

let migration = "";

beforeAll(async () => {
  migration = await readFile(resolve("drizzle/0021_economy-data-finalization.sql"), "utf8");
});

describe("migration Economy 0021", () => {
  it("menambahkan product form dan natural key NULLS NOT DISTINCT", () => {
    expect(migration).toContain('CREATE TYPE "public"."export_product_form"');
    expect(migration).toContain('ADD COLUMN "product_form"');
    expect(migration).toContain("UNIQUE NULLS NOT DISTINCT");
  });

  it("memfilter status publik sebelum window dan aggregate", () => {
    expect(migration).toMatch(/WITH eligible AS \([\s\S]*verification_status = 'verified'[\s\S]*publication_status = 'published'[\s\S]*LAG/);
    expect(migration).toContain("HAVING COUNT(*) = 2");
    expect(migration).toContain("COUNT(*) FILTER (WHERE investment.investment_origin = 'pma') = 1");
    expect(migration).toContain("COUNT(*) FILTER (WHERE investment.investment_origin = 'pmdn') = 1");
  });

  it("mengunci payload not_reported dan estimated", () => {
    expect(migration).toContain('"minerba_exports_annual"."data_availability" = \'not_reported\'');
    expect(migration).toContain('"minerba_exports_annual"."data_availability" = \'estimated\'');
    expect(migration).toContain('NULLIF(BTRIM("minerba_exports_annual"."notes"), \'\') IS NOT NULL');
  });

  it("menolak payload reported_zero yang masih mempunyai nilai nonzero", () => {
    expect(migration).toContain(
      'AND "minerba_exports_annual"."export_volume" = 0\n          AND "minerba_exports_annual"."fob_value" = 0',
    );
    expect(migration).not.toContain(
      '"minerba_exports_annual"."export_volume" = 0 OR "minerba_exports_annual"."fob_value" = 0',
    );
  });

  it("mempertahankan security invoker dan memisahkan RLS dari grant", () => {
    expect((migration.match(/security_invoker = true/g) ?? [])).toHaveLength(6);
    expect(migration).toContain("REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER");
    expect(migration).toContain("GRANT SELECT");
    expect(migration).not.toContain("SECURITY DEFINER");
    expect(migration).not.toContain("auth.role()");
  });

  it("tidak menghapus atau memutasi observation Economy existing", () => {
    expect(migration).not.toMatch(/DELETE FROM\s+"?(economic_gdp_annual|mining_investment_annual|minerba_exports_annual|smelter_facilities)/i);
    expect(migration).not.toMatch(/UPDATE\s+"?(economic_gdp_annual|mining_investment_annual|minerba_exports_annual|smelter_facilities)/i);
  });
});
