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

import { commodities } from "./commodities";
import {
  createTimestampColumns,
  dataRecordTypeEnum,
  publicationStatusEnum,
  statisticalDataStatusEnum,
  tradeDataAvailabilityEnum,
  verificationStatusEnum,
} from "./common";
import { measurementUnits } from "./measurement-units";
import { regions } from "./regions";
import { sources } from "./sources";

export const minerbaExportsAnnual = pgTable(
  "minerba_exports_annual",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    commodityId: uuid("commodity_id").notNull(),

    originRegionId: uuid("origin_region_id").notNull(),

    destinationRegionId: uuid("destination_region_id"),

    year: smallint("year").notNull(),

    sourceCommodityLabel: varchar("source_commodity_label", {
      length: 160,
    }).notNull(),

    hsCode: varchar("hs_code", {
      length: 20,
    }),

    coverageType: varchar("coverage_type", {
      length: 40,
    })
      .default("destination_country")
      .notNull(),

    exportVolume: numeric("export_volume", {
      precision: 24,
      scale: 6,
    }),

    volumeUnitCode: varchar("volume_unit_code", {
      length: 50,
    }),

    volumeScale: varchar("volume_scale", {
      length: 20,
    }),

    fobValue: numeric("fob_value", {
      precision: 24,
      scale: 6,
    }),

    currencyCode: varchar("currency_code", {
      length: 3,
    })
      .default("USD")
      .notNull(),

    fobValueScale: varchar("fob_value_scale", {
      length: 20,
    }),

    dataAvailability: tradeDataAvailabilityEnum("data_availability")
      .default("reported")
      .notNull(),

    dataStatus: statisticalDataStatusEnum("data_status")
      .default("final")
      .notNull(),

    recordType: dataRecordTypeEnum("record_type").default("actual").notNull(),

    sourceId: uuid("source_id").notNull(),

    sourcePublishedAt: date("source_published_at", {
      mode: "date",
    }),

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
    index("minerba_exports_annual_availability_idx").on(table.dataAvailability),

    index("minerba_exports_annual_commodity_idx").on(table.commodityId),

    index("minerba_exports_annual_destination_idx").on(
      table.destinationRegionId,
    ),

    index("minerba_exports_annual_origin_idx").on(table.originRegionId),

    index("minerba_exports_annual_publication_idx").on(table.publicationStatus),

    index("minerba_exports_annual_source_idx").on(table.sourceId),

    index("minerba_exports_annual_verification_idx").on(
      table.verificationStatus,
    ),

    index("minerba_exports_annual_year_idx").on(table.year),

    foreignKey({
      columns: [table.commodityId],
      foreignColumns: [commodities.id],
      name: "minerba_exports_annual_commodity_id_fk",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),

    foreignKey({
      columns: [table.destinationRegionId],
      foreignColumns: [regions.id],
      name: "minerba_exports_annual_destination_region_id_fk",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),

    foreignKey({
      columns: [table.originRegionId],
      foreignColumns: [regions.id],
      name: "minerba_exports_annual_origin_region_id_fk",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),

    foreignKey({
      columns: [table.sourceId],
      foreignColumns: [sources.id],
      name: "minerba_exports_annual_source_id_fk",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),

    foreignKey({
      columns: [table.volumeUnitCode],
      foreignColumns: [measurementUnits.code],
      name: "minerba_exports_annual_volume_unit_code_fk",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),

    unique("minerba_exports_annual_unique").on(
      table.commodityId,
      table.originRegionId,
      table.destinationRegionId,
      table.year,
      table.hsCode,
      table.recordType,
    ),

    check(
      "minerba_exports_annual_coverage_type_check",
      sql`
        ${table.coverageType} IN (
          'destination_country',
          'national_total'
        )
      `,
    ),

    check(
      "minerba_exports_annual_currency_check",
      sql`${table.currencyCode} ~ '^[A-Z]{3}$'`,
    ),

    check(
      "minerba_exports_annual_fob_check",
      sql`
        ${table.fobValue} IS NULL
        OR ${table.fobValue} >= 0
      `,
    ),

    check(
      "minerba_exports_annual_fob_scale_check",
      sql`
        ${table.fobValueScale} IS NULL
        OR ${table.fobValueScale} IN (
          'unit',
          'thousand',
          'million',
          'billion'
        )
      `,
    ),

    check(
      "minerba_exports_annual_hs_code_check",
      sql`
        ${table.hsCode} IS NULL
        OR ${table.hsCode} ~ '^[0-9]{2,10}$'
      `,
    ),

    check(
      "minerba_exports_annual_not_reported_data_check",
      sql`
        ${table.dataAvailability} <> 'not_reported'
        OR (
          ${table.destinationRegionId} IS NULL
          AND ${table.exportVolume} IS NULL
          AND ${table.volumeUnitCode} IS NULL
          AND ${table.volumeScale} IS NULL
          AND ${table.fobValue} IS NULL
          AND ${table.fobValueScale} IS NULL
        )
      `,
    ),

    check(
      "minerba_exports_annual_reported_data_check",
      sql`
        ${table.dataAvailability} <> 'reported'
        OR (
          ${table.destinationRegionId} IS NOT NULL
          AND ${table.exportVolume} IS NOT NULL
          AND ${table.volumeUnitCode} IS NOT NULL
          AND ${table.volumeScale} IS NOT NULL
          AND ${table.fobValue} IS NOT NULL
          AND ${table.fobValueScale} IS NOT NULL
        )
      `,
    ),

    check(
      "minerba_exports_annual_volume_check",
      sql`
        ${table.exportVolume} IS NULL
        OR ${table.exportVolume} >= 0
      `,
    ),

    check(
      "minerba_exports_annual_volume_scale_check",
      sql`
        ${table.volumeScale} IS NULL
        OR ${table.volumeScale} IN (
          'unit',
          'thousand',
          'million',
          'billion'
        )
      `,
    ),

    check(
      "minerba_exports_annual_year_check",
      sql`${table.year} BETWEEN 1900 AND 2100`,
    ),

    pgPolicy("public_read_published_verified_minerba_exports", {
      as: "permissive",
      for: "select",
      to: ["anon", "authenticated"],
      using: sql`
        ${table.publicationStatus} = 'published'
        AND ${table.verificationStatus} = 'verified'
      `,
    }),
  ],
);

export const minerbaExportSources = pgTable(
  "minerba_export_sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    minerbaExportId: uuid("minerba_export_id").notNull(),

    sourceId: uuid("source_id").notNull(),

    citationLabel: text("citation_label"),

    sourceUrl: text("source_url"),

    pageReference: text("page_reference"),

    notes: text("notes"),

    isPrimary: boolean("is_primary").default(false).notNull(),

    ...createTimestampColumns(),
  },
  (table) => [
    index("minerba_export_sources_export_idx").on(table.minerbaExportId),

    index("minerba_export_sources_source_idx").on(table.sourceId),

    foreignKey({
      columns: [table.minerbaExportId],
      foreignColumns: [minerbaExportsAnnual.id],
      name: "minerba_export_sources_export_id_fk",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),

    foreignKey({
      columns: [table.sourceId],
      foreignColumns: [sources.id],
      name: "minerba_export_sources_source_id_fk",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),

    unique("minerba_export_sources_unique").on(
      table.minerbaExportId,
      table.sourceId,
      table.sourceUrl,
    ),

    pgPolicy("public_read_sources_of_published_minerba_exports", {
      as: "permissive",
      for: "select",
      to: ["anon", "authenticated"],
      using: sql`
        EXISTS (
          SELECT 1
          FROM minerba_exports_annual AS export_record
          WHERE
            export_record.id = minerba_export_id
            AND export_record.publication_status = 'published'
            AND export_record.verification_status = 'verified'
        )
      `,
    }),
  ],
);

export const minerbaExportsAnnualMetrics = pgView(
  "minerba_exports_annual_metrics",
  {
    id: uuid("id"),

    commodityId: uuid("commodity_id"),

    commodityName: varchar("commodity_name", {
      length: 160,
    }),

    commoditySlug: varchar("commodity_slug", {
      length: 180,
    }),

    originRegionId: uuid("origin_region_id"),

    originRegionCode: varchar("origin_region_code", {
      length: 30,
    }),

    originRegionName: varchar("origin_region_name", {
      length: 160,
    }),

    destinationRegionId: uuid("destination_region_id"),

    destinationRegionCode: varchar("destination_region_code", {
      length: 30,
    }),

    destinationRegionName: varchar("destination_region_name", {
      length: 160,
    }),

    year: smallint("year"),

    sourceCommodityLabel: varchar("source_commodity_label", {
      length: 160,
    }),

    hsCode: varchar("hs_code", {
      length: 20,
    }),

    coverageType: varchar("coverage_type", {
      length: 40,
    }),

    exportVolume: numeric("export_volume", {
      precision: 24,
      scale: 6,
    }),

    volumeUnitCode: varchar("volume_unit_code", {
      length: 50,
    }),

    volumeScale: varchar("volume_scale", {
      length: 20,
    }),

    normalizedVolumeMetricTon: numeric("normalized_volume_metric_ton"),

    fobValue: numeric("fob_value", {
      precision: 24,
      scale: 6,
    }),

    currencyCode: varchar("currency_code", {
      length: 3,
    }),

    fobValueScale: varchar("fob_value_scale", {
      length: 20,
    }),

    normalizedFobValueUsd: numeric("normalized_fob_value_usd"),

    averageFobUsdPerMetricTon: numeric("average_fob_usd_per_metric_ton"),

    nominalFobYoyChangePercentage: numeric("nominal_fob_yoy_change_percentage"),

    dataAvailability: tradeDataAvailabilityEnum("data_availability"),

    dataStatus: statisticalDataStatusEnum("data_status"),

    recordType: dataRecordTypeEnum("record_type"),

    sourceId: uuid("source_id"),

    sourcePublishedAt: date("source_published_at", {
      mode: "date",
    }),

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
  },
).with({
  securityInvoker: true,
}).as(sql`
    WITH normalized AS (
      SELECT
        export_record.*,

        CASE export_record.volume_scale
          WHEN 'unit'
            THEN export_record.export_volume
          WHEN 'thousand'
            THEN export_record.export_volume * 1000
          WHEN 'million'
            THEN export_record.export_volume * 1000000
          WHEN 'billion'
            THEN export_record.export_volume * 1000000000
          ELSE NULL::numeric
        END AS normalized_volume_metric_ton,

        CASE export_record.fob_value_scale
          WHEN 'unit'
            THEN export_record.fob_value
          WHEN 'thousand'
            THEN export_record.fob_value * 1000
          WHEN 'million'
            THEN export_record.fob_value * 1000000
          WHEN 'billion'
            THEN export_record.fob_value * 1000000000
          ELSE NULL::numeric
        END AS normalized_fob_value_usd

      FROM minerba_exports_annual AS export_record
    ),

    with_previous AS (
      SELECT
        normalized.*,

        LAG(normalized.normalized_fob_value_usd) OVER (
          PARTITION BY
            normalized.commodity_id,
            normalized.origin_region_id,
            normalized.destination_region_id,
            normalized.hs_code,
            normalized.record_type
          ORDER BY normalized.year
        ) AS previous_fob_value_usd

      FROM normalized
    )

    SELECT
      with_previous.id,
      with_previous.commodity_id,
      commodity.name AS commodity_name,
      commodity.slug AS commodity_slug,
      with_previous.origin_region_id,
      origin_region.code AS origin_region_code,
      origin_region.name AS origin_region_name,
      with_previous.destination_region_id,
      destination_region.code AS destination_region_code,
      destination_region.name AS destination_region_name,
      with_previous.year,
      with_previous.source_commodity_label,
      with_previous.hs_code,
      with_previous.coverage_type,
      with_previous.export_volume,
      with_previous.volume_unit_code,
      with_previous.volume_scale,
      with_previous.normalized_volume_metric_ton,
      with_previous.fob_value,
      with_previous.currency_code,
      with_previous.fob_value_scale,
      with_previous.normalized_fob_value_usd,

      CASE
        WHEN
          with_previous.normalized_volume_metric_ton IS NULL
          OR with_previous.normalized_volume_metric_ton = 0
          THEN NULL::numeric
        ELSE ROUND(
          with_previous.normalized_fob_value_usd
          / with_previous.normalized_volume_metric_ton,
          6
        )
      END AS average_fob_usd_per_metric_ton,

      CASE
        WHEN with_previous.previous_fob_value_usd IS NULL
          THEN NULL::numeric
        ELSE ROUND(
          (
            with_previous.normalized_fob_value_usd
            / NULLIF(with_previous.previous_fob_value_usd, 0)
            - 1
          ) * 100,
          4
        )
      END AS nominal_fob_yoy_change_percentage,

      with_previous.data_availability,
      with_previous.data_status,
      with_previous.record_type,
      with_previous.source_id,
      with_previous.source_published_at,
      with_previous.verification_status,
      with_previous.publication_status,
      with_previous.notes,
      with_previous.metadata,
      with_previous.created_at,
      with_previous.updated_at

    FROM with_previous
    INNER JOIN commodities AS commodity
      ON commodity.id = with_previous.commodity_id
    INNER JOIN regions AS origin_region
      ON origin_region.id = with_previous.origin_region_id
    LEFT JOIN regions AS destination_region
      ON destination_region.id =
        with_previous.destination_region_id
  `);

export type MinerbaExportAnnual = typeof minerbaExportsAnnual.$inferSelect;

export type NewMinerbaExportAnnual = typeof minerbaExportsAnnual.$inferInsert;

export type MinerbaExportSource = typeof minerbaExportSources.$inferSelect;

export type NewMinerbaExportSource = typeof minerbaExportSources.$inferInsert;
