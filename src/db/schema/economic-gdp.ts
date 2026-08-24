import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  jsonb,
  numeric,
  pgPolicy,
  pgTable,
  pgView,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import {
  createTimestampColumns,
  dataRecordTypeEnum,
  gdpPriceBasisEnum,
  publicationStatusEnum,
  statisticalDataStatusEnum,
  verificationStatusEnum,
} from "./common";
import { regions } from "./regions";
import { sources } from "./sources";

export const economicGdpAnnual = pgTable(
  "economic_gdp_annual",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    regionId: uuid("region_id")
      .notNull()
      .references(() => regions.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    year: smallint("year").notNull(),

    priceBasis: gdpPriceBasisEnum("price_basis")
      .default("current_prices")
      .notNull(),

    baseYear: smallint("base_year"),

    nationalGdpValue: numeric("national_gdp_value", {
      precision: 24,
      scale: 2,
    }).notNull(),

    miningQuarryingGdpValue: numeric("mining_quarrying_gdp_value", {
      precision: 24,
      scale: 2,
    }).notNull(),

    currencyCode: varchar("currency_code", {
      length: 3,
    })
      .default("IDR")
      .notNull(),

    valueScale: varchar("value_scale", {
      length: 20,
    })
      .default("billion")
      .notNull(),

    dataStatus: statisticalDataStatusEnum("data_status")
      .default("final")
      .notNull(),

    recordType: dataRecordTypeEnum("record_type").default("actual").notNull(),

    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    sourcePublishedAt: date("source_published_at"),

    verificationStatus: verificationStatusEnum("verification_status")
      .default("pending")
      .notNull(),

    publicationStatus: publicationStatusEnum("publication_status")
      .default("draft")
      .notNull(),

    notes: text("notes"),

    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),

    ...createTimestampColumns(),
  },
  (table) => [
    unique("economic_gdp_annual_unique").on(
      table.regionId,
      table.year,
      table.priceBasis,
      table.baseYear,
      table.recordType,
    ),

    index("economic_gdp_annual_region_idx").on(table.regionId),

    index("economic_gdp_annual_year_idx").on(table.year),

    index("economic_gdp_annual_price_basis_idx").on(table.priceBasis),

    index("economic_gdp_annual_source_idx").on(table.sourceId),

    index("economic_gdp_annual_verification_idx").on(table.verificationStatus),

    index("economic_gdp_annual_publication_idx").on(table.publicationStatus),

    check(
      "economic_gdp_annual_year_check",
      sql`${table.year} BETWEEN 1900 AND 2100`,
    ),

    check(
      "economic_gdp_annual_base_year_check",
      sql`
        (
          ${table.priceBasis} = 'current_prices'
          AND ${table.baseYear} IS NULL
        )
        OR (
          ${table.priceBasis} = 'constant_prices'
          AND ${table.baseYear} BETWEEN 1900 AND 2100
        )
      `,
    ),

    check(
      "economic_gdp_annual_currency_check",
      sql`${table.currencyCode} ~ '^[A-Z]{3}$'`,
    ),

    check(
      "economic_gdp_annual_value_scale_check",
      sql`
        ${table.valueScale} IN (
          'unit',
          'thousand',
          'million',
          'billion',
          'trillion'
        )
      `,
    ),

    check(
      "economic_gdp_annual_national_value_check",
      sql`${table.nationalGdpValue} >= 0`,
    ),

    check(
      "economic_gdp_annual_mining_value_check",
      sql`${table.miningQuarryingGdpValue} >= 0`,
    ),

    check(
      "economic_gdp_annual_sector_not_above_national_check",
      sql`${table.miningQuarryingGdpValue} <= ${table.nationalGdpValue}`,
    ),

    pgPolicy("public_read_published_verified_gdp", {
      as: "permissive",
      for: "select",
      to: ["anon", "authenticated"],
      using: sql`
        ${table.publicationStatus} = 'published'::publication_status
        AND ${table.verificationStatus} = 'verified'::verification_status
      `,
    }),
  ],
);

