import { NextResponse } from "next/server";

import {
  getAuthenticatedIdentity,
  getPostLoginPath,
} from "@/features/auth/lib/session";
import { getSafeInternalPath } from "@/features/auth/lib/validation";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedPath = getSafeInternalPath(
    requestUrl.searchParams.get("next"),
  );

  if (!code || requestUrl.searchParams.has("error")) {
    return NextResponse.redirect(
      new URL("/login?error=google-unavailable", requestUrl.origin),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/login?error=google-unavailable", requestUrl.origin),
    );
  }

  const identity = await getAuthenticatedIdentity();

  if (!identity) {
    await supabase.auth.signOut();

    return NextResponse.redirect(
      new URL("/login?error=google-unavailable", requestUrl.origin),
    );
  }

  return NextResponse.redirect(
    new URL(getPostLoginPath(identity, requestedPath), requestUrl.origin),
  );
}
