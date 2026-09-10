-- Run through Drizzle's transactional migrator only. Never apply piecemeal.
LOCK TABLE "commodity_production", "commodity_domestic_prices", "commodity_production_locations" IN ACCESS EXCLUSIVE MODE;
--> statement-breakpoint
CREATE TEMP TABLE intelligence_production_before ON COMMIT DROP AS
SELECT id, to_jsonb(p) AS original FROM public.commodity_production p;
--> statement-breakpoint
CREATE TEMP TABLE intelligence_prices_before ON COMMIT DROP AS
SELECT id, to_jsonb(p) AS original FROM public.commodity_domestic_prices p;
--> statement-breakpoint
CREATE TABLE "commodity_production_series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"commodity_id" uuid NOT NULL,
	"series_code" varchar(180) NOT NULL,
	"name" text NOT NULL,
	"product_form" varchar(30) NOT NULL,
	"production_scope" varchar(30) NOT NULL,
	"unit_code" varchar(50) NOT NULL,
	"specification" text,
	"methodology_notes" text,
	"primary_source_id" uuid,
	"is_canonical" boolean DEFAULT false NOT NULL,
	"is_public_default" boolean DEFAULT false NOT NULL,
	"publication_status" "publication_status" DEFAULT 'draft' NOT NULL,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"valid_from_year" smallint,
	"valid_to_year" smallint,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "production_series_code_check" CHECK ("commodity_production_series"."series_code" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "production_series_name_check" CHECK (length(btrim("commodity_production_series"."name")) > 0),
	CONSTRAINT "production_series_form_check" CHECK ("commodity_production_series"."product_form" IN ('coal','ore','concentrate','metal','unclassified')),
	CONSTRAINT "production_series_scope_check" CHECK ("commodity_production_series"."production_scope" IN ('national','province','regency','site')),
	CONSTRAINT "production_series_years_check" CHECK (("commodity_production_series"."valid_from_year" IS NULL OR "commodity_production_series"."valid_from_year" BETWEEN 1900 AND 2100) AND ("commodity_production_series"."valid_to_year" IS NULL OR "commodity_production_series"."valid_to_year" BETWEEN 1900 AND 2100) AND ("commodity_production_series"."valid_from_year" IS NULL OR "commodity_production_series"."valid_to_year" IS NULL OR "commodity_production_series"."valid_from_year" <= "commodity_production_series"."valid_to_year")),
	CONSTRAINT "production_series_default_check" CHECK (NOT "commodity_production_series"."is_public_default" OR ("commodity_production_series"."is_canonical" AND "commodity_production_series"."product_form" <> 'unclassified' AND "commodity_production_series"."publication_status" = 'published' AND "commodity_production_series"."verification_status" = 'verified' AND "commodity_production_series"."primary_source_id" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "commodity_production_series" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commodity_region_coverage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"commodity_id" uuid NOT NULL,
	"region_id" uuid NOT NULL,
	"coverage_type" varchar(30) NOT NULL,
	"production_value" numeric(24, 6),
	"production_year" smallint,
	"unit_code" varchar(50),
	"rank" smallint,
	"ranking_status" varchar(30) DEFAULT 'unavailable' NOT NULL,
	"ranking_evidence" text,
	"related_company_id" uuid,
	"related_company_name" text,
	"source_id" uuid,
	"source_url" text,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"publication_status" "publication_status" DEFAULT 'draft' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "region_coverage_type_check" CHECK ("commodity_region_coverage"."coverage_type" IN ('primary','secondary','known_occurrence','historical')),
	CONSTRAINT "region_coverage_ranking_check" CHECK ("commodity_region_coverage"."ranking_status" IN ('verified','unverified','unavailable') AND (("commodity_region_coverage"."ranking_status" = 'verified' AND "commodity_region_coverage"."rank" > 0 AND "commodity_region_coverage"."rank" IS NOT NULL AND "commodity_region_coverage"."production_value" IS NOT NULL AND "commodity_region_coverage"."production_year" IS NOT NULL AND "commodity_region_coverage"."unit_code" IS NOT NULL AND NULLIF(btrim("commodity_region_coverage"."ranking_evidence"), '') IS NOT NULL) OR ("commodity_region_coverage"."ranking_status" <> 'verified' AND "commodity_region_coverage"."rank" IS NULL))),
	CONSTRAINT "region_coverage_value_check" CHECK ("commodity_region_coverage"."production_value" IS NULL OR ("commodity_region_coverage"."production_value" >= 0 AND "commodity_region_coverage"."production_year" IS NOT NULL AND "commodity_region_coverage"."unit_code" IS NOT NULL)),
	CONSTRAINT "region_coverage_year_check" CHECK ("commodity_region_coverage"."production_year" IS NULL OR "commodity_region_coverage"."production_year" BETWEEN 1900 AND 2100),
	CONSTRAINT "region_coverage_verified_check" CHECK ("commodity_region_coverage"."verification_status" <> 'verified' OR "commodity_region_coverage"."source_id" IS NOT NULL),
	CONSTRAINT "region_coverage_publication_check" CHECK ("commodity_region_coverage"."publication_status" <> 'published' OR "commodity_region_coverage"."verification_status" = 'verified'),
	CONSTRAINT "region_coverage_url_check" CHECK ("commodity_region_coverage"."source_url" IS NULL OR "commodity_region_coverage"."source_url" ~ '^https://')
);
--> statement-breakpoint
ALTER TABLE "commodity_region_coverage" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commodity_price_series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"commodity_id" uuid NOT NULL,
	"price_standard_id" uuid NOT NULL,
	"series_code" varchar(180) NOT NULL,
	"name" varchar(200) NOT NULL,
	"period" "price_period" NOT NULL,
	"aggregation_method" varchar(40) NOT NULL,
	"primary_source_id" uuid,
	"methodology_notes" text,
	"is_canonical" boolean DEFAULT false NOT NULL,
	"is_public_default" boolean DEFAULT false NOT NULL,
	"publication_status" "publication_status" DEFAULT 'draft' NOT NULL,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"valid_from_year" smallint,
	"valid_to_year" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "price_series_code_check" CHECK ("commodity_price_series"."series_code" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "price_series_name_check" CHECK (NULLIF(BTRIM("commodity_price_series"."name"), '') IS NOT NULL),
	CONSTRAINT "price_series_aggregation_check" CHECK ("commodity_price_series"."aggregation_method" IN ('annual_average','period_value','unclassified')),
	CONSTRAINT "price_series_years_check" CHECK (("commodity_price_series"."valid_from_year" IS NULL OR "commodity_price_series"."valid_from_year" BETWEEN 1900 AND 2100)
        AND ("commodity_price_series"."valid_to_year" IS NULL OR "commodity_price_series"."valid_to_year" BETWEEN 1900 AND 2100)
        AND ("commodity_price_series"."valid_from_year" IS NULL OR "commodity_price_series"."valid_to_year" IS NULL OR "commodity_price_series"."valid_from_year" <= "commodity_price_series"."valid_to_year")),
	CONSTRAINT "price_series_default_check" CHECK (NOT "commodity_price_series"."is_public_default" OR "commodity_price_series"."is_canonical"),
	CONSTRAINT "price_series_publication_check" CHECK ("commodity_price_series"."publication_status" <> 'published' OR "commodity_price_series"."verification_status" = 'verified')
);
--> statement-breakpoint
ALTER TABLE "commodity_price_series" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "commodity_production" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "commodity_domestic_prices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
-- Migration 0005 omitted commodity_id locally, while development already has it.
-- Inspect the catalog and execute exactly one safe branch.
DO $$
DECLARE
  column_type text;
  nullable_state text;
BEGIN
  SELECT c.udt_name, c.is_nullable INTO column_type, nullable_state
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'commodity_domestic_prices'
    AND c.column_name = 'commodity_id';

  IF column_type IS NULL THEN
    ALTER TABLE public.commodity_domestic_prices ADD COLUMN commodity_id uuid;
    UPDATE public.commodity_domestic_prices p
    SET commodity_id = s.commodity_id
    FROM public.commodity_price_standards s
    WHERE s.id = p.price_standard_id;
    IF EXISTS (SELECT 1 FROM public.commodity_domestic_prices WHERE commodity_id IS NULL) THEN
      RAISE EXCEPTION 'Price commodity backfill incomplete';
    END IF;
    ALTER TABLE public.commodity_domestic_prices ALTER COLUMN commodity_id SET NOT NULL;
  ELSIF column_type <> 'uuid' OR nullable_state <> 'NO' THEN
    RAISE EXCEPTION 'Price schema baseline mismatch: commodity_id must be uuid NOT NULL';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.commodity_domestic_prices'::regclass
      AND conname = 'commodity_domestic_prices_commodity_id_commodities_id_fk'
      AND contype = 'f'
  ) THEN
    ALTER TABLE public.commodity_domestic_prices
      ADD CONSTRAINT commodity_domestic_prices_commodity_id_commodities_id_fk
      FOREIGN KEY (commodity_id) REFERENCES public.commodities(id)
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
--> statement-breakpoint
DROP INDEX "commodity_production_unique_record_idx";--> statement-breakpoint
DROP INDEX "commodity_domestic_prices_unique_record_idx";--> statement-breakpoint
DROP INDEX "commodity_production_locations_annual_unique_idx";--> statement-breakpoint
DROP INDEX "commodity_production_locations_undated_unique_idx";--> statement-breakpoint
ALTER TABLE "commodity_production" ADD COLUMN "series_id" uuid;--> statement-breakpoint
ALTER TABLE "commodity_domestic_prices" ADD COLUMN "price_series_id" uuid;--> statement-breakpoint
INSERT INTO public.commodity_production_series
  (id, commodity_id, series_code, name, product_form, production_scope, unit_code,
   is_canonical, is_public_default, publication_status, verification_status,
   valid_from_year, valid_to_year, methodology_notes)
SELECT md5('minevision:legacy-production:' || c.id::text || ':' || p.unit_code)::uuid,
  c.id, c.slug || '-national-legacy-unclassified-' || replace(p.unit_code, '_', '-'),
  c.name || ' — histori produksi (' || p.unit_code || ')',
  'unclassified', 'national', p.unit_code,
  false, false, 'draft', 'pending', min(p.year), max(p.year),
  'Backfill histori; bentuk produk tidak diasumsikan. Nilai, tipe record, sumber, dan status asli dipertahankan.'
FROM public.commodity_production p
JOIN public.commodities c ON c.id = p.commodity_id
GROUP BY c.id, c.slug, c.name, p.unit_code
ON CONFLICT (id) DO NOTHING;--> statement-breakpoint
UPDATE public.commodity_production p
SET series_id = s.id
FROM public.commodity_production_series s
WHERE p.series_id IS NULL
  AND s.commodity_id = p.commodity_id
  AND s.unit_code = p.unit_code
  AND s.is_canonical = false
  AND s.is_public_default = false;--> statement-breakpoint
ALTER TABLE "commodity_production" ALTER COLUMN "series_id" SET NOT NULL;--> statement-breakpoint
INSERT INTO public.commodity_price_series
  (id, commodity_id, price_standard_id, series_code, name, period,
   aggregation_method, is_canonical, is_public_default, publication_status,
   verification_status, valid_from_year, valid_to_year, methodology_notes)
SELECT md5('minevision:legacy-price:' || p.commodity_id::text || ':' || p.price_standard_id::text || ':' || p.period::text)::uuid,
  p.commodity_id, p.price_standard_id,
  lower(replace(ps.code, '_', '-')) || '-' || p.period::text || '-legacy-v1',
  left(ps.name || ' — histori harga (' || p.period::text || ')', 200),
  p.period, 'unclassified', false, false, 'draft', 'pending',
  min(extract(year FROM p.effective_date))::smallint,
  max(extract(year FROM p.effective_date))::smallint,
  'Backfill histori; metode agregasi tidak diasumsikan. Nilai, sumber, status, dan timestamp observation dipertahankan.'
FROM public.commodity_domestic_prices p
JOIN public.commodity_price_standards ps ON ps.id = p.price_standard_id
GROUP BY p.commodity_id, p.price_standard_id, ps.code, ps.name, p.period
ON CONFLICT (id) DO NOTHING;--> statement-breakpoint
UPDATE public.commodity_domestic_prices p
SET price_series_id = s.id
FROM public.commodity_price_series s
WHERE p.price_series_id IS NULL
  AND s.commodity_id = p.commodity_id
  AND s.price_standard_id = p.price_standard_id
  AND s.period = p.period
  AND s.is_canonical = false
  AND s.is_public_default = false;--> statement-breakpoint
ALTER TABLE "commodity_domestic_prices" ALTER COLUMN "price_series_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "commodity_production_locations" ADD COLUMN "site_slug" varchar(180);--> statement-breakpoint
ALTER TABLE "commodity_production_locations" ADD COLUMN "site_name" text;--> statement-breakpoint
ALTER TABLE "commodity_production_locations" ADD COLUMN "site_type" varchar(30);--> statement-breakpoint
ALTER TABLE "commodity_production_locations" ADD COLUMN "company_id" uuid;--> statement-breakpoint
ALTER TABLE "commodity_production_locations" ADD COLUMN "company_name" text;--> statement-breakpoint
ALTER TABLE "commodity_production_locations" ADD COLUMN "latitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "commodity_production_locations" ADD COLUMN "longitude" numeric(10, 7);--> statement-breakpoint
ALTER TABLE "commodity_production_locations" ADD COLUMN "location_accuracy" varchar(30);--> statement-breakpoint
ALTER TABLE "commodity_production_locations" ADD COLUMN "geometry_source_url" text;--> statement-breakpoint
ALTER TABLE "commodity_production_locations" ADD COLUMN "operation_status" varchar(30);--> statement-breakpoint
ALTER TABLE "commodity_production_locations" ADD COLUMN "is_primary" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "commodity_production_locations" ADD COLUMN "primary_reason" text;--> statement-breakpoint
ALTER TABLE "commodity_production_series" ADD CONSTRAINT "commodity_production_series_commodity_id_commodities_id_fk" FOREIGN KEY ("commodity_id") REFERENCES "public"."commodities"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_production_series" ADD CONSTRAINT "commodity_production_series_unit_code_measurement_units_code_fk" FOREIGN KEY ("unit_code") REFERENCES "public"."measurement_units"("code") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_production_series" ADD CONSTRAINT "commodity_production_series_primary_source_id_sources_id_fk" FOREIGN KEY ("primary_source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_region_coverage" ADD CONSTRAINT "commodity_region_coverage_commodity_id_commodities_id_fk" FOREIGN KEY ("commodity_id") REFERENCES "public"."commodities"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_region_coverage" ADD CONSTRAINT "commodity_region_coverage_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_region_coverage" ADD CONSTRAINT "commodity_region_coverage_unit_code_measurement_units_code_fk" FOREIGN KEY ("unit_code") REFERENCES "public"."measurement_units"("code") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_region_coverage" ADD CONSTRAINT "commodity_region_coverage_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_region_coverage" ADD CONSTRAINT "region_coverage_company_fk" FOREIGN KEY ("related_company_id") REFERENCES "public"."industry_companies"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "price_standard_identity_unique_idx" ON "commodity_price_standards" USING btree ("id","commodity_id","default_unit_code","default_currency_code");--> statement-breakpoint
CREATE UNIQUE INDEX "price_standard_commodity_unique_idx" ON "commodity_price_standards" USING btree ("id","commodity_id");--> statement-breakpoint
ALTER TABLE "commodity_price_series" ADD CONSTRAINT "commodity_price_series_commodity_id_commodities_id_fk" FOREIGN KEY ("commodity_id") REFERENCES "public"."commodities"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_price_series" ADD CONSTRAINT "commodity_price_series_primary_source_id_sources_id_fk" FOREIGN KEY ("primary_source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_price_series" ADD CONSTRAINT "price_series_standard_commodity_fk" FOREIGN KEY ("price_standard_id","commodity_id") REFERENCES "public"."commodity_price_standards"("id","commodity_id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "production_series_code_unique_idx" ON "commodity_production_series" USING btree ("series_code");--> statement-breakpoint
CREATE UNIQUE INDEX "production_series_identity_unique_idx" ON "commodity_production_series" USING btree ("id","commodity_id","unit_code");--> statement-breakpoint
CREATE UNIQUE INDEX "production_series_public_default_unique_idx" ON "commodity_production_series" USING btree ("commodity_id","production_scope") WHERE "commodity_production_series"."is_public_default" = true;--> statement-breakpoint
CREATE INDEX "production_series_commodity_idx" ON "commodity_production_series" USING btree ("commodity_id");--> statement-breakpoint
CREATE INDEX "production_series_unit_idx" ON "commodity_production_series" USING btree ("unit_code");--> statement-breakpoint
CREATE INDEX "production_series_source_idx" ON "commodity_production_series" USING btree ("primary_source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "region_coverage_commodity_region_unique_idx" ON "commodity_region_coverage" USING btree ("commodity_id","region_id");--> statement-breakpoint
CREATE INDEX "region_coverage_region_idx" ON "commodity_region_coverage" USING btree ("region_id");--> statement-breakpoint
CREATE INDEX "region_coverage_source_idx" ON "commodity_region_coverage" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "region_coverage_unit_idx" ON "commodity_region_coverage" USING btree ("unit_code");--> statement-breakpoint
CREATE INDEX "region_coverage_company_idx" ON "commodity_region_coverage" USING btree ("related_company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "price_series_code_unique_idx" ON "commodity_price_series" USING btree ("series_code");--> statement-breakpoint
CREATE UNIQUE INDEX "price_series_identity_unique_idx" ON "commodity_price_series" USING btree ("id","commodity_id","price_standard_id","period");--> statement-breakpoint
CREATE UNIQUE INDEX "price_series_public_default_unique_idx" ON "commodity_price_series" USING btree ("commodity_id","price_standard_id","period") WHERE "commodity_price_series"."is_public_default" = true;--> statement-breakpoint
CREATE INDEX "price_series_commodity_idx" ON "commodity_price_series" USING btree ("commodity_id");--> statement-breakpoint
CREATE INDEX "price_series_standard_idx" ON "commodity_price_series" USING btree ("price_standard_id");--> statement-breakpoint
CREATE INDEX "price_series_source_idx" ON "commodity_price_series" USING btree ("primary_source_id");--> statement-breakpoint
ALTER TABLE "commodity_production" ADD CONSTRAINT "production_series_identity_fk" FOREIGN KEY ("series_id","commodity_id","unit_code") REFERENCES "public"."commodity_production_series"("id","commodity_id","unit_code") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_domestic_prices" ADD CONSTRAINT "domestic_price_series_identity_fk" FOREIGN KEY ("price_series_id","commodity_id","price_standard_id","period") REFERENCES "public"."commodity_price_series"("id","commodity_id","price_standard_id","period") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_domestic_prices" ADD CONSTRAINT "domestic_price_standard_identity_fk" FOREIGN KEY ("price_standard_id","commodity_id","unit_code","currency_code") REFERENCES "public"."commodity_price_standards"("id","commodity_id","default_unit_code","default_currency_code") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "commodity_production_locations" ADD CONSTRAINT "production_locations_company_fk" FOREIGN KEY ("company_id") REFERENCES "public"."industry_companies"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "commodity_domestic_prices_commodity_id_idx" ON "commodity_domestic_prices" USING btree ("commodity_id");--> statement-breakpoint
CREATE INDEX "domestic_prices_series_idx" ON "commodity_domestic_prices" USING btree ("price_series_id");--> statement-breakpoint
CREATE UNIQUE INDEX "production_locations_site_unique_idx" ON "commodity_production_locations" USING btree ("commodity_id","region_id","site_slug") WHERE "commodity_production_locations"."site_slug" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "production_locations_company_idx" ON "commodity_production_locations" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "commodity_production_unique_record_idx" ON "commodity_production" USING btree ("series_id","year","record_type");--> statement-breakpoint
CREATE UNIQUE INDEX "commodity_domestic_prices_unique_record_idx" ON "commodity_domestic_prices" USING btree ("price_series_id","effective_date","record_type");--> statement-breakpoint
CREATE UNIQUE INDEX "commodity_production_locations_annual_unique_idx" ON "commodity_production_locations" USING btree ("commodity_id","region_id","year","record_type") WHERE "commodity_production_locations"."year" IS NOT NULL AND "commodity_production_locations"."site_slug" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "commodity_production_locations_undated_unique_idx" ON "commodity_production_locations" USING btree ("commodity_id","region_id","record_type") WHERE "commodity_production_locations"."year" IS NULL AND "commodity_production_locations"."site_slug" IS NULL;--> statement-breakpoint
ALTER TABLE "commodity_production_locations" ADD CONSTRAINT "production_locations_site_check" CHECK ("commodity_production_locations"."site_slug" IS NULL OR ("commodity_production_locations"."site_slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND NULLIF(btrim("commodity_production_locations"."site_name"), '') IS NOT NULL AND "commodity_production_locations"."site_type" IS NOT NULL AND "commodity_production_locations"."site_type" IN ('mine','processing_plant','smelter','refinery','project','deposit') AND "commodity_production_locations"."location_accuracy" IS NOT NULL AND "commodity_production_locations"."operation_status" IS NOT NULL AND "commodity_production_locations"."year" IS NULL AND "commodity_production_locations"."production_value" IS NULL AND "commodity_production_locations"."unit_code" IS NULL AND "commodity_production_locations"."producer_rank" IS NULL AND "commodity_production_locations"."share_percentage" IS NULL));--> statement-breakpoint
ALTER TABLE "commodity_production_locations" ADD CONSTRAINT "production_locations_coordinates_check" CHECK (("commodity_production_locations"."latitude" IS NULL AND "commodity_production_locations"."longitude" IS NULL) OR ("commodity_production_locations"."latitude" IS NOT NULL AND "commodity_production_locations"."longitude" IS NOT NULL AND "commodity_production_locations"."latitude" BETWEEN -90 AND 90 AND "commodity_production_locations"."longitude" BETWEEN -180 AND 180 AND "commodity_production_locations"."location_accuracy" IS NOT NULL AND "commodity_production_locations"."location_accuracy" <> 'unknown' AND "commodity_production_locations"."geometry_source_url" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "commodity_production_locations" ADD CONSTRAINT "production_locations_accuracy_check" CHECK ("commodity_production_locations"."location_accuracy" IS NULL OR "commodity_production_locations"."location_accuracy" IN ('exact','approximate','regency_centroid','unknown'));--> statement-breakpoint
ALTER TABLE "commodity_production_locations" ADD CONSTRAINT "production_locations_operation_check" CHECK (("commodity_production_locations"."operation_status" IS NULL OR "commodity_production_locations"."operation_status" IN ('operating','development','historical','inactive','unknown')) AND ("commodity_production_locations"."site_type" NOT IN ('project','deposit') OR "commodity_production_locations"."operation_status" <> 'operating'));--> statement-breakpoint
ALTER TABLE "commodity_production_locations" ADD CONSTRAINT "production_locations_primary_check" CHECK (NOT "commodity_production_locations"."is_primary" OR ("commodity_production_locations"."site_slug" IS NOT NULL AND NULLIF(btrim("commodity_production_locations"."primary_reason"), '') IS NOT NULL AND "commodity_production_locations"."verification_status" = 'verified'));--> statement-breakpoint
ALTER TABLE "commodity_production_locations" ADD CONSTRAINT "production_locations_geometry_url_check" CHECK ("commodity_production_locations"."geometry_source_url" IS NULL OR "commodity_production_locations"."geometry_source_url" ~ '^https://');--> statement-breakpoint
CREATE POLICY "production_canonical_read" ON "commodity_production" AS RESTRICTIVE FOR SELECT TO "anon", "authenticated" USING (EXISTS (
        SELECT 1 FROM commodity_production_series s
        WHERE s.id = "commodity_production"."series_id"
          AND s.is_canonical = true
          AND s.is_public_default = true
          AND s.publication_status = 'published'
          AND s.verification_status = 'verified'
      ));--> statement-breakpoint
CREATE POLICY "domestic_prices_canonical_read" ON "commodity_domestic_prices" AS RESTRICTIVE FOR SELECT TO "anon", "authenticated" USING (EXISTS (
        SELECT 1 FROM commodity_price_series ps
        WHERE ps.id = "commodity_domestic_prices"."price_series_id"
          AND ps.is_canonical = true
          AND ps.is_public_default = true
          AND ps.publication_status = 'published'
          AND ps.verification_status = 'verified'
      ));--> statement-breakpoint
CREATE POLICY "production_series_public_read" ON "commodity_production_series" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("commodity_production_series"."is_canonical" AND "commodity_production_series"."is_public_default" AND "commodity_production_series"."publication_status" = 'published' AND "commodity_production_series"."verification_status" = 'verified' AND EXISTS (SELECT 1 FROM commodities c WHERE c.id = "commodity_production_series"."commodity_id" AND c.is_active) AND EXISTS (SELECT 1 FROM sources s WHERE s.id = "commodity_production_series"."primary_source_id" AND s.is_active AND s.verification_status = 'verified'));--> statement-breakpoint
CREATE POLICY "region_coverage_public_read" ON "commodity_region_coverage" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("commodity_region_coverage"."verification_status" = 'verified' AND "commodity_region_coverage"."publication_status" = 'published' AND EXISTS (SELECT 1 FROM commodities c WHERE c.id = "commodity_region_coverage"."commodity_id" AND c.is_active) AND EXISTS (SELECT 1 FROM regions r WHERE r.id = "commodity_region_coverage"."region_id" AND r.is_active) AND EXISTS (SELECT 1 FROM sources s WHERE s.id = "commodity_region_coverage"."source_id" AND s.is_active AND s.verification_status = 'verified'));--> statement-breakpoint
CREATE POLICY "price_series_public_read" ON "commodity_price_series" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("commodity_price_series"."is_canonical" = true
        AND "commodity_price_series"."is_public_default" = true
        AND "commodity_price_series"."publication_status" = 'published'
        AND "commodity_price_series"."verification_status" = 'verified'
        AND EXISTS (SELECT 1 FROM commodities c WHERE c.id = "commodity_price_series"."commodity_id" AND c.is_active)
        AND EXISTS (SELECT 1 FROM commodity_price_standards ps WHERE ps.id = "commodity_price_series"."price_standard_id" AND ps.is_active)
        AND EXISTS (SELECT 1 FROM sources s WHERE s.id = "commodity_price_series"."primary_source_id" AND s.is_active AND s.verification_status = 'verified'));--> statement-breakpoint
REVOKE ALL ON public.commodity_production_series, public.commodity_price_series, public.commodity_region_coverage FROM anon, authenticated;--> statement-breakpoint
GRANT SELECT ON public.commodity_production_series, public.commodity_price_series, public.commodity_region_coverage TO anon, authenticated;--> statement-breakpoint
DO $$
BEGIN
  IF (SELECT count(*) FROM intelligence_production_before) <> (SELECT count(*) FROM public.commodity_production)
    OR EXISTS (
      SELECT 1 FROM intelligence_production_before b
      LEFT JOIN public.commodity_production p USING (id)
      WHERE p.id IS NULL
        OR p.series_id IS NULL
        OR (to_jsonb(p) - 'series_id') IS DISTINCT FROM b.original
    ) THEN
    RAISE EXCEPTION 'Legacy production preservation check failed; migration must roll back';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.commodity_production_series
    WHERE is_canonical = false
      AND (is_public_default = true OR product_form <> 'unclassified')
  ) THEN
    RAISE EXCEPTION 'Legacy production series classification mismatch';
  END IF;

  IF (SELECT count(*) FROM public.commodity_production_series WHERE is_canonical = false)
    <> (SELECT count(*) FROM (
      SELECT DISTINCT
        (original ->> 'commodity_id')::uuid AS commodity_id,
        original ->> 'unit_code' AS unit_code
      FROM intelligence_production_before
    ) legacy_production_groups)
  THEN
    RAISE EXCEPTION 'Legacy production series backfill count mismatch';
  END IF;

  IF (SELECT count(*) FROM intelligence_prices_before) <> (SELECT count(*) FROM public.commodity_domestic_prices)
    OR EXISTS (
      SELECT 1 FROM intelligence_prices_before b
      LEFT JOIN public.commodity_domestic_prices p USING (id)
      WHERE p.id IS NULL
        OR p.price_series_id IS NULL
        OR (
          CASE WHEN b.original ? 'commodity_id'
            THEN to_jsonb(p) - 'price_series_id'
            ELSE to_jsonb(p) - 'price_series_id' - 'commodity_id'
          END
        ) IS DISTINCT FROM b.original
    ) THEN
    RAISE EXCEPTION 'Legacy price preservation check failed; migration must roll back';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.commodity_price_series
    WHERE is_canonical = false
      AND (is_public_default = true OR aggregation_method <> 'unclassified')
  ) THEN
    RAISE EXCEPTION 'Legacy price series classification mismatch';
  END IF;

  IF (SELECT count(*) FROM public.commodity_price_series WHERE is_canonical = false)
    <> (SELECT count(*) FROM (
      SELECT DISTINCT
        coalesce((b.original ->> 'commodity_id')::uuid, ps.commodity_id) AS commodity_id,
        (original ->> 'price_standard_id')::uuid AS price_standard_id,
        original ->> 'period' AS period
      FROM intelligence_prices_before b
      JOIN public.commodity_price_standards ps
        ON ps.id = (b.original ->> 'price_standard_id')::uuid
    ) legacy_price_groups)
  THEN
    RAISE EXCEPTION 'Legacy price series backfill count mismatch';
  END IF;
END $$;
