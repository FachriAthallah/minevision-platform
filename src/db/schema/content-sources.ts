import {
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

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
  ],
);

export type ContentSource = typeof contentSources.$inferSelect;

export type NewContentSource = typeof contentSources.$inferInsert;
