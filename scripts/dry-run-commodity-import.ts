import { lstat, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { config } from "dotenv";
import postgres from "postgres";

import {
  COMMODITY_DRY_RUN_TABLES,
  createCommodityDryRunKey,
  createCommodityDryRunPlan,
  createEmptyCommodityDryRunExistingKeys,
  createGlobalStatisticSetKey,
  createResourceStatisticKey,
  type CommodityDryRunExistingKeys,
} from "../src/features/data-ingestion/services/dry-run-commodity-import";
import {
  collectCommodityPreflightRequirements,
  evaluateCommodityPreflight,
  type CommodityPreflightContentRow,
  type CommodityPreflightPrimaryContentRow,
  type CommodityPreflightRegionRow,
  type CommodityPreflightSourceRow,
} from "../src/features/data-ingestion/services/preflight-commodity-import";
import {
  validateCommodityImport,
  validateCommodityManifest,
  type CommodityImportFileInput,
  type CommodityValidationIssue,
  type ValidatedCommodityImport,
} from "../src/features/data-ingestion/services/validate-commodity-import";

config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_MIGRATION_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_MIGRATION_URL tidak ditemukan di file .env.local.",
  );
}

const sqlClient = postgres(databaseUrl, {
  ssl: "require",
  max: 1,
  prepare: false,
  connect_timeout: 10,
  idle_timeout: 20,
});

type SlugRow = { slug: string };
type CodeRow = { code: string };
type PairRow = { left: string; right: string };

type ResourceStatisticRow = {
  commoditySlug: string;
  statisticYear: number;
  statisticType: string;
  materialBasis: string | null;
  recordType: string;
};

type ResourceStatisticSourceRow = ResourceStatisticRow & {
  sourceSlug: string;
  sourceRole: string;
  citationLabel: string | null;
  pageReference: string | null;
};

type ProductionLocationRow = {
  commoditySlug: string;
  regionSlug: string;
  recordType: string;
};

type GlobalStatisticSetRow = {
  commoditySlug: string;
  statisticYear: number;
  metricCode: string;
  basisCode: string;
  recordType: string;
};

type GlobalStatisticEntryRow = GlobalStatisticSetRow & {
  countryRegionSlug: string;
};

type GlobalStatisticSetSourceRow = GlobalStatisticSetRow & {
  sourceSlug: string;
  sourceRole: string;
  citationLabel: string | null;
  pageReference: string | null;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Kesalahan tidak diketahui";
}

function printValidationIssues(issues: CommodityValidationIssue[]) {
  console.error("\nDataset Commodity tidak valid:");

  for (const issue of issues) {
    console.error(
      `- ${issue.filePath} :: ${issue.path} ` +
        `[${issue.code}]: ${issue.message}`,
    );
  }
}

async function loadValidatedImport(
  manifestArgument: string,
): Promise<ValidatedCommodityImport | null> {
  const manifestPath = resolve(process.cwd(), manifestArgument);
  let manifestInput: unknown;

  try {
    const status = await lstat(manifestPath);

    if (!status.isFile()) {
      printValidationIssues([
        {
          filePath: manifestArgument,
          path: "root",
          code: "not_regular_file",
          message: "Manifest harus berupa regular file dan bukan symbolic link",
        },
      ]);
      return null;
    }

    manifestInput = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    printValidationIssues([
      {
        filePath: manifestArgument,
        path: "root",
        code: "invalid_json_or_file",
        message:
          "Manifest tidak dapat dibaca sebagai JSON valid: " +
          getErrorMessage(error),
      },
    ]);
    return null;
  }

  const manifestResult = validateCommodityManifest(
    manifestInput,
    manifestArgument,
  );

  if (!manifestResult.success) {
    printValidationIssues(manifestResult.issues);
    return null;
  }

  const manifestDirectory = dirname(manifestPath);
  const fileInputs: CommodityImportFileInput[] = [];
  const loadIssues: CommodityValidationIssue[] = [];

  for (const entry of manifestResult.data.commodityFiles) {
    const filePath = resolve(manifestDirectory, entry.filePath);

    try {
      const status = await lstat(filePath);

      if (!status.isFile()) {
        loadIssues.push({
          filePath: entry.filePath,
          path: "root",
          code: "not_regular_file",
          message: "Target harus berupa regular file dan bukan symbolic link",
        });
        continue;
      }

      fileInputs.push({
        filePath: entry.filePath,
        input: JSON.parse(await readFile(filePath, "utf8")) as unknown,
      });
    } catch (error) {
      loadIssues.push({
        filePath: entry.filePath,
        path: "root",
        code: "invalid_json_or_file",
        message: `File tidak dapat dibaca sebagai JSON valid: ${getErrorMessage(error)}`,
      });
    }
  }

  const validationResult = validateCommodityImport(
    manifestInput,
    fileInputs,
    manifestArgument,
  );

  if (loadIssues.length > 0 || !validationResult.success) {
    const unavailableFiles = new Set(
      loadIssues.map((issue) => issue.filePath),
    );
    const validationIssues = validationResult.success
      ? []
      : validationResult.issues.filter(
          (issue) =>
            issue.code !== "missing_file" ||
            !unavailableFiles.has(issue.filePath),
        );

    printValidationIssues([...loadIssues, ...validationIssues]);
    return null;
  }

  return validationResult.data;
}

