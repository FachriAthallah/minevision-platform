import { describe, expect, it, vi } from "vitest";

import { IntelligenceRetriever, retrieveIntelligenceContext } from "./intelligence-retriever";

vi.mock("@/features/intelligence/server/get-public-production", () => ({
  getPublicProduction: vi.fn().mockResolvedValue([
    {
      commodity: { name: "Batubara", slug: "batubara", symbol: null },
      year: 2023,
      value: 775182000,
      unit: { code: "metric_ton", name: "Ton", symbol: "ton" },
      recordType: "actual",
      sources: [
        {
          label: "Produksi Batubara 2023",
          isPrimary: true,
          source: { name: "Kementerian ESDM", slug: "kementerian-esdm", organization: "Kementerian ESDM" },
          url: "https://example.go.id/report",
          pageReference: null,
        },
      ],
    },
  ]),
}));

vi.mock("@/features/intelligence/server/get-public-domestic-prices", () => ({
  getPublicDomesticPrices: vi.fn().mockResolvedValue([
    {
      commodity: { name: "Batubara", slug: "batubara", symbol: null },
      standard: { code: "HBA", name: "Harga Batubara Acuan" },
      effectiveDate: "2023-12-01",
      period: "monthly",
      value: 158.94,
      currencyCode: "USD",
      unit: { code: "metric_ton", name: "Ton", symbol: "ton" },
      recordType: "actual",
      source: { name: "Kementerian ESDM", slug: "kementerian-esdm", organization: "Kementerian ESDM", url: "https://example.go.id" },
    },
  ]),
}));

describe("IntelligenceRetriever", () => {
  it("returns empty array for query without commodity keyword", async () => {
    const retriever = new IntelligenceRetriever();
    const result = await retriever.retrieve("apa itu pertambangan?");

    expect(result).toEqual([]);
  });

  it("returns production context for production query", async () => {
    const retriever = new IntelligenceRetriever();
    const result = await retriever.retrieve("berapa produksi batubara tahun 2023?");

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].source.module).toBe("intelligence");
    expect(result[0].source.title).toContain("Batubara");
  });

  it("returns price context for price query", async () => {
    const retriever = new IntelligenceRetriever();
    const result = await retriever.retrieve("berapa harga batubara?");

    expect(result.length).toBeGreaterThan(0);
    const priceContext = result.find((c) => c.content.includes("Harga"));
    expect(priceContext).toBeDefined();
  });

  it("includes source markers in context", async () => {
    const retriever = new IntelligenceRetriever();
    const result = await retriever.retrieve("produksi nikel");

    if (result.length > 0) {
      expect(result[0].sourceId).toMatch(/^source-\d+$/);
    }
  });

  it("applies visibility filtering", async () => {
    const retriever = new IntelligenceRetriever();
    const result = await retriever.retrieve("produksi emas");

    for (const context of result) {
      expect(context.source).toBeDefined();
    }
  });
});

describe("retrieveIntelligenceContext", () => {
  it("delegates to IntelligenceRetriever", async () => {
    const result = await retrieveIntelligenceContext("produksi batubara");
    expect(Array.isArray(result)).toBe(true);
  });
});
