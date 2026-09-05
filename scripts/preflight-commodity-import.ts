import { lstat, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { config } from "dotenv";
import postgres from "postgres";

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
  throw new Error("DATABASE_MIGRATION_URL tidak ditemukan di file .env.local.");
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

      try {
        fileInputs.push({
          filePath: entry.filePath,
          input: JSON.parse(await readFile(filePath, "utf8")) as unknown,
        });
      } catch (error) {
        loadIssues.push({
          filePath: entry.filePath,
          path: "root",
          code: "invalid_json",
          message: `File bukan JSON yang valid: ${getErrorMessage(error)}`,
        });
      }
    } catch (error) {
      loadIssues.push({
        filePath: entry.filePath,
        path: "root",
        code: "file_read_error",
        message: `File tidak dapat dibaca: ${getErrorMessage(error)}`,
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

function printList(label: string, values: string[]) {
  if (values.length === 0) {
    console.log(`✓ ${label}: 0`);
    return;
  }

  console.log(`✓ ${label}: ${values.length}`);

  for (const value of values) {
    console.log(`  - ${value}`);
  }
}

async function main() {
  const inputArgument = process.argv[2];

  if (!inputArgument) {
    throw new Error(
      "Lokasi manifest wajib diberikan. Contoh: " +
        "npm run data:preflight:commodity -- " +
        "data/staging/commodity/manifest.json",
    );
  }

  const validatedImport = await loadValidatedImport(inputArgument);

  if (!validatedImport) {
    process.exitCode = 1;
    return;
  }

  const requirements = collectCommodityPreflightRequirements(validatedImport);

  console.log("\nMembaca master dan relasi database (read-only)...");

  const [
    commodityRows,
    unitRows,
    regionRows,
    sourceRows,
    industryCompanyRows,
    contentRows,
    primaryContentRows,
  ] = await Promise.all([
    sqlClient<SlugRow[]>`
      SELECT slug
      FROM public.commodities
      WHERE is_active = true;
    `,
    sqlClient<CodeRow[]>`
      SELECT code
      FROM public.measurement_units
      WHERE is_active = true;
    `,
    sqlClient<CommodityPreflightRegionRow[]>`
      SELECT
        id::text AS id,
        slug,
        code,
        level::text AS level,
        is_active AS "isActive"
      FROM public.regions;
    `,
    sqlClient<CommodityPreflightSourceRow[]>`
      SELECT
        slug,
        name,
        organization,
        type::text AS type,
        url
      FROM public.sources;
    `,
    sqlClient<SlugRow[]>`
      SELECT slug
      FROM public.industry_companies
      WHERE is_active = true;
    `,
    sqlClient<CommodityPreflightContentRow[]>`
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
    `,
    sqlClient<CommodityPreflightPrimaryContentRow[]>`
      SELECT
        commodity.slug AS "commoditySlug",
        content.slug AS "contentSlug"
      FROM public.commodity_contents AS commodity_content
      INNER JOIN public.commodities AS commodity
        ON commodity.id = commodity_content.commodity_id
      INNER JOIN public.contents AS content
        ON content.id = commodity_content.content_id
      WHERE commodity_content.is_primary = true;
    `,
  ]);

  const report = evaluateCommodityPreflight(requirements, {
    activeCommoditySlugs: commodityRows.map((row) => row.slug),
    activeUnitCodes: unitRows.map((row) => row.code),
    regions: regionRows,
    sources: sourceRows,
    activeIndustryCompanySlugs: industryCompanyRows.map((row) => row.slug),
    commodityContents: contentRows,
    primaryContentLinks: primaryContentRows,
  });

  console.log("\nKebutuhan dataset:");
  console.log(`✓ Commodities: ${requirements.commoditySlugs.length}`);
  console.log(`✓ Measurement units: ${requirements.unitCodes.length}`);
  console.log(`✓ Province regions: ${requirements.provinceRegionSlugs.length}`);
  console.log(`✓ Sources: ${requirements.sourceCatalog.length}`);
  console.log(`✓ Countries: ${requirements.countryCatalog.length}`);
  console.log(`✓ Profiles: ${requirements.profiles.length}`);
  console.log(
    `✓ Optional Industry links: ${requirements.industryCompanySlugs.length}`,
  );

  console.log("\nRencana upsert saat importer dijalankan:");
  printList("Sources baru", report.plan.sourcesToCreate);
  printList("Sources yang sudah ada", report.plan.sourcesToUpdate);
  printList("Countries baru", report.plan.countriesToCreate);
  printList("Countries yang sudah ada", report.plan.countriesToUpdate);
  printList("Profiles baru", report.plan.profilesToCreate);
  printList("Profiles yang sudah ada", report.plan.profilesToUpdate);

  if (!report.passed) {
    console.error("\nDatabase preflight gagal:");

    for (const issue of report.issues) {
      console.error(`- [${issue.category}] ${issue.key}: ${issue.message}`);
    }

    throw new Error("Dataset belum boleh masuk ke tahap dry-run/importer.");
  }

  console.log(
    "\nDatabase preflight berhasil. Tidak ada perubahan database yang dilakukan.",
  );
}

main()
  .catch((error: unknown) => {
    console.error("\nCommodity preflight gagal:", getErrorMessage(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await sqlClient.end();
  });
