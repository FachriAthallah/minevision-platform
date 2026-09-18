import type { NextRequest } from "next/server";

import { requireAdminApi, adminJsonError } from "@/features/admin/lib/api-guard";
import {
  getDailySeries,
  getOverviewKpis,
  getTopPages,
  getTopTrafficSources,
  getAudienceMetrics,
  getEngagementMetrics,
} from "@/features/admin/lib/analytics-queries";
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

  const [kpis, series, topPages, trafficSources, audience, engagement, error] = await (async () => {
    try {
      const [k, s, t, tr, a, e] = await Promise.all([
        getOverviewKpis(range),
        getDailySeries(range),
        getTopPages(range),
        getTopTrafficSources(range),
        getAudienceMetrics(range),
        getEngagementMetrics(range),
      ]);
      return [k, s, t, tr, a, e, null] as const;
    } catch (caught) {
      console.error("Admin overview failed.", caught instanceof Error ? caught.message : String(caught));
      return [null, null, null, null, null, null, true] as const;
    }
  })();

  if (error || !kpis || !series || !topPages || !trafficSources || !audience || !engagement) {
    return adminJsonError("INTERNAL_SERVER_ERROR", "Overview belum dapat dimuat.", 500);
  }

  return Response.json(
    {
      success: true,
      data: {
        range: { from: range.from.toISOString(), to: range.to.toISOString() },
        kpis,
        series,
        topPages,
        trafficSources,
        audience,
        engagement,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}