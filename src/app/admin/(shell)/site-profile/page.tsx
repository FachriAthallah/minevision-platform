"use client";

import { useEffect, useState } from "react";

import {
  AdminCard,
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

const inputClass =
  "min-h-11 w-full rounded-xl border border-white/10 bg-[#061122] px-4 text-sm text-white outline-none placeholder:text-[#51637a] focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20";

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
    return <p className="text-sm text-[#718196]">Memuat site profile…</p>;
  }

  function renderLinkEditor(key: "socialLinks" | "officialSources", title: string) {
    return (
      <AdminCard>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <div className="mt-4 space-y-3">
          {form[key].length === 0 ? (
            <p className="text-sm text-[#718196]">Belum ada tautan.</p>
          ) : null}
          {form[key].map((link, index) => (
            <div key={`${key}-${index}`} className="grid gap-3 rounded-xl border border-white/10 bg-[#061122] p-3 sm:grid-cols-[1fr_2fr_auto]">
              <input
                value={link.label}
                onChange={(event) => setLink(key, index, "label", event.target.value)}
                placeholder="Label"
                aria-label={`Label tautan ${index + 1}`}
                className={inputClass}
              />
              <input
                value={link.url}
                onChange={(event) => setLink(key, index, "url", event.target.value)}
                placeholder="https://…"
                aria-label={`URL tautan ${index + 1}`}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removeLink(key, index)}
                aria-label={`Hapus tautan ${index + 1}`}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 px-3 text-sm text-[#9FACBA] hover:border-danger/40 hover:text-danger focus-visible:outline-2 focus-visible:outline-brand-cyan"
              >
                Hapus
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addLink(key)}
            className="inline-flex h-10 items-center rounded-full border border-white/15 px-4 text-sm font-semibold text-white hover:border-brand-cyan"
          >
            + Tambah
          </button>
        </div>
      </AdminCard>
    );
  }

  const textareaClass = "w-full rounded-xl border border-white/10 bg-[#061122] px-4 py-3 text-sm text-white outline-none placeholder:text-[#51637a] focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Website"
        title="Site Profile"
        description="Informasi publik platform: nama, deskripsi, kontak, SEO, dan tautan resmi."
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
          <h2 className="text-lg font-semibold text-white">Identitas</h2>
          <div className="mt-4 space-y-4">
            <label className="block text-xs font-bold text-[#9FACBA]">
              Nama platform
              <input value={form.name} onChange={(event) => setField("name", event.target.value)} className={`mt-2 ${inputClass}`} />
            </label>
            <label className="block text-xs font-bold text-[#9FACBA]">
              Tagline
              <input value={form.tagline} onChange={(event) => setField("tagline", event.target.value)} className={`mt-2 ${inputClass}`} />
            </label>
            <label className="block text-xs font-bold text-[#9FACBA]">
              Deskripsi
              <textarea value={form.description} onChange={(event) => setField("description", event.target.value)} rows={3} className={`mt-2 ${textareaClass}`} />
            </label>
            <label className="block text-xs font-bold text-[#9FACBA]">
              Deskripsi footer
              <textarea value={form.footerDescription} onChange={(event) => setField("footerDescription", event.target.value)} rows={2} className={`mt-2 ${textareaClass}`} />
            </label>
          </div>
        </AdminCard>

        <div className="space-y-5">
          <AdminCard>
            <h2 className="text-lg font-semibold text-white">Kontak</h2>
            <div className="mt-4 space-y-4">
              <label className="block text-xs font-bold text-[#9FACBA]">
                Email publik
                <input value={form.contactEmail} onChange={(event) => setField("contactEmail", event.target.value)} type="email" className={`mt-2 ${inputClass}`} />
              </label>
              <label className="block text-xs font-bold text-[#9FACBA]">
                Telepon
                <input value={form.contactPhone} onChange={(event) => setField("contactPhone", event.target.value)} className={`mt-2 ${inputClass}`} />
              </label>
              <label className="block text-xs font-bold text-[#9FACBA]">
                Alamat organisasi
                <input value={form.organizationAddress} onChange={(event) => setField("organizationAddress", event.target.value)} className={`mt-2 ${inputClass}`} />
              </label>
            </div>
          </AdminCard>

          <AdminCard>
            <h2 className="text-lg font-semibold text-white">SEO & Copyright</h2>
            <div className="mt-4 space-y-4">
              <label className="block text-xs font-bold text-[#9FACBA]">
                Default SEO title
                <input value={form.seoTitle} onChange={(event) => setField("seoTitle", event.target.value)} className={`mt-2 ${inputClass}`} />
              </label>
              <label className="block text-xs font-bold text-[#9FACBA]">
                Default SEO description
                <textarea value={form.seoDescription} onChange={(event) => setField("seoDescription", event.target.value)} rows={2} className={`mt-2 ${textareaClass}`} />
              </label>
              <label className="block text-xs font-bold text-[#9FACBA]">
                Copyright footer
                <input value={form.footerCopyright} onChange={(event) => setField("footerCopyright", event.target.value)} className={`mt-2 ${inputClass}`} />
              </label>
            </div>
          </AdminCard>
        </div>
      </div>

      {renderLinkEditor("socialLinks", "Social Links")}
      {renderLinkEditor("officialSources", "Official Source Links")}

      <p className="text-xs text-[#718196]">
        Versi: draft {draftVersion ?? 0} · published {publishedVersion ?? 0}
      </p>
    </div>
  );
}