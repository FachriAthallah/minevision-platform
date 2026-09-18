import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireAdminApi, adminJsonError } from "@/features/admin/lib/api-guard";
import { administratorActor } from "@/features/admin/lib/admin-actor";
import { publishSetting, SITE_SETTING_KEYS } from "@/features/admin/lib/site-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const publishBodySchema = z.object({
  expectedDraftVersion: z.number().int().min(0).optional(),
});

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!guard.access.canManageConfig) {
    return adminJsonError("ADMIN_FORBIDDEN", "Role aktif tidak dapat mempublikasi appearance.", 403);
  }

  let body: unknown = {};
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    // fallthrough
  }

  const parsed = publishBodySchema.safeParse(body);
  if (!parsed.success) {
    return adminJsonError("INVALID_BODY", "Body tidak valid.", 400);
  }

  const result = await publishSetting(
    SITE_SETTING_KEYS.appearance,
    parsed.data.expectedDraftVersion ?? null,
    administratorActor(guard.access),
  );

  if (!result.ok) {
    return adminJsonError(result.code, result.code === "VERSION_CONFLICT" ? "Draft sudah berubah." : "Publikasi gagal.", result.code === "VERSION_CONFLICT" ? 409 : 500);
  }

  return Response.json(
    { success: true, data: { publishedVersion: result.publishedVersion } },
    { headers: { "Cache-Control": "no-store" } },
  );
}