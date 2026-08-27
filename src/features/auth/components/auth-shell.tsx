import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type AuthShellProps = {
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020817] px-5 py-10 sm:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(40,103,228,0.08),transparent_35%,rgba(60,195,171,0.05))]"
      />

      <section className="relative w-full max-w-[520px] rounded-[28px] border border-white/10 bg-[#071426]/95 px-6 py-7 shadow-[0_24px_80px_rgba(0,0,0,0.38)] sm:px-10 sm:py-9">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm font-bold text-[#B8C3D1] transition-[border-color,color,background-color] hover:border-brand-cyan/45 hover:bg-white/[0.03] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Kembali
          </Link>

          <Link
            href="/"
            aria-label="MineVision Home"
            className="inline-flex items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan"
          >
            <Image
              src="/images/brand/minevision-mark-white.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
            <Image
              src="/images/brand/minevision-wordmark-white.png"
              alt="MineVision"
              width={712}
              height={150}
              className="h-auto w-[118px] object-contain sm:w-[132px]"
            />
          </Link>
        </div>

        <header className="mt-9 text-center">
          <h1 className="font-serif text-2xl font-bold tracking-[-0.02em] text-white sm:text-[28px]">
            {title}
          </h1>
          <div className="mt-2 text-sm text-[#9FACBA]">{subtitle}</div>
        </header>

        <div className="mt-8">{children}</div>
      </section>
    </main>
  );
}
