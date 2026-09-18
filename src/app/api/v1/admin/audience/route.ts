import type { NextRequest } from "next/server";

import { requireAdminApi, adminJsonError } from "@/features/admin/lib/api-guard";
import { getAudienceMetrics } from "@/features/admin/lib/analytics-queries";
import { parseRangeFromSearchParams } from "@/features/admin/lib/range";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!guard.access.canViewAnalytics) {
    return adminJsonError("ADMIN_FORBIDDEN", "Role aktif tidak dapat melihat analytics.", 403);
  }

  const range = parseRangeFromSearchParams(request.nextUrl.searchParams);

  try {
    const audience = await getAudienceMetrics(range);

    return Response.json(
      {
        success: true,
        data: {
          range: { from: range.from.toISOString(), to: range.to.toISOString() },
          audience,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (caught) {
    console.error("Admin audience failed.", caught instanceof Error ? caught.message : String(caught));
    return adminJsonError("INTERNAL_SERVER_ERROR", "Audience belum dapat dimuat.", 500);
  }
}