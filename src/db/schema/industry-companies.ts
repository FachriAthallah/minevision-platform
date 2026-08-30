import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  smallint,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import {
  createTimestampColumns,
  publicationStatusEnum,
  verificationStatusEnum,
} from "./common";

export const industryCompanies = pgTable(
  "industry_companies",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: varchar("name", {
      length: 200,
    }).notNull(),

    slug: varchar("slug", {
      length: 180,
    })
      .notNull()
      .unique(),

    description: text("description"),

    companyType: varchar("company_type", {
      length: 160,
    }),

    businessField: text("business_field"),

    headquartersAddress: text("headquarters_address"),

    establishedYear: smallint("established_year"),

    operationAreaDescription: text("operation_area_description"),

    officialWebsiteUrl: text("official_website_url"),

    logoPath: text("logo_path").notNull(),

    displayOrder: integer("display_order").default(0).notNull(),

    isActive: boolean("is_active").default(true).notNull(),

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
    index("industry_companies_name_idx").on(table.name),

    index("industry_companies_display_order_idx").on(table.displayOrder),

    index("industry_companies_is_active_idx").on(table.isActive),

    index("industry_companies_public_visibility_idx").on(
      table.isActive,
      table.verificationStatus,
      table.publicationStatus,
    ),

    check(
      "industry_companies_slug_check",
      sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`,
    ),

    check(
      "industry_companies_established_year_check",
      sql`
        ${table.establishedYear} IS NULL
        OR ${table.establishedYear} BETWEEN 1800 AND 2100
      `,
    ),

    check(
      "industry_companies_display_order_check",
      sql`${table.displayOrder} >= 0`,
    ),
  ],
);

export type IndustryCompany = typeof industryCompanies.$inferSelect;

export type NewIndustryCompany = typeof industryCompanies.$inferInsert;