export const economicGdpSources = pgTable(
  "economic_gdp_sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    economicGdpId: uuid("economic_gdp_id").notNull(),

    sourceId: uuid("source_id").notNull(),

    citationLabel: text("citation_label"),

    sourceUrl: text("source_url"),

    pageReference: text("page_reference"),

    notes: text("notes"),

    isPrimary: boolean("is_primary").default(false).notNull(),

    ...createTimestampColumns(),
  },
  (table) => [
    foreignKey({
      columns: [table.economicGdpId],
      foreignColumns: [economicGdpAnnual.id],
      name: "economic_gdp_sources_economic_gdp_id_fk",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),

    foreignKey({
      columns: [table.sourceId],
      foreignColumns: [sources.id],
      name: "economic_gdp_sources_source_id_fk",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),

    unique("economic_gdp_sources_unique").on(
      table.economicGdpId,
      table.sourceId,
      table.sourceUrl,
    ),

    index("economic_gdp_sources_gdp_idx").on(table.economicGdpId),

    index("economic_gdp_sources_source_idx").on(table.sourceId),

    pgPolicy("public_read_sources_of_published_gdp", {
      as: "permissive",
      for: "select",
      to: ["anon", "authenticated"],
      using: sql`
        EXISTS (
          SELECT 1
          FROM economic_gdp_annual AS gdp
          WHERE gdp.id = ${table.economicGdpId}
            AND gdp.publication_status =
              'published'::publication_status
            AND gdp.verification_status =
              'verified'::verification_status
        )
      `,
    }),
  ],
);

export const economicGdpAnnualMetrics = pgView("economic_gdp_annual_metrics", {
  id: uuid("id"),

  regionId: uuid("region_id"),

  regionCode: varchar("region_code", {
    length: 30,
  }),

  regionName: varchar("region_name", {
    length: 160,
  }),

  year: smallint("year"),

  priceBasis: gdpPriceBasisEnum("price_basis"),

  baseYear: smallint("base_year"),

  nationalGdpValue: numeric("national_gdp_value", {
    precision: 24,
    scale: 2,
  }),

  miningQuarryingGdpValue: numeric("mining_quarrying_gdp_value", {
    precision: 24,
    scale: 2,
  }),

  currencyCode: varchar("currency_code", {
    length: 3,
  }),

  valueScale: varchar("value_scale", {
    length: 20,
  }),

  contributionPercentage: numeric("contribution_percentage"),

  nominalYoyChangePercentage: numeric("nominal_yoy_change_percentage"),

  dataStatus: statisticalDataStatusEnum("data_status"),

  recordType: dataRecordTypeEnum("record_type"),

  sourceId: uuid("source_id"),

  sourcePublishedAt: date("source_published_at"),

  verificationStatus: verificationStatusEnum("verification_status"),

  publicationStatus: publicationStatusEnum("publication_status"),

  notes: text("notes"),

  metadata: jsonb("metadata").$type<Record<string, unknown>>(),

  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  }),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
  }),
}).with({
  securityInvoker: true,
}).as(sql`
    WITH annual_values AS (
      SELECT
        gdp.*,
        LAG(gdp.mining_quarrying_gdp_value) OVER (
          PARTITION BY
            gdp.region_id,
            gdp.price_basis,
            gdp.base_year,
            gdp.record_type
          ORDER BY gdp.year
        ) AS previous_mining_quarrying_gdp_value
      FROM economic_gdp_annual AS gdp
    )
    SELECT
      annual_values.id,
      annual_values.region_id,
      region.code AS region_code,
      region.name AS region_name,
      annual_values.year,
      annual_values.price_basis,
      annual_values.base_year,
      annual_values.national_gdp_value,
      annual_values.mining_quarrying_gdp_value,
      annual_values.currency_code,
      annual_values.value_scale,
      ROUND(
        annual_values.mining_quarrying_gdp_value
        / NULLIF(annual_values.national_gdp_value, 0)
        * 100,
        4
      ) AS contribution_percentage,
      CASE
        WHEN annual_values.previous_mining_quarrying_gdp_value IS NULL
          THEN NULL::numeric
        ELSE ROUND(
          (
            annual_values.mining_quarrying_gdp_value
            / NULLIF(
              annual_values.previous_mining_quarrying_gdp_value,
              0
            )
            - 1
          ) * 100,
          4
        )
      END AS nominal_yoy_change_percentage,
      annual_values.data_status,
      annual_values.record_type,
      annual_values.source_id,
      annual_values.source_published_at,
      annual_values.verification_status,
      annual_values.publication_status,
      annual_values.notes,
      annual_values.metadata,
      annual_values.created_at,
      annual_values.updated_at
    FROM annual_values
    INNER JOIN regions AS region
      ON region.id = annual_values.region_id
  `);

export type EconomicGdpAnnual = typeof economicGdpAnnual.$inferSelect;

export type NewEconomicGdpAnnual = typeof economicGdpAnnual.$inferInsert;

export type EconomicGdpSource = typeof economicGdpSources.$inferSelect;

export type NewEconomicGdpSource = typeof economicGdpSources.$inferInsert;

export type EconomicGdpAnnualMetric =
  typeof economicGdpAnnualMetrics.$inferSelect;
