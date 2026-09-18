import Link from "next/link";

import {
  AdminCard,
  AdminEmptyState,
  AdminPageHeader,
  AdminRangeHint,
  AdminStat,
} from "@/features/admin/components/admin-ui";
import {
  AdminDonutByKey,
  AdminTrafficSeries,
} from "@/features/admin/components/admin-charts";
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

  const bounceLabel = kpis.bounceRate !== null ? `${(kpis.bounceRate * 100).toFixed(1)}%` : "Belum cukup data";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Analytics"
        title="Dashboard Overview"
        description="Ringkasan performa MineVision: pengunjung, pageviews, dan interaksi."
        actions={<AdminRangeHint from={from.toISOString()} to={now.toISOString()} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStat label="Total Visitors" value={kpis.totalVisitors.toLocaleString("id-ID")} />
        <AdminStat label="Pageviews" value={kpis.pageviews.toLocaleString("id-ID")} />
        <AdminStat label="Bounce Rate" value={bounceLabel} />
        <AdminStat label="Total Interactions" value={kpis.interactions.toLocaleString("id-ID")} />
      </div>

      <AdminCard>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Traffic Overview</h2>
            <p className="mt-1 text-xs text-[#718196]">Visitors dan pageviews per hari</p>
          </div>
        </div>
        {series.length ? (
          <AdminTrafficSeries data={series} />
        ) : (
          <AdminEmptyState
            title="Belum ada data analytics"
            description="Kumpulan data akan mulai terisi setelah tracking aktif di website publik."
          />
        )}
      </AdminCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <AdminCard>
          <h2 className="text-xl font-semibold text-white">Top Pages</h2>
          {topPages.length ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#061122] text-xs uppercase tracking-wider text-[#8292a6]">
                  <tr>
                    <th className="px-4 py-3">#</th>
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
          <Link href="/admin/traffic" className="mt-4 inline-flex text-sm font-semibold text-brand-cyan hover:text-white">
            Lihat semua →
          </Link>
        </AdminCard>

        <div className="grid gap-5">
          <AdminCard>
            <h2 className="text-xl font-semibold text-white">Top Traffic Source</h2>
            <div className="mt-4">
              {trafficSources.length ? (
                <AdminDonutByKey data={trafficSources.map((source) => ({ label: source.source, value: source.visitors }))} />
              ) : (
                <p className="text-sm text-[#718196]">Belum cukup data.</p>
              )}
            </div>
          </AdminCard>

          <AdminCard>
            <h2 className="text-xl font-semibold text-white">Top Interaction</h2>
            <p className="mt-3 text-3xl font-bold text-white">{engagement.totalInteractions.toLocaleString("id-ID")}</p>
            <p className="mt-1 text-xs text-[#718196]">total interaksi pada periode aktif</p>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}