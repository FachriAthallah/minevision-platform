import type { NextRequest } from "next/server";

import { productionQuerySchema } from "@/features/intelligence/schemas/production-query";
import { getPublicProduction } from "@/features/intelligence/server/get-public-production";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const validationResult = productionQuerySchema.safeParse({
    commodity: searchParams.get("commodity") ?? undefined,

    fromYear: searchParams.get("fromYear") ?? undefined,

    toYear: searchParams.get("toYear") ?? undefined,
  });

  if (!validationResult.success) {
    return Response.json(
      {
        success: false,
        error: {
          code: "INVALID_QUERY",
          message: "Parameter Intelligence tidak valid.",
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
    const production = await getPublicProduction(validationResult.data);

    return Response.json(
      {
        success: true,
        data: production,
        meta: {
          count: production.length,
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
    console.error("Failed to get public Intelligence production:", error);

    return Response.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Data produksi belum dapat dimuat.",
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
