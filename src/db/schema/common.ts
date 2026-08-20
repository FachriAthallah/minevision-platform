import {
  pgEnum,
  timestamp,
} from "drizzle-orm/pg-core";

export const publicationStatusEnum = pgEnum(
  "publication_status",
  [
    "draft",
    "in_review",
    "published",
    "archived",
  ],
);

export const verificationStatusEnum = pgEnum(
  "verification_status",
  [
    "pending",
    "verified",
    "rejected",
  ],
);

export const sourceTypeEnum = pgEnum(
  "source_type",
  [
    "government",
    "statistics_agency",
    "company_report",
    "academic",
    "regulation",
    "market_data",
    "other",
  ],
);

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