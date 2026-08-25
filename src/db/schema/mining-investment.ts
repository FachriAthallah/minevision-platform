import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
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
  investmentOriginTypeEnum,
  publicationStatusEnum,
  statisticalDataStatusEnum,
  verificationStatusEnum,
} from "./common";
import { regions } from "./regions";
import { sources } from "./sources";

export const miningInvestmentAnnual = pgTable(
  "mining_investment_annual",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    regionId: uuid("region_id").notNull(),

    year: smallint("year").notNull(),

    sectorCode: varchar("sector_code", {
      length: 50,
    })
      .default("mining")
      .notNull(),

    sectorName: varchar("sector_name", {
      length: 160,
    })
      .default("Pertambangan")
      .notNull(),

    investmentOrigin: investmentOriginTypeEnum("investment_origin").notNull(),

    investmentValue: numeric("investment_value", {
      precision: 24,
      scale: 6,
    }).notNull(),

    currencyCode: varchar("currency_code", {
      length: 3,
    })
      .default("IDR")
      .notNull(),

    valueScale: varchar("value_scale", {
      length: 20,
    })
      .default("trillion")
      .notNull(),

    projectCount: integer("project_count"),

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
    index("mining_investment_annual_origin_idx").on(table.investmentOrigin),

    index("mining_investment_annual_publication_idx").on(
      table.publicationStatus,
    ),

    index("mining_investment_annual_region_idx").on(table.regionId),

    index("mining_investment_annual_source_idx").on(table.sourceId),

    index("mining_investment_annual_verification_idx").on(
      table.verificationStatus,
    ),

    index("mining_investment_annual_year_idx").on(table.year),

    foreignKey({
      columns: [table.regionId],
      foreignColumns: [regions.id],
      name: "mining_investment_annual_region_id_fk",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),

    foreignKey({
      columns: [table.sourceId],
      foreignColumns: [sources.id],
      name: "mining_investment_annual_source_id_fk",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),

    unique("mining_investment_annual_unique").on(
      table.regionId,
      table.year,
      table.sectorCode,
      table.investmentOrigin,
      table.recordType,
    ),

    check(
      "mining_investment_annual_currency_check",
      sql`${table.currencyCode} ~ '^[A-Z]{3}$'`,
    ),

    check(
      "mining_investment_annual_project_count_check",
      sql`
        ${table.projectCount} IS NULL
        OR ${table.projectCount} >= 0
      `,
    ),

    check(
      "mining_investment_annual_sector_code_check",
      sql`${table.sectorCode} ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'`,
    ),

    check(
      "mining_investment_annual_value_check",
      sql`${table.investmentValue} >= 0`,
    ),

    check(
      "mining_investment_annual_value_scale_check",
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
      "mining_investment_annual_year_check",
      sql`${table.year} BETWEEN 1900 AND 2100`,
    ),

    pgPolicy("public_read_published_verified_mining_investment", {
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

export const miningInvestmentSources = pgTable(
  "mining_investment_sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    miningInvestmentId: uuid("mining_investment_id").notNull(),

    sourceId: uuid("source_id").notNull(),

    citationLabel: text("citation_label"),

    sourceUrl: text("source_url"),

    pageReference: text("page_reference"),

    notes: text("notes"),

    isPrimary: boolean("is_primary").default(false).notNull(),

    ...createTimestampColumns(),
  },
  (table) => [
    index("mining_investment_sources_investment_idx").on(
      table.miningInvestmentId,
    ),

    index("mining_investment_sources_source_idx").on(table.sourceId),

    foreignKey({
      columns: [table.miningInvestmentId],
      foreignColumns: [miningInvestmentAnnual.id],
      name: "mining_investment_sources_investment_id_fk",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),

    foreignKey({
      columns: [table.sourceId],
      foreignColumns: [sources.id],
      name: "mining_investment_sources_source_id_fk",
    })
      .onUpdate("cascade")
      .onDelete("restrict"),

    unique("mining_investment_sources_unique").on(
      table.miningInvestmentId,
      table.sourceId,
      table.sourceUrl,
    ),

    pgPolicy("public_read_sources_of_published_mining_investment", {
      as: "permissive",
      for: "select",
      to: ["anon", "authenticated"],
      using: sql`
        EXISTS (
          SELECT 1
          FROM mining_investment_annual AS investment
          WHERE
            investment.id = mining_investment_id
            AND investment.publication_status = 'published'
            AND investment.verification_status = 'verified'
        )
      `,
    }),
  ],
);

export const miningInvestmentAnnualMetrics = pgView(
  "mining_investment_annual_metrics",
  {
    id: uuid("id"),

    regionId: uuid("region_id"),

    regionCode: varchar("region_code", {
      length: 30,
    }),

    regionName: varchar("region_name", {
      length: 160,
    }),

    year: smallint("year"),

    sectorCode: varchar("sector_code", {
      length: 50,
    }),

    sectorName: varchar("sector_name", {
      length: 160,
    }),

    investmentOrigin: investmentOriginTypeEnum("investment_origin"),

    investmentValue: numeric("investment_value", {
      precision: 24,
      scale: 6,
    }),

    currencyCode: varchar("currency_code", {
      length: 3,
    }),

    valueScale: varchar("value_scale", {
      length: 20,
    }),

    projectCount: integer("project_count"),

    annualTotalInvestmentValue: numeric("annual_total_investment_value"),

    annualTotalProjectCount: bigint("annual_total_project_count", {
      mode: "number",
    }),

    annualValueSharePercentage: numeric("annual_value_share_percentage"),

    nominalYoyChangePercentage: numeric("nominal_yoy_change_percentage"),

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
    WITH row_metrics AS (
      SELECT
        investment.id,
        investment.region_id,
        investment.year,
        investment.sector_code,
        investment.sector_name,
        investment.investment_origin,
        investment.investment_value,
        investment.currency_code,
        investment.value_scale,
        investment.project_count,
        investment.data_status,
        investment.record_type,
        investment.source_id,
        investment.source_published_at,
        investment.verification_status,
        investment.publication_status,
        investment.notes,
        investment.metadata,
        investment.created_at,
        investment.updated_at,

        LAG(investment.investment_value) OVER (
          PARTITION BY
            investment.region_id,
            investment.sector_code,
            investment.investment_origin,
            investment.currency_code,
            investment.value_scale,
            investment.record_type
          ORDER BY investment.year
        ) AS previous_investment_value,

        SUM(investment.investment_value) OVER (
          PARTITION BY
            investment.region_id,
            investment.year,
            investment.sector_code,
            investment.currency_code,
            investment.value_scale,
            investment.record_type
        ) AS annual_total_investment_value,

        SUM(investment.project_count) OVER (
          PARTITION BY
            investment.region_id,
            investment.year,
            investment.sector_code,
            investment.record_type
        ) AS annual_total_project_count

      FROM mining_investment_annual AS investment
    )

    SELECT
      row_metrics.id,
      row_metrics.region_id,
      region.code AS region_code,
      region.name AS region_name,
      row_metrics.year,
      row_metrics.sector_code,
      row_metrics.sector_name,
      row_metrics.investment_origin,
      row_metrics.investment_value,
      row_metrics.currency_code,
      row_metrics.value_scale,
      row_metrics.project_count,
      row_metrics.annual_total_investment_value,
      row_metrics.annual_total_project_count,

      ROUND(
        row_metrics.investment_value
        / NULLIF(row_metrics.annual_total_investment_value, 0)
        * 100,
        4
      ) AS annual_value_share_percentage,

      CASE
        WHEN row_metrics.previous_investment_value IS NULL
          THEN NULL::numeric
        ELSE ROUND(
          (
            row_metrics.investment_value
            / NULLIF(row_metrics.previous_investment_value, 0)
            - 1
          ) * 100,
          4
        )
      END AS nominal_yoy_change_percentage,

      row_metrics.data_status,
      row_metrics.record_type,
      row_metrics.source_id,
      row_metrics.source_published_at,
      row_metrics.verification_status,
      row_metrics.publication_status,
      row_metrics.notes,
      row_metrics.metadata,
      row_metrics.created_at,
      row_metrics.updated_at

    FROM row_metrics
    INNER JOIN regions AS region
      ON region.id = row_metrics.region_id
  `);

export const miningInvestmentAnnualSummary = pgView(
  "mining_investment_annual_summary",
  {
    regionId: uuid("region_id"),

    regionCode: varchar("region_code", {
      length: 30,
    }),

    regionName: varchar("region_name", {
      length: 160,
    }),

    year: smallint("year"),

    sectorCode: varchar("sector_code", {
      length: 50,
    }),

    sectorName: text("sector_name"),

    pmaInvestmentValue: numeric("pma_investment_value"),

    pmdnInvestmentValue: numeric("pmdn_investment_value"),

    totalInvestmentValue: numeric("total_investment_value"),

    currencyCode: varchar("currency_code", {
      length: 3,
    }),

    valueScale: varchar("value_scale", {
      length: 20,
    }),

    pmaProjectCount: integer("pma_project_count"),

    pmdnProjectCount: integer("pmdn_project_count"),

    totalProjectCount: bigint("total_project_count", {
      mode: "number",
    }),

    nominalTotalYoyChangePercentage: numeric(
      "nominal_total_yoy_change_percentage",
    ),

    recordType: dataRecordTypeEnum("record_type"),

    isFullyVerified: boolean("is_fully_verified"),

    isFullyPublished: boolean("is_fully_published"),
  },
).with({
  securityInvoker: true,
}).as(sql`
    WITH annual_summary AS (
      SELECT
        investment.region_id,
        investment.year,
        investment.sector_code,
        MAX(investment.sector_name::text) AS sector_name,
        investment.currency_code,
        investment.value_scale,
        investment.record_type,

        SUM(investment.investment_value)
          AS total_investment_value,

        SUM(investment.project_count)
          AS total_project_count,

        MAX(investment.investment_value) FILTER (
          WHERE investment.investment_origin = 'pma'
        ) AS pma_investment_value,

        MAX(investment.investment_value) FILTER (
          WHERE investment.investment_origin = 'pmdn'
        ) AS pmdn_investment_value,

        MAX(investment.project_count) FILTER (
          WHERE investment.investment_origin = 'pma'
        ) AS pma_project_count,

        MAX(investment.project_count) FILTER (
          WHERE investment.investment_origin = 'pmdn'
        ) AS pmdn_project_count,

        BOOL_AND(
          investment.verification_status = 'verified'
        ) AS is_fully_verified,

        BOOL_AND(
          investment.publication_status = 'published'
        ) AS is_fully_published

      FROM mining_investment_annual AS investment

      GROUP BY
        investment.region_id,
        investment.year,
        investment.sector_code,
        investment.currency_code,
        investment.value_scale,
        investment.record_type
    ),

    summary_with_previous AS (
      SELECT
        annual_summary.*,

        LAG(annual_summary.total_investment_value) OVER (
          PARTITION BY
            annual_summary.region_id,
            annual_summary.sector_code,
            annual_summary.currency_code,
            annual_summary.value_scale,
            annual_summary.record_type
          ORDER BY annual_summary.year
        ) AS previous_total_investment_value

      FROM annual_summary
    )

    SELECT
      summary.region_id,
      region.code AS region_code,
      region.name AS region_name,
      summary.year,
      summary.sector_code,
      summary.sector_name,
      summary.pma_investment_value,
      summary.pmdn_investment_value,
      summary.total_investment_value,
      summary.currency_code,
      summary.value_scale,
      summary.pma_project_count,
      summary.pmdn_project_count,
      summary.total_project_count,

      CASE
        WHEN summary.previous_total_investment_value IS NULL
          THEN NULL::numeric
        ELSE ROUND(
          (
            summary.total_investment_value
            / NULLIF(summary.previous_total_investment_value, 0)
            - 1
          ) * 100,
          4
        )
      END AS nominal_total_yoy_change_percentage,

      summary.record_type,
      summary.is_fully_verified,
      summary.is_fully_published

    FROM summary_with_previous AS summary
    INNER JOIN regions AS region
      ON region.id = summary.region_id
  `);

export type MiningInvestmentAnnual = typeof miningInvestmentAnnual.$inferSelect;

export type NewMiningInvestmentAnnual =
  typeof miningInvestmentAnnual.$inferInsert;

export type MiningInvestmentSource =
  typeof miningInvestmentSources.$inferSelect;

export type NewMiningInvestmentSource =
  typeof miningInvestmentSources.$inferInsert;
