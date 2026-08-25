DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type AS type_definition
    INNER JOIN pg_namespace AS type_namespace
      ON type_namespace.oid = type_definition.typnamespace
    WHERE
      type_namespace.nspname = 'public'
      AND type_definition.typname = 'investment_origin_type'
  ) THEN
    CREATE TYPE "public"."investment_origin_type"
      AS ENUM ('pma', 'pmdn');
  END IF;
END
$$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "public"."mining_investment_annual" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "region_id" uuid NOT NULL,
  "year" smallint NOT NULL,
  "sector_code" varchar(50) DEFAULT 'mining' NOT NULL,
  "sector_name" varchar(160) DEFAULT 'Pertambangan' NOT NULL,
  "investment_origin" "public"."investment_origin_type" NOT NULL,
  "investment_value" numeric(24, 6) NOT NULL,
  "currency_code" varchar(3) DEFAULT 'IDR' NOT NULL,
  "value_scale" varchar(20) DEFAULT 'trillion' NOT NULL,
  "project_count" integer,
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

CREATE TABLE IF NOT EXISTS "public"."mining_investment_sources" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "mining_investment_id" uuid NOT NULL,
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

ALTER TABLE "public"."mining_investment_annual"
ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

ALTER TABLE "public"."mining_investment_sources"
ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'mining_investment_annual_region_id_fk'
      AND conrelid =
        'public.mining_investment_annual'::regclass
  ) THEN
    ALTER TABLE "public"."mining_investment_annual"
      ADD CONSTRAINT "mining_investment_annual_region_id_fk"
      FOREIGN KEY ("region_id")
      REFERENCES "public"."regions"("id")
      ON DELETE restrict
      ON UPDATE cascade;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'mining_investment_annual_source_id_fk'
      AND conrelid =
        'public.mining_investment_annual'::regclass
  ) THEN
    ALTER TABLE "public"."mining_investment_annual"
      ADD CONSTRAINT "mining_investment_annual_source_id_fk"
      FOREIGN KEY ("source_id")
      REFERENCES "public"."sources"("id")
      ON DELETE restrict
      ON UPDATE cascade;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'mining_investment_annual_unique'
      AND conrelid =
        'public.mining_investment_annual'::regclass
  ) THEN
    ALTER TABLE "public"."mining_investment_annual"
      ADD CONSTRAINT "mining_investment_annual_unique"
      UNIQUE (
        "region_id",
        "year",
        "sector_code",
        "investment_origin",
        "record_type"
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'mining_investment_annual_currency_check'
      AND conrelid =
        'public.mining_investment_annual'::regclass
  ) THEN
    ALTER TABLE "public"."mining_investment_annual"
      ADD CONSTRAINT "mining_investment_annual_currency_check"
      CHECK ("currency_code" ~ '^[A-Z]{3}$');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname =
      'mining_investment_annual_project_count_check'
      AND conrelid =
        'public.mining_investment_annual'::regclass
  ) THEN
    ALTER TABLE "public"."mining_investment_annual"
      ADD CONSTRAINT
        "mining_investment_annual_project_count_check"
      CHECK (
        "project_count" IS NULL
        OR "project_count" >= 0
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname =
      'mining_investment_annual_sector_code_check'
      AND conrelid =
        'public.mining_investment_annual'::regclass
  ) THEN
    ALTER TABLE "public"."mining_investment_annual"
      ADD CONSTRAINT
        "mining_investment_annual_sector_code_check"
      CHECK (
        "sector_code" ~
          '^[a-z0-9]+(?:_[a-z0-9]+)*$'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'mining_investment_annual_value_check'
      AND conrelid =
        'public.mining_investment_annual'::regclass
  ) THEN
    ALTER TABLE "public"."mining_investment_annual"
      ADD CONSTRAINT "mining_investment_annual_value_check"
      CHECK ("investment_value" >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname =
      'mining_investment_annual_value_scale_check'
      AND conrelid =
        'public.mining_investment_annual'::regclass
  ) THEN
    ALTER TABLE "public"."mining_investment_annual"
      ADD CONSTRAINT
        "mining_investment_annual_value_scale_check"
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
    WHERE conname = 'mining_investment_annual_year_check'
      AND conrelid =
        'public.mining_investment_annual'::regclass
  ) THEN
    ALTER TABLE "public"."mining_investment_annual"
      ADD CONSTRAINT "mining_investment_annual_year_check"
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
    WHERE conname =
      'mining_investment_sources_investment_id_fk'
      AND conrelid =
        'public.mining_investment_sources'::regclass
  ) THEN
    ALTER TABLE "public"."mining_investment_sources"
      ADD CONSTRAINT
        "mining_investment_sources_investment_id_fk"
      FOREIGN KEY ("mining_investment_id")
      REFERENCES "public"."mining_investment_annual"("id")
      ON DELETE cascade
      ON UPDATE cascade;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname =
      'mining_investment_sources_source_id_fk'
      AND conrelid =
        'public.mining_investment_sources'::regclass
  ) THEN
    ALTER TABLE "public"."mining_investment_sources"
      ADD CONSTRAINT
        "mining_investment_sources_source_id_fk"
      FOREIGN KEY ("source_id")
      REFERENCES "public"."sources"("id")
      ON DELETE restrict
      ON UPDATE cascade;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'mining_investment_sources_unique'
      AND conrelid =
        'public.mining_investment_sources'::regclass
  ) THEN
    ALTER TABLE "public"."mining_investment_sources"
      ADD CONSTRAINT "mining_investment_sources_unique"
      UNIQUE (
        "mining_investment_id",
        "source_id",
        "source_url"
      );
  END IF;
