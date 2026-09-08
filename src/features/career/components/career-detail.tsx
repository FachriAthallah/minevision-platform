import Link from "next/link";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, ExternalLink, ShieldCheck, Target, GraduationCap, Users } from "lucide-react";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { careerSections, formatCareerCount } from "../lib/career-view";
import type { CareerDetail as CareerDetailData } from "../types/career";
import { CareerProfessions } from "./career-professions";
import { CareerSectionNavigation } from "./career-section-navigation";
import { CareerCta } from "./career-cta";
import { careerIcons } from "./career-icons";
import { cn } from "@/lib/utils";
import { careerMaterialGroups } from "../lib/career-material";
import { CareerMaterialSection } from "./career-material-section";
import { CareerSectionHeading } from "./career-section-heading";
import { CareerMinebotCard } from "./career-minebot-card";

export function CareerDetail({ career }: { career: CareerDetailData }) {
  const { category, profile, counts, navigation } = career;
  const Icon = careerIcons[category.slug] ?? BriefcaseBusiness;
  const intro = profile.body.split(/\r?\n\s*\r?\n/).filter(Boolean);
  const professionStart = intro.findIndex((text) => text.replace(/^#+\s*/, "").trim() === "Contoh Profesi");
  const paragraphs = (professionStart >= 0 ? intro.slice(0, professionStart) : intro)
    .filter((text) => text.trim() !== "Deskripsi Kategori" && text.trim() !== category.description?.trim());
  return <Container className="max-w-[1320px] pb-20 pt-32 sm:pt-36">
    <header className="rounded-3xl border border-border bg-surface p-6 sm:p-9">
      <Link href="/career" className={cn(buttonVariants({ variant: "secondary" }), "mb-7 max-w-full whitespace-normal")}><ArrowLeft className="size-4 shrink-0" aria-hidden="true" />Kembali ke kategori karier</Link>
      <p className="flex items-center justify-center gap-2 text-sm font-semibold text-brand-cyan"><Icon className="size-5 shrink-0" aria-hidden="true" />Bidang Profesi Pertambangan</p>
      <h1 className="mx-auto mt-5 max-w-4xl text-center text-3xl leading-snug sm:text-4xl lg:text-5xl">{profile.title}</h1>
      {(profile.excerpt ?? category.description) && <p className="mx-auto mt-6 max-w-4xl text-pretty text-base leading-8 text-muted-foreground sm:text-justify sm:text-lg">{profile.excerpt ?? category.description}</p>}
      <dl className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">{[
        { label: "Profesi", value: counts.professions, icon: Users },
        { label: "Kompetensi", value: counts.competency, icon: Target },
        { label: "Pelatihan", value: counts.training, icon: GraduationCap },
        { label: "Referensi", value: counts.sources, icon: ShieldCheck },
      ].map(({ label, value, icon: StatIcon }) => <div key={label} className="rounded-xl border border-brand-cyan/20 bg-background/50 p-4 text-center sm:p-5"><dt className="flex items-center justify-center gap-2 text-xs text-muted-foreground"><StatIcon className="size-4 shrink-0 text-brand-cyan" aria-hidden="true" />{label}</dt><dd className="mt-3 text-2xl font-bold">{formatCareerCount(value)}</dd></div>)}</dl>
    </header>
    <div className="mt-8 grid items-start gap-7 lg:grid-cols-[250px_minmax(0,1fr)] xl:gap-9">
      <aside className="sticky top-24 z-20 min-w-0 space-y-4 lg:top-28"><CareerSectionNavigation /><div className="hidden lg:block"><CareerMinebotCard /></div></aside>
      <article className="min-w-0 space-y-7">
        {paragraphs.length > 0 && <Card className="p-6 sm:p-8"><CareerSectionHeading title="Mengenal Bidang Ini" section="overview" /><div className="mt-5 space-y-4 leading-8 text-muted-foreground">{paragraphs.map((text, index) => <p key={index}>{text.replace(/^#+\s*/, "")}</p>)}</div></Card>}
        <section id="professions" aria-labelledby="profession-title" className="scroll-mt-64 rounded-2xl border border-border bg-surface p-5 sm:p-8 lg:scroll-mt-32">
          <CareerSectionHeading id="profession-title" title="Daftar Profesi" section="professions" />
          <p className="mt-4 text-sm leading-7 text-muted-foreground">Buka kelompok untuk mengenali profesinya. Informasi kompetensi, pendidikan, software, dan pelatihan di halaman ini berlaku pada lingkup kategori; kebutuhan setiap jabatan dapat berbeda.</p>
          <CareerProfessions groups={career.professionGroups} />
        </section>
        {careerSections.map(({ key, label }) => <CareerMaterialSection key={key} section={key} title={label} groups={careerMaterialGroups(profile.body, key, career.sections[key])} />)}
        <section id="references" aria-labelledby="career-sources-title" className="scroll-mt-64 rounded-2xl border border-border bg-surface p-5 sm:p-8 lg:scroll-mt-32">
          <CareerSectionHeading id="career-sources-title" title="Sumber dan Informasi Resmi" section="references" />
          <ol className="mt-6 space-y-3">{career.sources.map((source, index) => <li key={`${source.displayOrder}:${index}`} className="flex min-w-0 gap-3 rounded-xl border border-border bg-background/40 p-4">
            <span className="pt-1 text-xs font-bold text-brand-cyan">{String(index + 1).padStart(2, "0")}</span>
            <div className="min-w-0 flex-1">
              {source.url ? <a href={source.url} target="_blank" rel="noopener noreferrer" className="break-words text-sm font-semibold leading-7 hover:text-brand-cyan focus-visible:outline-2 focus-visible:outline-brand-cyan">{source.name}<ExternalLink className="ml-2 inline size-3.5" aria-hidden="true" /><span className="sr-only"> (buka di tab baru)</span></a> : <p className="break-words text-sm font-semibold leading-7">{source.name}</p>}
              <p className="mt-1 break-words text-xs leading-6 text-muted-foreground">{source.organization}</p>
              {source.citationLabel && <p className="mt-1 text-sm leading-6 text-muted-foreground">{source.citationLabel}</p>}
              {source.pageReference && <p className="text-xs leading-6 text-muted-foreground">Halaman: {source.pageReference}</p>}
            </div>
          </li>)}</ol>
          {!career.sources.length && <p className="mt-4 text-muted-foreground">Referensi publik belum tersedia.</p>}
        </section>
        <nav aria-label="Kategori karier sebelumnya dan selanjutnya" className="grid gap-4 sm:grid-cols-2">
          {[{ item: navigation.previous, label: "Sebelumnya", icon: ArrowLeft }, { item: navigation.next, label: "Selanjutnya", icon: ArrowRight }].map(({ item, label, icon: Direction }) => item ? <Link key={label} href={`/career/${item.slug}`} className="rounded-2xl border border-border bg-surface p-5 hover:border-brand-cyan/40 focus-visible:outline-2 focus-visible:outline-brand-cyan"><span className="flex items-center gap-2 text-xs text-muted-foreground"><Direction className="size-4" aria-hidden="true" />{label}</span><span className="mt-2 block font-bold leading-7">{item.name}</span></Link> : <span key={label} />)}
        </nav>
        <CareerCta />
        <div className="lg:hidden"><CareerMinebotCard /></div>
      </article>
    </div>
  </Container>;
}