async function readPreflightState() {
  const commodityRows = await sqlClient<SlugRow[]>`
    SELECT slug
    FROM public.commodities
    WHERE is_active = true;
  `;
  const unitRows = await sqlClient<CodeRow[]>`
    SELECT code
    FROM public.measurement_units
    WHERE is_active = true;
  `;
  const regionRows = await sqlClient<CommodityPreflightRegionRow[]>`
    SELECT
      id::text AS id,
      slug,
      code,
      level::text AS level,
      is_active AS "isActive"
    FROM public.regions;
  `;
  const sourceRows = await sqlClient<CommodityPreflightSourceRow[]>`
    SELECT slug, name, organization, type::text AS type, url
    FROM public.sources;
  `;
  const industryCompanyRows = await sqlClient<SlugRow[]>`
    SELECT slug
    FROM public.industry_companies
    WHERE is_active = true;
  `;
  const contentRows = await sqlClient<CommodityPreflightContentRow[]>`
    SELECT
      content.id::text AS id,
      content.slug,
      content.type::text AS type,
      linked_commodity.slug AS "linkedCommoditySlug"
    FROM public.contents AS content
    LEFT JOIN public.commodity_contents AS commodity_content
      ON commodity_content.content_id = content.id
    LEFT JOIN public.commodities AS linked_commodity
      ON linked_commodity.id = commodity_content.commodity_id
    WHERE content.module = 'commodities';
  `;
  const primaryContentRows =
    await sqlClient<CommodityPreflightPrimaryContentRow[]>`
      SELECT
        commodity.slug AS "commoditySlug",
        content.slug AS "contentSlug"
      FROM public.commodity_contents AS commodity_content
      INNER JOIN public.commodities AS commodity
        ON commodity.id = commodity_content.commodity_id
      INNER JOIN public.contents AS content
        ON content.id = commodity_content.content_id
      WHERE commodity_content.is_primary = true;
    `;

  return {
    activeCommoditySlugs: commodityRows.map((row) => row.slug),
    activeUnitCodes: unitRows.map((row) => row.code),
    regions: regionRows,
    sources: sourceRows,
    activeIndustryCompanySlugs: industryCompanyRows.map((row) => row.slug),
    commodityContents: contentRows,
    primaryContentLinks: primaryContentRows,
  };
}

