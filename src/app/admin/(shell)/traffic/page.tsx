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
import { AdminTrafficSeries } from "@/features/admin/components/admin-charts";
import { AdminRangeSelector } from "@/features/admin/components/admin-range";
import {
  getDailySeries,
  getLandingPages,
  getOverviewKpis,
  getTopPages,
  getTopTrafficSources,
} from "@/features/admin/lib/analytics-queries";

const reveal = (delay: string) =>
  ({ ["--admin-delay" as string]: delay }) as CSSProperties;

export default async function AdminTrafficPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days: rawDays } = await searchParams;
  const days = Number.isNaN(Number(rawDays)) ? 30 : Math.min(Math.max(Number(rawDays), 1), 365);

  const now = new Date();
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const [kpis, series, topPages, landingPages, referrers] = await Promise.all([
    getOverviewKpis({ from, to: now }),
    getDailySeries({ from, to: now }),
    getTopPages({ from, to: now }, 50),
    getLandingPages({ from, to: now }, 10),
    getTopTrafficSources({ from, to: now }, 10),
  ]);

  const viewsPerSession = kpis.totalSessions > 0 ? kpis.pageviews / kpis.totalSessions : null;
  const referrerMax = Math.max(...referrers.map((row) => row.visitors), 1);

  return (
    <div className="space-y-6">
      <div className="admin-reveal" style={reveal("0ms")}>
        <AdminPageHeader
          title="Traffic Analytics"
          description="Analisis visitor, pageviews, dan sumber kunjungan MineVision."
          actions={
            <>
              <AdminRangeSelector days={days} />
              <a
                href={`/api/v1/admin/traffic/export?days=${days}`}
                className="inline-flex h-9 items-center rounded-md border border-admin-line px-4 text-sm font-semibold text-admin-text transition-colors hover:border-admin-muted hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent"
              >
                Export CSV
              </a>
            </>
          }
        />
        <div className="mt-4">
          <AdminRangeHint from={from.toISOString()} to={now.toISOString()} />
        </div>
      </div>

      <div className="admin-reveal grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" style={reveal("60ms")}>
        <AdminStat label="Visitors" value={kpis.totalVisitors.toLocaleString("id-ID")} />
        <AdminStat label="Sessions" value={kpis.totalSessions.toLocaleString("id-ID")} />
        <AdminStat label="Pageviews" value={kpis.pageviews.toLocaleString("id-ID")} />
        <AdminStat
          label="Views / session"
          value={viewsPerSession !== null ? viewsPerSession.toFixed(2) : "—"}
          hint="Belum ada traffic tercatat. Data akan muncul setelah aktivitas pengunjung publik tersedia."
        />
      </div>

      <div className="admin-reveal" style={reveal("120ms")}>
        <AdminCard>
          <AdminCardTitle>Visitors &amp; Pageviews</AdminCardTitle>
          <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-admin-muted">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="size-2 rounded-full bg-admin-accent" />
              Visitors
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="size-2 rounded-full bg-admin-muted" />
              Pageviews
            </span>
          </div>
          {series.length ? (
            <div className="mt-4">
              <AdminTrafficSeries data={series} />
            </div>
          ) : (
            <div className="mt-4">
              <AdminEmptyState
                title="Belum ada data analytics"
                description="Tren lalu lintas tampil setelah tracking aktif di website publik."
              />
            </div>
          )}
        </AdminCard>
      </div>

      <div className="admin-reveal grid gap-5 xl:grid-cols-2" style={reveal("180ms")}>
        <AdminCard>
          <AdminCardTitle>Top Pages</AdminCardTitle>
          {topPages.length ? (
            <div className="mt-4">
              <AdminTable
                headers={["Rank", "Halaman", "Visitors", "Pageviews"]}
                aligns={["left", "left", "right", "right"]}
                caption="Halaman dengan kunjungan terbanyak"
              >
                {topPages.map((row, index) => (
                  <tr key={row.path} className="text-admin-text">
                    <td className="text-admin-muted">{index + 1}</td>
                    <td className="max-w-[22rem] truncate align-top font-medium">{row.path}</td>
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
        </AdminCard>

        <div className="grid gap-5">
          <AdminCard>
            <AdminCardTitle>Landing Pages</AdminCardTitle>
            <p className="mt-1 text-xs text-admin-muted">Halaman pertama yang dibuka per sesi</p>
            {landingPages.length ? (
              <div className="mt-4">
                <AdminTable
                  headers={["Halaman", "Sesi"]}
                  aligns={["left", "right"]}
                  caption="Halaman pendaratan pertama"
                >
                  {landingPages.map((row) => (
                    <tr key={row.path} className="text-admin-text">
                      <td className="max-w-[22rem] truncate align-top font-medium">{row.path}</td>
                      <AdminNumberCell>{row.sessions.toLocaleString("id-ID")}</AdminNumberCell>
                    </tr>
                  ))}
                </AdminTable>
              </div>
            ) : (
              <div className="mt-4">
                <AdminEmptyState title="Belum ada halaman pendaratan" description="Landing pages tampil setelah ada sesi kunjungan." />
              </div>
            )}
          </AdminCard>

          <AdminCard>
            <AdminCardTitle>Referrers</AdminCardTitle>
            <p className="mt-1 text-xs text-admin-muted">Sumber lalu lintas berdasarkan domain perujuk</p>
            <div className="mt-4">
              {referrers.length ? (
                <div className="space-y-3.5">
                  {referrers.map((row) => {
                    const share = (row.visitors / referrerMax) * 100;
                    return (
                      <div key={row.source}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="truncate font-medium text-admin-text">{row.source}</span>
                          <span className="shrink-0 tabular-nums text-admin-muted">
                            {row.visitors.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-admin-ink">
                          <div
                            className="h-full rounded-full bg-admin-accent"
                            style={{ width: `${Math.max(4, share)}%` }}
                            role="progressbar"
                            aria-valuenow={share}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Sumber ${row.source}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-admin-muted">
                  Belum ada perujuk tercatat. Sumber akan tampil setelah ada kunjungan dari domain lain.
                </p>
              )}
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}