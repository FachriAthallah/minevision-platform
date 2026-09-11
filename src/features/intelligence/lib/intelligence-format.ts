const idNumber = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 2,
});

export function formatCompactNumber(value: number): string {
  const absolute = Math.abs(value);
  const scales = [
    { threshold: 1_000_000_000, divisor: 1_000_000_000, suffix: "miliar" },
    { threshold: 1_000_000, divisor: 1_000_000, suffix: "juta" },
    { threshold: 1_000, divisor: 1_000, suffix: "ribu" },
  ] as const;
  const scale = scales.find(({ threshold }) => absolute >= threshold);

  if (!scale) return idNumber.format(value);
  return `${idNumber.format(value / scale.divisor)} ${scale.suffix}`;
}

export function formatCompactValue(value: number, unit?: string | null): string {
  return [formatCompactNumber(value), unit].filter(Boolean).join(" ");
}

export function formatFullValue(value: number, unit?: string | null): string {
  return [
    value.toLocaleString("id-ID", { maximumFractionDigits: 6 }),
    unit,
  ]
    .filter(Boolean)
    .join(" ");
}

export function formatPriceValue(
  value: number,
  currencyCode: string,
  unitSymbol: string,
  compact = true,
): string {
  const number = compact ? formatCompactNumber(value) : formatFullValue(value);
  return `${number} ${currencyCode}/${unitSymbol}`;
}

export function formatPercentage(value: number | null): string {
  if (value === null) return "Belum dapat dihitung";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toLocaleString("id-ID", { maximumFractionDigits: 2 })}%`;
}
