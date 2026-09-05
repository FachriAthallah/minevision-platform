import { describe, expect, it, vi } from "vitest";

import {
  COMMODITY_IMPORT_TABLES,
  assertCommodityApplyFlag,
  executeCommodityImportSteps,
} from "./import-commodity";
import type { ValidatedCommodityImport } from "./validate-commodity-import";

function createValidatedImport(): ValidatedCommodityImport {
  return {
    manifest: {
      schemaVersion: "1.0",
      datasetName: "Commodity import test",
      description: null,
      effectiveDate: "2024-12-31",
      commodityFiles: [],
      sourceCatalog: [],
      countryCatalog: [],
    },
    commodityFiles: [],
  };
}

describe("Commodity importer guard", () => {
  it("mewajibkan flag --apply", () => {
    expect(() => assertCommodityApplyFlag([])).toThrow(/--apply/);
  });

  it("menerima flag --apply", () => {
    expect(() => assertCommodityApplyFlag(["--apply"])).not.toThrow();
  });
});

describe("executeCommodityImportSteps", () => {
  it("menjalankan seluruh tabel dalam urutan parent-child", async () => {
    const visited: string[] = [];
    const validatedImport = createValidatedImport();

    const summary = await executeCommodityImportSteps(
      validatedImport,
      async (table) => {
        visited.push(table);
        return 0;
      },
    );

    expect(visited).toEqual(COMMODITY_IMPORT_TABLES);
    expect(summary.tables).toHaveLength(13);
    expect(summary.totalProcessed).toBe(0);
  });

  it("tidak memiliki tahap delete", () => {
    expect(
      COMMODITY_IMPORT_TABLES.some((table) => table.includes("delete")),
    ).toBe(false);
  });

  it("menghentikan tahap berikutnya ketika satu tahap gagal", async () => {
    const visited: string[] = [];

    await expect(
      executeCommodityImportSteps(
        createValidatedImport(),
        async (table) => {
          visited.push(table);

          if (table === "contents") {
            throw new Error("simulasi kegagalan");
          }

          return 0;
        },
      ),
    ).rejects.toThrow("simulasi kegagalan");

    expect(visited).toEqual([
      "sources",
      "regions",
      "commodities",
      "contents",
    ]);
  });

  it("menolak jumlah processed yang berbeda dari rencana", async () => {
    const writer = vi.fn(async () => 1);

    await expect(
      executeCommodityImportSteps(createValidatedImport(), writer),
    ).rejects.toThrow(/Jumlah hasil sources tidak sesuai/);

    expect(writer).toHaveBeenCalledTimes(1);
  });
});