async function readExistingKeys(): Promise<CommodityDryRunExistingKeys> {
  const existing = createEmptyCommodityDryRunExistingKeys();

  existing.sources = (
    await sqlClient<SlugRow[]>`SELECT slug FROM public.sources;`
  ).map((row) => row.slug);
  existing.regions = (
    await sqlClient<SlugRow[]>`SELECT slug FROM public.regions;`
  ).map((row) => row.slug);
  existing.commodities = (
    await sqlClient<SlugRow[]>`SELECT slug FROM public.commodities;`
  ).map((row) => row.slug);
  existing.contents = (
    await sqlClient<SlugRow[]>`
      SELECT slug
      FROM public.contents
      WHERE module = 'commodities';
    `
  ).map((row) => row.slug);

  existing.content_sources = (
    await sqlClient<PairRow[]>`
      SELECT content.slug AS left, source.slug AS right
      FROM public.content_sources AS content_source
      INNER JOIN public.contents AS content
        ON content.id = content_source.content_id
      INNER JOIN public.sources AS source
        ON source.id = content_source.source_id
      WHERE content.module = 'commodities';
    `
  ).map((row) => createCommodityDryRunKey(row.left, row.right));

  existing.commodity_contents = (
    await sqlClient<PairRow[]>`
      SELECT commodity.slug AS left, content.slug AS right
      FROM public.commodity_contents AS commodity_content
      INNER JOIN public.commodities AS commodity
        ON commodity.id = commodity_content.commodity_id
      INNER JOIN public.contents AS content
        ON content.id = commodity_content.content_id;
    `
  ).map((row) => createCommodityDryRunKey(row.left, row.right));

  const resourceRows = await sqlClient<ResourceStatisticRow[]>`
    SELECT
      commodity.slug AS "commoditySlug",
      statistic.statistic_year AS "statisticYear",
      statistic.statistic_type AS "statisticType",
      statistic.material_basis AS "materialBasis",
      statistic.record_type::text AS "recordType"
    FROM public.commodity_resource_statistics AS statistic
    INNER JOIN public.commodities AS commodity
      ON commodity.id = statistic.commodity_id;
  `;
  existing.commodity_resource_statistics = resourceRows.map((row) =>
    createResourceStatisticKey(
      row.commoditySlug,
      row.statisticYear,
      row.statisticType,
      row.materialBasis,
      row.recordType,
    ),
  );

  const resourceSourceRows =
    await sqlClient<ResourceStatisticSourceRow[]>`
      SELECT
        commodity.slug AS "commoditySlug",
        statistic.statistic_year AS "statisticYear",
        statistic.statistic_type AS "statisticType",
        statistic.material_basis AS "materialBasis",
        statistic.record_type::text AS "recordType",
        source.slug AS "sourceSlug",
        relation.source_role AS "sourceRole",
        relation.citation_label AS "citationLabel",
        relation.page_reference AS "pageReference"
      FROM public.commodity_resource_statistic_sources AS relation
      INNER JOIN public.commodity_resource_statistics AS statistic
        ON statistic.id = relation.resource_statistic_id
      INNER JOIN public.commodities AS commodity
        ON commodity.id = statistic.commodity_id
      INNER JOIN public.sources AS source
        ON source.id = relation.source_id;
    `;
  existing.commodity_resource_statistic_sources = resourceSourceRows.map(
    (row) =>
      createCommodityDryRunKey(
        createResourceStatisticKey(
          row.commoditySlug,
          row.statisticYear,
          row.statisticType,
          row.materialBasis,
          row.recordType,
        ),
        row.sourceSlug,
        row.sourceRole,
        row.citationLabel,
        row.pageReference,
      ),
  );

  const locationRows = await sqlClient<ProductionLocationRow[]>`
    SELECT
      commodity.slug AS "commoditySlug",
      region.slug AS "regionSlug",
      location.record_type::text AS "recordType"
    FROM public.commodity_production_locations AS location
    INNER JOIN public.commodities AS commodity
      ON commodity.id = location.commodity_id
    INNER JOIN public.regions AS region
      ON region.id = location.region_id
    WHERE location.year IS NULL;
  `;
  existing.commodity_production_locations = locationRows.map((row) =>
    createCommodityDryRunKey(
      row.commoditySlug,
      row.regionSlug,
      row.recordType,
    ),
  );

  const globalSetRows = await sqlClient<GlobalStatisticSetRow[]>`
    SELECT
      commodity.slug AS "commoditySlug",
      statistic_set.statistic_year AS "statisticYear",
      statistic_set.metric_code AS "metricCode",
      statistic_set.basis_code AS "basisCode",
      statistic_set.record_type::text AS "recordType"
    FROM public.commodity_global_statistic_sets AS statistic_set
    INNER JOIN public.commodities AS commodity
      ON commodity.id = statistic_set.commodity_id;
  `;
  existing.commodity_global_statistic_sets = globalSetRows.map((row) =>
    createGlobalStatisticSetKey(
      row.commoditySlug,
      row.statisticYear,
      row.metricCode,
      row.basisCode,
      row.recordType,
    ),
  );

  const globalEntryRows = await sqlClient<GlobalStatisticEntryRow[]>`
    SELECT
      commodity.slug AS "commoditySlug",
      statistic_set.statistic_year AS "statisticYear",
      statistic_set.metric_code AS "metricCode",
      statistic_set.basis_code AS "basisCode",
      statistic_set.record_type::text AS "recordType",
      country.slug AS "countryRegionSlug"
    FROM public.commodity_global_statistic_entries AS entry
    INNER JOIN public.commodity_global_statistic_sets AS statistic_set
      ON statistic_set.id = entry.statistic_set_id
    INNER JOIN public.commodities AS commodity
      ON commodity.id = statistic_set.commodity_id
    INNER JOIN public.regions AS country
      ON country.id = entry.country_region_id;
  `;
  existing.commodity_global_statistic_entries = globalEntryRows.map((row) =>
    createCommodityDryRunKey(
      createGlobalStatisticSetKey(
        row.commoditySlug,
        row.statisticYear,
        row.metricCode,
        row.basisCode,
        row.recordType,
      ),
      row.countryRegionSlug,
    ),
  );

  const globalSourceRows =
    await sqlClient<GlobalStatisticSetSourceRow[]>`
      SELECT
        commodity.slug AS "commoditySlug",
        statistic_set.statistic_year AS "statisticYear",
        statistic_set.metric_code AS "metricCode",
        statistic_set.basis_code AS "basisCode",
        statistic_set.record_type::text AS "recordType",
        source.slug AS "sourceSlug",
        relation.source_role AS "sourceRole",
        relation.citation_label AS "citationLabel",
        relation.page_reference AS "pageReference"
      FROM public.commodity_global_statistic_set_sources AS relation
      INNER JOIN public.commodity_global_statistic_sets AS statistic_set
        ON statistic_set.id = relation.statistic_set_id
      INNER JOIN public.commodities AS commodity
        ON commodity.id = statistic_set.commodity_id
      INNER JOIN public.sources AS source
        ON source.id = relation.source_id;
    `;
  existing.commodity_global_statistic_set_sources = globalSourceRows.map(
    (row) =>
      createCommodityDryRunKey(
        createGlobalStatisticSetKey(
          row.commoditySlug,
          row.statisticYear,
          row.metricCode,
          row.basisCode,
          row.recordType,
        ),
        row.sourceSlug,
        row.sourceRole,
        row.citationLabel,
        row.pageReference,
      ),
  );

  existing.commodity_producers = (
    await sqlClient<PairRow[]>`
      SELECT commodity.slug AS left, producer.producer_key AS right
      FROM public.commodity_producers AS producer
      INNER JOIN public.commodities AS commodity
        ON commodity.id = producer.commodity_id;
    `
  ).map((row) => createCommodityDryRunKey(row.left, row.right));

  return existing;
}

