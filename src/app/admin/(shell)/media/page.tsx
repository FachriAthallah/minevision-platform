"use client";

import { useEffect, useState } from "react";

import {
  AdminCard,
  AdminEmptyState,
  AdminPageHeader,
} from "@/features/admin/components/admin-ui";

type MediaAsset = {
  id: string;
  kind: string;
  originalFileName: string | null;
  displayName: string | null;
  mimeType: string;
  sizeBytes: number;
  isArchived: boolean;
  createdAt: string;
};

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
  const response = await fetch(input, init);
  return response.json().catch(() => ({}));
}

export default function AdminMediaPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function load() {
    const result = await requestJson<{ assets: MediaAsset[] }>("/api/v1/admin/media");
    if (result.success && result.data) {
      setAssets(result.data.assets);
    } else {
      setError(result.error?.message ?? "Gagal memuat media.");
    }
  }

  useEffect(() => {
    void (async () => {
      await load();
      setLoading(false);
    })();
  }, []);

  async function upload() {
    if (!selectedFile) {
      return;
    }
    setUploading(true);
    setError(null);
    setStatus(null);
    const formData = new FormData();
    formData.set("file", selectedFile);
    formData.set("name", selectedFile.name);
    const result = await requestJson<{ assetId: string }>("/api/v1/admin/media", {
      method: "POST",
      body: formData,
    });
    if (result.success) {
      setStatus("Media berhasil diunggah.");
      setSelectedFile(null);
      await load();
    } else {
      setError(result.error?.message ?? "Upload gagal.");
    }
    setUploading(false);
  }

  async function archive(id: string, archived: boolean) {
    const result = await requestJson("/api/v1/admin/media/" + id, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived }),
    });
    if (result.success) {
      await load();
    } else {
      setError(result.error?.message ?? "Gagal mengarsip media.");
    }
  }

  if (loading) {
    return <p className="text-sm text-[#718196]">Memuat media…</p>;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Website"
        title="Media Library"
        description="Unggah dan kelola gambar untuk logo, hero, dan konten. Batasan: PNG/JPEG/WebP maksimal 10 MB."
      />

      {status ? <p className="text-sm font-semibold text-success">{status}</p> : null}
      {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}

      <AdminCard>
        <h2 className="text-lg font-semibold text-white">Upload Gambar</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            aria-label="Pilih gambar untuk diunggah"
            className="block w-full max-w-md text-sm text-[#9FACBA] file:mr-3 file:rounded-full file:border-0 file:bg-brand-cyan/10 file:px-4 file:py-2 file:font-semibold file:text-brand-cyan"
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={upload}
            disabled={!selectedFile || uploading}
            className="brand-gradient inline-flex h-11 items-center rounded-full px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {uploading ? "Mengunggah…" : "Upload"}
          </button>
        </div>
        {selectedFile ? (
          <p className="mt-2 text-xs text-[#718196]">
            {selectedFile.name} · {(selectedFile.size / 1024).toFixed(1)} KB
          </p>
        ) : null}
      </AdminCard>

      {assets.length === 0 ? (
        <AdminEmptyState
          title="Belum ada media"
          description="Unggah gambar agar aset tersedia untuk Appearance dan Site Profile."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => (
            <AdminCard key={asset.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{asset.displayName ?? asset.originalFileName ?? "Tanpa nama"}</p>
                  <p className="mt-1 text-xs text-[#718196]">{asset.mimeType}</p>
                  <p className="mt-1 text-xs text-[#718196]">{(asset.sizeBytes / 1024).toFixed(1)} KB</p>
                </div>
                {asset.isArchived ? (
                  <span className="rounded-full border border-warning/25 bg-warning/5 px-2.5 py-1 text-xs font-bold text-warning">
                    Arsip
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => void archive(asset.id, !asset.isArchived)}
                className="mt-4 w-full rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-[#9FACBA] hover:border-brand-cyan hover:text-white focus-visible:outline-2 focus-visible:outline-brand-cyan"
              >
                {asset.isArchived ? "Pulihkan" : "Arsip"}
              </button>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}