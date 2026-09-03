import { config } from "dotenv";
import postgres from "postgres";

config({
  path: ".env.local",
});

const databaseUrl = process.env.DATABASE_MIGRATION_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_MIGRATION_URL tidak ditemukan di file .env.local.");
}

const sqlClient = postgres(databaseUrl, {
  ssl: "require",
  max: 1,
  prepare: false,
});

const requiredTables = [
  "sources",
  "content_categories",
  "contents",
  "content_sources",
  "measurement_units",
  "commodities",
  "commodity_production",
  "commodity_production_sources",
  "commodity_price_standards",
  "commodity_domestic_prices",
  "regions",
  "commodity_production_locations",
  "commodity_contents",
  "commodity_resource_statistics",
  "commodity_resource_statistic_sources",
  "commodity_global_statistic_sets",
  "commodity_global_statistic_entries",
  "commodity_global_statistic_set_sources",
  "commodity_producers",
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
  "industry_companies",
  "industry_reports",
  "industry_company_production",
  "industry_company_financials",
  "industry_operation_sites",
  "roles",
  "user_profiles",
  "user_role_assignments",
] as const;

const requiredViews = [
  "economic_gdp_annual_metrics",
  "mining_investment_annual_metrics",
  "mining_investment_annual_summary",
  "minerba_exports_annual_metrics",
  "smelter_facility_catalog",
  "smelter_summary_by_commodity",
] as const;

const requiredPolicies = [
  {
    tableName: "commodities",
    policyName: "commodities_public_read",
  },
  {
    tableName: "measurement_units",
    policyName: "measurement_units_public_read",
  },
  {
    tableName: "regions",
    policyName: "regions_public_read",
  },
  {
    tableName: "sources",
    policyName: "sources_public_read",
  },
  {
    tableName: "contents",
    policyName: "contents_commodity_public_read",
  },
  {
    tableName: "content_sources",
    policyName: "content_sources_commodity_public_read",
  },
  {
    tableName: "commodity_contents",
    policyName: "commodity_contents_public_read",
  },
  {
    tableName: "commodity_resource_statistics",
    policyName: "commodity_resource_stats_public_read",
  },
  {
    tableName: "commodity_resource_statistic_sources",
    policyName: "commodity_resource_stat_sources_public_read",
  },
  {
    tableName: "commodity_global_statistic_sets",
    policyName: "commodity_global_sets_public_read",
  },
  {
    tableName: "commodity_global_statistic_entries",
    policyName: "commodity_global_entries_public_read",
  },
  {
    tableName: "commodity_global_statistic_set_sources",
    policyName: "commodity_global_set_sources_public_read",
  },
  {
    tableName: "commodity_producers",
    policyName: "commodity_producers_public_read",
  },
  {
    tableName: "economic_gdp_annual",
    policyName: "public_read_published_verified_gdp",
  },
  {
    tableName: "economic_gdp_sources",
    policyName: "public_read_sources_of_published_gdp",
  },
  {
    tableName: "mining_investment_annual",
    policyName: "public_read_published_verified_mining_investment",
  },
  {
    tableName: "mining_investment_sources",
    policyName: "public_read_sources_of_published_mining_investment",
  },
  {
    tableName: "minerba_exports_annual",
    policyName: "public_read_published_verified_minerba_exports",
  },
  {
    tableName: "minerba_export_sources",
    policyName: "public_read_sources_of_published_minerba_exports",
  },
  {
    tableName: "smelter_operators",
    policyName: "smelter_operators_public_read",
  },
  {
    tableName: "smelter_facilities",
    policyName: "smelter_facilities_public_read",
  },
  {
    tableName: "smelter_facility_outputs",
    policyName: "smelter_facility_outputs_public_read",
  },
  {
    tableName: "smelter_facility_sources",
    policyName: "smelter_facility_sources_public_read",
  },
  {
    tableName: "industry_companies",
    policyName: "industry_companies_public_select_policy",
  },
  {
    tableName: "industry_reports",
    policyName: "industry_reports_public_select_policy",
  },
  {
    tableName: "industry_company_production",
    policyName: "industry_company_production_public_select_policy",
  },
  {
    tableName: "industry_company_financials",
    policyName: "industry_company_financials_public_select_policy",
  },
  {
    tableName: "industry_operation_sites",
    policyName: "industry_operation_sites_public_select_policy",
  },
  {
    tableName: "roles",
    policyName: "roles_authenticated_read",
  },
  {
    tableName: "user_profiles",
    policyName: "user_profiles_read_own",
  },
  {
    tableName: "user_profiles",
    policyName: "user_profiles_update_own",
  },
  {
    tableName: "user_role_assignments",
    policyName: "user_role_assignments_read_own",
  },
] as const;

const minimumMasterRecords: Record<string, number> = {
  sources: 3,
  measurement_units: 8,
  commodities: 23,
  regions: 1,
  commodity_price_standards: 6,
};

const expectedGdpYears = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
const expectedInvestmentYears = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
const expectedExportYears = [2019, 2020, 2021, 2022, 2023, 2024, 2025];

const expectedExportRecords = 49;
const expectedExportCommodities = 7;
const expectedReportedExportRecords = 35;
const expectedNotReportedExportRecords = 14;
const expectedFinalExportRecords = 35;
const expectedNonFinalExportRecords = 14;
const expectedExportSourceRecords = 54;

const expectedSmelterOperatorRecords = 8;
const expectedSmelterFacilityRecords = 9;
const expectedSmelterOutputRecords = 9;
const expectedSmelterSourceRecords = 11;
const expectedSmelterCommodityRecords = 4;
const expectedSmelterProvinceRecords = 7;
const expectedPublishedVerifiedSmelterRecords = 7;
const expectedPendingDraftSmelterRecords = 2;
const expectedSmelterTypeRecords = 6;
const expectedRefineryTypeRecords = 2;
const expectedIntegratedProcessingTypeRecords = 1;

type DatabaseTable = {
  table_name: string;
  rls_enabled: boolean;
};

