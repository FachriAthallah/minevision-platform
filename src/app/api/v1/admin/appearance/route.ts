import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireAdminApi, adminJsonError } from "@/features/admin/lib/api-guard";
import { administratorActor } from "@/features/admin/lib/admin-actor";
import {
  getSettingAdmin,
  saveDraftSetting,
  SITE_SETTING_KEYS,
} from "@/features/admin/lib/site-settings";
import { appearanceSchema } from "@/features/admin/schemas/admin-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchBodySchema = z.object({
  data: appearanceSchema,
  expectedDraftVersion: z.number().int().min(0).optional(),
});

export async function GET() {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!guard.access.canManageConfig) {
    return adminJsonError("ADMIN_FORBIDDEN", "Role aktif tidak dapat mengelola appearance.", 403);
  }

  const row = await getSettingAdmin(SITE_SETTING_KEYS.appearance);

  return Response.json(
    { success: true, data: row },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!guard.access.canManageConfig) {
    return adminJsonError("ADMIN_FORBIDDEN", "Role aktif tidak dapat mengelola appearance.", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return adminJsonError("INVALID_JSON", "Payload tidak valid.", 400);
  }

  const parsed = patchBodySchema.safeParse(body);
  if (!parsed.success) {
    return adminJsonError("INVALID_BODY", "Data appearance tidak valid.", 400);
  }

  const result = await saveDraftSetting(
    SITE_SETTING_KEYS.appearance,
    parsed.data.data,
    parsed.data.expectedDraftVersion ?? null,
    administratorActor(guard.access),
  );

  if (!result.ok) {
    return adminJsonError(result.code, result.code === "VERSION_CONFLICT" ? "Draft sudah berubah oleh pihak lain." : "Penyimpanan gagal.", result.code === "VERSION_CONFLICT" ? 409 : 500);
  }

  return Response.json(
    { success: true, data: { draftVersion: result.draftVersion } },
    { headers: { "Cache-Control": "no-store" } },
  );
}