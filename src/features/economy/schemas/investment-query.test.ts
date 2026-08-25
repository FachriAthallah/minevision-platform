import { describe, expect, it } from "vitest";

import { investmentQuerySchema } from "./investment-query";

describe("investmentQuerySchema", () => {
  it("menerima query kosong", () => {
    expect(investmentQuerySchema.parse({})).toEqual({});
  });

  it("menerima seluruh filter yang valid", () => {
    expect(
      investmentQuerySchema.parse({
        region: "id",
        origin: "pma",
        fromYear: "2020",
        toYear: "2025",
      }),
    ).toEqual({
      region: "ID",
      origin: "pma",
      fromYear: 2020,
      toYear: 2025,
    });
  });

  it("menerima filter PMDN", () => {
    expect(investmentQuerySchema.parse({ origin: "pmdn" }).origin).toBe(
      "pmdn",
    );
  });

  it("menolak origin yang tidak dikenal", () => {
    expect(() => investmentQuerySchema.parse({ origin: "foreign" })).toThrow();
  });

  it("menolak tahun di luar rentang", () => {
    expect(() => investmentQuerySchema.parse({ fromYear: 1800 })).toThrow();
  });

  it("menolak fromYear yang lebih besar dari toYear", () => {
    expect(() =>
      investmentQuerySchema.parse({ fromYear: 2025, toYear: 2020 }),
    ).toThrow();
  });
});
