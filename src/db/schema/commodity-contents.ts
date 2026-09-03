import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgPolicy,
  pgTable,
  primaryKey,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { anonRole, authenticatedRole } from "drizzle-orm/supabase";

import { commodities } from "./commodities";
import { createTimestampColumns } from "./common";
import { contents } from "./content";

export const commodityContents = pgTable(
  "commodity_contents",
  {
    commodityId: uuid("commodity_id")
      .notNull()
      .references(() => commodities.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    contentId: uuid("content_id")
      .notNull()
      .references(() => contents.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    isPrimary: boolean("is_primary").default(false).notNull(),

    displayOrder: integer("display_order").default(0).notNull(),

    ...createTimestampColumns(),
  },
  (table) => [
    primaryKey({
      name: "commodity_contents_pk",
      columns: [table.commodityId, table.contentId],
    }),

    uniqueIndex("commodity_contents_content_id_unique_idx").on(table.contentId),

    uniqueIndex("commodity_contents_one_primary_idx")
      .on(table.commodityId)
      .where(sql`${table.isPrimary} = true`),

    index("commodity_contents_commodity_id_idx").on(table.commodityId),

    index("commodity_contents_display_order_idx").on(
      table.commodityId,
      table.displayOrder,
    ),

    check(
      "commodity_contents_display_order_check",
      sql`${table.displayOrder} >= 0`,
    ),

    pgPolicy("commodity_contents_public_read", {
      as: "permissive",
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`
        EXISTS (
          SELECT 1
          FROM "commodities" AS commodity
          WHERE commodity.id = ${table.commodityId}
            AND commodity.is_active = true
        )
        AND EXISTS (
          SELECT 1
          FROM "contents" AS content
          WHERE content.id = ${table.contentId}
            AND content.module = 'commodities'
            AND content.type = 'commodity_profile'
            AND content.status = 'published'
        )
      `,
    }),
  ],
).enableRLS();

export type CommodityContent = typeof commodityContents.$inferSelect;

export type NewCommodityContent = typeof commodityContents.$inferInsert;
