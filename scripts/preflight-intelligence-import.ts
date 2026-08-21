import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { config } from "dotenv";
import postgres from "postgres";

import { validateIntelligenceImport } from "../src/features/data-ingestion/services/validate-intelligence-import";

/*
|--------------------------------------------------------------------------
| Environment
|--------------------------------------------------------------------------
*/

config({
  path: ".env.local",
});

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL tidak ditemukan di file .env.local.");
}

/*
|--------------------------------------------------------------------------
| Database connection
|--------------------------------------------------------------------------
*/

const sqlClient = postgres(databaseUrl, {
  ssl: "require",
  max: 1,
  prepare: false,
});

/*
|--------------------------------------------------------------------------
| Database result types
|--------------------------------------------------------------------------
*/

type SlugRow = {
  slug: string;
};

type CodeRow = {
  code: string;
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function findMissingValues(
  requiredValues: Set<string>,
  availableValues: Set<string>,
) {
  return [...requiredValues].filter((value) => !availableValues.has(value));
}

function printReferenceResult(
  label: string,
  requiredValues: Set<string>,
  missingValues: string[],
) {
  if (requiredValues.size === 0) {
    console.log(`✓ ${label}: tidak digunakan oleh dataset`);
    return;
  }

  if (missingValues.length === 0) {
    console.log(`✓ ${label}: ${requiredValues.size} referensi tersedia`);
    return;
  }

  console.error(`✗ ${label}: referensi berikut tidak ditemukan:`);

  for (const missingValue of missingValues) {
    console.error(`  - ${missingValue}`);
  }
}

/*
|--------------------------------------------------------------------------
| Main
|--------------------------------------------------------------------------
*/

async function main() {
  const inputArgument = process.argv[2];

  if (!inputArgument) {
    throw new Error(
      "Lokasi file wajib diberikan. Contoh: npm run data:preflight:intelligence -- data/staging/intelligence/batubara.json",
    );
  }

  const inputPath = resolve(process.cwd(), inputArgument);

  console.log(`Membaca staging dataset: ${inputPath}`);

  const fileContent = await readFile(inputPath, "utf8");

  let parsedInput: unknown;

  try {
    parsedInput = JSON.parse(fileContent);
  } catch {
    throw new Error(`File bukan JSON yang valid: ${inputPath}`);
  }

  /*
   * Validasi struktur file sebelum memeriksa database.
   */
  const validationResult = validateIntelligenceImport(parsedInput);

  if (!validationResult.success) {
    console.error("\nStruktur dataset tidak valid:");

    for (const issue of validationResult.issues) {
      console.error(`- ${issue.path} [${issue.code}]: ${issue.message}`);
    }

    process.exitCode = 1;
    return;
  }

  const dataset = validationResult.data;

  /*
   * Kumpulkan seluruh referensi unik yang digunakan dataset.
   */
  const requiredCommoditySlugs = new Set<string>();
  const requiredUnitCodes = new Set<string>();
  const requiredSourceSlugs = new Set<string>();
  const requiredPriceStandardCodes = new Set<string>();

  for (const record of dataset.productionRecords) {
    requiredCommoditySlugs.add(record.commoditySlug);
    requiredUnitCodes.add(record.unitCode);

    for (const source of record.sources) {
      requiredSourceSlugs.add(source.sourceSlug);
    }
  }

  for (const record of dataset.priceRecords) {
    requiredCommoditySlugs.add(record.commoditySlug);
    requiredUnitCodes.add(record.unitCode);
    requiredPriceStandardCodes.add(record.priceStandardCode);

    for (const source of record.sources) {
      requiredSourceSlugs.add(source.sourceSlug);
    }
  }

  /*
   * Ambil seluruh master data aktif.
   * Data master berukuran kecil sehingga aman dibanding membangun query
   * dinamis dari input pengguna.
   */
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

  const sourceRows = await sqlClient<SlugRow[]>`
    SELECT slug
    FROM public.sources
    WHERE is_active = true;
  `;

  const priceStandardRows = await sqlClient<CodeRow[]>`
    SELECT code
    FROM public.commodity_price_standards
    WHERE is_active = true;
  `;

  const availableCommoditySlugs = new Set(commodityRows.map((row) => row.slug));

  const availableUnitCodes = new Set(unitRows.map((row) => row.code));

  const availableSourceSlugs = new Set(sourceRows.map((row) => row.slug));

  const availablePriceStandardCodes = new Set(
    priceStandardRows.map((row) => row.code),
  );

  /*
   * Bandingkan referensi staging dengan master database.
   */
  const missingCommoditySlugs = findMissingValues(
    requiredCommoditySlugs,
    availableCommoditySlugs,
  );

  const missingUnitCodes = findMissingValues(
    requiredUnitCodes,
    availableUnitCodes,
  );

  const missingSourceSlugs = findMissingValues(
    requiredSourceSlugs,
    availableSourceSlugs,
  );

  const missingPriceStandardCodes = findMissingValues(
    requiredPriceStandardCodes,
    availablePriceStandardCodes,
  );

  console.log("\nHasil database preflight:");

  printReferenceResult(
    "Commodities",
    requiredCommoditySlugs,
    missingCommoditySlugs,
  );

  printReferenceResult(
    "Measurement units",
    requiredUnitCodes,
    missingUnitCodes,
  );

  printReferenceResult("Sources", requiredSourceSlugs, missingSourceSlugs);

  printReferenceResult(
    "Price standards",
    requiredPriceStandardCodes,
    missingPriceStandardCodes,
  );

  const preflightPassed =
    missingCommoditySlugs.length === 0 &&
    missingUnitCodes.length === 0 &&
    missingSourceSlugs.length === 0 &&
    missingPriceStandardCodes.length === 0;

  if (!preflightPassed) {
    throw new Error("Database preflight gagal. Dataset belum boleh diimpor.");
  }

  console.log(
    "\nDatabase preflight berhasil. Seluruh referensi staging tersedia.",
  );
}

main()
  .catch((error: unknown) => {
    console.error("\nDatabase preflight gagal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sqlClient.end();
  });
