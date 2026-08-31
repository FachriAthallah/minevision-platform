import type { NextRequest } from "next/server";

import { industryOperationSiteQuerySchema } from "@/features/industry/schemas/industry-query";
import { getPublicIndustryOperationSites } from "@/features/industry/server/get-public-industry-operation-sites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const validationResult = industryOperationSiteQuerySchema.safeParse({
    companySlug: request.nextUrl.searchParams.get("companySlug") ?? undefined,
  });

  if (!validationResult.success) {
    return Response.json(
      {
        success: false,
        error: {
          code: "INVALID_QUERY",
          message: "Parameter wilayah operasi tidak valid.",
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
    const operationSites = await getPublicIndustryOperationSites(
      validationResult.data,
    );

    return Response.json(
      {
        success: true,
        data: operationSites,
        meta: {
          count: operationSites.length,
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
    console.error("Failed to get public Industry operation sites:", error);

    return Response.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Wilayah operasi belum dapat dimuat.",
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
