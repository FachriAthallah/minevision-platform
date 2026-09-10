import { sql } from "drizzle-orm";
import { check, foreignKey, index, numeric, pgPolicy, pgTable, smallint, text, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { anonRole, authenticatedRole } from "drizzle-orm/supabase";
import { commodities } from "./commodities";
import { createTimestampColumns, publicationStatusEnum, verificationStatusEnum } from "./common";
import { regions } from "./regions";
import { measurementUnits } from "./measurement-units";
import { sources } from "./sources";
import { industryCompanies } from "./industry-companies";

export const commodityRegionCoverage = pgTable("commodity_region_coverage", {
  id: uuid("id").defaultRandom().primaryKey(),
  commodityId: uuid("commodity_id").notNull().references(() => commodities.id, { onDelete: "restrict", onUpdate: "cascade" }),
  regionId: uuid("region_id").notNull().references(() => regions.id, { onDelete: "restrict", onUpdate: "cascade" }),
  coverageType: varchar("coverage_type", { length: 30 }).notNull(),
  productionValue: numeric("production_value", { precision: 24, scale: 6 }),
  productionYear: smallint("production_year"),
  unitCode: varchar("unit_code", { length: 50 }).references(() => measurementUnits.code, { onDelete: "restrict", onUpdate: "cascade" }),
  rank: smallint("rank"),
  rankingStatus: varchar("ranking_status", { length: 30 }).default("unavailable").notNull(),
  rankingEvidence: text("ranking_evidence"),
  relatedCompanyId: uuid("related_company_id"),
  relatedCompanyName: text("related_company_name"),
  sourceId: uuid("source_id").references(() => sources.id, { onDelete: "restrict", onUpdate: "cascade" }),
  sourceUrl: text("source_url"),
  verificationStatus: verificationStatusEnum("verification_status").default("pending").notNull(),
  publicationStatus: publicationStatusEnum("publication_status").default("draft").notNull(),
  notes: text("notes"),
  ...createTimestampColumns(),
}, (table) => [
  foreignKey({ name: "region_coverage_company_fk", columns: [table.relatedCompanyId], foreignColumns: [industryCompanies.id] }).onDelete("set null").onUpdate("cascade"),
  uniqueIndex("region_coverage_commodity_region_unique_idx").on(table.commodityId, table.regionId),
  index("region_coverage_region_idx").on(table.regionId),
  index("region_coverage_source_idx").on(table.sourceId),
  index("region_coverage_unit_idx").on(table.unitCode),
  index("region_coverage_company_idx").on(table.relatedCompanyId),
  check("region_coverage_type_check", sql`${table.coverageType} IN ('primary','secondary','known_occurrence','historical')`),
  check("region_coverage_ranking_check", sql`${table.rankingStatus} IN ('verified','unverified','unavailable') AND ((${table.rankingStatus} = 'verified' AND ${table.rank} > 0 AND ${table.rank} IS NOT NULL AND ${table.productionValue} IS NOT NULL AND ${table.productionYear} IS NOT NULL AND ${table.unitCode} IS NOT NULL AND NULLIF(btrim(${table.rankingEvidence}), '') IS NOT NULL) OR (${table.rankingStatus} <> 'verified' AND ${table.rank} IS NULL))`),
  check("region_coverage_value_check", sql`${table.productionValue} IS NULL OR (${table.productionValue} >= 0 AND ${table.productionYear} IS NOT NULL AND ${table.unitCode} IS NOT NULL)`),
  check("region_coverage_year_check", sql`${table.productionYear} IS NULL OR ${table.productionYear} BETWEEN 1900 AND 2100`),
  check("region_coverage_verified_check", sql`${table.verificationStatus} <> 'verified' OR ${table.sourceId} IS NOT NULL`),
  check("region_coverage_publication_check", sql`${table.publicationStatus} <> 'published' OR ${table.verificationStatus} = 'verified'`),
  check("region_coverage_url_check", sql`${table.sourceUrl} IS NULL OR ${table.sourceUrl} ~ '^https://'`),
  pgPolicy("region_coverage_public_read", { for: "select", to: [anonRole, authenticatedRole], using: sql`${table.verificationStatus} = 'verified' AND ${table.publicationStatus} = 'published' AND EXISTS (SELECT 1 FROM commodities c WHERE c.id = ${table.commodityId} AND c.is_active) AND EXISTS (SELECT 1 FROM regions r WHERE r.id = ${table.regionId} AND r.is_active) AND EXISTS (SELECT 1 FROM sources s WHERE s.id = ${table.sourceId} AND s.is_active AND s.verification_status = 'verified')` }),
]).enableRLS();
export type CommodityRegionCoverage = typeof commodityRegionCoverage.$inferSelect;
export type NewCommodityRegionCoverage = typeof commodityRegionCoverage.$inferInsert;
