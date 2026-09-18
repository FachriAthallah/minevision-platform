import type { NextRequest } from "next/server";

import { requireAdminApi, adminJsonError } from "@/features/admin/lib/api-guard";
import { adminEventQuerySchema } from "@/features/admin/schemas/admin-validation";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { adminActivityLogs } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!guard.access.canViewActivityLog) {
    return adminJsonError("ADMIN_FORBIDDEN", "Role aktif tidak dapat melihat activity log.", 403);
  }

  const parsed = adminEventQuerySchema.safeParse({
    from: request.nextUrl.searchParams.get("from") ?? undefined,
    to: request.nextUrl.searchParams.get("to") ?? undefined,
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    offset: request.nextUrl.searchParams.get("offset") ?? undefined,
    action: request.nextUrl.searchParams.get("action") ?? undefined,
    resource_type: request.nextUrl.searchParams.get("resource_type") ?? undefined,
    status: request.nextUrl.searchParams.get("status") ?? undefined,
    actor_id: request.nextUrl.searchParams.get("actor_id") ?? undefined,
  });

  if (!parsed.success) {
    return adminJsonError("INVALID_QUERY", "Parameter activity log tidak valid.", 400);
  }

  const filters = [];
  if (parsed.data.from) filters.push(gte(adminActivityLogs.createdAt, new Date(parsed.data.from)));
  if (parsed.data.to) filters.push(lte(adminActivityLogs.createdAt, new Date(parsed.data.to)));
  if (parsed.data.action) filters.push(eq(adminActivityLogs.action, parsed.data.action));
  if (parsed.data.resource_type) filters.push(eq(adminActivityLogs.resourceType, parsed.data.resource_type));
  if (parsed.data.status) filters.push(eq(adminActivityLogs.result, parsed.data.status === "success" ? "success" : "failure"));
  if (parsed.data.actor_id) filters.push(sql`${adminActivityLogs.actorId}::text = ${parsed.data.actor_id}`);

  try {
    const rows = await db
      .select()
      .from(adminActivityLogs)
      .where(and(...filters))
      .orderBy(desc(adminActivityLogs.createdAt))
      .limit(parsed.data.limit)
      .offset(parsed.data.offset);

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(adminActivityLogs)
      .where(and(...filters));

    return Response.json(
      { success: true, data: { rows, pagination: { limit: parsed.data.limit, offset: parsed.data.offset, total: total[0]?.count ?? 0 } } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (caught) {
    console.error("Admin activity log failed.", caught instanceof Error ? caught.message : String(caught));
    return adminJsonError("INTERNAL_SERVER_ERROR", "Activity log belum dapat dimuat.", 500);
  }
}