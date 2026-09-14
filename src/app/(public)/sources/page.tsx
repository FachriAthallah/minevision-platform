import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SourceCatalog } from "@/features/sources/components/source-catalog";
import { sourceQuerySchema } from "@/features/sources/schemas/source-query";
import { getPublicSources } from "@/features/sources/server/get-public-sources";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Daftar Sumber", description: "Katalog publikasi terverifikasi yang digunakan data publik MineVision.", alternates: { canonical: "/sources" } };
type Props = { searchParams: Promise<Record<string,string|string[]|undefined>> };
export default async function SourcesPage({searchParams}: Props) { const raw=await searchParams; const one=(key:string)=>typeof raw[key]==="string"?raw[key]:undefined; const parsed=sourceQuerySchema.safeParse({q:one("q"),publisher:one("publisher"),type:one("type"),module:one("module"),page:one("page"),limit:one("limit")}); const query=parsed.success?parsed.data:sourceQuerySchema.parse({}); const catalog=await getPublicSources(query); return <div className="min-h-screen bg-[#020817] pt-28 text-white sm:pt-32"><Container className="max-w-[1320px] py-12 sm:py-16"><p className="text-xs font-bold uppercase tracking-[.18em] text-brand-cyan">Data Source</p><h1 className="mt-4 text-4xl sm:text-5xl">Daftar Sumber MineVision</h1><p className="mt-4 max-w-3xl leading-7 text-[#aebccc]">Katalog ini hanya memuat sumber aktif dan terverifikasi yang terkait dengan konten atau data publik. File staging dan metadata audit internal tidak dipublikasikan.</p>{!parsed.success?<p role="alert" className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">Filter tidak valid telah dikembalikan ke nilai awal.</p>:null}<SourceCatalog catalog={catalog} query={{q:query.q,publisher:query.publisher,type:query.type,module:query.module,page:String(query.page)}}/></Container></div>; }
