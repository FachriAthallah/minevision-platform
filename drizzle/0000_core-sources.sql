CREATE TYPE "public"."publication_status" AS ENUM('draft', 'in_review', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('government', 'statistics_agency', 'company_report', 'academic', 'regulation', 'market_data', 'other');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(220) NOT NULL,
	"type" "source_type" NOT NULL,
	"organization" varchar(200) NOT NULL,
	"url" text,
	"description" text,
	"is_official" boolean DEFAULT false NOT NULL,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"verified_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sources_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "sources_type_idx" ON "sources" USING btree ("type");--> statement-breakpoint
CREATE INDEX "sources_verification_status_idx" ON "sources" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "sources_is_official_idx" ON "sources" USING btree ("is_official");--> statement-breakpoint
CREATE INDEX "sources_is_active_idx" ON "sources" USING btree ("is_active");