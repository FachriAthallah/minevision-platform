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

import {
  createTimestampColumns,
  industryAuditStatusEnum,
  industryFinancialMetricEnum,
  publicationStatusEnum,
  verificationStatusEnum,
} from "./common";
import { industryCompanies } from "./industry-companies";
import { industryReports } from "./industry-reports";
import { sources } from "./sources";

export const industryCompanyFinancials = pgTable(
  "industry_company_financials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => industryCompanies.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    year: smallint("year").notNull(),
    metric: industryFinancialMetricEnum("metric").notNull(),
    metricLabel: varchar("metric_label", { length: 180 }).notNull(),
    amount: numeric("amount", { precision: 30, scale: 2 }).notNull(),
    currencyCode: varchar("currency_code", { length: 3 }).notNull(),
    reportedValue: numeric("reported_value", {
      precision: 30,
      scale: 6,
    }).notNull(),
    valueScale: bigint("value_scale", { mode: "number" }).notNull(),
    reportedUnitLabel: varchar("reported_unit_label", { length: 80 }).notNull(),
    statementScope: varchar("statement_scope", { length: 180 }).notNull(),
    profitDefinition: text("profit_definition"),
    auditStatus: industryAuditStatusEnum("audit_status")
      .default("unknown")
      .notNull(),
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
    uniqueIndex("industry_company_financials_unique_record_idx").on(
      table.companyId,
      table.year,
      table.metric,
      table.statementScope,
    ),
    index("industry_company_financials_company_idx").on(table.companyId),
    index("industry_company_financials_year_idx").on(table.year),
    index("industry_company_financials_metric_idx").on(table.metric),
    index("industry_company_financials_source_idx").on(table.sourceId),
    index("industry_company_financials_source_report_idx").on(
      table.sourceReportId,
    ),
    index("industry_company_financials_public_visibility_idx").on(
      table.verificationStatus,
      table.publicationStatus,
    ),
    check(
      "industry_company_financials_year_check",
      sql`${table.year} BETWEEN 2023 AND 2025`,
    ),
    check(
      "industry_company_financials_currency_code_check",
      sql`${table.currencyCode} ~ '^[A-Z]{3}$'`,
    ),
    check(
      "industry_company_financials_value_scale_check",
      sql`${table.valueScale} > 0`,
    ),
    check(
      "industry_company_financials_normalization_check",
      sql`${table.amount} = ${table.reportedValue} * ${table.valueScale}`,
    ),
    check(
      "industry_company_financials_source_url_check",
      sql`${table.sourceUrl} ~ '^https://'`,
    ),
    check(
      "industry_company_financials_profit_definition_check",
      sql`
        ${table.metric} NOT IN (
          'net_income',
          'profit_for_year',
          'operating_income'
        )
        OR ${table.profitDefinition} IS NOT NULL
      `,
    ),
    check(
      "industry_company_financials_published_check",
      sql`
        ${table.publicationStatus} <> 'published'
        OR ${table.verificationStatus} = 'verified'
      `,
    ),
    pgPolicy("industry_company_financials_public_select_policy", {
      as: "permissive",
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`
        ${table.verificationStatus} = 'verified'
        AND ${table.publicationStatus} = 'published'
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

export type IndustryCompanyFinancial =
  typeof industryCompanyFinancials.$inferSelect;

export type NewIndustryCompanyFinancial =
  typeof industryCompanyFinancials.$inferInsert;
