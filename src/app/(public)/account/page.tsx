import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LogOut, ShieldCheck, UserRound } from "lucide-react";

import { Container } from "@/components/ui/container";
import { signOut } from "@/features/auth/actions";
import { getAuthenticatedIdentity } from "@/features/auth/lib/session";

export const metadata: Metadata = {
  title: "Account",
  description: "Informasi akun MineVision.",
};

export default async function AccountPage() {
  const identity = await getAuthenticatedIdentity();

  if (!identity) {
    redirect("/login?next=/account");
  }

  const accountName =
    identity.displayName ?? identity.username ?? identity.email ?? "MineVision User";

  return (
    <section className="min-h-[78vh] bg-[#020817] pb-20 pt-36 sm:pt-40">
      <Container className="max-w-4xl">
        <div className="rounded-[28px] border border-white/10 bg-[#071426] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-9">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              {identity.avatarUrl ? (
                <Image
                  src={identity.avatarUrl}
                  alt="Foto profil"
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-full border border-white/10 object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan">
                  <UserRound aria-hidden="true" className="h-7 w-7" />
                </div>
              )}

              <div className="min-w-0">
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand-cyan">
                  MineVision Account
                </p>
                <h1 className="mt-1 truncate text-2xl font-bold text-white">
                  {accountName}
                </h1>
                <p className="mt-1 truncate text-sm text-[#9FACBA]">
                  {identity.email}
                </p>
              </div>
            </div>

            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 px-5 text-sm font-bold text-white transition-colors hover:border-brand-cyan hover:bg-brand-cyan/10"
              >
                <LogOut aria-hidden="true" className="h-4 w-4" />
                Logout
              </button>
            </form>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-[#061020] p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-brand-teal"
              />
              <div>
                <h2 className="font-sans text-base font-bold text-white">
                  Akun pengguna aktif
                </h2>
                <p className="mt-1 text-sm leading-6 text-[#9FACBA]">
                  Akun ini dapat digunakan untuk fitur personal MineVision yang
                  akan dikembangkan, tanpa membatasi akses ke halaman publik.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
