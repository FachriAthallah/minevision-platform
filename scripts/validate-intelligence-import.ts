import { loadIntelligenceCanonical } from "../src/features/data-ingestion/services/validate-intelligence-canonical";

async function main() {
  const path = process.argv[2];
  if (!path) throw new Error("Berikan lokasi manifest Intelligence versi 2.0");
  const result = await loadIntelligenceCanonical(path);
  if (!result.success) {
    for (const issue of result.issues) console.error(`${issue.filePath}: ${issue.path} [${issue.code}] ${issue.message}`);
    process.exitCode = 1;
    return;
  }
  console.log("Dataset Intelligence kanonik valid.");
  console.log(`Komoditas: ${result.data.files.length}; sumber: ${result.data.manifest.sourceCatalog.length}`);
  for (const file of result.data.files) console.log(`${file.commoditySlug}: produksi=${file.productionSeries.records.length}, harga=${file.priceSeries.records.length}, coverage=${file.regionCoverage.length}, lokasi=${file.locations.length}`);
}
main().catch(() => { console.error("Validasi gagal; periksa lokasi manifest dan izin baca file lokal."); process.exitCode = 1; });
