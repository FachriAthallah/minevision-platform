import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { anonRole, authenticatedRole } from "drizzle-orm/supabase";

import { commodityCategoryEnum, createTimestampColumns } from "./common";
import { measurementUnits } from "./measurement-units";

export const commodities = pgTable(
  "commodities",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: varchar("name", {
      length: 160,
    }).notNull(),

    slug: varchar("slug", {
      length: 180,
    })
      .notNull()
      .unique(),

    symbol: varchar("symbol", {
      length: 30,
    }),

    category: commodityCategoryEnum("category").notNull(),

    description: text("description"),

    specification: text("specification"),

    defaultProductionUnitCode: varchar("default_production_unit_code", {
      length: 50,
    }),

    imageUrl: text("image_url"),

    imageAlt: text("image_alt"),

    imageCredit: text("image_credit"),

    imageSourceUrl: text("image_source_url"),

    isIntelligenceTracked: boolean("is_intelligence_tracked")
      .default(false)
      .notNull(),

    displayOrder: integer("display_order").default(0).notNull(),

    isActive: boolean("is_active").default(true).notNull(),

    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),

    ...createTimestampColumns(),
  },
  (table) => [
    foreignKey({
      name: "commodities_default_prod_unit_fk",
      columns: [table.defaultProductionUnitCode],
      foreignColumns: [measurementUnits.code],
    })
      .onDelete("restrict")
      .onUpdate("cascade"),

    index("commodities_name_idx").on(table.name),

    index("commodities_category_idx").on(table.category),

    index("commodities_intelligence_tracked_idx").on(
      table.isIntelligenceTracked,
    ),

    index("commodities_is_active_idx").on(table.isActive),

    index("commodities_display_order_idx").on(table.displayOrder),

    check(
      "commodities_image_alt_check",
      sql`${table.imageAlt} IS NULL
        OR NULLIF(BTRIM(${table.imageAlt}), '') IS NOT NULL`,
    ),

    check(
      "commodities_image_credit_check",
      sql`${table.imageCredit} IS NULL
        OR NULLIF(BTRIM(${table.imageCredit}), '') IS NOT NULL`,
    ),

    check(
      "commodities_image_source_url_check",
      sql`${table.imageSourceUrl} IS NULL
        OR ${table.imageSourceUrl} ~ '^https://'`,
    ),

    pgPolicy("commodities_public_read", {
      as: "permissive",
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`${table.isActive} = true`,
    }),
  ],
).enableRLS();

export type Commodity = typeof commodities.$inferSelect;

export type NewCommodity = typeof commodities.$inferInsert;
