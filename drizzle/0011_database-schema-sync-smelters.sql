DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type AS enum_type
    INNER JOIN pg_namespace AS enum_namespace
      ON enum_namespace.oid = enum_type.typnamespace
    WHERE
      enum_namespace.nspname = 'public'
      AND enum_type.typname = 'smelter_facility_status'
  ) THEN
    CREATE TYPE "public"."smelter_facility_status" AS ENUM('planned', 'construction', 'commissioning', 'operating', 'temporarily_suspended', 'inactive', 'unknown');
  END IF;
END
$$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type AS enum_type
    INNER JOIN pg_namespace AS enum_namespace
      ON enum_namespace.oid = enum_type.typnamespace
    WHERE
      enum_namespace.nspname = 'public'
      AND enum_type.typname = 'smelter_facility_type'
  ) THEN
    CREATE TYPE "public"."smelter_facility_type" AS ENUM('smelter', 'refinery', 'integrated_processing', 'other');
  END IF;
END
$$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "smelter_facilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_code" varchar NOT NULL,
	"name" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"operator_id" uuid NOT NULL,
	"facility_type" "smelter_facility_type" NOT NULL,
	"current_status" "smelter_facility_status" DEFAULT 'unknown' NOT NULL,
	"province_region_id" uuid NOT NULL,
	"city_regency_name" varchar NOT NULL,
	"address" text,
	"latitude" numeric,
	"longitude" numeric,
	"reported_operation_year" smallint,
	"construction_year" smallint,
	"commissioning_year" smallint,
	"commercial_operation_year" smallint,
	"source_id" uuid,
	"verification_status" "verification_status" DEFAULT 'pending' NOT NULL,
	"publication_status" "publication_status" DEFAULT 'draft' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "smelter_facilities_code_unique" UNIQUE("facility_code"),
	CONSTRAINT "smelter_facilities_slug_unique" UNIQUE("slug"),
	CONSTRAINT "smelter_facilities_reported_year_check" CHECK (
        "smelter_facilities"."reported_operation_year" IS NULL
        OR "smelter_facilities"."reported_operation_year" BETWEEN 1900 AND 2100
      ),
	CONSTRAINT "smelter_facilities_construction_year_check" CHECK (
        "smelter_facilities"."construction_year" IS NULL
        OR "smelter_facilities"."construction_year" BETWEEN 1900 AND 2100
      ),
	CONSTRAINT "smelter_facilities_commissioning_year_check" CHECK (
        "smelter_facilities"."commissioning_year" IS NULL
        OR "smelter_facilities"."commissioning_year" BETWEEN 1900 AND 2100
      ),
	CONSTRAINT "smelter_facilities_commercial_year_check" CHECK (
        "smelter_facilities"."commercial_operation_year" IS NULL
        OR "smelter_facilities"."commercial_operation_year" BETWEEN 1900 AND 2100
      ),
	CONSTRAINT "smelter_facilities_construction_commissioning_check" CHECK (
        "smelter_facilities"."construction_year" IS NULL
        OR "smelter_facilities"."commissioning_year" IS NULL
        OR "smelter_facilities"."construction_year" <= "smelter_facilities"."commissioning_year"
      ),
	CONSTRAINT "smelter_facilities_commissioning_commercial_check" CHECK (
        "smelter_facilities"."commissioning_year" IS NULL
        OR "smelter_facilities"."commercial_operation_year" IS NULL
        OR "smelter_facilities"."commissioning_year" <= "smelter_facilities"."commercial_operation_year"
      ),
	CONSTRAINT "smelter_facilities_latitude_check" CHECK (
        "smelter_facilities"."latitude" IS NULL
        OR "smelter_facilities"."latitude" BETWEEN -90 AND 90
      ),
	CONSTRAINT "smelter_facilities_longitude_check" CHECK (
        "smelter_facilities"."longitude" IS NULL
        OR "smelter_facilities"."longitude" BETWEEN -180 AND 180
      )
);
--> statement-breakpoint
ALTER TABLE "smelter_facilities" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "smelter_facility_outputs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid NOT NULL,
	"commodity_id" uuid NOT NULL,
	"input_material" varchar NOT NULL,
	"output_product" varchar NOT NULL,
	"process_type" varchar,
	"input_capacity_value" numeric,
	"input_capacity_unit_code" varchar,
	"output_capacity_value" numeric,
	"output_capacity_unit_code" varchar,
	"capacity_reference_year" smallint,
	"is_primary" boolean DEFAULT true NOT NULL,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "smelter_facility_outputs_unique" UNIQUE("facility_id","commodity_id","output_product"),
	CONSTRAINT "smelter_facility_outputs_capacity_year_check" CHECK (
        "smelter_facility_outputs"."capacity_reference_year" IS NULL
        OR "smelter_facility_outputs"."capacity_reference_year" BETWEEN 1900 AND 2100
      ),
	CONSTRAINT "smelter_facility_outputs_input_capacity_check" CHECK (
        "smelter_facility_outputs"."input_capacity_value" IS NULL
        OR "smelter_facility_outputs"."input_capacity_value" >= 0
      ),
	CONSTRAINT "smelter_facility_outputs_output_capacity_check" CHECK (
        "smelter_facility_outputs"."output_capacity_value" IS NULL
        OR "smelter_facility_outputs"."output_capacity_value" >= 0
      ),
	CONSTRAINT "smelter_facility_outputs_input_unit_check" CHECK (
        "smelter_facility_outputs"."input_capacity_value" IS NULL
        OR "smelter_facility_outputs"."input_capacity_unit_code" IS NOT NULL
      ),
	CONSTRAINT "smelter_facility_outputs_output_unit_check" CHECK (
        "smelter_facility_outputs"."output_capacity_value" IS NULL
        OR "smelter_facility_outputs"."output_capacity_unit_code" IS NOT NULL
      )
);
--> statement-breakpoint
ALTER TABLE "smelter_facility_outputs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "smelter_facility_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid NOT NULL,
	"source_id" uuid,
	"publisher_name" varchar NOT NULL,
	"document_title" text NOT NULL,
	"source_url" text NOT NULL,
	"published_date" date,
	"accessed_at" date DEFAULT now() NOT NULL,
	"supports_fields" text[] DEFAULT '{}'::text[] NOT NULL,
	"is_official" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "smelter_facility_sources_unique" UNIQUE("facility_id","source_url"),
	CONSTRAINT "smelter_facility_sources_url_check" CHECK ("smelter_facility_sources"."source_url" ~ '^https://')
);
--> statement-breakpoint
ALTER TABLE "smelter_facility_sources" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "smelter_operators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legal_name" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"website_url" text,
	"country_code" varchar DEFAULT 'ID' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "smelter_operators_slug_unique" UNIQUE("slug"),
	CONSTRAINT "smelter_operators_country_code_check" CHECK ("smelter_operators"."country_code" ~ '^[A-Z]{2}$')
);
--> statement-breakpoint
ALTER TABLE "smelter_operators" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname = 'smelter_facilities_operator_id_fk'
      AND conrelid = 'public.smelter_facilities'::regclass
  ) THEN
    ALTER TABLE "smelter_facilities" ADD CONSTRAINT "smelter_facilities_operator_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."smelter_operators"("id") ON DELETE restrict ON UPDATE cascade;
  END IF;
