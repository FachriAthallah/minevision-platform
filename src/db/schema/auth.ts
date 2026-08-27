import {
  boolean,
  index,
  primaryKey,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { createTimestampColumns } from "./common";

export const userProfiles = pgTable(
  "user_profiles",
  {
    userId: uuid("user_id").primaryKey(),

    username: varchar("username", {
      length: 50,
    }).notNull(),

    displayName: varchar("display_name", {
      length: 120,
    }),

    avatarUrl: text("avatar_url"),

    ...createTimestampColumns(),
  },
  (table) => [
    uniqueIndex("user_profiles_username_unique_idx").on(table.username),
  ],
);

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    key: varchar("key", {
      length: 64,
    }).notNull(),

    name: varchar("name", {
      length: 120,
    }).notNull(),

    description: text("description"),

    isSystem: boolean("is_system").default(true).notNull(),

    ...createTimestampColumns(),
  },
  (table) => [uniqueIndex("roles_key_unique_idx").on(table.key)],
);

export const userRoleAssignments = pgTable(
  "user_role_assignments",
  {
    userId: uuid("user_id").notNull(),

    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    assignedBy: uuid("assigned_by"),

    assignedAt: timestamp("assigned_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      name: "user_role_assignments_pk",
      columns: [table.userId, table.roleId],
    }),
    index("user_role_assignments_role_id_idx").on(table.roleId),
    index("user_role_assignments_assigned_by_idx").on(table.assignedBy),
  ],
);

export type UserProfile = typeof userProfiles.$inferSelect;

export type NewUserProfile = typeof userProfiles.$inferInsert;

export type Role = typeof roles.$inferSelect;

export type UserRoleAssignment = typeof userRoleAssignments.$inferSelect;
