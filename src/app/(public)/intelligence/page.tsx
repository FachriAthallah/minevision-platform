import type { Metadata } from "next";
import { BarChart3, Database, MapPinned, TrendingUp } from "lucide-react";

import { Container } from "@/components/ui/container";
import { IntelligenceDashboard } from "@/features/intelligence/components/intelligence-dashboard";
import { formatCompactNumber } from "@/features/intelligence/lib/intelligence-format";
import { getPublicIntelligenceDashboard } from "@/features/intelligence/server/get-public-intelligence-dashboard";

export const metadata: Metadata = {
  title: "Data Intelligence Pertambangan Indonesia",
  description:
    "Jelajahi data produksi, harga domestik, tren, dan cakupan wilayah tujuh komoditas pertambangan Indonesia dari seri kanonik terverifikasi.",
};

export const dynamic = "force-dynamic";

export default async function IntelligencePage() {
  const dashboard = await getPublicIntelligenceDashboard();
  const heroStats = [
    { icon: Database, value: dashboard.meta.commodityCount, label: "Komoditas", description: "Seri komoditas pilihan dalam satu dashboard." },
    { icon: BarChart3, value: dashboard.meta.productionObservationCount, label: "Data Produksi", description: "Observasi kanonik yang siap dibandingkan." },
    { icon: TrendingUp, value: dashboard.meta.priceObservationCount, label: "Data Harga", description: "Harga domestik resmi yang telah dipublikasikan." },
    { icon: MapPinned, value: dashboard.meta.coverageRegionCount, label: "Cakupan Wilayah", description: "Relasi wilayah terverifikasi tanpa klaim peringkat buatan." },
  ];

  return (
    <div className="bg-[#020817]">
      <section className="relative isolate overflow-hidden border-b border-white/10 pb-16 pt-32 sm:pb-20 sm:pt-36">
        <div aria-hidden="true" className="absolute inset-0 -z-20 bg-surface bg-[url('/images/intelligence/bg_intelligence.jpg')] bg-cover bg-center" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,8,23,.98)_0%,rgba(3,15,33,.94)_44%,rgba(3,15,33,.76)_70%,rgba(2,8,23,.91)_100%)]" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_40%,rgba(0,177,196,.14),transparent_32%)]" />
        <Container className="max-w-[1320px]">
          <div className="max-w-3xl">
            <p className="flex items-center gap-2 text-sm font-semibold text-brand-cyan"><Database aria-hidden="true" className="size-4" />Intelligence</p>
            <h1 className="mt-5 text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">Data Pertambangan dalam Satu Pandangan</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#b7c3d1] sm:text-lg">Bandingkan tren produksi, harga domestik, dan persebaran wilayah tujuh komoditas melalui data kanonik yang telah diverifikasi dan dipublikasikan.</p>
          </div>
          <dl className="mt-9 grid max-w-5xl gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {heroStats.map(({ icon: Icon, value, label, description }) => (
              <div key={label} className="min-h-36 rounded-2xl border border-white/10 bg-[#08172a]/82 p-5 shadow-[0_16px_45px_rgba(0,0,0,.22)] backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-cyan" />
                  <div className="flex flex-col">
                    <dt className="order-2 mt-1 text-sm font-semibold text-white">{label}</dt>
                    <dd className="contents">
                      <span className="order-1 text-lg font-bold leading-tight text-white">{formatCompactNumber(value)}</span>
                      <span className="order-3 mt-1.5 text-xs leading-5 text-[#8fa0b4]">{description}</span>
                    </dd>
                  </div>
                </div>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section className="relative py-12 sm:py-16 lg:py-20">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(40,103,228,.08),transparent_25%),radial-gradient(circle_at_90%_40%,rgba(60,195,171,.06),transparent_28%)]" />
        <Container className="relative max-w-[1320px]"><IntelligenceDashboard dashboard={dashboard} /></Container>
      </section>
    </div>
  );
}
