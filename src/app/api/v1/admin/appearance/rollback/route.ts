import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireAdminApi, adminJsonError } from "@/features/admin/lib/api-guard";
import { administratorActor } from "@/features/admin/lib/admin-actor";
import { rollbackSetting, SITE_SETTING_KEYS } from "@/features/admin/lib/site-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rollbackBodySchema = z.object({
  expectedPublishedVersion: z.number().int().min(0).optional(),
});

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!guard.access.canManageConfig) {
    return adminJsonError("ADMIN_FORBIDDEN", "Role aktif tidak dapat me-rollback appearance.", 403);
  }

  let body: unknown = {};
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    // fallthrough
  }

  const parsed = rollbackBodySchema.safeParse(body);
  if (!parsed.success) {
    return adminJsonError("INVALID_BODY", "Body tidak valid.", 400);
  }

  const result = await rollbackSetting(
    SITE_SETTING_KEYS.appearance,
    parsed.data.expectedPublishedVersion ?? null,
    administratorActor(guard.access),
  );

  if (!result.ok) {
    const status = result.code === "NO_PREVIOUS_VERSION" ? 409 : 409;
    return adminJsonError(result.code, result.code === "NO_PREVIOUS_VERSION" ? "Belum ada versi sebelumnya." : result.code === "VERSION_CONFLICT" ? "Versi published sudah berubah." : "Rollback gagal.", status);
  }

  return Response.json(
    { success: true, data: { publishedVersion: result.publishedVersion } },
    { headers: { "Cache-Control": "no-store" } },
  );
}