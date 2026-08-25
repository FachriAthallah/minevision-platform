import type { NextRequest } from "next/server";

import { investmentQuerySchema } from "@/features/economy/schemas/investment-query";
import { getPublicInvestment } from "@/features/economy/server/get-public-investment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const validationResult = investmentQuerySchema.safeParse({
    region: searchParams.get("region") ?? undefined,
    origin: searchParams.get("origin") ?? undefined,
    fromYear: searchParams.get("fromYear") ?? undefined,
    toYear: searchParams.get("toYear") ?? undefined,
  });

  if (!validationResult.success) {
    return Response.json(
      {
        success: false,
        error: {
          code: "INVALID_QUERY",
          message: "Parameter investasi pertambangan tidak valid.",
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
    const investment = await getPublicInvestment(validationResult.data);

    return Response.json(
      {
        success: true,
        data: investment,
        meta: {
          count: investment.length,
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
    console.error("Failed to get public mining investment:", error);

    return Response.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Data investasi pertambangan belum dapat dimuat.",
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
