"use client";

import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { filterCareerProfessions, formatCareerCount } from "../lib/career-view";
import type { CareerProfessionGroup } from "../types/career";

function ProfessionGroup({ group, initiallyOpen }: { group: CareerProfessionGroup; initiallyOpen: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  const id = `profesi-${group.groupKey}`;
  return <div className="overflow-hidden rounded-xl border border-border bg-background/40">
    <h3 className="font-sans">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className="flex min-h-14 w-full items-center gap-3 p-4 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-cyan sm:p-5">
        <span className="min-w-0 flex-1 text-base font-bold leading-7">{group.groupLabel}<span className="mt-1 block text-xs font-normal text-muted-foreground">{formatCareerCount(group.professionCount)} profesi</span></span>
        <ChevronDown className={`size-5 shrink-0 text-brand-cyan ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
    </h3>
    <div id={id} hidden={!open}>
      {open && <ul className="grid gap-x-6 border-t border-border px-4 py-2 sm:grid-cols-2 sm:px-5">{group.professions.map((profession) => <li key={profession.slug} className="border-b border-white/5 py-3 text-sm leading-6"><p className="font-semibold">{profession.name}</p>{profession.description && <p className="mt-1 text-muted-foreground">{profession.description}</p>}</li>)}</ul>}
    </div>
  </div>;
}

export function CareerProfessions({ groups }: { groups: CareerProfessionGroup[] }) {
  const [query, setQuery] = useState("");
  const results = filterCareerProfessions(groups, query);
  const count = results.reduce((sum, group) => sum + group.professionCount, 0);
  return <div className="mt-6">
    <label htmlFor="profession-search" className="mb-2 block text-sm font-semibold">Cari nama atau deskripsi profesi</label>
    <div className="relative"><Search aria-hidden="true" className="absolute left-4 top-3.5 size-5 text-muted-foreground" /><input id="profession-search" type="search" maxLength={100} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Geologist, engineer, analyst…" className="h-12 w-full rounded-xl border border-border bg-background pl-12 pr-4 outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan" /></div>
    <div className="my-4 flex min-h-11 flex-wrap items-center justify-between gap-2"><p role="status" aria-live="polite" className="text-sm text-muted-foreground">{formatCareerCount(count)} profesi dalam {results.length} kelompok</p>{query && <Button variant="ghost" onClick={() => setQuery("")}>Reset pencarian profesi</Button>}</div>
    <div className="space-y-3">{results.map((group, index) => <ProfessionGroup key={`${query.trim()}:${group.groupKey}`} group={group} initiallyOpen={Boolean(query.trim()) || index === 0} />)}</div>
    {!count && <p className="rounded-xl border border-border p-5 leading-7 text-muted-foreground">Profesi tidak ditemukan. Coba kata kunci lain atau reset pencarian.</p>}
  </div>;
}

