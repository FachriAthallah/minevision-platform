import type { CSSProperties } from "react";

import {
  AdminCard,
  AdminCardTitle,
  AdminEmptyState,
  AdminNote,
  AdminNumberCell,
  AdminPageHeader,
  AdminRangeHint,
  AdminStat,
  AdminTable,
} from "@/features/admin/components/admin-ui";
import { AdminEngagementBars } from "@/features/admin/components/admin-charts";
import { AdminRangeSelector } from "@/features/admin/components/admin-range";
import {
  getEngagementEventTable,
  getEngagementMetrics,
} from "@/features/admin/lib/analytics-queries";

const EVENT_LABELS: Record<string, string> = {
  module_opened: "Modul dibuka",
  search_submitted: "Pencarian dikirim",
  search_result_clicked: "Hasil pencarian diklik",
  related_link_clicked: "Tautan terkait diklik",
  outbound_source_clicked: "Sumber eksternal diklik",
  cta_clicked: "CTA diklik",
};

const BAR_COLORS = ["var(--admin-accent)", "var(--admin-gold)", "var(--admin-good)"];

const reveal = (delay: string) =>
  ({ ["--admin-delay" as string]: delay }) as CSSProperties;

export default async function AdminEngagementPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days: rawDays } = await searchParams;
  const days = Number.isNaN(Number(rawDays)) ? 30 : Math.min(Math.max(Number(rawDays), 1), 365);

  const now = new Date();
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const [engagement, eventTable] = await Promise.all([
    getEngagementMetrics({ from, to: now }),
    getEngagementEventTable({ from, to: now }),
  ]);

  const bars = Object.entries(engagement.breakdown)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({ label: EVENT_LABELS[key] ?? key, value }));

  const interactionTotal = eventTable.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="space-y-6">
      <div className="admin-reveal" style={reveal("0ms")}>
        <AdminPageHeader
          title="Engagement"
          description="Analisis interaksi pengguna dengan MineVision."
          actions={<AdminRangeSelector days={days} />}
        />
        <div className="mt-4">
          <AdminRangeHint from={from.toISOString()} to={now.toISOString()} />
        </div>
      </div>

      <div className="admin-reveal grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" style={reveal("60ms")}>
        <AdminStat label="Total interactions" value={engagement.totalInteractions.toLocaleString("id-ID")} />
        <AdminStat
          label="Interactions / session"
          value={engagement.interactionsPerSession.toFixed(2)}
        />
        <AdminStat label="Search submitted" value={engagement.searchSubmitted.toLocaleString("id-ID")} />
        <AdminStat
          label="Search CTR"
          value={
            engagement.searchClickThroughRate !== null
              ? `${(engagement.searchClickThroughRate * 100).toFixed(1)}%`
              : "—"
          }
          hint="Belum ada pencarian tercatat pada periode ini."
        />
      </div>

      <div className="admin-reveal" style={reveal("120ms")}>
        <AdminCard>
          <AdminCardTitle>Breakdown Interaksi</AdminCardTitle>
          {bars.length ? (
            <div className="mt-4">
              <AdminEngagementBars data={bars} colors={BAR_COLORS} />
            </div>
          ) : (
            <div className="mt-4">
              <AdminEmptyState
                title="Belum ada interaksi"
                description="Interaksi (search, CTA, tautan, modul) tampil setelah tracking aktif."
              />
            </div>
          )}
        </AdminCard>
      </div>

      <div className="admin-reveal" style={reveal("180ms")}>
        <AdminCard>
          <AdminCardTitle>Daftar Event</AdminCardTitle>
          <p className="mt-1 text-xs text-admin-muted">
            Detail per jenis interaksi dengan perbandingan periode sebelumnya.
          </p>
          {eventTable.length ? (
            <div className="mt-4">
              <AdminTable
                headers={["Event", "Count", "Share", "Trend", "Last recorded"]}
                aligns={["left", "right", "right", "right", "right"]}
                caption="Detail event interaksi"
              >
                {eventTable.map((row) => {
                  const share =
                    interactionTotal > 0 ? (row.count / interactionTotal) * 100 : 0;
                  const hasPrevious = row.previousCount > 0;
                  const trend =
                    hasPrevious && row.count !== row.previousCount
                      ? ((row.count - row.previousCount) / row.previousCount) * 100
                      : null;
                  const trendUp = (trend ?? 0) >= 0;
                  return (
                    <tr key={row.eventType} className="text-admin-text">
                      <td className="font-medium">
                        {EVENT_LABELS[row.eventType] ?? row.eventType}
                      </td>
                      <AdminNumberCell>{row.count.toLocaleString("id-ID")}</AdminNumberCell>
                      <AdminNumberCell className="text-admin-muted">
                        {share.toFixed(1)}%
                      </AdminNumberCell>
                      <AdminNumberCell>
                        {trend !== null ? (
                          <span
                            className={
                              trendUp
                                ? "text-admin-good"
                                : "text-admin-bad"
                            }
                          >
                            {trendUp ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-admin-muted">—</span>
                        )}
                      </AdminNumberCell>
                      <AdminNumberCell className="whitespace-nowrap text-admin-muted">
                        {row.lastRecorded
                          ? new Date(row.lastRecorded).toLocaleString("id-ID")
                          : "—"}
                      </AdminNumberCell>
                    </tr>
                  );
                })}
              </AdminTable>
            </div>
          ) : (
            <div className="mt-4">
              <AdminEmptyState
                title="Belum ada event"
                description="Detail event tampil setelah ada interaksi tercatat."
              />
            </div>
          )}
        </AdminCard>
      </div>

      <div className="admin-reveal" style={reveal("240ms")}>
        <AdminNote>
          Isi query tidak disimpan. Hanya kategori, panjang, jumlah hasil, dan status yang dicatat. Trend membandingkan aktivitas periode ini dengan rentang yang sama sebelumnya.
        </AdminNote>
      </div>
    </div>
  );
}