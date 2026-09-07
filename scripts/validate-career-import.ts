import { loadValidatedCareerImport } from "./career/load-career-import";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Kesalahan tidak diketahui";
}

async function main() {
  const dataset = await loadValidatedCareerImport(process.argv[2]);
  if (!dataset) {
    process.exitCode = 1;
    return;
  }
  const professionCount = dataset.categoryFiles.reduce(
    (total, file) => total + file.data.professions.length,
    0,
  );
  const profileItemCount = dataset.categoryFiles.reduce(
    (total, file) => total + file.data.profileItems.length,
    0,
  );

  console.log("\nDataset Career valid.");
  console.log(`Categories  : ${dataset.categoryFiles.length}`);
  console.log(`Sources     : ${dataset.manifest.sourceCatalog.length}`);
  console.log(`Professions : ${professionCount}`);
  console.log(`Profile item: ${profileItemCount}`);
}

main().catch((error: unknown) => {
  console.error("\nValidasi dataset Career gagal:", getErrorMessage(error));
  process.exitCode = 1;
});
