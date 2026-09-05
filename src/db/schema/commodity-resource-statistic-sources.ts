import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  pgPolicy,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { anonRole, authenticatedRole } from "drizzle-orm/supabase";

import { commodityResourceStatistics } from "./commodity-resource-statistics";
import { createTimestampColumns } from "./common";
import { sources } from "./sources";

export const commodityResourceStatisticSources = pgTable(
  "commodity_resource_statistic_sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    resourceStatisticId: uuid("resource_statistic_id")
      .notNull(),

    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    sourceRole: varchar("source_role", {
      length: 30,
    }).notNull(),

    citationLabel: text("citation_label"),

    sourceUrl: text("source_url"),

    pageReference: text("page_reference"),

    ...createTimestampColumns(),
  },
  (table) => [
    foreignKey({
      name: "commodity_resource_stat_sources_parent_fk",
      columns: [table.resourceStatisticId],
      foreignColumns: [commodityResourceStatistics.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),

    uniqueIndex("commodity_resource_statistic_sources_unique_reference_idx").on(
      table.resourceStatisticId,
      table.sourceId,
      table.sourceRole,
      sql`COALESCE(${table.citationLabel}, '')`,
      sql`COALESCE(${table.pageReference}, '')`,
    ),

    index("commodity_resource_statistic_sources_parent_idx").on(
      table.resourceStatisticId,
    ),

    index("commodity_resource_statistic_sources_source_id_idx").on(
      table.sourceId,
    ),

    check(
      "commodity_resource_statistic_sources_role_check",
      sql`${table.sourceRole} IN ('supporting', 'cross_check')`,
    ),

    check(
      "commodity_resource_statistic_sources_source_url_check",
      sql`${table.sourceUrl} IS NULL OR ${table.sourceUrl} ~ '^https://'`,
    ),

    pgPolicy("commodity_resource_stat_sources_public_read", {
      as: "permissive",
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`
        EXISTS (
          SELECT 1
          FROM "commodity_resource_statistics" AS statistic
          INNER JOIN "commodities" AS commodity
            ON commodity.id = statistic.commodity_id
          WHERE statistic.id = ${table.resourceStatisticId}
            AND statistic.verification_status = 'verified'
            AND statistic.publication_status = 'published'
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

export type CommodityResourceStatisticSource =
  typeof commodityResourceStatisticSources.$inferSelect;

export type NewCommodityResourceStatisticSource =
  typeof commodityResourceStatisticSources.$inferInsert;
