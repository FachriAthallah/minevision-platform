import type { NextRequest } from "next/server";
import { careerSlugSchema } from "@/features/career/schemas/career-query";
import { getPublicCareerBySlug } from "@/features/career/server/public-career-queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const parsed = careerSlugSchema.safeParse((await params).slug);
  if (!parsed.success) return Response.json({ success: false, error: { code: "INVALID_CAREER_SLUG", message: "Slug kategori karier tidak valid." } }, { status: 400, headers: { "Cache-Control": "no-store" } });
  try {
    const result = await getPublicCareerBySlug(parsed.data);
    if (!result) return Response.json({ success: false, error: { code: "CAREER_NOT_FOUND", message: "Kategori karier tidak ditemukan." } }, { status: 404, headers: { "Cache-Control": "no-store" } });
    return Response.json({ success: true, data: result }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Detail karier belum dapat dimuat. Silakan coba kembali." } }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
