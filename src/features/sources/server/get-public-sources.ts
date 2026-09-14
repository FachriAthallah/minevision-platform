import "server-only";

import { sql } from "drizzle-orm";
import { db } from "@/db";
import type { SourceQuery } from "../schemas/source-query";
import type { PublicSourceCatalog, PublicSourceItem, PublicSourceModule, PublicSourceType } from "../types";

type SourceRow = Omit<PublicSourceItem, "modules" | "verifiedAt"> & { verifiedAt: Date | string | null; modules: PublicSourceModule[] };

export async function getPublicSources(query: SourceQuery): Promise<PublicSourceCatalog> {
  const rows = await db.execute(sql<SourceRow>`
    WITH public_usage AS (
      SELECT cs.source_id, CASE c.module
        WHEN 'commodities' THEN 'commodity' ELSE c.module::text END AS module
      FROM content_sources cs JOIN contents c ON c.id = cs.content_id
      WHERE c.status = 'published'
      UNION SELECT gs.source_id, 'economy' FROM economic_gdp_sources gs JOIN economic_gdp_annual g ON g.id = gs.economic_gdp_id WHERE g.verification_status='verified' AND g.publication_status='published'
      UNION SELECT ms.source_id, 'economy' FROM mining_investment_sources ms JOIN mining_investment_annual m ON m.id = ms.mining_investment_id WHERE m.verification_status='verified' AND m.publication_status='published'
      UNION SELECT es.source_id, 'economy' FROM minerba_export_sources es JOIN minerba_exports_annual e ON e.id = es.minerba_export_id WHERE e.verification_status='verified' AND e.publication_status='published'
      UNION SELECT sfs.source_id, 'economy' FROM smelter_facility_sources sfs JOIN smelter_facilities sf ON sf.id=sfs.facility_id WHERE sfs.source_id IS NOT NULL AND sf.is_active AND sf.verification_status='verified' AND sf.publication_status='published'
      UNION SELECT cp.source_id, 'commodity' FROM commodity_producers cp WHERE cp.is_active AND cp.verification_status='verified' AND cp.publication_status='published'
      UNION SELECT cps.source_id, 'intelligence' FROM commodity_production_sources cps JOIN commodity_production p ON p.id=cps.production_id JOIN commodity_production_series ps ON ps.id=p.series_id WHERE p.verification_status='verified' AND p.publication_status='published' AND ps.is_canonical AND ps.is_public_default AND ps.verification_status='verified' AND ps.publication_status='published'
      UNION SELECT dp.source_id, 'intelligence' FROM commodity_domestic_prices dp JOIN commodity_price_series ps ON ps.id=dp.price_series_id WHERE dp.source_id IS NOT NULL AND dp.verification_status='verified' AND dp.publication_status='published' AND ps.is_canonical AND ps.is_public_default AND ps.verification_status='verified' AND ps.publication_status='published'
      UNION SELECT rc.source_id, 'intelligence' FROM commodity_region_coverage rc WHERE rc.verification_status='verified' AND rc.publication_status='published'
      UNION SELECT pl.source_id, 'intelligence' FROM commodity_production_locations pl WHERE pl.verification_status='verified' AND pl.publication_status='published'
      UNION SELECT ios.source_id, 'industry' FROM industry_operation_sites ios JOIN industry_companies ic ON ic.id=ios.company_id WHERE ios.is_active AND ios.verification_status='verified' AND ios.publication_status='published' AND ic.is_active AND ic.verification_status='verified' AND ic.publication_status='published'
      UNION SELECT ip.source_id, 'industry' FROM industry_company_production ip JOIN industry_companies ic ON ic.id=ip.company_id WHERE ip.verification_status='verified' AND ip.publication_status='published' AND ic.is_active AND ic.verification_status='verified' AND ic.publication_status='published'
      UNION SELECT inf.source_id, 'industry' FROM industry_company_financials inf JOIN industry_companies ic ON ic.id=inf.company_id WHERE inf.verification_status='verified' AND inf.publication_status='published' AND ic.is_active AND ic.verification_status='verified' AND ic.publication_status='published'
    ), grouped AS (
      SELECT source_id, array_agg(DISTINCT module ORDER BY module) AS modules FROM public_usage GROUP BY source_id
    )
    SELECT s.name, s.slug, s.organization, s.type, s.url, s.description,
      s.is_official AS "isOfficial", s.verified_at AS "verifiedAt", g.modules
    FROM sources s JOIN grouped g ON g.source_id=s.id
    WHERE s.is_active=true AND s.verification_status='verified' AND s.url IS NOT NULL AND s.url ~ '^https://'
    ORDER BY s.organization, s.name
  `);
  const rawRows = Array.from(rows) as unknown as SourceRow[];
  const all: PublicSourceItem[] = rawRows.map((row) => ({ ...row, verifiedAt: row.verifiedAt instanceof Date ? row.verifiedAt.toISOString() : row.verifiedAt }));
  const normalizedQuery = query.q?.toLocaleLowerCase("id-ID") ?? "";
  const normalizedPublisher = query.publisher?.toLocaleLowerCase("id-ID") ?? "";
  const filtered = all.filter((source) =>
    (!normalizedQuery || `${source.name} ${source.organization} ${source.description ?? ""}`.toLocaleLowerCase("id-ID").includes(normalizedQuery)) &&
    (!normalizedPublisher || source.organization.toLocaleLowerCase("id-ID") === normalizedPublisher) &&
    (!query.type || source.type === query.type) &&
    (!query.module || source.modules.includes(query.module)),
  );
  const start = (query.page - 1) * query.limit;
  return {
    items: filtered.slice(start, start + query.limit), total: filtered.length, page: query.page, limit: query.limit,
    pageCount: Math.max(1, Math.ceil(filtered.length / query.limit)),
    filters: {
      publishers: [...new Set(all.map((source) => source.organization))].sort((a, b) => a.localeCompare(b, "id-ID")),
      types: [...new Set(all.map((source) => source.type))].sort() as PublicSourceType[],
      modules: [...new Set(all.flatMap((source) => source.modules))].sort() as PublicSourceModule[],
    },
  };
}
