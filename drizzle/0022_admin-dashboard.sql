CREATE TYPE "public"."role_assignment_status" AS ENUM('active', 'suspended', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."admin_activity_result" AS ENUM('success', 'failure');--> statement-breakpoint
CREATE TYPE "public"."analytics_device_category" AS ENUM('desktop', 'mobile', 'tablet', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."analytics_event_type" AS ENUM('page_view', 'module_opened', 'search_submitted', 'search_result_clicked', 'related_link_clicked', 'outbound_source_clicked', 'cta_clicked', 'session_started', 'web_vital');--> statement-breakpoint
CREATE TYPE "public"."media_asset_kind" AS ENUM('logo', 'favicon', 'hero_image', 'content_image', 'avatar', 'other');--> statement-breakpoint
CREATE TYPE "public"."site_setting_state" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "admin_activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" varchar(120) NOT NULL,
	"resource_type" varchar(80),
	"resource_id" varchar(200),
	"before_summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"after_summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"result" "admin_activity_result" DEFAULT 'success' NOT NULL,
	"correlation_id" varchar(64),
	"request_id" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" "analytics_event_type" NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"path" varchar(500),
	"module" varchar(64),
	"referrer_domain" varchar(255),
	"device_category" "analytics_device_category" DEFAULT 'unknown' NOT NULL,
	"browser_family" varchar(80),
	"os_family" varchar(80),
	"country_code" varchar(2),
	"event_properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bucket" varchar(80) NOT NULL,
	"storage_path" varchar(500) NOT NULL,
	"kind" "media_asset_kind" DEFAULT 'content_image' NOT NULL,
	"original_file_name" varchar(255),
	"display_name" varchar(255),
	"alt_text" text,
	"mime_type" varchar(120) NOT NULL,
	"size_bytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_setting_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"setting_key" varchar(64) NOT NULL,
	"state" "site_setting_state" NOT NULL,
	"version" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"applied_by" uuid,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" varchar(64) PRIMARY KEY NOT NULL,
	"draft" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"published" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"draft_version" integer DEFAULT 0 NOT NULL,
	"published_version" integer DEFAULT 0 NOT NULL,
	"updated_by" uuid,
	"published_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_role_assignments" ADD COLUMN "status" "role_assignment_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_setting_versions" ADD CONSTRAINT "site_setting_versions_setting_key_site_settings_key_fk" FOREIGN KEY ("setting_key") REFERENCES "public"."site_settings"("key") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "admin_activity_logs_actor_idx" ON "admin_activity_logs" USING btree ("actor_id","created_at");--> statement-breakpoint
CREATE INDEX "admin_activity_logs_action_idx" ON "admin_activity_logs" USING btree ("action","created_at");--> statement-breakpoint
CREATE INDEX "admin_activity_logs_resource_idx" ON "admin_activity_logs" USING btree ("resource_type","created_at");--> statement-breakpoint
CREATE INDEX "analytics_events_occurred_at_idx" ON "analytics_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "analytics_events_session_idx" ON "analytics_events" USING btree ("session_id","occurred_at");--> statement-breakpoint
CREATE INDEX "analytics_events_type_idx" ON "analytics_events" USING btree ("event_type","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "media_assets_storage_path_unique" ON "media_assets" USING btree ("bucket","storage_path");--> statement-breakpoint
CREATE INDEX "media_assets_kind_idx" ON "media_assets" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "media_assets_uploaded_by_idx" ON "media_assets" USING btree ("uploaded_by");--> statement-breakpoint
CREATE UNIQUE INDEX "site_setting_versions_setting_version_unique" ON "site_setting_versions" USING btree ("setting_key","state","version");--> statement-breakpoint
CREATE INDEX "site_setting_versions_setting_idx" ON "site_setting_versions" USING btree ("setting_key");--> statement-breakpoint
CREATE INDEX "site_settings_updated_at_idx" ON "site_settings" USING btree ("updated_at");INSERT INTO "public"."roles" ("key", "name", "description") VALUES
  ('owner', 'Owner', 'Pemilik platform. Akses penuh ke Admin Dashboard.'),
  ('analyst', 'Analyst', 'Analis. Akses baca analytics dan aktivitas terbatas.')
ON CONFLICT ("key") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "updated_at" = now();
--> statement-breakpoint
ALTER TABLE "public"."admin_activity_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."analytics_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."media_assets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."site_setting_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."site_settings" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'admin-media',
  'admin-media',
  false,
  10485760,
  ARRAY['image/png','image/jpeg','image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
