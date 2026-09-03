CREATE TABLE "commodity_contents" (
	"commodity_id" uuid NOT NULL,
	"content_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commodity_contents_pk" PRIMARY KEY("commodity_id","content_id"),
	CONSTRAINT "commodity_contents_display_order_check" CHECK ("commodity_contents"."display_order" >= 0)
);
--> statement-breakpoint
ALTER TABLE "commodity_contents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commodity_resource_statistics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"commodity_id" uuid NOT NULL,
	"statistic_year" smallint NOT NULL,
	"statistic_type" varchar(40) NOT NULL,
	"material_basis" varchar(40),
	"availability_status" varchar(30) DEFAULT 'reported' NOT NULL,
	"value" numeric(30, 6),
	"unit_code" varchar(50),
	"record_type" "data_record_type" DEFAULT 'actual' NOT NULL,
	"source_id" uuid NOT NULL,
	"source_url" text,
	"page_reference" varchar(100),
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"publication_status" "publication_status" DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commodity_resource_statistics_year_check" CHECK ("commodity_resource_statistics"."statistic_year" BETWEEN 1900 AND 2100),
	CONSTRAINT "commodity_resource_statistics_type_check" CHECK ("commodity_resource_statistics"."statistic_type" IN (
        'reserve',
        'resource',
        'installed_capacity',
        'working_area_count'
      )),
	CONSTRAINT "commodity_resource_statistics_material_basis_check" CHECK ("commodity_resource_statistics"."material_basis" IS NULL
        OR "commodity_resource_statistics"."material_basis" IN (
          'ore',
          'contained_metal',
          'alumina',
          'raw_material',
          'energy_capacity'
        )),
	CONSTRAINT "commodity_resource_statistics_availability_check" CHECK ("commodity_resource_statistics"."availability_status" IN (
        'reported',
        'not_reported',
        'not_applicable'
      )),
	CONSTRAINT "commodity_resource_statistics_value_state_check" CHECK (
        (
          "commodity_resource_statistics"."availability_status" = 'reported'
          AND "commodity_resource_statistics"."value" IS NOT NULL
          AND "commodity_resource_statistics"."unit_code" IS NOT NULL
        )
        OR
        (
          "commodity_resource_statistics"."availability_status" IN ('not_reported', 'not_applicable')
          AND "commodity_resource_statistics"."value" IS NULL
          AND "commodity_resource_statistics"."unit_code" IS NULL
        )
      ),
	CONSTRAINT "commodity_resource_statistics_value_check" CHECK ("commodity_resource_statistics"."value" IS NULL OR "commodity_resource_statistics"."value" >= 0),
	CONSTRAINT "commodity_resource_statistics_working_area_count_check" CHECK (
        "commodity_resource_statistics"."statistic_type" <> 'working_area_count'
        OR "commodity_resource_statistics"."availability_status" <> 'reported'
        OR "commodity_resource_statistics"."value" = TRUNC("commodity_resource_statistics"."value")
      ),
	CONSTRAINT "commodity_resource_statistics_published_check" CHECK (
        "commodity_resource_statistics"."publication_status" <> 'published'
        OR "commodity_resource_statistics"."verification_status" = 'verified'
      ),
	CONSTRAINT "commodity_resource_statistics_source_url_check" CHECK ("commodity_resource_statistics"."source_url" IS NULL OR "commodity_resource_statistics"."source_url" ~ '^https://')
);
--> statement-breakpoint
ALTER TABLE "commodity_resource_statistics" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commodity_resource_statistic_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_statistic_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"source_role" varchar(30) NOT NULL,
	"citation_label" text,
	"source_url" text,
	"page_reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commodity_resource_statistic_sources_role_check" CHECK ("commodity_resource_statistic_sources"."source_role" IN ('supporting', 'cross_check')),
	CONSTRAINT "commodity_resource_statistic_sources_source_url_check" CHECK ("commodity_resource_statistic_sources"."source_url" IS NULL OR "commodity_resource_statistic_sources"."source_url" ~ '^https://')
);
--> statement-breakpoint
ALTER TABLE "commodity_resource_statistic_sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commodity_global_statistic_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"statistic_set_id" uuid NOT NULL,
	"country_region_id" uuid NOT NULL,
	"rank" smallint NOT NULL,
	"value" numeric(30, 6) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commodity_global_statistic_entries_rank_check" CHECK ("commodity_global_statistic_entries"."rank" > 0),
	CONSTRAINT "commodity_global_statistic_entries_value_check" CHECK ("commodity_global_statistic_entries"."value" >= 0)
);
--> statement-breakpoint
ALTER TABLE "commodity_global_statistic_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commodity_global_statistic_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"commodity_id" uuid NOT NULL,
	"statistic_year" smallint NOT NULL,
	"metric_code" varchar(50) NOT NULL,
	"basis_code" varchar(50) NOT NULL,
	"unit_code" varchar(50),
	"availability_status" varchar(30) DEFAULT 'reported' NOT NULL,
	"record_type" "data_record_type" DEFAULT 'actual' NOT NULL,
	"source_id" uuid,
	"source_url" text,
	"page_reference" text,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"publication_status" "publication_status" DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commodity_global_statistic_sets_year_check" CHECK ("commodity_global_statistic_sets"."statistic_year" BETWEEN 1900 AND 2100),
	CONSTRAINT "commodity_global_statistic_sets_metric_code_check" CHECK ("commodity_global_statistic_sets"."metric_code" IN ('mine_production', 'installed_capacity')),
	CONSTRAINT "commodity_global_statistic_sets_availability_check" CHECK ("commodity_global_statistic_sets"."availability_status" IN (
        'reported',
        'not_reported',
        'not_applicable',
        'source_unavailable'
      )),
	CONSTRAINT "commodity_global_statistic_sets_reported_check" CHECK (
        "commodity_global_statistic_sets"."availability_status" <> 'reported'
        OR (
          "commodity_global_statistic_sets"."unit_code" IS NOT NULL
          AND "commodity_global_statistic_sets"."source_id" IS NOT NULL
        )
      ),
	CONSTRAINT "commodity_global_statistic_sets_source_unavailable_check" CHECK (
        "commodity_global_statistic_sets"."availability_status" <> 'source_unavailable'
        OR (
          "commodity_global_statistic_sets"."unit_code" IS NULL
          AND "commodity_global_statistic_sets"."source_id" IS NULL
        )
      ),
	CONSTRAINT "commodity_global_statistic_sets_published_check" CHECK (
        "commodity_global_statistic_sets"."publication_status" <> 'published'
        OR "commodity_global_statistic_sets"."verification_status" = 'verified'
      ),
	CONSTRAINT "commodity_global_statistic_sets_source_url_check" CHECK ("commodity_global_statistic_sets"."source_url" IS NULL OR "commodity_global_statistic_sets"."source_url" ~ '^https://')
);
--> statement-breakpoint
ALTER TABLE "commodity_global_statistic_sets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commodity_global_statistic_set_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"statistic_set_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"source_role" varchar(30) NOT NULL,
	"citation_label" text,
	"source_url" text,
	"page_reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commodity_global_statistic_set_sources_role_check" CHECK ("commodity_global_statistic_set_sources"."source_role" IN ('supporting', 'cross_check')),
	CONSTRAINT "commodity_global_statistic_set_sources_source_url_check" CHECK ("commodity_global_statistic_set_sources"."source_url" IS NULL OR "commodity_global_statistic_set_sources"."source_url" ~ '^https://')
);
--> statement-breakpoint
ALTER TABLE "commodity_global_statistic_set_sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commodity_producers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"commodity_id" uuid NOT NULL,
	"industry_company_id" uuid,
	"producer_key" varchar(180) NOT NULL,
	"company_name" varchar(200) NOT NULL,
	"operation_area" text NOT NULL,
	"primary_region_id" uuid,
	"producer_role" varchar(60),
	"display_order" integer DEFAULT 0 NOT NULL,
	"source_id" uuid NOT NULL,
	"source_url" text NOT NULL,
	"page_reference" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"publication_status" "publication_status" DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commodity_producers_producer_key_check" CHECK (NULLIF(BTRIM("commodity_producers"."producer_key"), '') IS NOT NULL),
	CONSTRAINT "commodity_producers_company_name_check" CHECK (NULLIF(BTRIM("commodity_producers"."company_name"), '') IS NOT NULL),
	CONSTRAINT "commodity_producers_operation_area_check" CHECK (NULLIF(BTRIM("commodity_producers"."operation_area"), '') IS NOT NULL),
	CONSTRAINT "commodity_producers_source_url_check" CHECK (NULLIF(BTRIM("commodity_producers"."source_url"), '') IS NOT NULL
        AND "commodity_producers"."source_url" ~ '^https://'),
	CONSTRAINT "commodity_producers_display_order_check" CHECK ("commodity_producers"."display_order" >= 0),
	CONSTRAINT "commodity_producers_published_check" CHECK (
        "commodity_producers"."publication_status" <> 'published'
        OR (
          "commodity_producers"."verification_status" = 'verified'
          AND "commodity_producers"."is_active" = true
        )
      )
);
--> statement-breakpoint
ALTER TABLE "commodity_producers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "commodities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "contents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "content_sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "measurement_units" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "regions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "commodity_production_locations" DROP CONSTRAINT IF EXISTS "commodity_production_locations_data_check";--> statement-breakpoint
ALTER TABLE "commodity_production_locations" DROP CONSTRAINT IF EXISTS "commodity_production_locations_period_data_check";--> statement-breakpoint
ALTER TABLE "commodities" DROP CONSTRAINT IF EXISTS "commodities_default_production_unit_code_measurement_units_code";
--> statement-breakpoint
ALTER TABLE "commodities" DROP CONSTRAINT IF EXISTS "commodities_default_prod_unit_fk";--> statement-breakpoint
DROP INDEX IF EXISTS "commodity_production_locations_unique_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "commodity_production_locations_annual_unique_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "commodity_production_locations_undated_unique_idx";--> statement-breakpoint
ALTER TABLE "commodity_production_locations" ALTER COLUMN "year" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "commodities" ADD COLUMN "image_alt" text;--> statement-breakpoint
ALTER TABLE "commodities" ADD COLUMN "image_credit" text;--> statement-breakpoint
ALTER TABLE "commodities" ADD COLUMN "image_source_url" text;--> statement-breakpoint
ALTER TABLE "commodity_production_locations" ADD COLUMN IF NOT EXISTS "location_detail" text;--> statement-breakpoint
ALTER TABLE "commodity_contents" ADD CONSTRAINT "commodity_contents_commodity_id_commodities_id_fk" FOREIGN KEY ("commodity_id") REFERENCES "public"."commodities"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_contents" ADD CONSTRAINT "commodity_contents_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_resource_statistics" ADD CONSTRAINT "commodity_resource_statistics_commodity_id_commodities_id_fk" FOREIGN KEY ("commodity_id") REFERENCES "public"."commodities"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_resource_statistics" ADD CONSTRAINT "commodity_resource_statistics_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_resource_statistics" ADD CONSTRAINT "commodity_resource_stats_unit_fk" FOREIGN KEY ("unit_code") REFERENCES "public"."measurement_units"("code") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_resource_statistic_sources" ADD CONSTRAINT "commodity_resource_statistic_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_resource_statistic_sources" ADD CONSTRAINT "commodity_resource_stat_sources_parent_fk" FOREIGN KEY ("resource_statistic_id") REFERENCES "public"."commodity_resource_statistics"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_global_statistic_entries" ADD CONSTRAINT "commodity_global_entries_set_fk" FOREIGN KEY ("statistic_set_id") REFERENCES "public"."commodity_global_statistic_sets"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_global_statistic_entries" ADD CONSTRAINT "commodity_global_entries_country_fk" FOREIGN KEY ("country_region_id") REFERENCES "public"."regions"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_global_statistic_sets" ADD CONSTRAINT "commodity_global_statistic_sets_commodity_id_commodities_id_fk" FOREIGN KEY ("commodity_id") REFERENCES "public"."commodities"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_global_statistic_sets" ADD CONSTRAINT "commodity_global_statistic_sets_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_global_statistic_sets" ADD CONSTRAINT "commodity_global_sets_unit_fk" FOREIGN KEY ("unit_code") REFERENCES "public"."measurement_units"("code") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_global_statistic_set_sources" ADD CONSTRAINT "commodity_global_statistic_set_sources_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_global_statistic_set_sources" ADD CONSTRAINT "commodity_global_set_sources_parent_fk" FOREIGN KEY ("statistic_set_id") REFERENCES "public"."commodity_global_statistic_sets"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_producers" ADD CONSTRAINT "commodity_producers_commodity_id_commodities_id_fk" FOREIGN KEY ("commodity_id") REFERENCES "public"."commodities"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_producers" ADD CONSTRAINT "commodity_producers_primary_region_id_regions_id_fk" FOREIGN KEY ("primary_region_id") REFERENCES "public"."regions"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_producers" ADD CONSTRAINT "commodity_producers_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_producers" ADD CONSTRAINT "commodity_producers_industry_company_fk" FOREIGN KEY ("industry_company_id") REFERENCES "public"."industry_companies"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "commodity_contents_content_id_unique_idx" ON "commodity_contents" USING btree ("content_id");--> statement-breakpoint
CREATE UNIQUE INDEX "commodity_contents_one_primary_idx" ON "commodity_contents" USING btree ("commodity_id") WHERE "commodity_contents"."is_primary" = true;--> statement-breakpoint
CREATE INDEX "commodity_contents_commodity_id_idx" ON "commodity_contents" USING btree ("commodity_id");--> statement-breakpoint
CREATE INDEX "commodity_contents_display_order_idx" ON "commodity_contents" USING btree ("commodity_id","display_order");--> statement-breakpoint
CREATE UNIQUE INDEX "commodity_resource_statistics_material_basis_unique_idx" ON "commodity_resource_statistics" USING btree ("commodity_id","statistic_year","statistic_type","material_basis","record_type") WHERE "commodity_resource_statistics"."material_basis" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "commodity_resource_statistics_null_basis_unique_idx" ON "commodity_resource_statistics" USING btree ("commodity_id","statistic_year","statistic_type","record_type") WHERE "commodity_resource_statistics"."material_basis" IS NULL;--> statement-breakpoint
CREATE INDEX "commodity_resource_statistics_commodity_id_idx" ON "commodity_resource_statistics" USING btree ("commodity_id");--> statement-breakpoint
CREATE INDEX "commodity_resource_statistics_source_id_idx" ON "commodity_resource_statistics" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "commodity_resource_statistics_unit_code_idx" ON "commodity_resource_statistics" USING btree ("unit_code");--> statement-breakpoint
CREATE INDEX "commodity_resource_statistics_commodity_year_idx" ON "commodity_resource_statistics" USING btree ("commodity_id","statistic_year");--> statement-breakpoint
CREATE INDEX "commodity_resource_statistics_public_visibility_idx" ON "commodity_resource_statistics" USING btree ("verification_status","publication_status");--> statement-breakpoint
CREATE UNIQUE INDEX "commodity_resource_statistic_sources_unique_reference_idx" ON "commodity_resource_statistic_sources" USING btree ("resource_statistic_id","source_id","source_role",COALESCE("citation_label", ''),COALESCE("page_reference", ''));--> statement-breakpoint
CREATE INDEX "commodity_resource_statistic_sources_parent_idx" ON "commodity_resource_statistic_sources" USING btree ("resource_statistic_id");--> statement-breakpoint
CREATE INDEX "commodity_resource_statistic_sources_source_id_idx" ON "commodity_resource_statistic_sources" USING btree ("source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "commodity_global_statistic_entries_country_unique_idx" ON "commodity_global_statistic_entries" USING btree ("statistic_set_id","country_region_id");--> statement-breakpoint
CREATE UNIQUE INDEX "commodity_global_statistic_entries_rank_unique_idx" ON "commodity_global_statistic_entries" USING btree ("statistic_set_id","rank");--> statement-breakpoint
CREATE INDEX "commodity_global_statistic_entries_set_id_idx" ON "commodity_global_statistic_entries" USING btree ("statistic_set_id");--> statement-breakpoint
CREATE INDEX "commodity_global_statistic_entries_country_region_id_idx" ON "commodity_global_statistic_entries" USING btree ("country_region_id");--> statement-breakpoint
CREATE UNIQUE INDEX "commodity_global_statistic_sets_unique_record_idx" ON "commodity_global_statistic_sets" USING btree ("commodity_id","statistic_year","metric_code","basis_code","record_type");--> statement-breakpoint
CREATE INDEX "commodity_global_statistic_sets_commodity_id_idx" ON "commodity_global_statistic_sets" USING btree ("commodity_id");--> statement-breakpoint
CREATE INDEX "commodity_global_statistic_sets_unit_code_idx" ON "commodity_global_statistic_sets" USING btree ("unit_code");--> statement-breakpoint
CREATE INDEX "commodity_global_statistic_sets_source_id_idx" ON "commodity_global_statistic_sets" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "commodity_global_statistic_sets_commodity_year_idx" ON "commodity_global_statistic_sets" USING btree ("commodity_id","statistic_year");--> statement-breakpoint
CREATE INDEX "commodity_global_statistic_sets_public_visibility_idx" ON "commodity_global_statistic_sets" USING btree ("verification_status","publication_status");--> statement-breakpoint
CREATE UNIQUE INDEX "commodity_global_statistic_set_sources_unique_reference_idx" ON "commodity_global_statistic_set_sources" USING btree ("statistic_set_id","source_id","source_role",COALESCE("citation_label", ''),COALESCE("page_reference", ''));--> statement-breakpoint
CREATE INDEX "commodity_global_statistic_set_sources_parent_idx" ON "commodity_global_statistic_set_sources" USING btree ("statistic_set_id");--> statement-breakpoint
CREATE INDEX "commodity_global_statistic_set_sources_source_id_idx" ON "commodity_global_statistic_set_sources" USING btree ("source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "commodity_producers_commodity_key_unique_idx" ON "commodity_producers" USING btree ("commodity_id","producer_key");--> statement-breakpoint
CREATE INDEX "commodity_producers_commodity_id_idx" ON "commodity_producers" USING btree ("commodity_id");--> statement-breakpoint
CREATE INDEX "commodity_producers_industry_company_id_idx" ON "commodity_producers" USING btree ("industry_company_id");--> statement-breakpoint
CREATE INDEX "commodity_producers_primary_region_id_idx" ON "commodity_producers" USING btree ("primary_region_id");--> statement-breakpoint
CREATE INDEX "commodity_producers_source_id_idx" ON "commodity_producers" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "commodity_producers_display_order_idx" ON "commodity_producers" USING btree ("commodity_id","display_order");--> statement-breakpoint
CREATE INDEX "commodity_producers_public_visibility_idx" ON "commodity_producers" USING btree ("verification_status","publication_status","is_active");--> statement-breakpoint
ALTER TABLE "commodities" ADD CONSTRAINT "commodities_default_prod_unit_fk" FOREIGN KEY ("default_production_unit_code") REFERENCES "public"."measurement_units"("code") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "commodity_production_locations_annual_unique_idx" ON "commodity_production_locations" USING btree ("commodity_id","region_id","year","record_type") WHERE "commodity_production_locations"."year" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "commodity_production_locations_undated_unique_idx" ON "commodity_production_locations" USING btree ("commodity_id","region_id","record_type") WHERE "commodity_production_locations"."year" IS NULL;--> statement-breakpoint
ALTER TABLE "commodities" ADD CONSTRAINT "commodities_image_alt_check" CHECK ("commodities"."image_alt" IS NULL
        OR NULLIF(BTRIM("commodities"."image_alt"), '') IS NOT NULL);--> statement-breakpoint
ALTER TABLE "commodities" ADD CONSTRAINT "commodities_image_credit_check" CHECK ("commodities"."image_credit" IS NULL
        OR NULLIF(BTRIM("commodities"."image_credit"), '') IS NOT NULL);--> statement-breakpoint
ALTER TABLE "commodities" ADD CONSTRAINT "commodities_image_source_url_check" CHECK ("commodities"."image_source_url" IS NULL
        OR "commodities"."image_source_url" ~ '^https://');--> statement-breakpoint
ALTER TABLE "commodity_production_locations" ADD CONSTRAINT "commodity_production_locations_period_data_check" CHECK (
          "commodity_production_locations"."year" IS NOT NULL
          OR (
            "commodity_production_locations"."production_value" IS NULL
            AND "commodity_production_locations"."unit_code" IS NULL
            AND "commodity_production_locations"."share_percentage" IS NULL
            AND "commodity_production_locations"."producer_rank" IS NULL
          )
        );--> statement-breakpoint
ALTER TABLE "commodity_production_locations" ADD CONSTRAINT "commodity_production_locations_data_check" CHECK (
          "commodity_production_locations"."production_value" IS NOT NULL
          OR "commodity_production_locations"."producer_rank" IS NOT NULL
          OR "commodity_production_locations"."share_percentage" IS NOT NULL
          OR NULLIF(BTRIM("commodity_production_locations"."location_detail"), '') IS NOT NULL
        );--> statement-breakpoint
CREATE POLICY "commodities_public_read" ON "commodities" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("commodities"."is_active" = true);--> statement-breakpoint
CREATE POLICY "contents_commodity_public_read" ON "contents" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (
        "contents"."module" = 'commodities'
        AND "contents"."type" = 'commodity_profile'
        AND "contents"."status" = 'published'
      );--> statement-breakpoint
CREATE POLICY "content_sources_commodity_public_read" ON "content_sources" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (
        EXISTS (
          SELECT 1
          FROM "contents" AS content
          WHERE content.id = "content_sources"."content_id"
            AND content.module = 'commodities'
            AND content.type = 'commodity_profile'
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
CREATE POLICY "measurement_units_public_read" ON "measurement_units" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("measurement_units"."is_active" = true);--> statement-breakpoint
CREATE POLICY "sources_public_read" ON "sources" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (
        "sources"."is_active" = true
        AND "sources"."verification_status" = 'verified'
      );--> statement-breakpoint
CREATE POLICY "regions_public_read" ON "regions" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("regions"."is_active" = true);--> statement-breakpoint
CREATE POLICY "commodity_contents_public_read" ON "commodity_contents" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (
        EXISTS (
          SELECT 1
          FROM "commodities" AS commodity
          WHERE commodity.id = "commodity_contents"."commodity_id"
            AND commodity.is_active = true
        )
        AND EXISTS (
          SELECT 1
          FROM "contents" AS content
          WHERE content.id = "commodity_contents"."content_id"
            AND content.module = 'commodities'
            AND content.type = 'commodity_profile'
            AND content.status = 'published'
        )
      );--> statement-breakpoint
CREATE POLICY "commodity_resource_stats_public_read" ON "commodity_resource_statistics" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (
        "commodity_resource_statistics"."verification_status" = 'verified'
        AND "commodity_resource_statistics"."publication_status" = 'published'
        AND EXISTS (
          SELECT 1
          FROM "commodities" AS commodity
          WHERE commodity.id = "commodity_resource_statistics"."commodity_id"
            AND commodity.is_active = true
        )
        AND EXISTS (
          SELECT 1
          FROM "sources" AS source
          WHERE source.id = "commodity_resource_statistics"."source_id"
            AND source.is_active = true
            AND source.verification_status = 'verified'
        )
      );--> statement-breakpoint
CREATE POLICY "commodity_resource_stat_sources_public_read" ON "commodity_resource_statistic_sources" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (
        EXISTS (
          SELECT 1
          FROM "commodity_resource_statistics" AS statistic
          INNER JOIN "commodities" AS commodity
            ON commodity.id = statistic.commodity_id
          WHERE statistic.id = "commodity_resource_statistic_sources"."resource_statistic_id"
            AND statistic.verification_status = 'verified'
            AND statistic.publication_status = 'published'
            AND commodity.is_active = true
        )
        AND EXISTS (
          SELECT 1
          FROM "sources" AS source
          WHERE source.id = "commodity_resource_statistic_sources"."source_id"
            AND source.is_active = true
            AND source.verification_status = 'verified'
        )
      );--> statement-breakpoint
CREATE POLICY "commodity_global_entries_public_read" ON "commodity_global_statistic_entries" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (
        EXISTS (
          SELECT 1
          FROM "commodity_global_statistic_sets" AS statistic_set
          INNER JOIN "commodities" AS commodity
            ON commodity.id = statistic_set.commodity_id
          WHERE statistic_set.id = "commodity_global_statistic_entries"."statistic_set_id"
            AND statistic_set.availability_status = 'reported'
            AND statistic_set.verification_status = 'verified'
            AND statistic_set.publication_status = 'published'
            AND commodity.is_active = true
        )
      );--> statement-breakpoint
CREATE POLICY "commodity_global_sets_public_read" ON "commodity_global_statistic_sets" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (
        "commodity_global_statistic_sets"."verification_status" = 'verified'
        AND "commodity_global_statistic_sets"."publication_status" = 'published'
        AND EXISTS (
          SELECT 1
          FROM "commodities" AS commodity
          WHERE commodity.id = "commodity_global_statistic_sets"."commodity_id"
            AND commodity.is_active = true
        )
        AND (
          (
            "commodity_global_statistic_sets"."availability_status" = 'source_unavailable'
            AND "commodity_global_statistic_sets"."source_id" IS NULL
          )
          OR (
            "commodity_global_statistic_sets"."availability_status" <> 'source_unavailable'
            AND EXISTS (
              SELECT 1
              FROM "sources" AS source
              WHERE source.id = "commodity_global_statistic_sets"."source_id"
                AND source.is_active = true
                AND source.verification_status = 'verified'
            )
          )
        )
      );--> statement-breakpoint
CREATE POLICY "commodity_global_set_sources_public_read" ON "commodity_global_statistic_set_sources" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (
        EXISTS (
          SELECT 1
          FROM "commodity_global_statistic_sets" AS statistic_set
          INNER JOIN "commodities" AS commodity
            ON commodity.id = statistic_set.commodity_id
          WHERE statistic_set.id = "commodity_global_statistic_set_sources"."statistic_set_id"
            AND statistic_set.verification_status = 'verified'
            AND statistic_set.publication_status = 'published'
            AND commodity.is_active = true
        )
        AND EXISTS (
          SELECT 1
          FROM "sources" AS source
          WHERE source.id = "commodity_global_statistic_set_sources"."source_id"
            AND source.is_active = true
            AND source.verification_status = 'verified'
        )
      );--> statement-breakpoint
CREATE POLICY "commodity_producers_public_read" ON "commodity_producers" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (
        "commodity_producers"."is_active" = true
        AND "commodity_producers"."verification_status" = 'verified'
        AND "commodity_producers"."publication_status" = 'published'
        AND EXISTS (
          SELECT 1
          FROM "commodities" AS commodity
          WHERE commodity.id = "commodity_producers"."commodity_id"
            AND commodity.is_active = true
        )
        AND EXISTS (
          SELECT 1
          FROM "sources" AS source
          WHERE source.id = "commodity_producers"."source_id"
            AND source.is_active = true
            AND source.verification_status = 'verified'
        )
      );--> statement-breakpoint
REVOKE ALL ON TABLE "commodities" FROM "anon", "authenticated";--> statement-breakpoint
REVOKE ALL ON TABLE "measurement_units" FROM "anon", "authenticated";--> statement-breakpoint
REVOKE ALL ON TABLE "regions" FROM "anon", "authenticated";--> statement-breakpoint
REVOKE ALL ON TABLE "sources" FROM "anon", "authenticated";--> statement-breakpoint
REVOKE ALL ON TABLE "contents" FROM "anon", "authenticated";--> statement-breakpoint
REVOKE ALL ON TABLE "content_sources" FROM "anon", "authenticated";--> statement-breakpoint
REVOKE ALL ON TABLE "commodity_contents" FROM "anon", "authenticated";--> statement-breakpoint
REVOKE ALL ON TABLE "commodity_resource_statistics" FROM "anon", "authenticated";--> statement-breakpoint
REVOKE ALL ON TABLE "commodity_resource_statistic_sources" FROM "anon", "authenticated";--> statement-breakpoint
REVOKE ALL ON TABLE "commodity_global_statistic_sets" FROM "anon", "authenticated";--> statement-breakpoint
REVOKE ALL ON TABLE "commodity_global_statistic_entries" FROM "anon", "authenticated";--> statement-breakpoint
REVOKE ALL ON TABLE "commodity_global_statistic_set_sources" FROM "anon", "authenticated";--> statement-breakpoint
REVOKE ALL ON TABLE "commodity_producers" FROM "anon", "authenticated";--> statement-breakpoint
GRANT SELECT ON TABLE "commodities" TO "anon", "authenticated";--> statement-breakpoint
GRANT SELECT ON TABLE "measurement_units" TO "anon", "authenticated";--> statement-breakpoint
GRANT SELECT ON TABLE "regions" TO "anon", "authenticated";--> statement-breakpoint
GRANT SELECT ON TABLE "sources" TO "anon", "authenticated";--> statement-breakpoint
GRANT SELECT ON TABLE "contents" TO "anon", "authenticated";--> statement-breakpoint
GRANT SELECT ON TABLE "content_sources" TO "anon", "authenticated";--> statement-breakpoint
GRANT SELECT ON TABLE "commodity_contents" TO "anon", "authenticated";--> statement-breakpoint
GRANT SELECT ON TABLE "commodity_resource_statistics" TO "anon", "authenticated";--> statement-breakpoint
GRANT SELECT ON TABLE "commodity_resource_statistic_sources" TO "anon", "authenticated";--> statement-breakpoint
GRANT SELECT ON TABLE "commodity_global_statistic_sets" TO "anon", "authenticated";--> statement-breakpoint
GRANT SELECT ON TABLE "commodity_global_statistic_entries" TO "anon", "authenticated";--> statement-breakpoint
GRANT SELECT ON TABLE "commodity_global_statistic_set_sources" TO "anon", "authenticated";--> statement-breakpoint
GRANT SELECT ON TABLE "commodity_producers" TO "anon", "authenticated";
