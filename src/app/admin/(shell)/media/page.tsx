"use client";

import { useEffect, useState } from "react";
import { FileImage } from "lucide-react";

import {
  AdminButton,
  AdminCard,
  AdminCardTitle,
  AdminEmptyState,
  AdminFieldLabel,
  AdminNote,
  AdminPageHeader,
  StatusBadge,
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
    return <p className="text-sm text-admin-muted">Memuat media…</p>;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Media Library"
        description="Unggah dan kelola gambar untuk logo, hero, dan konten. Batasan: PNG/JPEG/WebP maksimal 10 MB."
      />

      {status ? <AdminNote tone="good">{status}</AdminNote> : null}
      {error ? <AdminNote tone="bad">{error}</AdminNote> : null}

      <AdminCard>
        <AdminCardTitle>Upload Gambar</AdminCardTitle>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="w-full max-w-md">
            <AdminFieldLabel>Pilih file gambar</AdminFieldLabel>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              aria-label="Pilih gambar untuk diunggah"
              className="block w-full text-sm text-admin-muted file:mr-3 file:rounded-md file:border-0 file:bg-admin-raised file:px-3.5 file:py-2 file:font-semibold file:text-admin-text"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
          </div>
          <AdminButton type="button" onClick={upload} disabled={!selectedFile || uploading} className="h-10">
            {uploading ? "Mengunggah…" : "Upload"}
          </AdminButton>
        </div>
        {selectedFile ? (
          <p className="mt-2 text-xs tabular-nums text-admin-muted">
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
            <AdminCard key={asset.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-md bg-admin-raised">
                  <FileImage aria-hidden="true" className="size-5 text-admin-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-admin-text">
                    {asset.displayName ?? asset.originalFileName ?? "Tanpa nama"}
                  </p>
                  <p className="mt-1 text-xs text-admin-muted">{asset.mimeType}</p>
                  <p className="mt-0.5 text-xs tabular-nums text-admin-muted">
                    {(asset.sizeBytes / 1024).toFixed(1)} KB ·{" "}
                    {new Date(asset.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
                {asset.isArchived ? <StatusBadge tone="warn">Arsip</StatusBadge> : null}
              </div>
              <div className="mt-4">
                <AdminButton
                  variant={asset.isArchived ? "secondary" : "ghost"}
                  type="button"
                  onClick={() => void archive(asset.id, !asset.isArchived)}
                  className="w-full justify-center"
                >
                  {asset.isArchived ? "Pulihkan" : "Arsip"}
                </AdminButton>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}