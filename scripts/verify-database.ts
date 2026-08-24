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
] as const;

const requiredViews = ["economic_gdp_annual_metrics"] as const;

const requiredPolicies = [
  {
    tableName: "economic_gdp_annual",
    policyName: "public_read_published_verified_gdp",
  },
  {
    tableName: "economic_gdp_sources",
    policyName: "public_read_sources_of_published_gdp",
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

    const databaseValid =
      tableVerification.valid &&
      rlsValid &&
      viewVerification.valid &&
      policiesValid &&
      masterRecordsValid &&
      gdpDataValid;

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
