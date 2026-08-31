import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgPolicy,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { anonRole, authenticatedRole } from "drizzle-orm/supabase";

import {
  createTimestampColumns,
  industryCoordinatePrecisionEnum,
  industryOperationSiteStatusEnum,
  industryOperationSiteTypeEnum,
  publicationStatusEnum,
  verificationStatusEnum,
} from "./common";
import { industryCompanies } from "./industry-companies";
import { industryReports } from "./industry-reports";
import { sources } from "./sources";

export const industryOperationSites = pgTable(
  "industry_operation_sites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => industryCompanies.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    name: varchar("name", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    operatorName: varchar("operator_name", { length: 200 }).notNull(),
    siteType: industryOperationSiteTypeEnum("site_type").notNull(),
    currentStatus: industryOperationSiteStatusEnum("current_status").notNull(),
    statusLabel: varchar("status_label", { length: 120 }).notNull(),
    commoditySlugs: text("commodity_slugs").array().notNull(),
    provinceName: varchar("province_name", { length: 160 }).notNull(),
    regencyName: varchar("regency_name", { length: 180 }),
    locationDescription: text("location_description").notNull(),
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),
    coordinatePrecision: industryCoordinatePrecisionEnum(
      "coordinate_precision",
    ),
    displayOrder: integer("display_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    sourceReportId: uuid("source_report_id").references(
      () => industryReports.id,
      {
        onDelete: "set null",
        onUpdate: "cascade",
      },
    ),
    sourceUrl: text("source_url").notNull(),
    pageReference: varchar("page_reference", { length: 80 }),
    verificationStatus: verificationStatusEnum("verification_status")
      .default("pending")
      .notNull(),
    publicationStatus: publicationStatusEnum("publication_status")
      .default("draft")
      .notNull(),
    notes: text("notes"),
    ...createTimestampColumns(),
  },
  (table) => [
    uniqueIndex("industry_operation_sites_company_slug_unique_idx").on(
      table.companyId,
      table.slug,
    ),
    index("industry_operation_sites_company_idx").on(table.companyId),
    index("industry_operation_sites_status_idx").on(table.currentStatus),
    index("industry_operation_sites_type_idx").on(table.siteType),
    index("industry_operation_sites_source_idx").on(table.sourceId),
    index("industry_operation_sites_source_report_idx").on(
      table.sourceReportId,
    ),
    index("industry_operation_sites_public_visibility_idx").on(
      table.isActive,
      table.verificationStatus,
      table.publicationStatus,
    ),
    check(
      "industry_operation_sites_slug_check",
      sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`,
    ),
    check(
      "industry_operation_sites_display_order_check",
      sql`${table.displayOrder} >= 0`,
    ),
    check(
      "industry_operation_sites_commodities_check",
      sql`cardinality(${table.commoditySlugs}) > 0`,
    ),
    check(
      "industry_operation_sites_latitude_check",
      sql`${table.latitude} IS NULL OR ${table.latitude} BETWEEN -90 AND 90`,
    ),
    check(
      "industry_operation_sites_longitude_check",
      sql`${table.longitude} IS NULL OR ${table.longitude} BETWEEN -180 AND 180`,
    ),
    check(
      "industry_operation_sites_coordinate_pair_check",
      sql`
        (
          ${table.latitude} IS NULL
          AND ${table.longitude} IS NULL
          AND ${table.coordinatePrecision} IS NULL
        )
        OR
        (
          ${table.latitude} IS NOT NULL
          AND ${table.longitude} IS NOT NULL
          AND ${table.coordinatePrecision} IS NOT NULL
        )
      `,
    ),
    check(
      "industry_operation_sites_source_url_check",
      sql`${table.sourceUrl} ~ '^https://'`,
    ),
    check(
      "industry_operation_sites_published_check",
      sql`
        ${table.publicationStatus} <> 'published'
        OR (
          ${table.verificationStatus} = 'verified'
          AND ${table.isActive} = true
          AND ${table.latitude} IS NOT NULL
          AND ${table.longitude} IS NOT NULL
          AND ${table.coordinatePrecision} IS NOT NULL
        )
      `,
    ),
    pgPolicy("industry_operation_sites_public_select_policy", {
      as: "permissive",
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`
        ${table.isActive} = true
        AND ${table.verificationStatus} = 'verified'
        AND ${table.publicationStatus} = 'published'
        AND ${table.latitude} IS NOT NULL
        AND ${table.longitude} IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM ${industryCompanies} AS company
          WHERE company.id = ${table.companyId}
            AND company.is_active = true
            AND company.verification_status = 'verified'
            AND company.publication_status = 'published'
        )
      `,
    }),
  ],
).enableRLS();

export type IndustryOperationSite = typeof industryOperationSites.$inferSelect;

export type NewIndustryOperationSite =
  typeof industryOperationSites.$inferInsert;
