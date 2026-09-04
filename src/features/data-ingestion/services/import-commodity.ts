import {
  COMMODITY_DRY_RUN_TABLES,
  createCommodityDryRunKeys,
  type CommodityDryRunTable,
} from "./dry-run-commodity-import";
import type { ValidatedCommodityImport } from "./validate-commodity-import";

export const COMMODITY_IMPORT_TABLES = COMMODITY_DRY_RUN_TABLES;

export type CommodityImportTable = CommodityDryRunTable;

export type CommodityImportTableSummary = {
  table: CommodityImportTable;
  processed: number;
};

export type CommodityImportSummary = {
  totalProcessed: number;
  tables: CommodityImportTableSummary[];
};

export type CommodityImportStepWriter = (
  table: CommodityImportTable,
  validatedImport: ValidatedCommodityImport,
) => Promise<number>;

export function hasCommodityApplyFlag(arguments_: readonly string[]) {
  return arguments_.includes("--apply");
}

export function assertCommodityApplyFlag(arguments_: readonly string[]) {
  if (!hasCommodityApplyFlag(arguments_)) {
    throw new Error(
      "Import dibatalkan karena flag --apply tidak diberikan. " +
        "Jalankan validate, preflight, dan dry-run terlebih dahulu.",
    );
  }
}

export async function executeCommodityImportSteps(
  validatedImport: ValidatedCommodityImport,
  writeStep: CommodityImportStepWriter,
): Promise<CommodityImportSummary> {
  const plannedKeys = createCommodityDryRunKeys(validatedImport);
  const tables: CommodityImportTableSummary[] = [];

  for (const table of COMMODITY_IMPORT_TABLES) {
    const expected = plannedKeys[table].length;
    const processed = await writeStep(table, validatedImport);

    if (processed !== expected) {
      throw new Error(
        `Jumlah hasil ${table} tidak sesuai: expected=${expected}, processed=${processed}`,
      );
    }

    tables.push({ table, processed });
  }

  return {
    totalProcessed: tables.reduce(
      (total, table) => total + table.processed,
      0,
    ),
    tables,
  };
}
