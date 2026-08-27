import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { CreateAccountForm } from "@/features/auth/components/create-account-form";
import { GoogleAuthButton } from "@/features/auth/components/google-auth-button";
import {
  getAuthenticatedIdentity,
  getPostLoginPath,
} from "@/features/auth/lib/session";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Buat akun pengguna MineVision.",
};

export default async function CreateAccountPage() {
  const identity = await getAuthenticatedIdentity();

  if (identity) {
    redirect(getPostLoginPath(identity));
  }

  return (
    <AuthShell
      title="Create account"
      subtitle={
        <p>
          Already have an account?{" "}
          <Link
            href="/login"
            className="brand-gradient bg-clip-text font-bold text-transparent transition-[filter] hover:brightness-125"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <CreateAccountForm />

      <div className="my-6 flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#718096]">
          or
        </span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <GoogleAuthButton />

      <p className="mt-6 text-center text-xs leading-5 text-[#718096]">
        Pendaftaran publik selalu membuat akun pengguna biasa dan tidak
        memberikan akses administrator.
      </p>
    </AuthShell>
  );
}
