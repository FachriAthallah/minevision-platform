import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SearchResults } from "@/features/search/components/search-results";
import { publicSearchQuerySchema } from "@/features/search/schemas/search-query";
import { searchPublicSite } from "@/features/search/server/search-public-site";

export const metadata: Metadata = {
  title: "Global Search",
  description: "Cari materi, entitas, data publik, resource, dan sumber MineVision.",
  alternates: { canonical: "/search" },
};

const popular=["Nikel","Freeport","Mining Engineer","Batubara","K3","Hilirisasi"];
type Props={searchParams:Promise<Record<string,string|string[]|undefined>>};
export default async function SearchPage({searchParams}:Props) {
  const raw=await searchParams; const value=(key:string)=>typeof raw[key]==="string"?raw[key]:undefined;
  const hasQuery=Boolean(value("q")?.trim()); const parsed=publicSearchQuerySchema.safeParse({q:value("q"),page:value("page")});
  const result=parsed.success?await searchPublicSite(parsed.data):null;
  return <div className="min-h-screen bg-[#020817] pt-28 text-white sm:pt-32"><Container className="max-w-[1040px] py-12 sm:py-16"><p className="text-xs font-bold uppercase tracking-[.18em] text-brand-cyan">Global Search</p><h1 className="mt-4 text-4xl sm:text-5xl">Temukan Informasi Pertambangan</h1><p className="mt-4 max-w-3xl leading-7 text-[#aebccc]">Pencarian lintas modul hanya menggunakan konten dan data yang layak tampil publik.</p>
    <form method="get" role="search" className="mt-8 flex flex-col gap-3 sm:flex-row"><label className="relative flex-1"><span className="sr-only">Kata kunci pencarian</span><Search aria-hidden="true" className="absolute left-4 top-4 size-5 text-[#8292a6]"/><input name="q" defaultValue={value("q")} minLength={2} maxLength={100} required placeholder="Cari nikel, Freeport, profesi, K3…" className="h-13 w-full rounded-xl border border-white/10 bg-[#08172a] pl-12 pr-4 outline-none focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20"/></label><button className="h-13 rounded-xl bg-brand-cyan px-7 font-bold text-[#020817] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Cari</button></form>
    <div className="mt-4 flex flex-wrap gap-2" aria-label="Pencarian populer">{popular.map((term)=><Link key={term} href={`/search?q=${encodeURIComponent(term)}`} className="rounded-full border border-white/10 px-3 py-2 text-sm text-[#aebccc] hover:border-brand-cyan hover:text-white focus-visible:outline-2 focus-visible:outline-brand-cyan">{term}</Link>)}</div>
    {hasQuery&&!parsed.success?<div role="alert" className="mt-7 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 text-amber-100">Kata kunci tidak valid. Gunakan 2–100 karakter.</div>:null}{result?<SearchResults result={result}/>:!hasQuery?<div className="mt-10 rounded-2xl border border-dashed border-white/15 p-8 text-center text-[#9facba]">Masukkan kata kunci atau pilih pencarian populer.</div>:null}
  </Container></div>;
}
