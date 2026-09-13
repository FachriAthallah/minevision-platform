import { loadEconomyImport } from "../src/features/data-ingestion/services/validate-economy-import";

async function main() {
  const manifestPath = process.argv[2];
  if (!manifestPath) throw new Error("Berikan lokasi manifest Economy");
  const result = await loadEconomyImport(manifestPath);
  if (!result.success) {
    for (const issue of result.issues) {
      console.error(`${issue.filePath}: ${issue.path} [${issue.code}] ${issue.message}`);
    }
    process.exitCode = 1;
    return;
  }

  const { files, manifest } = result.data;
  console.log("Dataset Economy valid.");
  console.log(`GDP        : ${files.gdp.records.length}`);
  console.log(`Investment : ${files.investment.records.length}`);
  console.log(`Exports    : ${files.exports.records.length}`);
  console.log(`Smelters   : ${files.smelters.records.length}`);
  console.log(`Regulations: ${files.regulations.records.length}`);
  console.log(`Sources    : ${manifest.sourceCatalog.length}`);
  console.log(`HOLD       : ${files.investment.records.length + files.exports.records.length + files.smelters.records.filter((row) => row.holdReason !== null).length}`);
}

main().catch(() => {
  console.error("Validasi Economy gagal; periksa manifest dan izin baca file lokal.");
  process.exitCode = 1;
});
