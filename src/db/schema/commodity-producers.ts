import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  pgPolicy,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { anonRole, authenticatedRole } from "drizzle-orm/supabase";

import { commodities } from "./commodities";
import {
  createTimestampColumns,
  publicationStatusEnum,
  verificationStatusEnum,
} from "./common";
import { industryCompanies } from "./industry-companies";
import { regions } from "./regions";
import { sources } from "./sources";

export const commodityProducers = pgTable(
  "commodity_producers",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    commodityId: uuid("commodity_id")
      .notNull()
      .references(() => commodities.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    industryCompanyId: uuid("industry_company_id"),

    producerKey: varchar("producer_key", {
      length: 180,
    }).notNull(),

    companyName: varchar("company_name", {
      length: 200,
    }).notNull(),

    operationArea: text("operation_area").notNull(),

    primaryRegionId: uuid("primary_region_id").references(() => regions.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),

    producerRole: varchar("producer_role", {
      length: 60,
    }),

    displayOrder: integer("display_order").default(0).notNull(),

    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    sourceUrl: text("source_url").notNull(),

    pageReference: text("page_reference"),

    isActive: boolean("is_active").default(true).notNull(),

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
    foreignKey({
      name: "commodity_producers_industry_company_fk",
      columns: [table.industryCompanyId],
      foreignColumns: [industryCompanies.id],
    })
      .onDelete("set null")
      .onUpdate("cascade"),

    uniqueIndex("commodity_producers_commodity_key_unique_idx").on(
      table.commodityId,
      table.producerKey,
    ),

    index("commodity_producers_commodity_id_idx").on(table.commodityId),

    index("commodity_producers_industry_company_id_idx").on(
      table.industryCompanyId,
    ),

    index("commodity_producers_primary_region_id_idx").on(
      table.primaryRegionId,
    ),

    index("commodity_producers_source_id_idx").on(table.sourceId),

    index("commodity_producers_display_order_idx").on(
      table.commodityId,
      table.displayOrder,
    ),

    index("commodity_producers_public_visibility_idx").on(
      table.verificationStatus,
      table.publicationStatus,
      table.isActive,
    ),

    check(
      "commodity_producers_producer_key_check",
      sql`NULLIF(BTRIM(${table.producerKey}), '') IS NOT NULL`,
    ),

    check(
      "commodity_producers_company_name_check",
      sql`NULLIF(BTRIM(${table.companyName}), '') IS NOT NULL`,
    ),

    check(
      "commodity_producers_operation_area_check",
      sql`NULLIF(BTRIM(${table.operationArea}), '') IS NOT NULL`,
    ),

    check(
      "commodity_producers_source_url_check",
      sql`NULLIF(BTRIM(${table.sourceUrl}), '') IS NOT NULL
        AND ${table.sourceUrl} ~ '^https://'`,
    ),

    check(
      "commodity_producers_display_order_check",
      sql`${table.displayOrder} >= 0`,
    ),

    check(
      "commodity_producers_published_check",
      sql`
        ${table.publicationStatus} <> 'published'
        OR (
          ${table.verificationStatus} = 'verified'
          AND ${table.isActive} = true
        )
      `,
    ),

    pgPolicy("commodity_producers_public_read", {
      as: "permissive",
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`
        ${table.isActive} = true
        AND ${table.verificationStatus} = 'verified'
        AND ${table.publicationStatus} = 'published'
        AND EXISTS (
          SELECT 1
          FROM "commodities" AS commodity
          WHERE commodity.id = ${table.commodityId}
            AND commodity.is_active = true
        )
        AND EXISTS (
          SELECT 1
          FROM "sources" AS source
          WHERE source.id = ${table.sourceId}
            AND source.is_active = true
            AND source.verification_status = 'verified'
        )
      `,
    }),
  ],
).enableRLS();

export type CommodityProducer = typeof commodityProducers.$inferSelect;

export type NewCommodityProducer = typeof commodityProducers.$inferInsert;
