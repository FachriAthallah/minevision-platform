import Link from "next/link";

const navigationItems = [
  { label: "Home", href: "/" },
  { label: "Education", href: "/education" },
  { label: "Industry", href: "/industry" },
  { label: "Commodities", href: "/commodities" },
  { label: "Career", href: "/career" },
  { label: "Intelligence", href: "/intelligence" },
  { label: "Economy", href: "/economy" },
] as const;

export function PublicHeader() {
  return (
    <header className="border-b border-white/10 bg-slate-950 text-white">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="text-xl font-semibold">
          MineVision
        </Link>

        <nav aria-label="Main navigation">
          <ul className="hidden items-center gap-6 lg:flex">
            {navigationItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-slate-300 transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link
          href="/admin/login"
          className="rounded-full border border-cyan-500 px-5 py-2 text-sm font-medium transition-colors hover:bg-cyan-500 hover:text-slate-950"
        >
          Admin
        </Link>
      </div>
    </header>
  );
}
