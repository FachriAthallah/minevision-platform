import { createHash } from "node:crypto";
import { lstat, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { config } from "dotenv";
import postgres from "postgres";

import {
  COMMODITY_DRY_RUN_TABLES,
  createEmptyCommodityDryRunExistingKeys,
  type CommodityDryRunTable,
} from "../src/features/data-ingestion/services/dry-run-commodity-import";
import {
  createEmptyCommodityVerificationInvalidRows,
  evaluateCommodityVerification,
  type CommodityVerificationSnapshot,
} from "../src/features/data-ingestion/services/verify-commodity-import";
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
  throw new Error("DATABASE_MIGRATION_URL tidak ditemukan di file .env.local.");
}

const sqlClient = postgres(databaseUrl, {
  ssl: "require",
  max: 1,
  prepare: false,
  connect_timeout: 10,
  idle_timeout: 20,
});

const REQUIRED_POLICIES: Record<CommodityDryRunTable, string> = {
  sources: "sources_public_read",
  regions: "regions_public_read",
  commodities: "commodities_public_read",
  contents: "contents_commodity_public_read",
  content_sources: "content_sources_commodity_public_read",
  commodity_contents: "commodity_contents_public_read",
  commodity_resource_statistics: "commodity_resource_stats_public_read",
  commodity_resource_statistic_sources:
    "commodity_resource_stat_sources_public_read",
  commodity_production_locations: "commodity_production_locations_public_read",
  commodity_global_statistic_sets: "commodity_global_sets_public_read",
  commodity_global_statistic_entries: "commodity_global_entries_public_read",
  commodity_global_statistic_set_sources:
    "commodity_global_set_sources_public_read",
  commodity_producers: "commodity_producers_public_read",
};

const NESTED_KEY_TABLES = new Set<CommodityDryRunTable>([
  "commodity_resource_statistic_sources",
  "commodity_global_statistic_entries",
  "commodity_global_statistic_set_sources",
]);

type DatabaseKeyRow = {
  tableName: string;
  key: unknown;
  invalid: boolean;
};

type CountRow = {
  count: number;
};

type RlsRow = {
  tableName: string;
  rlsEnabled: boolean;
};

type PolicyRow = {
  tableName: string;
  policyName: string;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Kesalahan tidak diketahui";
}

