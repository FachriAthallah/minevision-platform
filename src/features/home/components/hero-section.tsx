import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section
      id="home"
      className="relative min-h-[760px] overflow-hidden"
    >
      <Image
        src="/images/home/hero-mine.jpg"
        alt="Tambang terbuka Indonesia saat senja"
        fill
        preload
        sizes="100vw"
        className="object-cover"
      />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--background)_0%,transparent_35%,color-mix(in_oklab,var(--background)_85%,transparent)_78%,var(--background)_100%)]" />

      <div className="relative mx-auto flex min-h-[760px] max-w-[900px] flex-col items-center justify-center px-6 pt-[88px] text-center">
        <span className="inline-flex items-center gap-2.5 rounded-full border border-brand-cyan/25 bg-surface/75 px-4 py-1.5 text-sm text-nav-muted shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur">
          <span className="brand-gradient h-2 w-2 rounded-full shadow-[0_0_10px_rgba(0,177,196,0.85)]" />
          Sektor Pertambangan Indonesia
        </span>

        <h1 className="mt-8 text-4xl font-bold leading-[1.15] text-foreground sm:text-5xl md:text-[56px]">
          Jelajahi Dunia Pertambangan Indonesia dalam Satu Platform
        </h1>

        <p className="mt-6 max-w-[620px] text-base leading-relaxed text-muted-foreground">
          Platform intelligence komprehensif untuk edukasi, industri, komoditas,
          karier, data intelligence, dan ekonomi sektor pertambangan Indonesia.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="#explore"
            className="brand-gradient inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-float)] transition-opacity hover:opacity-90"
          >
            Jelajahi MineVision
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>

          <Link
            href="/intelligence"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-7 py-3.5 text-sm font-semibold text-foreground backdrop-blur transition-colors hover:bg-surface"
          >
            Lihat Intelligence
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
