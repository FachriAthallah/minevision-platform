import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  numeric,
  pgPolicy,
  pgTable,
  smallint,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { anonRole, authenticatedRole } from "drizzle-orm/supabase";

import { commodities } from "./commodities";
import {
  createTimestampColumns,
  dataRecordTypeEnum,
  publicationStatusEnum,
  verificationStatusEnum,
} from "./common";
import { measurementUnits } from "./measurement-units";
import { regions } from "./regions";
import { sources } from "./sources";

export const commodityGlobalStatisticSets = pgTable(
  "commodity_global_statistic_sets",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    commodityId: uuid("commodity_id")
      .notNull()
      .references(() => commodities.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    statisticYear: smallint("statistic_year").notNull(),

    metricCode: varchar("metric_code", {
      length: 50,
    }).notNull(),

    basisCode: varchar("basis_code", {
      length: 50,
    }).notNull(),

    unitCode: varchar("unit_code", {
      length: 50,
    }),

    availabilityStatus: varchar("availability_status", {
      length: 30,
    })
      .default("reported")
      .notNull(),

    recordType: dataRecordTypeEnum("record_type").default("actual").notNull(),

    sourceId: uuid("source_id").references(() => sources.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),

    sourceUrl: text("source_url"),

    pageReference: text("page_reference"),

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
      name: "commodity_global_sets_unit_fk",
      columns: [table.unitCode],
      foreignColumns: [measurementUnits.code],
    })
      .onDelete("restrict")
      .onUpdate("cascade"),

    uniqueIndex("commodity_global_statistic_sets_unique_record_idx").on(
      table.commodityId,
      table.statisticYear,
      table.metricCode,
      table.basisCode,
      table.recordType,
    ),

    index("commodity_global_statistic_sets_commodity_id_idx").on(
      table.commodityId,
    ),

    index("commodity_global_statistic_sets_unit_code_idx").on(table.unitCode),

    index("commodity_global_statistic_sets_source_id_idx").on(table.sourceId),

    index("commodity_global_statistic_sets_commodity_year_idx").on(
      table.commodityId,
      table.statisticYear,
    ),

    index("commodity_global_statistic_sets_public_visibility_idx").on(
      table.verificationStatus,
      table.publicationStatus,
    ),

    check(
      "commodity_global_statistic_sets_year_check",
      sql`${table.statisticYear} BETWEEN 1900 AND 2100`,
    ),

    check(
      "commodity_global_statistic_sets_metric_code_check",
      sql`${table.metricCode} IN ('mine_production', 'installed_capacity')`,
    ),

    check(
      "commodity_global_statistic_sets_availability_check",
      sql`${table.availabilityStatus} IN (
        'reported',
        'not_reported',
        'not_applicable',
        'source_unavailable'
      )`,
    ),

    check(
      "commodity_global_statistic_sets_reported_check",
      sql`
        ${table.availabilityStatus} <> 'reported'
        OR (
          ${table.unitCode} IS NOT NULL
          AND ${table.sourceId} IS NOT NULL
        )
      `,
    ),

    check(
      "commodity_global_statistic_sets_source_unavailable_check",
      sql`
        ${table.availabilityStatus} <> 'source_unavailable'
        OR (
          ${table.unitCode} IS NULL
          AND ${table.sourceId} IS NULL
        )
      `,
    ),

    check(
      "commodity_global_statistic_sets_published_check",
      sql`
        ${table.publicationStatus} <> 'published'
        OR ${table.verificationStatus} = 'verified'
      `,
    ),

    check(
      "commodity_global_statistic_sets_source_url_check",
      sql`${table.sourceUrl} IS NULL OR ${table.sourceUrl} ~ '^https://'`,
    ),

    pgPolicy("commodity_global_sets_public_read", {
      as: "permissive",
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`
        ${table.verificationStatus} = 'verified'
        AND ${table.publicationStatus} = 'published'
        AND EXISTS (
          SELECT 1
          FROM "commodities" AS commodity
          WHERE commodity.id = ${table.commodityId}
            AND commodity.is_active = true
        )
        AND (
          (
            ${table.availabilityStatus} = 'source_unavailable'
            AND ${table.sourceId} IS NULL
          )
          OR (
            ${table.availabilityStatus} <> 'source_unavailable'
            AND EXISTS (
              SELECT 1
              FROM "sources" AS source
              WHERE source.id = ${table.sourceId}
                AND source.is_active = true
                AND source.verification_status = 'verified'
            )
          )
        )
      `,
    }),
  ],
).enableRLS();

export const commodityGlobalStatisticEntries = pgTable(
  "commodity_global_statistic_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    statisticSetId: uuid("statistic_set_id")
      .notNull(),

    countryRegionId: uuid("country_region_id")
      .notNull(),

    rank: smallint("rank").notNull(),

    value: numeric("value", {
      precision: 30,
      scale: 6,
    }).notNull(),

    notes: text("notes"),

    ...createTimestampColumns(),
  },
  (table) => [
    foreignKey({
      name: "commodity_global_entries_set_fk",
      columns: [table.statisticSetId],
      foreignColumns: [commodityGlobalStatisticSets.id],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),

    foreignKey({
      name: "commodity_global_entries_country_fk",
      columns: [table.countryRegionId],
      foreignColumns: [regions.id],
    })
      .onDelete("restrict")
      .onUpdate("cascade"),

    uniqueIndex("commodity_global_statistic_entries_country_unique_idx").on(
      table.statisticSetId,
      table.countryRegionId,
    ),

    uniqueIndex("commodity_global_statistic_entries_rank_unique_idx").on(
      table.statisticSetId,
      table.rank,
    ),

    index("commodity_global_statistic_entries_set_id_idx").on(
      table.statisticSetId,
    ),

    index("commodity_global_statistic_entries_country_region_id_idx").on(
      table.countryRegionId,
    ),

    check(
      "commodity_global_statistic_entries_rank_check",
      sql`${table.rank} > 0`,
    ),

    check(
      "commodity_global_statistic_entries_value_check",
      sql`${table.value} >= 0`,
    ),

    pgPolicy("commodity_global_entries_public_read", {
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
            AND statistic_set.availability_status = 'reported'
            AND statistic_set.verification_status = 'verified'
            AND statistic_set.publication_status = 'published'
            AND commodity.is_active = true
        )
      `,
    }),
  ],
).enableRLS();

export type CommodityGlobalStatisticSet =
  typeof commodityGlobalStatisticSets.$inferSelect;

export type NewCommodityGlobalStatisticSet =
  typeof commodityGlobalStatisticSets.$inferInsert;

export type CommodityGlobalStatisticEntry =
  typeof commodityGlobalStatisticEntries.$inferSelect;

export type NewCommodityGlobalStatisticEntry =
  typeof commodityGlobalStatisticEntries.$inferInsert;
