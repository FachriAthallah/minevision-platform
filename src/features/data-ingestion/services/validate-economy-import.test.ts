import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { loadEconomyImport, validateEconomyImport } from "./validate-economy-import";

describe("validateEconomyImport", () => {
  it("memvalidasi kelima dataset final dan seluruh count", async () => {
    const result = await loadEconomyImport(resolve("data/staging/economy/manifest.json"));
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.files.gdp.records).toHaveLength(7);
    expect(result.data.files.investment.records).toHaveLength(14);
    expect(result.data.files.exports.records).toHaveLength(49);
    expect(result.data.files.smelters.records).toHaveLength(9);
    expect(result.data.files.regulations.records).toHaveLength(20);
    expect(result.data.files.exports.records.filter((row) => row.availability === "not_reported")).toHaveLength(14);
    expect(result.data.files.exports.records.filter((row) => row.availability === "not_reported").every((row) => row.netWeightValue === null && row.fobValue === null)).toBe(true);
  });

  it("mendeteksi missing file", () => {
    const result = validateEconomyImport({}, []);
    expect(result.success).toBe(false);
  });
});
