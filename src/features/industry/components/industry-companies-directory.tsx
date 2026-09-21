"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gem, MapPin, Search } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/shared/reveal";
import { getIndustryCompanyPresentation } from "@/features/industry/content/industry-company-content";
import { filterIndustryCompanies } from "@/features/industry/lib/industry-view";
import type { PublicIndustryCompanySummary } from "@/features/industry/types/industry";
import { cn } from "@/lib/utils";

import { IndustryActionCards } from "./industry-action-cards";
import { IndustryState } from "./industry-states";

const inputClassName =
  "min-h-11 w-full rounded-xl border border-border bg-background/45 px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/65 hover:border-brand-cyan/40 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20";

function CompanyCard({
  company,
  highlighted = false,
}: {
  company: PublicIndustryCompanySummary;
  highlighted?: boolean;
}) {
  const presentation = getIndustryCompanyPresentation(company.slug);

  return (
    <Card
      id={`industry-company-${company.slug}`}
      variant="elevated"
      className={cn(
        "group flex h-full flex-col overflow-hidden scroll-mt-32 motion-reduce:transition-none",
        highlighted &&
          "border-brand-cyan/70 ring-2 ring-brand-cyan/60 ring-offset-2 ring-offset-background",
      )}
    >
      <div className="flex min-h-32 items-center justify-center border-b border-border bg-white p-6">
        <Image
          src={company.logoPath}
          alt={`Logo ${company.name}`}
          width={240}
          height={96}
          className="h-20 w-full object-contain"
        />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="min-h-14 text-xl leading-7 text-foreground">
          {company.name}
        </h3>
        <p className="mt-3 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-muted-foreground">
          {company.description ??
            company.businessField ??
            "Profil perusahaan sedang dilengkapi dari sumber resmi."}
        </p>

        <div className="mt-auto pt-5">
          <dl className="space-y-3 border-t border-border pt-4 text-sm">
            <div className="flex items-start gap-2">
              <MapPin
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-brand-cyan"
              />
              <div>
                <dt className="font-bold text-foreground">
                  Lokasi Operasi Utama
                </dt>
                <dd className="mt-0.5 text-muted-foreground">
                  {presentation?.mainOperation ?? "Belum tersedia"}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Gem
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-brand-teal"
              />
              <div>
                <dt className="font-bold text-foreground">Komoditas Utama</dt>
                <dd className="mt-0.5 text-muted-foreground">
                  {presentation?.primaryCommodity ?? "Belum tersedia"}
                </dd>
              </div>
            </div>
          </dl>

          <Link
            href={`/industry/${company.slug}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "medium" }),
              "mt-6 w-full motion-reduce:transition-none",
            )}
          >
            Profil perusahaan
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
    </Card>
  );
}

export function IndustryCompaniesDirectory({
  companies,
  highlightSlug,
}: {
  companies: PublicIndustryCompanySummary[];
  highlightSlug?: string;
}) {
  const [search, setSearch] = useState("");
  const highlightHandledRef = useRef(false);
  const filteredCompanies = useMemo(
    () => filterIndustryCompanies(companies, search),
    [companies, search],
  );

  useEffect(() => {
    if (!highlightSlug || highlightHandledRef.current) {
      return;
    }

    highlightHandledRef.current = true;

    const frame = requestAnimationFrame(() => {
      const element = document.getElementById(
        `industry-company-${highlightSlug}`,
      );

      if (!element) {
        return;
      }

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

      element.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "center",
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [highlightSlug]);

  return (
    <section aria-labelledby="industry-companies-heading">
      <Reveal direction="up">
        <div className="flex flex-col gap-5 border-b border-border pb-7 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-teal">
              Direktori Industri
            </p>
            <h2
              id="industry-companies-heading"
              className="mt-2 text-3xl text-foreground"
            >
              Perusahaan Tambang Utama
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Jelajahi profil, komoditas utama, sejarah, kinerja, dan lokasi
              operasi perusahaan pertambangan utama Indonesia.
            </p>
          </div>
          <div className="w-full md:max-w-sm">
            <label
              htmlFor="company-search"
              className="text-sm font-bold text-foreground"
            >
              Cari perusahaan
            </label>
            <div className="relative mt-2">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                id="company-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nama, komoditas, atau wilayah"
                className={cn(inputClassName, "pl-11")}
              />
            </div>
          </div>
        </div>
      </Reveal>

      <p
        role="status"
        aria-live="polite"
        className="mt-6 text-sm text-muted-foreground"
      >
        {filteredCompanies.length} dari {companies.length} perusahaan
      </p>

      {filteredCompanies.length ? (
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredCompanies.map((company, index) => (
            <Reveal
              key={company.id}
              direction="up"
              delay={Math.min(index, 2) * 70}
              className="h-full"
            >
              <CompanyCard
                company={company}
                highlighted={highlightSlug === company.slug}
              />
            </Reveal>
          ))}
        </div>
      ) : (
        <IndustryState
          kind="companies"
          title="Perusahaan tidak ditemukan"
          description="Coba gunakan nama perusahaan, komoditas, atau wilayah operasi yang berbeda."
          className="mt-6"
        />
      )}

      <IndustryActionCards />
    </section>
  );
}
