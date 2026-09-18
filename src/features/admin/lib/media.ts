import "server-only";

import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { getStorageAdminClient } from "@/lib/supabase/admin";
import { detectImageMime, MAX_MEDIA_BYTES } from "./media-mime";

export { detectImageMime, MAX_MEDIA_BYTES };

export const ADMIN_MEDIA_BUCKET = "admin-media";

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

type UploadImageInput = {
  fileName: string;
  bytes: Uint8Array;
  uploaderId: string;
};

export type MediaUploadError =
  | { ok: false; code: "EMPTY_FILE" }
  | { ok: false; code: "UNSUPPORTED_TYPE" }
  | { ok: false; code: "FILE_TOO_LARGE" }
  | { ok: false; code: "UPLOAD_FAILED" }
  | { ok: false; code: "STORAGE_UNAVAILABLE" };

export async function uploadImage(
  input: UploadImageInput,
): Promise<{ ok: true; assetId: string } | MediaUploadError> {
  if (!input.bytes.length) {
    return { ok: false, code: "EMPTY_FILE" };
  }

  if (input.bytes.length > MAX_MEDIA_BYTES) {
    return { ok: false, code: "FILE_TOO_LARGE" };
  }

  const mime = detectImageMime(input.bytes);

  if (!mime || !ALLOWED_MIME.has(mime)) {
    return { ok: false, code: "UNSUPPORTED_TYPE" };
  }

  const objectName = `admin/${randomUUID()}`;

  let storageAdminClient: ReturnType<typeof getStorageAdminClient>;

  try {
    storageAdminClient = getStorageAdminClient();
  } catch {
    return { ok: false, code: "STORAGE_UNAVAILABLE" };
  }

  const { error } = await storageAdminClient.storage
    .from(ADMIN_MEDIA_BUCKET)
    .upload(objectName, input.bytes, {
      contentType: mime,
      upsert: false,
      cacheControl: "3600",
    });

  if (error) {
    return { ok: false, code: "UPLOAD_FAILED" };
  }

  const asset = await db
    .insert(mediaAssets)
    .values({
      bucket: ADMIN_MEDIA_BUCKET,
      storagePath: objectName,
      kind: "content_image",
      originalFileName: input.fileName,
      displayName: input.fileName,
      mimeType: mime,
      sizeBytes: input.bytes.length,
      uploadedBy: input.uploaderId,
    })
    .returning({ id: mediaAssets.id });

  return { ok: true, assetId: asset[0].id };
}

export async function listMediaAssets() {
  return db
    .select()
    .from(mediaAssets)
    .orderBy(mediaAssets.createdAt);
}

export async function getMediaSignedUrl(
  assetId: string,
): Promise<string | null> {
  const rows = await db
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.id, assetId))
    .limit(1);

  if (!rows[0]) {
    return null;
  }

  const asset = rows[0];

  let storageAdminClient: ReturnType<typeof getStorageAdminClient>;

  try {
    storageAdminClient = getStorageAdminClient();
  } catch {
    return null;
  }

  const { data, error } = await storageAdminClient.storage
    .from(asset.bucket)
    .createSignedUrl(asset.storagePath, 60 * 60);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

export async function updateMediaAsset(
  assetId: string,
  patch: { displayName?: string; altText?: string; kind?: string; tags?: string[] },
) {
  return db
    .update(mediaAssets)
    .set({
      ...(patch.displayName !== undefined ? { displayName: patch.displayName } : {}),
      ...(patch.altText !== undefined ? { altText: patch.altText } : {}),
      ...(patch.kind !== undefined
        ? { kind: patch.kind as typeof mediaAssets.$inferSelect["kind"] }
        : {}),
      ...(patch.tags !== undefined
        ? { tags: patch.tags as typeof mediaAssets.$inferSelect["tags"] }
        : {}),
    })
    .where(eq(mediaAssets.id, assetId))
    .returning();
}

export async function setMediaArchived(assetId: string, archived: boolean) {
  return db
    .update(mediaAssets)
    .set({ isArchived: archived })
    .where(eq(mediaAssets.id, assetId))
    .returning();
}

export async function hardDeleteMediaAsset(assetId: string) {
  const rows = await db
    .select()
    .from(mediaAssets)
    .where(eq(mediaAssets.id, assetId))
    .limit(1);

  if (!rows[0]) {
    return { ok: false as const, code: "NOT_FOUND" as const };
  }

  const asset = rows[0];

  let storageAdminClient: ReturnType<typeof getStorageAdminClient>;

  try {
    storageAdminClient = getStorageAdminClient();
  } catch {
    return { ok: false as const, code: "STORAGE_UNAVAILABLE" as const };
  }

  const { error } = await storageAdminClient.storage
    .from(asset.bucket)
    .remove([asset.storagePath]);

  if (error) {
    return { ok: false as const, code: "STORAGE_DELETE_FAILED" as const };
  }

  await db.delete(mediaAssets).where(eq(mediaAssets.id, assetId));
  return { ok: true as const };
}