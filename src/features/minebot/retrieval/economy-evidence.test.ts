import { describe, expect, it, vi, beforeEach } from "vitest";

import type { PublicExportRecord } from "@/features/economy/types/export";
import type { PublicGdpRecord } from "@/features/economy/types/gdp";
import type { PublicInvestmentRecord } from "@/features/economy/types/investment";

import { getPublicExports } from "@/features/economy/server/get-public-exports";
import { getPublicGdp } from "@/features/economy/server/get-public-gdp";
import { getPublicInvestment } from "@/features/economy/server/get-public-investment";
import { retrieveEconomyEvidence } from "./economy-evidence";

vi.mock("@/features/economy/server/get-public-gdp", () => ({
  getPublicGdp: vi.fn(),
}));
vi.mock("@/features/economy/server/get-public-exports", () => ({
  getPublicExports: vi.fn(),
}));
vi.mock("@/features/economy/server/get-public-investment", () => ({
  getPublicInvestment: vi.fn(),
}));

function gdpFixture(year: number): PublicGdpRecord {
  return {
    id: `gdp-${year}`,
    region: { code: "ID", name: "Indonesia" },
    year,
    priceBasis: "current_prices",
    baseYear: null,
    nationalGdpValue: 20892312.3,
    miningQuarryingGdpValue: 2198018.1,
    contributionPercentage: 10.5208,
    nominalYoyChangePercentage: year === 2019 ? null : -8.16,
    currencyCode: "IDR",
    valueScale: "billion",
    dataStatus: "final",
    recordType: "actual",
    sourcePublishedAt: null,
    sources: [
      { label: "BPS", pageReference: null, url: "https://bps.go.id", isPrimary: true, source: { name: "Badan Pusat Statistik", slug: "bps", organization: "BPS" } },
    ],
  };
}

function investmentFixture(year: number, origin: "pma" | "pmdn"): PublicInvestmentRecord {
  return {
    id: `investment-${origin}-${year}`,
    region: { code: "ID", name: "Indonesia" },
    year,
    sector: { code: "mining", name: "Pertambangan" },
    origin,
    investmentValue: origin === "pma" ? 85.2 : 45.9,
    currency: { code: "IDR", scale: "trillion" },
    projectCount: origin === "pma" ? 700 : 450,
    annualMetrics: {
      totalInvestmentValue: 131.1,
      totalProjectCount: 1150,
      valueSharePercentage: null,
      nominalYoyChangePercentage: null,
    },
    dataStatus: "final",
    recordType: "actual",
    sourcePublishedAt: null,
    sources: [
      { label: "BKPM", pageReference: null, url: null, isPrimary: true, source: { name: "Kementerian Investasi/BKPM", slug: "bkpm", organization: "BKPM" } },
    ],
  };
}

function exportFixture(year: number, overrides: Partial<PublicExportRecord> = {}): PublicExportRecord {
  return {
    id: `export-${year}-batubara-in`,
    commodity: { name: "Batubara", slug: "batubara", symbol: "BB", sourceLabel: "Batubara", hsCode: null, productForm: null },
    origin: { code: "ID", name: "Indonesia" },
    destination: { code: "IN", name: "India" },
    year,
    coverageType: "destination_country",
    availability: "reported",
    volume: { value: 121692.5, unitCode: "metric_ton", scale: "thousand", normalizedMetricTon: 121692500 },
    fob: { value: 4836100, currencyCode: "USD", scale: "thousand", normalizedUsd: 4836100000, averageUsdPerMetricTon: null, nominalYoyChangePercentage: null },
    dataStatus: "final",
    recordType: "actual",
    sourcePublishedAt: null,
    sources: [
      { label: "BPS", pageReference: null, url: null, isPrimary: true, source: { name: "Badan Pusat Statistik", slug: "bps", organization: "BPS" } },
    ],
    ...overrides,
  };
}

