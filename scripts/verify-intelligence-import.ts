import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { config } from "dotenv";
import postgres from "postgres";

import {
  commodities,
  commodityProduction,
  commodityProductionSources,
  sources,
} from "../src/db/schema";

import { validateIntelligenceImport } from "../src/features/data-ingestion/services/validate-intelligence-import";

config({
  path: ".env.local",
});

const databaseUrl = process.env.DATABASE_MIGRATION_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_MIGRATION_URL tidak ditemukan di .env.local.");
}

const sqlClient = postgres(databaseUrl, {
  ssl: "require",
  max: 1,
  prepare: false,
});

const database = drizzle(sqlClient);

type CitationState = {
  sourceSlug: string;
  citationLabel: string;
  sourceUrl: string | null;
  pageReference: string | null;
  isPrimary: boolean;
};

function createProductionKey(
  commoditySlug: string,
  year: number,
  recordType: string,
) {
  return [commoditySlug, String(year), recordType].join(":");
}

function normalizeCitations(citations: CitationState[]) {
  return citations
    .map((citation) => ({
      sourceSlug: citation.sourceSlug,
      citationLabel: citation.citationLabel,
      sourceUrl: citation.sourceUrl ?? null,
      pageReference: citation.pageReference ?? null,
      isPrimary: citation.isPrimary,
    }))
    .sort((first, second) => {
      const firstKey = [
        first.sourceSlug,
        first.citationLabel,
        first.sourceUrl ?? "",
        first.pageReference ?? "",
        String(first.isPrimary),
      ].join(":");

      const secondKey = [
        second.sourceSlug,
        second.citationLabel,
        second.sourceUrl ?? "",
        second.pageReference ?? "",
        String(second.isPrimary),
      ].join(":");

      return firstKey.localeCompare(secondKey);
    });
}

function citationsAreEqual(first: CitationState[], second: CitationState[]) {
  return (
    JSON.stringify(normalizeCitations(first)) ===
    JSON.stringify(normalizeCitations(second))
  );
}

