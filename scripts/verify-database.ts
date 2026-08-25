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
  "economic_gdp_annual",
  "economic_gdp_sources",
  "mining_investment_annual",
  "mining_investment_sources",
] as const;

const requiredViews = [
  "economic_gdp_annual_metrics",
  "mining_investment_annual_metrics",
  "mining_investment_annual_summary",
] as const;

const requiredPolicies = [
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
] as const;

const minimumMasterRecords: Record<string, number> = {
  sources: 3,
  measurement_units: 6,
  commodities: 23,
  regions: 1,
  commodity_price_standards: 6,
};

const expectedGdpYears = [2019, 2020, 2021, 2022, 2023, 2024, 2025];
const expectedInvestmentYears = [2019, 2020, 2021, 2022, 2023, 2024, 2025];

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

    const databaseValid =
      tableVerification.valid &&
      rlsValid &&
      viewVerification.valid &&
      policiesValid &&
      masterRecordsValid &&
      gdpDataValid &&
      investmentDataValid;

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
