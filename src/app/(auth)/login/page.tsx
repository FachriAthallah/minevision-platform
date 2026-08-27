import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { GoogleAuthButton } from "@/features/auth/components/google-auth-button";
import { LoginForm } from "@/features/auth/components/login-form";
import {
  getAuthenticatedIdentity,
  getPostLoginPath,
} from "@/features/auth/lib/session";
import { getSafeInternalPath } from "@/features/auth/lib/validation";

export const metadata: Metadata = {
  title: "Login",
  description: "Masuk ke akun MineVision atau akses Admin Dashboard.",
};

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [params, identity] = await Promise.all([
    searchParams,
    getAuthenticatedIdentity(),
  ]);

  if (identity) {
    redirect(getPostLoginPath(identity, params.next));
  }

  const next = getSafeInternalPath(params.next) ?? undefined;
  const googleUnavailable = params.error === "google-unavailable";

  return (
    <AuthShell
      title="Sign in"
      subtitle={
        <p>
          or{" "}
          <Link
            href="/create-account"
            className="brand-gradient bg-clip-text font-bold text-transparent transition-[filter] hover:brightness-125"
          >
            create an account
          </Link>
        </p>
      }
    >
      {googleUnavailable ? (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-warning/25 bg-warning/10 px-4 py-3 text-sm leading-6 text-amber-100"
        >
          Login Google belum tersedia. Gunakan email dan password untuk saat
          ini.
        </p>
      ) : null}

      <LoginForm next={next} />

      <div className="my-6 flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#718096]">
          or
        </span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <GoogleAuthButton next={next} />

      <p className="mt-6 text-center text-xs leading-5 text-[#718096]">
        Akun administrator menggunakan form yang sama dan hanya dapat dibuat
        melalui proses internal MineVision.
      </p>
    </AuthShell>
  );
}
