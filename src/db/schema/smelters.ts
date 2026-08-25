import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  foreignKey,
  index,
  jsonb,
  numeric,
  pgPolicy,
  pgTable,
  pgView,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { anonRole, authenticatedRole } from "drizzle-orm/supabase";

import { commodities } from "./commodities";
import {
  publicationStatusEnum,
  smelterFacilityStatusEnum,
  smelterFacilityTypeEnum,
  verificationStatusEnum,
} from "./common";
import { measurementUnits } from "./measurement-units";
import { regions } from "./regions";
import { sources } from "./sources";

export const smelterOperators = pgTable(
  "smelter_operators",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    legalName: varchar("legal_name").notNull(),
    slug: varchar("slug").notNull(),
    websiteUrl: text("website_url"),
    countryCode: varchar("country_code").default("ID").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("smelter_operators_slug_unique").on(table.slug),

    index("smelter_operators_legal_name_idx").on(table.legalName),

    check(
      "smelter_operators_country_code_check",
      sql`${table.countryCode} ~ '^[A-Z]{2}$'`,
    ),

    pgPolicy("smelter_operators_public_read", {
      as: "permissive",
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`${table.isActive} = true`,
    }),
  ],
).enableRLS();

export const smelterFacilities = pgTable(
  "smelter_facilities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    facilityCode: varchar("facility_code").notNull(),
    name: varchar("name").notNull(),
    slug: varchar("slug").notNull(),
    operatorId: uuid("operator_id").notNull(),
    facilityType: smelterFacilityTypeEnum("facility_type").notNull(),
    currentStatus: smelterFacilityStatusEnum("current_status")
      .default("unknown")
      .notNull(),
    provinceRegionId: uuid("province_region_id").notNull(),
    cityRegencyName: varchar("city_regency_name").notNull(),
    address: text("address"),
    latitude: numeric("latitude"),
    longitude: numeric("longitude"),
    reportedOperationYear: smallint("reported_operation_year"),
    constructionYear: smallint("construction_year"),
    commissioningYear: smallint("commissioning_year"),
    commercialOperationYear: smallint("commercial_operation_year"),
    sourceId: uuid("source_id"),
    verificationStatus: verificationStatusEnum("verification_status")
      .default("pending")
      .notNull(),
    publicationStatus: publicationStatusEnum("publication_status")
      .default("draft")
      .notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    notes: text("notes"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("smelter_facilities_code_unique").on(table.facilityCode),

    unique("smelter_facilities_slug_unique").on(table.slug),

    foreignKey({
      name: "smelter_facilities_operator_id_fk",
      columns: [table.operatorId],
      foreignColumns: [smelterOperators.id],
    })
      .onUpdate("cascade")
      .onDelete("restrict"),

    foreignKey({
      name: "smelter_facilities_province_region_id_fk",
      columns: [table.provinceRegionId],
      foreignColumns: [regions.id],
    })
      .onUpdate("cascade")
      .onDelete("restrict"),

    foreignKey({
      name: "smelter_facilities_source_id_fk",
      columns: [table.sourceId],
      foreignColumns: [sources.id],
    })
      .onUpdate("cascade")
      .onDelete("restrict"),

    index("smelter_facilities_operator_idx").on(table.operatorId),

    index("smelter_facilities_province_idx").on(table.provinceRegionId),

    index("smelter_facilities_publication_idx").on(table.publicationStatus),

    index("smelter_facilities_status_idx").on(table.currentStatus),

    index("smelter_facilities_type_idx").on(table.facilityType),

    index("smelter_facilities_verification_idx").on(table.verificationStatus),

    check(
      "smelter_facilities_reported_year_check",
      sql`
        ${table.reportedOperationYear} IS NULL
        OR ${table.reportedOperationYear} BETWEEN 1900 AND 2100
      `,
    ),

    check(
      "smelter_facilities_construction_year_check",
      sql`
        ${table.constructionYear} IS NULL
        OR ${table.constructionYear} BETWEEN 1900 AND 2100
      `,
    ),

    check(
      "smelter_facilities_commissioning_year_check",
      sql`
        ${table.commissioningYear} IS NULL
        OR ${table.commissioningYear} BETWEEN 1900 AND 2100
      `,
    ),

    check(
      "smelter_facilities_commercial_year_check",
      sql`
        ${table.commercialOperationYear} IS NULL
        OR ${table.commercialOperationYear} BETWEEN 1900 AND 2100
      `,
    ),

    check(
      "smelter_facilities_construction_commissioning_check",
      sql`
        ${table.constructionYear} IS NULL
        OR ${table.commissioningYear} IS NULL
        OR ${table.constructionYear} <= ${table.commissioningYear}
      `,
    ),

    check(
      "smelter_facilities_commissioning_commercial_check",
      sql`
        ${table.commissioningYear} IS NULL
        OR ${table.commercialOperationYear} IS NULL
        OR ${table.commissioningYear} <= ${table.commercialOperationYear}
      `,
    ),

    check(
      "smelter_facilities_latitude_check",
      sql`
        ${table.latitude} IS NULL
        OR ${table.latitude} BETWEEN -90 AND 90
      `,
    ),

    check(
      "smelter_facilities_longitude_check",
      sql`
        ${table.longitude} IS NULL
        OR ${table.longitude} BETWEEN -180 AND 180
      `,
    ),

    pgPolicy("smelter_facilities_public_read", {
      as: "permissive",
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`
        ${table.isActive} = true
        AND ${table.publicationStatus} = 'published'
      `,
    }),
  ],
).enableRLS();

