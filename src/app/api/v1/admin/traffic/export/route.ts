import type { NextRequest } from "next/server";

import { requireAdminApi, adminJsonError } from "@/features/admin/lib/api-guard";
import { getOverviewKpis, getTopPages } from "@/features/admin/lib/analytics-queries";
import { parseRangeFromSearchParams } from "@/features/admin/lib/range";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const guard = await requireAdminApi();
  if (!guard.ok) return guard.response;
  if (!guard.access.canViewAnalytics) {
    return adminJsonError("ADMIN_FORBIDDEN", "Role aktif tidak dapat mengekspor data.", 403);
  }

  const range = parseRangeFromSearchParams(request.nextUrl.searchParams);

  try {
    const [kpis, topPages] = await Promise.all([
      getOverviewKpis(range),
      getTopPages(range, 500),
    ]);

    const lines = [
      ["type", "Halaman", "Visitors", "Pageviews"],
      ["overview", "Total", String(kpis.totalVisitors), String(kpis.pageviews)],
      ...topPages.map((row) => ["page", row.path, String(row.visitors), String(row.pageviews)]),
    ];

    const csv = lines.map((line) => line.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\r\n");

    return new Response(`\uFEFF${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="minevision-traffic.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (caught) {
    console.error("Admin traffic export failed.", caught instanceof Error ? caught.message : String(caught));
    return adminJsonError("INTERNAL_SERVER_ERROR", "Ekspor belum dapat dibuat.", 500);
  }
}