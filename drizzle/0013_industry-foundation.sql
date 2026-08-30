CREATE TYPE "public"."industry_report_type" AS ENUM('annual_report', 'sustainability_report');--> statement-breakpoint
CREATE TABLE "industry_companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"description" text,
	"company_type" varchar(160),
	"business_field" text,
	"headquarters_address" text,
	"established_year" smallint,
	"operation_area_description" text,
	"official_website_url" text,
	"logo_path" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"publication_status" "publication_status" DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "industry_companies_slug_unique" UNIQUE("slug"),
	CONSTRAINT "industry_companies_slug_check" CHECK ("industry_companies"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "industry_companies_established_year_check" CHECK (
        "industry_companies"."established_year" IS NULL
        OR "industry_companies"."established_year" BETWEEN 1800 AND 2100
      ),
	CONSTRAINT "industry_companies_display_order_check" CHECK ("industry_companies"."display_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "industry_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"report_year" smallint NOT NULL,
	"report_type" "industry_report_type" NOT NULL,
	"title" varchar(240) NOT NULL,
	"storage_path" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"mime_type" varchar(100) DEFAULT 'application/pdf' NOT NULL,
	"file_size_bytes" bigint NOT NULL,
	"source_url" text,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"publication_status" "publication_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "industry_reports_year_check" CHECK ("industry_reports"."report_year" BETWEEN 2023 AND 2025),
	CONSTRAINT "industry_reports_file_size_check" CHECK ("industry_reports"."file_size_bytes" > 0),
	CONSTRAINT "industry_reports_mime_type_check" CHECK ("industry_reports"."mime_type" = 'application/pdf')
);
--> statement-breakpoint
ALTER TABLE "industry_reports" ADD CONSTRAINT "industry_reports_company_id_industry_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."industry_companies"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "industry_companies_name_idx" ON "industry_companies" USING btree ("name");--> statement-breakpoint
CREATE INDEX "industry_companies_display_order_idx" ON "industry_companies" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "industry_companies_is_active_idx" ON "industry_companies" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "industry_companies_public_visibility_idx" ON "industry_companies" USING btree ("is_active","verification_status","publication_status");--> statement-breakpoint
CREATE UNIQUE INDEX "industry_reports_unique_record_idx" ON "industry_reports" USING btree ("company_id","report_year","report_type");--> statement-breakpoint
CREATE UNIQUE INDEX "industry_reports_storage_path_unique_idx" ON "industry_reports" USING btree ("storage_path");--> statement-breakpoint
CREATE INDEX "industry_reports_company_id_idx" ON "industry_reports" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "industry_reports_year_idx" ON "industry_reports" USING btree ("report_year");--> statement-breakpoint
CREATE INDEX "industry_reports_type_idx" ON "industry_reports" USING btree ("report_type");--> statement-breakpoint
CREATE INDEX "industry_reports_public_visibility_idx" ON "industry_reports" USING btree ("verification_status","publication_status");
--> statement-breakpoint
ALTER TABLE "public"."industry_companies"
ENABLE ROW LEVEL SECURITY;

--> statement-breakpoint
ALTER TABLE "public"."industry_reports"
ENABLE ROW LEVEL SECURITY;

--> statement-breakpoint
REVOKE ALL PRIVILEGES
ON TABLE "public"."industry_companies"
FROM anon, authenticated;

--> statement-breakpoint
REVOKE ALL PRIVILEGES
ON TABLE "public"."industry_reports"
FROM anon, authenticated;

--> statement-breakpoint
CREATE POLICY "industry_companies_public_select_policy"
ON "public"."industry_companies"
FOR SELECT
TO anon, authenticated
USING (
  "is_active" = true
  AND "verification_status" = 'verified'
  AND "publication_status" = 'published'
);

--> statement-breakpoint
CREATE POLICY "industry_reports_public_select_policy"
ON "public"."industry_reports"
FOR SELECT
TO anon, authenticated
USING (
  "verification_status" = 'verified'
  AND "publication_status" = 'published'
  AND EXISTS (
    SELECT 1
    FROM "public"."industry_companies" AS company
    WHERE company."id" = "industry_reports"."company_id"
      AND company."is_active" = true
      AND company."verification_status" = 'verified'
      AND company."publication_status" = 'published'
  )
);