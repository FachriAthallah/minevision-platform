import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  numeric,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { commodities } from "./commodities";
import {
  createTimestampColumns,
  dataRecordTypeEnum,
  pricePeriodEnum,
  publicationStatusEnum,
  verificationStatusEnum,
} from "./common";
import { measurementUnits } from "./measurement-units";
import { sources } from "./sources";

export const commodityPriceStandards = pgTable(
  "commodity_price_standards",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    commodityId: uuid("commodity_id")
      .notNull()
      .references(() => commodities.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    code: varchar("code", {
      length: 60,
    })
      .notNull()
      .unique(),

    name: varchar("name", {
      length: 200,
    }).notNull(),

    description: text("description"),

    methodology: text("methodology"),

    defaultCurrencyCode: varchar(
      "default_currency_code",
      {
        length: 3,
      },
    ).notNull(),

    defaultUnitCode: varchar(
      "default_unit_code",
      {
        length: 50,
      },
    )
      .notNull()
      .references(() => measurementUnits.code, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    issuingSourceId: uuid("issuing_source_id")
      .notNull()
      .references(() => sources.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    isActive: boolean("is_active")
      .default(true)
      .notNull(),

    ...createTimestampColumns(),
  },
  (table) => [
    uniqueIndex(
      "commodity_price_standards_commodity_name_idx",
    ).on(table.commodityId, table.name),

    index(
      "commodity_price_standards_commodity_id_idx",
    ).on(table.commodityId),

    index(
      "commodity_price_standards_source_id_idx",
    ).on(table.issuingSourceId),

    index(
      "commodity_price_standards_is_active_idx",
    ).on(table.isActive),

    check(
      "commodity_price_standards_currency_check",
      sql`${table.defaultCurrencyCode} ~ '^[A-Z]{3}$'`,
    ),
  ],
);

export const commodityDomesticPrices = pgTable(
  "commodity_domestic_prices",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    priceStandardId: uuid("price_standard_id")
      .notNull()
      .references(() => commodityPriceStandards.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    effectiveDate: date("effective_date", {
      mode: "string",
    }).notNull(),

    period: pricePeriodEnum("period")
      .default("monthly")
      .notNull(),

    periodLabel: varchar("period_label", {
      length: 100,
    }),

    priceValue: numeric("price_value", {
      precision: 24,
      scale: 6,
    }).notNull(),

    currencyCode: varchar("currency_code", {
      length: 3,
    }).notNull(),

    unitCode: varchar("unit_code", {
      length: 50,
    })
      .notNull()
      .references(() => measurementUnits.code, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    recordType: dataRecordTypeEnum(
      "record_type",
    )
      .default("actual")
      .notNull(),

    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    verificationStatus: verificationStatusEnum(
      "verification_status",
    )
      .default("pending")
      .notNull(),

    publicationStatus: publicationStatusEnum(
      "publication_status",
    )
      .default("draft")
      .notNull(),

    notes: text("notes"),

    ...createTimestampColumns(),
  },
  (table) => [
    uniqueIndex(
      "commodity_domestic_prices_unique_record_idx",
    ).on(
      table.priceStandardId,
      table.effectiveDate,
      table.recordType,
    ),

    index(
      "commodity_domestic_prices_standard_id_idx",
    ).on(table.priceStandardId),

    index(
      "commodity_domestic_prices_effective_date_idx",
    ).on(table.effectiveDate),

    index(
      "commodity_domestic_prices_period_idx",
    ).on(table.period),

    index(
      "commodity_domestic_prices_source_id_idx",
    ).on(table.sourceId),

    index(
      "commodity_domestic_prices_verification_idx",
    ).on(table.verificationStatus),

    index(
      "commodity_domestic_prices_publication_idx",
    ).on(table.publicationStatus),

    check(
      "commodity_domestic_prices_value_check",
      sql`${table.priceValue} >= 0`,
    ),

    check(
      "commodity_domestic_prices_currency_check",
      sql`${table.currencyCode} ~ '^[A-Z]{3}$'`,
    ),
  ],
);

export type CommodityPriceStandard =
  typeof commodityPriceStandards.$inferSelect;

export type NewCommodityPriceStandard =
  typeof commodityPriceStandards.$inferInsert;

export type CommodityDomesticPrice =
  typeof commodityDomesticPrices.$inferSelect;

export type NewCommodityDomesticPrice =
  typeof commodityDomesticPrices.$inferInsert;