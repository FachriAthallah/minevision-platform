"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { RotateCcw, Search } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/shared/reveal";
import {
  filterIndustryReports,
  formatFileSize,
  formatIndustryReportType,
} from "@/features/industry/lib/industry-view";
import type { PublicIndustryCompanySummary } from "@/features/industry/types/industry";
import type {
  IndustryReportCatalogItem,
  IndustryReportFilters,
} from "@/features/industry/types/industry-view";
import { cn } from "@/lib/utils";

import { IndustryActionCards } from "./industry-action-cards";
import { IndustrySelect } from "./industry-select";
import { IndustryState } from "./industry-states";
import { ReportDownloadLink } from "./report-download-link";

const initialFilters: IndustryReportFilters = {
  search: "",
  companySlug: "",
  reportYear: "",
  reportType: "",
};

const inputClassName =
  "min-h-11 w-full rounded-xl border border-border bg-background/45 px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/65 hover:border-brand-cyan/40 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20";

const reportYearOptions = [
  { value: "", label: "Semua tahun" },
  { value: "2025", label: "2025" },
  { value: "2024", label: "2024" },
  { value: "2023", label: "2023" },
];

const reportTypeOptions = [
  { value: "", label: "Semua jenis" },
  { value: "annual_report", label: "Laporan Tahunan" },
  { value: "sustainability_report", label: "Laporan Keberlanjutan" },
];

export function IndustryReportCatalog({
  companies,
  reports,
}: {
  companies: PublicIndustryCompanySummary[];
  reports: IndustryReportCatalogItem[];
}) {
  const [filters, setFilters] = useState<IndustryReportFilters>(initialFilters);
  const filteredReports = useMemo(
    () => filterIndustryReports(reports, filters),
    [filters, reports],
  );
  const reportCompanies = companies.filter((company) => company.reportCount > 0);

  function updateFilter<Key extends keyof IndustryReportFilters>(
    key: Key,
    value: IndustryReportFilters[Key],
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <section aria-labelledby="industry-reports-heading">
      <Reveal direction="up">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-teal">Pusat Dokumen Resmi</p>
          <h2 id="industry-reports-heading" className="mt-2 text-3xl text-foreground">Sustainability &amp; Annual Report</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Temukan laporan tahunan dan laporan keberlanjutan perusahaan yang telah melalui verifikasi dan publikasi MineVision.
          </p>
        </div>
      </Reveal>

      <Reveal direction="up" delay={60} className="relative z-30">
        <div className="mt-7 grid gap-4 rounded-2xl border border-border bg-surface p-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="md:col-span-2 xl:col-span-4">
          <label htmlFor="report-search" className="text-sm font-bold text-foreground">Cari laporan</label>
          <div className="relative mt-2">
            <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="report-search"
              type="search"
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Nama perusahaan atau judul laporan"
              className={cn(inputClassName, "pl-11")}
            />
          </div>
        </div>

        <div>
          <label htmlFor="report-company" className="text-sm font-bold text-foreground">Perusahaan</label>
          <IndustrySelect
            id="report-company"
            value={filters.companySlug}
            onChange={(value) => updateFilter("companySlug", value)}
            placeholder="Semua perusahaan"
            options={[
              { value: "", label: "Semua perusahaan" },
              ...reportCompanies.map((company) => ({ value: company.slug, label: company.name })),
            ]}
            className="mt-2"
          />
        </div>
        <div>
          <label htmlFor="report-year" className="text-sm font-bold text-foreground">Tahun</label>
          <IndustrySelect
            id="report-year"
            value={filters.reportYear}
            onChange={(value) => updateFilter("reportYear", value)}
            placeholder="Semua tahun"
            options={reportYearOptions}
            className="mt-2"
          />
        </div>
        <div>
          <label htmlFor="report-type" className="text-sm font-bold text-foreground">Jenis laporan</label>
          <IndustrySelect
            id="report-type"
            value={filters.reportType}
            onChange={(value) => updateFilter("reportType", value)}
            placeholder="Semua jenis"
            options={reportTypeOptions}
            className="mt-2"
          />
        </div>
        <button
          type="button"
          onClick={() => setFilters(initialFilters)}
          className={cn(buttonVariants({ variant: "secondary", size: "medium" }), "self-end motion-reduce:transition-none")}
        >
          <RotateCcw aria-hidden="true" className="size-4" />
          Reset filter
        </button>
      </div>
      </Reveal>

      <p role="status" aria-live="polite" className="mt-6 text-sm text-muted-foreground">
        {filteredReports.length} dari {reports.length} laporan
      </p>

      {filteredReports.length ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {filteredReports.map((report, index) => (
            <Reveal
              key={report.id}
              direction="up"
              delay={Math.min(index, 3) * 70}
              className="h-full"
            >
              <Card variant="elevated" className="h-full flex flex-col p-5 sm:flex-row sm:items-center sm:gap-5 motion-reduce:transition-none">
                <div className="flex size-20 shrink-0 items-center justify-center rounded-xl border border-border bg-white p-3">
                  <Image src={report.companyLogoPath} alt={`Logo ${report.companyName}`} width={160} height={64} className="h-full w-full object-contain" />
                </div>
                <div className="mt-4 min-w-0 flex-1 sm:mt-0">
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-teal">{formatIndustryReportType(report.reportType)}</p>
                  <h3 className="mt-1 text-lg leading-7 text-foreground">{report.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{report.companyName}</p>
                  <p className="mt-3 text-xs text-muted-foreground">{report.reportYear} · {formatFileSize(report.fileSizeBytes)}</p>
                </div>
                <div className="mt-5 w-full shrink-0 sm:mt-0 sm:w-40">
                  <ReportDownloadLink downloadUrl={report.downloadUrl} fileName={report.fileName} compact />
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      ) : (
        <IndustryState kind="reports" title="Laporan tidak ditemukan" description="Sesuaikan kata kunci atau reset filter untuk melihat kembali laporan yang tersedia." className="mt-6" />
      )}

      <IndustryActionCards />
    </section>
  );
}
