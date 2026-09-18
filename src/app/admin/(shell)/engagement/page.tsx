import {
  AdminCard,
  AdminEmptyState,
  AdminPageHeader,
  AdminRangeHint,
  AdminStat,
} from "@/features/admin/components/admin-ui";
import { AdminEngagementBars } from "@/features/admin/components/admin-charts";
import { getEngagementMetrics } from "@/features/admin/lib/analytics-queries";

const EVENT_LABELS: Record<string, string> = {
  module_opened: "Modul dibuka",
  search_submitted: "Pencarian dikirim",
  search_result_clicked: "Hasil pencarian diklik",
  related_link_clicked: "Tautan terkait diklik",
  outbound_source_clicked: "Sumber eksternal diklik",
  cta_clicked: "CTA diklik",
};

export default async function AdminEngagementPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days: rawDays } = await searchParams;
  const days = Number.isNaN(Number(rawDays)) ? 30 : Math.min(Math.max(Number(rawDays), 1), 365);

  const now = new Date();
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const engagement = await getEngagementMetrics({ from, to: now });

  const bars = Object.entries(engagement.breakdown)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({ label: EVENT_LABELS[key] ?? key, value }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Analytics"
        title="Engagement"
        description="Interaksi pengunjung: pencarian global, tautan, CTA, dan modul yang dibuka."
        actions={<AdminRangeHint from={from.toISOString()} to={now.toISOString()} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStat label="Total Interactions" value={engagement.totalInteractions.toLocaleString("id-ID")} />
        <AdminStat
          label="Interactions / Session"
          value={engagement.interactionsPerSession.toFixed(2)}
        />
        <AdminStat label="Search Submitted" value={engagement.searchSubmitted.toLocaleString("id-ID")} />
        <AdminStat
          label="Search CTR"
          value={
            engagement.searchClickThroughRate !== null
              ? `${(engagement.searchClickThroughRate * 100).toFixed(1)}%`
              : "Belum cukup data"
          }
        />
      </div>

      <AdminCard>
        <h2 className="text-xl font-semibold text-white">Breakdown Interaksi</h2>
        {bars.length ? (
          <div className="mt-4">
            <AdminEngagementBars data={bars} />
          </div>
        ) : (
          <AdminEmptyState
            title="Belum ada interaksi"
            description="Interaksi (search, CTA, tautan, modul) tampil setelah tracking aktif."
          />
        )}
      </AdminCard>

      <AdminCard>
        <h2 className="text-xl font-semibold text-white">Detil Pencarian Global</h2>
        <p className="mt-2 text-xs text-[#718196]">
          Isi query tidak disimpan. Hanya kategori, panjang, jumlah hasil, dan status yang dicatat.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <AdminStat
            label="Search Success"
            value={
              engagement.searchSuccessRate !== null
                ? `${(engagement.searchSuccessRate * 100).toFixed(1)}%`
                : "Belum cukup data"
            }
          />
          <AdminStat label="No-Result" value={engagement.searchNoResult.toLocaleString("id-ID")} />
          <AdminStat label="Result Clicks" value={engagement.searchResultClicked.toLocaleString("id-ID")} />
        </div>
      </AdminCard>
    </div>
  );
}