import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bot,
  BrainCircuit,
  Building2,
  Check,
  ChevronRight,
  ExternalLink,
  Factory,
  FileText,
  Gem,
  Globe2,
  Leaf,
  MapPinned,
  Scale,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

import {
  collectCommoditySources,
  commodityCategoryLabels,
  formatAvailability,
  formatGlobalMetric,
  formatResourceMaterialLabel,
  formatResourceStatisticValue,
  formatStatisticType,
  formatCommodityNumber,
  getCommodityHref,
  getCommodityImage,
  getCommoditySectionId,
  parseCommodityBody,
  parseCommoditySpecification,
  shouldShowCommodityIntelligence,
  type CommodityContentSection,
  type CommodityMarkdownBlock,
} from "../lib/commodity-view";
import type {
  PublicCommodityDetail,
  PublicCommoditySummary,
} from "../types/commodity";

type CommodityDetailProps = {
  commodity: PublicCommodityDetail;
  previous: PublicCommoditySummary | null;
  next: PublicCommoditySummary | null;
};

const knownSectionLabels: Record<string, string> = {
  overview: "Identitas",
  characteristics: "Karakteristik",
  types: "Jenis",
  "mining-methods": "Penambangan",
  uses: "Kegunaan",
  indonesia: "Indonesia",
  "global-production": "Produksi Dunia",
  companies: "Perusahaan",
  environment: "Lingkungan",
  sources: "Sumber",
};

