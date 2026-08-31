CREATE TYPE "public"."industry_audit_status" AS ENUM('audited', 'unaudited', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."industry_coordinate_precision" AS ENUM('exact', 'approximate', 'regency_centroid', 'province_centroid', 'withheld');--> statement-breakpoint
CREATE TYPE "public"."industry_data_availability" AS ENUM('reported', 'not_normalized', 'not_reported');--> statement-breakpoint
CREATE TYPE "public"."industry_financial_metric" AS ENUM('total_assets', 'revenue', 'net_income', 'profit_for_year', 'operating_income');--> statement-breakpoint
CREATE TYPE "public"."industry_operation_site_status" AS ENUM('operating', 'ramp_up', 'development', 'construction', 'limited_operation', 'care_and_maintenance', 'closed');--> statement-breakpoint
CREATE TYPE "public"."industry_operation_site_type" AS ENUM('mine', 'underground_mine', 'smelter', 'refinery', 'port', 'industrial_complex', 'project', 'operating_area');--> statement-breakpoint
CREATE TABLE "industry_company_production" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"commodity_id" uuid NOT NULL,
	"year" smallint NOT NULL,
	"metric_code" varchar(100) NOT NULL,
	"metric_name" varchar(180) NOT NULL,
	"product_name" varchar(180) NOT NULL,
	"production_value" numeric(30, 6),
	"unit_code" varchar(50),
	"reported_value" numeric(30, 6),
	"value_scale" bigint,
	"reported_unit_label" varchar(80),
	"production_basis" text NOT NULL,
	"data_availability" "industry_data_availability" DEFAULT 'reported' NOT NULL,
	"record_type" "data_record_type" DEFAULT 'actual' NOT NULL,
	"source_id" uuid NOT NULL,
	"source_report_id" uuid,
	"source_url" text NOT NULL,
	"page_reference" varchar(80),
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"publication_status" "publication_status" DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "industry_company_production_year_check" CHECK ("industry_company_production"."year" BETWEEN 2023 AND 2025),
	CONSTRAINT "industry_company_production_metric_code_check" CHECK ("industry_company_production"."metric_code" ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),
	CONSTRAINT "industry_company_production_source_url_check" CHECK ("industry_company_production"."source_url" ~ '^https://'),
	CONSTRAINT "industry_company_production_value_state_check" CHECK (
        (
          "industry_company_production"."data_availability" = 'reported'
          AND "industry_company_production"."production_value" IS NOT NULL
          AND "industry_company_production"."production_value" >= 0
          AND "industry_company_production"."unit_code" IS NOT NULL
          AND "industry_company_production"."reported_value" IS NOT NULL
          AND "industry_company_production"."reported_value" >= 0
          AND "industry_company_production"."value_scale" IS NOT NULL
          AND "industry_company_production"."value_scale" > 0
          AND "industry_company_production"."reported_unit_label" IS NOT NULL
          AND "industry_company_production"."production_value"
            = "industry_company_production"."reported_value" * "industry_company_production"."value_scale"
        )
        OR
        (
          "industry_company_production"."data_availability" <> 'reported'
          AND "industry_company_production"."production_value" IS NULL
          AND "industry_company_production"."unit_code" IS NULL
          AND "industry_company_production"."reported_value" IS NULL
          AND "industry_company_production"."value_scale" IS NULL
        )
      ),
	CONSTRAINT "industry_company_production_published_check" CHECK (
        "industry_company_production"."publication_status" <> 'published'
        OR (
          "industry_company_production"."verification_status" = 'verified'
          AND "industry_company_production"."data_availability" = 'reported'
        )
      )
);
--> statement-breakpoint
ALTER TABLE "industry_company_production" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "industry_company_financials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"year" smallint NOT NULL,
	"metric" "industry_financial_metric" NOT NULL,
	"metric_label" varchar(180) NOT NULL,
	"amount" numeric(30, 2) NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"reported_value" numeric(30, 6) NOT NULL,
	"value_scale" bigint NOT NULL,
	"reported_unit_label" varchar(80) NOT NULL,
	"statement_scope" varchar(180) NOT NULL,
	"profit_definition" text,
	"audit_status" "industry_audit_status" DEFAULT 'unknown' NOT NULL,
	"source_id" uuid NOT NULL,
	"source_report_id" uuid,
	"source_url" text NOT NULL,
	"page_reference" varchar(80),
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"publication_status" "publication_status" DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "industry_company_financials_year_check" CHECK ("industry_company_financials"."year" BETWEEN 2023 AND 2025),
	CONSTRAINT "industry_company_financials_currency_code_check" CHECK ("industry_company_financials"."currency_code" ~ '^[A-Z]{3}$'),
	CONSTRAINT "industry_company_financials_value_scale_check" CHECK ("industry_company_financials"."value_scale" > 0),
	CONSTRAINT "industry_company_financials_normalization_check" CHECK ("industry_company_financials"."amount" = "industry_company_financials"."reported_value" * "industry_company_financials"."value_scale"),
	CONSTRAINT "industry_company_financials_source_url_check" CHECK ("industry_company_financials"."source_url" ~ '^https://'),
	CONSTRAINT "industry_company_financials_profit_definition_check" CHECK (
        "industry_company_financials"."metric" NOT IN (
          'net_income',
          'profit_for_year',
          'operating_income'
        )
        OR "industry_company_financials"."profit_definition" IS NOT NULL
      ),
	CONSTRAINT "industry_company_financials_published_check" CHECK (
        "industry_company_financials"."publication_status" <> 'published'
        OR "industry_company_financials"."verification_status" = 'verified'
      )
);
--> statement-breakpoint
ALTER TABLE "industry_company_financials" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "industry_operation_sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"operator_name" varchar(200) NOT NULL,
	"site_type" "industry_operation_site_type" NOT NULL,
	"current_status" "industry_operation_site_status" NOT NULL,
	"status_label" varchar(120) NOT NULL,
	"commodity_slugs" text[] NOT NULL,
	"province_name" varchar(160) NOT NULL,
	"regency_name" varchar(180),
	"location_description" text NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"coordinate_precision" "industry_coordinate_precision",
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"source_id" uuid NOT NULL,
	"source_report_id" uuid,
	"source_url" text NOT NULL,
	"page_reference" varchar(80),
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"publication_status" "publication_status" DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "industry_operation_sites_slug_check" CHECK ("industry_operation_sites"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "industry_operation_sites_display_order_check" CHECK ("industry_operation_sites"."display_order" >= 0),
	CONSTRAINT "industry_operation_sites_commodities_check" CHECK (cardinality("industry_operation_sites"."commodity_slugs") > 0),
	CONSTRAINT "industry_operation_sites_latitude_check" CHECK ("industry_operation_sites"."latitude" IS NULL OR "industry_operation_sites"."latitude" BETWEEN -90 AND 90),
	CONSTRAINT "industry_operation_sites_longitude_check" CHECK ("industry_operation_sites"."longitude" IS NULL OR "industry_operation_sites"."longitude" BETWEEN -180 AND 180),
	CONSTRAINT "industry_operation_sites_coordinate_pair_check" CHECK (
        (
          "industry_operation_sites"."latitude" IS NULL
          AND "industry_operation_sites"."longitude" IS NULL
          AND "industry_operation_sites"."coordinate_precision" IS NULL
        )
        OR
        (
          "industry_operation_sites"."latitude" IS NOT NULL
          AND "industry_operation_sites"."longitude" IS NOT NULL
          AND "industry_operation_sites"."coordinate_precision" IS NOT NULL
        )
      ),
	CONSTRAINT "industry_operation_sites_source_url_check" CHECK ("industry_operation_sites"."source_url" ~ '^https://'),
	CONSTRAINT "industry_operation_sites_published_check" CHECK (
        "industry_operation_sites"."publication_status" <> 'published'
        OR (
          "industry_operation_sites"."verification_status" = 'verified'
          AND "industry_operation_sites"."is_active" = true
          AND "industry_operation_sites"."latitude" IS NOT NULL
          AND "industry_operation_sites"."longitude" IS NOT NULL
          AND "industry_operation_sites"."coordinate_precision" IS NOT NULL
        )
      )
);
--> statement-breakpoint
ALTER TABLE "industry_operation_sites" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "industry_company_production" ADD CONSTRAINT "industry_company_production_company_id_industry_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."industry_companies"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "industry_company_production" ADD CONSTRAINT "industry_company_production_commodity_id_commodities_id_fk" FOREIGN KEY ("commodity_id") REFERENCES "public"."commodities"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "industry_company_production" ADD CONSTRAINT "industry_company_production_unit_code_measurement_units_code_fk" FOREIGN KEY ("unit_code") REFERENCES "public"."measurement_units"("code") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "industry_company_production" ADD CONSTRAINT "industry_company_production_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "industry_company_production" ADD CONSTRAINT "industry_company_production_source_report_id_industry_reports_id_fk" FOREIGN KEY ("source_report_id") REFERENCES "public"."industry_reports"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "industry_company_financials" ADD CONSTRAINT "industry_company_financials_company_id_industry_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."industry_companies"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "industry_company_financials" ADD CONSTRAINT "industry_company_financials_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "industry_company_financials" ADD CONSTRAINT "industry_company_financials_source_report_id_industry_reports_id_fk" FOREIGN KEY ("source_report_id") REFERENCES "public"."industry_reports"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "industry_operation_sites" ADD CONSTRAINT "industry_operation_sites_company_id_industry_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."industry_companies"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "industry_operation_sites" ADD CONSTRAINT "industry_operation_sites_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "industry_operation_sites" ADD CONSTRAINT "industry_operation_sites_source_report_id_industry_reports_id_fk" FOREIGN KEY ("source_report_id") REFERENCES "public"."industry_reports"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "industry_company_production_unique_record_idx" ON "industry_company_production" USING btree ("company_id","year","metric_code");--> statement-breakpoint
CREATE INDEX "industry_company_production_company_idx" ON "industry_company_production" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "industry_company_production_commodity_idx" ON "industry_company_production" USING btree ("commodity_id");--> statement-breakpoint
CREATE INDEX "industry_company_production_year_idx" ON "industry_company_production" USING btree ("year");--> statement-breakpoint
CREATE INDEX "industry_company_production_source_idx" ON "industry_company_production" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "industry_company_production_public_visibility_idx" ON "industry_company_production" USING btree ("verification_status","publication_status","data_availability");--> statement-breakpoint
CREATE UNIQUE INDEX "industry_company_financials_unique_record_idx" ON "industry_company_financials" USING btree ("company_id","year","metric","statement_scope");--> statement-breakpoint
CREATE INDEX "industry_company_financials_company_idx" ON "industry_company_financials" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "industry_company_financials_year_idx" ON "industry_company_financials" USING btree ("year");--> statement-breakpoint
CREATE INDEX "industry_company_financials_metric_idx" ON "industry_company_financials" USING btree ("metric");--> statement-breakpoint
CREATE INDEX "industry_company_financials_source_idx" ON "industry_company_financials" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "industry_company_financials_public_visibility_idx" ON "industry_company_financials" USING btree ("verification_status","publication_status");--> statement-breakpoint
CREATE UNIQUE INDEX "industry_operation_sites_company_slug_unique_idx" ON "industry_operation_sites" USING btree ("company_id","slug");--> statement-breakpoint
CREATE INDEX "industry_operation_sites_company_idx" ON "industry_operation_sites" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "industry_operation_sites_status_idx" ON "industry_operation_sites" USING btree ("current_status");--> statement-breakpoint
CREATE INDEX "industry_operation_sites_type_idx" ON "industry_operation_sites" USING btree ("site_type");--> statement-breakpoint
CREATE INDEX "industry_operation_sites_source_idx" ON "industry_operation_sites" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "industry_operation_sites_public_visibility_idx" ON "industry_operation_sites" USING btree ("is_active","verification_status","publication_status");--> statement-breakpoint
CREATE POLICY "industry_company_production_public_select_policy" ON "industry_company_production" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (
        "industry_company_production"."verification_status" = 'verified'
        AND "industry_company_production"."publication_status" = 'published'
        AND "industry_company_production"."data_availability" = 'reported'
        AND EXISTS (
          SELECT 1
          FROM "industry_companies" AS company
          WHERE company.id = "industry_company_production"."company_id"
            AND company.is_active = true
            AND company.verification_status = 'verified'
            AND company.publication_status = 'published'
        )
      );--> statement-breakpoint
