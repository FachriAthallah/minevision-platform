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
import { sources } from "./sources";

export const commodityProduction = pgTable(
  "commodity_production",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    commodityId: uuid("commodity_id")
      .notNull()
      .references(() => commodities.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    year: smallint("year").notNull(),

    productionValue: numeric("production_value", {
      precision: 24,
      scale: 6,
    }).notNull(),

    unitCode: varchar("unit_code", {
      length: 50,
    })
      .notNull()
      .references(() => measurementUnits.code, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

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
    uniqueIndex("commodity_production_unique_record_idx").on(
      table.commodityId,
      table.year,
      table.recordType,
    ),

    index("commodity_production_commodity_id_idx").on(table.commodityId),

    index("commodity_production_year_idx").on(table.year),

    index("commodity_production_record_type_idx").on(table.recordType),

    index("commodity_production_source_id_idx").on(table.sourceId),

    index("commodity_production_verification_idx").on(table.verificationStatus),

    index("commodity_production_publication_idx").on(table.publicationStatus),

    check(
      "commodity_production_year_check",
      sql`${table.year} BETWEEN 1900 AND 2100`,
    ),

    check(
      "commodity_production_value_check",
      sql`${table.productionValue} >= 0`,
    ),
  ],
);

export type CommodityProduction = typeof commodityProduction.$inferSelect;

export type NewCommodityProduction = typeof commodityProduction.$inferInsert;
