DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type AS type
    INNER JOIN pg_namespace AS namespace
      ON namespace.oid = type.typnamespace
    WHERE namespace.nspname = 'public'
      AND type.typname = 'gdp_price_basis'
  ) THEN
    CREATE TYPE "public"."gdp_price_basis"
      AS ENUM ('current_prices', 'constant_prices');
  END IF;
END
$$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type AS type
    INNER JOIN pg_namespace AS namespace
      ON namespace.oid = type.typnamespace
    WHERE namespace.nspname = 'public'
      AND type.typname = 'statistical_data_status'
  ) THEN
    CREATE TYPE "public"."statistical_data_status"
      AS ENUM ('final', 'preliminary', 'very_preliminary');
  END IF;
END
$$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "public"."economic_gdp_annual" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "region_id" uuid NOT NULL,
  "year" smallint NOT NULL,
  "price_basis" "public"."gdp_price_basis"
    DEFAULT 'current_prices' NOT NULL,
  "base_year" smallint,
  "national_gdp_value" numeric(24, 2) NOT NULL,
  "mining_quarrying_gdp_value" numeric(24, 2) NOT NULL,
  "currency_code" varchar(3) DEFAULT 'IDR' NOT NULL,
  "value_scale" varchar(20) DEFAULT 'billion' NOT NULL,
  "data_status" "public"."statistical_data_status"
    DEFAULT 'final' NOT NULL,
  "record_type" "public"."data_record_type"
    DEFAULT 'actual' NOT NULL,
  "source_id" uuid NOT NULL,
  "source_published_at" date,
  "verification_status" "public"."verification_status"
    DEFAULT 'pending' NOT NULL,
  "publication_status" "public"."publication_status"
    DEFAULT 'draft' NOT NULL,
  "notes" text,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "public"."economic_gdp_sources" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "economic_gdp_id" uuid NOT NULL,
  "source_id" uuid NOT NULL,
  "citation_label" text,
  "source_url" text,
  "page_reference" text,
  "notes" text,
  "is_primary" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

ALTER TABLE "public"."economic_gdp_annual"
ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

ALTER TABLE "public"."economic_gdp_sources"
ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.economic_gdp_annual'::regclass
      AND conname = 'economic_gdp_annual_unique'
  ) THEN
    ALTER TABLE "public"."economic_gdp_annual"
      ADD CONSTRAINT "economic_gdp_annual_unique"
      UNIQUE (
        "region_id",
        "year",
        "price_basis",
        "base_year",
        "record_type"
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.economic_gdp_annual'::regclass
      AND conname = 'economic_gdp_annual_region_id_regions_id_fk'
  ) THEN
    ALTER TABLE "public"."economic_gdp_annual"
      ADD CONSTRAINT "economic_gdp_annual_region_id_regions_id_fk"
      FOREIGN KEY ("region_id")
      REFERENCES "public"."regions" ("id")
      ON DELETE RESTRICT
      ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.economic_gdp_annual'::regclass
      AND conname = 'economic_gdp_annual_source_id_sources_id_fk'
  ) THEN
    ALTER TABLE "public"."economic_gdp_annual"
      ADD CONSTRAINT "economic_gdp_annual_source_id_sources_id_fk"
      FOREIGN KEY ("source_id")
      REFERENCES "public"."sources" ("id")
      ON DELETE RESTRICT
      ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.economic_gdp_annual'::regclass
      AND conname = 'economic_gdp_annual_year_check'
  ) THEN
    ALTER TABLE "public"."economic_gdp_annual"
      ADD CONSTRAINT "economic_gdp_annual_year_check"
      CHECK ("year" BETWEEN 1900 AND 2100);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.economic_gdp_annual'::regclass
      AND conname = 'economic_gdp_annual_base_year_check'
  ) THEN
    ALTER TABLE "public"."economic_gdp_annual"
      ADD CONSTRAINT "economic_gdp_annual_base_year_check"
      CHECK (
        (
          "price_basis" = 'current_prices'::public.gdp_price_basis
          AND "base_year" IS NULL
        )
        OR (
          "price_basis" = 'constant_prices'::public.gdp_price_basis
          AND "base_year" BETWEEN 1900 AND 2100
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.economic_gdp_annual'::regclass
      AND conname = 'economic_gdp_annual_currency_check'
  ) THEN
    ALTER TABLE "public"."economic_gdp_annual"
      ADD CONSTRAINT "economic_gdp_annual_currency_check"
      CHECK ("currency_code" ~ '^[A-Z]{3}$');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.economic_gdp_annual'::regclass
      AND conname = 'economic_gdp_annual_value_scale_check'
  ) THEN
    ALTER TABLE "public"."economic_gdp_annual"
      ADD CONSTRAINT "economic_gdp_annual_value_scale_check"
      CHECK (
        "value_scale" IN (
          'unit',
          'thousand',
          'million',
          'billion',
          'trillion'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.economic_gdp_annual'::regclass
      AND conname = 'economic_gdp_annual_national_value_check'
  ) THEN
    ALTER TABLE "public"."economic_gdp_annual"
      ADD CONSTRAINT "economic_gdp_annual_national_value_check"
      CHECK ("national_gdp_value" >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.economic_gdp_annual'::regclass
      AND conname = 'economic_gdp_annual_mining_value_check'
  ) THEN
    ALTER TABLE "public"."economic_gdp_annual"
      ADD CONSTRAINT "economic_gdp_annual_mining_value_check"
      CHECK ("mining_quarrying_gdp_value" >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.economic_gdp_annual'::regclass
      AND conname =
        'economic_gdp_annual_sector_not_above_national_check'
  ) THEN
    ALTER TABLE "public"."economic_gdp_annual"
      ADD CONSTRAINT
        "economic_gdp_annual_sector_not_above_national_check"
      CHECK (
        "mining_quarrying_gdp_value" <= "national_gdp_value"
      );
  END IF;
END
$$;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.economic_gdp_sources'::regclass
      AND conname = 'economic_gdp_sources_unique'
  ) THEN
    ALTER TABLE "public"."economic_gdp_sources"
      ADD CONSTRAINT "economic_gdp_sources_unique"
      UNIQUE ("economic_gdp_id", "source_id", "source_url");
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.economic_gdp_sources'::regclass
      AND conname = 'economic_gdp_sources_economic_gdp_id_fk'
  ) THEN
    ALTER TABLE "public"."economic_gdp_sources"
      ADD CONSTRAINT "economic_gdp_sources_economic_gdp_id_fk"
      FOREIGN KEY ("economic_gdp_id")
      REFERENCES "public"."economic_gdp_annual" ("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.economic_gdp_sources'::regclass
      AND conname = 'economic_gdp_sources_source_id_fk'
  ) THEN
    ALTER TABLE "public"."economic_gdp_sources"
      ADD CONSTRAINT "economic_gdp_sources_source_id_fk"
      FOREIGN KEY ("source_id")
      REFERENCES "public"."sources" ("id")
      ON DELETE RESTRICT
      ON UPDATE CASCADE;
  END IF;
