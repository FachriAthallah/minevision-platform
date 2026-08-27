import type { Metadata } from "next";
import Link from "next/link";
import { Database, FileCheck2, LogOut } from "lucide-react";

import { Container } from "@/components/ui/container";
import { signOut } from "@/features/auth/actions";
import { getAuthenticatedIdentity } from "@/features/auth/lib/session";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Private Admin Dashboard MineVision.",
};

export default async function AdminPage() {
  const identity = await getAuthenticatedIdentity();

  return (
    <main className="min-h-screen bg-[#020817] py-10">
      <Container>
        <header className="flex flex-col gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand-cyan">
              Private Workspace
            </p>
            <h1 className="mt-2 text-3xl font-bold text-white">
              MineVision Admin
            </h1>
            <p className="mt-2 text-sm text-[#9FACBA]">{identity?.email}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 px-5 text-sm font-bold text-white transition-colors hover:border-brand-cyan"
            >
              Lihat Website
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 px-5 text-sm font-bold text-white transition-colors hover:border-brand-cyan"
              >
                <LogOut aria-hidden="true" className="h-4 w-4" />
                Logout
              </button>
            </form>
          </div>
        </header>

        <section className="grid gap-5 py-9 md:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-[#071426] p-6">
            <Database aria-hidden="true" className="h-6 w-6 text-brand-cyan" />
            <h2 className="mt-5 font-sans text-lg font-bold text-white">
              Data Management
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#9FACBA]">
              Modul CRUD dataset akan ditambahkan pada tahap Admin Dashboard.
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-[#071426] p-6">
            <FileCheck2
              aria-hidden="true"
              className="h-6 w-6 text-brand-teal"
            />
            <h2 className="mt-5 font-sans text-lg font-bold text-white">
              Verification Workflow
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#9FACBA]">
              Alur verifikasi dan publikasi tetap dipisahkan dari autentikasi.
            </p>
          </article>
        </section>
      </Container>
    </main>
  );
}
