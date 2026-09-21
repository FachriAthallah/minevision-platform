import type { Metadata } from "next";
import {
  CalendarRange,
  Database,
  FileCheck2,
  RefreshCw,
} from "lucide-react";

import { Reveal } from "@/components/shared/reveal";
import { Container } from "@/components/ui/container";
import { EconomyDashboard } from "@/features/economy/components/economy-dashboard";
import { economyDashboardQuerySchema } from "@/features/economy/schemas/dashboard-query";
import { getPublicEconomyDashboard } from "@/features/economy/server/get-public-economy-dashboard";

export const metadata: Metadata = {
  title: "Data Ekonomi Pertambangan Indonesia",
  description:
    "Jelajahi PDB pertambangan, hilirisasi, ekspor, investasi, dan regulasi melalui data publik yang telah diverifikasi.",
};

export const dynamic = "force-dynamic";

type EconomyPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EconomyPage({ searchParams }: EconomyPageProps) {
  const [dashboard, rawSearchParams] = await Promise.all([
    getPublicEconomyDashboard(),
    searchParams,
  ]);
  const parsedQuery = economyDashboardQuerySchema.safeParse({
    section:
      typeof rawSearchParams.section === "string"
        ? rawSearchParams.section
        : undefined,
  });
  const initialSection = parsedQuery.success
    ? (parsedQuery.data.section ?? "gdp")
    : "gdp";

  const period =
    dashboard.meta.gdpYearFrom !== null && dashboard.meta.gdpYearTo !== null
      ? `${dashboard.meta.gdpYearFrom}–${dashboard.meta.gdpYearTo}`
      : "Belum tersedia";
  const heroStats = [
    {
      icon: Database,
      value: "5",
      label: "Model Ekonomi",
      description: "PDB, ekspor, investasi, hilirisasi, dan regulasi.",
    },
    {
      icon: CalendarRange,
      value: period,
      label: "Periode PDB",
      description: "Rentang observasi publik yang tersedia saat ini.",
    },
    {
      icon: FileCheck2,
      value: "Resmi",
      label: "Sumber Data",
      description: "Rujukan pemerintah dan operator yang terverifikasi.",
    },
    {
      icon: RefreshCw,
      value: "Terkurasi",
      label: "Pembaruan Data",
      description: "Diperbarui melalui proses validasi dan publikasi terpisah.",
    },
  ];

  return (
    <div className="bg-[#020817]">
      <section className="relative isolate overflow-hidden border-b border-white/10 pb-14 pt-32 sm:pb-16 sm:pt-36">
        <div aria-hidden="true" className="absolute inset-0 -z-20 bg-[#061122] bg-[url('/images/economy/bg_economy.jpg')] bg-cover bg-[position:64%_center] sm:bg-center" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_30%,rgba(0,177,196,.12),transparent_34%),radial-gradient(circle_at_18%_85%,rgba(40,103,228,.12),transparent_34%),linear-gradient(100deg,rgba(2,8,23,.98)_0%,rgba(3,15,29,.88)_48%,rgba(2,8,23,.72)_100%)]" />
        <Container className="max-w-[1320px]">
          <div className="max-w-4xl">
            <Reveal direction="fade">
              <p className="flex items-center gap-2 text-sm font-semibold text-brand-cyan"><Database aria-hidden="true" className="size-4" />Economy</p>
              <h1 className="mt-5 text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">Data Ekonomi Pertambangan Indonesia</h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[#b7c3d1] sm:text-lg">Pahami kontribusi sektor pertambangan, perkembangan hilirisasi, serta kesiapan data ekspor, investasi, dan regulasi untuk mendukung analisis dan pengambilan keputusan yang bertanggung jawab.</p>
            </Reveal>
          </div>
          <Reveal direction="up" delay={140}>
            <dl className="mt-8 grid max-w-5xl gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {heroStats.map(({ icon: Icon, value, label, description }) => (
                <div key={label} className="min-h-32 rounded-2xl border border-white/10 bg-[#08172a]/86 p-4 shadow-[0_16px_45px_rgba(0,0,0,.22)] backdrop-blur-sm sm:p-5">
                  <div className="flex items-start gap-3">
                    <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-cyan" />
                    <div className="flex min-w-0 flex-col">
                      <dt className="order-2 mt-1 text-sm font-semibold text-white">{label}</dt>
                      <dd className="contents"><span className="order-1 break-words text-lg font-bold leading-tight text-white">{value}</span><span className="order-3 mt-1.5 text-xs leading-5 text-[#8fa0b4]">{description}</span></dd>
                    </div>
                  </div>
                </div>
              ))}
            </dl>
          </Reveal>
        </Container>
      </section>

      <section className="relative py-12 sm:py-16 lg:py-20">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(40,103,228,.08),transparent_25%),radial-gradient(circle_at_90%_40%,rgba(60,195,171,.06),transparent_28%)]" />
        <Container className="relative max-w-[1320px]"><EconomyDashboard dashboard={dashboard} initialSection={initialSection} /></Container>
      </section>
    </div>
  );
}
