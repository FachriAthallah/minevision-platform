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

import { commodityGlobalStatisticSets } from "./commodity-global-statistics";
import { createTimestampColumns } from "./common";
import { sources } from "./sources";

export const commodityGlobalStatisticSetSources = pgTable(
  "commodity_global_statistic_set_sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    statisticSetId: uuid("statistic_set_id")
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
      name: "commodity_global_set_sources_parent_fk",
      columns: [table.statisticSetId],
      foreignColumns: [commodityGlobalStatisticSets.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),

    uniqueIndex(
      "commodity_global_statistic_set_sources_unique_reference_idx",
    ).on(
      table.statisticSetId,
      table.sourceId,
      table.sourceRole,
      sql`COALESCE(${table.citationLabel}, '')`,
      sql`COALESCE(${table.pageReference}, '')`,
    ),

    index("commodity_global_statistic_set_sources_parent_idx").on(
      table.statisticSetId,
    ),

    index("commodity_global_statistic_set_sources_source_id_idx").on(
      table.sourceId,
    ),

    check(
      "commodity_global_statistic_set_sources_role_check",
      sql`${table.sourceRole} IN ('supporting', 'cross_check')`,
    ),

    check(
      "commodity_global_statistic_set_sources_source_url_check",
      sql`${table.sourceUrl} IS NULL OR ${table.sourceUrl} ~ '^https://'`,
    ),

    pgPolicy("commodity_global_set_sources_public_read", {
      as: "permissive",
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`
        EXISTS (
          SELECT 1
          FROM "commodity_global_statistic_sets" AS statistic_set
          INNER JOIN "commodities" AS commodity
            ON commodity.id = statistic_set.commodity_id
          WHERE statistic_set.id = ${table.statisticSetId}
            AND statistic_set.verification_status = 'verified'
            AND statistic_set.publication_status = 'published'
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

export type CommodityGlobalStatisticSetSource =
  typeof commodityGlobalStatisticSetSources.$inferSelect;

export type NewCommodityGlobalStatisticSetSource =
  typeof commodityGlobalStatisticSetSources.$inferInsert;
