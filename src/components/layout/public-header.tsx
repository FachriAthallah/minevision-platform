"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, LogOut, Menu, UserRound, X } from "lucide-react";

import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";
import { signOut } from "@/features/auth/actions";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export function PublicHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getClaims().then(({ data }) => {
      setIsAuthenticated(Boolean(data?.claims?.sub));
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsAuthenticated(Boolean(session?.user));
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 pt-4 sm:pt-5">
      <Container className="max-w-[1368px]">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#071426]/88 shadow-[0_16px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl">
          <div className="flex min-h-[68px] items-center justify-between gap-4 px-4 sm:px-5 lg:px-6">
            {/* Logo */}
            <Link
              href="/"
              aria-label="MineVision Home"
              onClick={() => setIsMenuOpen(false)}
              className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan"
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

            {/* Desktop navigation */}
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
                          "relative block py-6 text-sm transition-colors duration-200 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan",
                          active
                            ? "font-semibold text-white"
                            : "font-medium text-[#9FACBA]",
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

            {/* Login and mobile menu */}
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <div className="hidden items-center gap-2 sm:flex">
                  <Link
                    href="/account"
                    className="inline-flex items-center gap-2 rounded-full border border-brand-cyan/70 bg-brand-cyan/5 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-cyan hover:text-background focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan"
                  >
                    <UserRound aria-hidden="true" className="h-4 w-4" />
                    Account
                  </Link>
                  <form action={signOut}>
                    <button
                      type="submit"
                      aria-label="Logout"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-[#9FACBA] transition-colors duration-200 hover:border-brand-cyan/50 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan"
                    >
                      <LogOut aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="hidden items-center gap-2 rounded-full border border-brand-cyan/70 bg-brand-cyan/5 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-cyan hover:text-background focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan sm:inline-flex"
                >
                  <LogIn aria-hidden="true" className="h-4 w-4" />
                  Login
                </Link>
              )}

              <button
                type="button"
                aria-expanded={isMenuOpen}
                aria-controls="mobile-navigation"
                aria-label={isMenuOpen ? "Tutup navigasi" : "Buka navigasi"}
                onClick={() => setIsMenuOpen((open) => !open)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-[#9FACBA] transition-colors duration-200 hover:border-brand-cyan/50 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan lg:hidden"
              >
                {isMenuOpen ? (
                  <X aria-hidden="true" className="h-5 w-5" />
                ) : (
                  <Menu aria-hidden="true" className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile navigation */}
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
                          "relative flex items-center rounded-xl px-4 py-3 text-sm transition-colors duration-200 hover:bg-white/5 hover:text-white",
                          active
                            ? "bg-white/5 font-semibold text-white"
                            : "font-medium text-[#9FACBA]",
                        )}
                      >
                        {item.label}

                        {active ? (
                          <span
                            aria-hidden="true"
                            className="brand-gradient absolute inset-x-4 bottom-1 h-0.5 rounded-full"
                          />
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {isAuthenticated ? (
                <div className="mt-3 grid gap-2 sm:hidden">
                  <Link
                    href="/account"
                    onClick={() => setIsMenuOpen(false)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-brand-cyan/70 bg-brand-cyan/5 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-cyan hover:text-background"
                  >
                    <UserRound aria-hidden="true" className="h-4 w-4" />
                    Account
                  </Link>
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-[#9FACBA] transition-colors hover:border-brand-cyan/50 hover:text-white"
                    >
                      <LogOut aria-hidden="true" className="h-4 w-4" />
                      Logout
                    </button>
                  </form>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-brand-cyan/70 bg-brand-cyan/5 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-cyan hover:text-background sm:hidden"
                >
                  <LogIn aria-hidden="true" className="h-4 w-4" />
                  Login
                </Link>
              )}
            </nav>
          ) : null}
        </div>
      </Container>
    </header>
  );
}
