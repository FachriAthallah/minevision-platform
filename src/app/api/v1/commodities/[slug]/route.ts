import type { NextRequest } from "next/server";

import { commoditySlugSchema } from "@/features/commodity/schemas/commodity-query";
import { getPublicCommodityBySlug } from "@/features/commodity/server/get-public-commodity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CommodityDetailRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  { params }: CommodityDetailRouteContext,
) {
  const validationResult = commoditySlugSchema.safeParse((await params).slug);

  if (!validationResult.success) {
    return Response.json(
      {
        success: false,
        error: {
          code: "INVALID_COMMODITY_SLUG",
          message: "Slug komoditas tidak valid.",
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
    const commodity = await getPublicCommodityBySlug(validationResult.data);

    if (!commodity) {
      return Response.json(
        {
          success: false,
          error: {
            code: "COMMODITY_NOT_FOUND",
            message: "Komoditas tidak ditemukan.",
          },
        },
        {
          status: 404,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    return Response.json(
      {
        success: true,
        data: commodity,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error: unknown) {
    console.error("Failed to get public commodity:", error);

    return Response.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Detail komoditas belum dapat dimuat.",
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
