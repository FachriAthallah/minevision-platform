import type { NextRequest } from "next/server";

import { updateSupabaseSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const response = await updateSupabaseSession(request);

  if (request.nextUrl.pathname.startsWith("/admin")) {
    response.headers.set("x-pathname", request.nextUrl.pathname);
  }

  return response;
}

export const config = {
  matcher: [
    "/login",
    "/create-account",
    "/account/:path*",
    "/admin/:path*",
    "/auth/:path*",
  ],
};