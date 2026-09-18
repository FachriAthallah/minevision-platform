import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireAdminApi, adminJsonError } from "@/features/admin/lib/api-guard";
import { administratorActor } from "@/features/admin/lib/admin-actor";
import { listMediaAssets, uploadImage } from "@/features/admin/lib/media";
import { recordAdminActivity } from "@/features/admin/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const uploadFormSchema = z.object({
  fileName: z.string().min(1).max(255),
  file: z.instanceof(Blob),
});

export async function GET() {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!guard.access.canManageConfig) {
    return adminJsonError("ADMIN_FORBIDDEN", "Role aktif tidak dapat mengelola media.", 403);
  }

  try {
    const assets = await listMediaAssets();

    return Response.json(
      { success: true, data: { assets } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (caught) {
    console.error("Media list failed.", caught instanceof Error ? caught.message : String(caught));
    return adminJsonError("INTERNAL_SERVER_ERROR", "Media belum dapat dimuat.", 500);
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!guard.access.canManageConfig) {
    return adminJsonError("ADMIN_FORBIDDEN", "Role aktif tidak dapat mengunggah media.", 403);
  }

  const formData = await request.formData().catch(() => null);
  const rawFile = formData?.get("file");
  const rawFileName = formData?.get("name");

  const parsed = uploadFormSchema.safeParse({
    fileName: typeof rawFileName === "string" ? rawFileName : "",
    file: rawFile instanceof Blob ? (rawFile as Blob) : null,
  });

  if (!parsed.success) {
    return adminJsonError("INVALID_UPLOAD", "Data upload tidak valid.", 400);
  }

  const bytes = new Uint8Array(await parsed.data.file.arrayBuffer());

  const result = await uploadImage({
    fileName: parsed.data.fileName,
    bytes,
    uploaderId: guard.access.identity.id,
  });

  if (!result.ok) {
    const status = result.code === "UNSUPPORTED_TYPE" ? 415 : result.code === "FILE_TOO_LARGE" ? 413 : result.code === "EMPTY_FILE" ? 400 : 500;
    return adminJsonError(result.code, result.code === "UNSUPPORTED_TYPE" ? "Tipe file tidak didukung (hanya PNG/JPEG/WebP)." : result.code === "FILE_TOO_LARGE" ? "Ukuran file melebihi batas." : "Upload gagal.", status);
  }

  await recordAdminActivity({
    actor: administratorActor(guard.access),
    action: "media_uploaded",
    resourceType: "media_asset",
    resourceId: result.assetId,
    afterSummary: { fileName: parsed.data.fileName },
  });

  return Response.json(
    { success: true, data: { assetId: result.assetId } },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}