export const smelterFacilityOutputs = pgTable(
  "smelter_facility_outputs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    facilityId: uuid("facility_id").notNull(),
    commodityId: uuid("commodity_id").notNull(),
    inputMaterial: varchar("input_material").notNull(),
    outputProduct: varchar("output_product").notNull(),
    processType: varchar("process_type"),
    inputCapacityValue: numeric("input_capacity_value"),
    inputCapacityUnitCode: varchar("input_capacity_unit_code"),
    outputCapacityValue: numeric("output_capacity_value"),
    outputCapacityUnitCode: varchar("output_capacity_unit_code"),
    capacityReferenceYear: smallint("capacity_reference_year"),
    isPrimary: boolean("is_primary").default(true).notNull(),
    notes: text("notes"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("smelter_facility_outputs_unique").on(
      table.facilityId,
      table.commodityId,
      table.outputProduct,
    ),

    foreignKey({
      name: "smelter_facility_outputs_facility_id_fk",
      columns: [table.facilityId],
      foreignColumns: [smelterFacilities.id],
    })
      .onUpdate("cascade")
      .onDelete("cascade"),

    foreignKey({
      name: "smelter_facility_outputs_commodity_id_fk",
      columns: [table.commodityId],
      foreignColumns: [commodities.id],
    })
      .onUpdate("cascade")
      .onDelete("restrict"),

    foreignKey({
      name: "smelter_facility_outputs_input_unit_fk",
      columns: [table.inputCapacityUnitCode],
      foreignColumns: [measurementUnits.code],
    })
      .onUpdate("cascade")
      .onDelete("restrict"),

    foreignKey({
      name: "smelter_facility_outputs_output_unit_fk",
      columns: [table.outputCapacityUnitCode],
      foreignColumns: [measurementUnits.code],
    })
      .onUpdate("cascade")
      .onDelete("restrict"),

    index("smelter_facility_outputs_facility_idx").on(table.facilityId),

    index("smelter_facility_outputs_commodity_idx").on(table.commodityId),

    check(
      "smelter_facility_outputs_capacity_year_check",
      sql`
        ${table.capacityReferenceYear} IS NULL
        OR ${table.capacityReferenceYear} BETWEEN 1900 AND 2100
      `,
    ),

    check(
      "smelter_facility_outputs_input_capacity_check",
      sql`
        ${table.inputCapacityValue} IS NULL
        OR ${table.inputCapacityValue} >= 0
      `,
    ),

    check(
      "smelter_facility_outputs_output_capacity_check",
      sql`
        ${table.outputCapacityValue} IS NULL
        OR ${table.outputCapacityValue} >= 0
      `,
    ),

    check(
      "smelter_facility_outputs_input_unit_check",
      sql`
        ${table.inputCapacityValue} IS NULL
        OR ${table.inputCapacityUnitCode} IS NOT NULL
      `,
    ),

    check(
      "smelter_facility_outputs_output_unit_check",
      sql`
        ${table.outputCapacityValue} IS NULL
        OR ${table.outputCapacityUnitCode} IS NOT NULL
      `,
    ),

    pgPolicy("smelter_facility_outputs_public_read", {
      as: "permissive",
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`
        EXISTS (
          SELECT 1
          FROM ${smelterFacilities} AS smelter_facility
          WHERE
            smelter_facility.id = ${table.facilityId}
            AND smelter_facility.is_active = true
            AND smelter_facility.publication_status = 'published'
        )
      `,
    }),
  ],
).enableRLS();

