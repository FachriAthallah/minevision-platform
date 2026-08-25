import type { NextRequest } from "next/server";

import { smelterQuerySchema } from "@/features/intelligence/schemas/smelter-query";
import { getPublicSmelters } from "@/features/intelligence/server/get-public-smelters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const validationResult = smelterQuerySchema.safeParse({
    commodity: searchParams.get("commodity") ?? undefined,
    province: searchParams.get("province") ?? undefined,
    operator: searchParams.get("operator") ?? undefined,
    facilityType: searchParams.get("facilityType") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  });

  if (!validationResult.success) {
    return Response.json(
      {
        success: false,
        error: {
          code: "INVALID_QUERY",
          message: "Parameter fasilitas smelter tidak valid.",
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
    const facilities = await getPublicSmelters(validationResult.data);

    return Response.json(
      {
        success: true,
        data: facilities,
        meta: {
          count: facilities.length,
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
    console.error("Failed to get public smelter facilities:", error);

    return Response.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Data fasilitas smelter belum dapat dimuat.",
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
