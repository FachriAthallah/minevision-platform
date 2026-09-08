import type { CareerMaterialBlock, CareerMaterialGroup } from "../lib/career-material";
import type { CareerSection } from "../types/career";
import { CareerSectionHeading } from "./career-section-heading";

function MaterialBlocks({ blocks }: { blocks: CareerMaterialBlock[] }) {
  const chunks: { kind: CareerMaterialBlock["kind"]; texts: string[] }[] = [];
  for (const block of blocks) {
    const previous = chunks.at(-1);
    if (block.kind === "item" && previous?.kind === "item") previous.texts.push(block.text);
    else chunks.push({ kind: block.kind, texts: [block.text] });
  }
  return <div className="space-y-4">{chunks.map((chunk, index) => chunk.kind === "item"
    ? <ul key={index} className="space-y-3">{chunk.texts.map((text, i) => <li key={i} className="flex gap-3 text-sm leading-7 text-muted-foreground sm:text-base"><span aria-hidden="true" className="mt-3 size-1.5 shrink-0 rounded-full bg-brand-teal" /><span className="min-w-0 break-words">{text}</span></li>)}</ul>
    : chunk.kind === "heading"
      ? <h4 key={index} className="pt-2 text-base font-semibold leading-7 text-foreground">{chunk.texts[0]}</h4>
      : <p key={index} className="text-sm leading-7 text-muted-foreground">{chunk.texts[0]}</p>)}</div>;
}

export function CareerMaterialSection({ section, title, groups }: { section: CareerSection; title: string; groups: CareerMaterialGroup[] }) {
  const label = section === "software" ? "Software yang Digunakan" : section === "training" ? "Pelatihan Relevan" : title;
  return <section id={section} aria-labelledby={`title-${section}`} className="scroll-mt-64 rounded-2xl border border-border bg-surface p-5 sm:p-8 lg:scroll-mt-32">
    <CareerSectionHeading id={`title-${section}`} title={label} section={section} />
    {groups.length === 0 ? <p className="mt-6 text-muted-foreground">Informasi {title.toLowerCase()} belum tersedia.</p>
      : section === "software" ? <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <table className="w-full table-fixed text-left text-sm leading-7 sm:text-base">
          <caption className="sr-only">Software menurut bidang penggunaan</caption>
          {groups.map((group, index) => <tbody key={index}>
            <tr><th scope="rowgroup" className="border-b border-brand-cyan/20 bg-brand-cyan/10 px-5 py-4 font-bold text-brand-teal">{group.title ?? "Software"}</th></tr>
            {group.blocks.map((block, i) => <tr key={i}><td className="break-words border-b border-border px-5 py-3 text-muted-foreground">{block.text}</td></tr>)}
          </tbody>)}
        </table>
      </div> : <div className="mt-7 space-y-8">{groups.map((group, index) => <div key={index}>
        {group.title && <h3 className="mb-5 bg-gradient-to-r from-brand-cyan to-brand-teal bg-clip-text text-xl font-bold leading-8 text-transparent sm:text-2xl">{group.title}</h3>}
        <MaterialBlocks blocks={group.blocks} />
      </div>)}</div>}
  </section>;
}
