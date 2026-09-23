import type { NextRequest } from "next/server";

import { ingestWebVital } from "@/features/admin/lib/analytics";
import { hashIpForRateLimit, isRateLimited } from "@/features/admin/lib/rate-limit";
import { adminWebVitalSchema } from "@/features/admin/schemas/admin-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-client-ip") ??
    "unknown"
  );
}

function resolveCountryCode(request: NextRequest): string | undefined {
  const raw =
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry");
  return raw && /^[A-Z]{2}$/.test(raw) ? raw : undefined;
}

function isSameSite(request: NextRequest): boolean {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "same-origin" || secFetchSite === "none") {
    return true;
  }
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) {
    return false;
  }
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const ipKey = hashIpForRateLimit(getClientIp(request));
  if (isRateLimited(ipKey, 60)) {
    return Response.json(
      { success: false, error: { code: "RATE_LIMITED", message: "Terlalu banyak permintaan." } },
      { status: 429, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!isSameSite(request)) {
    return Response.json(
      { success: false, error: { code: "INVALID_ORIGIN", message: "Permintaan analytics ditolak." } },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: { code: "INVALID_JSON", message: "Payload tidak valid." } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const parsed = adminWebVitalSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { success: false, error: { code: "INVALID_VITAL", message: "Vital tidak valid." } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const countryCode = resolveCountryCode(request);
    const input = countryCode
      ? { ...parsed.data, country_code: countryCode }
      : parsed.data;
    const result = await ingestWebVital(input);
    if (!result.ok) {
      return Response.json(
        { success: false, error: { code: result.code, message: "Vital ditolak." } },
        { status: 422, headers: { "Cache-Control": "no-store" } },
      );
    }
    return Response.json(
      { success: true },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Analytics vitals ingestion failed.", error instanceof Error ? error.message : String(error));
    return Response.json(
      { success: false, error: { code: "INTERNAL_SERVER_ERROR", message: "Vitals belum dapat disimpan." } },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}