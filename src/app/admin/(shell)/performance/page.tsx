import type { CSSProperties } from "react";

import {
  AdminCard,
  AdminCardTitle,
  AdminEmptyState,
  AdminNote,
  AdminNumberCell,
  AdminPageHeader,
  AdminRangeHint,
  AdminTable,
  StatusBadge,
} from "@/features/admin/components/admin-ui";
import { AdminRangeSelector } from "@/features/admin/components/admin-range";
import {
  getOverviewKpis,
  getSlowPages,
  getVitalsMetrics,
  type SlowPageRow,
} from "@/features/admin/lib/analytics-queries";

const VITAL_LABELS: Record<string, string> = {
  LCP: "Largest Contentful Paint",
  INP: "Interaction to Next Paint",
  CLS: "Cumulative Layout Shift",
  TTFB: "Time to First Byte",
  FCP: "First Contentful Paint",
};

const PRIMARY_METRICS = ["LCP", "INP", "CLS"];
const SECONDARY_METRICS = ["TTFB", "FCP"];

/**
 * Jumlah sampel minimum sebelum status diberi penilaian masuk akal.
 * Di bawah ini, nilai tetap ditampilkan tapi status jadi netral.
 */
const MIN_SAMPLES_FOR_STATUS = 20;

function vitalStatus(
  metric: string,
  value: number | null,
): { label: string; tone: "good" | "needs" | "poor" | "none" } {
  if (value === null) {
    return { label: "Belum cukup data", tone: "none" };
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

function formatVitalValue(metric: string, value: number | null): string {
  if (value === null) return "—";
  return metric === "CLS" ? value.toFixed(3) : `${Math.round(value).toLocaleString("id-ID")} ms`;
}

function vitalContextNote(
  metric: string,
  tone: "good" | "needs" | "poor" | "none",
  samples: number,
): string | null {
  if (samples < MIN_SAMPLES_FOR_STATUS) {
    return "Sampel belum cukup untuk penilaian. Nilai ditampilkan sebagai referensi; gunakan p75.";
  }
  if (tone === "good" || tone === "none") {
    return null;
  }
  switch (metric) {
    case "LCP":
      return "Elemen terbesar lambat tampil dan bertepatan TTFB tinggi — indikasi buka pertama atau cold route, bukan perangkat pengunjung.";
    case "TTFB":
      return "Server lambat memberi byte pertama — kemungkinan cold start, buka pertama, atau server dev.";
    case "FCP":
      return "Render awal tertunda, mengikuti pola respons server (TTFB).";
    case "INP":
      return "Interaksi menunggu melebihi ambang — periksa event handler atau beban input pada halaman.";
    default:
      return null;
  }
}

const BADGE_TONE: Record<string, "good" | "warn" | "bad" | "neutral"> = {
  good: "good",
  needs: "warn",
  poor: "bad",
  none: "neutral",
};

const reveal = (delay: string) =>
  ({ ["--admin-delay" as string]: delay }) as CSSProperties;

type MetricData = {
  avg: number | null;
  count: number;
  p75: number | null;
  max: number | null;
};

function buildMetricMap(rows: Awaited<ReturnType<typeof getVitalsMetrics>>): Map<string, MetricData> {
  const map = new Map<string, MetricData>();
  for (const row of rows) {
    const current = map.get(row.metric) ?? { avg: null, count: 0, p75: null, max: null };
    current.avg = row.avg ?? current.avg;
    current.p75 = row.p75 ?? current.p75;
    current.max = row.max ?? current.max;
    current.count += row.count;
    map.set(row.metric, current);
  }
  return map;
}

function assessMetric(
  metric: string,
  data: MetricData | undefined,
): { status: { label: string; tone: "good" | "needs" | "poor" | "none" }; samples: number } {
  const samples = data?.count ?? 0;
  if (data && samples >= MIN_SAMPLES_FOR_STATUS) {
    return { status: vitalStatus(metric, data.avg), samples };
  }
  return { status: { label: "Sampel rendah", tone: "none" }, samples };
}

function slowPageStatus(row: SlowPageRow): { label: string; tone: "good" | "needs" | "poor" } {
  if (row.metric === "CLS") {
    if (row.avg <= 0.1) return { label: "Good", tone: "good" };
    if (row.avg <= 0.25) return { label: "Needs improvement", tone: "needs" };
    return { label: "Poor", tone: "poor" };
  }
  if (row.avg <= 2500) return { label: "Good", tone: "good" };
  if (row.avg <= 4000) return { label: "Needs improvement", tone: "needs" };
  return { label: "Poor", tone: "poor" };
}

export default async function AdminPerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days: rawDays } = await searchParams;
  const days = Number.isNaN(Number(rawDays)) ? 30 : Math.min(Math.max(Number(rawDays), 1), 365);

  const now = new Date();
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const [vitals, slowPages, kpis] = await Promise.all([
    getVitalsMetrics({ from, to: now }),
    getSlowPages({ from, to: now }, 10),
    getOverviewKpis({ from, to: now }),
  ]);

  const metricMap = buildMetricMap(vitals);
  const hasAnyMetric = metricMap.size > 0;

  const abnormalPattern = PRIMARY_METRICS.some((metric) => {
    const data = metricMap.get(metric);
    if (!data || data.count < MIN_SAMPLES_FOR_STATUS) {
      return false;
    }
    return vitalStatus(metric, data.avg).tone === "poor";
  });

  return (
    <div className="space-y-6">
      <div className="admin-reveal" style={reveal("0ms")}>
        <AdminPageHeader
          title="Performance"
          description="Web Vitals dan kesehatan performa yang benar-benar terukur dari halaman publik."
          actions={<AdminRangeSelector days={days} />}
        />
        <div className="mt-4">
          <AdminRangeHint from={from.toISOString()} to={now.toISOString()} />
        </div>
      </div>

      {!hasAnyMetric ? (
        <div className="admin-reveal" style={reveal("60ms")}>
          <AdminEmptyState
            title="Belum ada data performance"
            description="Web Vitals (LCP, INP, CLS, TTFB, FCP) terisi setelah visitor membuka halaman publik. Tidak ada angka performa yang dibuat-buat."
          />
        </div>
      ) : null}

      {hasAnyMetric && abnormalPattern ? (
        <div className="admin-reveal" style={reveal("60ms")}>
          <AdminNote tone="info">
            TTFB/LCP tinggi sementara INP sehat — indikasi keterlambatan server pada buka awal (cold route/start),
            bukan perlambatan perangkat pengunjung. Nilai cenderung stabil setelah traffic produksi berjalan; p75 lebih
            tahan outlier dibanding rata-rata.
          </AdminNote>
        </div>
      ) : null}

      <div className="admin-reveal grid gap-4 sm:grid-cols-2 xl:grid-cols-3" style={reveal("60ms")}>
        {PRIMARY_METRICS.map((metric) => {
          const data = metricMap.get(metric);
          const { status, samples } = assessMetric(metric, data);
          const context = vitalContextNote(metric, status.tone, samples);
          return (
            <AdminCard key={metric} className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-admin-muted">
                    {VITAL_LABELS[metric] ?? metric}
                  </p>
                  <p className="mt-2 text-[30px] font-bold leading-none tracking-tight text-admin-text tabular-nums">
                    {formatVitalValue(metric, data?.avg ?? null)}
                  </p>
                  <p className="mt-2 text-xs text-admin-muted">
                    {metric === "CLS" ? "unitless score" : "threshold 2,5 detik"}
                  </p>
                </div>
                <StatusBadge tone={BADGE_TONE[status.tone]}>{status.label}</StatusBadge>
              </div>
              {context ? (
                <p className="mt-3 text-xs leading-5 text-admin-muted">{context}</p>
              ) : null}
              <p className="mt-4 border-t border-admin-line pt-3 text-xs tabular-nums text-admin-muted">
                {samples.toLocaleString("id-ID")} sampel · p75: {formatVitalValue(metric, data?.p75 ?? null)} · max: {formatVitalValue(metric, data?.max ?? null)}
              </p>
            </AdminCard>
          );
        })}
      </div>

      {SECONDARY_METRICS.some((metric) => metricMap.has(metric)) ? (
        <div className="admin-reveal grid gap-4 sm:grid-cols-2" style={reveal("90ms")}>
          {SECONDARY_METRICS.filter((metric) => metricMap.has(metric)).map((metric) => {
            const data = metricMap.get(metric);
            const { status, samples } = assessMetric(metric, data);
            const context = vitalContextNote(metric, status.tone, samples);
            return (
              <AdminCard key={metric} className="flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-admin-muted">
                      {VITAL_LABELS[metric] ?? metric}
                    </p>
                    <p className="mt-2 text-2xl font-bold leading-none tracking-tight text-admin-text tabular-nums">
                      {formatVitalValue(metric, data?.avg ?? null)}
                    </p>
                  </div>
                  <StatusBadge tone={BADGE_TONE[status.tone]}>{status.label}</StatusBadge>
                </div>
                {context ? (
                  <p className="mt-3 text-xs leading-5 text-admin-muted">{context}</p>
                ) : null}
                <p className="mt-4 border-t border-admin-line pt-3 text-xs tabular-nums text-admin-muted">
                  {samples.toLocaleString("id-ID")} sampel · p75: {formatVitalValue(metric, data?.p75 ?? null)} · max: {formatVitalValue(metric, data?.max ?? null)}
                </p>
              </AdminCard>
            );
          })}
        </div>
      ) : null}

      <div className="admin-reveal" style={reveal("120ms")}>
        <AdminCard>
          <AdminCardTitle>Halaman Lambat</AdminCardTitle>
          <p className="mt-1 text-xs text-admin-muted">
            Rata-rata LCP dan CLS per halaman, diurutkan dari yang paling lambat ({kpis.pageviews.toLocaleString("id-ID")} pageview pada periode ini).
          </p>
          {slowPages.length ? (
            <div className="mt-4">
              <AdminTable
                headers={["Halaman", "Metric", "Rata-rata", "Sampel", "Status"]}
                aligns={["left", "left", "right", "right", "left"]}
                caption="Halaman dengan metrik performa terbesar"
              >
                {slowPages.map((row, index) => {
                  const status = slowPageStatus(row);
                  return (
                    <tr key={`${row.path}-${row.metric}`} className="text-admin-text">
                      <td className="max-w-[24rem] truncate align-top font-medium">
                        <span className="mr-2 text-admin-muted">{index + 1}</span>
                        {row.path}
                      </td>
                      <td className="text-admin-muted">{row.metric}</td>
                      <AdminNumberCell>{formatVitalValue(row.metric, row.avg)}</AdminNumberCell>
                      <AdminNumberCell>{row.count.toLocaleString("id-ID")}</AdminNumberCell>
                      <td>
                        <StatusBadge tone={BADGE_TONE[status.tone]}>{status.label}</StatusBadge>
                      </td>
                    </tr>
                  );
                })}
              </AdminTable>
            </div>
          ) : (
            <div className="mt-4">
              <AdminEmptyState
                title="Belum ada halaman lambat terukur"
                description="Data per-halaman muncul saat metrik LCP/CLS dari masing-masing halaman mulai tercatat."
              />
            </div>
          )}
        </AdminCard>
      </div>

      <div className="admin-reveal grid gap-5 lg:grid-cols-3" style={reveal("180ms")}>
        <AdminCard>
          <AdminCardTitle>Error Aplikasi</AdminCardTitle>
          <p className="mt-2 text-sm leading-6 text-admin-muted">
            Error runtime frontend tidak direkam ke analytics saat ini. Data error tidak menampilkan angka yang dikarang.
          </p>
        </AdminCard>
        <AdminCard>
          <AdminCardTitle>API Response</AdminCardTitle>
          <p className="mt-2 text-sm leading-6 text-admin-muted">
            Telemetri waktu respons API belum tersedia pada model ini. Panel akan terisi setelah monitoring backend aktif.
          </p>
        </AdminCard>
        <AdminCard>
          <AdminCardTitle>Deployment</AdminCardTitle>
          <p className="mt-2 text-sm leading-6 text-admin-muted">
            Status deployment tidak direkam. Tidak ada klaim operational yang tidak didukung data.
          </p>
        </AdminCard>
      </div>

      <div className="admin-reveal" style={reveal("240ms")}>
        <AdminNote>
          {`Ambang batas mengikuti definisi Web Vitals: LCP/INP \u2264 2500 ms dan CLS \u2264 0.1 untuk status Good. Status dinilai dari rata-rata; jika sampel < ${MIN_SAMPLES_FOR_STATUS}, status ditampilkan netral.`}
        </AdminNote>
      </div>
    </div>
  );
}