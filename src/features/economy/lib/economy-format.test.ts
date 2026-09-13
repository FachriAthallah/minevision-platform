import { describe, expect, it } from "vitest";

import {
  formatEconomyCompactNumber,
  formatEconomyCurrency,
  formatEconomyPercentage,
  formatEconomyValue,
} from "./economy-format";

describe("Economy public number formatters", () => {
  it("formats thousand, million, billion, and trillion using id-ID", () => {
    expect(formatEconomyCompactNumber(60_803)).toBe("60,8 ribu");
    expect(formatEconomyCompactNumber(4_491_356)).toBe("4,49 juta");
    expect(formatEconomyCompactNumber(16_400_000_000)).toBe("16,4 miliar");
    expect(formatEconomyCompactNumber(282_900_000_000_000)).toBe("282,9 triliun");
  });

  it("keeps currency and source scale explicit", () => {
    expect(formatEconomyCurrency(282_900, "IDR", "billion")).toBe(
      "Rp 282,9 triliun",
    );
    expect(formatEconomyCurrency(16.4, "USD", "billion")).toBe(
      "USD 16,4 miliar",
    );
  });

  it("formats percentages and capacity units without silent conversion", () => {
    expect(formatEconomyPercentage(1.5)).toBe("1,5%");
    expect(formatEconomyPercentage(1.5, true)).toBe("+1,5%");
    expect(formatEconomyPercentage(-2.25)).toBe("-2,25%");
    expect(formatEconomyPercentage(null)).toBe("Belum tersedia");
    expect(formatEconomyValue(60_803, "kg")).toBe("60,8 ribu kg");
  });
});