END
$$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname = 'smelter_facilities_province_region_id_fk'
      AND conrelid = 'public.smelter_facilities'::regclass
  ) THEN
    ALTER TABLE "smelter_facilities" ADD CONSTRAINT "smelter_facilities_province_region_id_fk" FOREIGN KEY ("province_region_id") REFERENCES "public"."regions"("id") ON DELETE restrict ON UPDATE cascade;
  END IF;
END
$$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname = 'smelter_facilities_source_id_fk'
      AND conrelid = 'public.smelter_facilities'::regclass
  ) THEN
    ALTER TABLE "smelter_facilities" ADD CONSTRAINT "smelter_facilities_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE cascade;
  END IF;
END
$$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname = 'smelter_facility_outputs_facility_id_fk'
      AND conrelid = 'public.smelter_facility_outputs'::regclass
  ) THEN
    ALTER TABLE "smelter_facility_outputs" ADD CONSTRAINT "smelter_facility_outputs_facility_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."smelter_facilities"("id") ON DELETE cascade ON UPDATE cascade;
  END IF;
END
$$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname = 'smelter_facility_outputs_commodity_id_fk'
      AND conrelid = 'public.smelter_facility_outputs'::regclass
  ) THEN
    ALTER TABLE "smelter_facility_outputs" ADD CONSTRAINT "smelter_facility_outputs_commodity_id_fk" FOREIGN KEY ("commodity_id") REFERENCES "public"."commodities"("id") ON DELETE restrict ON UPDATE cascade;
  END IF;
