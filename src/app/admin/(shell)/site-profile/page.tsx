"use client";

import { useEffect, useState } from "react";

import {
  ADMIN_INPUT_CLASS,
  ADMIN_TEXTAREA_CLASS,
  AdminButton,
  AdminCard,
  AdminCardTitle,
  AdminFieldLabel,
  AdminNote,
  AdminPageHeader,
} from "@/features/admin/components/admin-ui";

type SocialLink = { label: string; url: string };
type OfficialSource = { label: string; url: string };

type FormState = {
  name: string;
  tagline: string;
  description: string;
  footerDescription: string;
  contactEmail: string;
  contactPhone: string;
  organizationAddress: string;
  seoTitle: string;
  seoDescription: string;
  footerCopyright: string;
  socialLinks: SocialLink[];
  officialSources: OfficialSource[];
};

type SettingRow = {
  draft: FormState | null;
  published: FormState | null;
  draftVersion: number;
  publishedVersion: number;
};

const EMPTY_FORM: FormState = {
  name: "",
  tagline: "",
  description: "",
  footerDescription: "",
  contactEmail: "",
  contactPhone: "",
  organizationAddress: "",
  seoTitle: "",
  seoDescription: "",
  footerCopyright: "",
  socialLinks: [],
  officialSources: [],
};

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
  const response = await fetch(input, init);
  const body = await response.json().catch(() => ({}));
  return body;
}

