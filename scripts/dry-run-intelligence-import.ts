import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { validateIntelligenceImport } from "../src/features/data-ingestion/services/validate-intelligence-import";

type DryRunRecord = {
  kind: "production" | "price";
  key: string;
  verificationStatus: "pending" | "verified" | "rejected";
};

type DryRunSummary = {
  total: number;
  ready: number;
  reviewRequired: number;
  rejected: number;
  duplicates: number;
};

function createProductionKey(commoditySlug: string, year: number) {
  return `production:${commoditySlug}:${year}`;
}

function createPriceKey(
  commoditySlug: string,
  priceStandardCode: string,
  periodStart: string,
  periodEnd: string,
) {
  return [
    "price",
    commoditySlug,
    priceStandardCode,
    periodStart,
    periodEnd,
  ].join(":");
}

function calculateDryRun(records: DryRunRecord[]) {
  const summary: DryRunSummary = {
    total: records.length,
    ready: 0,
    reviewRequired: 0,
    rejected: 0,
    duplicates: 0,
  };

  const seenKeys = new Set<string>();
  const duplicateKeys: string[] = [];

  for (const record of records) {
    if (seenKeys.has(record.key)) {
      summary.duplicates += 1;
      duplicateKeys.push(record.key);
      continue;
    }

    seenKeys.add(record.key);

    switch (record.verificationStatus) {
      case "verified":
        summary.ready += 1;
        break;

      case "pending":
        summary.reviewRequired += 1;
        break;

      case "rejected":
        summary.rejected += 1;
        break;
    }
  }

  return {
    summary,
    duplicateKeys,
  };
}

async function main() {
  const inputArgument = process.argv[2];

  if (!inputArgument) {
    throw new Error(
      "Lokasi file wajib diberikan. Contoh: npm run data:dry-run:intelligence -- data/staging/intelligence/batubara.json",
    );
  }

  const inputPath = resolve(process.cwd(), inputArgument);

  console.log(`Menjalankan dry-run: ${inputPath}`);

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
  const records: DryRunRecord[] = [];

  for (const productionRecord of dataset.productionRecords) {
    records.push({
      kind: "production",
      key: createProductionKey(
        productionRecord.commoditySlug,
        productionRecord.year,
      ),
      verificationStatus: productionRecord.verificationStatus,
    });
  }

  for (const priceRecord of dataset.priceRecords) {
    records.push({
      kind: "price",
      key: createPriceKey(
        priceRecord.commoditySlug,
        priceRecord.priceStandardCode,
        priceRecord.periodStart,
        priceRecord.periodEnd,
      ),
      verificationStatus: priceRecord.verificationStatus,
    });
  }

  const { summary, duplicateKeys } = calculateDryRun(records);

  console.log("\nDry-run summary:");
  console.log(`Total record          : ${summary.total}`);
  console.log(`Siap diimpor          : ${summary.ready}`);
  console.log(`Memerlukan review    : ${summary.reviewRequired}`);
  console.log(`Ditolak               : ${summary.rejected}`);
  console.log(`Duplikat dalam file   : ${summary.duplicates}`);

  if (duplicateKeys.length > 0) {
    console.error("\nDuplicate keys:");

    for (const duplicateKey of duplicateKeys) {
      console.error(`- ${duplicateKey}`);
    }

    throw new Error(
      "Dry-run gagal karena terdapat duplikat dalam file staging.",
    );
  }

  if (summary.ready === 0) {
    console.log(
      "\nTidak ada record yang dapat diimpor. Record pending harus diverifikasi terlebih dahulu.",
    );
  } else {
    console.log(
      `\n${summary.ready} record memenuhi syarat untuk proses import.`,
    );
  }

  console.log("\nDry-run selesai. Tidak ada perubahan pada database.");
}

main().catch((error: unknown) => {
  console.error("\nDry-run gagal:", error);
  process.exitCode = 1;
});
