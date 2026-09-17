const UNITS_TO_TON = new Set(["t", "ton", "tons", "metric ton", "metric tons"]);

export function formatMineBotNumber(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompactIndonesianNumber(value: number): string {
  const formatter = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  });

  if (value >= 1_000_000_000) {
    return `${formatter.format(value / 1_000_000_000)} miliar`;
  }
  if (value >= 1_000_000) {
    return `${formatter.format(value / 1_000_000)} juta`;
  }
  if (value >= 1_000) {
    return `${formatter.format(value / 1_000)} ribu`;
  }
  return formatter.format(value);
}

export function normalizeMineBotUnit(unit: string): string {
  const normalized = unit.trim().toLocaleLowerCase("id-ID");
  if (UNITS_TO_TON.has(normalized)) return "ton";
  return unit.trim();
}

export function formatMineBotQuantity(value: number, unit: string): string {
  const normalizedUnit = normalizeMineBotUnit(unit);
  if (value >= 1_000_000) {
    return `${formatMineBotNumber(value)} ${normalizedUnit} (sekitar ${formatCompactIndonesianNumber(value)} ${normalizedUnit})`;
  }
  return `${formatMineBotNumber(value)} ${normalizedUnit}`;
}

export function formatMineBotPrice(
  value: number,
  currencyCode: string,
  unit: string
): string {
  const normalizedUnit = normalizeMineBotUnit(unit);
  const currency = normalizeCurrency(currencyCode);
  return `${currency} ${formatMineBotNumber(value)}/${normalizedUnit}`;
}

function normalizeCurrency(currencyCode: string): string {
  const code = currencyCode.trim().toLocaleUpperCase("id-ID");
  if (code === "IDR" || code === "RP") return "Rp";
  if (code === "USD" || code === "US$") return "USD";
  return code;
}