export default function AdminSiteProfilePage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [draftVersion, setDraftVersion] = useState<number | null>(null);
  const [publishedVersion, setPublishedVersion] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const result = await requestJson<SettingRow>("/api/v1/admin/site-profile");
      if (result.success && result.data) {
        setForm({ ...EMPTY_FORM, ...(result.data.draft ?? EMPTY_FORM) });
        setDraftVersion(result.data.draftVersion);
        setPublishedVersion(result.data.publishedVersion);
      } else {
        setError(result.error?.message ?? "Gagal memuat profil.");
      }
      setLoading(false);
    })();
  }, []);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function setLink<L extends "socialLinks" | "officialSources">(
    key: L,
    index: number,
    field: keyof (typeof form)[L][number],
    value: string,
  ) {
    setForm((current) => {
      const list = [...(current[key] as Array<{ [field: string]: string }>)];
      list[index] = { ...list[index], [field]: value };
      return { ...current, [key]: list };
    });
  }

  function addLink(key: "socialLinks" | "officialSources") {
    setForm((current) => ({
      ...current,
      [key]: [...current[key], { label: "", url: "" }],
    }));
  }

  function removeLink(key: "socialLinks" | "officialSources", index: number) {
    setForm((current) => ({
      ...current,
      [key]: current[key].filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function saveDraft() {
    setSaving(true);
    setError(null);
    setStatus(null);
    const result = await requestJson<{ draftVersion: number }>("/api/v1/admin/site-profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: form, expectedDraftVersion: draftVersion }),
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
    const result = await requestJson<{ publishedVersion: number }>("/api/v1/admin/site-profile/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expectedDraftVersion: draftVersion }),
    });
    if (result.success && typeof result.data?.publishedVersion === "number") {
      setPublishedVersion(result.data.publishedVersion);
      setStatus("Site profile berhasil dipublikasikan.");
    } else {
      setError(result.error?.message ?? "Gagal publish.");
    }
    setSaving(false);
  }

  async function rollback() {
    setSaving(true);
    setError(null);
    setStatus(null);
    const result = await requestJson<{ publishedVersion: number }>("/api/v1/admin/site-profile/rollback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expectedPublishedVersion: publishedVersion }),
    });
    if (result.success && typeof result.data?.publishedVersion === "number") {
      setPublishedVersion(result.data.publishedVersion);
      setStatus("Rollback ke versi sebelumnya berhasil.");
    } else {
      setError(result.error?.message ?? result.error?.code === "NO_PREVIOUS_VERSION" ? "Belum ada versi sebelumnya." : "Gagal rollback.");
    }
    setSaving(false);
  }

  if (loading) {
    return <p className="text-sm text-admin-muted">Memuat site profile…</p>;
  }

  function renderLinkEditor(key: "socialLinks" | "officialSources", title: string) {
    return (
      <AdminCard>
        <AdminCardTitle>{title}</AdminCardTitle>
        <div className="mt-5 space-y-3">
          {form[key].length === 0 ? (
            <p className="text-sm text-admin-muted">Belum ada tautan.</p>
          ) : null}
          {form[key].map((link, index) => (
            <div
              key={`${key}-${index}`}
              className="grid gap-3 rounded-md border border-admin-line bg-admin-raised/40 p-3 sm:grid-cols-[1fr_2fr_auto]"
            >
              <input
                value={link.label}
                onChange={(event) => setLink(key, index, "label", event.target.value)}
                placeholder="Label"
                aria-label={`Label tautan ${index + 1}`}
                className={ADMIN_INPUT_CLASS}
              />
              <input
                value={link.url}
                onChange={(event) => setLink(key, index, "url", event.target.value)}
                placeholder="https://…"
                aria-label={`URL tautan ${index + 1}`}
                className={ADMIN_INPUT_CLASS}
              />
              <button
                type="button"
                onClick={() => removeLink(key, index)}
                aria-label={`Hapus tautan ${index + 1}`}
                className="inline-flex h-10 items-center justify-center rounded-md border border-admin-line px-3 text-sm text-admin-muted hover:border-admin-bad/40 hover:text-admin-bad focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent"
              >
                Hapus
              </button>
            </div>
          ))}
          <AdminButton variant="secondary" type="button" onClick={() => addLink(key)}>
            + Tambah
          </AdminButton>
        </div>
      </AdminCard>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Site Profile"
        description="Informasi publik platform: nama, deskripsi, kontak, SEO, dan tautan resmi."
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

      <div className="grid gap-5 lg:grid-cols-2">
        <AdminCard>
          <AdminCardTitle>Identitas Website</AdminCardTitle>
          <p className="mt-1 text-xs text-admin-muted">
            Nama, tagline, dan deskripsi yang dipakai untuk identitas publik platform.
          </p>
          <div className="mt-5 space-y-5">
            <div>
              <AdminFieldLabel>Nama platform</AdminFieldLabel>
              <input value={form.name} onChange={(event) => setField("name", event.target.value)} className={ADMIN_INPUT_CLASS} />
            </div>
            <div>
              <AdminFieldLabel>Tagline</AdminFieldLabel>
              <input value={form.tagline} onChange={(event) => setField("tagline", event.target.value)} className={ADMIN_INPUT_CLASS} />
            </div>
            <div>
              <AdminFieldLabel>Deskripsi singkat</AdminFieldLabel>
              <textarea value={form.description} onChange={(event) => setField("description", event.target.value)} rows={3} className={ADMIN_TEXTAREA_CLASS} />
            </div>
          </div>
        </AdminCard>

        <div className="space-y-5">
          <AdminCard>
            <AdminCardTitle>Kontak & Tautan</AdminCardTitle>
            <div className="mt-5 space-y-5">
              <div>
                <AdminFieldLabel>Email publik</AdminFieldLabel>
                <input value={form.contactEmail} onChange={(event) => setField("contactEmail", event.target.value)} type="email" className={ADMIN_INPUT_CLASS} />
              </div>
              <div>
                <AdminFieldLabel>Telepon</AdminFieldLabel>
                <input value={form.contactPhone} onChange={(event) => setField("contactPhone", event.target.value)} className={ADMIN_INPUT_CLASS} />
              </div>
              <div>
                <AdminFieldLabel>Alamat organisasi</AdminFieldLabel>
                <input value={form.organizationAddress} onChange={(event) => setField("organizationAddress", event.target.value)} className={ADMIN_INPUT_CLASS} />
              </div>
            </div>
          </AdminCard>

          <AdminCard>
            <AdminCardTitle>SEO</AdminCardTitle>
            <div className="mt-5 space-y-5">
              <div>
                <AdminFieldLabel>Default SEO title</AdminFieldLabel>
                <input value={form.seoTitle} onChange={(event) => setField("seoTitle", event.target.value)} className={ADMIN_INPUT_CLASS} />
              </div>
              <div>
                <AdminFieldLabel>Default SEO description</AdminFieldLabel>
                <textarea value={form.seoDescription} onChange={(event) => setField("seoDescription", event.target.value)} rows={2} className={ADMIN_TEXTAREA_CLASS} />
              </div>
            </div>
          </AdminCard>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <AdminCard>
          <AdminCardTitle>Footer</AdminCardTitle>
          <p className="mt-1 text-xs text-admin-muted">
            Deskripsi dan copyright yang tampil di footer seluruh halaman publik.
          </p>
          <div className="mt-5 space-y-5">
            <div>
              <AdminFieldLabel>Deskripsi footer</AdminFieldLabel>
              <textarea value={form.footerDescription} onChange={(event) => setField("footerDescription", event.target.value)} rows={2} className={ADMIN_TEXTAREA_CLASS} />
            </div>
            <div>
              <AdminFieldLabel>Copyright footer</AdminFieldLabel>
              <input value={form.footerCopyright} onChange={(event) => setField("footerCopyright", event.target.value)} className={ADMIN_INPUT_CLASS} />
            </div>
          </div>
        </AdminCard>

        {renderLinkEditor("officialSources", "Official Source Links")}
      </div>

      {renderLinkEditor("socialLinks", "Social Links")}

      <p className="text-xs tabular-nums text-admin-muted">
        Versi: draft {draftVersion ?? 0} · published {publishedVersion ?? 0}
      </p>
    </div>
  );
}