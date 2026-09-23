"use client";

import { useEffect, useState } from "react";

import {
  AdminCard,
  AdminEmptyState,
  AdminPageHeader,
  AdminTable,
  StatusBadge,
} from "@/features/admin/components/admin-ui";
import { cn } from "@/lib/utils";

type ActivityRow = {
  id: string;
  actorId: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  beforeSummary: Record<string, unknown>;
  afterSummary: Record<string, unknown>;
  result: "success" | "failure";
  createdAt: string;
};

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
  const response = await fetch(input, init);
  return response.json().catch(() => ({}));
}

const selectClass =
  "min-h-10 rounded-md border border-admin-line bg-admin-raised/60 px-3 text-sm text-admin-text outline-none transition-colors focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20";

const ACTION_LABELS: Record<string, string> = {
  admin_login: "Login akun",
  admin_logout: "Logout akun",
  appearance_draft_saved: "Appearance draft disimpan",
  appearance_published: "Appearance dipublikasikan",
  appearance_rolled_back: "Appearance di-rollback",
  site_profile_draft_saved: "Site profile draft disimpan",
  site_profile_published: "Site profile dipublikasikan",
  site_profile_rolled_back: "Site profile di-rollback",
  media_uploaded: "Media diunggah",
  media_archived: "Media diarsipkan",
  profile_updated: "Profil diperbarui",
};

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export default function AdminActivityLogPage() {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [status, setStatus] = useState<"success" | "failure" | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const params = new URLSearchParams();
    params.set("limit", "50");
    if (actionFilter) params.set("action", actionFilter);
    if (status) params.set("status", status);
    const result = await requestJson<{ rows: ActivityRow[]; pagination: { total: number } }>(`/api/v1/admin/activity-log?${params.toString()}`);
    if (result.success && result.data) {
      setRows(result.data.rows);
      setTotal(result.data.pagination.total);
    } else {
      setError(result.error?.message ?? "Gagal memuat activity log.");
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter, status]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Activity Log"
        description="Riwayat aktivitas administratif. Log bersifat append-only dan tidak dapat diubah melalui UI."
      />

      <div className="flex flex-wrap items-center gap-3">
        <select
          aria-label="Filter aksi"
          value={actionFilter}
          onChange={(event) => setActionFilter(event.target.value)}
          className={selectClass}
        >
          <option value="">Semua aksi</option>
          <option value="admin_login">Login</option>
          <option value="admin_logout">Logout</option>
          <option value="appearance_draft_saved">Appearance draft</option>
          <option value="appearance_published">Appearance publish</option>
          <option value="site_profile_draft_saved">Site profile draft</option>
          <option value="site_profile_published">Site profile publish</option>
          <option value="media_uploaded">Media upload</option>
          <option value="media_archived">Media archive</option>
          <option value="profile_updated">Profile update</option>
        </select>
        <select
          aria-label="Filter status"
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
          className={selectClass}
        >
          <option value="">Semua status</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
        </select>
      </div>

      {error ? <p className="text-sm font-semibold text-admin-bad">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-admin-muted">Memuat activity log…</p>
      ) : rows.length === 0 ? (
        <AdminEmptyState
          title="Belum ada aktivitas"
          description="Aktivitas administratif akan tercatat di sini setelah ada aksi."
        />
      ) : (
        <AdminCard className="overflow-hidden p-0">
          <div className="max-h-[70vh] overflow-auto">
            <AdminTable headers={["Waktu", "Aksi", "Target", "Hasil"]} caption="Log aktivitas administratif">
              {rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={cn(
                    "text-admin-text",
                    index === 0 && "bg-admin-raised/40 hover:bg-admin-raised/70",
                  )}
                >
                  <td className="whitespace-nowrap text-left text-admin-muted tabular-nums">
                    {new Date(row.createdAt).toLocaleString("id-ID")}
                  </td>
                  <td className="font-medium" title={row.action}>
                    {actionLabel(row.action)}
                  </td>
                  <td className="text-admin-muted">
                    {row.resourceType ?? "—"}{row.resourceId ? ` / ${row.resourceId}` : ""}
                  </td>
                  <td>
                    <StatusBadge tone={row.result === "success" ? "good" : "bad"}>
                      {row.result}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </AdminTable>
          </div>
          <p className="border-t border-admin-line p-4 text-xs tabular-nums text-admin-muted">
            Menampilkan 50 record terbaru dari {total.toLocaleString("id-ID")}
          </p>
        </AdminCard>
      )}
    </div>
  );
}