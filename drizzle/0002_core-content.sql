CREATE TYPE "public"."content_module" AS ENUM('education', 'industry', 'commodities', 'career', 'intelligence', 'economy', 'about');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('article', 'glossary', 'company_profile', 'commodity_profile', 'profession', 'data_insight', 'policy', 'page');--> statement-breakpoint
CREATE TABLE "content_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module" "content_module" NOT NULL,
	"parent_id" uuid,
	"name" varchar(160) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"description" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module" "content_module" NOT NULL,
	"type" "content_type" NOT NULL,
	"category_id" uuid,
	"title" varchar(240) NOT NULL,
	"slug" varchar(260) NOT NULL,
	"excerpt" text,
	"body" text DEFAULT '' NOT NULL,
	"cover_image_url" text,
	"status" "publication_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"reading_time_minutes" integer,
	"is_featured" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_sources" (
	"content_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"citation_label" text,
	"page_reference" text,
	"notes" text,
	"accessed_at" timestamp with time zone,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_sources_pk" PRIMARY KEY("content_id","source_id")
);
--> statement-breakpoint
ALTER TABLE "content_categories" ADD CONSTRAINT "content_categories_parent_id_content_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."content_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contents" ADD CONSTRAINT "contents_category_id_content_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."content_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_sources" ADD CONSTRAINT "content_sources_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_sources" ADD CONSTRAINT "content_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "content_categories_module_slug_unique_idx" ON "content_categories" USING btree ("module","slug");--> statement-breakpoint
CREATE INDEX "content_categories_module_idx" ON "content_categories" USING btree ("module");--> statement-breakpoint
CREATE INDEX "content_categories_parent_id_idx" ON "content_categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "content_categories_is_active_idx" ON "content_categories" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "contents_module_slug_unique_idx" ON "contents" USING btree ("module","slug");--> statement-breakpoint
CREATE INDEX "contents_module_idx" ON "contents" USING btree ("module");--> statement-breakpoint
CREATE INDEX "contents_type_idx" ON "contents" USING btree ("type");--> statement-breakpoint
CREATE INDEX "contents_category_id_idx" ON "contents" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "contents_status_idx" ON "contents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "contents_published_at_idx" ON "contents" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "contents_is_featured_idx" ON "contents" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "content_sources_source_id_idx" ON "content_sources" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "content_sources_display_order_idx" ON "content_sources" USING btree ("display_order");
--> statement-breakpoint
ALTER TABLE "public"."content_categories"
ENABLE ROW LEVEL SECURITY;

--> statement-breakpoint
ALTER TABLE "public"."contents"
ENABLE ROW LEVEL SECURITY;

--> statement-breakpoint
ALTER TABLE "public"."content_sources"
ENABLE ROW LEVEL SECURITY;