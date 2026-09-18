import Link from "next/link";

import {
  AdminCard,
  AdminEmptyState,
  AdminPageHeader,
  AdminRangeHint,
  AdminStat,
} from "@/features/admin/components/admin-ui";
import { AdminTrafficSeries } from "@/features/admin/components/admin-charts";
import {
  getDailySeries,
  getOverviewKpis,
  getTopPages,
} from "@/features/admin/lib/analytics-queries";

export default async function AdminTrafficPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days: rawDays } = await searchParams;
  const days = Number.isNaN(Number(rawDays)) ? 30 : Math.min(Math.max(Number(rawDays), 1), 365);

  const now = new Date();
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const [kpis, series, topPages] = await Promise.all([
    getOverviewKpis({ from, to: now }),
    getDailySeries({ from, to: now }),
    getTopPages({ from, to: now }, 50),
  ]);

  const viewsPerSession = kpis.totalSessions > 0 ? kpis.pageviews / kpis.totalSessions : null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Analytics"
        title="Traffic"
        description="Pengunjung, sesi, pageviews, dan sumber lalu lintas website."
        actions={
          <>
            <AdminRangeHint from={from.toISOString()} to={now.toISOString()} />
            <Link
              href="/api/v1/admin/traffic/export?days=30"
              className="inline-flex h-10 items-center rounded-full border border-brand-cyan/40 bg-brand-cyan/5 px-4 text-sm font-semibold text-white hover:bg-brand-cyan/15"
            >
              Export CSV
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStat label="Visitors" value={kpis.totalVisitors.toLocaleString("id-ID")} />
        <AdminStat label="Sesi" value={kpis.totalSessions.toLocaleString("id-ID")} />
        <AdminStat label="Pageviews" value={kpis.pageviews.toLocaleString("id-ID")} />
        <AdminStat
          label="Views / Session"
          value={viewsPerSession !== null ? viewsPerSession.toFixed(2) : "Belum cukup data"}
        />
      </div>

      <AdminCard>
        <h2 className="text-xl font-semibold text-white">Tren</h2>
        {series.length ? (
          <div className="mt-4">
            <AdminTrafficSeries data={series} />
          </div>
        ) : (
          <AdminEmptyState
            title="Belum ada data analytics"
            description="Tren lalu lintas tampil setelah tracking aktif."
          />
        )}
      </AdminCard>

      <AdminCard>
        <h2 className="text-xl font-semibold text-white">Top Pages</h2>
        {topPages.length ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#061122] text-xs uppercase tracking-wider text-[#8292a6]">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Halaman</th>
                  <th className="px-4 py-3 text-right">Visitors</th>
                  <th className="px-4 py-3 text-right">Pageviews</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {topPages.map((row, index) => (
                  <tr key={row.path}>
                    <td className="px-4 py-3 text-[#718196]">{index + 1}</td>
                    <td className="px-4 py-3 font-semibold text-white">{row.path}</td>
                    <td className="px-4 py-3 text-right text-[#9FACBA]">{row.visitors}</td>
                    <td className="px-4 py-3 text-right text-[#9FACBA]">{row.pageviews}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminEmptyState title="Belum ada halaman" description="Top pages tampil setelah ada pageview." />
        )}
      </AdminCard>
    </div>
  );
}