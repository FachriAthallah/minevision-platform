import type { NextRequest } from "next/server";

import { gdpQuerySchema } from "@/features/economy/schemas/gdp-query";
import { getPublicGdp } from "@/features/economy/server/get-public-gdp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const validationResult = gdpQuerySchema.safeParse({
    region: searchParams.get("region") ?? undefined,

    priceBasis: searchParams.get("priceBasis") ?? undefined,

    fromYear: searchParams.get("fromYear") ?? undefined,

    toYear: searchParams.get("toYear") ?? undefined,
  });

  if (!validationResult.success) {
    return Response.json(
      {
        success: false,
        error: {
          code: "INVALID_QUERY",
          message: "Parameter data PDB tidak valid.",
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
    const gdpRecords = await getPublicGdp(validationResult.data);

    return Response.json(
      {
        success: true,
        data: gdpRecords,
        meta: {
          count: gdpRecords.length,
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
    console.error("Failed to get public economic GDP data:", error);

    return Response.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Data PDB belum dapat dimuat.",
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