type DatabaseView = {
  view_name: string;
};

type DatabasePolicy = {
  table_name: string;
  policy_name: string;
};

type CountResult = {
  total: number;
};

type AuthFoundationSummary = {
  role_count: number;
  provisioning_trigger_exists: boolean;
};

type GdpSummary = {
  total: number;
  first_year: number | null;
  last_year: number | null;
  distinct_years: number;
  available_years: number[] | null;
  invalid_status_records: number;
  invalid_record_type_records: number;
  records_without_sources: number;
  source_records: number;
  view_records: number;
};

type InvestmentSummary = {
  total: number;
  first_year: number | null;
  last_year: number | null;
  distinct_years: number;
  available_years: number[] | null;
  pma_records: number;
  pmdn_records: number;
  invalid_year_origin_pairs: number;
  invalid_status_records: number;
  invalid_data_status_records: number;
  invalid_record_type_records: number;
  records_without_sources: number;
  source_records: number;
  metrics_view_records: number;
  summary_view_records: number;
};

type ExportSummary = {
  total: number;
  first_year: number | null;
  last_year: number | null;
  distinct_years: number;
  available_years: number[] | null;
  distinct_commodities: number;
  reported_records: number;
  not_reported_records: number;
  unexpected_availability_records: number;
  invalid_reported_payload_records: number;
  invalid_not_reported_payload_records: number;
  invalid_status_records: number;
  invalid_data_status_records: number;
  invalid_record_type_records: number;
  records_without_sources: number;
  source_records: number;
  view_records: number;
};

type SmelterSummary = {
  operator_records: number;
  facility_records: number;
  output_records: number;
  source_records: number;
  catalog_records: number;
  summary_records: number;
  commodity_records: number;
  province_records: number;
  operating_facilities: number;
  active_facilities: number;
  published_verified_facilities: number;
  pending_draft_facilities: number;
  invalid_status_combinations: number;
  smelter_type_records: number;
  refinery_type_records: number;
  integrated_processing_type_records: number;
  other_type_records: number;
  facilities_without_outputs: number;
  facilities_without_sources: number;
  facilities_with_invalid_primary_outputs: number;
};

async function verifyTables() {
  const databaseTables = await sqlClient<DatabaseTable[]>`
    SELECT
      table_class.relname AS table_name,
      table_class.relrowsecurity AS rls_enabled
    FROM pg_class AS table_class
    INNER JOIN pg_namespace AS table_namespace
      ON table_namespace.oid = table_class.relnamespace
    WHERE
      table_namespace.nspname = 'public'
      AND table_class.relkind = 'r'
    ORDER BY table_class.relname;
  `;

  const tableMap = new Map(
    databaseTables.map((table) => [table.table_name, table.rls_enabled]),
  );

  let valid = true;

  console.log("\nMemeriksa tabel database:");

  for (const requiredTable of requiredTables) {
    if (!tableMap.has(requiredTable)) {
      console.error(`[FAIL] Tabel tidak ditemukan: ${requiredTable}`);
      valid = false;
      continue;
    }

    console.log(`[OK] Tabel ditemukan: ${requiredTable}`);
  }

  return {
    valid,
    tableMap,
  };
}

function verifyRls(tableMap: Map<string, boolean>) {
  let valid = true;

  console.log("\nMemeriksa Row Level Security:");

  for (const requiredTable of requiredTables) {
    const rlsEnabled = tableMap.get(requiredTable);

    if (rlsEnabled === undefined) {
      console.error(
        `[FAIL] RLS tidak dapat diperiksa karena tabel tidak ditemukan: ${requiredTable}`,
      );
      valid = false;
      continue;
    }

    if (!rlsEnabled) {
      console.error(`[FAIL] RLS belum aktif: ${requiredTable}`);
      valid = false;
      continue;
    }

    console.log(`[OK] RLS aktif: ${requiredTable}`);
  }

  return valid;
}

async function verifyViews() {
  const databaseViews = await sqlClient<DatabaseView[]>`
    SELECT
      table_name AS view_name
    FROM information_schema.views
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `;

  const viewSet = new Set(databaseViews.map((view) => view.view_name));

  let valid = true;

  console.log("\nMemeriksa database view:");

  for (const requiredView of requiredViews) {
    if (!viewSet.has(requiredView)) {
      console.error(`[FAIL] View tidak ditemukan: ${requiredView}`);
      valid = false;
      continue;
    }

    console.log(`[OK] View ditemukan: ${requiredView}`);
  }

  return {
    valid,
    viewSet,
  };
}

async function verifyPolicies() {
  const databasePolicies = await sqlClient<DatabasePolicy[]>`
    SELECT
      tablename AS table_name,
      policyname AS policy_name
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `;

  const policySet = new Set(
    databasePolicies.map(
      (policy) => `${policy.table_name}:${policy.policy_name}`,
    ),
  );

  let valid = true;

  console.log("\nMemeriksa Row Level Security policy:");

  for (const requiredPolicy of requiredPolicies) {
    const policyKey = `${requiredPolicy.tableName}:${requiredPolicy.policyName}`;

    if (!policySet.has(policyKey)) {
      console.error(
        `[FAIL] Policy tidak ditemukan: ${requiredPolicy.policyName} ` +
          `pada ${requiredPolicy.tableName}`,
      );

      valid = false;
      continue;
    }

    console.log(
      `[OK] Policy ditemukan: ${requiredPolicy.policyName} ` +
        `pada ${requiredPolicy.tableName}`,
    );
  }

  return valid;
}

