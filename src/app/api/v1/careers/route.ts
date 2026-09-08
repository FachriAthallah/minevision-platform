import type { NextRequest } from "next/server";
import { careerListQuerySchema } from "@/features/career/schemas/career-query";
import { getPublicCareers } from "@/features/career/server/public-career-queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const input = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = careerListQuerySchema.safeParse(input);
  if (!parsed.success || request.nextUrl.searchParams.getAll("q").length > 1) {
    return Response.json({ success: false, error: { code: "INVALID_QUERY", message: "Parameter pencarian karier tidak valid.", details: parsed.success ? undefined : parsed.error.flatten().fieldErrors } }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const result = await getPublicCareers(parsed.data);
    return Response.json({ success: true, data: result.categories, meta: { ...result.counts, filters: parsed.data } }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Kategori karier belum dapat dimuat. Silakan coba kembali." } }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