END
$$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname = 'smelter_facility_outputs_input_unit_fk'
      AND conrelid = 'public.smelter_facility_outputs'::regclass
  ) THEN
    ALTER TABLE "smelter_facility_outputs" ADD CONSTRAINT "smelter_facility_outputs_input_unit_fk" FOREIGN KEY ("input_capacity_unit_code") REFERENCES "public"."measurement_units"("code") ON DELETE restrict ON UPDATE cascade;
  END IF;
END
$$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname = 'smelter_facility_outputs_output_unit_fk'
      AND conrelid = 'public.smelter_facility_outputs'::regclass
  ) THEN
    ALTER TABLE "smelter_facility_outputs" ADD CONSTRAINT "smelter_facility_outputs_output_unit_fk" FOREIGN KEY ("output_capacity_unit_code") REFERENCES "public"."measurement_units"("code") ON DELETE restrict ON UPDATE cascade;
  END IF;
END
$$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname = 'smelter_facility_sources_facility_id_fk'
      AND conrelid = 'public.smelter_facility_sources'::regclass
  ) THEN
    ALTER TABLE "smelter_facility_sources" ADD CONSTRAINT "smelter_facility_sources_facility_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."smelter_facilities"("id") ON DELETE cascade ON UPDATE cascade;
  END IF;
END
$$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname = 'smelter_facility_sources_source_id_fk'
      AND conrelid = 'public.smelter_facility_sources'::regclass
  ) THEN
    ALTER TABLE "smelter_facility_sources" ADD CONSTRAINT "smelter_facility_sources_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE cascade;
  END IF;