async function verifyMasterRecords(tableMap: Map<string, boolean>) {
  let valid = true;

  console.log("\nMemeriksa master data:");

  for (const [tableName, minimumRecords] of Object.entries(
    minimumMasterRecords,
  )) {
    if (!tableMap.has(tableName)) {
      console.error(`[FAIL] Jumlah record tidak dapat diperiksa: ${tableName}`);

      valid = false;
      continue;
    }

    /*
     * Nama tabel berasal dari constant internal aplikasi,
     * bukan dari input pengguna.
     */
    const result = await sqlClient.unsafe<CountResult[]>(
      `
        SELECT COUNT(*)::integer AS total
        FROM public."${tableName}";
      `,
    );

    const total = result[0]?.total ?? 0;

    if (total < minimumRecords) {
      console.error(
        `[FAIL] ${tableName}: ${total} record, ` + `minimal ${minimumRecords}`,
      );

      valid = false;
      continue;
    }

    console.log(
      `[OK] ${tableName}: ${total} record, minimal ${minimumRecords}`,
    );
  }

  return valid;
}

async function verifyGdpData(
  tableMap: Map<string, boolean>,
  viewSet: Set<string>,
) {
  console.log("\nMemeriksa data PDB pertambangan:");

  if (
    !tableMap.has("economic_gdp_annual") ||
    !tableMap.has("economic_gdp_sources") ||
    !viewSet.has("economic_gdp_annual_metrics")
  ) {
    console.error(
      "[FAIL] Pemeriksaan data PDB tidak dapat dilakukan karena " +
        "tabel atau view belum lengkap.",
    );

    return false;
  }

  const result = await sqlClient<GdpSummary[]>`
    SELECT
      COUNT(*)::integer AS total,
      MIN(gdp.year)::integer AS first_year,
      MAX(gdp.year)::integer AS last_year,
      COUNT(DISTINCT gdp.year)::integer AS distinct_years,
      ARRAY_AGG(gdp.year::integer ORDER BY gdp.year)
        AS available_years,

      COUNT(*) FILTER (
        WHERE
          gdp.verification_status <> 'verified'
          OR gdp.publication_status <> 'published'
      )::integer AS invalid_status_records,

      COUNT(*) FILTER (
        WHERE gdp.record_type <> 'actual'
      )::integer AS invalid_record_type_records,

      COUNT(*) FILTER (
        WHERE NOT EXISTS (
          SELECT 1
          FROM public.economic_gdp_sources AS gdp_source
          WHERE gdp_source.economic_gdp_id = gdp.id
        )
      )::integer AS records_without_sources,

      (
        SELECT COUNT(*)::integer
        FROM public.economic_gdp_sources
      ) AS source_records,

      (
        SELECT COUNT(*)::integer
        FROM public.economic_gdp_annual_metrics
      ) AS view_records

    FROM public.economic_gdp_annual AS gdp;
  `;

  const summary = result[0];

  if (!summary) {
    console.error("[FAIL] Ringkasan data PDB tidak ditemukan.");
    return false;
  }

  let valid = true;

  if (summary.total !== expectedGdpYears.length) {
    console.error(
      `[FAIL] economic_gdp_annual: ${summary.total} record, ` +
        `diharapkan ${expectedGdpYears.length}`,
    );

    valid = false;
  } else {
    console.log(`[OK] economic_gdp_annual: ${summary.total} record`);
  }

  if (
    summary.first_year !== expectedGdpYears[0] ||
    summary.last_year !== expectedGdpYears.at(-1) ||
    summary.distinct_years !== expectedGdpYears.length
  ) {
    console.error(
      `[FAIL] Rentang tahun PDB tidak lengkap: ` +
        `${summary.first_year ?? "null"}–${summary.last_year ?? "null"}, ` +
        `${summary.distinct_years} tahun berbeda`,
    );

    valid = false;
  } else {
    console.log("[OK] Rentang tahun PDB lengkap: 2019–2025");
  }

  const availableYears = summary.available_years ?? [];

  if (JSON.stringify(availableYears) !== JSON.stringify(expectedGdpYears)) {
    console.error(
      `[FAIL] Tahun PDB tidak sesuai: ${availableYears.join(", ")}`,
    );

    valid = false;
  } else {
    console.log(`[OK] Tahun PDB tersedia: ${availableYears.join(", ")}`);
  }

  if (summary.invalid_status_records > 0) {
    console.error(
      `[FAIL] ${summary.invalid_status_records} record PDB ` +
        "belum verified dan published",
    );

    valid = false;
  } else {
    console.log("[OK] Seluruh data PDB verified dan published");
  }

  if (summary.invalid_record_type_records > 0) {
    console.error(
      `[FAIL] ${summary.invalid_record_type_records} record PDB ` +
        "bukan actual",
    );

    valid = false;
  } else {
    console.log("[OK] Seluruh data PDB bertipe actual");
  }

  if (summary.records_without_sources > 0) {
    console.error(
      `[FAIL] ${summary.records_without_sources} record PDB ` +
        "tidak memiliki sumber",
    );

    valid = false;
  } else {
    console.log("[OK] Seluruh record PDB memiliki sumber");
  }

  if (summary.source_records < expectedGdpYears.length) {
    console.error(
      `[FAIL] economic_gdp_sources: ${summary.source_records} record, ` +
        `minimal ${expectedGdpYears.length}`,
    );

    valid = false;
  } else {
    console.log(`[OK] economic_gdp_sources: ${summary.source_records} record`);
  }

  if (summary.view_records !== summary.total) {
    console.error(
      `[FAIL] View PDB menghasilkan ${summary.view_records} record, ` +
        `diharapkan ${summary.total}`,
    );

    valid = false;
  } else {
    console.log(
      `[OK] economic_gdp_annual_metrics: ` + `${summary.view_records} record`,
    );
  }

  return valid;
}

