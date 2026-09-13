CREATE TYPE "public"."export_product_form" AS ENUM('ore', 'concentrate', 'refined_metal', 'processed_product', 'coal', 'other');--> statement-breakpoint
ALTER TABLE "economic_gdp_annual" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "economic_gdp_sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "mining_investment_annual" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "mining_investment_sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "minerba_export_sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "minerba_exports_annual" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP VIEW "public"."economic_gdp_annual_metrics";--> statement-breakpoint
DROP VIEW "public"."mining_investment_annual_metrics";--> statement-breakpoint
DROP VIEW "public"."mining_investment_annual_summary";--> statement-breakpoint
DROP VIEW "public"."minerba_exports_annual_metrics";--> statement-breakpoint
DROP VIEW "public"."smelter_facility_catalog";--> statement-breakpoint
DROP VIEW "public"."smelter_summary_by_commodity";--> statement-breakpoint
ALTER TABLE "minerba_exports_annual" DROP CONSTRAINT "minerba_exports_annual_unique";--> statement-breakpoint
ALTER TABLE "minerba_exports_annual" ADD COLUMN "product_form" "export_product_form";--> statement-breakpoint
ALTER TABLE "minerba_exports_annual" ADD CONSTRAINT "minerba_exports_annual_unique" UNIQUE NULLS NOT DISTINCT("commodity_id","origin_region_id","destination_region_id","year","hs_code","product_form","record_type");--> statement-breakpoint
ALTER TABLE "minerba_exports_annual" ADD CONSTRAINT "minerba_exports_annual_availability_payload_check" CHECK (
        (
          "minerba_exports_annual"."data_availability" = 'reported'
          AND "minerba_exports_annual"."destination_region_id" IS NOT NULL
          AND "minerba_exports_annual"."export_volume" IS NOT NULL
          AND "minerba_exports_annual"."volume_unit_code" IS NOT NULL
          AND "minerba_exports_annual"."volume_scale" IS NOT NULL
          AND "minerba_exports_annual"."fob_value" IS NOT NULL
          AND "minerba_exports_annual"."fob_value_scale" IS NOT NULL
        )
        OR (
          "minerba_exports_annual"."data_availability" = 'reported_zero'
          AND "minerba_exports_annual"."destination_region_id" IS NOT NULL
          AND "minerba_exports_annual"."export_volume" IS NOT NULL
          AND "minerba_exports_annual"."volume_unit_code" IS NOT NULL
          AND "minerba_exports_annual"."volume_scale" IS NOT NULL
          AND "minerba_exports_annual"."fob_value" IS NOT NULL
          AND "minerba_exports_annual"."fob_value_scale" IS NOT NULL
          AND "minerba_exports_annual"."export_volume" = 0
          AND "minerba_exports_annual"."fob_value" = 0
        )
        OR (
          "minerba_exports_annual"."data_availability" = 'not_reported'
          AND "minerba_exports_annual"."export_volume" IS NULL
          AND "minerba_exports_annual"."volume_unit_code" IS NULL
          AND "minerba_exports_annual"."volume_scale" IS NULL
          AND "minerba_exports_annual"."fob_value" IS NULL
          AND "minerba_exports_annual"."fob_value_scale" IS NULL
        )
        OR (
          "minerba_exports_annual"."data_availability" = 'estimated'
          AND "minerba_exports_annual"."destination_region_id" IS NOT NULL
          AND "minerba_exports_annual"."export_volume" IS NOT NULL
          AND "minerba_exports_annual"."volume_unit_code" IS NOT NULL
          AND "minerba_exports_annual"."volume_scale" IS NOT NULL
          AND "minerba_exports_annual"."fob_value" IS NOT NULL
          AND "minerba_exports_annual"."fob_value_scale" IS NOT NULL
          AND NULLIF(BTRIM("minerba_exports_annual"."notes"), '') IS NOT NULL
        )
      );--> statement-breakpoint
