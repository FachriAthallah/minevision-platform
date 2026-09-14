import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";

import { Container } from "@/components/ui/container";
import { publicRoutes } from "@/config/site";

export type ResourceSection = {
  id?: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  links?: Array<{ label: string; href: string; external?: boolean }>;
};

type ResourcePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  updatedAt?: string;
  sections: ResourceSection[];
  children?: ReactNode;
};

export function ResourcePage({ eyebrow, title, description, updatedAt, sections, children }: ResourcePageProps) {
  return (
    <div className="min-h-screen bg-[#020817] pt-28 text-white sm:pt-32">
      <Container className="max-w-[1120px] py-12 sm:py-16">
        <Link href={publicRoutes.home} className="inline-flex items-center gap-2 rounded-md text-sm text-[#9facba] hover:text-brand-cyan focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan"><ArrowLeft aria-hidden="true" className="size-4" /> Kembali ke Home</Link>
        <header className="mt-8 max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-cyan">{eyebrow}</p>
          <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">{title}</h1>
          <p className="mt-5 text-base leading-8 text-[#b7c3d1] sm:text-lg">{description}</p>
          {updatedAt ? <p className="mt-4 text-sm text-[#8292a6]">Terakhir diperbarui: {updatedAt}</p> : null}
        </header>
        {children ? <div className="mt-10">{children}</div> : null}
        <div className="mt-10 grid gap-5">
          {sections.map((section) => (
            <section key={section.title} id={section.id} className="scroll-mt-32 rounded-2xl border border-white/10 bg-[#08172a] p-6 sm:p-8">
              <h2 className="text-2xl text-white">{section.title}</h2>
              <div className="mt-4 space-y-4 text-sm leading-7 text-[#aebccc] sm:text-base">
                {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets ? <ul className="list-disc space-y-2 pl-5">{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul> : null}
                {section.links ? <div className="flex flex-wrap gap-3 pt-2">{section.links.map((item) => item.external ? (
                  <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-cyan/40 px-5 font-semibold text-white hover:bg-brand-cyan/10 focus-visible:outline-2 focus-visible:outline-brand-cyan">{item.label}<ExternalLink aria-hidden="true" className="size-4" /></a>
                ) : (
                  <Link key={item.href} href={item.href} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-cyan/40 px-5 font-semibold text-white hover:bg-brand-cyan/10 focus-visible:outline-2 focus-visible:outline-brand-cyan">{item.label}<ArrowRight aria-hidden="true" className="size-4" /></Link>
                ))}</div> : null}
              </div>
            </section>
          ))}
        </div>
      </Container>
    </div>
  );
}
