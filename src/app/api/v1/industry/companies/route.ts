import type { NextRequest } from "next/server";

import { industryCompanyQuerySchema } from "@/features/industry/schemas/industry-query";
import { getPublicIndustryCompanies } from "@/features/industry/server/get-public-industry-companies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const validationResult = industryCompanyQuerySchema.safeParse({
    search: searchParams.get("search") ?? undefined,
    reportYear: searchParams.get("reportYear") ?? undefined,
    reportType: searchParams.get("reportType") ?? undefined,
  });

  if (!validationResult.success) {
    return Response.json(
      {
        success: false,
        error: {
          code: "INVALID_QUERY",
          message: "Parameter daftar perusahaan tidak valid.",
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
    const companies = await getPublicIndustryCompanies(validationResult.data);

    return Response.json(
      {
        success: true,
        data: companies,
        meta: {
          count: companies.length,
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
    console.error("Failed to get public Industry companies:", error);

    return Response.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Daftar perusahaan belum dapat dimuat.",
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
