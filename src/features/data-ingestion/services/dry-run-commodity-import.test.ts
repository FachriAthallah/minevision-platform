import { describe, expect, it } from "vitest";

import {
  COMMODITY_DRY_RUN_TABLES,
  createCommodityDryRunKey,
  createCommodityDryRunPlan,
  createEmptyCommodityDryRunExistingKeys,
  createGlobalStatisticSetKey,
  createResourceStatisticKey,
} from "./dry-run-commodity-import";
import type { ValidatedCommodityImport } from "./validate-commodity-import";

function createValidatedImport(): ValidatedCommodityImport {
  return {
    manifest: {
      sourceCatalog: [
        { slug: "source-primary" },
        { slug: "source-supporting" },
      ],
      countryCatalog: [
        { slug: "indonesia" },
        { slug: "australia" },
      ],
    },
    commodityFiles: [
      {
        filePath: "commodities/nikel.json",
        data: {
          commoditySlug: "nikel",
          profile: {
            slug: "nikel",
            sources: [
              { sourceSlug: "source-primary" },
              { sourceSlug: "source-supporting" },
            ],
          },
          resourceStatistics: [
            {
              statisticYear: 2024,
              statisticType: "reserve",
              materialBasis: "ore",
              recordType: "actual",
              supportingSources: [
                {
                  sourceSlug: "source-supporting",
                  sourceRole: "cross_check",
                  citationLabel: "Tabel 1",
                  pageReference: null,
                },
              ],
            },
          ],
          productionLocations: [
            { regionSlug: "sulawesi-tenggara", recordType: "actual" },
            { regionSlug: "maluku-utara", recordType: "actual" },
          ],
          globalStatisticSets: [
            {
              statisticYear: 2024,
              metricCode: "mine_production",
              basisCode: "contained_metal",
              recordType: "actual",
              entries: [
                { countryRegionSlug: "indonesia" },
                { countryRegionSlug: "australia" },
              ],
              supportingSources: [
                {
                  sourceSlug: "source-supporting",
                  sourceRole: "supporting",
                  citationLabel: null,
                  pageReference: "10",
                },
              ],
            },
          ],
          producers: [
            { producerKey: "produsen-a" },
            { producerKey: "produsen-b" },
          ],
        },
      },
    ],
  } as unknown as ValidatedCommodityImport;
}

describe("Commodity dry-run key", () => {
  it("membedakan null dari string kosong", () => {
    expect(createCommodityDryRunKey("a", null)).not.toBe(
      createCommodityDryRunKey("a", ""),
    );
  });

  it("membentuk natural key resource secara deterministik", () => {
    expect(
      createResourceStatisticKey(
        "nikel",
        2024,
        "reserve",
        "ore",
        "actual",
      ),
    ).toBe(
      createResourceStatisticKey(
        "nikel",
        2024,
        "reserve",
        "ore",
        "actual",
      ),
    );
  });

  it("membedakan material basis resource", () => {
    expect(
      createResourceStatisticKey(
        "nikel",
        2024,
        "reserve",
        "ore",
        "actual",
      ),
    ).not.toBe(
      createResourceStatisticKey(
        "nikel",
        2024,
        "reserve",
        "contained_metal",
        "actual",
      ),
    );
  });

  it("membentuk natural key global set secara deterministik", () => {
    const value = createGlobalStatisticSetKey(
      "nikel",
      2024,
      "mine_production",
      "contained_metal",
      "actual",
    );

    expect(value).toContain("nikel");
    expect(value).toContain("mine_production");
  });
});

describe("createCommodityDryRunPlan", () => {
  it("mencakup seluruh 13 tabel target", () => {
    const plan = createCommodityDryRunPlan(
      createValidatedImport(),
      createEmptyCommodityDryRunExistingKeys(),
    );

    expect(plan.tables.map((table) => table.table)).toEqual(
      COMMODITY_DRY_RUN_TABLES,
    );
  });

  it("menghitung seluruh parent dan child record", () => {
    const plan = createCommodityDryRunPlan(
      createValidatedImport(),
      createEmptyCommodityDryRunExistingKeys(),
    );
    const countByTable = Object.fromEntries(
      plan.tables.map((table) => [table.table, table.planned]),
    );

    expect(countByTable).toMatchObject({
      sources: 2,
      regions: 2,
      commodities: 1,
      contents: 1,
      content_sources: 2,
      commodity_contents: 1,
      commodity_resource_statistics: 1,
      commodity_resource_statistic_sources: 1,
      commodity_production_locations: 2,
      commodity_global_statistic_sets: 1,
      commodity_global_statistic_entries: 2,
      commodity_global_statistic_set_sources: 1,
      commodity_producers: 2,
    });
    expect(plan.totalPlanned).toBe(19);
  });

  it("mengklasifikasikan natural key baru sebagai insert", () => {
    const plan = createCommodityDryRunPlan(
      createValidatedImport(),
      createEmptyCommodityDryRunExistingKeys(),
    );

    expect(plan.totalInserts).toBe(plan.totalPlanned);
    expect(plan.totalUpdates).toBe(0);
  });

  it("mengklasifikasikan natural key yang tersedia sebagai update", () => {
    const validatedImport = createValidatedImport();
    const emptyPlan = createCommodityDryRunPlan(
      validatedImport,
      createEmptyCommodityDryRunExistingKeys(),
    );
    const existing = createEmptyCommodityDryRunExistingKeys();

    for (const table of COMMODITY_DRY_RUN_TABLES) {
      existing[table] = [...emptyPlan.keys[table]];
    }

    const rerunPlan = createCommodityDryRunPlan(validatedImport, existing);

    expect(rerunPlan.totalInserts).toBe(0);
    expect(rerunPlan.totalUpdates).toBe(rerunPlan.totalPlanned);
  });

  it("menghitung rencana campuran insert dan update", () => {
    const existing = createEmptyCommodityDryRunExistingKeys();
    existing.sources = ["source-primary"];
    existing.commodities = ["nikel"];

    const plan = createCommodityDryRunPlan(createValidatedImport(), existing);

    expect(plan.totalUpdates).toBe(2);
    expect(plan.totalInserts).toBe(plan.totalPlanned - 2);
  });

  it("tidak menghasilkan operasi delete", () => {
    const existing = createEmptyCommodityDryRunExistingKeys();
    existing.sources = ["source-lama-yang-tidak-ada-di-staging"];

    const plan = createCommodityDryRunPlan(createValidatedImport(), existing);

    expect(plan.tables.find((table) => table.table === "sources")).toEqual({
      table: "sources",
      planned: 2,
      inserts: 2,
      updates: 0,
    });
  });
});
