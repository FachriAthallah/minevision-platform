const idNumber = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 2,
});

const currencyPrefixes: Record<string, string> = {
  IDR: "Rp",
  USD: "USD",
};

const scaleMultipliers: Record<string, number> = {
  unit: 1,
  thousand: 1_000,
  million: 1_000_000,
  billion: 1_000_000_000,
  trillion: 1_000_000_000_000,
};

const compactScales = [
  { threshold: 1_000_000_000_000, divisor: 1_000_000_000_000, suffix: "triliun" },
  { threshold: 1_000_000_000, divisor: 1_000_000_000, suffix: "miliar" },
  { threshold: 1_000_000, divisor: 1_000_000, suffix: "juta" },
  { threshold: 1_000, divisor: 1_000, suffix: "ribu" },
] as const;

export function formatEconomyNumber(value: number): string {
  return idNumber.format(value);
}

export function formatEconomyCompactNumber(value: number): string {
  const scale = compactScales.find(
    ({ threshold }) => Math.abs(value) >= threshold,
  );

  if (!scale) return formatEconomyNumber(value);
  return `${formatEconomyNumber(value / scale.divisor)} ${scale.suffix}`;
}

export function formatEconomyPercentage(
  value: number | null,
  showPositiveSign = false,
): string {
  if (value === null || !Number.isFinite(value)) return "Belum tersedia";
  const prefix = showPositiveSign && value > 0 ? "+" : "";
  return `${prefix}${formatEconomyNumber(value)}%`;
}

export function formatEconomyCurrency(
  value: number,
  currencyCode: string,
  valueScale = "unit",
): string {
  const multiplier = scaleMultipliers[valueScale] ?? 1;
  const normalizedValue = value * multiplier;
  const prefix = currencyPrefixes[currencyCode] ?? currencyCode;
  return `${prefix} ${formatEconomyCompactNumber(normalizedValue)}`;
}

export function formatEconomyValue(
  value: number,
  unitCode?: string | null,
): string {
  return [formatEconomyCompactNumber(value), unitCode]
    .filter(Boolean)
    .join(" ");
}
