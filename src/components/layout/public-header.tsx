import Link from "next/link";

import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

export function PublicHeader() {
  return (
    <header className="border-b border-border bg-background text-foreground">
      <Container className="flex min-h-20 items-center justify-between">
        <Link
          href="/"
          className="text-xl font-bold"
          aria-label="MineVision Home"
        >
          {siteConfig.name}
        </Link>

        <nav aria-label="Main navigation">
          <ul className="hidden items-center gap-6 lg:flex">
            {siteConfig.mainNavigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href="/admin/login"
          className="rounded-full border border-brand-cyan px-5 py-2 text-sm font-bold transition-colors hover:bg-brand-cyan hover:text-background"
        >
          Admin
        </Link>
      </Container>
    </header>
  );
}