CREATE VIEW "public"."economic_gdp_annual_metrics" WITH (security_invoker = true) AS (
    WITH eligible AS (
      SELECT gdp.*
      FROM economic_gdp_annual AS gdp
      WHERE gdp.verification_status = 'verified'
        AND gdp.publication_status = 'published'
    ),
    annual_values AS (
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
      FROM eligible AS gdp
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
    INNER JOIN regions AS region
      ON region.id = annual_values.region_id
  );--> statement-breakpoint
CREATE VIEW "public"."mining_investment_annual_metrics" WITH (security_invoker = true) AS (
    WITH eligible AS (
      SELECT investment.*
      FROM mining_investment_annual AS investment
      WHERE investment.verification_status = 'verified'
        AND investment.publication_status = 'published'
    ),
    row_metrics AS (
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

        LAG(investment.investment_value) OVER (
          PARTITION BY
            investment.region_id,
            investment.sector_code,
            investment.investment_origin,
            investment.currency_code,
            investment.value_scale,
            investment.record_type
          ORDER BY investment.year
        ) AS previous_investment_value,

        SUM(investment.investment_value) OVER (
          PARTITION BY
            investment.region_id,
            investment.year,
            investment.sector_code,
            investment.currency_code,
            investment.value_scale,
            investment.record_type
        ) AS annual_total_investment_value,

        SUM(investment.project_count) OVER (
          PARTITION BY
            investment.region_id,
            investment.year,
            investment.sector_code,
            investment.record_type
        ) AS annual_total_project_count

      FROM eligible AS investment
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

      ROUND(
        row_metrics.investment_value
        / NULLIF(row_metrics.annual_total_investment_value, 0)
        * 100,
        4
      ) AS annual_value_share_percentage,

      CASE
        WHEN row_metrics.previous_investment_value IS NULL
          THEN NULL::numeric
        ELSE ROUND(
          (
            row_metrics.investment_value
            / NULLIF(row_metrics.previous_investment_value, 0)
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
    INNER JOIN regions AS region
      ON region.id = row_metrics.region_id
  );--> statement-breakpoint
CREATE VIEW "public"."mining_investment_annual_summary" WITH (security_invoker = true) AS (
    WITH eligible AS (
      SELECT investment.*
      FROM mining_investment_annual AS investment
      WHERE investment.verification_status = 'verified'
        AND investment.publication_status = 'published'
    ),
    annual_summary AS (
      SELECT
        investment.region_id,
        investment.year,
        investment.sector_code,
        MAX(investment.sector_name::text) AS sector_name,
        investment.currency_code,
        investment.value_scale,
        investment.record_type,

        SUM(investment.investment_value)
          AS total_investment_value,

        SUM(investment.project_count)
          AS total_project_count,

        MAX(investment.investment_value) FILTER (
          WHERE investment.investment_origin = 'pma'
        ) AS pma_investment_value,

        MAX(investment.investment_value) FILTER (
          WHERE investment.investment_origin = 'pmdn'
        ) AS pmdn_investment_value,

        MAX(investment.project_count) FILTER (
          WHERE investment.investment_origin = 'pma'
        ) AS pma_project_count,

        MAX(investment.project_count) FILTER (
          WHERE investment.investment_origin = 'pmdn'
        ) AS pmdn_project_count,

        BOOL_AND(
          investment.verification_status = 'verified'
        ) AS is_fully_verified,

        BOOL_AND(
          investment.publication_status = 'published'
        ) AS is_fully_published

      FROM eligible AS investment

      GROUP BY
        investment.region_id,
        investment.year,
        investment.sector_code,
        investment.currency_code,
        investment.value_scale,
        investment.record_type

      HAVING COUNT(*) = 2
        AND COUNT(*) FILTER (WHERE investment.investment_origin = 'pma') = 1
        AND COUNT(*) FILTER (WHERE investment.investment_origin = 'pmdn') = 1
    ),

    summary_with_previous AS (
      SELECT
        annual_summary.*,

        LAG(annual_summary.total_investment_value) OVER (
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
        ELSE ROUND(
          (
            summary.total_investment_value
            / NULLIF(summary.previous_total_investment_value, 0)
            - 1
          ) * 100,
          4
        )
      END AS nominal_total_yoy_change_percentage,

      summary.record_type,
      summary.is_fully_verified,
      summary.is_fully_published

    FROM summary_with_previous AS summary
    INNER JOIN regions AS region
      ON region.id = summary.region_id
  );--> statement-breakpoint
CREATE VIEW "public"."minerba_exports_annual_metrics" WITH (security_invoker = true) AS (
    WITH eligible AS (
      SELECT export_record.*
      FROM minerba_exports_annual AS export_record
      WHERE export_record.verification_status = 'verified'
        AND export_record.publication_status = 'published'
    ),
    normalized AS (
      SELECT
        export_record.*,

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

      FROM eligible AS export_record
    ),

    with_previous AS (
      SELECT
        normalized.*,

        LAG(normalized.normalized_fob_value_usd) OVER (
          PARTITION BY
            normalized.commodity_id,
            normalized.origin_region_id,
            normalized.destination_region_id,
            normalized.hs_code,
            normalized.product_form,
            normalized.coverage_type,
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
      with_previous.product_form,
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
        ELSE ROUND(
          with_previous.normalized_fob_value_usd
          / with_previous.normalized_volume_metric_ton,
          6
        )
      END AS average_fob_usd_per_metric_ton,

      CASE
        WHEN with_previous.previous_fob_value_usd IS NULL
          THEN NULL::numeric
        ELSE ROUND(
          (
            with_previous.normalized_fob_value_usd
            / NULLIF(with_previous.previous_fob_value_usd, 0)
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
    INNER JOIN commodities AS commodity
      ON commodity.id = with_previous.commodity_id
    INNER JOIN regions AS origin_region
      ON origin_region.id = with_previous.origin_region_id
    LEFT JOIN regions AS destination_region
      ON destination_region.id =
        with_previous.destination_region_id
  );--> statement-breakpoint
CREATE VIEW "public"."smelter_facility_catalog" WITH (security_invoker = true) AS (
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
    INNER JOIN "sources" AS source
      ON source.id = smelter_facility.source_id
    WHERE smelter_facility.is_active = true
      AND smelter_facility.verification_status = 'verified'
      AND smelter_facility.publication_status = 'published'
      AND source.is_active = true
      AND source.verification_status = 'verified'
  );--> statement-breakpoint
CREATE VIEW "public"."smelter_summary_by_commodity" WITH (security_invoker = true) AS (
    WITH eligible_outputs AS (
      SELECT
        facility_output.*,
        ROW_NUMBER() OVER (
          PARTITION BY
            facility_output.facility_id,
            facility_output.commodity_id,
            facility_output.output_capacity_unit_code
          ORDER BY
            facility_output.is_primary DESC,
            facility_output.output_product,
            facility_output.id
        ) AS capacity_row
      FROM "smelter_facility_outputs" AS facility_output
    )
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
          AND facility_output.capacity_row = 1
      ) AS known_annual_output_capacity_metric_ton
    FROM eligible_outputs AS facility_output
    INNER JOIN "smelter_facilities" AS smelter_facility
      ON smelter_facility.id = facility_output.facility_id
    INNER JOIN "commodities" AS commodity
      ON commodity.id = facility_output.commodity_id
    INNER JOIN "sources" AS source
      ON source.id = smelter_facility.source_id
    WHERE smelter_facility.is_active = true
      AND smelter_facility.verification_status = 'verified'
      AND smelter_facility.publication_status = 'published'
      AND source.is_active = true
      AND source.verification_status = 'verified'
    GROUP BY
      commodity.id,
      commodity.name,
      commodity.slug
  );--> statement-breakpoint
ALTER POLICY "smelter_facilities_public_read" ON "smelter_facilities" TO anon,authenticated USING (
        "smelter_facilities"."is_active" = true
        AND "smelter_facilities"."verification_status" = 'verified'
        AND "smelter_facilities"."publication_status" = 'published'
        AND EXISTS (
          SELECT 1
          FROM sources AS source
          WHERE source.id = "smelter_facilities"."source_id"
            AND source.is_active = true
            AND source.verification_status = 'verified'
        )
      );--> statement-breakpoint
ALTER POLICY "smelter_facility_outputs_public_read" ON "smelter_facility_outputs" TO anon,authenticated USING (
        EXISTS (
          SELECT 1
          FROM "smelter_facilities" AS smelter_facility
          WHERE
            smelter_facility.id = "smelter_facility_outputs"."facility_id"
            AND smelter_facility.is_active = true
            AND smelter_facility.verification_status = 'verified'
            AND smelter_facility.publication_status = 'published'
            AND EXISTS (
              SELECT 1
              FROM sources AS source
              WHERE source.id = smelter_facility.source_id
                AND source.is_active = true
                AND source.verification_status = 'verified'
            )
        )
      );--> statement-breakpoint
ALTER POLICY "smelter_facility_sources_public_read" ON "smelter_facility_sources" TO anon,authenticated USING (
        EXISTS (
          SELECT 1
          FROM "smelter_facilities" AS smelter_facility
          WHERE
            smelter_facility.id = "smelter_facility_sources"."facility_id"
            AND smelter_facility.is_active = true
            AND smelter_facility.verification_status = 'verified'
            AND smelter_facility.publication_status = 'published'
            AND "smelter_facility_sources"."source_id" IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM sources AS source
              WHERE source.id = "smelter_facility_sources"."source_id"
                AND source.is_active = true
                AND source.verification_status = 'verified'
            )
        )
      );--> statement-breakpoint
ALTER POLICY "smelter_operators_public_read" ON "smelter_operators" TO anon,authenticated USING (
        "smelter_operators"."is_active" = true
        AND EXISTS (
          SELECT 1
          FROM smelter_facilities AS facility
          INNER JOIN sources AS source
            ON source.id = facility.source_id
          WHERE facility.operator_id = "smelter_operators"."id"
            AND facility.is_active = true
            AND facility.verification_status = 'verified'
            AND facility.publication_status = 'published'
            AND source.is_active = true
            AND source.verification_status = 'verified'
        )
      );--> statement-breakpoint
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON TABLE
  "economic_gdp_annual",
  "economic_gdp_sources",
  "mining_investment_annual",
  "mining_investment_sources",
  "minerba_exports_annual",
  "minerba_export_sources",
  "smelter_operators",
  "smelter_facilities",
  "smelter_facility_outputs",
  "smelter_facility_sources"
FROM anon, authenticated;--> statement-breakpoint
GRANT SELECT
ON TABLE
  "economic_gdp_annual",
  "economic_gdp_sources",
  "mining_investment_annual",
  "mining_investment_sources",
  "minerba_exports_annual",
  "minerba_export_sources",
  "smelter_operators",
  "smelter_facilities",
  "smelter_facility_outputs",
  "smelter_facility_sources",
  "economic_gdp_annual_metrics",
  "mining_investment_annual_metrics",
  "mining_investment_annual_summary",
  "minerba_exports_annual_metrics",
  "smelter_facility_catalog",
  "smelter_summary_by_commodity"
TO anon, authenticated;
