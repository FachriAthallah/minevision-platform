import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ExternalLink,
  Factory,
  FileText,
  Landmark,
  MapPin,
  TrendingUp,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { getIndustryCompanyPresentation } from "@/features/industry/content/industry-company-content";
import {
  buildFinancialRows,
  buildOfficialReferences,
  buildPrimaryProductionRows,
  INDUSTRY_YEARS,
  type IndustryDataTableRow,
} from "@/features/industry/lib/industry-company-view";
import {
  formatFileSize,
  formatIndustryReportType,
} from "@/features/industry/lib/industry-view";
import type { PublicIndustryCompanyDetail } from "@/features/industry/types/industry";
import { cn } from "@/lib/utils";

import { IndustryState } from "./industry-states";
import { ReportDownloadLink } from "./report-download-link";

function SectionHeading({
  eyebrow,
  title,
  id,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  id: string;
  icon: typeof Building2;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-brand-cyan/25 bg-brand-cyan/5">
        <Icon aria-hidden="true" className="size-5 text-brand-cyan" />
      </span>
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-teal">{eyebrow}</p>
        <h2 id={id} className="mt-1 text-2xl text-foreground">{title}</h2>
      </div>
    </div>
  );
}

function ProfileItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-background/35 p-4">
      <dt className="text-xs font-bold uppercase tracking-[0.1em] text-brand-teal">{label}</dt>
      <dd className="mt-2 text-sm leading-7 text-muted-foreground">{value}</dd>
    </div>
  );
}

