import { describe, expect, it } from "vitest";

import type { PublicCommoditySummary } from "../types/commodity";
import {
  commodityCategoryLabels,
  filterCommodityCatalog,
  formatCommodityNumber,
  formatResourceMaterialLabel,
  formatResourceStatisticValue,
  getAdjacentCommodities,
  getCommodityHref,
  getCommodityImage,
  getCommoditySectionId,
  parseCommodityBody,
  parseCommodityCatalogFilters,
  shouldShowCommodityIntelligence,
} from "./commodity-view";

function createCommodity(
  overrides: Partial<PublicCommoditySummary> = {},
): PublicCommoditySummary {
  return {
    id: "commodity-1",
    name: "Nikel",
    slug: "nikel",
    symbol: "Ni",
    category: "metal_mineral",
    description: "Logam strategis untuk baja tahan karat dan baterai.",
    specification: "Nama Internasional: Nickel",
    image: {
      url: "/images/commodity/nikel.png",
      alt: "Batuan nikel",
      credit: null,
      sourceUrl: null,
    },
    isIntelligenceTracked: true,
    displayOrder: 1,
    profile: {
      title: "Nikel",
      excerpt: "Profil nikel Indonesia",
      readingTimeMinutes: 8,
      isFeatured: true,
      publishedAt: "2026-01-01T00:00:00.000Z",
    },
    ...overrides,
  };
}

describe("commodity view model", () => {
  it("memetakan label kategori ke bahasa yang mudah dibaca", () => {
    expect(commodityCategoryLabels).toEqual({
      metal_mineral: "Mineral Logam",
      non_metal_mineral: "Mineral Non-Logam",
      energy: "Energi",
    });
  });

  it("menormalisasi filter URL dan menolak kategori yang tidak dikenal", () => {
    expect(
      parseCommodityCatalogFilters({
        search: "  nikel  ",
        category: "metal_mineral",
      }),
    ).toEqual({ search: "nikel", category: "metal_mineral" });

    expect(
      parseCommodityCatalogFilters({ category: "kategori-palsu" }),
    ).toEqual({ search: "", category: "all" });
  });

  it("memfilter berdasarkan kategori, nama, simbol, dan deskripsi", () => {
    const commodities = [
      createCommodity(),
      createCommodity({
        id: "commodity-2",
        name: "Batubara",
        slug: "batubara",
        symbol: null,
        category: "energy",
        description: "Sumber energi padat.",
        displayOrder: 2,
      }),
    ];

    expect(
      filterCommodityCatalog(commodities, {
        search: "ni",
        category: "metal_mineral",
      }).map((commodity) => commodity.slug),
    ).toEqual(["nikel"]);

    expect(
      filterCommodityCatalog(commodities, {
        search: "energi",
        category: "all",
      }).map((commodity) => commodity.slug),
    ).toEqual(["batubara"]);
  });

  it("menghasilkan hasil kosong ketika pencarian tidak cocok", () => {
    expect(
      filterCommodityCatalog([createCommodity()], {
        search: "tidak-ada",
        category: "all",
      }),
    ).toEqual([]);
  });

  it("menggunakan URL dan alt gambar dari data tanpa fallback file hard-coded", () => {
    expect(getCommodityImage(createCommodity())).toEqual({
      src: "/images/commodity/nikel.png",
      alt: "Batuan nikel",
    });
    expect(getCommodityImage(createCommodity({ image: null }))).toBeNull();
  });

  it("membentuk link kartu dari slug yang benar", () => {
    expect(getCommodityHref("panas-bumi")).toBe("/commodity/panas-bumi");
  });

  it("memecah materi profil menjadi section yang dapat dinavigasi", () => {
    const sections = parseCommodityBody(`
# Nikel

## Definisi

Nikel adalah logam strategis.

## Karakteristik

| Karakteristik | Keterangan |
| --- | --- |
| Warna | Putih keperakan |
`);

    expect(sections).toHaveLength(2);
    expect(sections[0]?.title).toBe("Definisi");
    expect(getCommoditySectionId(sections[1]?.title ?? "")).toBe(
      "characteristics",
    );
    expect(sections[1]?.blocks[0]?.type).toBe("table");
  });

  it("menampilkan CTA Intelligence hanya untuk komoditas yang dipantau", () => {
    expect(shouldShowCommodityIntelligence(createCommodity())).toBe(true);
    expect(
      shouldShowCommodityIntelligence(
        createCommodity({ isIntelligenceTracked: false }),
      ),
    ).toBe(false);
  });

  it("mengikuti displayOrder untuk navigasi sebelumnya dan selanjutnya", () => {
    const commodities = [
      createCommodity({ slug: "ketiga", name: "Ketiga", displayOrder: 3 }),
      createCommodity({ slug: "pertama", name: "Pertama", displayOrder: 1 }),
      createCommodity({ slug: "kedua", name: "Kedua", displayOrder: 2 }),
    ];

    const adjacent = getAdjacentCommodities(commodities, "kedua");
    expect(adjacent.previous?.slug).toBe("pertama");
    expect(adjacent.next?.slug).toBe("ketiga");
  });

  it("memformat nilai numeric sebagai angka Indonesia tanpa floating point", () => {
    expect(formatCommodityNumber("27358862495")).toBe("27.358.862.495");
    expect(formatCommodityNumber("1200000.500000")).toBe("1.200.000,5");
  });

  it("menyederhanakan cadangan ton berskala jutaan hanya pada statistik sumber daya", () => {
    const metricTon = {
      code: "metric_ton",
      name: "Metric ton",
      symbol: "t",
    };

    expect(formatResourceStatisticValue("5913865814", metricTon)).toBe(
      "5.913,87 juta ton",
    );
    expect(formatResourceStatisticValue("3444", metricTon)).toBe("3.444 ton");
    expect(
      formatResourceStatisticValue("2328000", {
        code: "megawatt",
        name: "Megawatt",
        symbol: "MW",
      }),
    ).toBe("2.328.000 MW");
  });

  it("menjelaskan basis material dalam konteks nama komoditas", () => {
    expect(formatResourceMaterialLabel("ore", "Nikel")).toBe(
      "Bijih komoditas (Nikel)",
    );
    expect(formatResourceMaterialLabel("contained_metal", "Nikel")).toBe(
      "Logam komoditas (Nikel)",
    );
  });
});
