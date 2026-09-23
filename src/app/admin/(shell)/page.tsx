import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { CSSProperties } from "react";

import {
  AdminCard,
  AdminCardTitle,
  AdminEmptyState,
  AdminNumberCell,
  AdminPageHeader,
  AdminRangeHint,
  AdminStat,
  AdminTable,
} from "@/features/admin/components/admin-ui";
import {
  AdminDonutByKey,
  AdminTrafficSeries,
} from "@/features/admin/components/admin-charts";
import { AdminRangeSelector } from "@/features/admin/components/admin-range";
import {
  getDailySeries,
  getEngagementMetrics,
  getOverviewKpis,
  getTopPages,
  getTopTrafficSources,
} from "@/features/admin/lib/analytics-queries";

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days: rawDays } = await searchParams;
  const days = Number.isNaN(Number(rawDays)) ? 30 : Math.min(Math.max(Number(rawDays), 1), 365);

  const now = new Date();
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const [kpis, series, topPages, trafficSources, engagement] = await Promise.all([
    getOverviewKpis({ from, to: now }),
    getDailySeries({ from, to: now }),
    getTopPages({ from, to: now }, 6),
    getTopTrafficSources({ from, to: now }, 4),
    getEngagementMetrics({ from, to: now }),
  ]);

  const bounceLabel =
    kpis.bounceRate !== null ? `${(kpis.bounceRate * 100).toFixed(1)}%` : "—";

  const reveal = (delay: string) =>
    ({ ["--admin-delay" as string]: delay }) as CSSProperties;

  return (
    <div className="space-y-6">
      <div className="admin-reveal" style={reveal("0ms")}>
        <AdminPageHeader
          title="Dashboard Overview"
          description="Ringkasan performa MineVision: pengunjung, pageviews, dan interaksi."
          actions={<AdminRangeSelector days={days} />}
        />
        <div className="mt-4">
          <AdminRangeHint from={from.toISOString()} to={now.toISOString()} />
        </div>
      </div>

      <div className="admin-reveal grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" style={reveal("60ms")}>
        <AdminStat label="Total visitors" value={kpis.totalVisitors.toLocaleString("id-ID")} />
        <AdminStat label="Pageviews" value={kpis.pageviews.toLocaleString("id-ID")} />
        <AdminStat
          label="Bounce rate"
          value={bounceLabel}
          hint="Belum ada traffic tercatat. Data akan muncul setelah aktivitas pengunjung publik tersedia."
        />
        <AdminStat label="Total interactions" value={kpis.interactions.toLocaleString("id-ID")} />
      </div>

      <div className="admin-reveal" style={reveal("120ms")}>
        <AdminCard>
          <AdminCardTitle>Traffic Overview</AdminCardTitle>
          <p className="mt-1 text-xs text-admin-muted">Visitors dan pageviews per hari</p>
          {series.length ? (
            <div className="mt-4">
              <AdminTrafficSeries data={series} />
            </div>
          ) : (
            <div className="mt-4">
              <AdminEmptyState
                title="Belum ada data analytics"
                description="Kumpulan data akan mulai terisi setelah tracking aktif di website publik."
              />
            </div>
          )}
        </AdminCard>
      </div>

      <div className="admin-reveal grid gap-5 lg:grid-cols-2" style={reveal("180ms")}>
        <AdminCard>
          <AdminCardTitle>Top Pages</AdminCardTitle>
          {topPages.length ? (
            <div className="mt-4">
              <AdminTable
                headers={["#", "Halaman", "Visitors", "Pageviews"]}
                aligns={["left", "left", "right", "right"]}
                caption="Halaman dengan kunjungan terbanyak"
              >
                {topPages.map((row, index) => (
                  <tr key={row.path} className="text-admin-text">
                    <td className="text-admin-muted">{index + 1}</td>
                    <td className="font-medium">{row.path}</td>
                    <AdminNumberCell>{row.visitors.toLocaleString("id-ID")}</AdminNumberCell>
                    <AdminNumberCell>{row.pageviews.toLocaleString("id-ID")}</AdminNumberCell>
                  </tr>
                ))}
              </AdminTable>
            </div>
          ) : (
            <div className="mt-4">
              <AdminEmptyState title="Belum ada halaman" description="Top pages tampil setelah ada pageview." />
            </div>
          )}
          <Link
            href="/admin/traffic"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-admin-accent hover:text-admin-text"
          >
            Lihat semua
            <ChevronRight aria-hidden="true" className="size-4" />
          </Link>
        </AdminCard>

        <div className="grid gap-5">
          <AdminCard>
            <AdminCardTitle>Top Traffic Source</AdminCardTitle>
            <div className="mt-4">
              {trafficSources.length ? (
                <AdminDonutByKey
                  data={trafficSources.map((source) => ({ label: source.source, value: source.visitors }))}
                  colors={["var(--admin-accent)"]}
                />
              ) : (
                <p className="text-sm text-admin-muted">Belum cukup data.</p>
              )}
            </div>
          </AdminCard>

          <AdminCard>
            <AdminCardTitle>Top Interaction</AdminCardTitle>
            <p className="mt-3 text-[34px] font-bold leading-none tracking-tight text-admin-text tabular-nums">
              {engagement.totalInteractions.toLocaleString("id-ID")}
            </p>
            <p className="mt-2 text-xs text-admin-muted">total interaksi pada periode aktif</p>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}