async function verifyInvestmentData(
  tableMap: Map<string, boolean>,
  viewSet: Set<string>,
) {
  console.log("\nMemeriksa data investasi pertambangan:");

  if (
    !tableMap.has("mining_investment_annual") ||
    !tableMap.has("mining_investment_sources") ||
    !viewSet.has("mining_investment_annual_metrics") ||
    !viewSet.has("mining_investment_annual_summary")
  ) {
    console.error(
      "[FAIL] Pemeriksaan investasi tidak dapat dilakukan karena " +
        "tabel atau view belum lengkap.",
    );

    return false;
  }

  const result = await sqlClient<InvestmentSummary[]>`
    SELECT
      COUNT(*)::integer AS total,

      MIN(investment.year)::integer
        AS first_year,

      MAX(investment.year)::integer
        AS last_year,

      COUNT(DISTINCT investment.year)::integer
        AS distinct_years,

      ARRAY_AGG(
        DISTINCT investment.year::integer
        ORDER BY investment.year::integer
      ) AS available_years,

      COUNT(*) FILTER (
        WHERE investment.investment_origin = 'pma'
      )::integer AS pma_records,

      COUNT(*) FILTER (
        WHERE investment.investment_origin = 'pmdn'
      )::integer AS pmdn_records,

      (
        SELECT COUNT(*)::integer
        FROM (
          SELECT investment_pair.year
          FROM public.mining_investment_annual AS investment_pair
          GROUP BY investment_pair.year
          HAVING
            COUNT(*) FILTER (
              WHERE investment_pair.investment_origin = 'pma'
            ) <> 1
            OR COUNT(*) FILTER (
              WHERE investment_pair.investment_origin = 'pmdn'
            ) <> 1
        ) AS invalid_pairs
      ) AS invalid_year_origin_pairs,

      COUNT(*) FILTER (
        WHERE
          investment.verification_status <> 'pending'
          OR investment.publication_status <> 'draft'
      )::integer AS invalid_status_records,

      COUNT(*) FILTER (
        WHERE investment.data_status <> 'final'
      )::integer AS invalid_data_status_records,

      COUNT(*) FILTER (
        WHERE investment.record_type <> 'actual'
      )::integer AS invalid_record_type_records,

      COUNT(*) FILTER (
        WHERE NOT EXISTS (
          SELECT 1
          FROM public.mining_investment_sources
            AS investment_source
          WHERE
            investment_source.mining_investment_id =
              investment.id
        )
      )::integer AS records_without_sources,

      (
        SELECT COUNT(*)::integer
        FROM public.mining_investment_sources
      ) AS source_records,

      (
        SELECT COUNT(*)::integer
        FROM public.mining_investment_annual_metrics
      ) AS metrics_view_records,

      (
        SELECT COUNT(*)::integer
        FROM public.mining_investment_annual_summary
      ) AS summary_view_records

    FROM public.mining_investment_annual AS investment;
  `;

  const summary = result[0];

  if (!summary) {
    console.error("[FAIL] Ringkasan data investasi tidak ditemukan.");

    return false;
  }

  let valid = true;
  const expectedAnnualRecords = expectedInvestmentYears.length * 2;

  if (summary.total !== expectedAnnualRecords) {
    console.error(
      `[FAIL] mining_investment_annual: ${summary.total} record, ` +
        `diharapkan ${expectedAnnualRecords}`,
    );

    valid = false;
  } else {
    console.log(`[OK] mining_investment_annual: ${summary.total} record`);
  }

  if (
    summary.first_year !== expectedInvestmentYears[0] ||
    summary.last_year !== expectedInvestmentYears.at(-1) ||
    summary.distinct_years !== expectedInvestmentYears.length
  ) {
    console.error(
      `[FAIL] Rentang tahun investasi tidak lengkap: ` +
        `${summary.first_year ?? "null"}-` +
        `${summary.last_year ?? "null"}, ` +
        `${summary.distinct_years} tahun berbeda`,
    );

    valid = false;
  } else {
    console.log("[OK] Rentang tahun investasi lengkap: 2019-2025");
  }

  const availableYears = summary.available_years ?? [];

  if (
    JSON.stringify(availableYears) !== JSON.stringify(expectedInvestmentYears)
  ) {
    console.error(
      `[FAIL] Tahun investasi tidak sesuai: ` + `${availableYears.join(", ")}`,
    );

    valid = false;
  } else {
    console.log(
      `[OK] Tahun investasi tersedia: ` + `${availableYears.join(", ")}`,
    );
  }

  if (
    summary.pma_records !== expectedInvestmentYears.length ||
    summary.pmdn_records !== expectedInvestmentYears.length
  ) {
    console.error(
      `[FAIL] Komposisi investasi tidak lengkap: ` +
        `PMA ${summary.pma_records}, ` +
        `PMDN ${summary.pmdn_records}`,
    );

    valid = false;
  } else {
    console.log(
      `[OK] Komposisi investasi lengkap: ` +
        `PMA ${summary.pma_records}, ` +
        `PMDN ${summary.pmdn_records}`,
    );
  }

  if (summary.invalid_year_origin_pairs > 0) {
    console.error(
      `[FAIL] ${summary.invalid_year_origin_pairs} tahun ` +
        "tidak memiliki tepat satu record PMA dan PMDN",
    );

    valid = false;
  } else {
    console.log("[OK] Setiap tahun memiliki satu record PMA dan PMDN");
  }

  if (summary.invalid_status_records > 0) {
    console.error(
      `[FAIL] ${summary.invalid_status_records} record investasi ` +
        "tidak berstatus pending dan draft",
    );

    valid = false;
  } else {
    console.log("[OK] Seluruh data investasi masih pending dan draft");
  }

  if (summary.invalid_data_status_records > 0) {
    console.error(
      `[FAIL] ${summary.invalid_data_status_records} record ` +
        "investasi bukan data final",
    );

    valid = false;
  } else {
    console.log("[OK] Seluruh data investasi berstatus data final");
  }

  if (summary.invalid_record_type_records > 0) {
    console.error(
      `[FAIL] ${summary.invalid_record_type_records} record ` +
        "investasi bukan actual",
    );

    valid = false;
  } else {
    console.log("[OK] Seluruh data investasi bertipe actual");
  }

  if (summary.records_without_sources > 0) {
    console.error(
      `[FAIL] ${summary.records_without_sources} record investasi ` +
        "tidak memiliki sumber",
    );

    valid = false;
  } else {
    console.log("[OK] Seluruh record investasi memiliki sumber");
  }

  if (summary.source_records !== expectedAnnualRecords) {
    console.error(
      `[FAIL] mining_investment_sources: ` +
        `${summary.source_records} record, ` +
        `diharapkan ${expectedAnnualRecords}`,
    );

    valid = false;
  } else {
    console.log(
      `[OK] mining_investment_sources: ` + `${summary.source_records} record`,
    );
  }

  if (summary.metrics_view_records !== expectedAnnualRecords) {
    console.error(
      `[FAIL] mining_investment_annual_metrics: ` +
        `${summary.metrics_view_records} record, ` +
        `diharapkan ${expectedAnnualRecords}`,
    );

    valid = false;
  } else {
    console.log(
      `[OK] mining_investment_annual_metrics: ` +
        `${summary.metrics_view_records} record`,
    );
  }

  if (summary.summary_view_records !== expectedInvestmentYears.length) {
    console.error(
      `[FAIL] mining_investment_annual_summary: ` +
        `${summary.summary_view_records} record, ` +
        `diharapkan ${expectedInvestmentYears.length}`,
    );

    valid = false;
  } else {
    console.log(
      `[OK] mining_investment_annual_summary: ` +
        `${summary.summary_view_records} record`,
    );
  }

  return valid;
}

