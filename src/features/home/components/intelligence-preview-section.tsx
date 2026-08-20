import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Globe,
  Info,
} from "lucide-react";

import { ProductionPreviewChart } from "./intelligence-preview-chart";

const coverage = [
  {
    label: "Periode",
    value: "2019–2025",
    icon: CalendarDays,
  },
  {
    label: "Wilayah",
    value: "Indonesia",
    icon: Globe,
  },
] as const;

type DomesticPriceReference = {
  commodity: string;
  standard: string;
  unit: string;
  value: number | null;
};

const domesticPriceReferences: DomesticPriceReference[] = [
  {
    commodity: "Batubara",
    standard: "Harga Batubara Acuan (HBA)",
    unit: "USD/ton",
    value: null,
  },
  {
    commodity: "Nikel",
    standard: "Harga Patokan Mineral (HPM)",
    unit: "USD/dmt",
    value: null,
  },
  {
    commodity: "Emas",
    standard: "Harga emas domestik",
    unit: "Rp/gram",
    value: null,
  },
  {
    commodity: "Tembaga",
    standard: "Harga Mineral Acuan (HMA)",
    unit: "USD/dmt",
    value: null,
  },
];

const commodities = [
  {
    name: "Nikel",
    image: "/images/commodities/nikel.jpg",
    description:
      "Baterai • Stainless steel • Permintaan global tinggi",
  },
  {
    name: "Batubara",
    image: "/images/commodities/batubara.jpg",
    description:
      "Energi • Industri • Sumber energi utama",
  },
  {
    name: "Emas",
    image: "/images/commodities/emas.jpg",
    description:
      "Investasi • Perhiasan • Nilai lindung tinggi",
  },
  {
    name: "Tembaga",
    image: "/images/commodities/tembaga.jpg",
    description:
      "Elektrifikasi • Konstruksi • Konduktivitas unggul",
  },
] as const;

type ChartPanelProps = {
  title: string;
  unit: string;
  source: string;
  children: ReactNode;
};

function ChartPanel({
  title,
  unit,
  source,
  children,
}: ChartPanelProps) {
  return (
    <article className="rounded-2xl border border-border bg-surface/70 p-6 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <h3 className="flex flex-wrap items-center gap-2 text-lg font-bold text-foreground">
          {title}

          <span className="font-sans text-sm font-normal text-muted-foreground">
            {unit}
          </span>

          <Info
            aria-hidden="true"
            className="h-4 w-4 text-muted-foreground"
          />
        </h3>

        <Link
          href="/intelligence"
          className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Lihat detail
        </Link>
      </div>

      <div className="mt-6 h-[270px]">{children}</div>

      <p className="mt-4 text-xs text-muted-foreground">
        {source}
      </p>
    </article>
  );
}

function DomesticPricePanel() {
  return (
    <article className="rounded-2xl border border-border bg-surface/70 p-6 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
            Harga Domestik Komoditas

            <Info
              aria-hidden="true"
              className="h-4 w-4 text-muted-foreground"
            />
          </h3>

          <p className="mt-1 text-xs text-muted-foreground">
            Standar harga berbeda untuk setiap komoditas
          </p>
        </div>

        <Link
          href="/intelligence"
          className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Lihat detail
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {domesticPriceReferences.map((item) => (
          <div
            key={item.commodity}
            className="rounded-xl border border-border bg-background/40 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-semibold text-foreground">
                  {item.commodity}
                </h4>

                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {item.standard}
                </p>
              </div>

              <span className="shrink-0 rounded-md border border-border px-2 py-1 text-[10px] text-accent">
                {item.unit}
              </span>
            </div>

            <p className="mt-4 text-sm font-semibold text-foreground">
              {item.value === null
                ? "Belum dihubungkan"
                : `${item.value.toLocaleString("id-ID")} ${item.unit}`}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Nilai akan ditampilkan setelah dataset harga domestik tervalidasi
        dihubungkan.
      </p>
    </article>
  );
}

export function IntelligencePreviewSection() {
  return (
    <section
      id="intelligence"
      aria-labelledby="intelligence-heading"
      className="mx-auto max-w-[1320px] scroll-mt-24 px-6 py-24"
    >
      <div className="grid gap-6 lg:grid-cols-[320px_1fr_1fr]">
        <div>
          <span className="inline-block rounded-md border border-border px-3 py-1 text-[11px] font-semibold tracking-widest text-accent">
            INTELLIGENCE
          </span>

          <h2
            id="intelligence-heading"
            className="mt-5 text-3xl font-bold leading-tight text-foreground sm:text-4xl"
          >
            Mining Intelligence
          </h2>

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Ringkasan visual data produksi dan harga domestik komoditas
            untuk membantu memahami perkembangan sektor pertambangan
            Indonesia.
          </p>

          <div className="mt-8 space-y-4">
            {coverage.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-border bg-surface/70 p-4"
                >
                  <p className="text-xs text-muted-foreground">
                    {item.label}
                  </p>

                  <div className="mt-2 flex items-center gap-2 text-sm text-foreground">
                    <Icon
                      aria-hidden="true"
                      className="h-4 w-4 text-accent"
                    />

                    {item.value}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <ChartPanel
          title="Tren Produksi"
          unit="(preview)"
          source="Data demonstrasi antarmuka — akan diganti dengan dataset produksi tervalidasi."
        >
          <ProductionPreviewChart />
        </ChartPanel>

        <DomesticPricePanel />
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-surface/70 p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-foreground">
              Komoditas Unggulan
            </h3>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Jelajahi komoditas strategis yang mendorong pertumbuhan
              sektor pertambangan Indonesia.
            </p>
          </div>

          <Link
            href="/commodities"
            className="inline-flex items-center gap-2 text-sm font-medium text-accent transition-colors hover:text-primary"
          >
            Lihat semua komoditas

            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4"
            />
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {commodities.map((commodity) => (
            <article
              key={commodity.name}
              className="overflow-hidden rounded-2xl border border-border bg-background/40"
            >
              <Image
                src={commodity.image}
                alt={`Komoditas ${commodity.name}`}
                width={640}
                height={512}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="h-32 w-full object-cover"
              />

              <div className="p-5">
                <h4 className="text-lg font-bold text-foreground">
                  {commodity.name}
                </h4>

                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {commodity.description}
                </p>

                <Link
                  href="/commodities"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-primary"
                >
                  Pelajari lebih lanjut

                  <ArrowRight
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                  />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}