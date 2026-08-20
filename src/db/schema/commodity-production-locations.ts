import { sql } from "drizzle-orm";
import {
  check,
  index,
  numeric,
  pgTable,
  smallint,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

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

export const commodityProductionLocations = pgTable(
  "commodity_production_locations",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    commodityId: uuid("commodity_id")
      .notNull()
      .references(() => commodities.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    regionId: uuid("region_id")
      .notNull()
      .references(() => regions.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    year: smallint("year").notNull(),

    productionValue: numeric("production_value", {
      precision: 24,
      scale: 6,
    }),

    unitCode: varchar("unit_code", {
      length: 50,
    }).references(() => measurementUnits.code, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),

    sharePercentage: numeric("share_percentage", {
      precision: 7,
      scale: 4,
    }),

    producerRank: smallint("producer_rank"),

    recordType: dataRecordTypeEnum("record_type").default("actual").notNull(),

    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
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
    uniqueIndex("commodity_production_locations_unique_idx").on(
      table.commodityId,
      table.regionId,
      table.year,
      table.recordType,
    ),

    index("commodity_production_locations_commodity_idx").on(table.commodityId),

    index("commodity_production_locations_region_idx").on(table.regionId),

    index("commodity_production_locations_year_idx").on(table.year),

    index("commodity_production_locations_source_idx").on(table.sourceId),

    index("commodity_production_locations_verification_idx").on(
      table.verificationStatus,
    ),

    index("commodity_production_locations_publication_idx").on(
      table.publicationStatus,
    ),

    check(
      "commodity_production_locations_year_check",
      sql`${table.year} BETWEEN 1900 AND 2100`,
    ),

    check(
      "commodity_production_locations_value_check",
      sql`
          ${table.productionValue} IS NULL
          OR ${table.productionValue} >= 0
        `,
    ),

    check(
      "commodity_production_locations_share_check",
      sql`
          ${table.sharePercentage} IS NULL
          OR (
            ${table.sharePercentage} >= 0
            AND ${table.sharePercentage} <= 100
          )
        `,
    ),

    check(
      "commodity_production_locations_rank_check",
      sql`
          ${table.producerRank} IS NULL
          OR ${table.producerRank} > 0
        `,
    ),

    check(
      "commodity_production_locations_unit_check",
      sql`
          ${table.productionValue} IS NULL
          OR ${table.unitCode} IS NOT NULL
        `,
    ),

    check(
      "commodity_production_locations_data_check",
      sql`
          ${table.productionValue} IS NOT NULL
          OR ${table.producerRank} IS NOT NULL
          OR ${table.sharePercentage} IS NOT NULL
        `,
    ),
  ],
);

export type CommodityProductionLocation =
  typeof commodityProductionLocations.$inferSelect;

export type NewCommodityProductionLocation =
  typeof commodityProductionLocations.$inferInsert;
