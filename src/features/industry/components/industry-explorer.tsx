"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  FileText,
  MapPin,
  MapPinned,
  RotateCcw,
  Search,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  filterIndustryCompanies,
  filterIndustryOperations,
  filterIndustryReports,
  formatFileSize,
  formatIndustryReportType,
} from "@/features/industry/lib/industry-view";
import type { PublicIndustryCompanySummary } from "@/features/industry/types/industry";
import type {
  IndustryCategory,
  IndustryReportCatalogItem,
  IndustryReportFilters,
} from "@/features/industry/types/industry-view";
import { cn } from "@/lib/utils";

import { IndustryState } from "./industry-states";
import { ReportDownloadLink } from "./report-download-link";

type IndustryExplorerProps = {
  category: IndustryCategory;
  companies: PublicIndustryCompanySummary[];
  reports: IndustryReportCatalogItem[];
  dataError: boolean;
};

const initialReportFilters: IndustryReportFilters = {
  search: "",
  companySlug: "",
  reportYear: "",
  reportType: "",
};

const inputClassName =
  "min-h-11 w-full rounded-xl border border-border bg-background/45 px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/65 hover:border-brand-cyan/40 focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20";

function ResultSummary({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
      {children}
    </p>
  );
}

function SearchField({
  id,
  label,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-bold text-foreground">
        {label}
      </label>
      <div className="relative mt-2">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          id={id}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={cn(inputClassName, "pl-11")}
        />
      </div>
    </div>
  );
}

