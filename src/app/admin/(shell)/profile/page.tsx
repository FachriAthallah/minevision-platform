"use client";

import { useEffect, useState } from "react";

import {
  AdminCard,
  AdminPageHeader,
} from "@/features/admin/components/admin-ui";

type ProfileData = {
  email: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  roleKeys: string[];
};

const inputClass =
  "min-h-11 w-full rounded-xl border border-white/10 bg-[#061122] px-4 text-sm text-white outline-none placeholder:text-[#51637a] focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20";

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
        eyebrow="Account"
        title="My Profile"
        description="Informasi akun admin Anda. Email tidak dapat diubah tanpa verifikasi Supabase."
      />

      {status ? <p className="text-sm font-semibold text-success">{status}</p> : null}
      {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <AdminCard>
          <h2 className="text-lg font-semibold text-white">Identitas Akun</h2>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs font-bold text-[#9FACBA]">Email</p>
              <p className="mt-1 text-sm text-white">{profile?.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-[#9FACBA]">Username</p>
              <p className="mt-1 text-sm text-white">{profile?.username ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-[#9FACBA]">Role aktif</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {profile?.roleKeys?.length ? (
                  profile.roleKeys.map((role) => (
                    <span key={role} className="rounded-full border border-brand-cyan/25 bg-brand-cyan/5 px-3 py-1 text-xs font-bold text-brand-cyan">
                      {role}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-[#718196]">Belum ada role admin aktif.</p>
                )}
              </div>
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="text-lg font-semibold text-white">Pengaturan</h2>
          <div className="mt-4 space-y-4">
            <label className="block text-xs font-bold text-[#9FACBA]">
              Display name
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className={`mt-2 ${inputClass}`} />
            </label>
            <label className="block text-xs font-bold text-[#9FACBA]">
              Avatar (storage path)
              <input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="admin/…" className={`mt-2 ${inputClass}`} />
            </label>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="brand-gradient inline-flex h-11 items-center rounded-full px-5 text-sm font-bold text-white disabled:opacity-40"
            >
              {saving ? "Menyimpan…" : "Simpan Profil"}
            </button>
          </div>
        </AdminCard>
      </div>

      <AdminCard>
        <h2 className="text-lg font-semibold text-white">Keamanan</h2>
        <p className="mt-2 text-sm leading-6 text-[#9FACBA]">
          Ubah kata sandi melalui alur Supabase resmi (link reset dikirim ke email Anda).
        </p>
        <a
          href="https://supabase.com/docs/guides/auth/passwords"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex h-10 items-center rounded-full border border-brand-cyan/40 bg-brand-cyan/5 px-4 text-sm font-semibold text-brand-cyan hover:text-white"
        >
          Panduan reset password
        </a>
      </AdminCard>
    </div>
  );
}