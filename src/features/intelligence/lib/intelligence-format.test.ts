import { describe, expect, it } from "vitest";

import {
  formatCompactNumber,
  formatCompactValue,
  formatPriceValue,
} from "./intelligence-format";

describe("Intelligence number formatter", () => {
  it.each([
    [831_000_000, "831 juta"],
    [1_250_000_000, "1,25 miliar"],
    [60_803, "60,8 ribu"],
    [4_491_356, "4,49 juta"],
    [999, "999"],
  ])("formats %s with Indonesian compact scale", (value, expected) => {
    expect(formatCompactNumber(value)).toBe(expected);
  });

  it("keeps the canonical measurement unit", () => {
    expect(formatCompactValue(60_803, "kg")).toBe("60,8 ribu kg");
  });

  it("formats currency and unit without scaling small prices", () => {
    expect(formatPriceValue(121.44, "USD", "ton")).toBe("121,44 USD/ton");
    expect(formatPriceValue(1_500_000, "USD", "ton")).toBe("1,5 juta USD/ton");
  });
});
