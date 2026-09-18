import {
  AdminCard,
  AdminEmptyState,
  AdminPageHeader,
  AdminRangeHint,
} from "@/features/admin/components/admin-ui";
import { getVitalsMetrics } from "@/features/admin/lib/analytics-queries";

const VITAL_LABELS: Record<string, string> = {
  LCP: "Largest Contentful Paint",
  INP: "Interaction to Next Paint",
  CLS: "Cumulative Layout Shift",
  TTFB: "Time to First Byte",
  FCP: "First Contentful Paint",
};

function vitalStatus(metric: string, value: number | null): { label: string; tone: "good" | "needs" | "poor" } {
  if (value === null) {
    return { label: "Belum cukup data", tone: "needs" };
  }
  if (metric === "CLS") {
    if (value <= 0.1) return { label: "Good", tone: "good" };
    if (value <= 0.25) return { label: "Needs improvement", tone: "needs" };
    return { label: "Poor", tone: "poor" };
  }
  if (value <= 2500) return { label: "Good", tone: "good" };
  if (value <= 4000) return { label: "Needs improvement", tone: "needs" };
  return { label: "Poor", tone: "poor" };
}

const TONE_CLASS: Record<string, string> = {
  good: "border-success/25 bg-success/5 text-success",
  needs: "border-warning/25 bg-warning/5 text-warning",
  poor: "border-danger/25 bg-danger/5 text-danger",
};

export default async function AdminPerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days: rawDays } = await searchParams;
  const days = Number.isNaN(Number(rawDays)) ? 30 : Math.min(Math.max(Number(rawDays), 1), 365);

  const now = new Date();
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const vitals = await getVitalsMetrics({ from, to: now });

  const byMetric = new Map<string, { avg: number | null; count: number; p75: number | null }>();

  for (const row of vitals) {
    const current = byMetric.get(row.metric) ?? { avg: null, count: 0, p75: null };
    current.avg = row.avg ?? current.avg;
    current.p75 = row.p75 ?? current.p75;
    current.count += row.count;
    byMetric.set(row.metric, current);
  }

  const metrics = [...byMetric.entries()];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Analytics"
        title="Performance"
        description="Web Vitals dan kesehatan performa yang benar-benar terukur dari halaman publik."
        actions={<AdminRangeHint from={from.toISOString()} to={now.toISOString()} />}
      />

      {!metrics.length ? (
        <AdminEmptyState
          title="Belum ada data performance"
          description="Web Vitals (LCP, INP, CLS, TTFB, FCP) terisi setelah visitor membuka halaman publik. Tidak ada angka performa yang dibuat-buat."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map(([metric, data]) => {
            const status = vitalStatus(metric, data.avg);
            const value =
              data.avg !== null
                ? metric === "CLS"
                  ? data.avg.toFixed(3)
                  : `${Math.round(data.avg).toLocaleString("id-ID")} ms`
                : "—";

            return (
              <AdminCard key={metric}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#9FACBA]">
                      {VITAL_LABELS[metric] ?? metric}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-white">{value}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${TONE_CLASS[status.tone]}`}>
                    {status.label}
                  </span>
                </div>
                <p className="mt-3 text-xs text-[#718196]">
                  {data.count.toLocaleString("id-ID")} sampel · p75:{" "}
                  {data.p75 !== null
                    ? metric === "CLS"
                      ? data.p75.toFixed(3)
                      : `${Math.round(data.p75).toLocaleString("id-ID")} ms`
                    : "—"}
                </p>
              </AdminCard>
            );
          })}
        </div>
      )}
    </div>
  );
}