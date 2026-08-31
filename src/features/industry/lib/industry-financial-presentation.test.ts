import { describe, expect, it } from "vitest";

import {
  buildFinancialPresentation,
  scaleDecimalForDisplay,
} from "./industry-financial-presentation";

describe("scaleDecimalForDisplay", () => {
  it("mengubah nilai USD dasar menjadi juta USD dengan pembulatan", () => {
    expect(scaleDecimalForDisplay("1256789000.00", 6)).toBe("1256.79");
  });

  it("mengubah nilai rupiah dasar menjadi triliun rupiah", () => {
    expect(scaleDecimalForDisplay("449670000000.00", 12)).toBe("0.45");
  });

  it("mempertahankan tanda negatif", () => {
    expect(scaleDecimalForDisplay("-449670000000.00", 12)).toBe("-0.45");
  });
});

describe("buildFinancialPresentation", () => {
  it("menggunakan Juta USD untuk mata uang USD", () => {
    expect(buildFinancialPresentation("3000000.00", "USD")).toEqual({
      value: "3.00",
      unitCode: "million_usd",
      unitLabel: "Juta USD",
      fractionDigits: 2,
    });
  });

  it("menggunakan Triliun Rupiah untuk mata uang IDR", () => {
    expect(buildFinancialPresentation("12500000000000.00", "IDR")).toEqual({
      value: "12.50",
      unitCode: "trillion_idr",
      unitLabel: "Triliun Rupiah",
      fractionDigits: 2,
    });
  });
});