function cleanMarkdownText(text: string) {
  return text.replace(/\*\*|__|`/g, "").trim();
}

function MarkdownBlocks({ blocks }: { blocks: CommodityMarkdownBlock[] }) {
  return (
    <div className="mt-5 space-y-4">
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return (
            <p key={index} className="text-sm leading-7 text-[#a8b5c5] sm:text-[15px]">
              {cleanMarkdownText(block.text)}
            </p>
          );
        }

        if (block.type === "list") {
          return (
            <ul key={index} className="grid gap-3 sm:grid-cols-2">
              {block.items.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 rounded-xl border border-white/8 bg-[#071426]/65 px-4 py-3 text-sm leading-6 text-[#b8c4d1]"
                >
                  <Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-brand-cyan" />
                  <span>{cleanMarkdownText(item)}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <div key={index} className="overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-left text-sm">
                <thead className="bg-[#061122] text-[#d9e1e9]">
                  <tr>
                    {block.headers.map((header) => (
                      <th key={header} scope="col" className="px-4 py-3 font-bold">
                        {cleanMarkdownText(header)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-t border-white/8 bg-[#08172a]/50">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-3 leading-6 text-[#a8b5c5]">
                          {cleanMarkdownText(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EnvironmentContent({ blocks }: { blocks: CommodityMarkdownBlock[] }) {
  const paragraphTexts = blocks
    .filter((block): block is Extract<CommodityMarkdownBlock, { type: "paragraph" }> =>
      block.type === "paragraph",
    )
    .map((block) => cleanMarkdownText(block.text));
  const impactIndex = paragraphTexts.findIndex((text) => /^dampak:?$/i.test(text));
  const mitigationIndex = paragraphTexts.findIndex((text) =>
    /^upaya mitigasi:?$/i.test(text),
  );

  if (impactIndex === -1 || mitigationIndex === -1 || mitigationIndex <= impactIndex) {
    return <MarkdownBlocks blocks={blocks} />;
  }

  const introduction = paragraphTexts.slice(0, impactIndex);
  const impacts = paragraphTexts.slice(impactIndex + 1, mitigationIndex);
  const mitigations = paragraphTexts.slice(mitigationIndex + 1);

  return (
    <div className="mt-5">
      {introduction.map((paragraph) => (
        <p key={paragraph} className="text-sm leading-7 text-[#a8b5c5] sm:text-[15px]">
          {paragraph}
        </p>
      ))}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.035] p-5">
          <div className="flex items-center gap-2">
            <TriangleAlert aria-hidden="true" className="h-5 w-5 text-amber-300" />
            <h3 className="font-sans text-base font-bold text-white">Dampak yang perlu dikelola</h3>
          </div>
          <ul className="mt-4 space-y-3">
            {impacts.map((impact) => (
              <li key={impact} className="flex gap-3 text-sm leading-6 text-[#b8c4d1]">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
                {impact}
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-2xl border border-brand-teal/20 bg-brand-teal/[0.035] p-5">
          <div className="flex items-center gap-2">
            <Leaf aria-hidden="true" className="h-5 w-5 text-brand-teal" />
            <h3 className="font-sans text-base font-bold text-white">Upaya mitigasi</h3>
          </div>
          <ul className="mt-4 space-y-3">
            {mitigations.map((mitigation) => (
              <li key={mitigation} className="flex gap-3 text-sm leading-6 text-[#b8c4d1]">
                <Check aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-brand-teal" />
                {mitigation}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </div>
  );
}

function TypesContent({ blocks }: { blocks: CommodityMarkdownBlock[] }) {
  const paragraphs = blocks
    .filter((block): block is Extract<CommodityMarkdownBlock, { type: "paragraph" }> =>
      block.type === "paragraph",
    )
    .map((block) => cleanMarkdownText(block.text));

  if (paragraphs.length < 2) {
    return <MarkdownBlocks blocks={blocks} />;
  }

  const hasIntroduction = paragraphs.length % 2 === 1;
  const introduction = hasIntroduction ? paragraphs[0] : null;
  const itemParagraphs = hasIntroduction ? paragraphs.slice(1) : paragraphs;

  return (
    <div className="mt-5">
      {introduction ? (
        <p className="text-sm leading-7 text-[#a8b5c5] sm:text-[15px]">
          {introduction}
        </p>
      ) : null}
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: Math.ceil(itemParagraphs.length / 2) }).map(
          (_, index) => {
            const title = itemParagraphs[index * 2];
            const description = itemParagraphs[index * 2 + 1];
            if (!title) return null;

            return (
              <li key={`${title}-${index}`} className="flex gap-3 rounded-2xl border border-white/8 bg-[#071426]/65 p-4">
                <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-cyan shadow-[0_0_8px_rgba(0,177,196,0.55)]" />
                <div>
                  <p className="font-bold text-white">{title}</p>
                  {description ? <p className="mt-2 text-sm leading-6 text-[#9facba]">{description}</p> : null}
                </div>
              </li>
            );
          },
        )}
      </ul>
    </div>
  );
}

function ProfileSection({
  section,
  index,
}: {
  section: CommodityContentSection;
  index: number;
}) {
  const id = getCommoditySectionId(section.title);

  return (
    <section id={id} className="scroll-mt-44 rounded-3xl border border-white/10 bg-[#0a192d] p-5 shadow-[0_18px_52px_rgba(0,0,0,0.18)] sm:p-7 lg:scroll-mt-32 lg:p-8">
      <div className="flex items-start gap-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-cyan/40 bg-brand-cyan/5 text-xs font-bold text-brand-cyan">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl leading-8 text-white sm:text-2xl">{section.title}</h2>
          {id === "environment" ? (
            <EnvironmentContent blocks={section.blocks} />
          ) : id === "types" ? (
            <TypesContent blocks={section.blocks} />
          ) : (
            <MarkdownBlocks blocks={section.blocks} />
          )}
        </div>
      </div>
    </section>
  );
}

function CommodityHero({ commodity }: { commodity: PublicCommodityDetail }) {
  const image = getCommodityImage(commodity);

  return (
    <section className="relative isolate overflow-hidden border-b border-white/10 pb-12 pt-32 sm:pb-16 sm:pt-36">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_78%_38%,rgba(0,177,196,0.14),transparent_27%),linear-gradient(115deg,#020817_0%,#071426_58%,#06202d_100%)]"
      />
      <Container className="max-w-[1320px]">
        <Link
          href="/commodity"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-cyan/35 bg-brand-cyan/10 px-5 text-sm font-bold text-brand-cyan transition-colors hover:bg-brand-cyan/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Kembali ke katalog
        </Link>

        <div className="mt-7 grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:gap-14">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-brand-cyan/25 bg-brand-cyan/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-brand-cyan">
                {commodityCategoryLabels[commodity.category]}
              </span>
              {commodity.isIntelligenceTracked ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-teal/25 bg-brand-teal/5 px-3 py-1 text-xs font-bold text-brand-teal">
                  <BrainCircuit aria-hidden="true" className="h-3.5 w-3.5" />
                  Dipantau Intelligence
                </span>
              ) : null}
            </div>
            <div className="mt-5 flex flex-wrap items-baseline gap-3">
              <h1 className="text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">{commodity.name}</h1>
              {commodity.symbol ? <span className="font-mono text-xl text-[#8fa0b4]">{commodity.symbol}</span> : null}
            </div>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[#b7c3d1] sm:text-lg">
              {commodity.description ?? commodity.profile.excerpt}
            </p>
            <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-4 text-sm">
              <div><dt className="text-[#7f90a5]">Daerah penghasil</dt><dd className="mt-1 font-bold text-white">{commodity.dataSummary.productionLocationCount}</dd></div>
              <div><dt className="text-[#7f90a5]">Statistik Indonesia</dt><dd className="mt-1 font-bold text-white">{commodity.dataSummary.resourceStatisticCount}</dd></div>
              <div><dt className="text-[#7f90a5]">Produsen utama</dt><dd className="mt-1 font-bold text-white">{commodity.dataSummary.producerCount}</dd></div>
            </dl>
          </div>

          <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_center,_#d1d5db_0%,_#f8fafc_58%,_#ffffff_100%)] shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
            {image ? (
              <Image src={image.src} alt={image.alt} fill priority sizes="(min-width: 1024px) 390px, 90vw" className="object-contain p-10" />
            ) : (
              <div className="flex h-full items-center justify-center"><Gem aria-hidden="true" className="h-20 w-20 text-slate-500" /><span className="sr-only">Gambar belum tersedia</span></div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

function SectionNavigation({ sections }: { sections: Array<{ id: string; label: string }> }) {
  return (
    <nav aria-label="Navigasi isi Commodity" className="sticky top-[100px] z-20 -mx-4 min-w-0 max-w-[calc(100%+2rem)] overflow-hidden border-y border-white/10 bg-[#020817]/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:max-w-[calc(100%+3rem)] sm:px-6 lg:top-28 lg:mx-0 lg:max-w-full lg:rounded-2xl lg:border lg:bg-[#08172a] lg:p-4">
      <p className="hidden text-xs font-bold uppercase tracking-[0.14em] text-brand-teal lg:block">Dalam halaman ini</p>
      <ul className="flex gap-2 overflow-x-auto pb-1 lg:mt-3 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
        {sections.map((section) => (
          <li key={section.id} className="shrink-0">
            <a href={`#${section.id}`} className="flex min-h-10 items-center justify-between gap-3 rounded-full border border-white/10 px-4 text-sm font-semibold text-[#9facba] transition-colors hover:border-brand-cyan/35 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan lg:rounded-xl lg:border-transparent lg:px-3">
              {section.label}
              <ChevronRight aria-hidden="true" className="hidden h-3.5 w-3.5 lg:block" />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function TechnicalIdentity({ commodity }: { commodity: PublicCommodityDetail }) {
  const items = parseCommoditySpecification(commodity.specification);
  if (items.length === 0) return null;

  return (
    <dl className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">
      {items.map((item) => (
        <div key={`${item.label}-${item.value}`} className="bg-[#071426] p-4">
          <dt className="text-xs font-bold uppercase tracking-[0.1em] text-brand-teal">{item.label}</dt>
          <dd className="mt-1.5 text-sm leading-6 text-[#d3dce5]">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function IndonesiaSection({ commodity }: { commodity: PublicCommodityDetail }) {
  return (
    <section id="indonesia" className="scroll-mt-44 rounded-3xl border border-white/10 bg-[#0a192d] p-5 sm:p-7 lg:scroll-mt-32 lg:p-8">
      <div className="flex items-start gap-4">
        <MapPinned aria-hidden="true" className="mt-1 h-6 w-6 shrink-0 text-brand-cyan" />
        <div><h2 className="text-xl text-white sm:text-2xl">Data Indonesia</h2><p className="mt-2 text-sm leading-6 text-[#8fa0b4]">Daerah penghasil serta statistik cadangan, sumber daya, atau kapasitas yang tersedia.</p></div>
      </div>

      <div className="mt-7">
        <h3 className="font-sans text-base font-bold text-white">Daerah penghasil</h3>
        {commodity.productionLocations.length ? (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {commodity.productionLocations.map((location) => (
              <li key={location.id} className="rounded-2xl border border-white/8 bg-[#071426]/70 p-4">
                <p className="font-bold text-white">{location.region.name}</p>
                {location.locationDetail ? <p className="mt-1 text-sm leading-6 text-[#9facba]">{location.locationDetail}</p> : null}
                {location.notes ? <p className="mt-2 text-xs leading-5 text-[#7f90a5]">{location.notes}</p> : null}
              </li>
            ))}
          </ul>
        ) : <p className="mt-3 rounded-2xl border border-dashed border-white/12 p-5 text-sm text-[#8fa0b4]">Informasi daerah penghasil belum tersedia.</p>}
      </div>

      <div className="mt-8">
        <h3 className="font-sans text-base font-bold text-white">Cadangan dan sumber daya</h3>
        {commodity.resourceStatistics.length ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {commodity.resourceStatistics.map((statistic) => (
              <article key={statistic.id} className="rounded-2xl border border-white/8 bg-[#071426]/70 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-brand-teal">{statistic.statisticYear} · {formatStatisticType(statistic.statisticType)}</p>
                <p className="mt-3 text-2xl font-bold text-white">
                  {formatResourceStatisticValue(statistic.value, statistic.unit)}
                </p>
                <p className="mt-2 text-xs leading-5 text-[#8190a3]">{formatResourceMaterialLabel(statistic.materialBasis, commodity.name) ?? formatAvailability(statistic.availabilityStatus)}</p>
                {statistic.notes ? <p className="mt-3 border-t border-white/8 pt-3 text-xs leading-5 text-[#8fa0b4]">{statistic.notes}</p> : null}
              </article>
            ))}
          </div>
        ) : <p className="mt-3 rounded-2xl border border-dashed border-white/12 p-5 text-sm text-[#8fa0b4]">Statistik cadangan atau sumber daya belum tersedia.</p>}
      </div>
    </section>
  );
}

function GlobalSection({ commodity }: { commodity: PublicCommodityDetail }) {
  return (
    <section id="global-production" className="scroll-mt-44 rounded-3xl border border-white/10 bg-[#0a192d] p-5 sm:p-7 lg:scroll-mt-32 lg:p-8">
      <div className="flex items-start gap-4"><Globe2 aria-hidden="true" className="mt-1 h-6 w-6 shrink-0 text-brand-cyan" /><div><h2 className="text-xl text-white sm:text-2xl">Produksi Dunia</h2><p className="mt-2 text-sm leading-6 text-[#8fa0b4]">Peringkat negara berdasarkan basis dan satuan asli sumber.</p></div></div>
      <div className="mt-6 space-y-5">
        {commodity.globalStatisticSets.length ? commodity.globalStatisticSets.map((set) => (
          <article key={set.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#071426]/70">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 p-4 sm:p-5">
              <div><h3 className="font-sans text-base font-bold text-white">{formatGlobalMetric(set.metricCode)}</h3><p className="mt-1 text-xs text-[#8190a3]">{set.statisticYear} · {set.basisCode.replaceAll("_", " ")}</p></div>
              <span className="rounded-full border border-brand-teal/25 px-3 py-1 text-xs font-bold text-brand-teal">{formatAvailability(set.availabilityStatus)}</span>
            </header>
            {set.entries.length ? (
              <ol className="divide-y divide-white/8">
                {set.entries.map((entry) => (
                  <li key={entry.id} className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-brand-cyan/30 text-sm font-bold text-brand-cyan">{entry.rank}</span>
                    <span className="font-semibold text-[#d9e1e9]">{entry.country.name}</span>
                    <span className="text-right text-sm font-bold text-white">{formatCommodityNumber(entry.value)} <span className="font-normal text-[#8190a3]">{set.unit?.symbol}</span></span>
                  </li>
                ))}
              </ol>
            ) : <p className="p-5 text-sm leading-6 text-[#8fa0b4]">Sumber pemeringkatan yang dapat diverifikasi belum tersedia untuk komoditas ini.</p>}
            {set.notes ? <p className="border-t border-white/8 px-4 py-3 text-xs leading-5 text-[#8190a3] sm:px-5">{set.notes}</p> : null}
          </article>
        )) : (
          <p className="rounded-2xl border border-dashed border-white/12 p-5 text-sm leading-6 text-[#8fa0b4]">
            Statistik produksi dunia belum tersedia untuk komoditas ini.
          </p>
        )}
      </div>
    </section>
  );
}

function CompaniesSection({ commodity }: { commodity: PublicCommodityDetail }) {
  return (
    <section id="companies" className="scroll-mt-44 rounded-3xl border border-white/10 bg-[#0a192d] p-5 sm:p-7 lg:scroll-mt-32 lg:p-8">
      <div className="flex items-start gap-4"><Building2 aria-hidden="true" className="mt-1 h-6 w-6 shrink-0 text-brand-cyan" /><div><h2 className="text-xl text-white sm:text-2xl">Perusahaan Tambang Utama</h2><p className="mt-2 text-sm leading-6 text-[#8fa0b4]">Produsen terverifikasi beserta wilayah operasinya.</p></div></div>
      {commodity.producers.length ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {commodity.producers.map((producer) => (
            <article key={producer.id} className="rounded-2xl border border-white/8 bg-[#071426]/70 p-5">
              <Factory aria-hidden="true" className="h-5 w-5 text-brand-teal" />
              <h3 className="mt-4 font-sans text-base font-bold text-white">{producer.companyName}</h3>
              {producer.producerRole ? <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-brand-cyan">{producer.producerRole}</p> : null}
              <p className="mt-3 text-sm leading-6 text-[#9facba]">{producer.operationArea}</p>
              {producer.primaryRegion ? <p className="mt-3 text-xs text-[#8190a3]">Wilayah utama: {producer.primaryRegion.name}</p> : null}
            </article>
          ))}
        </div>
      ) : <p className="mt-5 rounded-2xl border border-dashed border-white/12 p-5 text-sm text-[#8fa0b4]">Informasi perusahaan produsen belum tersedia.</p>}
    </section>
  );
}

function SourcesSection({ commodity }: { commodity: PublicCommodityDetail }) {
  const sources = collectCommoditySources(commodity);

  return (
    <section id="sources" className="scroll-mt-44 rounded-3xl border border-white/10 bg-[#08172a] p-5 sm:p-7 lg:scroll-mt-32">
      <div className="flex items-start gap-4"><ShieldCheck aria-hidden="true" className="mt-1 h-6 w-6 shrink-0 text-brand-teal" /><div><h2 className="text-xl text-white sm:text-2xl">Sumber dan Referensi</h2><p className="mt-2 text-sm leading-6 text-[#8fa0b4]">Rujukan publik dan terverifikasi yang terhubung dengan materi serta data {commodity.name}.</p></div></div>
      {sources.length ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {sources.map((source, index) => {
            const href = source.sourceUrl ?? source.url;
            const label = source.citationLabel ?? source.name;
            return (
              <li key={`${source.slug}-${source.sourceRole ?? ""}-${label}-${source.pageReference ?? ""}-${href ?? ""}-${index}`} className="rounded-2xl border border-white/8 bg-[#061122] p-4">
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="group flex items-start justify-between gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan">
                    <span><span className="block text-sm font-bold text-white transition-colors group-hover:text-brand-cyan">{label}</span><span className="mt-1 block text-xs leading-5 text-[#8393a7]">{source.organization}{source.pageReference ? ` · ${source.pageReference}` : ""}</span></span>
                    <ExternalLink aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" />
                  </a>
                ) : (
                  <div><p className="text-sm font-bold text-white">{label}</p><p className="mt-1 text-xs leading-5 text-[#8393a7]">{source.organization}</p></div>
                )}
              </li>
            );
          })}
        </ul>
      ) : <p className="mt-5 text-sm text-[#8fa0b4]">Referensi publik belum tersedia.</p>}
    </section>
  );
}

function ActionCards({ commodity }: { commodity: PublicCommodityDetail }) {
  return (
    <section aria-label="Langkah berikutnya" className="grid gap-4 md:grid-cols-2">
      {shouldShowCommodityIntelligence(commodity) ? (
        <Card variant="elevated" className="relative overflow-hidden p-6 sm:p-7">
          <div aria-hidden="true" className="absolute -right-14 -top-14 size-40 rounded-full bg-brand-blue/10 blur-3xl" />
          <div className="relative">
            <BrainCircuit aria-hidden="true" className="size-7 text-brand-cyan" />
            <h2 className="mt-5 text-2xl text-foreground">Jelajahi Data Intelligence</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">Lihat indikator produksi, harga, dan tren yang tersedia dalam modul Intelligence MineVision.</p>
            <Link href="/intelligence" className={cn(buttonVariants({ variant: "outline", size: "medium" }), "mt-6 motion-reduce:transition-none")}>Buka Intelligence <ArrowRight aria-hidden="true" className="size-4" /></Link>
          </div>
        </Card>
      ) : (
        <Card variant="elevated" className="relative overflow-hidden p-6 sm:p-7">
          <div aria-hidden="true" className="absolute -right-14 -top-14 size-40 rounded-full bg-brand-blue/10 blur-3xl" />
          <div className="relative">
            <Scale aria-hidden="true" className="size-7 text-brand-cyan" />
            <h2 className="mt-5 text-2xl text-foreground">Data yang Terverifikasi</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">Informasi ditampilkan sesuai data publik yang telah tersedia tanpa membuat estimasi baru.</p>
          </div>
        </Card>
      )}
      <Card variant="elevated" className="relative overflow-hidden p-6 sm:p-7">
        <div aria-hidden="true" className="absolute -right-14 -top-14 size-40 rounded-full bg-brand-teal/10 blur-3xl" />
        <div className="relative">
          <Bot aria-hidden="true" className="size-7 text-brand-teal" />
          <h2 className="mt-5 text-2xl text-foreground">Tanya MineBot AI</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">Gunakan entry point MineBot pada halaman untuk mendalami informasi tentang {commodity.name}. Konteks pertanyaan otomatis akan ditambahkan setelah integrasi percakapan tersedia.</p>
          <a href="#minebot" className={cn(buttonVariants({ variant: "primary", size: "medium" }), "mt-6 motion-reduce:transition-none")}>Tanya MineBot <ArrowRight aria-hidden="true" className="size-4" /></a>
        </div>
      </Card>
    </section>
  );
}

function CommodityPagination({ previous, next }: Pick<CommodityDetailProps, "previous" | "next">) {
  return (
    <nav aria-label="Navigasi komoditas" className="grid gap-3 sm:grid-cols-2">
      {previous ? <Link href={getCommodityHref(previous.slug)} className="group rounded-2xl border border-white/10 bg-[#071426] p-5 hover:border-brand-cyan/35 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan"><span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8190a3]"><ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" /> Sebelumnya</span><span className="mt-2 block text-sm font-bold text-white group-hover:text-brand-cyan">{previous.name}</span></Link> : <span aria-hidden="true" />}
      {next ? <Link href={getCommodityHref(next.slug)} className="group rounded-2xl border border-white/10 bg-[#071426] p-5 text-right hover:border-brand-cyan/35 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan"><span className="flex items-center justify-end gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8190a3]">Selanjutnya <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></span><span className="mt-2 block text-sm font-bold text-white group-hover:text-brand-cyan">{next.name}</span></Link> : null}
    </nav>
  );
}

export function CommodityDetail({ commodity, previous, next }: CommodityDetailProps) {
  const bodySections = parseCommodityBody(commodity.profile.body);
  const overview = bodySections.find((section) => getCommoditySectionId(section.title) === "overview");
  const remainingBodySections = bodySections.filter((section) => getCommoditySectionId(section.title) !== "overview");
  const navigation = [
    ...(overview || commodity.specification ? [{ id: "overview", label: knownSectionLabels.overview }] : []),
    ...remainingBodySections.map((section) => ({ id: getCommoditySectionId(section.title), label: knownSectionLabels[getCommoditySectionId(section.title)] ?? section.title })),
    { id: "indonesia", label: knownSectionLabels.indonesia },
    { id: "global-production", label: knownSectionLabels["global-production"] },
    { id: "companies", label: knownSectionLabels.companies },
    { id: "sources", label: knownSectionLabels.sources },
  ];

  return (
    <div className="bg-[#020817]">
      <CommodityHero commodity={commodity} />
      <main id="commodity-content" className="relative py-10 sm:py-14 lg:py-16">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(40,103,228,0.07),transparent_25%),radial-gradient(circle_at_88%_42%,rgba(60,195,171,0.05),transparent_28%)]" />
        <Container className="relative max-w-[1320px]">
          <div className="grid min-w-0 gap-7 lg:grid-cols-[250px_minmax(0,1fr)] lg:items-start xl:gap-9">
            <SectionNavigation sections={navigation} />
            <article className="min-w-0 space-y-7">
              {(overview || commodity.specification) ? (
                <section id="overview" className="scroll-mt-44 rounded-3xl border border-white/10 bg-[#0a192d] p-5 sm:p-7 lg:scroll-mt-32 lg:p-8">
                  <div className="flex items-start gap-4"><FileText aria-hidden="true" className="mt-1 h-6 w-6 shrink-0 text-brand-cyan" /><div className="min-w-0 flex-1"><h2 className="text-xl text-white sm:text-2xl">Identitas Teknis</h2><TechnicalIdentity commodity={commodity} /></div></div>
                </section>
              ) : null}
              {remainingBodySections.map((section, index) => <ProfileSection key={section.title} section={section} index={index + 1} />)}
              <IndonesiaSection commodity={commodity} />
              <GlobalSection commodity={commodity} />
              <CompaniesSection commodity={commodity} />
              <SourcesSection commodity={commodity} />
              <ActionCards commodity={commodity} />
              <CommodityPagination previous={previous} next={next} />
              <div className="flex justify-center"><a href="#commodity-content" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 px-5 text-sm font-bold text-[#9facba] hover:border-brand-cyan/35 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan"><ArrowUp aria-hidden="true" className="h-4 w-4" /> Kembali ke atas</a></div>
            </article>
          </div>
        </Container>
      </main>
    </div>
  );
}
