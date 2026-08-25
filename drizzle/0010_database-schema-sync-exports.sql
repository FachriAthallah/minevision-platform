DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type AS type_definition
    INNER JOIN pg_namespace AS type_namespace
      ON type_namespace.oid = type_definition.typnamespace
    WHERE
      type_namespace.nspname = 'public'
      AND type_definition.typname = 'trade_data_availability'
  ) THEN
    CREATE TYPE "public"."trade_data_availability"
      AS ENUM (
        'reported',
        'not_reported',
        'reported_zero',
        'estimated'
      );
  END IF;
END
$$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "public"."minerba_exports_annual" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "commodity_id" uuid NOT NULL,
  "origin_region_id" uuid NOT NULL,
  "destination_region_id" uuid,
  "year" smallint NOT NULL,
  "source_commodity_label" varchar(160) NOT NULL,
  "hs_code" varchar(20),
  "coverage_type" varchar(40)
    DEFAULT 'destination_country' NOT NULL,
  "export_volume" numeric(24, 6),
  "volume_unit_code" varchar(50),
  "volume_scale" varchar(20),
  "fob_value" numeric(24, 6),
  "currency_code" varchar(3) DEFAULT 'USD' NOT NULL,
  "fob_value_scale" varchar(20),
  "data_availability" "public"."trade_data_availability"
    DEFAULT 'reported' NOT NULL,
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

CREATE TABLE IF NOT EXISTS "public"."minerba_export_sources" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "minerba_export_id" uuid NOT NULL,
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

ALTER TABLE "public"."minerba_exports_annual"
ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