async function main() {
  const inputArgument = process.argv[2];

  if (!inputArgument) {
    throw new Error(
      "Lokasi manifest wajib diberikan. Contoh: " +
        "npm run data:dry-run:commodity -- " +
        "data/staging/commodity/manifest.json",
    );
  }

  const validatedImport = await loadValidatedImport(inputArgument);

  if (!validatedImport) {
    process.exitCode = 1;
    return;
  }

  console.log("\nMembaca master dan natural key database (read-only)...");

  const preflightState = await readPreflightState();
  const preflight = evaluateCommodityPreflight(
    collectCommodityPreflightRequirements(validatedImport),
    preflightState,
  );

  if (!preflight.passed) {
    console.error("\nDatabase preflight gagal:");

    for (const issue of preflight.issues) {
      console.error(`- [${issue.category}] ${issue.key}: ${issue.message}`);
    }

    throw new Error("Dry-run dihentikan karena database preflight gagal.");
  }

  const existingKeys = await readExistingKeys();
  const plan = createCommodityDryRunPlan(validatedImport, existingKeys);

  console.log("\nRencana upsert Commodity:");
  console.log("Table                                             Planned  Insert  Update");

  for (const table of plan.tables) {
    console.log(
      `${table.table.padEnd(49)} ` +
        `${String(table.planned).padStart(7)} ` +
        `${String(table.inserts).padStart(7)} ` +
        `${String(table.updates).padStart(7)}`,
    );
  }

  console.log("\nRingkasan:");
  console.log(`✓ Tabel tercakup : ${COMMODITY_DRY_RUN_TABLES.length}`);
  console.log(`✓ Total rencana  : ${plan.totalPlanned}`);
  console.log(`✓ Insert         : ${plan.totalInserts}`);
  console.log(`✓ Update/upsert  : ${plan.totalUpdates}`);
  console.log("✓ Delete         : 0");
  console.log("✓ Database write : 0");
  console.log(
    "\nDry-run Commodity berhasil. Tidak ada perubahan database yang dilakukan.",
  );
}

main()
  .catch((error: unknown) => {
    console.error("\nCommodity dry-run gagal:", getErrorMessage(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await sqlClient.end();
  });
