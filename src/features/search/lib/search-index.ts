import { publicRoutes } from "@/config/site";
import type { PublicSearchResult } from "../types";

export const staticSearchEntries: PublicSearchResult[] = [
  { key:"economy-pdb", title:"PDB Pertambangan", summary:"Kontribusi dan perubahan nominal PDB pertambangan Indonesia.", module:"Economy", type:"Indikator", href:"/economy?section=gdp" },
  { key:"economy-export", title:"Ekspor Mineral dan Batubara", summary:"Nilai FOB, berat bersih, komoditas, dan negara tujuan yang layak publik.", module:"Economy", type:"Indikator", href:"/economy?section=exports" },
  { key:"economy-investment", title:"Investasi Pertambangan", summary:"Realisasi PMA dan PMDN pertambangan yang telah dipublikasikan.", module:"Economy", type:"Indikator", href:"/economy?section=investment" },
  { key:"economy-downstream", title:"Hilirisasi Pertambangan", summary:"Fasilitas smelter dan refinery yang terverifikasi.", module:"Economy", type:"Hilirisasi", href:publicRoutes.economyDownstream },
  { key:"economy-regulations", title:"Regulasi Minerba", summary:"Daftar regulasi statis terkurasi dari kanal resmi.", module:"Economy", type:"Regulasi", href:"/economy?section=regulations" },
  { key:"resource-about", title:"Tentang MineVision", summary:"Tujuan, pengguna, modul, dan prinsip sumber MineVision.", module:"Resource", type:"Halaman", href:publicRoutes.about },
  { key:"resource-methodology", title:"Metodologi Data", summary:"Status verifikasi, publikasi, HOLD, legacy, canonical, dan koreksi.", module:"Resource", type:"Metodologi", href:publicRoutes.methodology },
  { key:"resource-privacy", title:"Kebijakan Privasi", summary:"Pemrosesan akun, sesi, pencarian, dan tautan eksternal.", module:"Resource", type:"Kebijakan", href:publicRoutes.privacy },
  { key:"resource-terms", title:"Ketentuan Penggunaan", summary:"Batas penggunaan informasi dan tanggung jawab pengguna.", module:"Resource", type:"Kebijakan", href:publicRoutes.terms },
  { key:"resource-contact", title:"Kontak MineVision", summary:"Kanal proyek yang dapat diverifikasi.", module:"Resource", type:"Halaman", href:publicRoutes.contact },
];

export function normalizedSearchText(value: string) { return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("id-ID"); }
export function matchesSearch(entry: Pick<PublicSearchResult,"title"|"summary"|"type">, query: string) { const needle=normalizedSearchText(query); return normalizedSearchText(`${entry.title} ${entry.summary} ${entry.type}`).includes(needle); }
export function rankSearchResults(items: PublicSearchResult[], query: string) { const needle=normalizedSearchText(query); const seen=new Set<string>(); return items.filter((item)=>{if(seen.has(item.key))return false;seen.add(item.key);return true;}).sort((a,b)=>{ const aTitle=normalizedSearchText(a.title); const bTitle=normalizedSearchText(b.title); const score=(value:string)=>value===needle?0:value.startsWith(needle)?1:value.includes(needle)?2:3; return score(aTitle)-score(bTitle)||a.title.localeCompare(b.title,"id-ID"); }); }