describe("retrieveEconomyEvidence", () => {
  beforeEach(() => {
    vi.mocked(getPublicGdp).mockReset();
    vi.mocked(getPublicExports).mockReset();
    vi.mocked(getPublicInvestment).mockReset();
  });

  describe("GDP", () => {
    it("returns national GDP exact source value and Indonesian formatting for 2023", async () => {
      vi.mocked(getPublicGdp).mockResolvedValue([gdpFixture(2023)]);

      const [evidence] = await retrieveEconomyEvidence({ metric: "national_gdp", years: [2023] });

      expect(evidence?.evidenceId).toBe("economy-gdp-national_gdp-2023");
      expect(evidence?.value).toBe(20892312.3);
      expect(evidence?.unit).toBe("IDR (miliar)");
      expect(evidence?.period).toEqual({ year: 2023 });
      expect(evidence?.facts).toContain("20.892.312,3 miliar IDR");
      expect(evidence?.facts).toContain("Rp 20.892,31 triliun");
      expect(evidence?.kind).toBe("structured");
      expect(evidence?.verificationStatus).toBe("verified");
      expect(evidence?.publicationStatus).toBe("published");
      expect(evidence?.sourceIds).toContain("bps");
    });

    it("returns mining & quarrying GDP for 2022 when requested", async () => {
      vi.mocked(getPublicGdp).mockResolvedValue([gdpFixture(2022)]);

      const [evidence] = await retrieveEconomyEvidence({ metric: "mining_gdp", years: [2022] });

      expect(evidence?.evidenceId).toBe("economy-gdp-mining_gdp-2022");
      expect(evidence?.facts).toContain("PDB sektor Pertambangan dan Penggalian Indonesia tahun 2022");
      expect(evidence?.period?.year).toBe(2022);
    });

    it("returns contribution percentage for the exact year", async () => {
      vi.mocked(getPublicGdp).mockResolvedValue([gdpFixture(2023)]);

      const [evidence] = await retrieveEconomyEvidence({ metric: "gdp_contribution", years: [2023] });

      expect(evidence?.value).toBe(10.5208);
      expect(evidence?.facts).toContain("10,52%");
      expect(evidence?.unit).toBe("%");
    });

    it("returns official yoy growth metric without recomputing", async () => {
      vi.mocked(getPublicGdp).mockResolvedValue([gdpFixture(2023)]);

      const [evidence] = await retrieveEconomyEvidence({ metric: "gdp_growth", years: [2023] });

      expect(evidence?.value).toBe(-8.16);
      expect(evidence?.facts).toContain("-8,16%");
      expect(evidence?.facts).toContain("dibanding observasi publik sebelumnya");
    });

    it("skips growth when the year has no official value (first observation)", async () => {
      vi.mocked(getPublicGdp).mockResolvedValue([gdpFixture(2019)]);

      const evidence = await retrieveEconomyEvidence({ metric: "gdp_growth", years: [2019] });

      expect(evidence).toHaveLength(0);
    });

    it("returns one evidence per requested comparison year without mixing", async () => {
      vi.mocked(getPublicGdp).mockResolvedValue([gdpFixture(2022), gdpFixture(2023)]);

      const evidence = await retrieveEconomyEvidence({ metric: "mining_gdp", years: [2022, 2023] });

      expect(evidence.map((item) => item.period?.year)).toEqual([2022, 2023]);
    });
  });

  describe("exports", () => {
    it("returns exact FOB value for commodity and year", async () => {
      vi.mocked(getPublicExports).mockResolvedValue([exportFixture(2023)]);

      const evidence = await retrieveEconomyEvidence({ metric: "exports", years: [2023], commodity: "batubara" });

      expect(evidence).toHaveLength(1);
      expect(evidence[0]?.value).toBe(4836100);
      expect(evidence[0]?.facts).toContain("USD 4,84 miliar");
      expect(evidence[0]?.facts).toContain("ekspor Batubara");
      expect(evidence[0]?.facts).toContain("India");
    });

    it("drops not_reported and reported_zero records", async () => {
      vi.mocked(getPublicExports).mockResolvedValue([
        exportFixture(2023, { id: "a", availability: "not_reported", fob: null }),
        exportFixture(2023, { id: "b", availability: "reported_zero", fob: { value: 0, currencyCode: "USD", scale: "thousand", normalizedUsd: 0, averageUsdPerMetricTon: null, nominalYoyChangePercentage: null } }),
      ]);

      const evidence = await retrieveEconomyEvidence({ metric: "exports", years: [2023] });

      expect(evidence).toHaveLength(0);
    });
  });

  describe("investment", () => {
    it("uses the official annual total and per-origin detail", async () => {
      vi.mocked(getPublicInvestment).mockResolvedValue([
        investmentFixture(2023, "pma"),
        investmentFixture(2023, "pmdn"),
      ]);

      const evidence = await retrieveEconomyEvidence({ metric: "investment", years: [2023] });

      const total = evidence.find((item) => item.evidenceId === "economy-investment-total-2023");
      expect(total?.value).toBe(131.1);
      expect(total?.facts).toContain("Total investasi sektor Pertambangan Indonesia tahun 2023");

      const pma = evidence.find((item) => item.evidenceId === "economy-investment-pma-2023");
      expect(pma?.value).toBe(85.2);
      expect(pma?.facts).toContain("Penanaman Modal Asing (PMA)");
    });
  });

  describe("year fallback", () => {
    it("falls back to the latest available year when no year is requested", async () => {
      vi.mocked(getPublicGdp).mockResolvedValue([
        gdpFixture(2022),
        gdpFixture(2023),
        gdpFixture(2024),
      ]);

      const evidence = await retrieveEconomyEvidence({ metric: "national_gdp" });

      expect(evidence.map((item) => item.period?.year)).toEqual([2024]);
    });
  });
});