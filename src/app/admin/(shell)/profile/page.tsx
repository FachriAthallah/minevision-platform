"use client";

import { useEffect, useState } from "react";
import { ExternalLink, KeyRound } from "lucide-react";

import {
  ADMIN_INPUT_CLASS,
  AdminButton,
  AdminCard,
  AdminCardTitle,
  AdminFieldLabel,
  AdminNote,
  AdminPageHeader,
  StatusBadge,
} from "@/features/admin/components/admin-ui";

type ProfileData = {
  email: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  roleKeys: string[];
};

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
  const response = await fetch(input, init);
  return response.json().catch(() => ({}));
}

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const result = await requestJson<ProfileData>("/api/v1/admin/profile");
      if (result.success && result.data) {
        setProfile(result.data);
        setDisplayName(result.data.displayName ?? "");
        setAvatarUrl(result.data.avatarUrl ?? "");
      } else {
        setError(result.error?.message ?? "Gagal memuat profil.");
      }
    })();
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    setStatus(null);
    const result = await requestJson("/api/v1/admin/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, avatarUrl }),
    });
    if (result.success) {
      setStatus("Profil berhasil diperbarui.");
    } else {
      setError(result.error?.message ?? "Gagal memperbarui profil.");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="My Profile"
        description="Informasi akun admin Anda. Email tidak dapat diubah tanpa verifikasi Supabase."
      />

      {status ? <AdminNote tone="good">{status}</AdminNote> : null}
      {error ? <AdminNote tone="bad">{error}</AdminNote> : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <AdminCard className="lg:col-span-1">
          <AdminCardTitle>Informasi Akun</AdminCardTitle>
          <div className="mt-5 flex flex-col items-center gap-3 text-center">
            <div className="grid size-16 place-items-center rounded-full border border-admin-line bg-admin-raised text-2xl font-bold text-admin-accent">
              {(displayName || profile?.email || "A").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-admin-text">
                {displayName || profile?.displayName || "Administrator"}
              </p>
              <p className="truncate text-xs text-admin-muted">{profile?.email ?? "—"}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {profile?.roleKeys?.length ? (
                profile.roleKeys.map((role) => (
                  <StatusBadge key={role} tone="neutral">
                    {role}
                  </StatusBadge>
                ))
              ) : (
                <span className="text-xs text-admin-muted">Belum ada role aktif</span>
              )}
            </div>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-admin-line pt-4 text-sm">
            <div>
              <dt className="text-xs font-medium text-admin-muted">Username</dt>
              <dd className="mt-1 text-admin-text">{profile?.username ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-admin-muted">Avatar</dt>
              <dd className="mt-1 max-w-full truncate text-admin-text">
                {avatarUrl || profile?.avatarUrl || "Belum ada"}
              </dd>
            </div>
          </dl>
        </AdminCard>

        <AdminCard className="lg:col-span-2">
          <AdminCardTitle>Edit Profil</AdminCardTitle>
          <div className="mt-5 space-y-5">
            <div>
              <AdminFieldLabel>Display name</AdminFieldLabel>
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className={ADMIN_INPUT_CLASS} />
            </div>
            <div>
              <AdminFieldLabel>Avatar (storage path)</AdminFieldLabel>
              <input
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                placeholder="admin/…"
                className={ADMIN_INPUT_CLASS}
              />
              <p className="mt-1.5 text-xs leading-5 text-admin-muted">
                Isi path aset pada Media Library. Wajib dimulai dengan prefix bucket yang diizinkan.
              </p>
            </div>
            <AdminButton type="button" onClick={save} disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan Profil"}
            </AdminButton>
          </div>
        </AdminCard>
      </div>

      <AdminCard>
        <AdminCardTitle>Keamanan Akun</AdminCardTitle>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <p className="text-sm leading-6 text-admin-muted">
              Ubah kata sandi melalui alur resmi Supabase. Link reset dikirim ke email Anda — tidak ada perubahan kata sandi langsung dari panel ini.
            </p>
          </div>
          <a
            href="https://supabase.com/docs/guides/auth/passwords"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-admin-line px-4 text-sm font-semibold text-admin-text transition-colors hover:border-admin-muted hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent"
          >
            <KeyRound aria-hidden="true" className="size-4" />
            Panduan reset password
            <ExternalLink aria-hidden="true" className="size-3.5" />
          </a>
        </div>
      </AdminCard>
    </div>
  );
}