async function verifyExportData(
  tableMap: Map<string, boolean>,
  viewSet: Set<string>,
) {
  console.log("\nMemeriksa data ekspor minerba:");

  if (
    !tableMap.has("minerba_exports_annual") ||
    !tableMap.has("minerba_export_sources") ||
    !viewSet.has("minerba_exports_annual_metrics")
  ) {
    console.error(
      "[FAIL] Pemeriksaan ekspor tidak dapat dilakukan karena " +
        "tabel atau view belum lengkap.",
    );

    return false;
  }

  const result = await sqlClient<ExportSummary[]>`
    SELECT
      COUNT(*)::integer AS total,

      MIN(export_record.year)::integer
        AS first_year,

      MAX(export_record.year)::integer
        AS last_year,

      COUNT(DISTINCT export_record.year)::integer
        AS distinct_years,

      ARRAY_AGG(
        DISTINCT export_record.year::integer
        ORDER BY export_record.year::integer
      ) AS available_years,

      COUNT(DISTINCT export_record.commodity_id)::integer
        AS distinct_commodities,

      COUNT(*) FILTER (
        WHERE export_record.data_availability = 'reported'
      )::integer AS reported_records,

      COUNT(*) FILTER (
        WHERE export_record.data_availability = 'not_reported'
      )::integer AS not_reported_records,

      COUNT(*) FILTER (
        WHERE export_record.data_availability NOT IN (
          'reported',
          'not_reported'
        )
      )::integer AS unexpected_availability_records,

      COUNT(*) FILTER (
        WHERE
          export_record.data_availability = 'reported'
          AND (
            export_record.destination_region_id IS NULL
            OR export_record.export_volume IS NULL
            OR export_record.volume_unit_code IS NULL
            OR export_record.volume_scale IS NULL
            OR export_record.fob_value IS NULL
            OR export_record.fob_value_scale IS NULL
          )
      )::integer AS invalid_reported_payload_records,

      COUNT(*) FILTER (
        WHERE
          export_record.data_availability = 'not_reported'
          AND (
            export_record.destination_region_id IS NOT NULL
            OR export_record.export_volume IS NOT NULL
            OR export_record.volume_unit_code IS NOT NULL
            OR export_record.volume_scale IS NOT NULL
            OR export_record.fob_value IS NOT NULL
            OR export_record.fob_value_scale IS NOT NULL
          )
      )::integer AS invalid_not_reported_payload_records,

      COUNT(*) FILTER (
        WHERE
          export_record.verification_status <> 'pending'
          OR export_record.publication_status <> 'draft'
      )::integer AS invalid_status_records,

      COUNT(*) FILTER (
        WHERE export_record.data_status <> 'final'
      )::integer AS invalid_data_status_records,

      COUNT(*) FILTER (
        WHERE export_record.record_type <> 'actual'
      )::integer AS invalid_record_type_records,

      COUNT(*) FILTER (
        WHERE NOT EXISTS (
          SELECT 1
          FROM public.minerba_export_sources AS export_source
          WHERE
            export_source.minerba_export_id =
              export_record.id
        )
      )::integer AS records_without_sources,

      (
        SELECT COUNT(*)::integer
        FROM public.minerba_export_sources
      ) AS source_records,

      (
        SELECT COUNT(*)::integer
        FROM public.minerba_exports_annual_metrics
      ) AS view_records

    FROM public.minerba_exports_annual AS export_record;
  `;

  const summary = result[0];

  if (!summary) {
    console.error("[FAIL] Ringkasan data ekspor minerba tidak ditemukan.");

    return false;
  }

  let valid = true;

  if (summary.total !== expectedExportRecords) {
    console.error(
      `[FAIL] minerba_exports_annual: ${summary.total} record, ` +
        `diharapkan ${expectedExportRecords}`,
    );

    valid = false;
  } else {
    console.log(`[OK] minerba_exports_annual: ${summary.total} record`);
  }

  if (
    summary.first_year !== expectedExportYears[0] ||
    summary.last_year !== expectedExportYears.at(-1) ||
    summary.distinct_years !== expectedExportYears.length
  ) {
    console.error(
      `[FAIL] Rentang tahun ekspor tidak lengkap: ` +
        `${summary.first_year ?? "null"}-` +
        `${summary.last_year ?? "null"}, ` +
        `${summary.distinct_years} tahun berbeda`,
    );

    valid = false;
  } else {
    console.log("[OK] Rentang tahun ekspor lengkap: 2019-2025");
  }

  const availableYears = summary.available_years ?? [];

  if (JSON.stringify(availableYears) !== JSON.stringify(expectedExportYears)) {
    console.error(
      `[FAIL] Tahun ekspor tidak sesuai: ` + `${availableYears.join(", ")}`,
    );

    valid = false;
  } else {
    console.log(
      `[OK] Tahun ekspor tersedia: ` + `${availableYears.join(", ")}`,
    );
  }

  if (summary.distinct_commodities !== expectedExportCommodities) {
    console.error(
      `[FAIL] Komoditas ekspor: ` +
        `${summary.distinct_commodities}, ` +
        `diharapkan ${expectedExportCommodities}`,
    );

    valid = false;
  } else {
    console.log(
      `[OK] Komoditas ekspor: ` + `${summary.distinct_commodities} komoditas`,
    );
  }

  if (summary.reported_records !== expectedReportedExportRecords) {
    console.error(
      `[FAIL] Data ekspor reported: ` +
        `${summary.reported_records} record, ` +
        `diharapkan ${expectedReportedExportRecords}`,
    );

    valid = false;
  } else {
    console.log(
      `[OK] Data ekspor reported: ` + `${summary.reported_records} record`,
    );
  }

  if (summary.not_reported_records !== expectedNotReportedExportRecords) {
    console.error(
      `[FAIL] Data ekspor not_reported: ` +
        `${summary.not_reported_records} record, ` +
        `diharapkan ${expectedNotReportedExportRecords}`,
    );

    valid = false;
  } else {
    console.log(
      `[OK] Data ekspor not_reported: ` +
        `${summary.not_reported_records} record`,
    );
  }

  if (summary.unexpected_availability_records > 0) {
    console.error(
      `[FAIL] ${summary.unexpected_availability_records} record ` +
        "memiliki data_availability yang tidak diharapkan",
    );

    valid = false;
  } else {
    console.log("[OK] Seluruh status ketersediaan ekspor sesuai");
  }

  if (summary.invalid_reported_payload_records > 0) {
    console.error(
      `[FAIL] ${summary.invalid_reported_payload_records} record ` +
        "reported tidak memiliki payload lengkap",
    );

    valid = false;
  } else {
    console.log("[OK] Seluruh record reported memiliki payload lengkap");
  }

  if (summary.invalid_not_reported_payload_records > 0) {
    console.error(
      `[FAIL] ${summary.invalid_not_reported_payload_records} ` +
        "record not_reported masih memiliki payload ekspor",
    );

    valid = false;
  } else {
    console.log("[OK] Seluruh record not_reported tidak memiliki payload");
  }

  if (summary.invalid_status_records > 0) {
    console.error(
      `[FAIL] ${summary.invalid_status_records} record ekspor ` +
        "tidak berstatus pending dan draft",
    );

    valid = false;
  } else {
    console.log("[OK] Seluruh data ekspor masih pending dan draft");
  }

  if (summary.invalid_data_status_records !== expectedNonFinalExportRecords) {
    console.error(
      "[FAIL] Jumlah data ekspor non-final tidak sesuai: " +
        `${summary.invalid_data_status_records} record, ` +
        `diharapkan ${expectedNonFinalExportRecords}`,
    );

    valid = false;
  } else {
    console.log(
      "[OK] Status data ekspor sesuai: " +
        `${expectedFinalExportRecords} final, ` +
        `${expectedNonFinalExportRecords} non-final`,
    );
  }

  if (summary.invalid_record_type_records > 0) {
    console.error(
      `[FAIL] ${summary.invalid_record_type_records} record ` +
        "ekspor bukan actual",
    );

    valid = false;
  } else {
    console.log("[OK] Seluruh data ekspor bertipe actual");
  }

  if (summary.records_without_sources > 0) {
    console.error(
      `[FAIL] ${summary.records_without_sources} record ekspor ` +
        "tidak memiliki sumber",
    );

    valid = false;
  } else {
    console.log("[OK] Seluruh record ekspor memiliki sumber");
  }

  if (summary.source_records !== expectedExportSourceRecords) {
    console.error(
      `[FAIL] minerba_export_sources: ${summary.source_records} record, ` +
        `diharapkan ${expectedExportSourceRecords}`,
    );

    valid = false;
  } else {
    console.log(
      `[OK] minerba_export_sources: ${summary.source_records} record`,
    );
  }

  if (summary.view_records !== expectedExportRecords) {
    console.error(
      `[FAIL] minerba_exports_annual_metrics: ` +
        `${summary.view_records} record, ` +
        `diharapkan ${expectedExportRecords}`,
    );

    valid = false;
  } else {
    console.log(
      `[OK] minerba_exports_annual_metrics: ` +
        `${summary.view_records} record`,
    );
  }

  return valid;
}