function isCommodityTable(value: string): value is CommodityDryRunTable {
  return (COMMODITY_DRY_RUN_TABLES as readonly string[]).includes(value);
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
      throw new Error("Manifest bukan regular file");
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
        throw new Error("Target bukan regular file");
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
        message:
          "File tidak dapat dibaca sebagai JSON valid: " +
          getErrorMessage(error),
      });
    }
  }

  const validationResult = validateCommodityImport(
    manifestInput,
    fileInputs,
    manifestArgument,
  );

  if (loadIssues.length > 0 || !validationResult.success) {
    const unavailableFiles = new Set(loadIssues.map((issue) => issue.filePath));

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

function getTargetSlugs(validatedImport: ValidatedCommodityImport) {
  return {
    commoditySlugs: validatedImport.commodityFiles.map(
      ({ data }) => data.commoditySlug,
    ),

    profileSlugs: validatedImport.commodityFiles.map(
      ({ data }) => data.profile.slug,
    ),

    sourceSlugs: validatedImport.manifest.sourceCatalog.map(
      (source) => source.slug,
    ),

    countrySlugs: validatedImport.manifest.countryCatalog.map(
      (country) => country.slug,
    ),
  };
}

function normalizeDatabaseKey(table: CommodityDryRunTable, key: unknown) {
  if (typeof key === "string") {
    return key;
  }

  if (!Array.isArray(key)) {
    throw new Error(`Natural key database tidak valid untuk tabel ${table}.`);
  }

  const normalized = [...key];

  if (NESTED_KEY_TABLES.has(table)) {
    if (!Array.isArray(normalized[0])) {
      throw new Error(`Parent natural key tidak valid untuk tabel ${table}.`);
    }

    normalized[0] = JSON.stringify(normalized[0]);
  }

  return JSON.stringify(normalized);
}

async function readDatabaseState(validatedImport: ValidatedCommodityImport) {
  const keys = createEmptyCommodityDryRunExistingKeys();

  const invalidRows = createEmptyCommodityVerificationInvalidRows();

  const { commoditySlugs, profileSlugs, sourceSlugs, countrySlugs } =
    getTargetSlugs(validatedImport);

  const rows = await sqlClient<DatabaseKeyRow[]>`
    SELECT
      'sources'::text AS "tableName",
      TO_JSONB(source.slug) AS key,
      (
        source.is_active IS NOT TRUE
        OR source.verification_status <> 'verified'
      ) AS invalid
    FROM public.sources AS source
    WHERE source.slug IN ${sqlClient(sourceSlugs)}

    UNION ALL

    SELECT
      'regions',
      TO_JSONB(region.slug),
      (
        region.is_active IS NOT TRUE
        OR region.level <> 'country'
      )
    FROM public.regions AS region
    WHERE region.slug IN ${sqlClient(countrySlugs)}

    UNION ALL

    SELECT
      'commodities',
      TO_JSONB(commodity.slug),
      (
        commodity.is_active IS NOT TRUE
        OR NULLIF(
          BTRIM(commodity.description),
          ''
        ) IS NULL
        OR NULLIF(
          BTRIM(commodity.specification),
          ''
        ) IS NULL
      )
    FROM public.commodities AS commodity
    WHERE commodity.slug IN ${sqlClient(commoditySlugs)}

    UNION ALL

    SELECT
      'contents',
      TO_JSONB(content.slug),
      (
        content.module <> 'commodities'
        OR content.type <> 'commodity_profile'
        OR content.status <> 'published'
      )
    FROM public.contents AS content
    WHERE content.module = 'commodities'
      AND content.slug IN ${sqlClient(profileSlugs)}

    UNION ALL

    SELECT
      'content_sources',
      JSONB_BUILD_ARRAY(
        content.slug,
        source.slug
      ),
      (
        content.module <> 'commodities'
        OR content.type <> 'commodity_profile'
        OR content.status <> 'published'
        OR source.is_active IS NOT TRUE
        OR source.verification_status <> 'verified'
      )
    FROM public.content_sources AS relation
    INNER JOIN public.contents AS content
      ON content.id = relation.content_id
    INNER JOIN public.sources AS source
      ON source.id = relation.source_id
    WHERE content.slug IN ${sqlClient(profileSlugs)}

    UNION ALL

    SELECT
      'commodity_contents',
      JSONB_BUILD_ARRAY(
        commodity.slug,
        content.slug
      ),
      (
        relation.is_primary IS NOT TRUE
        OR relation.display_order < 0
        OR commodity.is_active IS NOT TRUE
        OR content.module <> 'commodities'
        OR content.type <> 'commodity_profile'
        OR content.status <> 'published'
      )
    FROM public.commodity_contents AS relation
    INNER JOIN public.commodities AS commodity
      ON commodity.id = relation.commodity_id
    INNER JOIN public.contents AS content
      ON content.id = relation.content_id
    WHERE commodity.slug IN ${sqlClient(commoditySlugs)}
    OR content.slug IN ${sqlClient(profileSlugs)}

    UNION ALL

    SELECT
      'commodity_resource_statistics',
      JSONB_BUILD_ARRAY(
        commodity.slug,
        statistic.statistic_year,
        statistic.statistic_type,
        statistic.material_basis,
        statistic.record_type::text
      ),
      (
        statistic.verification_status <> 'verified'
        OR statistic.publication_status <> 'published'
        OR commodity.is_active IS NOT TRUE
        OR source.is_active IS NOT TRUE
        OR source.verification_status <> 'verified'
      )
    FROM public.commodity_resource_statistics
      AS statistic
    INNER JOIN public.commodities AS commodity
      ON commodity.id = statistic.commodity_id
    INNER JOIN public.sources AS source
      ON source.id = statistic.source_id
    WHERE commodity.slug IN ${sqlClient(commoditySlugs)}

    UNION ALL

    SELECT
      'commodity_resource_statistic_sources',
      JSONB_BUILD_ARRAY(
        JSONB_BUILD_ARRAY(
          commodity.slug,
          statistic.statistic_year,
          statistic.statistic_type,
          statistic.material_basis,
          statistic.record_type::text
        ),
        source.slug,
        relation.source_role,
        relation.citation_label,
        relation.page_reference
      ),
      (
        statistic.verification_status <> 'verified'
        OR statistic.publication_status <> 'published'
        OR commodity.is_active IS NOT TRUE
        OR source.is_active IS NOT TRUE
        OR source.verification_status <> 'verified'
      )
    FROM public.commodity_resource_statistic_sources
      AS relation
    INNER JOIN public.commodity_resource_statistics
      AS statistic
      ON statistic.id =
        relation.resource_statistic_id
    INNER JOIN public.commodities AS commodity
      ON commodity.id = statistic.commodity_id
    INNER JOIN public.sources AS source
      ON source.id = relation.source_id
    WHERE commodity.slug IN ${sqlClient(commoditySlugs)}

    UNION ALL

    SELECT
      'commodity_production_locations',
      JSONB_BUILD_ARRAY(
        commodity.slug,
        region.slug,
        location.record_type::text
      ),
      (
        location.verification_status <> 'verified'
        OR location.publication_status <> 'published'
        OR commodity.is_active IS NOT TRUE
        OR region.is_active IS NOT TRUE
        OR region.level <> 'province'
        OR source.is_active IS NOT TRUE
        OR source.verification_status <> 'verified'
      )
    FROM public.commodity_production_locations
      AS location
    INNER JOIN public.commodities AS commodity
      ON commodity.id = location.commodity_id
    INNER JOIN public.regions AS region
      ON region.id = location.region_id
    INNER JOIN public.sources AS source
      ON source.id = location.source_id
      WHERE location.year IS NULL
      AND commodity.slug IN ${sqlClient(commoditySlugs)}
      AND source.slug IN ${sqlClient(sourceSlugs)}
        
      UNION ALL

    SELECT
      'commodity_global_statistic_sets',
      JSONB_BUILD_ARRAY(
        commodity.slug,
        statistic_set.statistic_year,
        statistic_set.metric_code,
        statistic_set.basis_code,
        statistic_set.record_type::text
      ),
      (
        statistic_set.verification_status <> 'verified'
        OR statistic_set.publication_status <> 'published'
        OR commodity.is_active IS NOT TRUE
        OR (
          statistic_set.availability_status =
            'source_unavailable'
          AND statistic_set.source_id IS NOT NULL
        )
        OR (
          statistic_set.availability_status <>
            'source_unavailable'
          AND (
            source.id IS NULL
            OR source.is_active IS NOT TRUE
            OR source.verification_status <> 'verified'
          )
        )
      )
    FROM public.commodity_global_statistic_sets
      AS statistic_set
    INNER JOIN public.commodities AS commodity
      ON commodity.id = statistic_set.commodity_id
    LEFT JOIN public.sources AS source
      ON source.id = statistic_set.source_id
    WHERE commodity.slug IN ${sqlClient(commoditySlugs)}

    UNION ALL

    SELECT
      'commodity_global_statistic_entries',
      JSONB_BUILD_ARRAY(
        JSONB_BUILD_ARRAY(
          commodity.slug,
          statistic_set.statistic_year,
          statistic_set.metric_code,
          statistic_set.basis_code,
          statistic_set.record_type::text
        ),
        country.slug
      ),
      (
        statistic_set.verification_status <> 'verified'
        OR statistic_set.publication_status <> 'published'
        OR statistic_set.availability_status <>
          'reported'
        OR commodity.is_active IS NOT TRUE
        OR country.is_active IS NOT TRUE
        OR country.level <> 'country'
      )
    FROM public.commodity_global_statistic_entries
      AS entry
    INNER JOIN public.commodity_global_statistic_sets
      AS statistic_set
      ON statistic_set.id = entry.statistic_set_id
    INNER JOIN public.commodities AS commodity
      ON commodity.id = statistic_set.commodity_id
    INNER JOIN public.regions AS country
      ON country.id = entry.country_region_id
    WHERE commodity.slug IN ${sqlClient(commoditySlugs)}

    UNION ALL

    SELECT
      'commodity_global_statistic_set_sources',
      JSONB_BUILD_ARRAY(
        JSONB_BUILD_ARRAY(
          commodity.slug,
          statistic_set.statistic_year,
          statistic_set.metric_code,
          statistic_set.basis_code,
          statistic_set.record_type::text
        ),
        source.slug,
        relation.source_role,
        relation.citation_label,
        relation.page_reference
      ),
      (
        statistic_set.verification_status <> 'verified'
        OR statistic_set.publication_status <> 'published'
        OR commodity.is_active IS NOT TRUE
        OR source.is_active IS NOT TRUE
        OR source.verification_status <> 'verified'
      )
    FROM public.commodity_global_statistic_set_sources
      AS relation
    INNER JOIN public.commodity_global_statistic_sets
      AS statistic_set
      ON statistic_set.id = relation.statistic_set_id
    INNER JOIN public.commodities AS commodity
      ON commodity.id = statistic_set.commodity_id
    INNER JOIN public.sources AS source
      ON source.id = relation.source_id
    WHERE commodity.slug IN ${sqlClient(commoditySlugs)}

    UNION ALL

    SELECT
      'commodity_producers',
      JSONB_BUILD_ARRAY(
        commodity.slug,
        producer.producer_key
      ),
      (
        producer.is_active IS NOT TRUE
        OR producer.verification_status <> 'verified'
        OR producer.publication_status <> 'published'
        OR commodity.is_active IS NOT TRUE
        OR source.is_active IS NOT TRUE
        OR source.verification_status <> 'verified'
      )
    FROM public.commodity_producers AS producer
    INNER JOIN public.commodities AS commodity
      ON commodity.id = producer.commodity_id
    INNER JOIN public.sources AS source
      ON source.id = producer.source_id
    WHERE commodity.slug IN ${sqlClient(commoditySlugs)};
  `;

  for (const row of rows) {
    if (!isCommodityTable(row.tableName)) {
      throw new Error(`Nama tabel hasil query tidak dikenal: ${row.tableName}`);
    }

    const table = row.tableName;
    const mutableKeys = keys[table] as string[];

    mutableKeys.push(normalizeDatabaseKey(table, row.key));

    if (row.invalid) {
      invalidRows[table] += 1;
    }
  }

  for (const table of COMMODITY_DRY_RUN_TABLES) {
    const mutableKeys = keys[table] as string[];

    mutableKeys.sort((left, right) => left.localeCompare(right));
  }

  return {
    keys,
    invalidRows,
  };
}

async function readInvalidGlobalRankSets(
  validatedImport: ValidatedCommodityImport,
) {
  const { commoditySlugs } = getTargetSlugs(validatedImport);

  const rows = await sqlClient<CountRow[]>`
    SELECT COUNT(*)::int AS count
    FROM (
      SELECT statistic_set.id
      FROM public.commodity_global_statistic_sets
        AS statistic_set
      INNER JOIN public.commodities AS commodity
        ON commodity.id =
          statistic_set.commodity_id
      LEFT JOIN public.commodity_global_statistic_entries
        AS entry
        ON entry.statistic_set_id =
          statistic_set.id
      WHERE commodity.slug IN ${sqlClient(commoditySlugs)}
      GROUP BY
        statistic_set.id,
        statistic_set.availability_status
      HAVING
        (
          statistic_set.availability_status =
            'reported'
          AND (
            COUNT(entry.id) <> 5
            OR COUNT(
              DISTINCT entry.country_region_id
            ) <> 5
            OR COUNT(
              DISTINCT entry.rank
            ) <> 5
            OR MIN(entry.rank) <> 1
            OR MAX(entry.rank) <> 5
          )
        )
        OR (
          statistic_set.availability_status =
            'source_unavailable'
          AND COUNT(entry.id) <> 0
        )
    ) AS invalid_sets;
  `;

  return rows[0]?.count ?? 0;
}

async function readSecurityState() {
  const tableNames = [...COMMODITY_DRY_RUN_TABLES];

  const rlsRows = await sqlClient<RlsRow[]>`
    SELECT
      class.relname AS "tableName",
      class.relrowsecurity AS "rlsEnabled"
    FROM pg_catalog.pg_class AS class
    INNER JOIN pg_catalog.pg_namespace AS namespace
      ON namespace.oid = class.relnamespace
    WHERE namespace.nspname = 'public'
      AND class.relkind = 'r'
      AND class.relname IN ${sqlClient(tableNames)};
  `;

  const rlsByTable = new Map(
    rlsRows.map((row) => [row.tableName, row.rlsEnabled]),
  );

  const missingRlsTables = tableNames.filter(
    (table) => rlsByTable.get(table) !== true,
  );

  const policyRows = await sqlClient<PolicyRow[]>`
    SELECT
      tablename AS "tableName",
      policyname AS "policyName"
    FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ${sqlClient(tableNames)};
  `;

  const availablePolicies = new Set(
    policyRows.map((row) => `${row.tableName}:${row.policyName}`),
  );

  const missingPolicies = tableNames
    .filter(
      (table) => !availablePolicies.has(`${table}:${REQUIRED_POLICIES[table]}`),
    )
    .map((table) => REQUIRED_POLICIES[table]);

  return {
    missingRlsTables,
    missingPolicies,
  };
}

function createFingerprint(
  snapshot: Omit<CommodityVerificationSnapshot, "fingerprint">,
) {
  return createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
}

function printReport(report: ReturnType<typeof evaluateCommodityVerification>) {
  console.log("\nHasil verifikasi Commodity:");

  console.log(
    "Table                                             " +
      "Expected  Actual  Invalid  Result",
  );

  for (const table of report.tables) {
    console.log(
      `${table.table.padEnd(49)} ` +
        `${String(table.expected).padStart(8)} ` +
        `${String(table.actual).padStart(7)} ` +
        `${String(table.invalidRows).padStart(8)}  ` +
        `${table.passed ? "OK" : "FAIL"}`,
    );

    for (const key of table.missing) {
      console.error(`  - Missing: ${key}`);
    }

    for (const key of table.unexpected) {
      console.error(`  - Unexpected: ${key}`);
    }

    if (table.duplicates > 0) {
      console.error(`  - Duplicate natural key: ` + `${table.duplicates}`);
    }
  }

  console.log("\nRingkasan integritas:");

  console.log(`✓ Expected records : ${report.expectedTotal}`);

  console.log(`✓ Actual records   : ${report.actualTotal}`);

  console.log(
    `${report.invalidGlobalRankSets === 0 ? "✓" : "✗"} Global rank sets  : ` +
      `${report.invalidGlobalRankSets} invalid`,
  );

  console.log(
    `${report.missingRlsTables.length === 0 ? "✓" : "✗"} RLS tables        : ` +
      `${
        COMMODITY_DRY_RUN_TABLES.length - report.missingRlsTables.length
      }/${COMMODITY_DRY_RUN_TABLES.length}`,
  );

  console.log(
    `${report.missingPolicies.length === 0 ? "✓" : "✗"} Required policies : ` +
      `${
        COMMODITY_DRY_RUN_TABLES.length - report.missingPolicies.length
      }/${COMMODITY_DRY_RUN_TABLES.length}`,
  );

  console.log(`✓ Fingerprint      : ${report.fingerprint}`);

  for (const table of report.missingRlsTables) {
    console.error(
      `- RLS tidak aktif atau tabel ` + `tidak ditemukan: ${table}`,
    );
  }

  for (const policy of report.missingPolicies) {
    console.error(`- Policy tidak ditemukan: ${policy}`);
  }
}

async function main() {
  const inputArgument = process.argv[2];

  if (!inputArgument) {
    throw new Error(
      "Lokasi manifest wajib diberikan. Contoh: " +
        "npm run data:verify:commodity -- " +
        "data/staging/commodity/manifest.json",
    );
  }

  const validatedImport = await loadValidatedImport(inputArgument);

  if (!validatedImport) {
    process.exitCode = 1;
    return;
  }

  console.log("\nMembaca hasil import Commodity (read-only)...");

  const [databaseState, invalidGlobalRankSets, securityState] =
    await Promise.all([
      readDatabaseState(validatedImport),
      readInvalidGlobalRankSets(validatedImport),
      readSecurityState(),
    ]);

  const snapshotWithoutFingerprint = {
    ...databaseState,
    invalidGlobalRankSets,
    ...securityState,
  };

  const snapshot: CommodityVerificationSnapshot = {
    ...snapshotWithoutFingerprint,
    fingerprint: createFingerprint(snapshotWithoutFingerprint),
  };

  const report = evaluateCommodityVerification(validatedImport, snapshot);

  printReport(report);

  if (!report.passed) {
    throw new Error("Database belum sesuai dengan manifest Commodity.");
  }

  console.log(
    "\nVerifikasi Commodity berhasil. " +
      "Database sesuai dengan manifest dan tidak diubah.",
  );
}

main()
  .catch((error: unknown) => {
    console.error("\nCommodity verification gagal:", getErrorMessage(error));

    process.exitCode = 1;
  })
  .finally(async () => {
    await sqlClient.end();
  });
