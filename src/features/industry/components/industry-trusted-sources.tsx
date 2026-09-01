import Link from "next/link";
import {
  Building2,
  ExternalLink,
  FileCheck2,
  FileText,
  Leaf,
  MapPinned,
  ShieldCheck,
} from "lucide-react";

import type {
  PublicIndustryCompanySummary,
  PublicIndustryOperationSite,
} from "@/features/industry/types/industry";
import type { IndustryCategory } from "@/features/industry/types/industry-view";

type IndustryTrustedSourcesProps = {
  activeCategory: IndustryCategory;
  companies: PublicIndustryCompanySummary[];
  operationSites: PublicIndustryOperationSite[];
};

type OperationSource = {
  name: string;
  url: string;
  companyName: string;
  companySlug: string;
};

function getOperationSources(
  operationSites: PublicIndustryOperationSite[],
): OperationSource[] {
  const uniqueSources = new Map<string, OperationSource>();

  operationSites.forEach((site) => {
    const url = site.source.url.trim();
    if (!url || uniqueSources.has(site.company.slug)) return;

    uniqueSources.set(site.company.slug, {
      name: site.source.name,
      url,
      companyName: site.company.name,
      companySlug: site.company.slug,
    });
  });

  return Array.from(uniqueSources.values()).sort((left, right) =>
    left.companyName.localeCompare(right.companyName, "id-ID"),
  );
}

export function IndustryTrustedSources({
  activeCategory,
  companies,
  operationSites,
}: IndustryTrustedSourcesProps) {
  const officialWebsites = companies.filter(
    (company) => company.officialWebsiteUrl,
  );
  const operationSources = getOperationSources(operationSites);

  return (
    <section
      id="sumber-terpercaya"
      aria-labelledby="trusted-industry-sources-heading"
      className="scroll-mt-32 pt-12"
    >
      <div className="rounded-3xl border border-white/10 bg-[#08172a] p-5 shadow-[0_20px_58px_rgba(0,0,0,0.18)] sm:p-7">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-brand-teal/25 bg-brand-teal/10">
            <ShieldCheck
              aria-hidden="true"
              className="size-5 text-brand-teal"
            />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-teal">
              Referensi Industri
            </p>
            <h2
              id="trusted-industry-sources-heading"
              className="mt-1 text-2xl text-white sm:text-3xl"
            >
              Sumber dan Informasi Resmi
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-[#8fa0b4] sm:text-base">
              Informasi perusahaan, laporan, dan lokasi operasi dirangkum dari
              kanal resmi perusahaan serta dokumen yang tersedia di pusat
              laporan MineVision.
            </p>
          </div>
        </div>

        <div className="mt-7 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/8 bg-[#061122] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Building2
                aria-hidden="true"
                className="size-5 text-brand-cyan"
              />
              <div>
                <h3 className="font-sans text-base font-bold text-white">
                  Website Resmi Perusahaan
                </h3>
                <p className="mt-1 text-xs leading-5 text-[#8393a7]">
                  Profil dan informasi korporasi dari situs resmi perusahaan.
                </p>
              </div>
            </div>

            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {officialWebsites.map((company) => (
                <li key={company.id}>
                  <a
                    href={company.officialWebsiteUrl ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex min-h-11 items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.025] px-3 py-2 text-sm font-bold text-[#d9e4ef] transition-colors hover:border-brand-cyan/40 hover:text-brand-cyan focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan motion-reduce:transition-none"
                  >
                    <span className="line-clamp-2">{company.name}</span>
                    <ExternalLink
                      aria-hidden="true"
                      className="size-4 shrink-0 text-brand-cyan"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-white/8 bg-[#061122] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <FileCheck2
                aria-hidden="true"
                className="size-5 text-brand-teal"
              />
              <div>
                <h3 className="font-sans text-base font-bold text-white">
                  Dokumen Resmi Perusahaan
                </h3>
                <p className="mt-1 text-xs leading-5 text-[#8393a7]">
                  Buka katalog laporan untuk melihat dan mengunduh dokumen.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <Link
                href="/industry?category=reports"
                className="group flex items-start gap-4 rounded-xl border border-white/8 bg-white/[0.025] p-4 transition-colors hover:border-brand-cyan/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan motion-reduce:transition-none"
              >
                <FileText
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-brand-cyan"
                />
                <span>
                  <span className="block text-sm font-bold text-white transition-colors group-hover:text-brand-cyan">
                    Annual Report
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[#8393a7]">
                    Laporan tahunan resmi perusahaan periode 2023–2025.
                  </span>
                </span>
              </Link>

              <Link
                href="/industry?category=reports"
                className="group flex items-start gap-4 rounded-xl border border-white/8 bg-white/[0.025] p-4 transition-colors hover:border-brand-teal/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan motion-reduce:transition-none"
              >
                <Leaf
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-brand-teal"
                />
                <span>
                  <span className="block text-sm font-bold text-white transition-colors group-hover:text-brand-teal">
                    Sustainability Report
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[#8393a7]">
                    Laporan keberlanjutan dan kinerja ESG perusahaan.
                  </span>
                </span>
              </Link>
            </div>
          </article>
        </div>

        {activeCategory === "operations" && operationSources.length ? (
          <article className="mt-4 rounded-2xl border border-white/8 bg-[#061122] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <MapPinned
                aria-hidden="true"
                className="size-5 text-brand-cyan"
              />
              <div>
                <h3 className="font-sans text-base font-bold text-white">
                  Referensi Lokasi Operasi
                </h3>
                <p className="mt-1 text-xs leading-5 text-[#8393a7]">
                  Tautan sumber yang mendukung informasi lokasi pada peta.
                </p>
              </div>
            </div>

            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {operationSources.map((source) => (
                <li key={source.companySlug}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex h-full items-start justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-4 transition-colors hover:border-brand-cyan/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan motion-reduce:transition-none"
                  >
                    <span>
                      <span className="block text-sm font-bold text-white transition-colors group-hover:text-brand-cyan">
                        {source.companyName}
                      </span>
                      <span className="mt-1 line-clamp-2 block text-xs leading-5 text-[#8393a7]">
                        {source.name}
                      </span>
                    </span>
                    <ExternalLink
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-brand-cyan"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </article>
        ) : null}
      </div>
    </section>
  );
}