function IndustryDataTable({
  caption,
  rows,
}: {
  caption: string;
  rows: IndustryDataTableRow[];
}) {
  return (
    <div className="mt-5 overflow-x-auto rounded-2xl border border-border">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface-secondary text-foreground">
          <tr>
            <th scope="col" className="px-5 py-4 font-bold">Indikator</th>
            <th scope="col" className="px-5 py-4 font-bold">Satuan/Basis</th>
            {INDUSTRY_YEARS.map((year) => (
              <th key={year} scope="col" className="px-5 py-4 text-right font-bold">{year}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-border bg-surface/45">
              <th scope="row" className="px-5 py-4 font-bold text-foreground">{row.label}</th>
              <td className="px-5 py-4 text-muted-foreground">{row.basis}</td>
              {INDUSTRY_YEARS.map((year) => (
                <td key={year} className="px-5 py-4 text-right tabular-nums text-muted-foreground">{row.values[year]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function IndustryCompanyDetail({
  company,
}: {
  company: PublicIndustryCompanyDetail;
}) {
  const presentation = getIndustryCompanyPresentation(company.slug);
  const productionRows = buildPrimaryProductionRows(company);
  const financialRows = buildFinancialRows(company.financials);
  const references = buildOfficialReferences(company);

  return (
    <div className="bg-background pb-20 pt-32 sm:pt-36">
      <Container className="max-w-[1180px]">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <li><Link href="/" className="rounded hover:text-brand-cyan focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan">Beranda</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/industry" className="rounded hover:text-brand-cyan focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan">Industri</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground">{company.name}</li>
          </ol>
        </nav>

        <header className="relative mt-7 overflow-hidden rounded-3xl border border-border bg-surface p-6 shadow-[0_20px_58px_rgba(0,0,0,0.22)] sm:p-8 lg:p-10">
          <div aria-hidden="true" className="absolute -right-20 -top-24 size-72 rounded-full bg-brand-blue/10 blur-3xl" />
          <div className="relative flex flex-col gap-7 md:flex-row md:items-center">
            <div className="flex h-32 w-full shrink-0 items-center justify-center rounded-2xl border border-border bg-white p-5 md:w-52">
              <Image src={company.logoPath} alt={`Logo ${company.name}`} width={280} height={112} priority className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-teal">{company.companyType ?? "Profil Perusahaan"}</p>
              <h1 className="mt-3 text-3xl leading-tight text-foreground sm:text-4xl lg:text-5xl">{company.name}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
                {company.description ?? "Deskripsi perusahaan belum tersedia pada data publik terverifikasi."}
              </p>
              {company.officialWebsiteUrl ? (
                <a href={company.officialWebsiteUrl} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "outline", size: "medium" }), "mt-6 motion-reduce:transition-none")}>
                  Website resmi <ExternalLink aria-hidden="true" className="size-4" />
                </a>
              ) : null}
            </div>
          </div>
        </header>

        <div className="mt-10 grid gap-12">
          <section aria-labelledby="company-profile-heading">
            <SectionHeading eyebrow="Informasi Perusahaan" title="Profil perusahaan" id="company-profile-heading" icon={Building2} />
            <dl className="mt-5 grid gap-4 md:grid-cols-2">
              {company.businessField ? <ProfileItem label="Bidang usaha" value={company.businessField} /> : null}
              {company.establishedYear ? <ProfileItem label="Tahun berdiri" value={company.establishedYear} /> : null}
              {company.headquartersAddress ? <ProfileItem label="Kantor pusat" value={company.headquartersAddress} /> : null}
              {company.companyType ? <ProfileItem label="Jenis perusahaan" value={company.companyType} /> : null}
              {presentation?.operationAreaSize ? <ProfileItem label="Luas wilayah operasi" value={presentation.operationAreaSize} /> : null}
              {presentation?.primaryCommodity ? <ProfileItem label="Komoditas utama" value={presentation.primaryCommodity} /> : null}
            </dl>
          </section>

          <section aria-labelledby="company-history-heading">
            <SectionHeading eyebrow="Tonggak Perusahaan" title="Sejarah perusahaan" id="company-history-heading" icon={Landmark} />
            {presentation?.timeline.length ? (
              <ol className="relative mt-7 space-y-0 border-l border-brand-cyan/35 pl-7 sm:ml-3 sm:pl-9">
                {presentation.timeline.map((entry, index) => (
                  <li key={`${entry.year}-${index}`} className="relative pb-8 last:pb-0">
                    <span aria-hidden="true" className="absolute -left-[2.16rem] top-1.5 size-3 rounded-full border-2 border-background bg-brand-cyan shadow-[0_0_0_4px_rgba(0,177,196,0.16)] sm:-left-[2.66rem]" />
                    <time className="text-sm font-bold text-brand-cyan">{entry.year}</time>
                    <p className="mt-2 max-w-4xl text-sm leading-7 text-muted-foreground sm:text-base">{entry.event}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <IndustryState kind="companies" title="Sejarah belum tersedia" description="Tonggak perusahaan belum tersedia pada konten terverifikasi." className="mt-5" />
            )}
          </section>

          <section aria-labelledby="company-production-heading">
            <SectionHeading eyebrow="Kinerja Operasional" title="Produksi Komoditas Primer 2023–2025" id="company-production-heading" icon={Factory} />
            {productionRows.length ? (
              <>
                <IndustryDataTable caption={`Produksi komoditas primer ${company.name} tahun 2023 sampai 2025`} rows={productionRows} />
                <p className="mt-3 text-xs leading-6 text-muted-foreground">
                  Nilai mempertahankan satuan dan basis laporan resmi. “—” berarti nilai tidak tersedia pada data publik terverifikasi; data pending/draft tidak ditampilkan dan tidak diubah menjadi nol.
                </p>
              </>
            ) : (
              <IndustryState kind="companies" title="Data produksi belum tersedia" description="Belum ada produksi komoditas primer yang terverifikasi dan dipublikasikan." className="mt-5" />
            )}
          </section>

          <section aria-labelledby="company-financial-heading">
            <SectionHeading eyebrow="Kinerja Perusahaan" title="Kinerja Keuangan 2023–2025" id="company-financial-heading" icon={TrendingUp} />
            {financialRows.length ? (
              <>
                <IndustryDataTable caption={`Kinerja keuangan ${company.name} tahun 2023 sampai 2025`} rows={financialRows} />
                <p className="mt-3 text-xs leading-6 text-muted-foreground">
                  Mata uang dan basis mengikuti laporan perusahaan. MineVision tidak melakukan konversi atau menjumlahkan nilai USD dengan IDR.
                </p>
              </>
            ) : (
              <IndustryState kind="companies" title="Data keuangan belum tersedia" description="Belum ada data keuangan yang terverifikasi dan dipublikasikan." className="mt-5" />
            )}
          </section>

          <section aria-labelledby="company-operation-heading">
            <SectionHeading eyebrow="Persebaran Kegiatan" title="Wilayah operasi" id="company-operation-heading" icon={MapPin} />
            {company.operationAreaDescription ? (
              <Card variant="elevated" className="mt-5 p-6 sm:p-7">
                <p className="text-base leading-8 text-muted-foreground">{company.operationAreaDescription}</p>
              </Card>
            ) : null}
            {company.operationSites.length ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {company.operationSites.map((site) => (
                  <Card key={site.id} variant="elevated" className="p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-teal">{site.statusLabel}</p>
                    <h3 className="mt-2 text-lg text-foreground">{site.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{[site.regencyName, site.provinceName].filter(Boolean).join(", ")}</p>
                    <p className="mt-3 border-t border-border pt-3 text-xs leading-6 text-muted-foreground">{site.locationDescription}</p>
                  </Card>
                ))}
              </div>
            ) : (
              <IndustryState kind="operations" title="Lokasi operasi belum tersedia" description="Belum ada lokasi berkoordinat yang terverifikasi dan dipublikasikan." className="mt-5" />
            )}
          </section>

          <section aria-labelledby="company-reports-heading">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading eyebrow="Dokumen Publik" title="Sustainability & Annual Report" id="company-reports-heading" icon={FileText} />
              <p className="text-sm text-muted-foreground">{company.reportCount} laporan tersedia</p>
            </div>
            {company.reports.length ? (
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {company.reports.map((report) => (
                  <Card key={report.id} variant="elevated" className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-teal">{formatIndustryReportType(report.reportType)}</p>
                        <h3 className="mt-2 text-lg leading-7 text-foreground">{report.title}</h3>
                      </div>
                      <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background/40 px-3 py-1 text-xs text-muted-foreground"><CalendarDays aria-hidden="true" className="size-3.5" />{report.reportYear}</span>
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">PDF · {formatFileSize(report.fileSizeBytes)}</p>
                    <div className="mt-5"><ReportDownloadLink downloadUrl={report.downloadUrl} fileName={report.fileName} /></div>
                  </Card>
                ))}
              </div>
            ) : (
              <IndustryState kind="reports" title="Laporan belum tersedia" description="Belum ada laporan perusahaan yang terverifikasi dan dipublikasikan." className="mt-5" />
            )}
          </section>

          <section id="sumber-dan-referensi-resmi" aria-labelledby="company-sources-heading" className="scroll-mt-32">
            <SectionHeading eyebrow="Transparansi Data" title="Sumber dan Referensi Resmi" id="company-sources-heading" icon={FileText} />
            {references.length ? (
              <ul className="mt-5 grid gap-4 md:grid-cols-2">
                {references.map((reference) => (
                  <li key={reference.url}>
                    <a href={reference.url} target="_blank" rel="noopener noreferrer" className="group block h-full rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-brand-cyan/40 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan motion-reduce:transition-none">
                      <p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-teal">{reference.documentType}{reference.year ? ` · ${reference.year}` : ""}</p>
                      <h3 className="mt-2 font-sans text-base font-bold leading-7 text-foreground group-hover:text-brand-cyan">{reference.title} <ExternalLink aria-hidden="true" className="ml-1 inline size-4" /></h3>
                      <p className="mt-2 text-sm text-muted-foreground">{reference.institution}</p>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <IndustryState kind="reports" title="Referensi belum tersedia" description="Belum ada tautan sumber resmi pada data publik perusahaan ini." className="mt-5" />
            )}
          </section>
        </div>

        <Link href="/industry?category=companies" className={cn(buttonVariants({ variant: "primary", size: "medium" }), "mt-10 motion-reduce:transition-none")}>
          <ArrowLeft aria-hidden="true" className="size-4" /> Kembali ke direktori perusahaan
        </Link>
      </Container>
    </div>
  );
}
