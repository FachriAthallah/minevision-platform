import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

const footerGroups = [
  {
    title: "Platform",
    links: [
      { label: "Home", href: "/" },
      { label: "Education", href: "/education" },
      { label: "Industry", href: "/industry" },
      { label: "Career", href: "/career" },
      { label: "Intelligence", href: "/intelligence" },
      { label: "Economy", href: "/economy" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "Komoditas", href: "/intelligence" },
      { label: "Perusahaan", href: "/industry" },
      { label: "Proyek Tambang", href: "/education" },
      { label: "Artikel & Insight", href: "/economy" },
      { label: "Mining Data", href: "/economy" },
    ],
  },
  {
    title: "Resource",
    links: [
      { label: "Tentang Kami", href: "/about" },
      { label: "FAQ", href: "/faq" },
      { label: "Kebijakan Privasi", href: "/privacy" },
      { label: "Syarat & Ketentuan", href: "/terms" },
      { label: "Kontak", href: "/contact" },
    ],
  },
  {
    title: "Data Source",
    links: [
      { label: "Kementerian ESDM", href: "/search?source=esdm" },
      { label: "BPS", href: "/search?source=bps" },
      { label: "Ditjen Minerba", href: "/search?source=minerba" },
      { label: "Official Sources", href: "/search?source=official" },
    ],
  },
] as const;

const footerSectionId = (title: string) =>
  `footer-${title.toLowerCase().replaceAll(" ", "-")}`;

export function PublicFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#030a18] text-nav-muted">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(40,103,228,0.12),transparent_30%),radial-gradient(circle_at_88%_15%,rgba(60,195,171,0.08),transparent_28%)]"
      />

      <Container className="relative max-w-[1320px] py-14 sm:py-16">
        <div className="grid gap-12 border-b border-white/10 pb-12 lg:grid-cols-[1.35fr_2.65fr]">
          <div className="max-w-sm">
            <Link
              href="/"
              aria-label="MineVision Home"
              className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan"
            >
              <Image
                src="/images/brand/minevision-mark-white.png"
                alt=""
                width={54}
                height={54}
                className="h-12 w-12 object-contain"
              />
              <Image
                src="/images/brand/minevision-wordmark-white.png"
                alt="MineVision"
                width={712}
                height={150}
                style={{ height: "auto" }}
                className="h-auto w-[164px] object-contain"
              />
            </Link>

            <p className="mt-6 text-sm leading-7">
              Platform intelligence pertambangan Indonesia untuk edukasi,
              industri, komoditas, karier, data, dan ekonomi.
            </p>
          </div>

          <nav aria-label="Footer navigation">
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
              {footerGroups.map((group) => (
                <section
                  key={group.title}
                  aria-labelledby={footerSectionId(group.title)}
                >
                  <h2
                    id={footerSectionId(group.title)}
                    className="font-sans text-sm font-bold text-white"
                  >
                    {group.title}
                  </h2>

                  <ul className="mt-5 space-y-3.5 text-sm">
                    {group.links.map((item) => (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          className="transition-colors hover:text-brand-cyan focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </nav>
        </div>

        <div className="flex flex-col gap-3 pt-7 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {siteConfig.fullName}.
          </p>
          <p>Informasi disajikan bersama sumber dan status publikasinya.</p>
        </div>
      </Container>
    </footer>
  );
}