END
$$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS
  "mining_investment_annual_origin_idx"
ON "public"."mining_investment_annual"
USING btree ("investment_origin");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS
  "mining_investment_annual_publication_idx"
ON "public"."mining_investment_annual"
USING btree ("publication_status");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS
  "mining_investment_annual_region_idx"
ON "public"."mining_investment_annual"
USING btree ("region_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS
  "mining_investment_annual_source_idx"
ON "public"."mining_investment_annual"
USING btree ("source_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS
  "mining_investment_annual_verification_idx"
ON "public"."mining_investment_annual"
USING btree ("verification_status");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS
  "mining_investment_annual_year_idx"
ON "public"."mining_investment_annual"
USING btree ("year");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS
  "mining_investment_sources_investment_idx"
ON "public"."mining_investment_sources"
USING btree ("mining_investment_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS
  "mining_investment_sources_source_idx"
ON "public"."mining_investment_sources"
USING btree ("source_id");
--> statement-breakpoint

CREATE OR REPLACE VIEW
  "public"."mining_investment_annual_metrics"
WITH (security_invoker = true)
AS
WITH row_metrics AS (
  SELECT
    investment.id,
    investment.region_id,
    investment.year,
    investment.sector_code,
    investment.sector_name,
    investment.investment_origin,
    investment.investment_value,
    investment.currency_code,
    investment.value_scale,
    investment.project_count,
    investment.data_status,
    investment.record_type,
    investment.source_id,
    investment.source_published_at,
    investment.verification_status,
    investment.publication_status,
    investment.notes,
    investment.metadata,
    investment.created_at,
    investment.updated_at,

    lag(investment.investment_value) OVER (
      PARTITION BY
        investment.region_id,
        investment.sector_code,
        investment.investment_origin,
        investment.currency_code,
        investment.value_scale,
        investment.record_type
      ORDER BY investment.year
    ) AS previous_investment_value,

    sum(investment.investment_value) OVER (
      PARTITION BY
        investment.region_id,
        investment.year,
        investment.sector_code,
        investment.currency_code,
        investment.value_scale,
        investment.record_type
    ) AS annual_total_investment_value,

    sum(investment.project_count) OVER (
      PARTITION BY
        investment.region_id,
        investment.year,
        investment.sector_code,
        investment.record_type
    ) AS annual_total_project_count

  FROM "public"."mining_investment_annual"
    AS investment
)
SELECT
  row_metrics.id,
  row_metrics.region_id,
  region.code AS region_code,
  region.name AS region_name,
  row_metrics.year,
  row_metrics.sector_code,
  row_metrics.sector_name,
  row_metrics.investment_origin,
  row_metrics.investment_value,
  row_metrics.currency_code,
  row_metrics.value_scale,
  row_metrics.project_count,
  row_metrics.annual_total_investment_value,
  row_metrics.annual_total_project_count,

  round(
    row_metrics.investment_value
    / nullif(row_metrics.annual_total_investment_value, 0)
    * 100,
    4
  ) AS annual_value_share_percentage,

  CASE
    WHEN row_metrics.previous_investment_value IS NULL
      THEN NULL::numeric
    ELSE round(
      (
        row_metrics.investment_value
        / nullif(row_metrics.previous_investment_value, 0)
        - 1
      ) * 100,
      4
    )
  END AS nominal_yoy_change_percentage,

  row_metrics.data_status,
  row_metrics.record_type,
  row_metrics.source_id,
  row_metrics.source_published_at,
  row_metrics.verification_status,
  row_metrics.publication_status,
  row_metrics.notes,
  row_metrics.metadata,
  row_metrics.created_at,
  row_metrics.updated_at

FROM row_metrics
INNER JOIN "public"."regions" AS region
  ON region.id = row_metrics.region_id;
--> statement-breakpoint

CREATE OR REPLACE VIEW
  "public"."mining_investment_annual_summary"
WITH (security_invoker = true)
AS
WITH annual_summary AS (
  SELECT
    investment.region_id,
    investment.year,
    investment.sector_code,
    max(investment.sector_name::text) AS sector_name,
    investment.currency_code,
    investment.value_scale,
    investment.record_type,

    sum(investment.investment_value)
      AS total_investment_value,

    sum(investment.project_count)
      AS total_project_count,

    max(investment.investment_value) FILTER (
      WHERE investment.investment_origin = 'pma'
    ) AS pma_investment_value,

    max(investment.investment_value) FILTER (
      WHERE investment.investment_origin = 'pmdn'
    ) AS pmdn_investment_value,

    max(investment.project_count) FILTER (
      WHERE investment.investment_origin = 'pma'
    ) AS pma_project_count,

    max(investment.project_count) FILTER (
      WHERE investment.investment_origin = 'pmdn'
    ) AS pmdn_project_count,

    bool_and(
      investment.verification_status = 'verified'
    ) AS is_fully_verified,

    bool_and(
      investment.publication_status = 'published'
    ) AS is_fully_published

  FROM "public"."mining_investment_annual"
    AS investment

  GROUP BY
    investment.region_id,
    investment.year,
    investment.sector_code,
    investment.currency_code,
    investment.value_scale,
    investment.record_type
),
summary_with_previous AS (
  SELECT
    annual_summary.*,

    lag(annual_summary.total_investment_value) OVER (
      PARTITION BY
        annual_summary.region_id,
        annual_summary.sector_code,
        annual_summary.currency_code,
        annual_summary.value_scale,
        annual_summary.record_type
      ORDER BY annual_summary.year
    ) AS previous_total_investment_value

  FROM annual_summary
)
SELECT
  summary.region_id,
  region.code AS region_code,
  region.name AS region_name,
  summary.year,
  summary.sector_code,
  summary.sector_name,
  summary.pma_investment_value,
  summary.pmdn_investment_value,
  summary.total_investment_value,
  summary.currency_code,
  summary.value_scale,
  summary.pma_project_count,
  summary.pmdn_project_count,
  summary.total_project_count,

  CASE
    WHEN summary.previous_total_investment_value IS NULL
      THEN NULL::numeric
    ELSE round(
      (
        summary.total_investment_value
        / nullif(summary.previous_total_investment_value, 0)
        - 1
      ) * 100,
      4
    )
  END AS nominal_total_yoy_change_percentage,

  summary.record_type,
  summary.is_fully_verified,
  summary.is_fully_published

FROM summary_with_previous AS summary
INNER JOIN "public"."regions" AS region
  ON region.id = summary.region_id;
--> statement-breakpoint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE
      schemaname = 'public'
      AND tablename = 'mining_investment_annual'
      AND policyname =
        'public_read_published_verified_mining_investment'
  ) THEN
    CREATE POLICY
      "public_read_published_verified_mining_investment"
    ON "public"."mining_investment_annual"
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
      AND tablename = 'mining_investment_sources'
      AND policyname =
        'public_read_sources_of_published_mining_investment'
  ) THEN
    CREATE POLICY
      "public_read_sources_of_published_mining_investment"
    ON "public"."mining_investment_sources"
    AS PERMISSIVE
    FOR SELECT
    TO "anon", "authenticated"
    USING (
      EXISTS (
        SELECT 1
        FROM "public"."mining_investment_annual"
          AS investment
        WHERE
          investment.id = mining_investment_id
          AND investment.publication_status = 'published'
          AND investment.verification_status = 'verified'
      )
    );
  END IF;
END
$$;