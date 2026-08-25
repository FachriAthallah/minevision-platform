import { describe, expect, it } from "vitest";

import { exportQuerySchema } from "./export-query";

describe("exportQuerySchema", () => {
  it("menerima query kosong", () => {
    expect(exportQuerySchema.parse({})).toEqual({});
  });

  it("menerima seluruh filter yang valid", () => {
    expect(
      exportQuerySchema.parse({
        commodity: "tembaga",
        origin: "id",
        destination: "cn",
        availability: "reported",
        coverage: "destination_country",
        fromYear: "2019",
        toYear: "2025",
      }),
    ).toEqual({
      commodity: "tembaga",
      origin: "ID",
      destination: "CN",
      availability: "reported",
      coverage: "destination_country",
      fromYear: 2019,
      toYear: 2025,
    });
  });

  it("menerima status not_reported", () => {
    expect(
      exportQuerySchema.parse({ availability: "not_reported" }).availability,
    ).toBe("not_reported");
  });

  it("menolak slug komoditas yang tidak valid", () => {
    expect(() =>
      exportQuerySchema.parse({ commodity: "Bijih Tembaga" }),
    ).toThrow();
  });

  it("menolak status ketersediaan yang tidak dikenal", () => {
    expect(() =>
      exportQuerySchema.parse({ availability: "missing" }),
    ).toThrow();
  });

  it("menolak tahun di luar rentang", () => {
    expect(() => exportQuerySchema.parse({ toYear: 2200 })).toThrow();
  });

  it("menolak fromYear yang lebih besar dari toYear", () => {
    expect(() =>
      exportQuerySchema.parse({ fromYear: 2025, toYear: 2019 }),
    ).toThrow();
  });
});
