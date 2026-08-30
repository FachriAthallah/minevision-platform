import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import {
  createTimestampColumns,
  industryReportTypeEnum,
  publicationStatusEnum,
  verificationStatusEnum,
} from "./common";
import { industryCompanies } from "./industry-companies";

export const industryReports = pgTable(
  "industry_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => industryCompanies.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    reportYear: smallint("report_year").notNull(),

    reportType: industryReportTypeEnum("report_type").notNull(),

    title: varchar("title", {
      length: 240,
    }).notNull(),

    storagePath: text("storage_path").notNull(),

    fileName: varchar("file_name", {
      length: 255,
    }).notNull(),

    mimeType: varchar("mime_type", {
      length: 100,
    })
      .default("application/pdf")
      .notNull(),

    fileSizeBytes: bigint("file_size_bytes", {
      mode: "number",
    }).notNull(),

    sourceUrl: text("source_url"),

    verificationStatus: verificationStatusEnum("verification_status")
      .default("pending")
      .notNull(),

    publicationStatus: publicationStatusEnum("publication_status")
      .default("draft")
      .notNull(),

    publishedAt: timestamp("published_at", {
      withTimezone: true,
      mode: "date",
    }),

    notes: text("notes"),

    ...createTimestampColumns(),
  },
  (table) => [
    uniqueIndex("industry_reports_unique_record_idx").on(
      table.companyId,
      table.reportYear,
      table.reportType,
    ),

    uniqueIndex("industry_reports_storage_path_unique_idx").on(
      table.storagePath,
    ),

    index("industry_reports_company_id_idx").on(table.companyId),

    index("industry_reports_year_idx").on(table.reportYear),

    index("industry_reports_type_idx").on(table.reportType),

    index("industry_reports_public_visibility_idx").on(
      table.verificationStatus,
      table.publicationStatus,
    ),

    check(
      "industry_reports_year_check",
      sql`${table.reportYear} BETWEEN 2023 AND 2025`,
    ),

    check("industry_reports_file_size_check", sql`${table.fileSizeBytes} > 0`),

    check(
      "industry_reports_mime_type_check",
      sql`${table.mimeType} = 'application/pdf'`,
    ),
  ],
);

export type IndustryReport = typeof industryReports.$inferSelect;

export type NewIndustryReport = typeof industryReports.$inferInsert;
