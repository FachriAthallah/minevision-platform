import {
  boolean,
  index,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { commodityProduction } from "./commodity-production";
import { createTimestampColumns } from "./common";
import { sources } from "./sources";

export const commodityProductionSources = pgTable(
  "commodity_production_sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    productionId: uuid("production_id")
      .notNull()
      .references(() => commodityProduction.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    citationLabel: varchar("citation_label", {
      length: 255,
    }).notNull(),

    sourceUrl: text("source_url"),

    pageReference: varchar("page_reference", {
      length: 100,
    }),

    isPrimary: boolean("is_primary").default(false).notNull(),

    ...createTimestampColumns(),
  },
  (table) => [
    uniqueIndex("commodity_production_sources_unique_citation_idx").on(
      table.productionId,
      table.sourceId,
      table.citationLabel,
    ),

    index("commodity_production_sources_production_id_idx").on(
      table.productionId,
    ),

    index("commodity_production_sources_source_id_idx").on(table.sourceId),

    index("commodity_production_sources_primary_idx").on(
      table.productionId,
      table.isPrimary,
    ),
  ],
);

export type CommodityProductionSource =
  typeof commodityProductionSources.$inferSelect;

export type NewCommodityProductionSource =
  typeof commodityProductionSources.$inferInsert;
