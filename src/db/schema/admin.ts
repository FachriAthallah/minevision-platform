import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { createTimestampColumns } from "./common";

export const analyticsEventTypeEnum = pgEnum("analytics_event_type", [
  "page_view",
  "module_opened",
  "search_submitted",
  "search_result_clicked",
  "related_link_clicked",
  "outbound_source_clicked",
  "cta_clicked",
  "session_started",
  "web_vital",
]);

export const analyticsDeviceCategoryEnum = pgEnum("analytics_device_category", [
  "desktop",
  "mobile",
  "tablet",
  "unknown",
]);

export const siteSettingStateEnum = pgEnum("site_setting_state", [
  "draft",
  "published",
]);

export const mediaAssetKindEnum = pgEnum("media_asset_kind", [
  "logo",
  "favicon",
  "hero_image",
  "content_image",
  "avatar",
  "other",
]);

export const adminActivityResultEnum = pgEnum("admin_activity_result", [
  "success",
  "failure",
]);

/**
 * Analytics event pertama-party yang mengutamakan privasi.
 *
 * Sifat privacy:
 * - Tidak menyimpan IP mentah, fingerprint, lokasi presisi, atau konten form.
 * - Session dianonimkan memakai random first-party identifier di server.
 * - Query Global Search tidak disimpan; hanya kategori, panjang, dan hasil.
 * - Route admin tidak boleh menghasilkan event pada tabel ini.
 */
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    eventType: analyticsEventTypeEnum("event_type").notNull(),

    sessionId: varchar("session_id", { length: 64 }).notNull(),

    occurredAt: timestamp("occurred_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),

    /** Path dinormalisasi tanpa query string. */
    path: varchar("path", { length: 500 }),

    module: varchar("module", { length: 64 }),

    referrerDomain: varchar("referrer_domain", { length: 255 }),

    deviceCategory: analyticsDeviceCategoryEnum("device_category")
      .notNull()
      .default("unknown"),

    browserFamily: varchar("browser_family", { length: 80 }),

    osFamily: varchar("os_family", { length: 80 }),

    countryCode: varchar("country_code", { length: 2 }),

    /**
     * Sifat keamanan: atribut event aman saja. Untuk `web_vital`,
     * berisi { metric, value }. Untuk pencarian berisi metadata hasil,
     * bukan isi query mentah.
     */
    eventProperties: jsonb("event_properties").notNull().default({}),

    ...createTimestampColumns(),
  },
  (table) => [
    index("analytics_events_occurred_at_idx").on(table.occurredAt),
    index("analytics_events_session_idx").on(
      table.sessionId,
      table.occurredAt,
    ),
    index("analytics_events_type_idx").on(
      table.eventType,
      table.occurredAt,
    ),
  ],
);

export const siteSettings = pgTable(
  "site_settings",
  {
    key: varchar("key", { length: 64 }).primaryKey(),

    draft: jsonb("draft").notNull().default({}),
    published: jsonb("published").notNull().default({}),

    draftVersion: integer("draft_version").notNull().default(0),
    publishedVersion: integer("published_version").notNull().default(0),

    updatedBy: uuid("updated_by"),
    publishedBy: uuid("published_by"),

    ...createTimestampColumns(),
  },
  (table) => [
    index("site_settings_updated_at_idx").on(table.updatedAt),
  ],
);

/**
 * Riwayat versi site setting (append-only). Digunakan untuk rollback
 * ke versi published sebelumnya. Tidak boleh di-update atau dihapus.
 */
export const siteSettingVersions = pgTable(
  "site_setting_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    settingKey: varchar("setting_key", { length: 64 })
      .notNull()
      .references(() => siteSettings.key, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),

    state: siteSettingStateEnum("state").notNull(),

    version: integer("version").notNull(),

    payload: jsonb("payload").notNull(),

    appliedBy: uuid("applied_by"),

    appliedAt: timestamp("applied_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("site_setting_versions_setting_version_unique")
      .on(table.settingKey, table.state, table.version),
    index("site_setting_versions_setting_idx").on(table.settingKey),
  ],
);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    bucket: varchar("bucket", { length: 80 }).notNull(),

    /** Nama object acak di dalam bucket. Tidak pernah path traversal. */
    storagePath: varchar("storage_path", { length: 500 }).notNull(),

    kind: mediaAssetKindEnum("kind").notNull().default("content_image"),

    originalFileName: varchar("original_file_name", { length: 255 }),

    displayName: varchar("display_name", { length: 255 }),

    altText: text("alt_text"),

    mimeType: varchar("mime_type", { length: 120 }).notNull(),

    sizeBytes: integer("size_bytes").notNull(),

    width: integer("width"),
    height: integer("height"),

    tags: jsonb("tags").notNull().default([]),

    isArchived: boolean("is_archived").notNull().default(false),

    uploadedBy: uuid("uploaded_by"),

    ...createTimestampColumns(),
  },
  (table) => [
    uniqueIndex("media_assets_storage_path_unique").on(
      table.bucket,
      table.storagePath,
    ),
    index("media_assets_kind_idx").on(table.kind),
    index("media_assets_uploaded_by_idx").on(table.uploadedBy),
  ],
);

export const adminActivityLogs = pgTable(
  "admin_activity_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    actorId: uuid("actor_id").notNull(),

    action: varchar("action", { length: 120 }).notNull(),

    resourceType: varchar("resource_type", { length: 80 }),

    resourceId: varchar("resource_id", { length: 200 }),

    /** Ringkasan aman sebelum/sesudah. Tidak memuat secret. */
    beforeSummary: jsonb("before_summary").notNull().default({}),
    afterSummary: jsonb("after_summary").notNull().default({}),

    result: adminActivityResultEnum("result").notNull().default("success"),

    correlationId: varchar("correlation_id", { length: 64 }),

    /** Browser atau request identifier aman. */
    requestId: varchar("request_id", { length: 64 }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("admin_activity_logs_actor_idx").on(table.actorId, table.createdAt),
    index("admin_activity_logs_action_idx").on(
      table.action,
      table.createdAt,
    ),
    index("admin_activity_logs_resource_idx").on(
      table.resourceType,
      table.createdAt,
    ),
  ],
);

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;

export type SiteSetting = typeof siteSettings.$inferSelect;
export type NewSiteSetting = typeof siteSettings.$inferInsert;

export type SiteSettingVersion = typeof siteSettingVersions.$inferSelect;
export type NewSiteSettingVersion = typeof siteSettingVersions.$inferInsert;

export type MediaAsset = typeof mediaAssets.$inferSelect;
export type NewMediaAsset = typeof mediaAssets.$inferInsert;

export type AdminActivityLog = typeof adminActivityLogs.$inferSelect;
export type NewAdminActivityLog = typeof adminActivityLogs.$inferInsert;