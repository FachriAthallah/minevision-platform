"use client";

import {
  BrainCircuit,
  Gem,
  Layers3,
  RotateCcw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Container } from "@/components/ui/container";

import {
  commodityCategoryLabels,
  filterCommodityCatalog,
  parseCommodityCatalogFilters,
  type CommodityCatalogCategory,
  type CommodityCatalogFilters,
} from "../lib/commodity-view";
import type { PublicCommoditySummary } from "../types/commodity";
import { CommodityCard } from "./commodity-card";

const categories: Array<{
  value: CommodityCatalogCategory;
  label: string;
}> = [
  { value: "all", label: "Semua" },
  { value: "metal_mineral", label: commodityCategoryLabels.metal_mineral },
  {
    value: "non_metal_mineral",
    label: commodityCategoryLabels.non_metal_mineral,
  },
  { value: "energy", label: commodityCategoryLabels.energy },
];

export function catalogHref(
  category: CommodityCatalogCategory,
  search: string,
): string {
  const params = new URLSearchParams();

  if (category !== "all") params.set("category", category);
  if (search) params.set("search", search);

  const query = params.toString();
  return query ? `/commodity?${query}` : "/commodity";
}

export function CommodityCatalog({
  commodities,
  filters,
}: {
  commodities: PublicCommoditySummary[];
  filters: CommodityCatalogFilters;
}) {
  const [search, setSearch] = useState(filters.search);
  const [category, setCategory] = useState<CommodityCatalogCategory>(
    filters.category,
  );
  const hasMounted = useRef(false);
  const results = useMemo(
    () => filterCommodityCatalog(commodities, { search, category }),
    [commodities, search, category],
  );

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    const timeout = window.setTimeout(() => {
      window.history.replaceState(null, "", catalogHref(category, search));
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [category, search]);

  useEffect(() => {
    const syncFromHistory = () => {
      const params = new URLSearchParams(window.location.search);
      const nextFilters = parseCommodityCatalogFilters({
        search: params.get("search") ?? undefined,
        category: params.get("category") ?? undefined,
      });
      setSearch(nextFilters.search);
      setCategory(nextFilters.category);
    };

    window.addEventListener("popstate", syncFromHistory);
    return () => window.removeEventListener("popstate", syncFromHistory);
  }, []);

  const selectCategory = (nextCategory: CommodityCatalogCategory) => {
    setCategory(nextCategory);
    window.history.pushState(null, "", catalogHref(nextCategory, search));
  };

  const resetFilters = () => {
    setSearch("");
    setCategory("all");
    window.history.pushState(null, "", "/commodity");
  };

  return (
    <div className="bg-[#020817]">
      <section className="relative isolate overflow-hidden border-b border-white/10 pb-16 pt-32 sm:pb-20 sm:pt-36">
        <div aria-hidden="true" className="absolute inset-0 -z-30 bg-[linear-gradient(115deg,#020817_0%,#061426_50%,#0a1d31_100%)]" />
        <div aria-hidden="true" className="absolute inset-0 -z-20 bg-[url('/images/commodity/bg_commodity.jpg')] bg-cover bg-[position:62%_center] opacity-65 sm:bg-center" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,8,23,0.98)_0%,rgba(2,8,23,0.87)_48%,rgba(2,8,23,0.58)_100%),linear-gradient(0deg,rgba(2,8,23,0.88)_0%,transparent_58%)]" />

        <Container className="max-w-[1320px]">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)] lg:items-end">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-sm font-semibold text-brand-cyan">
                <Gem aria-hidden="true" className="h-4 w-4" />
                Commodity
              </div>
              <h1 className="mt-5 text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
                Komoditas Pertambangan Indonesia
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#b7c3d1] sm:text-lg">
                Jelajahi profil mineral logam, mineral non-logam, dan energi
                dengan data yang terhubung ke sumber resmi.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                { icon: Gem, value: String(commodities.length), label: "Profil Komoditas", description: "Komoditas tambang di Indonesia." },
                { icon: Layers3, value: "3", label: "Kategori Utama", description: "Mineral Logam, Mineral Non-Logam, dan Energi." },
                { icon: ShieldCheck, value: "Materi Bersumber", label: "Berbagai Referensi", description: "Materi terhubung dengan sumber resmi dan referensi tepercaya." },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-4 rounded-2xl border border-border bg-surface/80 p-4 shadow-[0_14px_38px_rgba(0,0,0,0.2)] backdrop-blur-sm">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-brand-cyan/25 bg-brand-cyan/5">
                    <stat.icon aria-hidden="true" className="size-5 text-brand-cyan" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm font-bold leading-5 text-foreground">{stat.label}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{stat.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <main className="relative py-12 sm:py-16 lg:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(40,103,228,0.08),transparent_25%),radial-gradient(circle_at_90%_32%,rgba(60,195,171,0.055),transparent_28%)]"
        />
        <Container className="relative max-w-[1320px]">
          <section
            aria-labelledby="commodity-explorer-title"
            className="rounded-3xl border border-white/10 bg-[#08172a] p-5 shadow-[0_18px_52px_rgba(0,0,0,0.18)] sm:p-7"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-cyan/30 bg-brand-cyan/5">
                <Search aria-hidden="true" className="h-5 w-5 text-brand-cyan" />
              </span>
              <div>
                <h2 id="commodity-explorer-title" className="text-xl text-white">
                  Temukan komoditas
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#8fa0b4]">
                  Cari berdasarkan nama, simbol, atau ringkasan informasi.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <label htmlFor="commodity-search" className="sr-only">
                  Cari komoditas
                </label>
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f90a5]"
                />
                <input
                  id="commodity-search"
                  name="search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Contoh: nikel, Ni, energi"
                  maxLength={100}
                  className="min-h-12 w-full rounded-full border border-white/12 bg-[#041023] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-[#69798c] focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20"
                />
              </div>
              {search || category !== "all" ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/12 px-5 text-sm font-bold text-[#c4ced9] hover:border-brand-cyan/40 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan"
                >
                  <RotateCcw aria-hidden="true" className="h-4 w-4" />
                  Reset
                </button>
              ) : null}
            </div>

            <nav aria-label="Filter kategori komoditas" className="mt-5 overflow-x-auto pb-1">
              <ul className="flex min-w-max gap-2">
                {categories.map((categoryOption) => {
                  const active = category === categoryOption.value;

                  return (
                    <li key={categoryOption.value}>
                      <button
                        type="button"
                        onClick={() => selectCategory(categoryOption.value)}
                        aria-pressed={active}
                        className={
                          active
                            ? "brand-gradient inline-flex min-h-10 items-center rounded-full px-4 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan"
                            : "inline-flex min-h-10 items-center rounded-full border border-white/10 bg-white/[0.025] px-4 text-sm font-semibold text-[#9facba] hover:border-brand-cyan/35 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan"
                        }
                      >
                        {categoryOption.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </section>

          <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-brand-teal">
                <Layers3 aria-hidden="true" className="h-4 w-4" />
                <p className="text-xs font-bold uppercase tracking-[0.14em]">
                  Katalog publik
                </p>
              </div>
              <h2 className="mt-2 text-2xl text-white sm:text-3xl">
                {category === "all"
                  ? "Seluruh Komoditas"
                  : commodityCategoryLabels[category]}
              </h2>
            </div>
            <p aria-live="polite" className="text-sm text-[#8fa0b4]">
              {results.length} dari {commodities.length} komoditas
            </p>
          </div>

          {results.length > 0 ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((commodity) => (
                <CommodityCard key={commodity.id} commodity={commodity} />
              ))}
            </div>
          ) : (
            <section className="mt-6 rounded-3xl border border-dashed border-white/15 bg-[#071426] px-6 py-16 text-center">
              <BrainCircuit aria-hidden="true" className="mx-auto h-9 w-9 text-brand-cyan" />
              <h2 className="mt-4 text-xl text-white">Komoditas tidak ditemukan</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8fa0b4]">
                Coba gunakan kata kunci lain atau kembalikan filter ke seluruh kategori.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 inline-flex min-h-11 items-center rounded-full border border-brand-cyan/45 px-5 text-sm font-bold text-brand-cyan hover:bg-brand-cyan/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan"
              >
                Tampilkan semua komoditas
              </button>
            </section>
          )}
        </Container>
      </main>
    </div>
  );
}
