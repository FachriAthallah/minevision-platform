import type { NextRequest } from "next/server";

import { exportQuerySchema } from "@/features/economy/schemas/export-query";
import { getPublicExports } from "@/features/economy/server/get-public-exports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const validationResult = exportQuerySchema.safeParse({
    commodity: searchParams.get("commodity") ?? undefined,
    origin: searchParams.get("origin") ?? undefined,
    destination: searchParams.get("destination") ?? undefined,
    availability: searchParams.get("availability") ?? undefined,
    coverage: searchParams.get("coverage") ?? undefined,
    fromYear: searchParams.get("fromYear") ?? undefined,
    toYear: searchParams.get("toYear") ?? undefined,
  });

  if (!validationResult.success) {
    return Response.json(
      {
        success: false,
        error: {
          code: "INVALID_QUERY",
          message: "Parameter ekspor minerba tidak valid.",
          details: validationResult.error.flatten().fieldErrors,
        },
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  try {
    const exportRecords = await getPublicExports(validationResult.data);

    return Response.json(
      {
        success: true,
        data: exportRecords,
        meta: {
          count: exportRecords.length,
          filters: validationResult.data,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error: unknown) {
    console.error("Failed to get public minerba exports:", error);

    return Response.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Data ekspor minerba belum dapat dimuat.",
        },
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
