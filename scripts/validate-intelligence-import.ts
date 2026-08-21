import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { validateIntelligenceImport } from "../src/features/data-ingestion/services/validate-intelligence-import";

async function main() {
  const inputArgument = process.argv[2];

  if (!inputArgument) {
    throw new Error(
      "Lokasi file wajib diberikan. Contoh: npm run data:validate:intelligence -- data/staging/intelligence/batubara.json",
    );
  }

  const inputPath = resolve(process.cwd(), inputArgument);

  console.log(`Memvalidasi dataset: ${inputPath}`);

  const fileContent = await readFile(inputPath, "utf8");

  let parsedInput: unknown;

  try {
    parsedInput = JSON.parse(fileContent);
  } catch {
    throw new Error(`File bukan JSON yang valid: ${inputPath}`);
  }

  const validationResult = validateIntelligenceImport(parsedInput);

  if (!validationResult.success) {
    console.error("\nDataset Intelligence tidak valid:");

    for (const issue of validationResult.issues) {
      console.error(`- ${issue.path} [${issue.code}]: ${issue.message}`);
    }

    process.exitCode = 1;
    return;
  }

  console.log("\nDataset Intelligence valid.");
  console.log(`Nama dataset       : ${validationResult.data.datasetName}`);
  console.log(
    `Production records : ${validationResult.data.productionRecords.length}`,
  );
  console.log(
    `Price records      : ${validationResult.data.priceRecords.length}`,
  );
}

main().catch((error: unknown) => {
  console.error("\nValidasi dataset gagal:", error);
  process.exitCode = 1;
});
