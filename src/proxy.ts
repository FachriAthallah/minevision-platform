import type { NextRequest } from "next/server";

import { updateSupabaseSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSupabaseSession(request);
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
