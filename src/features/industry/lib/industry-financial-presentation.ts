import type { PublicIndustryFinancialRecord } from "../types/industry";

type FinancialPresentation = PublicIndustryFinancialRecord["presentation"];

function powerOfTen(exponent: number): bigint {
  return BigInt(`1${"0".repeat(exponent)}`);
}

export function scaleDecimalForDisplay(
  rawValue: string,
  divisorPower: number,
  fractionDigits = 2,
): string {
  if (divisorPower < 0 || fractionDigits < 0) {
    throw new RangeError("Pangkat pembagi dan digit desimal tidak boleh negatif");
  }

  const normalizedValue = rawValue.trim();
  const isNegative = normalizedValue.startsWith("-");
  const unsignedValue = normalizedValue.replace(/^[+-]/, "");
  const [integerPart = "0", fractionalPart = ""] = unsignedValue.split(".");
  const combinedDigits = `${integerPart || "0"}${fractionalPart}`.replace(
    /^0+(?=\d)/,
    "",
  );
  const absoluteValue = BigInt(combinedDigits || "0");
  const denominatorPower = fractionalPart.length + divisorPower;
  const numerator = absoluteValue * powerOfTen(fractionDigits);
  const denominator = powerOfTen(denominatorPower);
  let roundedValue = numerator / denominator;
  const remainder = numerator % denominator;

  if (remainder * BigInt(2) >= denominator) {
    roundedValue += BigInt(1);
  }

  const sign = isNegative && roundedValue !== BigInt(0) ? "-" : "";

  if (fractionDigits === 0) {
    return `${sign}${roundedValue.toString()}`;
  }

  const paddedValue = roundedValue
    .toString()
    .padStart(fractionDigits + 1, "0");
  const wholePart = paddedValue.slice(0, -fractionDigits) || "0";
  const decimalPart = paddedValue.slice(-fractionDigits);

  return `${sign}${wholePart}.${decimalPart}`;
}

export function buildFinancialPresentation(
  amount: string,
  currencyCode: string,
): FinancialPresentation {
  if (currencyCode === "USD") {
    return {
      value: scaleDecimalForDisplay(amount, 6),
      unitCode: "million_usd",
      unitLabel: "Juta USD",
      fractionDigits: 2,
    };
  }

  if (currencyCode === "IDR") {
    return {
      value: scaleDecimalForDisplay(amount, 12),
      unitCode: "trillion_idr",
      unitLabel: "Triliun Rupiah",
      fractionDigits: 2,
    };
  }

  return {
    value: scaleDecimalForDisplay(amount, 0),
    unitCode: "base_currency",
    unitLabel: currencyCode,
    fractionDigits: 2,
  };
}
