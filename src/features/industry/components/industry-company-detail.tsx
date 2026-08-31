import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ExternalLink,
  FileText,
  MapPin,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import {
  formatFileSize,
  formatIndustryReportType,
} from "@/features/industry/lib/industry-view";
import type { PublicIndustryCompanyDetail } from "@/features/industry/types/industry";
import { cn } from "@/lib/utils";

import { IndustryState } from "./industry-states";
import { ReportDownloadLink } from "./report-download-link";

function ProfileItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/35 p-4">
      <dt className="text-xs font-bold uppercase tracking-[0.1em] text-brand-teal">
        {label}
      </dt>
      <dd className="mt-2 text-sm leading-7 text-muted-foreground">{value}</dd>
    </div>
  );
}

export function IndustryCompanyDetail({
  company,
}: {
  company: PublicIndustryCompanyDetail;
}) {
  return (
    <div className="bg-background pb-20 pt-32 sm:pt-36">
      <Container className="max-w-[1180px]">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <li>
              <Link
                href="/"
                className="rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan hover:text-brand-cyan"
              >
                Beranda
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href="/industry"
                className="rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan hover:text-brand-cyan"
              >
                Industri
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground">
              {company.name}
            </li>
          </ol>
        </nav>

        <header className="relative mt-7 overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-[0_20px_58px_rgba(0,0,0,0.22)] sm:p-8 lg:p-10">
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-24 size-72 rounded-full bg-brand-blue/10 blur-3xl"
          />
          <div className="relative flex flex-col gap-7 md:flex-row md:items-center">
            <div className="flex h-32 w-full shrink-0 items-center justify-center rounded-2xl border border-border bg-white/[0.04] p-5 md:w-52">
              <Image
                src={company.logoPath}
                alt={`Logo ${company.name}`}
                width={280}
                height={112}
                priority
                className="h-full w-full object-contain"
              />
            </div>

            <div className="min-w-0 flex-1">
              {company.companyType ? (
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-teal">
                  {company.companyType}
                </p>
              ) : (
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-teal">
                  Profil Perusahaan
                </p>
              )}
              <h1 className="mt-3 text-3xl leading-tight text-foreground sm:text-4xl lg:text-5xl">
                {company.name}
              </h1>
              {company.description ? (
                <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                  {company.description}
                </p>
              ) : (
                <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
                  Deskripsi lengkap perusahaan sedang dilengkapi dari sumber
                  resmi yang terverifikasi.
                </p>
              )}

              {company.officialWebsiteUrl ? (
                <a
                  href={company.officialWebsiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "medium" }),
                    "mt-6 motion-reduce:transition-none",
                  )}
                >
                  Website resmi
                  <ExternalLink aria-hidden="true" className="size-4" />
                </a>
              ) : null}
            </div>
          </div>
        </header>

        <div className="mt-8 grid gap-8">
          <section aria-labelledby="company-profile-heading">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl border border-brand-cyan/25 bg-brand-cyan/5">
                <Building2 aria-hidden="true" className="size-5 text-brand-cyan" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">
                  Informasi Perusahaan
                </p>
                <h2 id="company-profile-heading" className="mt-1 text-2xl text-foreground">
                  Profil perusahaan
                </h2>
              </div>
            </div>

            {company.businessField ||
            company.headquartersAddress ||
            company.establishedYear ? (
              <dl className="mt-5 grid gap-4 md:grid-cols-2">
                {company.businessField ? (
                  <ProfileItem label="Bidang usaha" value={company.businessField} />
                ) : null}
                {company.headquartersAddress ? (
                  <ProfileItem
                    label="Kantor pusat"
                    value={company.headquartersAddress}
                  />
                ) : null}
                {company.establishedYear ? (
                  <ProfileItem
                    label="Tahun berdiri"
                    value={company.establishedYear}
                  />
                ) : null}
                {company.companyType ? (
                  <ProfileItem label="Jenis perusahaan" value={company.companyType} />
                ) : null}
              </dl>
            ) : (
              <IndustryState
                kind="companies"
                title="Profil rinci belum tersedia"
                description="Field profil perusahaan ini belum tersedia pada data publik yang terverifikasi."
                className="mt-5"
              />
            )}
          </section>

          <section aria-labelledby="company-operation-heading">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl border border-brand-cyan/25 bg-brand-cyan/5">
                <MapPin aria-hidden="true" className="size-5 text-brand-cyan" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">
                  Persebaran Kegiatan
                </p>
                <h2 id="company-operation-heading" className="mt-1 text-2xl text-foreground">
                  Wilayah operasi
                </h2>
              </div>
            </div>

            {company.operationAreaDescription ? (
              <Card variant="elevated" className="mt-5 p-6 sm:p-7">
                <p className="text-base leading-8 text-muted-foreground">
                  {company.operationAreaDescription}
                </p>
                <p className="mt-5 border-t border-border pt-4 text-xs leading-6 text-muted-foreground">
                  Informasi ditampilkan sebagai deskripsi wilayah. MineVision
                  belum menampilkan peta atau koordinat sampai data lokasi
                  terstruktur dan terverifikasi tersedia.
                </p>
              </Card>
            ) : (
              <IndustryState
                kind="operations"
                title="Wilayah operasi belum tersedia"
                description="Keterangan wilayah operasi perusahaan ini belum tersedia pada response publik."
                className="mt-5"
              />
            )}
          </section>

          <section aria-labelledby="company-reports-heading">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl border border-brand-cyan/25 bg-brand-cyan/5">
                  <FileText aria-hidden="true" className="size-5 text-brand-cyan" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">
                    Dokumen Publik
                  </p>
                  <h2 id="company-reports-heading" className="mt-1 text-2xl text-foreground">
                    Sustainability &amp; Annual Report
                  </h2>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {company.reportCount} laporan tersedia
              </p>
            </div>

            {company.reports.length ? (
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {company.reports.map((report) => (
                  <Card key={report.id} variant="elevated" className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-teal">
                          {formatIndustryReportType(report.reportType)}
                        </p>
                        <h3 className="mt-2 text-lg leading-7 text-foreground">
                          {report.title}
                        </h3>
                      </div>
                      <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background/40 px-3 py-1 text-xs text-muted-foreground">
                        <CalendarDays aria-hidden="true" className="size-3.5" />
                        {report.reportYear}
                      </span>
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">
                      PDF · {formatFileSize(report.fileSizeBytes)}
                    </p>
                    <div className="mt-5">
                      <ReportDownloadLink
                        downloadUrl={report.downloadUrl}
                        fileName={report.fileName}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <IndustryState
                kind="reports"
                title="Laporan belum tersedia"
                description="Belum ada laporan perusahaan yang terverifikasi dan dipublikasikan."
                className="mt-5"
              />
            )}
          </section>
        </div>

        <Link
          href="/industry?category=companies"
          className={cn(
            buttonVariants({ variant: "ghost", size: "medium" }),
            "mt-10 px-0 text-brand-cyan motion-reduce:transition-none",
          )}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Kembali ke direktori perusahaan
        </Link>
      </Container>
    </div>
  );
}
