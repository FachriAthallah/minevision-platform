"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, Menu, X } from "lucide-react";

import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function PublicHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === href : pathname.startsWith(`${href}/`) || pathname === href;

  return (
    <header className="fixed inset-x-0 top-0 z-50 pt-4 text-foreground sm:pt-5">
      <Container className="max-w-[1368px]">
        <div className="relative rounded-2xl border border-white/10 bg-[#071426]/88 shadow-[0_16px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <div className="flex min-h-[68px] items-center justify-between gap-4 px-4 sm:px-5 lg:px-6">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan"
              aria-label="MineVision Home"
              onClick={() => setIsMenuOpen(false)}
            >
              <Image
                src="/images/brand/minevision-mark-white.png"
                alt=""
                width={34}
                height={34}
                className="h-8 w-8 object-contain sm:h-9 sm:w-9"
              />
              <Image
                src="/images/brand/minevision-wordmark-white.png"
                alt="MineVision"
                width={712}
                height={150}
                style={{ height: "auto" }}
                className="h-auto w-[112px] object-contain sm:w-32"
              />
            </Link>

            <nav aria-label="Main navigation" className="hidden lg:block">
              <ul className="flex items-center gap-5 xl:gap-7">
                {siteConfig.mainNavigation.map((item) => {
                  const active = isActive(item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative block py-6 text-sm font-medium transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan",
                          active ? "text-white" : "text-nav-muted",
                        )}
                      >
                        {item.label}
                        {active ? (
                          <span
                            aria-hidden="true"
                            className="brand-gradient absolute inset-x-0 bottom-[13px] h-0.5 rounded-full shadow-[0_0_12px_rgba(0,177,196,0.6)]"
                          />
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="flex items-center gap-2">
              <Link
                href="/admin/login"
                className="hidden items-center gap-2 rounded-full border border-brand-cyan/70 bg-brand-cyan/5 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-cyan hover:text-background focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan sm:inline-flex"
              >
                <LogIn aria-hidden="true" className="h-4 w-4" />
                Login
              </Link>

              <button
                type="button"
                aria-expanded={isMenuOpen}
                aria-controls="mobile-navigation"
                aria-label={isMenuOpen ? "Tutup navigasi" : "Buka navigasi"}
                onClick={() => setIsMenuOpen((open) => !open)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-nav-muted transition-colors hover:border-brand-cyan/50 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan lg:hidden"
              >
                {isMenuOpen ? (
                  <X aria-hidden="true" className="h-5 w-5" />
                ) : (
                  <Menu aria-hidden="true" className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {isMenuOpen ? (
            <nav
              id="mobile-navigation"
              aria-label="Mobile navigation"
              className="border-t border-white/10 px-4 py-4 lg:hidden"
            >
              <ul className="grid gap-1 sm:grid-cols-2">
                {siteConfig.mainNavigation.map((item) => {
                  const active = isActive(item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                          "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors hover:bg-white/5 hover:text-white",
                          active ? "bg-white/5 text-white" : "text-nav-muted",
                        )}
                      >
                        {item.label}
                        {active ? (
                          <span aria-hidden="true" className="brand-gradient h-2 w-2 rounded-full" />
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <Link
                href="/admin/login"
                onClick={() => setIsMenuOpen(false)}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-brand-cyan/70 bg-brand-cyan/5 px-5 py-3 text-sm font-semibold text-white sm:hidden"
              >
                <LogIn aria-hidden="true" className="h-4 w-4" />
                Login
              </Link>
            </nav>
          ) : null}
        </div>
      </Container>
    </header>
  );
}