export const smelterFacilitySources = pgTable(
  "smelter_facility_sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    facilityId: uuid("facility_id").notNull(),
    sourceId: uuid("source_id"),
    publisherName: varchar("publisher_name").notNull(),
    documentTitle: text("document_title").notNull(),
    sourceUrl: text("source_url").notNull(),
    publishedDate: date("published_date", {
      mode: "string",
    }),
    accessedAt: date("accessed_at", {
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    supportsFields: text("supports_fields")
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    isOfficial: boolean("is_official").default(false).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "date",
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("smelter_facility_sources_unique").on(
      table.facilityId,
      table.sourceUrl,
    ),

    foreignKey({
      name: "smelter_facility_sources_facility_id_fk",
      columns: [table.facilityId],
      foreignColumns: [smelterFacilities.id],
    })
      .onUpdate("cascade")
      .onDelete("cascade"),

    foreignKey({
      name: "smelter_facility_sources_source_id_fk",
      columns: [table.sourceId],
      foreignColumns: [sources.id],
    })
      .onUpdate("cascade")
      .onDelete("set null"),

    index("smelter_facility_sources_facility_idx").on(table.facilityId),

    check(
      "smelter_facility_sources_url_check",
      sql`${table.sourceUrl} ~ '^https://'`,
    ),

    pgPolicy("smelter_facility_sources_public_read", {
      as: "permissive",
      for: "select",
      to: [anonRole, authenticatedRole],
      using: sql`
        EXISTS (
          SELECT 1
          FROM ${smelterFacilities} AS smelter_facility
          WHERE
            smelter_facility.id = ${table.facilityId}
            AND smelter_facility.is_active = true
            AND smelter_facility.publication_status = 'published'
        )
      `,
    }),
  ],
).enableRLS();

export const smelterFacilityCatalog = pgView("smelter_facility_catalog", {
  id: uuid("id"),
  facilityCode: varchar("facility_code"),
  facilityName: varchar("facility_name"),
  slug: varchar("slug"),
  operatorName: varchar("operator_name"),
  facilityType: smelterFacilityTypeEnum("facility_type"),
  currentStatus: smelterFacilityStatusEnum("current_status"),
  provinceName: varchar("province_name"),
  cityRegencyName: varchar("city_regency_name"),
  reportedOperationYear: smallint("reported_operation_year"),
  constructionYear: smallint("construction_year"),
  commissioningYear: smallint("commissioning_year"),
  commercialOperationYear: smallint("commercial_operation_year"),
  commodityId: uuid("commodity_id"),
  commodityName: varchar("commodity_name"),
  commoditySlug: varchar("commodity_slug"),
  inputMaterial: varchar("input_material"),
  outputProduct: varchar("output_product"),
  processType: varchar("process_type"),
  inputCapacityValue: numeric("input_capacity_value"),
  inputCapacityUnitCode: varchar("input_capacity_unit_code"),
  outputCapacityValue: numeric("output_capacity_value"),
  outputCapacityUnitCode: varchar("output_capacity_unit_code"),
  capacityReferenceYear: smallint("capacity_reference_year"),
  verificationStatus: verificationStatusEnum("verification_status"),
  publicationStatus: publicationStatusEnum("publication_status"),
  notes: text("notes"),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
  }),
}).with({
  securityInvoker: true,
}).as(sql`
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
    FROM ${smelterFacilities} AS smelter_facility
    INNER JOIN ${smelterOperators} AS smelter_operator
      ON smelter_operator.id = smelter_facility.operator_id
    INNER JOIN ${regions} AS province
      ON province.id = smelter_facility.province_region_id
    INNER JOIN ${smelterFacilityOutputs} AS facility_output
      ON facility_output.facility_id = smelter_facility.id
    INNER JOIN ${commodities} AS commodity
      ON commodity.id = facility_output.commodity_id
  `);

export const smelterSummaryByCommodity = pgView(
  "smelter_summary_by_commodity",
  {
    commodityId: uuid("commodity_id"),
    commodityName: varchar("commodity_name"),
    commoditySlug: varchar("commodity_slug"),
    facilityCount: bigint("facility_count", {
      mode: "number",
    }),
    provinceCount: bigint("province_count", {
      mode: "number",
    }),
    operatingFacilityCount: bigint("operating_facility_count", {
      mode: "number",
    }),
    knownAnnualOutputCapacityMetricTon: numeric(
      "known_annual_output_capacity_metric_ton",
    ),
  },
).with({
  securityInvoker: true,
}).as(sql`
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
    FROM ${smelterFacilityOutputs} AS facility_output
    INNER JOIN ${smelterFacilities} AS smelter_facility
      ON smelter_facility.id = facility_output.facility_id
    INNER JOIN ${commodities} AS commodity
      ON commodity.id = facility_output.commodity_id
    GROUP BY
      commodity.id,
      commodity.name,
      commodity.slug
  `);

export type SmelterOperator = typeof smelterOperators.$inferSelect;
export type NewSmelterOperator = typeof smelterOperators.$inferInsert;

export type SmelterFacility = typeof smelterFacilities.$inferSelect;
export type NewSmelterFacility = typeof smelterFacilities.$inferInsert;

export type SmelterFacilityOutput = typeof smelterFacilityOutputs.$inferSelect;

export type NewSmelterFacilityOutput =
  typeof smelterFacilityOutputs.$inferInsert;

export type SmelterFacilitySource = typeof smelterFacilitySources.$inferSelect;

export type NewSmelterFacilitySource =
  typeof smelterFacilitySources.$inferInsert;
