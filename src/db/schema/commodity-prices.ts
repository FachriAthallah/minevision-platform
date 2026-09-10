import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  numeric,
  pgTable,
  pgPolicy,
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
    uniqueIndex("price_standard_identity_unique_idx").on(table.id, table.commodityId, table.defaultUnitCode, table.defaultCurrencyCode),
    uniqueIndex("price_standard_commodity_unique_idx").on(
      table.id,
      table.commodityId,
    ),

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

export const commodityPriceSeries = pgTable(
  "commodity_price_series",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    commodityId: uuid("commodity_id")
      .notNull()
      .references(() => commodities.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    priceStandardId: uuid("price_standard_id").notNull(),
    seriesCode: varchar("series_code", { length: 180 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    period: pricePeriodEnum("period").notNull(),
    aggregationMethod: varchar("aggregation_method", { length: 40 }).notNull(),
    primarySourceId: uuid("primary_source_id").references(() => sources.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),
    methodologyNotes: text("methodology_notes"),
    isCanonical: boolean("is_canonical").default(false).notNull(),
    isPublicDefault: boolean("is_public_default").default(false).notNull(),
    publicationStatus: publicationStatusEnum("publication_status")
      .default("draft")
      .notNull(),
    verificationStatus: verificationStatusEnum("verification_status")
      .default("pending")
      .notNull(),
    validFromYear: smallint("valid_from_year"),
    validToYear: smallint("valid_to_year"),
    ...createTimestampColumns(),
  },
  (table) => [
    foreignKey({
      name: "price_series_standard_commodity_fk",
      columns: [table.priceStandardId, table.commodityId],
      foreignColumns: [
        commodityPriceStandards.id,
        commodityPriceStandards.commodityId,
      ],
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    uniqueIndex("price_series_code_unique_idx").on(table.seriesCode),
    uniqueIndex("price_series_identity_unique_idx").on(
      table.id,
      table.commodityId,
      table.priceStandardId,
      table.period,
    ),
    uniqueIndex("price_series_public_default_unique_idx")
      .on(table.commodityId, table.priceStandardId, table.period)
      .where(sql`${table.isPublicDefault} = true`),
    index("price_series_commodity_idx").on(table.commodityId),
    index("price_series_standard_idx").on(table.priceStandardId),
    index("price_series_source_idx").on(table.primarySourceId),
    check(
      "price_series_code_check",
      sql`${table.seriesCode} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`,
    ),
    check(
      "price_series_name_check",
      sql`NULLIF(BTRIM(${table.name}), '') IS NOT NULL`,
    ),
    check(
      "price_series_aggregation_check",
      sql`${table.aggregationMethod} IN ('annual_average','period_value','unclassified')`,
    ),
    check(
      "price_series_years_check",
      sql`(${table.validFromYear} IS NULL OR ${table.validFromYear} BETWEEN 1900 AND 2100)
        AND (${table.validToYear} IS NULL OR ${table.validToYear} BETWEEN 1900 AND 2100)
        AND (${table.validFromYear} IS NULL OR ${table.validToYear} IS NULL OR ${table.validFromYear} <= ${table.validToYear})`,
    ),
    check(
      "price_series_default_check",
      sql`NOT ${table.isPublicDefault} OR ${table.isCanonical}`,
    ),
    check(
      "price_series_publication_check",
      sql`${table.publicationStatus} <> 'published' OR ${table.verificationStatus} = 'verified'`,
    ),
    pgPolicy("price_series_public_read", {
      as: "permissive",
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`${table.isCanonical} = true
        AND ${table.isPublicDefault} = true
        AND ${table.publicationStatus} = 'published'
        AND ${table.verificationStatus} = 'verified'
        AND EXISTS (SELECT 1 FROM commodities c WHERE c.id = ${table.commodityId} AND c.is_active)
        AND EXISTS (SELECT 1 FROM commodity_price_standards ps WHERE ps.id = ${table.priceStandardId} AND ps.is_active)
        AND EXISTS (SELECT 1 FROM sources s WHERE s.id = ${table.primarySourceId} AND s.is_active AND s.verification_status = 'verified')`,
    }),
  ],
).enableRLS();

export const commodityDomesticPrices = pgTable(
  "commodity_domestic_prices",
  {
    commodityId: uuid("commodity_id").notNull().references(() => commodities.id, { onDelete: "restrict", onUpdate: "cascade" }),
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),
    priceSeriesId: uuid("price_series_id").notNull(),

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
      table.priceSeriesId,
      table.effectiveDate,
      table.recordType,
    ),
    foreignKey({
      name: "domestic_price_series_identity_fk",
      columns: [
        table.priceSeriesId,
        table.commodityId,
        table.priceStandardId,
        table.period,
      ],
      foreignColumns: [
        commodityPriceSeries.id,
        commodityPriceSeries.commodityId,
        commodityPriceSeries.priceStandardId,
        commodityPriceSeries.period,
      ],
    })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({ name: "domestic_price_standard_identity_fk", columns: [table.priceStandardId, table.commodityId, table.unitCode, table.currencyCode], foreignColumns: [commodityPriceStandards.id, commodityPriceStandards.commodityId, commodityPriceStandards.defaultUnitCode, commodityPriceStandards.defaultCurrencyCode] }).onDelete("restrict").onUpdate("cascade"),
    index("commodity_domestic_prices_commodity_id_idx").on(table.commodityId),
    index("domestic_prices_series_idx").on(table.priceSeriesId),

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
    pgPolicy("domestic_prices_canonical_read", {
      as: "restrictive",
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`EXISTS (
        SELECT 1 FROM commodity_price_series ps
        WHERE ps.id = ${table.priceSeriesId}
          AND ps.is_canonical = true
          AND ps.is_public_default = true
          AND ps.publication_status = 'published'
          AND ps.verification_status = 'verified'
      )`,
    }),
  ],
).enableRLS();

export type CommodityPriceStandard =
  typeof commodityPriceStandards.$inferSelect;

export type NewCommodityPriceStandard =
  typeof commodityPriceStandards.$inferInsert;

export type CommodityPriceSeries = typeof commodityPriceSeries.$inferSelect;

export type NewCommodityPriceSeries = typeof commodityPriceSeries.$inferInsert;

export type CommodityDomesticPrice =
  typeof commodityDomesticPrices.$inferSelect;

export type NewCommodityDomesticPrice =
  typeof commodityDomesticPrices.$inferInsert;
