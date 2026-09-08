"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { filterCareerCategories, formatCareerCount } from "../lib/career-view";
import type { CareerCategorySummary } from "../types/career";
import { careerIcons } from "./career-icons";

export function CareerCatalogExplorer({ categories }: { categories: CareerCategorySummary[] }) {
  const [query, setQuery] = useState("");
  const results = filterCareerCategories(categories, query);
  return <section id="kategori-karier" aria-labelledby="career-catalog-title" className="scroll-mt-32">
    <p className="text-xs font-bold uppercase tracking-widest text-brand-cyan">Jelajahi Bidang Profesi</p>
    <h2 id="career-catalog-title" className="mt-3 text-2xl sm:text-3xl">Temukan Bidang yang Ingin Kamu Pelajari</h2>
    <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Mulai dari kategori yang menarik perhatianmu. Setiap profil menghubungkan daftar profesi dengan informasi bidang kerja dan referensinya.</p>
    <div className="mt-7 flex flex-wrap items-end gap-4">
      <div className="w-full sm:max-w-lg">
        <label htmlFor="career-search" className="mb-2 block text-sm font-semibold">Cari kategori karier</label>
        <div className="relative"><Search className="absolute left-4 top-3.5 size-5 text-muted-foreground" aria-hidden="true" />
          <input id="career-search" type="search" maxLength={100} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Geologi, keselamatan, data…" className="h-12 w-full rounded-xl border border-border bg-surface pl-12 pr-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan" />
        </div>
      </div>
      {query && <Button variant="outline" onClick={() => setQuery("")}>Reset pencarian</Button>}
    </div>
    <p role="status" aria-live="polite" className="my-5 text-sm text-muted-foreground">{formatCareerCount(results.length)} kategori ditampilkan</p>
    {results.length ? <div className="grid auto-rows-fr gap-5 md:grid-cols-2 xl:grid-cols-3">
      {results.map((category) => {
        const Icon = careerIcons[category.slug] ?? BriefcaseBusiness;
        return <Link key={category.slug} href={`/career/${category.slug}`} className="group flex min-w-0 flex-col rounded-2xl border border-white/10 bg-surface p-6 shadow-xl shadow-black/10 transition-all hover:-translate-y-0.5 hover:border-brand-cyan/40 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan motion-reduce:transform-none motion-reduce:transition-none">
          <span className="flex size-12 items-center justify-center rounded-xl border border-brand-cyan/25 bg-brand-cyan/5 text-brand-cyan"><Icon className="size-6" aria-hidden="true" /></span>
          <h3 className="mt-5 text-xl leading-8 md:min-h-16">{category.name}</h3>
          <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted-foreground">{category.description ?? category.excerpt}</p>
          <dl className="mt-auto flex flex-wrap gap-x-5 gap-y-3 pt-6 text-sm">
            {[["Profesi", category.professionCount], ["Kompetensi", category.sectionCounts.competency], ["Pelatihan", category.sectionCounts.training]].map(([label, count]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-bold">{formatCareerCount(Number(count))}</dd></div>)}
          </dl>
          <span className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-brand-cyan bg-brand-cyan/10 px-4 py-2 text-sm font-bold text-foreground transition-colors group-hover:bg-brand-cyan/20">Jelajahi Kategori<ArrowRight className="size-4" aria-hidden="true" /></span>
        </Link>;
      })}
    </div> : <div className="rounded-2xl border border-border bg-surface p-8"><h3 className="text-xl">{categories.length ? "Kategori tidak ditemukan" : "Kategori karier belum tersedia"}</h3><p className="mt-3 leading-7 text-muted-foreground">{categories.length ? "Coba kata kunci lain atau reset pencarian untuk melihat semua kategori." : "Silakan kembali lagi untuk melihat materi karier yang tersedia."}</p>{query && <Button className="mt-5" onClick={() => setQuery("")}>Tampilkan semua kategori</Button>}</div>}
  </section>;
}
