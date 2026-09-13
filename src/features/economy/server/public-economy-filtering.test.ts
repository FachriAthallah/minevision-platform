import { beforeEach, describe, expect, it, vi } from "vitest";

const { execute } = vi.hoisted(() => ({ execute: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/db", async () => {
  const { drizzle } = await import("drizzle-orm/pg-proxy");
  return { db: drizzle(execute) };
});

import { getPublicSmelters } from "@/features/intelligence/server/get-public-smelters";

import { getPublicExports } from "./get-public-exports";
import { getPublicGdp } from "./get-public-gdp";
import { getPublicInvestment } from "./get-public-investment";

describe("Economy public query eligibility", () => {
  beforeEach(() => {
    execute.mockReset();
    execute.mockResolvedValue({ rows: [] });
  });

  it.each([
    ["PDB", () => getPublicGdp({}), "economic_gdp_annual_metrics"],
    ["investasi", () => getPublicInvestment({}), "mining_investment_annual"],
    ["ekspor", () => getPublicExports({}), "minerba_exports_annual"],
  ])("filters %s to verified and published before returning data", async (_label, query, relation) => {
    await query();
    const sql = execute.mock.calls[0]?.[0] as string;
    expect(sql).toContain(relation);
    expect(sql).toContain('"verification_status" = $');
    expect(sql).toContain('"publication_status" = $');
    expect(execute.mock.calls[0]?.[1]).toEqual(
      expect.arrayContaining(["verified", "published"]),
    );
  });

  it("requires eligible facilities, operators, commodities, and canonical sources for smelters", async () => {
    await getPublicSmelters({});
    const sql = execute.mock.calls[0]?.[0] as string;
    expect(sql).toContain('"smelter_facilities"."verification_status" = $');
    expect(sql).toContain('"smelter_facilities"."publication_status" = $');
    expect(sql).toContain('"smelter_operators"."is_active" = $');
    expect(sql).toContain('"commodities"."is_active" = $');
    expect(sql).toContain('"sources"."is_active" = $');
    expect(sql).toContain('"sources"."verification_status" = $');
    expect(execute.mock.calls[0]?.[1]).toEqual(
      expect.arrayContaining(["verified", "published"]),
    );
  });
});
