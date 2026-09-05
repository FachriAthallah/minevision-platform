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

import { createTimestampColumns } from "./common";
import { contents } from "./content";

export const careerProfessions = pgTable(
  "career_professions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    contentId: uuid("content_id")
      .notNull()
      .references(() => contents.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    groupKey: varchar("group_key", {
      length: 120,
    }).notNull(),

    groupLabel: varchar("group_label", {
      length: 180,
    }).notNull(),

    name: varchar("name", {
      length: 180,
    }).notNull(),

    slug: varchar("slug", {
      length: 200,
    }).notNull(),

    description: text("description"),

    displayOrder: integer("display_order").default(0).notNull(),

    ...createTimestampColumns(),
  },
  (table) => [
    uniqueIndex("career_professions_content_group_slug_unique_idx").on(
      table.contentId,
      table.groupKey,
      table.slug,
    ),

    index("career_professions_content_id_idx").on(table.contentId),

    index("career_professions_name_idx").on(table.name),

    index("career_professions_display_order_idx").on(
      table.contentId,
      table.groupKey,
      table.displayOrder,
    ),

    check(
      "career_professions_display_order_check",
      sql`${table.displayOrder} >= 0`,
    ),

    check(
      "career_professions_group_key_format_check",
      sql`${table.groupKey} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`,
    ),

    check(
      "career_professions_slug_format_check",
      sql`${table.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`,
    ),

    check(
      "career_professions_name_not_empty_check",
      sql`btrim(${table.name}) <> ''`,
    ),

    pgPolicy("career_professions_public_read", {
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

export type CareerProfession = typeof careerProfessions.$inferSelect;

export type NewCareerProfession = typeof careerProfessions.$inferInsert;
