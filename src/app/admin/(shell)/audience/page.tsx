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
} from "@/features/admin/components/admin-ui";
import {
  AdminDonutByKey,
  AdminDonutChart,
} from "@/features/admin/components/admin-charts";
import { AdminRangeSelector } from "@/features/admin/components/admin-range";
import { countryName } from "@/features/admin/lib/country-names";
import { getAudienceMetrics } from "@/features/admin/lib/analytics-queries";

const DEVICE_LABELS: Record<string, string> = {
  desktop: "Desktop",
  mobile: "Mobile",
  tablet: "Tablet",
  unknown: "Tidak diketahui",
};

const DEVICE_COLORS = [
  "var(--admin-accent)",
  "var(--admin-gold)",
  "var(--admin-muted)",
];

const ACCENT_COLOR = ["var(--admin-accent)"];

const reveal = (delay: string) =>
  ({ ["--admin-delay" as string]: delay }) as CSSProperties;

export default async function AdminAudiencePage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days: rawDays } = await searchParams;
  const days = Number.isNaN(Number(rawDays)) ? 30 : Math.min(Math.max(Number(rawDays), 1), 365);

  const now = new Date();
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const { devices, browsers, os, countries } = await getAudienceMetrics({ from, to: now });

  const devicesWithLabels = devices.map((row) => ({
    label: DEVICE_LABELS[row.label] ?? row.label,
    value: row.value,
  }));
  const countryTotal = countries.reduce((sum, row) => sum + row.value, 0);
  const hasData = devices.length > 0;

  return (
    <div className="space-y-6">
      <div className="admin-reveal" style={reveal("0ms")}>
        <AdminPageHeader
          title="Audience"
          description="Karakteristik agregat pengunjung tanpa identitas individu."
          actions={<AdminRangeSelector days={days} />}
        />
        <div className="mt-4">
          <AdminRangeHint from={from.toISOString()} to={now.toISOString()} />
        </div>
      </div>

      {!hasData ? (
        <div className="admin-reveal" style={reveal("60ms")}>
          <AdminEmptyState
            title="Belum ada data audience"
            description="Metrik audience (perangkat, browser, sistem operasi, negara) terisi setelah ada kunjungan publik. Tidak ada profil per individu yang dibuat."
          />
        </div>
      ) : (
        <>
          <div className="admin-reveal grid gap-5 lg:grid-cols-2" style={reveal("60ms")}>
            <AdminCard>
              <AdminCardTitle>Negara</AdminCardTitle>
              <p className="mt-1 text-xs text-admin-muted">
                Kode negara dua huruf dari sinyal non-presisi. Tidak ada lokasi presisi.
              </p>
              <div className="mt-4">
                <AdminTable
                  headers={["Negara", "Visitors", "Share"]}
                  aligns={["left", "right", "right"]}
                  caption="Pengunjung per negara"
                >
                  {countries.map((row) => {
                    const name = countryName(row.label);
                    const isMapped = name !== row.label;
                    return (
                      <tr key={row.label} className="text-admin-text">
                        <td className="font-medium">
                          {name}
                          {isMapped ? (
                            <span className="ml-1.5 text-xs font-normal text-admin-muted">
                              ({row.label})
                            </span>
                          ) : null}
                        </td>
                        <AdminNumberCell>{row.value.toLocaleString("id-ID")}</AdminNumberCell>
                        <AdminNumberCell className="text-admin-muted">
                          {countryTotal > 0 ? ((row.value / countryTotal) * 100).toFixed(1) : "0.0"}%
                        </AdminNumberCell>
                      </tr>
                    );
                  })}
                </AdminTable>
              </div>
            </AdminCard>
            <AdminCard>
              <AdminCardTitle>Perangkat</AdminCardTitle>
              <div className="mt-4">
                <AdminDonutChart
                  data={devicesWithLabels}
                  colors={DEVICE_COLORS}
                  centerLabel="visitors"
                />
              </div>
            </AdminCard>
          </div>

          <div className="admin-reveal grid gap-5 md:grid-cols-2" style={reveal("120ms")}>
            <AdminCard>
              <AdminCardTitle>Browser</AdminCardTitle>
              <div className="mt-4">
                <AdminDonutByKey data={browsers} colors={ACCENT_COLOR} />
              </div>
            </AdminCard>
            <AdminCard>
              <AdminCardTitle>Sistem Operasi</AdminCardTitle>
              <div className="mt-4">
                <AdminDonutByKey data={os} colors={ACCENT_COLOR} />
              </div>
            </AdminCard>
          </div>

          <div className="admin-reveal" style={reveal("180ms")}>
            <AdminNote>
              Analisis audience berbasis data agregat: perangkat, browser, sistem operasi, dan negara dicatat tanpa identitas individu. Tidak ada pembuatan profil per pengunjung.
            </AdminNote>
          </div>
        </>
      )}
    </div>
  );
}