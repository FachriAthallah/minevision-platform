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
  "commodity_price_standards",
  "commodity_domestic_prices",
  "regions",
  "commodity_production_locations",
] as const;

const minimumMasterRecords: Record<string, number> = {
  sources: 3,
  measurement_units: 6,
  commodities: 23,
  regions: 1,
  commodity_price_standards: 6,
};

type DatabaseTable = {
  table_name: string;
  rls_enabled: boolean;
};

type CountResult = {
  total: number;
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
      console.error(`✗ Tabel tidak ditemukan: ${requiredTable}`);
      valid = false;
      continue;
    }

    console.log(`✓ Tabel ditemukan: ${requiredTable}`);
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
      continue;
    }

    if (!rlsEnabled) {
      console.error(`✗ RLS belum aktif: ${requiredTable}`);
      valid = false;
      continue;
    }

    console.log(`✓ RLS aktif: ${requiredTable}`);
  }

  return valid;
}

async function verifyMasterRecords() {
  let valid = true;

  console.log("\nMemeriksa master data:");

  for (const [tableName, minimumRecords] of Object.entries(
    minimumMasterRecords,
  )) {
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
        `✗ ${tableName}: ${total} record, minimal ${minimumRecords}`,
      );

      valid = false;
      continue;
    }

    console.log(`✓ ${tableName}: ${total} record, minimal ${minimumRecords}`);
  }

  return valid;
}

async function main() {
  console.log("Menjalankan verifikasi database MineVision...");

  try {
    const tableVerification = await verifyTables();

    const rlsValid = verifyRls(tableVerification.tableMap);

    const masterRecordsValid = await verifyMasterRecords();

    const databaseValid =
      tableVerification.valid && rlsValid && masterRecordsValid;

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
