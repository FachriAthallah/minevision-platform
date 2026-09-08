import { BriefcaseBusiness, GraduationCap, Layers3, Users } from "lucide-react";
import { Container } from "@/components/ui/container";
import { formatCareerCount } from "../lib/career-view";
import type { CareerAggregateCounts } from "../types/career";

export function CareerHero({ counts }: { counts: CareerAggregateCounts }) {
  const stats = [
    { label: "Kategori Karier", value: counts.totalCategories, icon: Layers3, description: "Temukan bidang yang dekat dengan minat dan latar belakangmu." },
    { label: "Profesi", value: counts.totalProfessions, icon: Users, description: "Kenali ragam peran, dari lapangan hingga pengelolaan bisnis tambang." },
    { label: "Kompetensi", value: counts.sectionTotals.competency, icon: BriefcaseBusiness, description: "Pelajari kemampuan yang digunakan dalam tiap bidang pekerjaan." },
    { label: "Pelatihan", value: counts.sectionTotals.training, icon: GraduationCap, description: "Cari bekal belajar yang relevan untuk langkah karier berikutnya." },
  ];
  return <section className="relative isolate overflow-hidden border-b border-white/10 pb-14 pt-32 sm:pb-20 sm:pt-36">
    <div aria-hidden="true" className="absolute inset-0 -z-20 bg-surface bg-[url('/images/career/bg_career.jpg')] bg-cover bg-center" />
    <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--background)_0%,rgba(3,15,33,0.94)_43%,rgba(3,15,33,0.7)_68%,var(--background)_100%)]" />
    <Container className="max-w-[1320px]">
      <div className="max-w-3xl">
        <p className="flex items-center gap-2 text-sm font-semibold text-brand-cyan"><BriefcaseBusiness className="size-4" aria-hidden="true" />Career</p>
        <h1 className="mt-5 text-4xl leading-tight sm:text-5xl lg:text-6xl">Temukan Jalur Kariermu di Industri Pertambangan</h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">Jelajahi berbagai bidang profesi pertambangan, pahami ruang lingkup pekerjaan, serta kenali kompetensi, pendidikan, software, dan pelatihan yang dibutuhkan untuk membangun karier di industri ini.</p>
      </div>
      <dl className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
        {stats.map(({ label, value, icon: Icon, description }) => <div key={label} className="flex flex-col rounded-2xl border border-white/10 bg-surface/90 p-4 shadow-xl shadow-black/20 sm:p-6">
          <dt className="flex items-center gap-2 text-sm font-bold"><Icon className="size-5 shrink-0 text-brand-cyan" aria-hidden="true" />{label}</dt>
          <dd className="mt-3"><span className="block text-2xl font-bold sm:text-3xl">{formatCareerCount(value)}</span><span className="mt-3 block text-xs leading-6 text-muted-foreground sm:text-sm">{description}</span></dd>
        </div>)}
      </dl>
    </Container>
  </section>;
}