async function verifySmelterData(
  tableMap: Map<string, boolean>,
  viewSet: Set<string>,
) {
  const requiredSmelterTables = [
    "smelter_operators",
    "smelter_facilities",
    "smelter_facility_outputs",
    "smelter_facility_sources",
  ];

  const requiredSmelterViews = [
    "smelter_facility_catalog",
    "smelter_summary_by_commodity",
  ];

  if (
    requiredSmelterTables.some((tableName) => !tableMap.has(tableName)) ||
    requiredSmelterViews.some((viewName) => !viewSet.has(viewName))
  ) {
    console.error(
      "\n[FAIL] Verifikasi data smelter dilewati karena tabel atau view " +
        "smelter belum lengkap.",
    );

    return false;
  }

  const [summary] = await sqlClient<SmelterSummary[]>`
    SELECT
      (
        SELECT COUNT(*)::integer
        FROM public.smelter_operators
      ) AS operator_records,
      COUNT(*)::integer AS facility_records,
      (
        SELECT COUNT(*)::integer
        FROM public.smelter_facility_outputs
      ) AS output_records,
      (
        SELECT COUNT(*)::integer
        FROM public.smelter_facility_sources
      ) AS source_records,
      (
        SELECT COUNT(*)::integer
        FROM public.smelter_facility_catalog
      ) AS catalog_records,
      (
        SELECT COUNT(*)::integer
        FROM public.smelter_summary_by_commodity
      ) AS summary_records,
      (
        SELECT COUNT(DISTINCT facility_output.commodity_id)::integer
        FROM public.smelter_facility_outputs AS facility_output
      ) AS commodity_records,
      COUNT(DISTINCT facility.province_region_id)::integer
        AS province_records,
      (
        COUNT(*) FILTER (
          WHERE facility.current_status = 'operating'
        )
      )::integer AS operating_facilities,
      (
        COUNT(*) FILTER (
          WHERE facility.is_active = true
        )
      )::integer AS active_facilities,
      (
        COUNT(*) FILTER (
          WHERE
            facility.verification_status = 'verified'
            AND facility.publication_status = 'published'
            AND facility.is_active = true
        )
      )::integer AS published_verified_facilities,
      (
        COUNT(*) FILTER (
          WHERE
            facility.verification_status = 'pending'
            AND facility.publication_status = 'draft'
            AND facility.is_active = true
        )
      )::integer AS pending_draft_facilities,
      (
        COUNT(*) FILTER (
          WHERE NOT (
            (
              facility.verification_status = 'verified'
              AND facility.publication_status = 'published'
              AND facility.is_active = true
            )
            OR
            (
              facility.verification_status = 'pending'
              AND facility.publication_status = 'draft'
              AND facility.is_active = true
            )
          )
        )
      )::integer AS invalid_status_combinations,
      (
        COUNT(*) FILTER (
          WHERE facility.facility_type = 'smelter'
        )
      )::integer AS smelter_type_records,
      (
        COUNT(*) FILTER (
          WHERE facility.facility_type = 'refinery'
        )
      )::integer AS refinery_type_records,
      (
        COUNT(*) FILTER (
          WHERE facility.facility_type = 'integrated_processing'
        )
      )::integer AS integrated_processing_type_records,
      (
        COUNT(*) FILTER (
          WHERE facility.facility_type = 'other'
        )
      )::integer AS other_type_records,
      (
        COUNT(*) FILTER (
          WHERE NOT EXISTS (
            SELECT 1
            FROM public.smelter_facility_outputs AS facility_output
            WHERE facility_output.facility_id = facility.id
          )
        )
      )::integer AS facilities_without_outputs,
      (
        COUNT(*) FILTER (
          WHERE NOT EXISTS (
            SELECT 1
            FROM public.smelter_facility_sources AS facility_source
            WHERE facility_source.facility_id = facility.id
          )
        )
      )::integer AS facilities_without_sources,
      (
        SELECT COUNT(*)::integer
        FROM (
          SELECT checked_facility.id
          FROM public.smelter_facilities AS checked_facility
          LEFT JOIN public.smelter_facility_outputs AS checked_output
            ON checked_output.facility_id = checked_facility.id
          GROUP BY checked_facility.id
          HAVING
            COUNT(*) FILTER (
              WHERE checked_output.is_primary = true
            ) <> 1
        ) AS invalid_primary_output
      ) AS facilities_with_invalid_primary_outputs
    FROM public.smelter_facilities AS facility;
  `;

  if (!summary) {
    console.error("\n[FAIL] Ringkasan data smelter tidak tersedia.");

    return false;
  }

  let valid = true;

  console.log("\nMemeriksa data fasilitas smelter:");

  if (summary.operator_records !== expectedSmelterOperatorRecords) {
    console.error(
      `[FAIL] smelter_operators: ${summary.operator_records} record, ` +
        `diharapkan ${expectedSmelterOperatorRecords}`,
    );

    valid = false;
  } else {
    console.log(`[OK] smelter_operators: ${summary.operator_records} record`);
  }

  if (summary.facility_records !== expectedSmelterFacilityRecords) {
    console.error(
      `[FAIL] smelter_facilities: ${summary.facility_records} record, ` +
        `diharapkan ${expectedSmelterFacilityRecords}`,
    );

    valid = false;
  } else {
    console.log(`[OK] smelter_facilities: ${summary.facility_records} record`);
  }

  if (summary.output_records !== expectedSmelterOutputRecords) {
    console.error(
      `[FAIL] smelter_facility_outputs: ${summary.output_records} record, ` +
        `diharapkan ${expectedSmelterOutputRecords}`,
    );

    valid = false;
  } else {
    console.log(
      `[OK] smelter_facility_outputs: ${summary.output_records} record`,
    );
  }

  if (summary.source_records !== expectedSmelterSourceRecords) {
    console.error(
      `[FAIL] smelter_facility_sources: ${summary.source_records} record, ` +
        `diharapkan ${expectedSmelterSourceRecords}`,
    );

    valid = false;
  } else {
    console.log(
      `[OK] smelter_facility_sources: ${summary.source_records} record`,
    );
  }

  if (summary.catalog_records !== expectedSmelterFacilityRecords) {
    console.error(
      `[FAIL] smelter_facility_catalog: ${summary.catalog_records} record, ` +
        `diharapkan ${expectedSmelterFacilityRecords}`,
    );

    valid = false;
  } else {
    console.log(
      `[OK] smelter_facility_catalog: ${summary.catalog_records} record`,
    );
  }

  if (summary.summary_records !== expectedSmelterCommodityRecords) {
    console.error(
      `[FAIL] smelter_summary_by_commodity: ${summary.summary_records} ` +
        `record, diharapkan ${expectedSmelterCommodityRecords}`,
    );

    valid = false;
  } else {
    console.log(
      `[OK] smelter_summary_by_commodity: ${summary.summary_records} record`,
    );
  }

  if (summary.commodity_records !== expectedSmelterCommodityRecords) {
    console.error(
      `[FAIL] Komoditas smelter: ${summary.commodity_records}, ` +
        `diharapkan ${expectedSmelterCommodityRecords}`,
    );

    valid = false;
  } else {
    console.log(`[OK] Komoditas smelter: ${summary.commodity_records}`);
  }

  if (summary.province_records !== expectedSmelterProvinceRecords) {
    console.error(
      `[FAIL] Provinsi fasilitas smelter: ${summary.province_records}, ` +
        `diharapkan ${expectedSmelterProvinceRecords}`,
    );

    valid = false;
  } else {
    console.log(`[OK] Provinsi fasilitas smelter: ${summary.province_records}`);
  }

  if (summary.operating_facilities !== expectedSmelterFacilityRecords) {
    console.error(
      `[FAIL] Fasilitas berstatus operating: ` +
        `${summary.operating_facilities}, ` +
        `diharapkan ${expectedSmelterFacilityRecords}`,
    );

    valid = false;
  } else {
    console.log(
      `[OK] Seluruh ${summary.operating_facilities} fasilitas ` +
        "berstatus operating",
    );
  }

  if (summary.active_facilities !== expectedSmelterFacilityRecords) {
    console.error(
      `[FAIL] Fasilitas aktif: ${summary.active_facilities}, ` +
        `diharapkan ${expectedSmelterFacilityRecords}`,
    );

    valid = false;
  } else {
    console.log("[OK] Seluruh fasilitas smelter aktif");
  }

  if (
    summary.published_verified_facilities !==
      expectedPublishedVerifiedSmelterRecords ||
    summary.pending_draft_facilities !== expectedPendingDraftSmelterRecords ||
    summary.invalid_status_combinations > 0
  ) {
    console.error(
      "[FAIL] Distribusi status fasilitas smelter tidak sesuai: " +
        `${summary.published_verified_facilities} verified/published, ` +
        `${summary.pending_draft_facilities} pending/draft, ` +
        `${summary.invalid_status_combinations} kombinasi tidak valid`,
    );

    valid = false;
  } else {
    console.log(
      "[OK] Status fasilitas sesuai: " +
        `${expectedPublishedVerifiedSmelterRecords} verified/published, ` +
        `${expectedPendingDraftSmelterRecords} pending/draft`,
    );
  }

  if (
    summary.smelter_type_records !== expectedSmelterTypeRecords ||
    summary.refinery_type_records !== expectedRefineryTypeRecords ||
    summary.integrated_processing_type_records !==
      expectedIntegratedProcessingTypeRecords ||
    summary.other_type_records !== 0
  ) {
    console.error(
      "[FAIL] Distribusi tipe fasilitas tidak sesuai: " +
        `${summary.smelter_type_records} smelter, ` +
        `${summary.refinery_type_records} refinery, ` +
        `${summary.integrated_processing_type_records} integrated_processing, ` +
        `${summary.other_type_records} other`,
    );

    valid = false;
  } else {
    console.log(
      "[OK] Tipe fasilitas sesuai: " +
        `${expectedSmelterTypeRecords} smelter, ` +
        `${expectedRefineryTypeRecords} refinery, ` +
        `${expectedIntegratedProcessingTypeRecords} integrated_processing`,
    );
  }

  if (summary.facilities_without_outputs > 0) {
    console.error(
      `[FAIL] ${summary.facilities_without_outputs} fasilitas ` +
        "tidak memiliki output",
    );

    valid = false;
  } else {
    console.log("[OK] Seluruh fasilitas memiliki output");
  }

  if (summary.facilities_without_sources > 0) {
    console.error(
      `[FAIL] ${summary.facilities_without_sources} fasilitas ` +
        "tidak memiliki sumber",
    );

    valid = false;
  } else {
    console.log("[OK] Seluruh fasilitas memiliki sumber");
  }

  if (summary.facilities_with_invalid_primary_outputs > 0) {
    console.error(
      `[FAIL] ${summary.facilities_with_invalid_primary_outputs} fasilitas ` +
        "tidak memiliki tepat satu output utama",
    );

    valid = false;
  } else {
    console.log("[OK] Setiap fasilitas memiliki tepat satu output utama");
  }

  return valid;
}

