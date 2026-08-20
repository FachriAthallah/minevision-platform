import Link from "next/link";

import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-background text-muted-foreground">
      <Container className="flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-bold text-foreground">{siteConfig.name}</p>

          <p className="mt-1 text-sm">{siteConfig.fullName}</p>
        </div>

        <nav aria-label="Footer navigation">
          <ul className="flex flex-wrap gap-5 text-sm">
            {siteConfig.footerNavigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="text-sm">
          © {new Date().getFullYear()} {siteConfig.name}
        </p>
      </Container>
    </footer>
  );
}
