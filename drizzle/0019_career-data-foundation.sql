CREATE TYPE "public"."career_profile_item_section" AS ENUM('work_scope', 'competency', 'education', 'software', 'training');--> statement-breakpoint
CREATE TABLE "career_professions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"group_key" varchar(120) NOT NULL,
	"group_label" varchar(180) NOT NULL,
	"name" varchar(180) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "career_professions_display_order_check" CHECK ("career_professions"."display_order" >= 0),
	CONSTRAINT "career_professions_group_key_format_check" CHECK ("career_professions"."group_key" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
	CONSTRAINT "career_professions_slug_format_check" CHECK ("career_professions"."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
	CONSTRAINT "career_professions_name_not_empty_check" CHECK (btrim("career_professions"."name") <> '')
);
--> statement-breakpoint
ALTER TABLE "career_professions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "career_profile_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"item_key" varchar(160) NOT NULL,
	"section" "career_profile_item_section" NOT NULL,
	"group_key" varchar(120) NOT NULL,
	"group_label" varchar(180) NOT NULL,
	"value" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "career_profile_items_display_order_check" CHECK ("career_profile_items"."display_order" >= 0),
	CONSTRAINT "career_profile_items_item_key_format_check" CHECK ("career_profile_items"."item_key" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
	CONSTRAINT "career_profile_items_group_key_format_check" CHECK ("career_profile_items"."group_key" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
	CONSTRAINT "career_profile_items_group_label_not_empty_check" CHECK (btrim("career_profile_items"."group_label") <> ''),
	CONSTRAINT "career_profile_items_value_not_empty_check" CHECK (btrim("career_profile_items"."value") <> '')
);
--> statement-breakpoint
ALTER TABLE "career_profile_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "career_professions" ADD CONSTRAINT "career_professions_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "career_profile_items" ADD CONSTRAINT "career_profile_items_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "career_professions_content_group_slug_unique_idx" ON "career_professions" USING btree ("content_id","group_key","slug");--> statement-breakpoint
CREATE INDEX "career_professions_content_id_idx" ON "career_professions" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "career_professions_name_idx" ON "career_professions" USING btree ("name");--> statement-breakpoint
CREATE INDEX "career_professions_display_order_idx" ON "career_professions" USING btree ("content_id","group_key","display_order");--> statement-breakpoint
CREATE UNIQUE INDEX "career_profile_items_content_item_key_unique_idx" ON "career_profile_items" USING btree ("content_id","item_key");--> statement-breakpoint
CREATE INDEX "career_profile_items_content_id_idx" ON "career_profile_items" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "career_profile_items_section_idx" ON "career_profile_items" USING btree ("content_id","section");--> statement-breakpoint
CREATE INDEX "career_profile_items_display_order_idx" ON "career_profile_items" USING btree ("content_id","section","group_key","display_order");--> statement-breakpoint
CREATE POLICY "contents_career_public_read" ON "contents" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (
    "contents"."module" = 'career'
    AND "contents"."type" = 'profession'
    AND "contents"."status" = 'published'
  );--> statement-breakpoint
CREATE POLICY "content_sources_career_public_read" ON "content_sources" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (
    EXISTS (
      SELECT 1
      FROM "contents" AS content
      WHERE content.id = "content_sources"."content_id"
        AND content.module = 'career'
        AND content.type = 'profession'
        AND content.status = 'published'
    )
    AND EXISTS (
      SELECT 1
      FROM "sources" AS source
      WHERE source.id = "content_sources"."source_id"
        AND source.is_active = true
        AND source.verification_status = 'verified'
    )
  );--> statement-breakpoint
CREATE POLICY "career_professions_public_read" ON "career_professions" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (
        EXISTS (
          SELECT 1
          FROM "contents" AS content
          WHERE content.id = "career_professions"."content_id"
            AND content.module = 'career'
            AND content.type = 'profession'
            AND content.status = 'published'
        )
      );--> statement-breakpoint
CREATE POLICY "career_profile_items_public_read" ON "career_profile_items" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (
        EXISTS (
          SELECT 1
          FROM "contents" AS content
          WHERE content.id = "career_profile_items"."content_id"
            AND content.module = 'career'
            AND content.type = 'profession'
            AND content.status = 'published'
        )
      );
      --> statement-breakpoint
GRANT SELECT ON TABLE "public"."career_professions"
TO "anon", "authenticated";

--> statement-breakpoint
GRANT SELECT ON TABLE "public"."career_profile_items"
TO "anon", "authenticated";