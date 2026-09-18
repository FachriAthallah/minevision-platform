import {
  AdminCard,
  AdminEmptyState,
  AdminPageHeader,
  AdminRangeHint,
} from "@/features/admin/components/admin-ui";
import { AdminDonutByKey } from "@/features/admin/components/admin-charts";
import { getAudienceMetrics } from "@/features/admin/lib/analytics-queries";

const DEVICE_LABELS: Record<string, string> = {
  desktop: "Desktop",
  mobile: "Mobile",
  tablet: "Tablet",
  unknown: "Tidak diketahui",
};

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

  const hasData = devices.length > 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Analytics"
        title="Audience"
        description="Karakteristik agregat pengunjung tanpa identitas individu."
        actions={<AdminRangeHint from={from.toISOString()} to={now.toISOString()} />}
      />

      {!hasData ? (
        <AdminEmptyState
          title="Belum ada data audience"
          description="Metrik audience (perangkat, browser, sistem operasi, negara) terisi setelah ada kunjungan publik. Tidak ada profil per individu yang dibuat."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          <AdminCard>
            <h2 className="text-xl font-semibold text-white">Device Category</h2>
            <div className="mt-4">
              <AdminDonutByKey
                data={devices.map((row) => ({ label: DEVICE_LABELS[row.label] ?? row.label, value: row.value }))}
              />
            </div>
          </AdminCard>
          <AdminCard>
            <h2 className="text-xl font-semibold text-white">Browser</h2>
            <div className="mt-4">
              <AdminDonutByKey data={browsers} />
            </div>
          </AdminCard>
          <AdminCard>
            <h2 className="text-xl font-semibold text-white">Operating System</h2>
            <div className="mt-4">
              <AdminDonutByKey data={os} />
            </div>
          </AdminCard>
          <AdminCard>
            <h2 className="text-xl font-semibold text-white">Negara</h2>
            <div className="mt-4">
              <AdminDonutByKey data={countries} />
            </div>
          </AdminCard>
        </div>
      )}
    </div>
  );
}