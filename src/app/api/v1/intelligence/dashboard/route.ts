import type { NextRequest } from "next/server";

import { intelligenceDashboardQuerySchema } from "@/features/intelligence/schemas/dashboard-query";
import { getPublicIntelligenceDashboard } from "@/features/intelligence/server/get-public-intelligence-dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const validation = intelligenceDashboardQuerySchema.safeParse({
    commodity: request.nextUrl.searchParams.get("commodity") ?? undefined,
  });

  if (!validation.success) {
    return Response.json(
      {
        success: false,
        error: {
          code: "INVALID_QUERY",
          message: "Parameter dashboard Intelligence tidak valid.",
          details: validation.error.flatten().fieldErrors,
        },
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const dashboard = await getPublicIntelligenceDashboard(validation.data);
    return Response.json(
      { success: true, data: dashboard },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch {
    console.error("Failed to get public Intelligence dashboard.");
    return Response.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Dashboard Intelligence belum dapat dimuat.",
        },
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
