"use client";

import { useEffect, useState } from "react";

import {
  AdminCard,
  AdminPageHeader,
} from "@/features/admin/components/admin-ui";

type SettingRow = {
  draft: Record<string, unknown> | null;
  published: Record<string, unknown> | null;
  draftVersion: number;
  publishedVersion: number;
};

type FormState = {
  logo: string;
  favicon: string;
  heroImage: string;
  heroAltText: string;
  overlayOpacity: number;
};

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
  const response = await fetch(input, init);
  const body = await response.json().catch(() => ({}));
  return body;
}

export default function AdminAppearancePage() {
  const [form, setForm] = useState<FormState>({
    logo: "",
    favicon: "",
    heroImage: "",
    heroAltText: "",
    overlayOpacity: 50,
  });
  const [draftVersion, setDraftVersion] = useState<number | null>(null);
  const [publishedVersion, setPublishedVersion] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const result = await requestJson<SettingRow>("/api/v1/admin/appearance");
      if (result.success && result.data) {
        const draft = (result.data.draft ?? {}) as Partial<FormState>;
        setForm({
          logo: String(draft.logo ?? ""),
          favicon: String(draft.favicon ?? ""),
          heroImage: String(draft.heroImage ?? ""),
          heroAltText: String(draft.heroAltText ?? ""),
          overlayOpacity: Number(draft.overlayOpacity ?? 50) * 100,
        });
        setDraftVersion(result.data.draftVersion);
        setPublishedVersion(result.data.publishedVersion);
      } else {
        setError(result.error?.message ?? "Gagal memuat pengaturan.");
      }
      setLoading(false);
    })();
  }, []);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function saveDraft() {
    setSaving(true);
    setError(null);
    setStatus(null);
    const result = await requestJson<{ draftVersion: number }>("/api/v1/admin/appearance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          logo: form.logo,
          favicon: form.favicon,
          heroImage: form.heroImage,
          heroAltText: form.heroAltText,
          overlayOpacity: form.overlayOpacity / 100,
        },
        expectedDraftVersion: draftVersion,
      }),
    });
    if (result.success && typeof result.data?.draftVersion === "number") {
      setDraftVersion(result.data.draftVersion);
      setStatus("Draft disimpan. Gunakan Publish agar tampil di website.");
    } else {
      setError(result.error?.message ?? "Gagal menyimpan draft.");
    }
    setSaving(false);
  }

  async function publish() {
    setSaving(true);
    setError(null);
    setStatus(null);
    const result = await requestJson<{ publishedVersion: number }>("/api/v1/admin/appearance/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expectedDraftVersion: draftVersion }),
    });
    if (result.success && typeof result.data?.publishedVersion === "number") {
      setPublishedVersion(result.data.publishedVersion);
      setStatus("Appearance berhasil dipublikasikan.");
    } else {
      setError(result.error?.message ?? "Gagal publish.");
    }
    setSaving(false);
  }

  async function rollback() {
    setSaving(true);
    setError(null);
    setStatus(null);
    const result = await requestJson<{ publishedVersion: number }>("/api/v1/admin/appearance/rollback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expectedPublishedVersion: publishedVersion }),
    });
    if (result.success && typeof result.data?.publishedVersion === "number") {
      setPublishedVersion(result.data.publishedVersion);
      setStatus("Rollback ke versi sebelumnya berhasil.");
    } else {
      setError(result.error?.message ?? "Gagal rollback.");
    }
    setSaving(false);
  }

  if (loading) {
    return <p className="text-sm text-[#718196]">Memuat pengaturan appearance…</p>;
  }

  const inputClass =
    "min-h-11 w-full rounded-xl border border-white/10 bg-[#061122] px-4 text-sm text-white outline-none placeholder:text-[#51637a] focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Website"
        title="Appearance"
        description="Kelola elemen visual berisiko rendah. Perubahan publik hanya aktif setelah Publish."
        actions={
          <>
            <button
              type="button"
              onClick={rollback}
              disabled={saving || publishedVersion === null || publishedVersion === 0}
              className="inline-flex h-10 items-center rounded-full border border-white/15 px-4 text-sm font-semibold text-[#9FACBA] hover:border-brand-cyan hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Rollback
            </button>
            <button
              type="button"
              onClick={saveDraft}
              disabled={saving}
              className="inline-flex h-10 items-center rounded-full border border-white/15 px-4 text-sm font-semibold text-white hover:border-brand-cyan disabled:opacity-40"
            >
              Simpan Draft
            </button>
            <button
              type="button"
              onClick={publish}
              disabled={saving || draftVersion === null}
              className="brand-gradient inline-flex h-10 items-center rounded-full px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Publish
            </button>
          </>
        }
      />

      {status ? <p className="text-sm font-semibold text-success">{status}</p> : null}
      {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <AdminCard>
          <h2 className="text-lg font-semibold text-white">Logo</h2>
          <div className="mt-4 space-y-4">
            <label className="block text-xs font-bold text-[#9FACBA]">
              Logo utama (storage path)
              <input
                value={form.logo}
                onChange={(event) => setField("logo", event.target.value)}
                placeholder="admin/…"
                className={`mt-2 ${inputClass}`}
              />
            </label>
            <label className="block text-xs font-bold text-[#9FACBA]">
              Favicon (storage path)
              <input
                value={form.favicon}
                onChange={(event) => setField("favicon", event.target.value)}
                placeholder="admin/…"
                className={`mt-2 ${inputClass}`}
              />
            </label>
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="text-lg font-semibold text-white">Hero Background</h2>
          <div className="mt-4 space-y-4">
            <label className="block text-xs font-bold text-[#9FACBA]">
              Gambar hero (storage path)
              <input
                value={form.heroImage}
                onChange={(event) => setField("heroImage", event.target.value)}
                placeholder="admin/…"
                className={`mt-2 ${inputClass}`}
              />
            </label>
            <label className="block text-xs font-bold text-[#9FACBA]">
              Alt text
              <input
                value={form.heroAltText}
                onChange={(event) => setField("heroAltText", event.target.value)}
                className={`mt-2 ${inputClass}`}
              />
            </label>
            <label className="block text-xs font-bold text-[#9FACBA]">
              Overlay opacity: {Math.round(form.overlayOpacity)}%
              <input
                type="range"
                min={0}
                max={90}
                value={form.overlayOpacity}
                onChange={(event) => setField("overlayOpacity", Number(event.target.value))}
                className="mt-3 block w-full accent-[--brand-cyan]"
              />
            </label>
          </div>
        </AdminCard>
      </div>

      <AdminCard>
        <h2 className="text-lg font-semibold text-white">Preview</h2>
        <p className="mt-2 text-sm leading-6 text-[#9FACBA]">
          Preview desktop/tablet/mobile membutuhkan daftar Media Library. Unggah aset lalu isi storage path pada
          field logo/favicon/hero di atas agar dapat di-preview pada tahap berikutnya.
        </p>
      </AdminCard>

      <div>
        <p className="text-xs text-[#718196]">
          Versi: draft {draftVersion ?? 0} · published {publishedVersion ?? 0}
        </p>
      </div>
    </div>
  );
}