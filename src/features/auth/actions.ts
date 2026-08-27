"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

import type { AuthFormState } from "./form-state";
import { getPasswordLoginErrorMessage } from "./lib/error-message";
import {
  createAccountSchema,
  getSafeInternalPath,
  loginSchema,
} from "./lib/validation";
import { getAuthenticatedIdentity, getPostLoginPath } from "./lib/session";

export async function signInWithPassword(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali informasi login Anda.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      status: "error",
      message: getPasswordLoginErrorMessage(error),
    };
  }

  const identity = await getAuthenticatedIdentity();

  if (!identity) {
    await supabase.auth.signOut();

    return {
      status: "error",
      message: "Sesi login tidak dapat diverifikasi. Silakan coba kembali.",
    };
  }

  redirect(getPostLoginPath(identity, parsed.data.next));
}

export async function createAccount(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = createAccountSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    repeatPassword: formData.get("repeatPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Periksa kembali informasi akun Anda.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const existingUsername = await db
    .select({ userId: userProfiles.userId })
    .from(userProfiles)
    .where(eq(userProfiles.username, parsed.data.username))
    .limit(1);

  if (existingUsername.length > 0) {
    return {
      status: "error",
      fieldErrors: {
        username: ["Username sudah digunakan."],
      },
    };
  }

  const supabase = await createClient();
  const callbackUrl = new URL("/auth/callback", env.NEXT_PUBLIC_APP_URL);
  callbackUrl.searchParams.set("next", "/account");

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: callbackUrl.toString(),
      data: {
        username: parsed.data.username,
        display_name: parsed.data.username,
      },
    },
  });

  if (error) {
    return {
      status: "error",
      message:
        "Akun belum dapat dibuat. Periksa kembali data Anda atau coba beberapa saat lagi.",
    };
  }

  if (data.session) {
    redirect("/account");
  }

  return {
    status: "success",
    message:
      "Akun berhasil didaftarkan. Periksa email Anda untuk mengonfirmasi akun sebelum login.",
  };
}

export async function signInWithGoogle(formData: FormData) {
  const requestedPath = getSafeInternalPath(formData.get("next"));
  const callbackUrl = new URL("/auth/callback", env.NEXT_PUBLIC_APP_URL);

  if (requestedPath) {
    callbackUrl.searchParams.set("next", requestedPath);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error || !data.url) {
    redirect("/login?error=google-unavailable");
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
