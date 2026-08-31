import { Building2, FileText, Landmark, ShieldCheck } from "lucide-react";

import { Container } from "@/components/ui/container";
import type { PublicIndustryCompanySummary } from "@/features/industry/types/industry";

type IndustryHeroProps = {
  companies: PublicIndustryCompanySummary[];
  dataError: boolean;
};

export function IndustryHero({ companies, dataError }: IndustryHeroProps) {
  const reportCount = companies.reduce(
    (total, company) => total + company.reportCount,
    0,
  );
  const reportYears = Array.from(
    new Set(companies.flatMap((company) => company.availableReportYears)),
  ).sort((left, right) => left - right);
  const yearRange = reportYears.length
    ? `${reportYears[0]}–${reportYears.at(-1)}`
    : "Belum tersedia";

  const stats = [
    {
      icon: Building2,
      value: dataError ? "—" : String(companies.length),
      label: "Perusahaan publik",
    },
    {
      icon: FileText,
      value: dataError ? "—" : String(reportCount),
      label: "Laporan tersedia",
    },
    {
      icon: ShieldCheck,
      value: dataError ? "—" : yearRange,
      label: "Periode laporan",
    },
  ];

  return (
    <section className="relative isolate overflow-hidden border-b border-border pb-16 pt-32 sm:pb-20 sm:pt-36">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-[linear-gradient(115deg,#020817_0%,#061426_50%,#0a1d31_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-35 [background-image:linear-gradient(rgba(159,172,186,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(159,172,186,0.08)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_right,transparent,black_48%,black)]"
      />
      <div
        aria-hidden="true"
        className="absolute -right-24 top-12 -z-10 size-[430px] rounded-full bg-brand-blue/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute right-[12%] top-[30%] -z-10 size-64 rounded-full bg-brand-teal/8 blur-3xl"
      />

      <Container className="max-w-[1320px]">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)] lg:items-end">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-brand-cyan">
              <Landmark aria-hidden="true" className="size-4" />
              <span>Industry</span>
            </div>
            <h1 className="mt-5 text-4xl leading-tight text-foreground sm:text-5xl lg:text-6xl">
              Industri Pertambangan Indonesia
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              Jelajahi perusahaan tambang utama, laporan tahunan dan
              keberlanjutan, serta keterangan wilayah operasi yang telah
              tersedia untuk publik.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-4 rounded-2xl border border-border bg-surface/80 p-4 shadow-[0_14px_38px_rgba(0,0,0,0.2)] backdrop-blur-sm"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-brand-cyan/25 bg-brand-cyan/5">
                  <stat.icon aria-hidden="true" className="size-5 text-brand-cyan" />
                </span>
                <div>
                  <p className="text-lg font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
