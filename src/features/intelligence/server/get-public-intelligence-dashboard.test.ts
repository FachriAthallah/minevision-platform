import { beforeEach, describe, expect, it, vi } from "vitest";

const { execute } = vi.hoisted(() => ({ execute: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/db", async () => {
  const { drizzle } = await import("drizzle-orm/pg-proxy");
  return { db: drizzle(execute) };
});

import { getPublicIntelligenceDashboard } from "./get-public-intelligence-dashboard";

describe("public Intelligence dashboard query", () => {
  beforeEach(() => execute.mockReset());

  it("uses canonical public-default filters with a bounded query count", async () => {
    const commodities = [
      ["id-batubara", "Batubara", "batubara", null, "Energi", 1],
      ["id-nikel", "Nikel", "nikel", "Ni", "Logam", 2],
      ["id-emas", "Emas", "emas", "Au", "Logam", 3],
      ["id-tembaga", "Tembaga", "tembaga", "Cu", "Logam", 4],
      ["id-timah", "Timah", "timah", "Sn", "Logam", 5],
      ["id-bijih-besi", "Bijih Besi", "bijih-besi", null, "Logam", 6],
      ["id-bauksit", "Bauksit", "bauksit", null, "Logam", 7],
    ];
    execute.mockResolvedValueOnce({ rows: commodities }).mockResolvedValue({ rows: [] });

    const dashboard = await getPublicIntelligenceDashboard();

    expect(dashboard.commodities).toHaveLength(7);
    expect(execute).toHaveBeenCalledTimes(5);
    const productionSql = execute.mock.calls[1]?.[0] as string;
    const priceSql = execute.mock.calls[2]?.[0] as string;
    const coverageSql = execute.mock.calls[3]?.[0] as string;
    for (const sql of [productionSql, priceSql]) {
      expect(sql).toContain('"is_canonical"');
      expect(sql).toContain('"is_public_default"');
      expect(sql).toContain('"publication_status"');
      expect(sql).toContain('"verification_status"');
    }
    expect(productionSql).toContain('"production_scope"');
    expect(coverageSql).toContain('"commodity_region_coverage"."verification_status" = $');
    expect(coverageSql).toContain('"commodity_region_coverage"."publication_status" = $');
    expect(coverageSql).toContain('inner join "regions"');
    expect(coverageSql).toContain('inner join "sources"');
  });

  it("returns early when no eligible commodity exists", async () => {
    execute.mockResolvedValueOnce({ rows: [] });
    const dashboard = await getPublicIntelligenceDashboard({ commodity: "nikel" });
    expect(dashboard.commodities).toEqual([]);
    expect(execute).toHaveBeenCalledTimes(1);
  });
});
