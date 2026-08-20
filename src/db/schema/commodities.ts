import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

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
    }).references(() => measurementUnits.code, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),

    imageUrl: text("image_url"),

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
    index("commodities_name_idx").on(table.name),

    index("commodities_category_idx").on(table.category),

    index("commodities_intelligence_tracked_idx").on(
      table.isIntelligenceTracked,
    ),

    index("commodities_is_active_idx").on(table.isActive),

    index("commodities_display_order_idx").on(table.displayOrder),
  ],
);

export type Commodity = typeof commodities.$inferSelect;

export type NewCommodity = typeof commodities.$inferInsert;