END
$$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "economic_gdp_annual_region_idx"
  ON "public"."economic_gdp_annual" ("region_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "economic_gdp_annual_year_idx"
  ON "public"."economic_gdp_annual" ("year");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "economic_gdp_annual_price_basis_idx"
  ON "public"."economic_gdp_annual" ("price_basis");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "economic_gdp_annual_source_idx"
  ON "public"."economic_gdp_annual" ("source_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "economic_gdp_annual_verification_idx"
  ON "public"."economic_gdp_annual" ("verification_status");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "economic_gdp_annual_publication_idx"
  ON "public"."economic_gdp_annual" ("publication_status");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "economic_gdp_sources_gdp_idx"
  ON "public"."economic_gdp_sources" ("economic_gdp_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "economic_gdp_sources_source_idx"
  ON "public"."economic_gdp_sources" ("source_id");
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS
  "commodity_production_sources_one_primary_idx"
  ON "public"."commodity_production_sources" ("production_id")
  WHERE "is_primary" = true;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid =
      'public.commodity_production_sources'::regclass
      AND conname =
        'commodity_production_sources_citation_label_check'
  ) THEN
    ALTER TABLE "public"."commodity_production_sources"
      ADD CONSTRAINT
        "commodity_production_sources_citation_label_check"
      CHECK (
        NULLIF(BTRIM("citation_label"), '') IS NOT NULL
      );
  END IF;
END
$$;
--> statement-breakpoint

CREATE OR REPLACE VIEW
  "public"."economic_gdp_annual_metrics"
WITH (security_invoker = true)
AS
WITH annual_values AS (
  SELECT
    gdp.*,
    LAG(gdp.mining_quarrying_gdp_value) OVER (
      PARTITION BY
        gdp.region_id,
        gdp.price_basis,
        gdp.base_year,
        gdp.record_type
      ORDER BY gdp.year
    ) AS previous_mining_quarrying_gdp_value
  FROM "public"."economic_gdp_annual" AS gdp
)
SELECT
  annual_values.id,
  annual_values.region_id,
  region.code AS region_code,
  region.name AS region_name,
  annual_values.year,
  annual_values.price_basis,
  annual_values.base_year,
  annual_values.national_gdp_value,
  annual_values.mining_quarrying_gdp_value,
  annual_values.currency_code,
  annual_values.value_scale,
  ROUND(
    annual_values.mining_quarrying_gdp_value
    / NULLIF(annual_values.national_gdp_value, 0)
    * 100,
    4
  ) AS contribution_percentage,
  CASE
    WHEN annual_values.previous_mining_quarrying_gdp_value IS NULL
      THEN NULL::numeric
    ELSE ROUND(
      (
        annual_values.mining_quarrying_gdp_value
        / NULLIF(
          annual_values.previous_mining_quarrying_gdp_value,
          0
        )
        - 1
      ) * 100,
      4
    )
  END AS nominal_yoy_change_percentage,
  annual_values.data_status,
  annual_values.record_type,
  annual_values.source_id,
  annual_values.source_published_at,
  annual_values.verification_status,
  annual_values.publication_status,
  annual_values.notes,
  annual_values.metadata,
  annual_values.created_at,
  annual_values.updated_at
FROM annual_values
INNER JOIN "public"."regions" AS region
  ON region.id = annual_values.region_id;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'economic_gdp_annual'
      AND policyname = 'public_read_published_verified_gdp'
  ) THEN
    CREATE POLICY "public_read_published_verified_gdp"
      ON "public"."economic_gdp_annual"
      AS PERMISSIVE
      FOR SELECT
      TO "anon", "authenticated"
      USING (
        "publication_status" =
          'published'::public.publication_status
        AND "verification_status" =
          'verified'::public.verification_status
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
    WHERE schemaname = 'public'
      AND tablename = 'economic_gdp_sources'
      AND policyname = 'public_read_sources_of_published_gdp'
  ) THEN
    CREATE POLICY "public_read_sources_of_published_gdp"
      ON "public"."economic_gdp_sources"
      AS PERMISSIVE
      FOR SELECT
      TO "anon", "authenticated"
      USING (
        EXISTS (
          SELECT 1
          FROM "public"."economic_gdp_annual" AS gdp
          WHERE gdp.id = economic_gdp_sources.economic_gdp_id
            AND gdp.publication_status =
              'published'::public.publication_status
            AND gdp.verification_status =
              'verified'::public.verification_status
        )
      );
  END IF;
END
$$;