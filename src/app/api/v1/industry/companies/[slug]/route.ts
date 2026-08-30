import type { NextRequest } from "next/server";

import { industryCompanySlugSchema } from "@/features/industry/schemas/industry-query";
import { getPublicIndustryCompanyBySlug } from "@/features/industry/server/get-public-industry-company";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IndustryCompanyRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  { params }: IndustryCompanyRouteContext,
) {
  const validationResult = industryCompanySlugSchema.safeParse(
    (await params).slug,
  );

  if (!validationResult.success) {
    return Response.json(
      {
        success: false,
        error: {
          code: "INVALID_COMPANY_SLUG",
          message: "Slug perusahaan tidak valid.",
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
    const company = await getPublicIndustryCompanyBySlug(validationResult.data);

    if (!company) {
      return Response.json(
        {
          success: false,
          error: {
            code: "COMPANY_NOT_FOUND",
            message: "Perusahaan tidak ditemukan.",
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
        data: company,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error: unknown) {
    console.error("Failed to get public Industry company:", error);

    return Response.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Detail perusahaan belum dapat dimuat.",
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
