import { describe, expect, it } from "vitest";

import { smelterQuerySchema } from "./smelter-query";

describe("smelterQuerySchema", () => {
  it("menerima query kosong", () => {
    expect(smelterQuerySchema.parse({})).toEqual({});
  });

  it("menerima seluruh filter yang valid", () => {
    expect(
      smelterQuerySchema.parse({
        commodity: "nikel",
        province: "Sulawesi Tengah",
        operator: "pt-contoh-industri",
        facilityType: "smelter",
        status: "operating",
      }),
    ).toEqual({
      commodity: "nikel",
      province: "Sulawesi Tengah",
      operator: "pt-contoh-industri",
      facilityType: "smelter",
      status: "operating",
    });
  });

  it("merapikan spasi pada nama provinsi", () => {
    expect(
      smelterQuerySchema.parse({ province: "  Maluku Utara  " }).province,
    ).toBe("Maluku Utara");
  });

  it("menolak slug komoditas yang tidak valid", () => {
    expect(() =>
      smelterQuerySchema.parse({ commodity: "Nikel Indonesia" }),
    ).toThrow();
  });

  it("menolak tipe fasilitas yang tidak dikenal", () => {
    expect(() =>
      smelterQuerySchema.parse({ facilityType: "factory" }),
    ).toThrow();
  });

  it("menolak status fasilitas yang tidak dikenal", () => {
    expect(() =>
      smelterQuerySchema.parse({ status: "active" }),
    ).toThrow();
  });
});
