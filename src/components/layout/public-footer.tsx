import Link from "next/link";
import { Container } from "@/components/ui/container";

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-background text-muted-foreground">
      <Container className="flex flex-col gap-4 py-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold text-foreground">MineVision</p>
          <p className="mt-1 text-sm">
            MineVision Intelligence Platform Indonesia
          </p>
        </div>

        <nav aria-label="Footer navigation">
          <ul className="flex flex-wrap gap-5 text-sm">
            <li>
              <Link href="/about" className="hover:text-foreground">
                About
              </Link>
            </li>

            <li>
              <Link href="/search" className="hover:text-foreground">
                Search
              </Link>
            </li>

            <li>
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
            </li>
          </ul>
        </nav>

        <p className="text-sm">© {new Date().getFullYear()} MineVision</p>
      </Container>
    </footer>
  );
}
