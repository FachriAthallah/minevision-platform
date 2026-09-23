"use client";

import { useEffect, useState } from "react";

import {
  ADMIN_INPUT_CLASS,
  AdminButton,
  AdminCard,
  AdminCardTitle,
  AdminFieldLabel,
  AdminNote,
  AdminPageHeader,
} from "@/features/admin/components/admin-ui";

type SettingRow = {
  draft: Record<string, unknown> | null;
  published: Record<string, unknown> | null;
  draftVersion: number;
  publishedVersion: number;
};

type FocalPoint = { x: number; y: number };

type FormState = {
  logo: string;
  logoCompact: string;
  favicon: string;
  heroImage: string;
  heroAltText: string;
  heroFocalX: number;
  heroFocalY: number;
  overlayOpacity: number;
};

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
  const response = await fetch(input, init);
  const body = await response.json().catch(() => ({}));
  return body;
}

const DEFAULT_FOCAL: FocalPoint = { x: 50, y: 50 };

export default function AdminAppearancePage() {
  const [form, setForm] = useState<FormState>({
    logo: "",
    logoCompact: "",
    favicon: "",
    heroImage: "",
    heroAltText: "",
    heroFocalX: DEFAULT_FOCAL.x,
    heroFocalY: DEFAULT_FOCAL.y,
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
        const draft = (result.data.draft ?? {}) as Partial<FormState> & { heroFocalPoint?: FocalPoint };
        const focal = draft.heroFocalPoint ?? DEFAULT_FOCAL;
        setForm({
          logo: String(draft.logo ?? ""),
          logoCompact: String(draft.logoCompact ?? ""),
          favicon: String(draft.favicon ?? ""),
          heroImage: String(draft.heroImage ?? ""),
          heroAltText: String(draft.heroAltText ?? ""),
          heroFocalX: Number(focal.x ?? DEFAULT_FOCAL.x),
          heroFocalY: Number(focal.y ?? DEFAULT_FOCAL.y),
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
          logoCompact: form.logoCompact,
          favicon: form.favicon,
          heroImage: form.heroImage,
          heroAltText: form.heroAltText,
          heroFocalPoint: { x: form.heroFocalX, y: form.heroFocalY },
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
    return <p className="text-sm text-admin-muted">Memuat pengaturan appearance…</p>;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Appearance"
        description="Configurasi visual internal MineVision. Perubahan publik hanya aktif setelah Publish."
        actions={
          <>
            <AdminButton variant="secondary" type="button" onClick={rollback} disabled={saving || publishedVersion === null || publishedVersion === 0}>
              Rollback
            </AdminButton>
            <AdminButton variant="secondary" type="button" onClick={saveDraft} disabled={saving}>
              Simpan Draft
            </AdminButton>
            <AdminButton variant="primary" type="button" onClick={publish} disabled={saving || draftVersion === null}>
              Publish
            </AdminButton>
          </>
        }
      />

      {status ? <AdminNote tone="good">{status}</AdminNote> : null}
      {error ? <AdminNote tone="bad">{error}</AdminNote> : null}

      <div className="admin-reveal grid gap-5 lg:grid-cols-2">
        <AdminCard>
          <AdminCardTitle>Identitas Visual</AdminCardTitle>
          <p className="mt-1 text-xs text-admin-muted">
            Logo utama, varian compact, dan favicon yang dipakai di seluruh halaman publik.
          </p>
          <div className="mt-5 space-y-5">
            <div>
              <AdminFieldLabel>Logo utama (storage path)</AdminFieldLabel>
              <input
                value={form.logo}
                onChange={(event) => setField("logo", event.target.value)}
                placeholder="admin/…"
                className={ADMIN_INPUT_CLASS}
              />
            </div>
            <div>
              <AdminFieldLabel>Logo compact (storage path)</AdminFieldLabel>
              <input
                value={form.logoCompact}
                onChange={(event) => setField("logoCompact", event.target.value)}
                placeholder="admin/…"
                className={ADMIN_INPUT_CLASS}
              />
            </div>
            <div>
              <AdminFieldLabel>Favicon (storage path)</AdminFieldLabel>
              <input
                value={form.favicon}
                onChange={(event) => setField("favicon", event.target.value)}
                placeholder="admin/…"
                className={ADMIN_INPUT_CLASS}
              />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <AdminCardTitle>Hero Background</AdminCardTitle>
          <p className="mt-1 text-xs text-admin-muted">
            Gambar latar, posisi fokus, dan intensitas overlay untuk hero publik.
          </p>
          <div className="mt-5 space-y-5">
            <div>
              <AdminFieldLabel>Gambar hero (storage path)</AdminFieldLabel>
              <input
                value={form.heroImage}
                onChange={(event) => setField("heroImage", event.target.value)}
                placeholder="admin/…"
                className={ADMIN_INPUT_CLASS}
              />
            </div>
            <div>
              <AdminFieldLabel>Alt text</AdminFieldLabel>
              <input
                value={form.heroAltText}
                onChange={(event) => setField("heroAltText", event.target.value)}
                className={ADMIN_INPUT_CLASS}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <AdminFieldLabel>Fokus horizontal: {form.heroFocalX}%</AdminFieldLabel>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={form.heroFocalX}
                  onChange={(event) => setField("heroFocalX", Number(event.target.value))}
                  className="mt-2 block w-full accent-[--admin-accent]"
                />
              </div>
              <div>
                <AdminFieldLabel>Fokus vertikal: {form.heroFocalY}%</AdminFieldLabel>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={form.heroFocalY}
                  onChange={(event) => setField("heroFocalY", Number(event.target.value))}
                  className="mt-2 block w-full accent-[--admin-accent]"
                />
              </div>
            </div>
            <div>
              <AdminFieldLabel>Overlay opacity: {Math.round(form.overlayOpacity)}%</AdminFieldLabel>
              <input
                type="range"
                min={0}
                max={90}
                value={form.overlayOpacity}
                onChange={(event) => setField("overlayOpacity", Number(event.target.value))}
                className="mt-2 block w-full accent-[--admin-accent]"
              />
            </div>
          </div>
        </AdminCard>
      </div>

      <div className="admin-reveal">
        <AdminCard>
          <AdminCardTitle>Preview</AdminCardTitle>
          <div className="mt-3">
            <AdminNote>
              Preview desktop/tablet/mobile akan menampilkan aset setelah diunggah ke Media Library dan path diisi. Saat ini belum ada aset hero pada draft.
            </AdminNote>
          </div>
        </AdminCard>
      </div>

      <p className="text-xs tabular-nums text-admin-muted">
        Versi: draft {draftVersion ?? 0} · published {publishedVersion ?? 0}
      </p>
    </div>
  );
}