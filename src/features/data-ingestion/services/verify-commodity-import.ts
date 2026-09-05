import {
  COMMODITY_DRY_RUN_TABLES,
  createCommodityDryRunKeys,
  type CommodityDryRunExistingKeys,
  type CommodityDryRunTable,
} from "./dry-run-commodity-import";
import type { ValidatedCommodityImport } from "./validate-commodity-import";

export type CommodityVerificationSnapshot = {
  keys: CommodityDryRunExistingKeys;
  invalidRows: Record<CommodityDryRunTable, number>;
  invalidGlobalRankSets: number;
  missingRlsTables: string[];
  missingPolicies: string[];
  fingerprint: string;
};

export type CommodityVerificationTableResult = {
  table: CommodityDryRunTable;
  expected: number;
  actual: number;
  missing: string[];
  unexpected: string[];
  duplicates: number;
  invalidRows: number;
  passed: boolean;
};

export type CommodityVerificationReport = {
  passed: boolean;
  expectedTotal: number;
  actualTotal: number;
  fingerprint: string;
  tables: CommodityVerificationTableResult[];
  invalidGlobalRankSets: number;
  missingRlsTables: string[];
  missingPolicies: string[];
};

function difference(left: readonly string[], right: Set<string>) {
  return [...new Set(left)]
    .filter((value) => !right.has(value))
    .sort((first, second) => first.localeCompare(second));
}

export function createEmptyCommodityVerificationInvalidRows() {
  const invalidRows = {} as Record<CommodityDryRunTable, number>;

  for (const table of COMMODITY_DRY_RUN_TABLES) {
    invalidRows[table] = 0;
  }

  return invalidRows;
}

export function evaluateCommodityVerification(
  validatedImport: ValidatedCommodityImport,
  snapshot: CommodityVerificationSnapshot,
): CommodityVerificationReport {
  const expectedKeys = createCommodityDryRunKeys(validatedImport);

  const tables = COMMODITY_DRY_RUN_TABLES.map<CommodityVerificationTableResult>(
    (table) => {
      const expected = expectedKeys[table];
      const actual = snapshot.keys[table];

      const expectedSet = new Set(expected);
      const actualSet = new Set(actual);

      const missing = difference(expected, actualSet);
      const unexpected = difference(actual, expectedSet);
      const duplicates = actual.length - actualSet.size;
      const invalidRows = snapshot.invalidRows[table];

      return {
        table,
        expected: expected.length,
        actual: actual.length,
        missing,
        unexpected,
        duplicates,
        invalidRows,
        passed:
          missing.length === 0 &&
          unexpected.length === 0 &&
          duplicates === 0 &&
          invalidRows === 0,
      };
    },
  );

  return {
    passed:
      tables.every((table) => table.passed) &&
      snapshot.invalidGlobalRankSets === 0 &&
      snapshot.missingRlsTables.length === 0 &&
      snapshot.missingPolicies.length === 0,

    expectedTotal: tables.reduce((total, table) => total + table.expected, 0),

    actualTotal: tables.reduce((total, table) => total + table.actual, 0),

    fingerprint: snapshot.fingerprint,
    tables,
    invalidGlobalRankSets: snapshot.invalidGlobalRankSets,
    missingRlsTables: [...snapshot.missingRlsTables].sort(),
    missingPolicies: [...snapshot.missingPolicies].sort(),
  };
}
