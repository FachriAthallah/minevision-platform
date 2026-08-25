import { describe, expect, it } from "vitest";

import { gdpQuerySchema } from "./gdp-query";

describe("gdpQuerySchema", () => {
  it("menerima query kosong", () => {
    const result = gdpQuerySchema.safeParse({});

    expect(result.success).toBe(true);
  });

  it("mengubah tahun menjadi number dan kode wilayah menjadi uppercase", () => {
    const result = gdpQuerySchema.safeParse({
      region: " idn ",
      priceBasis: "current_prices",
      fromYear: "2020",
      toYear: "2022",
    });

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(result.data).toEqual({
      region: "IDN",
      priceBasis: "current_prices",
      fromYear: 2020,
      toYear: 2022,
    });
  });

  it("menolak fromYear yang lebih besar dari toYear", () => {
    const result = gdpQuerySchema.safeParse({
      fromYear: "2025",
      toYear: "2019",
    });

    expect(result.success).toBe(false);

    if (result.success) {
      return;
    }

    expect(
      result.error.flatten().fieldErrors.fromYear,
    ).toContain(
      "fromYear tidak boleh lebih besar dari toYear",
    );
  });

  it("menolak kode wilayah dengan format tidak valid", () => {
    const result = gdpQuerySchema.safeParse({
      region: "ID N",
    });

    expect(result.success).toBe(false);
  });

  it("menolak priceBasis yang tidak didukung", () => {
    const result = gdpQuerySchema.safeParse({
      priceBasis: "market_prices",
    });

    expect(result.success).toBe(false);
  });

  it("menolak tahun di luar batas yang diperbolehkan", () => {
    const result = gdpQuerySchema.safeParse({
      fromYear: "1899",
      toYear: "2101",
    });

    expect(result.success).toBe(false);
  });
});