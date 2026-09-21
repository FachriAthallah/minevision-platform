"use client";

import { useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  Check,
  Clock3,
  ExternalLink,
  FileText,
  GraduationCap,
  HardHat,
  Layers3,
  LibraryBig,
  ListOrdered,
  Pickaxe,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/shared/reveal";
import {
  educationArticles,
  getAdjacentEducationArticles,
  type EducationArticle,
  type EducationItem,
  type EducationSection,
} from "@/features/education/content/education-content";
import { cn } from "@/lib/utils";
import { publicRoutes } from "@/config/site";
import { educationRelatedSlugs } from "@/config/entity-relations";

type EducationPageProps = {
  article: EducationArticle;
};

type EducationSelectHandler = (
  slug: string,
  options?: { scrollToMaterial?: boolean },
) => void;

const categoryIcons: Record<string, LucideIcon> = {
  "pengertian-pertambangan": BookOpen,
  "tahapan-kegiatan-pertambangan": ListOrdered,
  "metode-penambangan": Pickaxe,
  "alat-berat-tambang": Truck,
  "keselamatan-dan-kesehatan-kerja": HardHat,
  "istilah-pertambangan": Layers3,
};

const equipmentImages: Record<string, string> = {
  Excavator: "/images/education/equipment/excavator.png",
  Bulldozer: "/images/education/equipment/bulldozer.png",
  "Dump Truck": "/images/education/equipment/dump-truck.png",
  "Wheel Loader": "/images/education/equipment/wheel-loader.png",
  "Motor Grader": "/images/education/equipment/motor-grader.png",
  Scraper: "/images/education/equipment/scraper.png",
  "Drilling Rig": "/images/education/equipment/drilling-rig.png",
  Crusher: "/images/education/equipment/crusher.png",
  Conveyor: "/images/education/equipment/conveyor.png",
  Dragline: "/images/education/equipment/dragline.png",
  "Electric Rope Shovel": "/images/education/equipment/electric-shovel.png",
  Compactor: "/images/education/equipment/compactor.png",
};

const learningTrends = [
  {
    label: "Siklus tambang",
    caption: "Pahami alur kegiatan secara berurutan",
    slug: "tahapan-kegiatan-pertambangan",
  },
  {
    label: "Keselamatan operasi",
    caption: "Kenali bahaya dan pengendaliannya",
    slug: "keselamatan-dan-kesehatan-kerja",
  },
  {
    label: "Istilah teknis",
    caption: "Bangun fondasi kosakata pertambangan",
    slug: "istilah-pertambangan",
  },
] as const;

function EducationHero() {
  const stats = [
    {
      icon: BookOpen,
      value: "6",
      label: "Kategori Utama",
      description: "Materi pembelajaran terstruktur",
    },
    {
      icon: FileText,
      value: "110+",
      label: "Istilah Pertambangan",
      description: "Glosarium lintas kegiatan tambang",
    },
    {
      icon: ShieldCheck,
      value: "Materi Bersumber",
      label: "Referensi Terhubung",
      description: "Rujukan ditampilkan pada setiap artikel",
    },
  ];

  return (
    <section className="relative isolate overflow-hidden border-b border-white/10 pb-16 pt-32 sm:pb-20 sm:pt-36">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-[url('/images/education/education-hero-mine.png')] bg-cover bg-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,8,23,0.98)_0%,rgba(3,15,33,0.94)_43%,rgba(3,15,33,0.7)_68%,rgba(2,8,23,0.86)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_42%,rgba(0,177,196,0.13),transparent_32%)]"
      />

      <Container className="max-w-[1320px]">
        <div className="max-w-3xl">
          <Reveal direction="fade">
            <div className="flex items-center gap-2 text-sm font-semibold text-brand-cyan">
              <GraduationCap aria-hidden="true" className="h-4 w-4" />
              <span>Education</span>
            </div>

            <h1 className="mt-5 text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
              Edukasi Pertambangan
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-[#b7c3d1] sm:text-lg">
              Kembangkan pemahaman tentang dunia pertambangan melalui materi yang
              lengkap, terstruktur, dan mudah ditelusuri sumbernya.
            </p>
          </Reveal>

          <Reveal direction="up" delay={140}>
            <div className="mt-9 grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="min-h-36 rounded-2xl border border-white/10 bg-[#08172a]/82 p-5 shadow-[0_16px_45px_rgba(0,0,0,0.22)] backdrop-blur-sm"
                >
                  <div className="flex items-start gap-3">
                    <stat.icon
                      aria-hidden="true"
                      className="mt-0.5 h-5 w-5 shrink-0 text-brand-cyan"
                    />
                    <div>
                      <p className="text-lg font-bold leading-tight text-white">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {stat.label}
                      </p>
                      <p className="mt-1.5 text-xs leading-5 text-[#8fa0b4]">
                        {stat.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

function EducationSidebar({
  activeSlug,
  onSelect,
}: {
  activeSlug: string;
  onSelect: EducationSelectHandler;
}) {
  return (
    <aside aria-label="Navigasi materi Education" className="lg:self-stretch">
      <div className="space-y-4 lg:sticky lg:top-28">
        <Reveal direction="left">
          <section className="rounded-2xl border border-white/10 bg-[#08172a] p-4 shadow-[0_14px_38px_rgba(0,0,0,0.2)]">
            <h2 className="text-lg text-white">Kategori Edukasi</h2>

            <nav aria-label="Kategori Education" className="mt-3">
              <ul className="space-y-1">
                {educationArticles.map((article) => {
                  const Icon = categoryIcons[article.slug] ?? BookOpen;
                  const active = article.slug === activeSlug;

                  return (
                    <li key={article.slug}>
                      <button
                        type="button"
                        onClick={() => onSelect(article.slug)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "education-sidebar-category-link group flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan",
                          active
                            ? "border-brand-cyan/50 bg-[linear-gradient(110deg,rgba(40,103,228,0.2),rgba(0,177,196,0.2),rgba(60,195,171,0.17))]"
                            : "border-transparent hover:border-white/10 hover:bg-white/[0.035]",
                        )}
                      >
                        <Icon
                          aria-hidden="true"
                          className={cn(
                            "h-4 w-4 shrink-0",
                            active
                              ? "text-brand-cyan"
                              : "text-[#7f90a5] group-hover:text-brand-cyan",
                          )}
                        />
                        <span className="min-w-0">
                          <span
                            className={cn(
                              "block text-sm font-semibold leading-5",
                              active ? "text-white" : "text-[#c4ced9]",
                            )}
                          >
                            {article.shortTitle}
                          </span>
                          <span className="education-sidebar-category-label mt-0.5 block text-xs leading-4 text-[#8190a3]">
                            {article.categoryLabel}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </section>
        </Reveal>

        <Reveal direction="left" delay={70}>
          <section className="rounded-2xl border border-white/10 bg-[#08172a] p-4 shadow-[0_14px_38px_rgba(0,0,0,0.2)]">
            <div className="flex items-center gap-2">
              <Sparkles aria-hidden="true" className="h-4 w-4 text-brand-teal" />
              <h2 className="text-lg text-white">Tren Edukasi</h2>
            </div>
            <p className="education-sidebar-trend-intro mt-2 text-xs leading-5 text-[#8fa0b4]">
              Fokus pembelajaran yang direkomendasikan untuk membangun fondasi
              pengetahuan.
            </p>
            <ol className="mt-3 space-y-2.5">
              {learningTrends.map((trend, index) => {
                const article = educationArticles.find(
                  (item) => item.slug === trend.slug,
                );

                if (!article) {
                  return null;
                }

                return (
                  <li key={trend.slug}>
                    <button
                      type="button"
                      onClick={() => onSelect(trend.slug)}
                      className="education-sidebar-trend-link group flex w-full cursor-pointer items-center gap-3 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand-cyan/35 text-xs font-bold text-brand-cyan">
                        {index + 1}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-[#d9e1e9] transition-colors group-hover:text-brand-cyan">
                          {trend.label}
                        </span>
                        <span className="education-sidebar-trend-caption mt-0.5 block text-xs leading-4 text-[#7f90a5]">
                          {trend.caption}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        </Reveal>

        <Reveal direction="left" delay={140}>
          <section className="relative overflow-hidden rounded-2xl border border-brand-cyan/25 bg-[#08172a] p-4 shadow-[0_14px_38px_rgba(0,0,0,0.2)]">
            <div
              aria-hidden="true"
              className="absolute -right-14 -top-16 h-36 w-36 rounded-full bg-brand-cyan/10 blur-3xl"
            />
            <div className="relative flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-cyan/30 bg-brand-cyan/5">
                <Bot aria-hidden="true" className="h-5 w-5 text-brand-cyan" />
              </span>
              <div>
                <h2 className="text-lg leading-6 text-white">
                  Punya pertanyaan tentang materi Edukasi?
                </h2>
                <p className="education-sidebar-minebot-description mt-2 text-xs leading-5 text-[#8fa0b4]">
                  Pendamping materi berbasis pengetahuan MineVision akan
                  diaktifkan setelah knowledge base Education siap.
                </p>
              </div>
            </div>
            <Link
              href={publicRoutes.mineBot}
              className="relative mt-3 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-full border border-brand-cyan/25 bg-brand-cyan/5 px-4 text-xs font-semibold text-white hover:bg-brand-cyan/10"
            >
              Informasi MineBot
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          </section>
        </Reveal>
      </div>
    </aside>
  );
}

function EducationItemCard({
  item,
  showEquipmentImage = false,
  normalizeLayout = false,
}: {
  item: EducationItem;
  showEquipmentImage?: boolean;
  normalizeLayout?: boolean;
}) {
  const equipmentImage = equipmentImages[item.title];

  return (
    <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#071426]/72 p-5">
      <div>
        {showEquipmentImage ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(circle_at_50%_45%,rgba(0,177,196,0.1),rgba(3,12,27,0.88))] sm:h-28 sm:w-36">
              <Image
                src={
                  equipmentImage ?? "/images/education/equipment/excavator.png"
                }
                alt={`Gambar ${item.title}`}
                fill
                sizes="(min-width: 640px) 144px, 100vw"
                className="object-contain p-2"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-teal">
                Alat berat tambang
              </p>
              <h3 className="mt-1 font-sans text-lg font-bold text-white">
                {item.title}
              </h3>
              <p
                className={cn(
                  "mt-2 text-sm leading-6 text-[#a8b5c5]",
                  normalizeLayout && "min-h-[6rem]",
                )}
              >
                {item.description}
              </p>
            </div>
          </div>
        ) : (
          <>
            <h3 className="font-sans text-base font-bold text-white">
              {item.title}
            </h3>
            <p
              className={cn(
                "mt-2 text-sm leading-7 text-[#a8b5c5]",
                normalizeLayout && "min-h-[8.75rem] sm:min-h-[7rem]",
              )}
            >
              {item.description}
            </p>
          </>
        )}
      </div>

      {item.details?.length ? (
        <dl className="mt-4 space-y-3 border-t border-white/8 pt-4">
          {item.details.map((detail) => (
            <div
              key={detail.label}
              className="grid gap-1 sm:grid-cols-[150px_minmax(0,1fr)]"
            >
              <dt className="text-xs font-bold uppercase tracking-[0.08em] text-brand-teal">
                {detail.label}
              </dt>
              <dd className="text-sm leading-6 text-[#9dacbd]">
                {detail.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {item.bullets?.length ? (
        <ul className="mt-4 space-y-2 border-t border-white/8 pt-4">
          {item.bullets.map((bullet) => (
            <li
              key={bullet}
              className="flex gap-2.5 text-sm leading-6 text-[#9dacbd]"
            >
              <Check
                aria-hidden="true"
                className="mt-1 h-4 w-4 shrink-0 text-brand-cyan"
              />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function EducationSectionCard({
  section,
  index,
  showEquipmentImages = false,
  normalizeLayout = false,
}: {
  section: EducationSection;
  index: number;
  showEquipmentImages?: boolean;
  normalizeLayout?: boolean;
}) {
  return (
    <section
      id={section.id}
      className="scroll-mt-32 rounded-3xl border border-white/10 bg-[#0a192d] p-5 shadow-[0_18px_52px_rgba(0,0,0,0.2)] sm:p-7 lg:p-8"
    >
      <div className="flex items-start gap-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-cyan/40 bg-brand-cyan/5 text-xs font-bold text-brand-cyan">
          {index + 1}
        </span>
        <div className="min-w-0">
          <h2 className="text-xl leading-8 text-white sm:text-2xl">
            {section.title}
          </h2>

          {section.paragraphs?.length ? (
            <div className="mt-4 space-y-4">
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-sm leading-7 text-[#a8b5c5] sm:text-[15px]"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}

          {section.bullets?.length ? (
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {section.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex gap-3 rounded-xl border border-white/8 bg-[#071426]/65 px-4 py-3 text-sm leading-6 text-[#b8c4d1]"
                >
                  <Check
                    aria-hidden="true"
                    className="mt-1 h-4 w-4 shrink-0 text-brand-cyan"
                  />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {section.items?.length ? (
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {section.items.map((item, itemIndex) => (
            <Reveal
              key={item.title}
              direction="up"
              delay={Math.min(itemIndex, 3) * 60}
            >
              <EducationItemCard
                item={item}
                showEquipmentImage={showEquipmentImages}
                normalizeLayout={normalizeLayout}
              />
            </Reveal>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Glossary({ article }: { article: EducationArticle }) {
  if (!article.glossary?.length) {
    return null;
  }

  return (
    <section aria-labelledby="glossary-title" className="space-y-4">
      <Reveal direction="up">
        <div className="flex items-center gap-3">
          <LibraryBig aria-hidden="true" className="h-5 w-5 text-brand-cyan" />
          <h2 id="glossary-title" className="text-2xl text-white">
            110 Istilah Pertambangan
          </h2>
        </div>
      </Reveal>

      {article.glossary.map((group, groupIndex) => (
        <Reveal
          key={group.title}
          direction="up"
          delay={Math.min(groupIndex, 4) * 50}
        >
          <details
            open={groupIndex === 0}
            className="group rounded-2xl border border-white/10 bg-[#0a192d]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-base font-bold text-white marker:content-none sm:px-6">
              <span>{group.title}</span>
              <span className="rounded-full border border-brand-cyan/30 px-3 py-1 text-xs text-brand-cyan">
                {group.entries.length} istilah
              </span>
            </summary>
            <dl className="grid border-t border-white/10 sm:grid-cols-2">
              {group.entries.map((entry) => (
                <div
                  key={entry.term}
                  className="border-b border-white/8 px-5 py-4 last:border-b-0 odd:sm:border-r sm:px-6"
                >
                  <dt className="text-sm font-bold text-white">{entry.term}</dt>
                  <dd className="mt-1 text-sm leading-6 text-[#98a8ba]">
                    {entry.definition}
                  </dd>
                </div>
              ))}
            </dl>
          </details>
        </Reveal>
      ))}
    </section>
  );
}

function ArticleSources({ article }: { article: EducationArticle }) {
  return (
    <section
      aria-labelledby="education-sources-title"
      className="rounded-3xl border border-white/10 bg-[#08172a] p-5 sm:p-7"
    >
      <Reveal direction="up">
        <div className="flex items-center gap-3">
          <ShieldCheck aria-hidden="true" className="h-5 w-5 text-brand-teal" />
          <div>
            <h2 id="education-sources-title" className="text-xl text-white">
              Sumber dan Referensi
            </h2>
            <p className="mt-1 text-sm text-[#8fa0b4]">
              Materi dirangkum dari inventaris konten MineVision dan referensi
              yang tercantum di dalamnya.
            </p>
          </div>
        </div>
      </Reveal>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {article.sources.map((source, index) => (
          <Reveal
            key={`${source.label}-${source.url ?? "internal"}`}
            direction="up"
            delay={Math.min(index, 3) * 60}
          >
            <li className="h-full rounded-xl border border-white/8 bg-[#061122] p-4">
              {source.url ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start justify-between gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan"
                >
                  <span>
                    <span className="block text-sm font-bold text-white transition-colors group-hover:text-brand-cyan">
                      {source.label}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[#8393a7]">
                      {source.description}
                    </span>
                  </span>
                  <ExternalLink
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan"
                  />
                </a>
              ) : (
                <div>
                  <p className="text-sm font-bold text-white">{source.label}</p>
                  <p className="mt-1 text-xs leading-5 text-[#8393a7]">
                    {source.description}
                  </p>
                </div>
              )}
            </li>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

function RelatedMaterials({
  activeSlug,
  onSelect,
}: {
  activeSlug: string;
  onSelect: EducationSelectHandler;
}) {
  const relatedSlugs = educationRelatedSlugs[activeSlug] ?? [];
  const related = relatedSlugs.flatMap((slug) => {
    const article = educationArticles.find((item) => item.slug === slug);
    return article ? [article] : [];
  });

  return (
    <section aria-labelledby="related-materials-title">
      <Reveal direction="up">
        <h2 id="related-materials-title" className="text-2xl text-white">
          Materi Terkait
        </h2>
      </Reveal>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {related.map((article, index) => {
          const Icon = categoryIcons[article.slug] ?? BookOpen;

          return (
            <Reveal
              key={article.slug}
              direction="up"
              delay={Math.min(index, 2) * 70}
            >
              <button
                type="button"
                onClick={() => onSelect(article.slug)}
                className="group h-full w-full cursor-pointer rounded-2xl border border-white/10 bg-[#08172a] p-5 text-left transition-all hover:-translate-y-0.5 hover:border-brand-cyan/35 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan"
              >
                <Icon aria-hidden="true" className="h-5 w-5 text-brand-cyan" />
                <h3 className="mt-4 font-sans text-base font-bold leading-6 text-white">
                  {article.shortTitle}
                </h3>
                <p className="mt-2 text-xs leading-5 text-[#8fa0b4]">
                  {article.categoryLabel}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-brand-teal">
                  Pelajari
                  <ArrowRight
                    aria-hidden="true"
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                  />
                </span>
              </button>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

function ArticleNavigation({
  article,
  onSelect,
}: {
  article: EducationArticle;
  onSelect: EducationSelectHandler;
}) {
  const { previous, next } = getAdjacentEducationArticles(article.slug);

  if (!previous && !next) {
    return null;
  }

  return (
    <nav
      aria-label="Navigasi artikel Education"
      className="grid gap-3 sm:grid-cols-2"
    >
      {previous ? (
        <Reveal direction="up">
          <button
            type="button"
            onClick={() => onSelect(previous.slug, { scrollToMaterial: true })}
            className="group w-full cursor-pointer rounded-2xl border border-white/10 bg-[#071426] p-5 text-left transition-colors hover:border-brand-cyan/35 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan"
          >
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8190a3]">
              <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
              Sebelumnya
            </span>
            <span className="mt-2 block text-sm font-bold text-white transition-colors group-hover:text-brand-cyan">
              {previous.shortTitle}
            </span>
          </button>
        </Reveal>
      ) : (
        <span aria-hidden="true" />
      )}

      {next ? (
        <Reveal direction="up" delay={70}>
          <button
            type="button"
            onClick={() => onSelect(next.slug, { scrollToMaterial: true })}
            className="group w-full cursor-pointer rounded-2xl border border-white/10 bg-[#071426] p-5 text-right transition-colors hover:border-brand-cyan/35 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan"
          >
            <span className="flex items-center justify-end gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8190a3]">
              Selanjutnya
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </span>
            <span className="mt-2 block text-sm font-bold text-white transition-colors group-hover:text-brand-cyan">
              {next.shortTitle}
            </span>
          </button>
        </Reveal>
      ) : null}
    </nav>
  );
}

function EducationArticleView({
  article,
  onSelect,
}: {
  article: EducationArticle;
  onSelect: EducationSelectHandler;
}) {
  const ArticleIcon = categoryIcons[article.slug] ?? BookOpen;
  const normalizeLayout =
    article.slug === "metode-penambangan" ||
    article.slug === "alat-berat-tambang";

  return (
    <article className="min-w-0 space-y-7">
      <Reveal direction="up">
        <header className="rounded-3xl border border-white/10 bg-[#0a192d] p-6 shadow-[0_18px_52px_rgba(0,0,0,0.22)] sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-brand-cyan/30 bg-brand-cyan/5">
              <ArticleIcon
                aria-hidden="true"
                className="h-6 w-6 text-brand-cyan"
              />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-teal">
                {article.categoryLabel}
              </p>
              <h2 className="mt-2 text-2xl leading-tight text-white sm:text-3xl">
                {article.title}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#9facba] sm:text-[15px]">
                {article.summary}
              </p>
              <p className="mt-4 flex items-center gap-2 text-xs text-[#7f90a5]">
                <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
                Estimasi baca {article.readingTime}
              </p>
            </div>
          </div>
        </header>
      </Reveal>

      {article.sections.map((section, index) => (
        <Reveal
          key={section.id}
          direction="up"
          delay={Math.min(index, 4) * 60}
        >
          <EducationSectionCard
            section={section}
            index={index}
            showEquipmentImages={article.slug === "alat-berat-tambang"}
            normalizeLayout={normalizeLayout}
          />
        </Reveal>
      ))}

      <Glossary article={article} />
      <RelatedMaterials activeSlug={article.slug} onSelect={onSelect} />
      <ArticleSources article={article} />
      <ArticleNavigation article={article} onSelect={onSelect} />
    </article>
  );
}

export function EducationPage({ article }: EducationPageProps) {
  const [activeSlug, setActiveSlug] = useState(article.slug);
  const materialRef = useRef<HTMLDivElement | null>(null);

  const activeArticle =
    educationArticles.find((item) => item.slug === activeSlug) ?? article;

  const switchCategory: EducationSelectHandler = (slug, options) => {
    if (slug === activeSlug) {
      return;
    }

    setActiveSlug(slug);

    if (options?.scrollToMaterial) {
      requestAnimationFrame(() => {
        const element = materialRef.current;
        if (!element) {
          return;
        }

        const prefersReducedMotion =
          typeof window !== "undefined" &&
          window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

        element.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start",
        });
      });
    }
  };

  return (
    <div className="bg-[#020817]">
      <EducationHero />

      <section className="relative py-12 sm:py-16 lg:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(40,103,228,0.08),transparent_27%),radial-gradient(circle_at_88%_32%,rgba(60,195,171,0.06),transparent_28%)]"
        />

        <Container className="relative max-w-[1320px]">
          <div className="grid gap-7 lg:grid-cols-[330px_minmax(0,1fr)] lg:items-start xl:gap-9">
            <EducationSidebar activeSlug={activeSlug} onSelect={switchCategory} />

            <div ref={materialRef} className="min-w-0 scroll-mt-32">
              <div key={activeArticle.slug} className="mv-material-switch">
                <EducationArticleView
                  article={activeArticle}
                  onSelect={switchCategory}
                />
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}