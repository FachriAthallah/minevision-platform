import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { anonRole, authenticatedRole } from "drizzle-orm/supabase";

import {
  contentModuleEnum,
  contentTypeEnum,
  createTimestampColumns,
  publicationStatusEnum,
} from "./common";

export const contentCategories = pgTable(
  "content_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    module: contentModuleEnum("module").notNull(),

    parentId: uuid("parent_id").references(
      (): AnyPgColumn => contentCategories.id,
      {
        onDelete: "set null",
      },
    ),

    name: varchar("name", {
      length: 160,
    }).notNull(),

    slug: varchar("slug", {
      length: 180,
    }).notNull(),

    description: text("description"),

    displayOrder: integer("display_order").default(0).notNull(),

    isActive: boolean("is_active").default(true).notNull(),

    ...createTimestampColumns(),
  },
  (table) => [
    uniqueIndex("content_categories_module_slug_unique_idx").on(
      table.module,
      table.slug,
    ),

    index("content_categories_module_idx").on(table.module),

    index("content_categories_parent_id_idx").on(table.parentId),

    index("content_categories_is_active_idx").on(table.isActive),
  ],
);

export const contents = pgTable(
  "contents",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    module: contentModuleEnum("module").notNull(),

    type: contentTypeEnum("type").notNull(),

    categoryId: uuid("category_id").references(() => contentCategories.id, {
      onDelete: "set null",
    }),

    title: varchar("title", {
      length: 240,
    }).notNull(),

    slug: varchar("slug", {
      length: 260,
    }).notNull(),

    excerpt: text("excerpt"),

    body: text("body").default("").notNull(),

    coverImageUrl: text("cover_image_url"),

    status: publicationStatusEnum("status").default("draft").notNull(),

    publishedAt: timestamp("published_at", {
      withTimezone: true,
      mode: "date",
    }),

    readingTimeMinutes: integer("reading_time_minutes"),

    isFeatured: boolean("is_featured").default(false).notNull(),

    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),

    ...createTimestampColumns(),
  },
  (table) => [
    uniqueIndex("contents_module_slug_unique_idx").on(table.module, table.slug),

    index("contents_module_idx").on(table.module),

    index("contents_type_idx").on(table.type),

    index("contents_category_id_idx").on(table.categoryId),

    index("contents_status_idx").on(table.status),

    index("contents_published_at_idx").on(table.publishedAt),

    index("contents_is_featured_idx").on(table.isFeatured),

    pgPolicy("contents_commodity_public_read", {
      as: "permissive",
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`
        ${table.module} = 'commodities'
        AND ${table.type} = 'commodity_profile'
        AND ${table.status} = 'published'
      `,
    }),

    pgPolicy("contents_career_public_read", {
      as: "permissive",
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`
    ${table.module} = 'career'
    AND ${table.type} = 'profession'
    AND ${table.status} = 'published'
  `,
    }),
  ],
).enableRLS();

export type ContentCategory = typeof contentCategories.$inferSelect;

export type NewContentCategory = typeof contentCategories.$inferInsert;

export type Content = typeof contents.$inferSelect;

export type NewContent = typeof contents.$inferInsert;
