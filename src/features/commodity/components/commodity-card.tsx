import { ArrowRight, BrainCircuit, Gem } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  commodityCategoryLabels,
  getCommodityHref,
  getCommodityImage,
} from "../lib/commodity-view";
import type { PublicCommoditySummary } from "../types/commodity";

export function CommodityCard({
  commodity,
}: {
  commodity: PublicCommoditySummary;
}) {
  const image = getCommodityImage(commodity);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#08172a] shadow-[0_18px_48px_rgba(0,0,0,0.2)] transition-[transform,border-color] duration-200 hover:-translate-y-1 hover:border-brand-cyan/35 motion-reduce:transform-none">
      <div className="relative aspect-[16/10] overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_center,_#d1d5db_0%,_#f8fafc_58%,_#ffffff_100%)]">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
            className="object-contain p-7 transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transform-none"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Gem aria-hidden="true" className="h-14 w-14 text-slate-500" />
            <span className="sr-only">Gambar belum tersedia</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-brand-cyan/25 bg-brand-cyan/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-brand-cyan">
            {commodityCategoryLabels[commodity.category]}
          </span>
          {commodity.isIntelligenceTracked ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-teal/25 bg-brand-teal/5 px-3 py-1 text-[11px] font-bold text-brand-teal">
              <BrainCircuit aria-hidden="true" className="h-3.5 w-3.5" />
              Intelligence
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <h2 className="text-xl leading-tight text-white">{commodity.name}</h2>
          {commodity.symbol ? (
            <span className="font-mono text-sm text-[#8190a3]">
              {commodity.symbol}
            </span>
          ) : null}
        </div>

        <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#9facba]">
          {commodity.description ?? commodity.profile.excerpt}
        </p>

        <Link
          href={getCommodityHref(commodity.slug)}
          className={cn(
            buttonVariants({ variant: "outline", size: "medium" }),
            "mt-6 w-full motion-reduce:transition-none",
          )}
          aria-label={`Lihat detail ${commodity.name}`}
        >
          Lihat detail
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