async function main() {
  const inputArgument = process.argv[2];

  if (!inputArgument) {
    throw new Error(
      "Lokasi staging wajib diberikan. Contoh: npm run data:verify:intelligence -- data/staging/intelligence/batubara.json",
    );
  }

  const inputPath = resolve(process.cwd(), inputArgument);

  console.log(`Memverifikasi hasil import: ${inputPath}`);

  const fileContent = await readFile(inputPath, "utf8");

  let parsedInput: unknown;

  try {
    parsedInput = JSON.parse(fileContent);
  } catch {
    throw new Error(`File bukan JSON yang valid: ${inputPath}`);
  }

  const validationResult = validateIntelligenceImport(parsedInput);

  if (!validationResult.success) {
    console.error("\nDataset staging tidak valid:");

    for (const issue of validationResult.issues) {
      console.error(`- ${issue.path} [${issue.code}]: ${issue.message}`);
    }

    process.exitCode = 1;
    return;
  }

  const dataset = validationResult.data;

  const productionRows = await database
    .select({
      id: commodityProduction.id,
      commoditySlug: commodities.slug,
      year: commodityProduction.year,
      productionValue: commodityProduction.productionValue,
      unitCode: commodityProduction.unitCode,
      recordType: commodityProduction.recordType,
      primarySourceSlug: sources.slug,
      verificationStatus: commodityProduction.verificationStatus,
      publicationStatus: commodityProduction.publicationStatus,
      notes: commodityProduction.notes,
    })
    .from(commodityProduction)
    .innerJoin(commodities, eq(commodityProduction.commodityId, commodities.id))
    .innerJoin(sources, eq(commodityProduction.sourceId, sources.id));

  const citationRows = await database
    .select({
      productionId: commodityProductionSources.productionId,
      sourceSlug: sources.slug,
      citationLabel: commodityProductionSources.citationLabel,
      sourceUrl: commodityProductionSources.sourceUrl,
      pageReference: commodityProductionSources.pageReference,
      isPrimary: commodityProductionSources.isPrimary,
    })
    .from(commodityProductionSources)
    .innerJoin(sources, eq(commodityProductionSources.sourceId, sources.id));

  const productionByKey = new Map(
    productionRows.map((record) => [
      createProductionKey(record.commoditySlug, record.year, record.recordType),
      record,
    ]),
  );

  const citationsByProductionId = new Map<string, CitationState[]>();

  for (const citation of citationRows) {
    const currentCitations =
      citationsByProductionId.get(citation.productionId) ?? [];

    currentCitations.push({
      sourceSlug: citation.sourceSlug,
      citationLabel: citation.citationLabel,
      sourceUrl: citation.sourceUrl,
      pageReference: citation.pageReference,
      isPrimary: citation.isPrimary,
    });

    citationsByProductionId.set(citation.productionId, currentCitations);
  }

  const failures: string[] = [];
  let verifiedRecords = 0;
  let excludedRecords = 0;

  for (const expectedRecord of dataset.productionRecords) {
    const recordKey = createProductionKey(
      expectedRecord.commoditySlug,
      expectedRecord.year,
      expectedRecord.recordType,
    );

    const storedRecord = productionByKey.get(recordKey);

    /*
     * Pending dan rejected tidak boleh dimasukkan importer.
     */
    if (expectedRecord.verificationStatus !== "verified") {
      if (storedRecord) {
        failures.push(
          `${recordKey}: record ${expectedRecord.verificationStatus} ditemukan di database`,
        );
      } else {
        excludedRecords += 1;
      }

      continue;
    }

    if (!storedRecord) {
      failures.push(`${recordKey}: record verified tidak ditemukan`);

      continue;
    }

    verifiedRecords += 1;

    if (Number(storedRecord.productionValue) !== expectedRecord.value) {
      failures.push(`${recordKey}: nilai produksi berbeda`);
    }

    if (storedRecord.unitCode !== expectedRecord.unitCode) {
      failures.push(`${recordKey}: unit produksi berbeda`);
    }

    if (storedRecord.verificationStatus !== "verified") {
      failures.push(`${recordKey}: verification status bukan verified`);
    }

    if (storedRecord.publicationStatus !== "draft") {
      failures.push(
        `${recordKey}: publication status seharusnya draft, ditemukan ${storedRecord.publicationStatus}`,
      );
    }

    if ((storedRecord.notes ?? null) !== (expectedRecord.notes ?? null)) {
      failures.push(`${recordKey}: catatan produksi berbeda`);
    }

    const expectedPrimarySource = expectedRecord.sources[0];

    if (!expectedPrimarySource) {
      failures.push(`${recordKey}: staging tidak memiliki sumber utama`);

      continue;
    }

    if (storedRecord.primarySourceSlug !== expectedPrimarySource.sourceSlug) {
      failures.push(`${recordKey}: sumber utama berbeda`);
    }

    const storedCitations = citationsByProductionId.get(storedRecord.id) ?? [];

    const expectedCitations: CitationState[] = expectedRecord.sources.map(
      (sourceReference, index) => ({
        sourceSlug: sourceReference.sourceSlug,
        citationLabel: sourceReference.citationLabel,
        sourceUrl: sourceReference.sourceUrl ?? null,
        pageReference: sourceReference.pageReference ?? null,
        isPrimary: index === 0,
      }),
    );

    if (!citationsAreEqual(storedCitations, expectedCitations)) {
      failures.push(`${recordKey}: data sitasi berbeda`);
    }

    const primaryCitationCount = storedCitations.filter(
      (citation) => citation.isPrimary,
    ).length;

    if (primaryCitationCount !== 1) {
      failures.push(`${recordKey}: harus memiliki tepat satu sitasi utama`);
    }
  }

  console.log("\nIntegrity verification summary:");
  console.log(`Verified records ditemukan : ${verifiedRecords}`);
  console.log(`Pending/rejected tidak masuk: ${excludedRecords}`);
  console.log(`Integrity failures          : ${failures.length}`);

  if (failures.length > 0) {
    console.error("\nIntegrity failures:");

    for (const failure of failures) {
      console.error(`- ${failure}`);
    }

    throw new Error("Hasil import tidak sesuai dengan staging dataset.");
  }

  console.log(
    "\nIntegrity verification berhasil. Database sesuai dengan staging dataset.",
  );
}

main()
  .catch((error: unknown) => {
    console.error("\nVerifikasi hasil import gagal:", error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await sqlClient.end();
  });
