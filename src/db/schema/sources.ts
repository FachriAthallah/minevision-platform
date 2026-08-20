import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import {
  createTimestampColumns,
  sourceTypeEnum,
  verificationStatusEnum,
} from "./common";

export const sources = pgTable(
  "sources",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    name: varchar("name", {
      length: 200,
    }).notNull(),

    slug: varchar("slug", {
      length: 220,
    })
      .notNull()
      .unique(),

    type: sourceTypeEnum("type").notNull(),

    organization: varchar("organization", {
      length: 200,
    }).notNull(),

    url: text("url"),

    description: text("description"),

    isOfficial: boolean("is_official")
      .default(false)
      .notNull(),

    verificationStatus: verificationStatusEnum(
      "verification_status",
    )
      .default("pending")
      .notNull(),

    verifiedAt: timestamp("verified_at", {
      withTimezone: true,
      mode: "date",
    }),

    isActive: boolean("is_active")
      .default(true)
      .notNull(),

    ...createTimestampColumns(),
  },
  (table) => [
    index("sources_type_idx").on(table.type),

    index("sources_verification_status_idx").on(
      table.verificationStatus,
    ),

    index("sources_is_official_idx").on(
      table.isOfficial,
    ),

    index("sources_is_active_idx").on(
      table.isActive,
    ),
  ],
);

export type Source = typeof sources.$inferSelect;

export type NewSource = typeof sources.$inferInsert;