CREATE POLICY "industry_company_financials_public_select_policy" ON "industry_company_financials" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (
        "industry_company_financials"."verification_status" = 'verified'
        AND "industry_company_financials"."publication_status" = 'published'
        AND EXISTS (
          SELECT 1
          FROM "industry_companies" AS company
          WHERE company.id = "industry_company_financials"."company_id"
            AND company.is_active = true
            AND company.verification_status = 'verified'
            AND company.publication_status = 'published'
        )
      );--> statement-breakpoint
CREATE POLICY "industry_operation_sites_public_select_policy" ON "industry_operation_sites" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (
        "industry_operation_sites"."is_active" = true
        AND "industry_operation_sites"."verification_status" = 'verified'
        AND "industry_operation_sites"."publication_status" = 'published'
        AND "industry_operation_sites"."latitude" IS NOT NULL
        AND "industry_operation_sites"."longitude" IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM "industry_companies" AS company
          WHERE company.id = "industry_operation_sites"."company_id"
            AND company.is_active = true
            AND company.verification_status = 'verified'
            AND company.publication_status = 'published'
        )
      );--> statement-breakpoint
INSERT INTO "measurement_units" (
	"name",
	"code",
	"symbol",
	"category",
	"description",
	"is_active"
)
VALUES
	(
		'Wet Metric Ton',
		'wet_metric_ton',
		'wmt',
		'mass',
		'Satuan metrik ton berdasarkan berat material dalam kondisi basah.',
		true
	),
	(
		'Pound',
		'pound',
		'lb',
		'mass',
		'Satuan massa avoirdupois setara dengan 0,45359237 kilogram.',
		true
	)
ON CONFLICT ("code") DO UPDATE SET
	"name" = EXCLUDED."name",
	"symbol" = EXCLUDED."symbol",
	"category" = EXCLUDED."category",
	"description" = EXCLUDED."description",
	"is_active" = EXCLUDED."is_active",
	"updated_at" = now();--> statement-breakpoint
REVOKE ALL ON TABLE "industry_company_production" FROM "anon", "authenticated";--> statement-breakpoint
REVOKE ALL ON TABLE "industry_company_financials" FROM "anon", "authenticated";--> statement-breakpoint
REVOKE ALL ON TABLE "industry_operation_sites" FROM "anon", "authenticated";--> statement-breakpoint
GRANT SELECT ON TABLE "industry_company_production" TO "anon", "authenticated";--> statement-breakpoint
GRANT SELECT ON TABLE "industry_company_financials" TO "anon", "authenticated";--> statement-breakpoint
GRANT SELECT ON TABLE "industry_operation_sites" TO "anon", "authenticated";
