import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireAdminApi, adminJsonError } from "@/features/admin/lib/api-guard";
import { administratorActor } from "@/features/admin/lib/admin-actor";
import { getMediaSignedUrl, setMediaArchived, updateMediaAsset } from "@/features/admin/lib/media";
import { recordAdminActivity } from "@/features/admin/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  displayName: z.string().max(255).optional(),
  altText: z.string().max(1000).optional(),
  kind: z.enum(["logo", "favicon", "hero_image", "content_image", "avatar", "other"]).optional(),
  tags: z.array(z.string().max(60)).max(20).optional(),
});

export async function PATCH(request: NextRequest, context: RouteContext) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!guard.access.canManageConfig) {
    return adminJsonError("ADMIN_FORBIDDEN", "Role aktif tidak dapat mengubah media.", 403);
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return adminJsonError("INVALID_JSON", "Payload tidak valid.", 400);
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return adminJsonError("INVALID_BODY", "Data media tidak valid.", 400);
  }

  try {
    const rows = await updateMediaAsset(id, parsed.data);
    if (!rows[0]) {
      return adminJsonError("NOT_FOUND", "Media tidak ditemukan.", 404);
    }

    await recordAdminActivity({
      actor: administratorActor(guard.access),
      action: "media_updated",
      resourceType: "media_asset",
      resourceId: id,
      afterSummary: { fields: Object.keys(parsed.data) },
    });

    return Response.json({ success: true, data: { asset: rows[0] } }, { headers: { "Cache-Control": "no-store" } });
  } catch (caught) {
    console.error("Media update failed.", caught instanceof Error ? caught.message : String(caught));
    return adminJsonError("INTERNAL_SERVER_ERROR", "Media belum dapat diubah.", 500);
  }
}

const archiveSchema = z.object({
  archived: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest, context: RouteContext) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!guard.access.canManageConfig) {
    return adminJsonError("ADMIN_FORBIDDEN", "Role aktif tidak dapat mengarsip media.", 403);
  }

  const { id } = await context.params;

  let body: unknown = {};
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    // fallthrough
  }

  const parsed = archiveSchema.safeParse(body);
  if (!parsed.success) {
    return adminJsonError("INVALID_BODY", "Body tidak valid.", 400);
  }

  try {
    const rows = await setMediaArchived(id, parsed.data.archived);
    if (!rows[0]) {
      return adminJsonError("NOT_FOUND", "Media tidak ditemukan.", 404);
    }

    await recordAdminActivity({
      actor: administratorActor(guard.access),
      action: parsed.data.archived ? "media_archived" : "media_restored",
      resourceType: "media_asset",
      resourceId: id,
      afterSummary: { archived: parsed.data.archived },
    });

    return Response.json({ success: true, data: { asset: rows[0] } }, { headers: { "Cache-Control": "no-store" } });
  } catch (caught) {
    console.error("Media archive failed.", caught instanceof Error ? caught.message : String(caught));
    return adminJsonError("INTERNAL_SERVER_ERROR", "Media belum dapat diarsip.", 500);
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!guard.access.canViewAnalytics && !guard.access.canManageConfig) {
    return adminJsonError("ADMIN_FORBIDDEN", "Akses media tidak diizinkan.", 403);
  }

  const { id } = await context.params;
  const signedUrl = await getMediaSignedUrl(id);

  if (!signedUrl) {
    return adminJsonError("NOT_FOUND", "Media tidak ditemukan.", 404);
  }

  return Response.json({ success: true, data: { url: signedUrl } }, { headers: { "Cache-Control": "no-store" } });
}