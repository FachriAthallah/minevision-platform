import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgPolicy,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { anonRole, authenticatedRole } from "drizzle-orm/supabase";

import { careerProfileItemSectionEnum, createTimestampColumns } from "./common";
import { contents } from "./content";

export const careerProfileItems = pgTable(
  "career_profile_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    contentId: uuid("content_id")
      .notNull()
      .references(() => contents.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    itemKey: varchar("item_key", {
      length: 160,
    }).notNull(),

    section: careerProfileItemSectionEnum("section").notNull(),

    groupKey: varchar("group_key", {
      length: 120,
    }).notNull(),

    groupLabel: varchar("group_label", {
      length: 180,
    }).notNull(),

    value: text("value").notNull(),

    displayOrder: integer("display_order").default(0).notNull(),

    ...createTimestampColumns(),
  },
  (table) => [
    uniqueIndex("career_profile_items_content_item_key_unique_idx").on(
      table.contentId,
      table.itemKey,
    ),

    index("career_profile_items_content_id_idx").on(table.contentId),

    index("career_profile_items_section_idx").on(
      table.contentId,
      table.section,
    ),

    index("career_profile_items_display_order_idx").on(
      table.contentId,
      table.section,
      table.groupKey,
      table.displayOrder,
    ),

    check(
      "career_profile_items_display_order_check",
      sql`${table.displayOrder} >= 0`,
    ),

    check(
      "career_profile_items_item_key_format_check",
      sql`${table.itemKey} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`,
    ),

    check(
      "career_profile_items_group_key_format_check",
      sql`${table.groupKey} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`,
    ),

    check(
      "career_profile_items_group_label_not_empty_check",
      sql`btrim(${table.groupLabel}) <> ''`,
    ),

    check(
      "career_profile_items_value_not_empty_check",
      sql`btrim(${table.value}) <> ''`,
    ),

    pgPolicy("career_profile_items_public_read", {
      as: "permissive",
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`
        EXISTS (
          SELECT 1
          FROM "contents" AS content
          WHERE content.id = ${table.contentId}
            AND content.module = 'career'
            AND content.type = 'profession'
            AND content.status = 'published'
        )
      `,
    }),
  ],
).enableRLS();

export type CareerProfileItem = typeof careerProfileItems.$inferSelect;

export type NewCareerProfileItem = typeof careerProfileItems.$inferInsert;
