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
import { sources } from "./sources";

export const commodityResourceStatistics = pgTable(
  "commodity_resource_statistics",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    commodityId: uuid("commodity_id")
      .notNull()
      .references(() => commodities.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    statisticYear: smallint("statistic_year").notNull(),

    statisticType: varchar("statistic_type", {
      length: 40,
    }).notNull(),

    materialBasis: varchar("material_basis", {
      length: 40,
    }),

    availabilityStatus: varchar("availability_status", {
      length: 30,
    })
      .default("reported")
      .notNull(),

    value: numeric("value", {
      precision: 30,
      scale: 6,
    }),

    unitCode: varchar("unit_code", {
      length: 50,
    }),

    recordType: dataRecordTypeEnum("record_type").default("actual").notNull(),

    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    sourceUrl: text("source_url"),

    pageReference: varchar("page_reference", {
      length: 100,
    }),

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
      name: "commodity_resource_stats_unit_fk",
      columns: [table.unitCode],
      foreignColumns: [measurementUnits.code],
    })
      .onDelete("restrict")
      .onUpdate("cascade"),

    uniqueIndex("commodity_resource_statistics_material_basis_unique_idx")
      .on(
        table.commodityId,
        table.statisticYear,
        table.statisticType,
        table.materialBasis,
        table.recordType,
      )
      .where(sql`${table.materialBasis} IS NOT NULL`),

    uniqueIndex("commodity_resource_statistics_null_basis_unique_idx")
      .on(
        table.commodityId,
        table.statisticYear,
        table.statisticType,
        table.recordType,
      )
      .where(sql`${table.materialBasis} IS NULL`),

    index("commodity_resource_statistics_commodity_id_idx").on(
      table.commodityId,
    ),

    index("commodity_resource_statistics_source_id_idx").on(table.sourceId),

    index("commodity_resource_statistics_unit_code_idx").on(table.unitCode),

    index("commodity_resource_statistics_commodity_year_idx").on(
      table.commodityId,
      table.statisticYear,
    ),

    index("commodity_resource_statistics_public_visibility_idx").on(
      table.verificationStatus,
      table.publicationStatus,
    ),

    check(
      "commodity_resource_statistics_year_check",
      sql`${table.statisticYear} BETWEEN 1900 AND 2100`,
    ),

    check(
      "commodity_resource_statistics_type_check",
      sql`${table.statisticType} IN (
        'reserve',
        'resource',
        'installed_capacity',
        'working_area_count'
      )`,
    ),

    check(
      "commodity_resource_statistics_material_basis_check",
      sql`${table.materialBasis} IS NULL
        OR ${table.materialBasis} IN (
          'ore',
          'contained_metal',
          'alumina',
          'raw_material',
          'energy_capacity'
        )`,
    ),

    check(
      "commodity_resource_statistics_availability_check",
      sql`${table.availabilityStatus} IN (
        'reported',
        'not_reported',
        'not_applicable'
      )`,
    ),

    check(
      "commodity_resource_statistics_value_state_check",
      sql`
        (
          ${table.availabilityStatus} = 'reported'
          AND ${table.value} IS NOT NULL
          AND ${table.unitCode} IS NOT NULL
        )
        OR
        (
          ${table.availabilityStatus} IN ('not_reported', 'not_applicable')
          AND ${table.value} IS NULL
          AND ${table.unitCode} IS NULL
        )
      `,
    ),

    check(
      "commodity_resource_statistics_value_check",
      sql`${table.value} IS NULL OR ${table.value} >= 0`,
    ),

    check(
      "commodity_resource_statistics_working_area_count_check",
      sql`
        ${table.statisticType} <> 'working_area_count'
        OR ${table.availabilityStatus} <> 'reported'
        OR ${table.value} = TRUNC(${table.value})
      `,
    ),

    check(
      "commodity_resource_statistics_published_check",
      sql`
        ${table.publicationStatus} <> 'published'
        OR ${table.verificationStatus} = 'verified'
      `,
    ),

    check(
      "commodity_resource_statistics_source_url_check",
      sql`${table.sourceUrl} IS NULL OR ${table.sourceUrl} ~ '^https://'`,
    ),

    pgPolicy("commodity_resource_stats_public_read", {
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

export type CommodityResourceStatistic =
  typeof commodityResourceStatistics.$inferSelect;

export type NewCommodityResourceStatistic =
  typeof commodityResourceStatistics.$inferInsert;
