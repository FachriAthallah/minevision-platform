import type { NextRequest } from "next/server";

import { commodityListQuerySchema } from "@/features/commodity/schemas/commodity-query";
import { getPublicCommodities } from "@/features/commodity/server/get-public-commodities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const validationResult = commodityListQuerySchema.safeParse({
    search: searchParams.get("search") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    intelligenceTracked: searchParams.get("intelligenceTracked") ?? undefined,
  });

  if (!validationResult.success) {
    return Response.json(
      {
        success: false,
        error: {
          code: "INVALID_QUERY",
          message: "Parameter daftar komoditas tidak valid.",
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
    const commodityList = await getPublicCommodities(validationResult.data);

    return Response.json(
      {
        success: true,
        data: commodityList,
        meta: {
          count: commodityList.length,
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
    console.error("Failed to get public commodities:", error);

    return Response.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Daftar komoditas belum dapat dimuat.",
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
