import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { config } from "dotenv";
import postgres from "postgres";

import {
  commodities,
  commodityProduction,
  commodityProductionSources,
  measurementUnits,
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

type ImportSummary = {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  pending: number;
  rejected: number;
};

type CitationState = {
  sourceId: string;
  citationLabel: string;
  sourceUrl: string | null;
  pageReference: string | null;
  isPrimary: boolean;
};

function normalizeCitations(citations: CitationState[]) {
  return citations
    .map((citation) => ({
      sourceId: citation.sourceId,
      citationLabel: citation.citationLabel,
      sourceUrl: citation.sourceUrl ?? null,
      pageReference: citation.pageReference ?? null,
      isPrimary: citation.isPrimary,
    }))
    .sort((first, second) => {
      const firstKey = [
        first.sourceId,
        first.citationLabel,
        first.sourceUrl ?? "",
        first.pageReference ?? "",
        String(first.isPrimary),
      ].join(":");

      const secondKey = [
        second.sourceId,
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
  const commitEnabled = process.argv.includes("--commit");

  if (!inputArgument) {
    throw new Error("Lokasi staging wajib diberikan.");
  }

  if (!commitEnabled) {
    throw new Error(
      "Import dibatalkan karena flag --commit tidak diberikan. Jalankan dry-run terlebih dahulu.",
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

  const validationResult = validateIntelligenceImport(parsedInput);

  if (!validationResult.success) {
    console.error("\nDataset tidak valid:");

    for (const issue of validationResult.issues) {
      console.error(`- ${issue.path} [${issue.code}]: ${issue.message}`);
    }

    process.exitCode = 1;
    return;
  }

  const dataset = validationResult.data;

  /*
   * Importer ini baru menangani productionRecords.
   * Price records akan memiliki importer tersendiri.
   */
  if (dataset.priceRecords.length > 0) {
    throw new Error(
      "Dataset memiliki priceRecords. Import harga belum didukung oleh importer produksi.",
    );
  }

  /*
   * Periksa duplicate key dalam staging.
   */
  const stagingKeys = new Set<string>();

  for (const record of dataset.productionRecords) {
    const stagingKey = [
      record.commoditySlug,
      record.year,
      record.recordType,
    ].join(":");

    if (stagingKeys.has(stagingKey)) {
      throw new Error(`Duplikat staging ditemukan: ${stagingKey}`);
    }

    stagingKeys.add(stagingKey);
  }

  const summary: ImportSummary = {
    total: dataset.productionRecords.length,
    inserted: 0,
    updated: 0,
    skipped: 0,
    pending: 0,
    rejected: 0,
  };

  /*
   * Seluruh proses database berada dalam satu transaksi.
   * Apabila satu record gagal, semuanya di-rollback.
   */
  await database.transaction(async (transaction) => {
    const commodityRows = await transaction
      .select({
        id: commodities.id,
        slug: commodities.slug,
        isActive: commodities.isActive,
        isIntelligenceTracked: commodities.isIntelligenceTracked,
      })
      .from(commodities);

    const unitRows = await transaction
      .select({
        code: measurementUnits.code,
        isActive: measurementUnits.isActive,
      })
      .from(measurementUnits);

    const sourceRows = await transaction
      .select({
        id: sources.id,
        slug: sources.slug,
        isActive: sources.isActive,
        verificationStatus: sources.verificationStatus,
      })
      .from(sources);

    const commodityBySlug = new Map(
      commodityRows.map((commodity) => [commodity.slug, commodity]),
    );

    const unitByCode = new Map(unitRows.map((unit) => [unit.code, unit]));

    const sourceBySlug = new Map(
      sourceRows.map((source) => [source.slug, source]),
    );

    for (const record of dataset.productionRecords) {
      if (record.verificationStatus === "pending") {
        summary.pending += 1;
        continue;
      }

      if (record.verificationStatus === "rejected") {
        summary.rejected += 1;
        continue;
      }

      const commodity = commodityBySlug.get(record.commoditySlug);

      if (!commodity) {
        throw new Error(`Commodity tidak ditemukan: ${record.commoditySlug}`);
      }

      if (!commodity.isActive || !commodity.isIntelligenceTracked) {
        throw new Error(
          `Commodity tidak aktif atau tidak dilacak Intelligence: ${record.commoditySlug}`,
        );
      }

      const unit = unitByCode.get(record.unitCode);

      if (!unit?.isActive) {
        throw new Error(
          `Measurement unit tidak tersedia atau tidak aktif: ${record.unitCode}`,
        );
      }

      if (record.sources.length === 0) {
        throw new Error(
          `Record ${record.commoditySlug}:${record.year} tidak memiliki sumber.`,
        );
      }

      const expectedCitations: CitationState[] = record.sources.map(
        (sourceReference, index) => {
          const source = sourceBySlug.get(sourceReference.sourceSlug);

          if (!source) {
            throw new Error(
              `Source tidak ditemukan: ${sourceReference.sourceSlug}`,
            );
          }

          if (!source.isActive || source.verificationStatus !== "verified") {
            throw new Error(
              `Source belum aktif atau belum diverifikasi: ${sourceReference.sourceSlug}`,
            );
          }

          return {
            sourceId: source.id,
            citationLabel: sourceReference.citationLabel,
            sourceUrl: sourceReference.sourceUrl ?? null,
            pageReference: sourceReference.pageReference ?? null,
            isPrimary: index === 0,
          };
        },
      );

      const citationKeys = new Set<string>();

      for (const citation of expectedCitations) {
        const citationKey = [citation.sourceId, citation.citationLabel].join(
          ":",
        );

        if (citationKeys.has(citationKey)) {
          throw new Error(
            `Sitasi duplikat pada ${record.commoditySlug}:${record.year}: ${citation.citationLabel}`,
          );
        }

        citationKeys.add(citationKey);
      }

      const primaryCitation = expectedCitations[0];

      if (!primaryCitation) {
        throw new Error(
          `Sumber utama tidak ditemukan untuk ${record.commoditySlug}:${record.year}`,
        );
      }

      const existingRows = await transaction
        .select()
        .from(commodityProduction)
        .where(
          and(
            eq(commodityProduction.commodityId, commodity.id),
            eq(commodityProduction.year, record.year),
            eq(commodityProduction.recordType, record.recordType),
          ),
        )
        .limit(1);

      const existingRecord = existingRows[0];

      if (!existingRecord) {
        const insertedRows = await transaction
          .insert(commodityProduction)
          .values({
            commodityId: commodity.id,
            year: record.year,
            productionValue: String(record.value),
            unitCode: record.unitCode,
            recordType: record.recordType,
            sourceId: primaryCitation.sourceId,
            verificationStatus: "verified",
            publicationStatus: "draft",
            notes: record.notes ?? null,
          })
          .returning({
            id: commodityProduction.id,
          });

        const insertedRecord = insertedRows[0];

        if (!insertedRecord) {
          throw new Error(
            `Gagal membuat record produksi ${record.commoditySlug}:${record.year}`,
          );
        }

        await transaction.insert(commodityProductionSources).values(
          expectedCitations.map((citation) => ({
            productionId: insertedRecord.id,
            sourceId: citation.sourceId,
            citationLabel: citation.citationLabel,
            sourceUrl: citation.sourceUrl,
            pageReference: citation.pageReference,
            isPrimary: citation.isPrimary,
          })),
        );

        summary.inserted += 1;
        continue;
      }

      const existingCitations = await transaction
        .select({
          sourceId: commodityProductionSources.sourceId,
          citationLabel: commodityProductionSources.citationLabel,
          sourceUrl: commodityProductionSources.sourceUrl,
          pageReference: commodityProductionSources.pageReference,
          isPrimary: commodityProductionSources.isPrimary,
        })
        .from(commodityProductionSources)
        .where(eq(commodityProductionSources.productionId, existingRecord.id));

      const productionDataEqual =
        Number(existingRecord.productionValue) === record.value &&
        existingRecord.unitCode === record.unitCode &&
        existingRecord.sourceId === primaryCitation.sourceId &&
        existingRecord.verificationStatus === "verified" &&
        (existingRecord.notes ?? null) === (record.notes ?? null);

      const citationDataEqual = citationsAreEqual(
        existingCitations,
        expectedCitations,
      );

      if (productionDataEqual && citationDataEqual) {
        summary.skipped += 1;
        continue;
      }

      /*
       * Jangan mengubah data yang sedang review,
       * sudah published, atau archived.
       */
      if (existingRecord.publicationStatus !== "draft") {
        throw new Error(
          `Record ${record.commoditySlug}:${record.year} berstatus ${existingRecord.publicationStatus} dan tidak boleh ditimpa importer.`,
        );
      }

      await transaction
        .update(commodityProduction)
        .set({
          productionValue: String(record.value),
          unitCode: record.unitCode,
          sourceId: primaryCitation.sourceId,
          verificationStatus: "verified",
          notes: record.notes ?? null,
          updatedAt: new Date(),
        })
        .where(eq(commodityProduction.id, existingRecord.id));

      /*
       * Sinkronisasi sitasi berada di dalam transaksi.
       */
      await transaction
        .delete(commodityProductionSources)
        .where(eq(commodityProductionSources.productionId, existingRecord.id));

      await transaction.insert(commodityProductionSources).values(
        expectedCitations.map((citation) => ({
          productionId: existingRecord.id,
          sourceId: citation.sourceId,
          citationLabel: citation.citationLabel,
          sourceUrl: citation.sourceUrl,
          pageReference: citation.pageReference,
          isPrimary: citation.isPrimary,
        })),
      );

      summary.updated += 1;
    }
  });

  console.log("\nImport Intelligence berhasil:");
  console.log(`Total staging       : ${summary.total}`);
  console.log(`Inserted            : ${summary.inserted}`);
  console.log(`Updated             : ${summary.updated}`);
  console.log(`Skipped/idempotent  : ${summary.skipped}`);
  console.log(`Pending/review      : ${summary.pending}`);
  console.log(`Rejected            : ${summary.rejected}`);
}

main()
  .catch((error: unknown) => {
    console.error("\nImport Intelligence gagal:", error);
    console.error("Transaksi dibatalkan dan perubahan database di-rollback.");

    process.exitCode = 1;
  })
  .finally(async () => {
    await sqlClient.end();
  });
