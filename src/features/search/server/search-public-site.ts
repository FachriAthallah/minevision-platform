import "server-only";
import { educationArticles } from "@/features/education/content/education-content";
import { getPublicCommodities } from "@/features/commodity/server/get-public-commodities";
import { getPublicCareers, searchPublicCareerProfessions } from "@/features/career/server/public-career-queries";
import { getPublicIndustryCompanies } from "@/features/industry/server/get-public-industry-companies";
import { getPublicIndustryReports } from "@/features/industry/server/get-public-industry-reports";
import { getPublicIndustryOperationSites } from "@/features/industry/server/get-public-industry-operation-sites";
import { getPublicProductionOptions } from "@/features/intelligence/server/get-public-production-options";
import { getPublicSmelters } from "@/features/intelligence/server/get-public-smelters";
import { sourceQuerySchema } from "@/features/sources/schemas/source-query";
import { getPublicSources } from "@/features/sources/server/get-public-sources";
import type { PublicSearchQuery } from "../schemas/search-query";
import type { PublicSearchResponse, PublicSearchResult } from "../types";
import { matchesSearch, rankSearchResults, staticSearchEntries } from "../lib/search-index";

export async function searchPublicSite(query: PublicSearchQuery): Promise<PublicSearchResponse> {
  const term=query.q.trim();
  const [commodities, careers, professions, companies, reports, sites, intelligence, smelters, sourceCatalog] = await Promise.all([
    getPublicCommodities({search:term}), getPublicCareers({q:term}), searchPublicCareerProfessions(term), getPublicIndustryCompanies({search:term}), getPublicIndustryReports(), getPublicIndustryOperationSites({}), getPublicProductionOptions(), getPublicSmelters({}), getPublicSources(sourceQuerySchema.parse({q:term,limit:8})),
  ]);
  const education: PublicSearchResult[]=[];
  for(const article of educationArticles){ const aliases=article.slug==="keselamatan-dan-kesehatan-kerja"?" K3":""; const articleEntry={key:`education-${article.slug}`,title:article.title,summary:`${article.summary}${aliases}`,module:"Education" as const,type:article.glossary?"Glosarium":"Materi",href:`/education/${article.slug}`}; if(matchesSearch(articleEntry,term)) education.push(articleEntry); for(const group of article.glossary??[]) for(const entry of group.entries){ const glossary={key:`glossary-${article.slug}-${entry.term}`,title:entry.term,summary:entry.definition,module:"Education" as const,type:"Istilah",href:`/education/${article.slug}#glosarium`}; if(matchesSearch(glossary,term)) education.push(glossary); }}
  const dynamic: PublicSearchResult[]=[
    ...commodities.map((item)=>({key:`commodity-${item.slug}`,title:item.name,summary:item.description??item.profile.excerpt??"Profil komoditas pertambangan.",module:"Commodity" as const,type:"Komoditas",href:`/commodity/${item.slug}`})),
    ...careers.categories.map((item)=>({key:`career-${item.slug}`,title:item.name,summary:item.description??item.excerpt??"Kategori karier pertambangan.",module:"Career" as const,type:"Kategori",href:`/career/${item.slug}`})),
    ...professions.map((item)=>({key:`profession-${item.categorySlug}-${item.slug}`,title:item.name,summary:item.description??`Profesi dalam kategori ${item.categoryName}.`,module:"Career" as const,type:"Profesi",href:`/career/${item.categorySlug}#professions`})),
    ...companies.map((item)=>({key:`company-${item.slug}`,title:item.name,summary:item.description??item.businessField??"Profil perusahaan pertambangan.",module:"Industry" as const,type:"Perusahaan",href:`/industry/${item.slug}`})),
    ...reports.filter((item)=>matchesSearch({title:item.title,summary:item.companyName,type:"Laporan"},term)).map((item)=>({key:`report-${item.id}`,title:item.title,summary:`${item.companyName} · ${item.reportYear}`,module:"Industry" as const,type:"Laporan",href:`/industry/${item.companySlug}#laporan`})),
    ...sites.filter((item)=>matchesSearch({title:item.name,summary:`${item.company.name} ${item.provinceName} ${item.commoditySlugs.join(" ")}`,type:"Wilayah operasi"},term)).map((item)=>({key:`site-${item.id}`,title:item.name,summary:`${item.company.name} · ${item.provinceName}`,module:"Industry" as const,type:"Wilayah operasi",href:`/industry/${item.company.slug}#wilayah-operasi`})),
    ...intelligence.filter((item)=>item.name.toLocaleLowerCase("id-ID").includes(term.toLocaleLowerCase("id-ID"))).map((item)=>({key:`intelligence-${item.slug}`,title:`Intelligence ${item.name}`,summary:"Produksi, harga domestik, dan coverage wilayah kanonik.",module:"Intelligence" as const,type:"Data",href:`/intelligence?commodity=${item.slug}`})),
    ...smelters.filter((item)=>matchesSearch({title:item.name,summary:`${item.operator.name} ${item.location.province} ${item.outputs.map((o)=>o.commodity.name).join(" ")}`,type:"Hilirisasi"},term)).map((item)=>({key:`smelter-${item.slug}`,title:item.name,summary:`${item.operator.name} · ${item.location.province}`,module:"Economy" as const,type:"Hilirisasi",href:"/economy?section=downstream"})),
    ...sourceCatalog.items.map((item)=>({key:`source-${item.slug}`,title:item.name,summary:item.organization,module:"Source" as const,type:"Sumber",href:`/sources?q=${encodeURIComponent(item.name)}`})),
  ];
  const items=rankSearchResults([...education,...staticSearchEntries.filter((entry)=>matchesSearch(entry,term)),...dynamic],term);
  const start=(query.page-1)*query.limit;
  return {items:items.slice(start,start+query.limit),total:items.length,page:query.page,limit:query.limit,pageCount:Math.max(1,Math.ceil(items.length/query.limit)),query:term};
}
