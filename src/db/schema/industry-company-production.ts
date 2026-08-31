import { sql } from "drizzle-orm";
import {
  bigint,
  check,
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
  industryDataAvailabilityEnum,
  publicationStatusEnum,
  verificationStatusEnum,
} from "./common";
import { industryCompanies } from "./industry-companies";
import { industryReports } from "./industry-reports";
import { measurementUnits } from "./measurement-units";
import { sources } from "./sources";

export const industryCompanyProduction = pgTable(
  "industry_company_production",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => industryCompanies.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    commodityId: uuid("commodity_id")
      .notNull()
      .references(() => commodities.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    year: smallint("year").notNull(),
    metricCode: varchar("metric_code", { length: 100 }).notNull(),
    metricName: varchar("metric_name", { length: 180 }).notNull(),
    productName: varchar("product_name", { length: 180 }).notNull(),
    productionValue: numeric("production_value", {
      precision: 30,
      scale: 6,
    }),
    unitCode: varchar("unit_code", { length: 50 }).references(
      () => measurementUnits.code,
      {
        onDelete: "restrict",
        onUpdate: "cascade",
      },
    ),
    reportedValue: numeric("reported_value", {
      precision: 30,
      scale: 6,
    }),
    valueScale: bigint("value_scale", { mode: "number" }),
    reportedUnitLabel: varchar("reported_unit_label", { length: 80 }),
    productionBasis: text("production_basis").notNull(),
    dataAvailability: industryDataAvailabilityEnum("data_availability")
      .default("reported")
      .notNull(),
    recordType: dataRecordTypeEnum("record_type").default("actual").notNull(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    sourceReportId: uuid("source_report_id").references(
      () => industryReports.id,
      {
        onDelete: "set null",
        onUpdate: "cascade",
      },
    ),
    sourceUrl: text("source_url").notNull(),
    pageReference: varchar("page_reference", { length: 80 }),
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
    uniqueIndex("industry_company_production_unique_record_idx").on(
      table.companyId,
      table.year,
      table.metricCode,
    ),
    index("industry_company_production_company_idx").on(table.companyId),
    index("industry_company_production_commodity_idx").on(table.commodityId),
    index("industry_company_production_year_idx").on(table.year),
    index("industry_company_production_source_idx").on(table.sourceId),
    index("industry_company_production_source_report_idx").on(
      table.sourceReportId,
    ),
    index("industry_company_production_unit_idx").on(table.unitCode),
    index("industry_company_production_public_visibility_idx").on(
      table.verificationStatus,
      table.publicationStatus,
      table.dataAvailability,
    ),
    check(
      "industry_company_production_year_check",
      sql`${table.year} BETWEEN 2023 AND 2025`,
    ),
    check(
      "industry_company_production_metric_code_check",
      sql`${table.metricCode} ~ '^[a-z0-9]+(_[a-z0-9]+)*$'`,
    ),
    check(
      "industry_company_production_source_url_check",
      sql`${table.sourceUrl} ~ '^https://'`,
    ),
    check(
      "industry_company_production_value_state_check",
      sql`
        (
          ${table.dataAvailability} = 'reported'
          AND ${table.productionValue} IS NOT NULL
          AND ${table.productionValue} >= 0
          AND ${table.unitCode} IS NOT NULL
          AND ${table.reportedValue} IS NOT NULL
          AND ${table.reportedValue} >= 0
          AND ${table.valueScale} IS NOT NULL
          AND ${table.valueScale} > 0
          AND ${table.reportedUnitLabel} IS NOT NULL
          AND ${table.productionValue}
            = ${table.reportedValue} * ${table.valueScale}
        )
        OR
        (
          ${table.dataAvailability} <> 'reported'
          AND ${table.productionValue} IS NULL
          AND ${table.unitCode} IS NULL
          AND ${table.reportedValue} IS NULL
          AND ${table.valueScale} IS NULL
        )
      `,
    ),
    check(
      "industry_company_production_published_check",
      sql`
        ${table.publicationStatus} <> 'published'
        OR (
          ${table.verificationStatus} = 'verified'
          AND ${table.dataAvailability} = 'reported'
        )
      `,
    ),
    pgPolicy("industry_company_production_public_select_policy", {
      as: "permissive",
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`
        ${table.verificationStatus} = 'verified'
        AND ${table.publicationStatus} = 'published'
        AND ${table.dataAvailability} = 'reported'
        AND EXISTS (
          SELECT 1
          FROM ${industryCompanies} AS company
          WHERE company.id = ${table.companyId}
            AND company.is_active = true
            AND company.verification_status = 'verified'
            AND company.publication_status = 'published'
        )
      `,
    }),
  ],
).enableRLS();

export type IndustryCompanyProduction =
  typeof industryCompanyProduction.$inferSelect;

export type NewIndustryCompanyProduction =
  typeof industryCompanyProduction.$inferInsert;