END
$$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "smelter_facilities_operator_idx" ON "smelter_facilities" USING btree ("operator_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "smelter_facilities_province_idx" ON "smelter_facilities" USING btree ("province_region_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "smelter_facilities_publication_idx" ON "smelter_facilities" USING btree ("publication_status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "smelter_facilities_status_idx" ON "smelter_facilities" USING btree ("current_status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "smelter_facilities_type_idx" ON "smelter_facilities" USING btree ("facility_type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "smelter_facilities_verification_idx" ON "smelter_facilities" USING btree ("verification_status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "smelter_facility_outputs_facility_idx" ON "smelter_facility_outputs" USING btree ("facility_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "smelter_facility_outputs_commodity_idx" ON "smelter_facility_outputs" USING btree ("commodity_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "smelter_facility_sources_facility_idx" ON "smelter_facility_sources" USING btree ("facility_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "smelter_operators_legal_name_idx" ON "smelter_operators" USING btree ("legal_name");
--> statement-breakpoint
CREATE OR REPLACE VIEW "public"."smelter_facility_catalog" WITH (security_invoker = true) AS (
    SELECT
      smelter_facility.id,
      smelter_facility.facility_code,
      smelter_facility.name AS facility_name,
      smelter_facility.slug,
      smelter_operator.legal_name AS operator_name,
      smelter_facility.facility_type,
      smelter_facility.current_status,
      province.name AS province_name,
      smelter_facility.city_regency_name,
      smelter_facility.reported_operation_year,
      smelter_facility.construction_year,
      smelter_facility.commissioning_year,
      smelter_facility.commercial_operation_year,
      commodity.id AS commodity_id,
      commodity.name AS commodity_name,
      commodity.slug AS commodity_slug,
      facility_output.input_material,
      facility_output.output_product,
      facility_output.process_type,
      facility_output.input_capacity_value,
      facility_output.input_capacity_unit_code,
      facility_output.output_capacity_value,
      facility_output.output_capacity_unit_code,
      facility_output.capacity_reference_year,
      smelter_facility.verification_status,
      smelter_facility.publication_status,
      smelter_facility.notes,
      smelter_facility.updated_at
    FROM "smelter_facilities" AS smelter_facility
    INNER JOIN "smelter_operators" AS smelter_operator
      ON smelter_operator.id = smelter_facility.operator_id
    INNER JOIN "regions" AS province
      ON province.id = smelter_facility.province_region_id
    INNER JOIN "smelter_facility_outputs" AS facility_output
      ON facility_output.facility_id = smelter_facility.id
    INNER JOIN "commodities" AS commodity
      ON commodity.id = facility_output.commodity_id
  );
--> statement-breakpoint
CREATE OR REPLACE VIEW "public"."smelter_summary_by_commodity" WITH (security_invoker = true) AS (
    SELECT
      commodity.id AS commodity_id,
      commodity.name AS commodity_name,
      commodity.slug AS commodity_slug,
      COUNT(DISTINCT smelter_facility.id) AS facility_count,
      COUNT(
        DISTINCT smelter_facility.province_region_id
      ) AS province_count,
      COUNT(DISTINCT smelter_facility.id) FILTER (
        WHERE smelter_facility.current_status = 'operating'
      ) AS operating_facility_count,
      SUM(facility_output.output_capacity_value) FILTER (
        WHERE facility_output.output_capacity_unit_code = 'metric_ton'
      ) AS known_annual_output_capacity_metric_ton
    FROM "smelter_facility_outputs" AS facility_output
    INNER JOIN "smelter_facilities" AS smelter_facility
      ON smelter_facility.id = facility_output.facility_id
    INNER JOIN "commodities" AS commodity
      ON commodity.id = facility_output.commodity_id
    GROUP BY
      commodity.id,
      commodity.name,
      commodity.slug
  );
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE
      schemaname = 'public'
      AND tablename = 'smelter_facilities'
      AND policyname = 'smelter_facilities_public_read'
  ) THEN
    CREATE POLICY "smelter_facilities_public_read" ON "smelter_facilities" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (
        "smelter_facilities"."is_active" = true
        AND "smelter_facilities"."publication_status" = 'published'
      );
  END IF;
END
$$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE
      schemaname = 'public'
      AND tablename = 'smelter_facility_outputs'
      AND policyname = 'smelter_facility_outputs_public_read'
  ) THEN
    CREATE POLICY "smelter_facility_outputs_public_read" ON "smelter_facility_outputs" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (
        EXISTS (
          SELECT 1
          FROM "smelter_facilities" AS smelter_facility
          WHERE
            smelter_facility.id = "smelter_facility_outputs"."facility_id"
            AND smelter_facility.is_active = true
            AND smelter_facility.publication_status = 'published'
        )
      );
  END IF;
END
$$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE
      schemaname = 'public'
      AND tablename = 'smelter_facility_sources'
      AND policyname = 'smelter_facility_sources_public_read'
  ) THEN
    CREATE POLICY "smelter_facility_sources_public_read" ON "smelter_facility_sources" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (
        EXISTS (
          SELECT 1
          FROM "smelter_facilities" AS smelter_facility
          WHERE
            smelter_facility.id = "smelter_facility_sources"."facility_id"
            AND smelter_facility.is_active = true
            AND smelter_facility.publication_status = 'published'
        )
      );
  END IF;
END
$$;
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE
      schemaname = 'public'
      AND tablename = 'smelter_operators'
      AND policyname = 'smelter_operators_public_read'
  ) THEN
    CREATE POLICY "smelter_operators_public_read" ON "smelter_operators" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING ("smelter_operators"."is_active" = true);
  END IF;
END
$$;