function CompanyCard({ company }: { company: PublicIndustryCompanySummary }) {
  const description = company.businessField ?? company.description;
  const location =
    company.headquartersAddress ?? company.operationAreaDescription;

  return (
    <Card
      variant="elevated"
      className="group flex h-full flex-col overflow-hidden motion-reduce:transition-none"
    >
      <div className="flex min-h-32 items-center justify-center border-b border-border bg-white/[0.035] p-6">
        <Image
          src={company.logoPath}
          alt={`Logo ${company.name}`}
          width={240}
          height={96}
          className="h-20 w-full object-contain"
        />
      </div>

      <div className="flex flex-1 flex-col p-6">
        {company.companyType ? (
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">
            {company.companyType}
          </p>
        ) : null}
        <h3 className="mt-2 text-xl leading-7 text-foreground">
          {company.name}
        </h3>

        {description ? (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : (
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Profil perusahaan sedang dilengkapi dari sumber resmi.
          </p>
        )}

        <div className="mt-5 space-y-3 border-t border-border pt-4 text-sm text-muted-foreground">
          {location ? (
            <p className="flex items-start gap-2">
              <MapPin
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-brand-cyan"
              />
              <span className="line-clamp-2">{location}</span>
            </p>
          ) : null}
          <p className="flex items-center gap-2">
            <FileText
              aria-hidden="true"
              className="size-4 shrink-0 text-brand-cyan"
            />
            {company.reportCount} laporan tersedia
          </p>
        </div>

        <Link
          href={`/industry/${company.slug}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "medium" }),
            "mt-6 w-full motion-reduce:transition-none",
          )}
        >
          Lihat profil
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </Card>
  );
}

function CompaniesDirectory({
  companies,
}: {
  companies: PublicIndustryCompanySummary[];
}) {
  const [search, setSearch] = useState("");
  const filteredCompanies = useMemo(
    () => filterIndustryCompanies(companies, search),
    [companies, search],
  );

  return (
    <section aria-labelledby="industry-companies-heading">
      <div className="flex flex-col gap-5 border-b border-border pb-7 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-teal">
            Direktori Industri
          </p>
          <h2 id="industry-companies-heading" className="mt-2 text-3xl text-foreground">
            Perusahaan Tambang Utama
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Temukan profil perusahaan, bidang usaha, wilayah operasi, dan
            koleksi laporan resmi yang tersedia untuk publik.
          </p>
        </div>
        <div className="w-full md:max-w-sm">
          <SearchField
            id="company-search"
            label="Cari perusahaan"
            placeholder="Nama atau bidang usaha"
            value={search}
            onChange={setSearch}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <ResultSummary>
          {filteredCompanies.length} dari {companies.length} perusahaan
        </ResultSummary>
      </div>

      {filteredCompanies.length ? (
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredCompanies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      ) : (
        <IndustryState
          kind="companies"
          title="Perusahaan tidak ditemukan"
          description="Coba gunakan nama perusahaan atau bidang usaha yang berbeda."
          className="mt-6"
        />
      )}
    </section>
  );
}

function ReportCatalog({
  companies,
  reports,
}: {
  companies: PublicIndustryCompanySummary[];
  reports: IndustryReportCatalogItem[];
}) {
  const [filters, setFilters] = useState<IndustryReportFilters>(
    initialReportFilters,
  );
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
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-teal">
          Dokumen Perusahaan
        </p>
        <h2 id="industry-reports-heading" className="mt-2 text-3xl text-foreground">
          Sustainability &amp; Annual Report
        </h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Katalog lintas perusahaan untuk laporan tahunan dan laporan
          keberlanjutan yang telah diverifikasi serta dipublikasikan.
        </p>
      </div>

      <div className="mt-7 grid gap-4 rounded-2xl border border-border bg-surface p-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="md:col-span-2 xl:col-span-4">
          <SearchField
            id="report-search"
            label="Cari laporan"
            placeholder="Nama perusahaan atau judul laporan"
            value={filters.search}
            onChange={(value) => updateFilter("search", value)}
          />
        </div>

        <div>
          <label htmlFor="report-company" className="text-sm font-bold text-foreground">
            Perusahaan
          </label>
          <select
            id="report-company"
            value={filters.companySlug}
            onChange={(event) => updateFilter("companySlug", event.target.value)}
            className={cn(inputClassName, "mt-2")}
          >
            <option value="">Semua perusahaan</option>
            {reportCompanies.map((company) => (
              <option key={company.id} value={company.slug}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="report-year" className="text-sm font-bold text-foreground">
            Tahun
          </label>
          <select
            id="report-year"
            value={filters.reportYear}
            onChange={(event) => updateFilter("reportYear", event.target.value)}
            className={cn(inputClassName, "mt-2")}
          >
            <option value="">Semua tahun</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
        </div>

        <div>
          <label htmlFor="report-type" className="text-sm font-bold text-foreground">
            Jenis laporan
          </label>
          <select
            id="report-type"
            value={filters.reportType}
            onChange={(event) => updateFilter("reportType", event.target.value)}
            className={cn(inputClassName, "mt-2")}
          >
            <option value="">Semua jenis</option>
            <option value="annual_report">Laporan Tahunan</option>
            <option value="sustainability_report">
              Laporan Keberlanjutan
            </option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setFilters(initialReportFilters)}
          className={cn(
            buttonVariants({ variant: "secondary", size: "medium" }),
            "self-end motion-reduce:transition-none",
          )}
        >
          <RotateCcw aria-hidden="true" className="size-4" />
          Reset filter
        </button>
      </div>

      <div className="mt-6">
        <ResultSummary>
          {filteredReports.length} dari {reports.length} laporan
        </ResultSummary>
      </div>

      {filteredReports.length ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {filteredReports.map((report) => (
            <Card
              key={report.id}
              variant="elevated"
              className="flex flex-col p-5 sm:flex-row sm:items-center sm:gap-5 motion-reduce:transition-none"
            >
              <div className="flex size-20 shrink-0 items-center justify-center rounded-xl border border-border bg-white/[0.035] p-3">
                <Image
                  src={report.companyLogoPath}
                  alt={`Logo ${report.companyName}`}
                  width={160}
                  height={64}
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="mt-4 min-w-0 flex-1 sm:mt-0">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-teal">
                  {formatIndustryReportType(report.reportType)}
                </p>
                <h3 className="mt-1 text-lg leading-7 text-foreground">
                  {report.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {report.companyName}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {report.reportYear} · {formatFileSize(report.fileSizeBytes)}
                </p>
              </div>

              <div className="mt-5 w-full shrink-0 sm:mt-0 sm:w-40">
                <ReportDownloadLink
                  downloadUrl={report.downloadUrl}
                  fileName={report.fileName}
                  compact
                />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <IndustryState
          kind="reports"
          title="Laporan tidak ditemukan"
          description="Sesuaikan kata kunci atau reset filter untuk melihat kembali laporan yang tersedia."
          className="mt-6"
        />
      )}
    </section>
  );
}

function OperationsDirectory({
  companies,
}: {
  companies: PublicIndustryCompanySummary[];
}) {
  const [search, setSearch] = useState("");
  const filteredCompanies = useMemo(
    () => filterIndustryOperations(companies, search),
    [companies, search],
  );

  return (
    <section aria-labelledby="industry-operations-heading">
      <div className="flex flex-col gap-5 border-b border-border pb-7 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-teal">
            Persebaran Operasi
          </p>
          <h2 id="industry-operations-heading" className="mt-2 text-3xl text-foreground">
            Wilayah Operasi
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Telusuri keterangan wilayah operasi publik berdasarkan perusahaan.
            Peta akan ditambahkan setelah data lokasi terstruktur dan koordinat
            terverifikasi tersedia.
          </p>
        </div>
        <div className="w-full md:max-w-sm">
          <SearchField
            id="operation-search"
            label="Cari wilayah atau perusahaan"
            placeholder="Contoh: Sorowako atau Vale"
            value={search}
            onChange={setSearch}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-brand-cyan/20 bg-brand-cyan/5 p-5 sm:flex-row sm:items-start">
        <MapPinned
          aria-hidden="true"
          className="size-6 shrink-0 text-brand-cyan"
        />
        <div>
          <h3 className="font-sans text-base font-bold text-foreground">
            Tampilan daftar berbasis data terverifikasi
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            MineVision tidak menampilkan marker atau koordinat perkiraan. Setiap
            kartu di bawah menggunakan teks wilayah yang tersedia pada API
            publik.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <ResultSummary>
          {filteredCompanies.length} dari {companies.length} perusahaan
        </ResultSummary>
      </div>

      {filteredCompanies.length ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {filteredCompanies.map((company) => (
            <Card key={company.id} variant="elevated" className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-xl border border-border bg-white/[0.035] p-2.5">
                  <Image
                    src={company.logoPath}
                    alt={`Logo ${company.name}`}
                    width={128}
                    height={52}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl leading-7 text-foreground">
                    {company.name}
                  </h3>
                  {company.headquartersAddress ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Kantor pusat: {company.headquartersAddress}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-border bg-background/35 p-4">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-brand-teal">
                  <MapPin aria-hidden="true" className="size-4" />
                  Keterangan wilayah operasi
                </p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {company.operationAreaDescription ??
                    "Informasi wilayah operasi belum tersedia untuk publik."}
                </p>
              </div>

              <Link
                href={`/industry/${company.slug}`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "medium" }),
                  "mt-4 px-0 text-brand-cyan motion-reduce:transition-none",
                )}
              >
                Lihat profil perusahaan
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <IndustryState
          kind="operations"
          title="Wilayah tidak ditemukan"
          description="Coba cari menggunakan nama daerah atau nama perusahaan yang berbeda."
          className="mt-6"
        />
      )}
    </section>
  );
}

export function IndustryExplorer({
  category,
  companies,
  reports,
  dataError,
}: IndustryExplorerProps) {
  if (dataError) {
    return (
      <IndustryState
        kind="error"
        title="Data Industri belum dapat dimuat"
        description="Terjadi kendala saat mengambil data publik. Silakan muat ulang halaman atau coba kembali beberapa saat lagi."
      />
    );
  }

  if (companies.length === 0) {
    return (
      <IndustryState
        kind="companies"
        title="Data Industri belum tersedia"
        description="Belum ada perusahaan terverifikasi dan dipublikasikan yang dapat ditampilkan."
      />
    );
  }

  if (category === "reports") {
    return <ReportCatalog companies={companies} reports={reports} />;
  }

  if (category === "operations") {
    return <OperationsDirectory companies={companies} />;
  }

  return <CompaniesDirectory companies={companies} />;
}
