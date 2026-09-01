import { Building2, FileText, Landmark, MapPinned } from "lucide-react";

import { Container } from "@/components/ui/container";
import type { PublicIndustryCompanySummary } from "@/features/industry/types/industry";
import type { PublicIndustryOperationSite } from "@/features/industry/types/industry";
import { getIndustryHeroStatistics } from "@/features/industry/lib/industry-company-view";

type IndustryHeroProps = {
  companies: PublicIndustryCompanySummary[];
  operationSites: PublicIndustryOperationSite[];
  dataError: boolean;
};

export function IndustryHero({
  companies,
  operationSites,
  dataError,
}: IndustryHeroProps) {
  const statistics = getIndustryHeroStatistics(companies, operationSites);

  const stats = [
    {
      icon: Building2,
      value: dataError ? "—" : String(statistics.companyCount),
      label: "Perusahaan Utama",
      description: "Perusahaan tambang utama Indonesia.",
    },
    {
      icon: FileText,
      value: dataError ? "—" : String(statistics.reportCount),
      label: "Laporan Tersedia",
      description:
        "Informasi resmi berdasarkan laporan tahunan dan keberlanjutan perusahaan.",
    },
    {
      icon: MapPinned,
      value: dataError ? "—" : String(statistics.operationSiteCount),
      label: "Lokasi Operasi",
      description:
        "Peta berbagai lokasi operasi industri pertambangan Indonesia.",
    },
  ];

  return (
    <section className="relative isolate overflow-hidden border-b border-border pb-16 pt-32 sm:pb-20 sm:pt-36">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-30 bg-[linear-gradient(115deg,#020817_0%,#061426_50%,#0a1d31_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-[url('/images/industry/bg_industry.png')] bg-cover bg-[position:62%_center] opacity-65 sm:bg-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,8,23,0.98)_0%,rgba(2,8,23,0.87)_48%,rgba(2,8,23,0.58)_100%),linear-gradient(0deg,rgba(2,8,23,0.88)_0%,transparent_58%)]"
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
                <div className="min-w-0">
                  <p className="text-lg font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm font-bold leading-5 text-foreground">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {stat.description}
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
