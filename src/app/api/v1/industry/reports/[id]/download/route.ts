import type { NextRequest } from "next/server";

import { industryReportIdSchema } from "@/features/industry/schemas/industry-query";
import { getPublicIndustryReportDownload } from "@/features/industry/server/get-public-industry-report-download";
import { getStorageAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INDUSTRY_REPORT_BUCKET = "industry-reports";
const SIGNED_URL_LIFETIME_SECONDS = 60;

type IndustryReportDownloadRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  { params }: IndustryReportDownloadRouteContext,
) {
  const validationResult = industryReportIdSchema.safeParse((await params).id);

  if (!validationResult.success) {
    return Response.json(
      {
        success: false,
        error: {
          code: "INVALID_REPORT_ID",
          message: "ID laporan tidak valid.",
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
    const report = await getPublicIndustryReportDownload(validationResult.data);

    if (!report) {
      return Response.json(
        {
          success: false,
          error: {
            code: "REPORT_NOT_FOUND",
            message: "Laporan tidak ditemukan.",
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

    const supabase = getStorageAdminClient();

    const { data, error } = await supabase.storage
      .from(INDUSTRY_REPORT_BUCKET)
      .createSignedUrl(report.storagePath, SIGNED_URL_LIFETIME_SECONDS, {
        download: report.fileName,
      });

    if (error) {
      throw error;
    }

    return new Response(null, {
      status: 307,
      headers: {
        Location: data.signedUrl,
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (error: unknown) {
    console.error("Failed to create Industry report signed URL:", error);

    return Response.json(
      {
        success: false,
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Laporan belum dapat diunduh.",
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
