import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Search,
} from "lucide-react";

const popularSearches = [
  {
    label: "Nikel",
    href: "/search?q=Nikel",
  },
  {
    label: "Freeport",
    href: "/search?q=Freeport",
  },
  {
    label: "Mining Engineer",
    href: "/search?q=Mining%20Engineer",
  },
  {
    label: "Batubara",
    href: "/search?q=Batubara",
  },
  {
    label: "K3",
    href: "/search?q=K3",
  },
] as const;

export function SearchResourcesSection() {
  return (
    <section
      id="search"
      aria-labelledby="search-heading"
      className="mx-auto max-w-[1320px] scroll-mt-24 px-6 py-20"
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2
            id="search-heading"
            className="text-3xl font-bold text-foreground sm:text-4xl"
          >
            Find What You Need
          </h2>

          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Cari informasi komoditas, data, perusahaan, artikel, dan topik
            pertambangan lainnya dengan cepat.
          </p>

          <form
            action="/search"
            method="get"
            role="search"
            className="mt-8 flex items-center gap-3 rounded-full border border-border bg-surface/70 py-2 pr-2 pl-5"
          >
            <Search
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-muted-foreground"
            />

            <label htmlFor="home-global-search" className="sr-only">
              Cari informasi di MineVision
            </label>

            <input
              id="home-global-search"
              name="q"
              type="search"
              required
              autoComplete="off"
              placeholder="Cari di MineVision..."
              className="min-w-0 flex-1 bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />

            <button
              type="submit"
              aria-label="Cari di MineVision"
              className="brand-gradient flex h-10 w-12 shrink-0 items-center justify-center rounded-full text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Search aria-hidden="true" className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Pencarian populer:
            </span>

            {popularSearches.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <article className="flex flex-wrap items-center gap-8 rounded-2xl border border-border bg-surface/70 p-8 shadow-sm backdrop-blur md:flex-nowrap">
          <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-accent/50 bg-surface-elevated shadow-[var(--shadow-float)]">
            <Bot
              aria-hidden="true"
              className="h-11 w-11 text-accent"
              strokeWidth={1.5}
            />
          </span>

          <div>
            <h3 className="text-2xl font-bold leading-snug text-foreground">
              Tanyakan Apa Saja tentang Pertambangan
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              MineBot AI akan membantu pengguna menemukan jawaban dari knowledge
              base MineVision yang sudah tervalidasi.
            </p>

            <button
              type="button"
              disabled
              aria-disabled="true"
              title="MineBot AI akan tersedia setelah knowledge base terhubung"
              className="brand-gradient mt-6 inline-flex cursor-not-allowed items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-primary-foreground opacity-60"
            >
              Ask MineBot AI
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>

            <p className="mt-2 text-xs text-muted-foreground">
              Segera tersedia setelah integrasi knowledge base.
            </p>
          </div>
        </article>
      </div>

    </section>
  );
}