async function verifyAuthFoundation() {
  console.log("\nMemeriksa authentication foundation:");

  const summaries = await sqlClient<AuthFoundationSummary[]>`
    SELECT
      (SELECT COUNT(*)::int FROM public.roles) AS role_count,
      EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE
          tgname = 'on_auth_user_created'
          AND tgrelid = 'auth.users'::regclass
          AND NOT tgisinternal
      ) AS provisioning_trigger_exists;
  `;

  const summary = summaries[0];

  if (!summary || summary.role_count < 6) {
    console.error("[FAIL] Role minimum MineVision belum tersedia");
    return false;
  }

  if (!summary.provisioning_trigger_exists) {
    console.error("[FAIL] Trigger provisioning auth user tidak ditemukan");
    return false;
  }

  console.log(`[OK] ${summary.role_count} role aplikasi tersedia`);
  console.log("[OK] Trigger provisioning auth user tersedia");

  return true;
}

async function main() {
  console.log("Menjalankan verifikasi database MineVision...");

  try {
    const tableVerification = await verifyTables();

    const rlsValid = verifyRls(tableVerification.tableMap);

    const viewVerification = await verifyViews();

    const policiesValid = await verifyPolicies();

    const masterRecordsValid = await verifyMasterRecords(
      tableVerification.tableMap,
    );

    const gdpDataValid = await verifyGdpData(
      tableVerification.tableMap,
      viewVerification.viewSet,
    );

    const investmentDataValid = await verifyInvestmentData(
      tableVerification.tableMap,
      viewVerification.viewSet,
    );

    const exportDataValid = await verifyExportData(
      tableVerification.tableMap,
      viewVerification.viewSet,
    );

    const smelterDataValid = await verifySmelterData(
      tableVerification.tableMap,
      viewVerification.viewSet,
    );

    const authFoundationValid = await verifyAuthFoundation();

    const databaseValid =
      tableVerification.valid &&
      rlsValid &&
      viewVerification.valid &&
      policiesValid &&
      masterRecordsValid &&
      gdpDataValid &&
      investmentDataValid &&
      exportDataValid &&
      smelterDataValid &&
      authFoundationValid;

    if (!databaseValid) {
      throw new Error(
        "Database MineVision belum memenuhi pemeriksaan foundation.",
      );
    }

    console.log("\nDatabase MineVision berhasil diverifikasi.");
  } finally {
    await sqlClient.end();
  }
}

main().catch((error: unknown) => {
  console.error("\nVerifikasi database gagal:", error);
  process.exitCode = 1;
});
