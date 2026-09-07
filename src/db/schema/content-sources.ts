import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { anonRole, authenticatedRole } from "drizzle-orm/supabase";

import { createTimestampColumns } from "./common";
import { contents } from "./content";
import { sources } from "./sources";

export const contentSources = pgTable(
  "content_sources",
  {
    contentId: uuid("content_id")
      .notNull()
      .references(() => contents.id, {
        onDelete: "cascade",
      }),

    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, {
        onDelete: "restrict",
      }),

    citationLabel: text("citation_label"),

    pageReference: text("page_reference"),

    notes: text("notes"),

    accessedAt: timestamp("accessed_at", {
      withTimezone: true,
      mode: "date",
    }),

    displayOrder: integer("display_order").default(0).notNull(),

    ...createTimestampColumns(),
  },
  (table) => [
    primaryKey({
      name: "content_sources_pk",
      columns: [table.contentId, table.sourceId],
    }),

    index("content_sources_source_id_idx").on(table.sourceId),

    index("content_sources_display_order_idx").on(table.displayOrder),

    pgPolicy("content_sources_commodity_public_read", {
      as: "permissive",
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`
        EXISTS (
          SELECT 1
          FROM "contents" AS content
          WHERE content.id = ${table.contentId}
            AND content.module = 'commodities'
            AND content.type = 'commodity_profile'
            AND content.status = 'published'
        )
        AND EXISTS (
          SELECT 1
          FROM "sources" AS source
          WHERE source.id = ${table.sourceId}
            AND source.is_active = true
            AND source.verification_status = 'verified'
        )
      `,
    }),

    pgPolicy("content_sources_career_public_read", {
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
    AND EXISTS (
      SELECT 1
      FROM "sources" AS source
      WHERE source.id = ${table.sourceId}
        AND source.is_active = true
        AND source.verification_status = 'verified'
    )
  `,
    }),
  ],
).enableRLS();

export type ContentSource = typeof contentSources.$inferSelect;

export type NewContentSource = typeof contentSources.$inferInsert;
