import { sql } from "drizzle-orm";
import { boolean, check, index, jsonb, pgPolicy, pgTable, smallint, text, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { anonRole, authenticatedRole } from "drizzle-orm/supabase";
import { commodities } from "./commodities";
import { createTimestampColumns, publicationStatusEnum, verificationStatusEnum } from "./common";
import { measurementUnits } from "./measurement-units";
import { sources } from "./sources";

export type ProductionSeriesMetadata = {
  missingYears?: number[];
  grade?: string | null;
  moistureBasis?: string | null;
  calorificValue?: string | null;
  measurementBasis?: string | null;
  sourceDocument?: string;
};

export const commodityProductionSeries = pgTable("commodity_production_series", {
  id: uuid("id").defaultRandom().primaryKey(),
  commodityId: uuid("commodity_id").notNull().references(() => commodities.id, { onDelete: "restrict", onUpdate: "cascade" }),
  seriesCode: varchar("series_code", { length: 180 }).notNull(),
  name: text("name").notNull(),
  productForm: varchar("product_form", { length: 30 }).notNull(),
  productionScope: varchar("production_scope", { length: 30 }).notNull(),
  // measurement_units has a code PK, not an id column.
  unitCode: varchar("unit_code", { length: 50 }).notNull().references(() => measurementUnits.code, { onDelete: "restrict", onUpdate: "cascade" }),
  specification: text("specification"),
  methodologyNotes: text("methodology_notes"),
  primarySourceId: uuid("primary_source_id").references(() => sources.id, { onDelete: "restrict", onUpdate: "cascade" }),
  isCanonical: boolean("is_canonical").default(false).notNull(),
  isPublicDefault: boolean("is_public_default").default(false).notNull(),
  publicationStatus: publicationStatusEnum("publication_status").default("draft").notNull(),
  verificationStatus: verificationStatusEnum("verification_status").default("pending").notNull(),
  validFromYear: smallint("valid_from_year"),
  validToYear: smallint("valid_to_year"),
  metadata: jsonb("metadata").$type<ProductionSeriesMetadata>().default({}).notNull(),
  ...createTimestampColumns(),
}, (table) => [
  uniqueIndex("production_series_code_unique_idx").on(table.seriesCode),
  uniqueIndex("production_series_identity_unique_idx").on(table.id, table.commodityId, table.unitCode),
  uniqueIndex("production_series_public_default_unique_idx").on(table.commodityId, table.productionScope).where(sql`${table.isPublicDefault} = true`),
  index("production_series_commodity_idx").on(table.commodityId),
  index("production_series_unit_idx").on(table.unitCode),
  index("production_series_source_idx").on(table.primarySourceId),
  check("production_series_code_check", sql`${table.seriesCode} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
  check("production_series_name_check", sql`length(btrim(${table.name})) > 0`),
  check("production_series_form_check", sql`${table.productForm} IN ('coal','ore','concentrate','metal','unclassified')`),
  check("production_series_scope_check", sql`${table.productionScope} IN ('national','province','regency','site')`),
  check("production_series_years_check", sql`(${table.validFromYear} IS NULL OR ${table.validFromYear} BETWEEN 1900 AND 2100) AND (${table.validToYear} IS NULL OR ${table.validToYear} BETWEEN 1900 AND 2100) AND (${table.validFromYear} IS NULL OR ${table.validToYear} IS NULL OR ${table.validFromYear} <= ${table.validToYear})`),
  check("production_series_default_check", sql`NOT ${table.isPublicDefault} OR (${table.isCanonical} AND ${table.productForm} <> 'unclassified' AND ${table.publicationStatus} = 'published' AND ${table.verificationStatus} = 'verified' AND ${table.primarySourceId} IS NOT NULL)`),
  pgPolicy("production_series_public_read", { for: "select", to: [anonRole, authenticatedRole], using: sql`${table.isCanonical} AND ${table.isPublicDefault} AND ${table.publicationStatus} = 'published' AND ${table.verificationStatus} = 'verified' AND EXISTS (SELECT 1 FROM commodities c WHERE c.id = ${table.commodityId} AND c.is_active) AND EXISTS (SELECT 1 FROM sources s WHERE s.id = ${table.primarySourceId} AND s.is_active AND s.verification_status = 'verified')` }),
]).enableRLS();

export type CommodityProductionSeries = typeof commodityProductionSeries.$inferSelect;
export type NewCommodityProductionSeries = typeof commodityProductionSeries.$inferInsert;