ALTER TABLE "public"."minerba_export_sources"
ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname = 'minerba_exports_annual_commodity_id_fk'
      AND conrelid =
        'public.minerba_exports_annual'::regclass
  ) THEN
    ALTER TABLE "public"."minerba_exports_annual"
      ADD CONSTRAINT "minerba_exports_annual_commodity_id_fk"
      FOREIGN KEY ("commodity_id")
      REFERENCES "public"."commodities"("id")
      ON DELETE restrict
      ON UPDATE cascade;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname =
        'minerba_exports_annual_destination_region_id_fk'
      AND conrelid =
        'public.minerba_exports_annual'::regclass
  ) THEN
    ALTER TABLE "public"."minerba_exports_annual"
      ADD CONSTRAINT
        "minerba_exports_annual_destination_region_id_fk"
      FOREIGN KEY ("destination_region_id")
      REFERENCES "public"."regions"("id")
      ON DELETE restrict
      ON UPDATE cascade;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname = 'minerba_exports_annual_origin_region_id_fk'
      AND conrelid =
        'public.minerba_exports_annual'::regclass
  ) THEN
    ALTER TABLE "public"."minerba_exports_annual"
      ADD CONSTRAINT
        "minerba_exports_annual_origin_region_id_fk"
      FOREIGN KEY ("origin_region_id")
      REFERENCES "public"."regions"("id")
      ON DELETE restrict
      ON UPDATE cascade;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname = 'minerba_exports_annual_source_id_fk'
      AND conrelid =
        'public.minerba_exports_annual'::regclass
  ) THEN
    ALTER TABLE "public"."minerba_exports_annual"
      ADD CONSTRAINT "minerba_exports_annual_source_id_fk"
      FOREIGN KEY ("source_id")
      REFERENCES "public"."sources"("id")
      ON DELETE restrict
      ON UPDATE cascade;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname =
        'minerba_exports_annual_volume_unit_code_fk'
      AND conrelid =
        'public.minerba_exports_annual'::regclass
  ) THEN
    ALTER TABLE "public"."minerba_exports_annual"
      ADD CONSTRAINT
        "minerba_exports_annual_volume_unit_code_fk"
      FOREIGN KEY ("volume_unit_code")
      REFERENCES "public"."measurement_units"("code")
      ON DELETE restrict
      ON UPDATE cascade;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname = 'minerba_exports_annual_unique'
      AND conrelid =
        'public.minerba_exports_annual'::regclass
  ) THEN
    ALTER TABLE "public"."minerba_exports_annual"
      ADD CONSTRAINT "minerba_exports_annual_unique"
      UNIQUE (
        "commodity_id",
        "origin_region_id",
        "destination_region_id",
        "year",
        "hs_code",
        "record_type"
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname =
        'minerba_exports_annual_coverage_type_check'
      AND conrelid =
        'public.minerba_exports_annual'::regclass
  ) THEN
    ALTER TABLE "public"."minerba_exports_annual"
      ADD CONSTRAINT
        "minerba_exports_annual_coverage_type_check"
      CHECK (
        "coverage_type" IN (
          'destination_country',
          'national_total'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname = 'minerba_exports_annual_currency_check'
      AND conrelid =
        'public.minerba_exports_annual'::regclass
  ) THEN
    ALTER TABLE "public"."minerba_exports_annual"
      ADD CONSTRAINT "minerba_exports_annual_currency_check"
      CHECK ("currency_code" ~ '^[A-Z]{3}$');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname = 'minerba_exports_annual_fob_check'
      AND conrelid =
        'public.minerba_exports_annual'::regclass
  ) THEN
    ALTER TABLE "public"."minerba_exports_annual"
      ADD CONSTRAINT "minerba_exports_annual_fob_check"
      CHECK (
        "fob_value" IS NULL
        OR "fob_value" >= 0
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname = 'minerba_exports_annual_fob_scale_check'
      AND conrelid =
        'public.minerba_exports_annual'::regclass
  ) THEN
    ALTER TABLE "public"."minerba_exports_annual"
      ADD CONSTRAINT
        "minerba_exports_annual_fob_scale_check"
      CHECK (
        "fob_value_scale" IS NULL
        OR "fob_value_scale" IN (
          'unit',
          'thousand',
          'million',
          'billion'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname = 'minerba_exports_annual_hs_code_check'
      AND conrelid =
        'public.minerba_exports_annual'::regclass
  ) THEN
    ALTER TABLE "public"."minerba_exports_annual"
      ADD CONSTRAINT "minerba_exports_annual_hs_code_check"
      CHECK (
        "hs_code" IS NULL
        OR "hs_code" ~ '^[0-9]{2,10}$'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname =
        'minerba_exports_annual_not_reported_data_check'
      AND conrelid =
        'public.minerba_exports_annual'::regclass
  ) THEN
    ALTER TABLE "public"."minerba_exports_annual"
      ADD CONSTRAINT
        "minerba_exports_annual_not_reported_data_check"
      CHECK (
        "data_availability" <> 'not_reported'
        OR (
          "destination_region_id" IS NULL
          AND "export_volume" IS NULL
          AND "volume_unit_code" IS NULL
          AND "volume_scale" IS NULL
          AND "fob_value" IS NULL
          AND "fob_value_scale" IS NULL
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname =
        'minerba_exports_annual_reported_data_check'
      AND conrelid =
        'public.minerba_exports_annual'::regclass
  ) THEN
    ALTER TABLE "public"."minerba_exports_annual"
      ADD CONSTRAINT
        "minerba_exports_annual_reported_data_check"
      CHECK (
        "data_availability" <> 'reported'
        OR (
          "destination_region_id" IS NOT NULL
          AND "export_volume" IS NOT NULL
          AND "volume_unit_code" IS NOT NULL
          AND "volume_scale" IS NOT NULL
          AND "fob_value" IS NOT NULL
          AND "fob_value_scale" IS NOT NULL
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname = 'minerba_exports_annual_volume_check'
      AND conrelid =
        'public.minerba_exports_annual'::regclass
  ) THEN
    ALTER TABLE "public"."minerba_exports_annual"
      ADD CONSTRAINT "minerba_exports_annual_volume_check"
      CHECK (
        "export_volume" IS NULL
        OR "export_volume" >= 0
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname =
        'minerba_exports_annual_volume_scale_check'
      AND conrelid =
        'public.minerba_exports_annual'::regclass
  ) THEN
    ALTER TABLE "public"."minerba_exports_annual"
      ADD CONSTRAINT
        "minerba_exports_annual_volume_scale_check"
      CHECK (
        "volume_scale" IS NULL
        OR "volume_scale" IN (
          'unit',
          'thousand',
          'million',
          'billion'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname = 'minerba_exports_annual_year_check'
      AND conrelid =
        'public.minerba_exports_annual'::regclass
  ) THEN
    ALTER TABLE "public"."minerba_exports_annual"
      ADD CONSTRAINT "minerba_exports_annual_year_check"
      CHECK ("year" BETWEEN 1900 AND 2100);
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
      conname = 'minerba_export_sources_export_id_fk'
      AND conrelid =
        'public.minerba_export_sources'::regclass
  ) THEN
    ALTER TABLE "public"."minerba_export_sources"
      ADD CONSTRAINT "minerba_export_sources_export_id_fk"
      FOREIGN KEY ("minerba_export_id")
      REFERENCES "public"."minerba_exports_annual"("id")
      ON DELETE cascade
      ON UPDATE cascade;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname = 'minerba_export_sources_source_id_fk'
      AND conrelid =
        'public.minerba_export_sources'::regclass
  ) THEN
    ALTER TABLE "public"."minerba_export_sources"
      ADD CONSTRAINT "minerba_export_sources_source_id_fk"
      FOREIGN KEY ("source_id")
      REFERENCES "public"."sources"("id")
      ON DELETE restrict
      ON UPDATE cascade;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE
      conname = 'minerba_export_sources_unique'
      AND conrelid =
        'public.minerba_export_sources'::regclass
  ) THEN
    ALTER TABLE "public"."minerba_export_sources"
      ADD CONSTRAINT "minerba_export_sources_unique"
      UNIQUE (
        "minerba_export_id",
        "source_id",
        "source_url"
      );
  END IF;
END
$$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS
  "minerba_exports_annual_availability_idx"
ON "public"."minerba_exports_annual"
USING btree ("data_availability");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS
  "minerba_exports_annual_commodity_idx"
ON "public"."minerba_exports_annual"
USING btree ("commodity_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS
  "minerba_exports_annual_destination_idx"
ON "public"."minerba_exports_annual"
USING btree ("destination_region_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS
  "minerba_exports_annual_origin_idx"
ON "public"."minerba_exports_annual"
USING btree ("origin_region_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS
  "minerba_exports_annual_publication_idx"
ON "public"."minerba_exports_annual"
USING btree ("publication_status");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS
  "minerba_exports_annual_source_idx"
ON "public"."minerba_exports_annual"
USING btree ("source_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS
  "minerba_exports_annual_verification_idx"
ON "public"."minerba_exports_annual"
USING btree ("verification_status");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS
  "minerba_exports_annual_year_idx"
ON "public"."minerba_exports_annual"
USING btree ("year");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS
  "minerba_export_sources_export_idx"
ON "public"."minerba_export_sources"
USING btree ("minerba_export_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS
  "minerba_export_sources_source_idx"
ON "public"."minerba_export_sources"
USING btree ("source_id");
--> statement-breakpoint

CREATE OR REPLACE VIEW
  "public"."minerba_exports_annual_metrics"
WITH (security_invoker = true)
AS
WITH normalized AS (
  SELECT
    export_record.id,
    export_record.commodity_id,
    export_record.origin_region_id,
    export_record.destination_region_id,
    export_record.year,
    export_record.source_commodity_label,
    export_record.hs_code,
    export_record.coverage_type,
    export_record.export_volume,
    export_record.volume_unit_code,
    export_record.volume_scale,
    export_record.fob_value,
    export_record.currency_code,
    export_record.fob_value_scale,
    export_record.data_availability,
    export_record.data_status,
    export_record.record_type,
    export_record.source_id,
    export_record.source_published_at,
    export_record.verification_status,
    export_record.publication_status,
    export_record.notes,
    export_record.metadata,
    export_record.created_at,
    export_record.updated_at,

    CASE export_record.volume_scale
      WHEN 'unit'
        THEN export_record.export_volume
      WHEN 'thousand'
        THEN export_record.export_volume * 1000
      WHEN 'million'
        THEN export_record.export_volume * 1000000
      WHEN 'billion'
        THEN export_record.export_volume * 1000000000
      ELSE NULL::numeric
    END AS normalized_volume_metric_ton,

    CASE export_record.fob_value_scale
      WHEN 'unit'
        THEN export_record.fob_value
      WHEN 'thousand'
        THEN export_record.fob_value * 1000
      WHEN 'million'
        THEN export_record.fob_value * 1000000
      WHEN 'billion'
        THEN export_record.fob_value * 1000000000
      ELSE NULL::numeric
    END AS normalized_fob_value_usd

  FROM "public"."minerba_exports_annual" AS export_record
),
with_previous AS (
  SELECT
    normalized.*,

    lag(normalized.normalized_fob_value_usd) OVER (
      PARTITION BY
        normalized.commodity_id,
        normalized.origin_region_id,
        normalized.destination_region_id,
        normalized.hs_code,
        normalized.record_type
      ORDER BY normalized.year
    ) AS previous_fob_value_usd

  FROM normalized
)
SELECT
  with_previous.id,
  with_previous.commodity_id,
  commodity.name AS commodity_name,
  commodity.slug AS commodity_slug,
  with_previous.origin_region_id,
  origin_region.code AS origin_region_code,
  origin_region.name AS origin_region_name,
  with_previous.destination_region_id,
  destination_region.code AS destination_region_code,
  destination_region.name AS destination_region_name,
  with_previous.year,
  with_previous.source_commodity_label,
  with_previous.hs_code,
  with_previous.coverage_type,
  with_previous.export_volume,
  with_previous.volume_unit_code,
  with_previous.volume_scale,
  with_previous.normalized_volume_metric_ton,
  with_previous.fob_value,
  with_previous.currency_code,
  with_previous.fob_value_scale,
  with_previous.normalized_fob_value_usd,

  CASE
    WHEN
      with_previous.normalized_volume_metric_ton IS NULL
      OR with_previous.normalized_volume_metric_ton = 0
      THEN NULL::numeric
    ELSE round(
      with_previous.normalized_fob_value_usd
      / with_previous.normalized_volume_metric_ton,
      6
    )
  END AS average_fob_usd_per_metric_ton,

  CASE
    WHEN with_previous.previous_fob_value_usd IS NULL
      THEN NULL::numeric
    ELSE round(
      (
        with_previous.normalized_fob_value_usd
        / nullif(with_previous.previous_fob_value_usd, 0)
        - 1
      ) * 100,
      4
    )
  END AS nominal_fob_yoy_change_percentage,

  with_previous.data_availability,
  with_previous.data_status,
  with_previous.record_type,
  with_previous.source_id,
  with_previous.source_published_at,
  with_previous.verification_status,
  with_previous.publication_status,
  with_previous.notes,
  with_previous.metadata,
  with_previous.created_at,
  with_previous.updated_at

FROM with_previous
INNER JOIN "public"."commodities" AS commodity
  ON commodity.id = with_previous.commodity_id
INNER JOIN "public"."regions" AS origin_region
  ON origin_region.id = with_previous.origin_region_id
LEFT JOIN "public"."regions" AS destination_region
  ON destination_region.id =
    with_previous.destination_region_id;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE
      schemaname = 'public'
      AND tablename = 'minerba_exports_annual'
      AND policyname =
        'public_read_published_verified_minerba_exports'
  ) THEN
    CREATE POLICY
      "public_read_published_verified_minerba_exports"
    ON "public"."minerba_exports_annual"
    AS PERMISSIVE
    FOR SELECT
    TO "anon", "authenticated"
    USING (
      "publication_status" = 'published'
      AND "verification_status" = 'verified'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE
      schemaname = 'public'
      AND tablename = 'minerba_export_sources'
      AND policyname =
        'public_read_sources_of_published_minerba_exports'
  ) THEN
    CREATE POLICY
      "public_read_sources_of_published_minerba_exports"
    ON "public"."minerba_export_sources"
    AS PERMISSIVE
    FOR SELECT
    TO "anon", "authenticated"
    USING (
      EXISTS (
        SELECT 1
        FROM "public"."minerba_exports_annual"
          AS export_record
        WHERE
          export_record.id = minerba_export_id
          AND export_record.publication_status = 'published'
          AND export_record.verification_status = 'verified'
      )
    );
  END IF;
END
$$;