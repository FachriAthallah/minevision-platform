"use client";

import { useEffect, useState } from "react";

import {
  AdminCard,
  AdminEmptyState,
  AdminPageHeader,
} from "@/features/admin/components/admin-ui";

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
        eyebrow="Account"
        title="Activity Log"
        description="Riwayat aktivitas administratif. Log bersifat append-only dan tidak dapat diubah melalui UI."
      />

      <div className="flex flex-wrap items-center gap-3">
        <select
          aria-label="Filter aksi"
          value={actionFilter}
          onChange={(event) => setActionFilter(event.target.value)}
          className="min-h-11 rounded-xl border border-white/10 bg-[#061122] px-3 text-sm text-white outline-none focus:border-brand-cyan"
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
          className="min-h-11 rounded-xl border border-white/10 bg-[#061122] px-3 text-sm text-white outline-none focus:border-brand-cyan"
        >
          <option value="">Semua status</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
        </select>
      </div>

      {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-[#718196]">Memuat activity log…</p>
      ) : rows.length === 0 ? (
        <AdminEmptyState
          title="Belum ada aktivitas"
          description="Aktivitas administratif akan tercatat di sini setelah ada aksi."
        />
      ) : (
        <AdminCard className="p-0">
          <div className="max-h-[70vh] overflow-auto rounded-2xl">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-[#061122] text-xs uppercase tracking-wider text-[#8292a6]">
                <tr>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Aksi</th>
                  <th className="px-4 py-3">Sumber daya</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-[#9FACBA]">
                      {new Date(row.createdAt).toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">{row.action}</td>
                    <td className="px-4 py-3 text-[#9FACBA]">
                      {row.resourceType ?? "—"}{row.resourceId ? ` / ${row.resourceId}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${row.result === "success" ? "border-success/25 bg-success/5 text-success" : "border-danger/25 bg-danger/5 text-danger"}`}>
                        {row.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-white/10 p-4 text-xs text-[#718196]">
            Menampilkan 50 record terbaru dari {total.toLocaleString("id-ID")}
          </p>
        </AdminCard>
      )}
    </div>
  );
}