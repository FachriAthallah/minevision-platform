import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Briefcase,
  Building2,
  Diamond,
  Factory,
  GraduationCap,
  PieChart,
  Users,
} from "lucide-react";

const statistics = [
  {
    icon: Boxes,
    value: "7",
    label: "Komoditas Intelligence",
    note: "Data dan analisis mendalam",
  },
  {
    icon: Diamond,
    value: "23",
    label: "Komoditas Dibahas",
    note: "Mencakup komoditas utama",
  },
  {
    icon: Building2,
    value: "10",
    label: "Perusahaan Tambang",
    note: "Profil perusahaan terkemuka",
  },
  {
    icon: Users,
    value: "13",
    label: "Kategori Karier",
    note: "Jalur karier di industri mining",
  },
] as const;

const modules = [
  {
    icon: GraduationCap,
    title: "Edukasi",
    description:
      "Materi pembelajaran, artikel, dan pengetahuan dasar hingga lanjutan.",
    href: "/education",
  },
  {
    icon: Factory,
    title: "Industri",
    description:
      "Informasi perusahaan, proyek, teknologi, dan tren industri pertambangan.",
    href: "/industry",
  },
  {
    icon: Diamond,
    title: "Komoditas",
    description:
      "Profil komoditas, karakteristik, penggunaan, dan rantai pasoknya.",
    href: "/commodities",
  },
  {
    icon: Briefcase,
    title: "Karier",
    description:
      "Jelajahi peluang karier, skill penting, dan perkembangan profesi mining.",
    href: "/career",
  },
  {
    icon: BarChart3,
    title: "Intelligence",
    description:
      "Dashboard data, analisis komoditas, harga produksi, dan insight pasar.",
    href: "/intelligence",
  },
  {
    icon: PieChart,
    title: "Ekonomi",
    description:
      "Analisis PDB, ekspor, investasi, dan peran ekonomi sektor pertambangan.",
    href: "/economy",
  },
] as const;

export function OverviewSection() {
  return (
    <section
      id="explore"
      aria-labelledby="overview-heading"
      className="mx-auto max-w-[1320px] scroll-mt-24 px-6 py-24"
    >
      <div className="text-center">
        <h2
          id="overview-heading"
          className="text-3xl font-bold text-foreground sm:text-4xl"
        >
          Indonesia Mining at a Glance
        </h2>

        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Data ringkas untuk memahami potensi dan kekuatan sektor pertambangan
          Indonesia.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statistics.map((statistic) => {
          const Icon = statistic.icon;

          return (
            <article
              key={statistic.label}
              className="flex items-center gap-5 rounded-2xl border border-border bg-surface/70 p-6 shadow-sm backdrop-blur transition-colors hover:border-accent/40"
            >
              <Icon
                aria-hidden="true"
                className="h-10 w-10 shrink-0 text-primary"
                strokeWidth={1.5}
              />

              <div>
                <p className="text-3xl font-bold text-accent">
                  {statistic.value}
                </p>

                <h3 className="mt-1 text-sm font-semibold leading-snug text-foreground">
                  {statistic.label}
                </h3>

                <p className="mt-1.5 text-xs text-muted-foreground">
                  {statistic.note}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-24 text-center">
        <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
          Explore MineVision
        </h2>

        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Jelajahi berbagai modul dan fitur untuk mendukung keputusan yang lebih
          baik.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.title}
              className="group relative flex overflow-hidden rounded-2xl border border-brand-cyan/20 bg-[linear-gradient(135deg,rgba(40,103,228,0.19)_0%,rgba(0,177,196,0.12)_50%,rgba(60,195,171,0.15)_100%)] p-7 shadow-[0_18px_46px_rgba(0,0,0,0.18)] backdrop-blur transition-all hover:-translate-y-1 hover:border-brand-cyan/50 hover:shadow-[0_22px_55px_rgba(0,177,196,0.12)]"
            >
              <span className="mr-5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-background/35">
                <Icon
                  aria-hidden="true"
                  className="h-7 w-7 text-brand-cyan transition-colors group-hover:text-brand-teal"
                  strokeWidth={1.5}
                />
              </span>

              <div className="flex min-w-0 flex-1 flex-col">
                <h3 className="text-lg font-bold text-foreground">
                  {item.title}
                </h3>

                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>

                <Link
                  href={item.href}
                  className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium text-accent transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                >
                  Jelajahi
                  <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
