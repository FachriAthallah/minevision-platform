import { describe, expect, it } from "vitest";

import {
  createCommodityDryRunKeys,
  createEmptyCommodityDryRunExistingKeys,
} from "./dry-run-commodity-import";
import type { ValidatedCommodityImport } from "./validate-commodity-import";
import {
  createEmptyCommodityVerificationInvalidRows,
  evaluateCommodityVerification,
  type CommodityVerificationSnapshot,
} from "./verify-commodity-import";

function createValidatedImport(): ValidatedCommodityImport {
  return {
    manifest: {
      schemaVersion: "1.0",
      datasetName: "Commodity verification test",
      description: null,
      effectiveDate: "2024-12-31",

      commodityFiles: [],

      sourceCatalog: [
        {
          slug: "source-test",
          name: "Source Test",
          type: "government",
          organization: "Test Organization",
          url: "https://example.com/source",
          description: null,
          isOfficial: true,
          verificationStatus: "verified",
        },
      ],

      countryCatalog: [],
    },

    commodityFiles: [],
  };
}

function createSnapshot(
  validatedImport: ValidatedCommodityImport,
): CommodityVerificationSnapshot {
  return {
    keys: createCommodityDryRunKeys(validatedImport),
    invalidRows: createEmptyCommodityVerificationInvalidRows(),
    invalidGlobalRankSets: 0,
    missingRlsTables: [],
    missingPolicies: [],
    fingerprint: "abc123",
  };
}

describe("evaluateCommodityVerification", () => {
  it("menerima snapshot yang sama dengan manifest", () => {
    const validatedImport = createValidatedImport();

    const report = evaluateCommodityVerification(
      validatedImport,
      createSnapshot(validatedImport),
    );

    expect(report.passed).toBe(true);
    expect(report.expectedTotal).toBe(1);
    expect(report.actualTotal).toBe(1);
    expect(report.fingerprint).toBe("abc123");
  });

  it("menolak natural key yang hilang", () => {
    const validatedImport = createValidatedImport();
    const snapshot = createSnapshot(validatedImport);

    snapshot.keys.sources = [];

    const report = evaluateCommodityVerification(validatedImport, snapshot);

    const sources = report.tables.find((table) => table.table === "sources");

    expect(report.passed).toBe(false);
    expect(sources?.missing).toEqual(["source-test"]);
  });

  it("menolak natural key di luar manifest", () => {
    const validatedImport = createValidatedImport();
    const snapshot = createSnapshot(validatedImport);

    snapshot.keys.sources = ["source-test", "unexpected-source"];

    const report = evaluateCommodityVerification(validatedImport, snapshot);

    const sources = report.tables.find((table) => table.table === "sources");

    expect(report.passed).toBe(false);
    expect(sources?.unexpected).toEqual(["unexpected-source"]);
  });

  it("menolak natural key duplikat", () => {
    const validatedImport = createValidatedImport();
    const snapshot = createSnapshot(validatedImport);

    snapshot.keys.sources = ["source-test", "source-test"];

    const report = evaluateCommodityVerification(validatedImport, snapshot);

    const sources = report.tables.find((table) => table.table === "sources");

    expect(report.passed).toBe(false);
    expect(sources?.duplicates).toBe(1);
  });

  it("menolak record dengan integritas publikasi tidak valid", () => {
    const validatedImport = createValidatedImport();
    const snapshot = createSnapshot(validatedImport);

    snapshot.invalidRows.sources = 1;

    const report = evaluateCommodityVerification(validatedImport, snapshot);

    expect(report.passed).toBe(false);
    expect(report.tables[0].invalidRows).toBe(1);
  });

  it("menolak ranking global, RLS, atau policy yang tidak lengkap", () => {
    const validatedImport = createValidatedImport();
    const snapshot = createSnapshot(validatedImport);

    snapshot.invalidGlobalRankSets = 1;
    snapshot.missingRlsTables = ["commodity_producers"];
    snapshot.missingPolicies = ["commodity_producers_public_read"];

    const report = evaluateCommodityVerification(validatedImport, snapshot);

    expect(report.passed).toBe(false);
    expect(report.invalidGlobalRankSets).toBe(1);

    expect(report.missingRlsTables).toEqual(["commodity_producers"]);

    expect(report.missingPolicies).toEqual(["commodity_producers_public_read"]);
  });

  it("helper snapshot kosong mencakup seluruh tabel", () => {
    expect(Object.keys(createEmptyCommodityDryRunExistingKeys())).toHaveLength(
      13,
    );

    expect(
      Object.keys(createEmptyCommodityVerificationInvalidRows()),
    ).toHaveLength(13);
  });
});
