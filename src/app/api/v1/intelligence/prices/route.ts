import type { NextRequest } from "next/server";

import { domesticPriceQuerySchema } from "@/features/intelligence/schemas/domestic-price-query";
import { getPublicDomesticPrices } from "@/features/intelligence/server/get-public-domestic-prices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const validationResult = domesticPriceQuerySchema.safeParse({
    commodity: searchParams.get("commodity") ?? undefined,

    standard: searchParams.get("standard") ?? undefined,

    fromDate: searchParams.get("fromDate") ?? undefined,

    toDate: searchParams.get("toDate") ?? undefined,

    period: searchParams.get("period") ?? undefined,
  });

  if (!validationResult.success) {
    return Response.json(
      {
        success: false,
        error: {
          code: "INVALID_QUERY",
          message: "Parameter harga domestik tidak valid.",
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
    const prices = await getPublicDomesticPrices(validationResult.data);

    return Response.json(
      {
        success: true,
        data: prices,
        meta: {
          count: prices.length,
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
    console.error("Failed to get public domestic prices:", error);

    return Response.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Data harga domestik belum dapat dimuat.",
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
