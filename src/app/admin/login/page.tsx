import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";
import {
  getAuthenticatedIdentity,
  getPostLoginPath,
} from "@/features/auth/lib/session";

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Login ke Admin Dashboard MineVision.",
};

export default async function AdminLoginPage() {
  const identity = await getAuthenticatedIdentity();

  if (identity) {
    redirect(getPostLoginPath(identity, "/admin"));
  }

  return (
    <AuthShell
      title="Admin Access"
      subtitle={
        <p>
          Masuk untuk membuka <span className="font-semibold text-white">Admin Dashboard</span>.
        </p>
      }
    >
      <LoginForm next="/admin" />

      <div className="mt-6 flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#718096]">
          authorized access
        </span>
        <span className="h-px flex-1 bg-white/10" />
      </div>
    </AuthShell>
  );
}