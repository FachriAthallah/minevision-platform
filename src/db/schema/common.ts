import { pgEnum, timestamp } from "drizzle-orm/pg-core";

export const publicationStatusEnum = pgEnum("publication_status", [
  "draft",
  "in_review",
  "published",
  "archived",
]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "pending",
  "verified",
  "rejected",
]);

export const sourceTypeEnum = pgEnum("source_type", [
  "government",
  "statistics_agency",
  "company_report",
  "academic",
  "regulation",
  "market_data",
  "other",
]);

export const contentModuleEnum = pgEnum("content_module", [
  "education",
  "industry",
  "commodities",
  "career",
  "intelligence",
  "economy",
  "about",
]);

export const contentTypeEnum = pgEnum("content_type", [
  "article",
  "glossary",
  "company_profile",
  "commodity_profile",
  "profession",
  "data_insight",
  "policy",
  "page",
]);

export const commodityCategoryEnum = pgEnum("commodity_category", [
  "metal_mineral",
  "non_metal_mineral",
  "energy",
]);

export const measurementCategoryEnum = pgEnum("measurement_category", [
  "mass",
  "currency",
  "currency_per_mass",
  "percentage",
  "energy",
  "count",
  "other",
]);

export const dataRecordTypeEnum = pgEnum("data_record_type", [
  "actual",
  "provisional",
  "projection",
  "revised",
]);

export const gdpPriceBasisEnum = pgEnum("gdp_price_basis", [
  "current_prices",
  "constant_prices",
]);

export const statisticalDataStatusEnum = pgEnum("statistical_data_status", [
  "final",
  "preliminary",
  "very_preliminary",
]);

export const pricePeriodEnum = pgEnum("price_period", [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "annual",
  "custom",
]);

export const regionLevelEnum = pgEnum("region_level", [
  "country",
  "province",
  "regency",
  "city",
]);

export function createTimestampColumns() {
  return {
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  };
}
