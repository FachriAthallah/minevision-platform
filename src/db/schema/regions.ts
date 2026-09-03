import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  index,
  jsonb,
  numeric,
  pgPolicy,
  pgTable,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { anonRole, authenticatedRole } from "drizzle-orm/supabase";

import { createTimestampColumns, regionLevelEnum } from "./common";

export const regions = pgTable(
  "regions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    parentId: uuid("parent_id").references((): AnyPgColumn => regions.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),

    code: varchar("code", {
      length: 30,
    }),

    name: varchar("name", {
      length: 160,
    }).notNull(),

    slug: varchar("slug", {
      length: 180,
    }).notNull(),

    level: regionLevelEnum("level").notNull(),

    latitude: numeric("latitude", {
      precision: 10,
      scale: 7,
    }),

    longitude: numeric("longitude", {
      precision: 10,
      scale: 7,
    }),

    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),

    isActive: boolean("is_active").default(true).notNull(),

    ...createTimestampColumns(),
  },
  (table) => [
    uniqueIndex("regions_slug_unique_idx").on(table.slug),

    uniqueIndex("regions_code_unique_idx").on(table.code),

    index("regions_parent_id_idx").on(table.parentId),

    index("regions_level_idx").on(table.level),

    index("regions_name_idx").on(table.name),

    index("regions_is_active_idx").on(table.isActive),

    check(
      "regions_latitude_check",
      sql`
        ${table.latitude} IS NULL
        OR (
          ${table.latitude} >= -90
          AND ${table.latitude} <= 90
        )
      `,
    ),

    check(
      "regions_longitude_check",
      sql`
        ${table.longitude} IS NULL
        OR (
          ${table.longitude} >= -180
          AND ${table.longitude} <= 180
        )
      `,
    ),

    pgPolicy("regions_public_read", {
      as: "permissive",
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`${table.isActive} = true`,
    }),
  ],
).enableRLS();

export type Region = typeof regions.$inferSelect;

export type NewRegion = typeof regions.$inferInsert;
