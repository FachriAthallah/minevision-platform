import type { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { requireAdminApi, adminJsonError } from "@/features/admin/lib/api-guard";
import { administratorActor } from "@/features/admin/lib/admin-actor";
import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { recordAdminActivity } from "@/features/admin/lib/activity-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  displayName: z.string().trim().max(120),
  avatarUrl: z.string().max(300).optional(),
});

export async function GET() {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  const identity = guard.access.identity;

  return Response.json(
    {
      success: true,
      data: {
        email: identity.email,
        username: identity.username,
        displayName: identity.displayName,
        avatarUrl: identity.avatarUrl,
        roleKeys: guard.access.roleKeys,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return adminJsonError("INVALID_JSON", "Payload tidak valid.", 400);
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return adminJsonError("INVALID_BODY", "Data profil tidak valid.", 400);
  }

  try {
    const rows = await db
      .update(userProfiles)
      .set({
        displayName: parsed.data.displayName,
        ...(parsed.data.avatarUrl !== undefined ? { avatarUrl: parsed.data.avatarUrl } : {}),
      })
      .where(eq(userProfiles.userId, guard.access.identity.id))
      .returning();

    await recordAdminActivity({
      actor: administratorActor(guard.access),
      action: "profile_updated",
      resourceType: "user_profile",
      resourceId: guard.access.identity.id,
      afterSummary: { fields: ["displayName", ...(parsed.data.avatarUrl !== undefined ? ["avatarUrl"] : [])] },
    });

    return Response.json(
      { success: true, data: { profile: rows[0] ?? null } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (caught) {
    console.error("Admin profile update failed.", caught instanceof Error ? caught.message : String(caught));
    return adminJsonError("INTERNAL_SERVER_ERROR", "Profil belum dapat diubah.", 500);
  }
}