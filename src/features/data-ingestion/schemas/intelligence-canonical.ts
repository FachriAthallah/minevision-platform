import { z } from "zod";

export const INTELLIGENCE_SLUGS = ["batubara", "nikel", "emas", "tembaga", "timah", "bijih-besi", "bauksit"] as const;
const slug = z.string().max(220).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug harus kebab-case");
const text = z.string().refine((value) => value.trim().length > 0, "Teks tidak boleh kosong");
const url = z.url().startsWith("https://", "URL sumber harus HTTPS");
const year = z.number().int().min(2019).max(2025);
export const intelligenceDecimalSchema = z.string().regex(/^(?:0|[1-9]\d{0,17})(?:\.\d{1,6})?$/, "Gunakan string angka mentah non-negatif, maksimal 18 digit integer dan 6 desimal");
const unit = z.enum(["metric_ton", "kilogram", "dry_metric_ton", "troy_ounce"]);
const sourceReference = z.object({ sourceSlug: slug, citationLabel: text.max(255), sourceUrl: url, pageReference: text.max(100).nullable() }).strict();
const observation = z.object({ year, value: intelligenceDecimalSchema, recordType: z.literal("actual"), verificationStatus: z.literal("verified"), sources: z.array(sourceReference).min(1), notes: text.nullable() }).strict().superRefine((record, ctx) => {
  if (Number(record.value) === 0 && !record.notes?.includes("reported_zero")) ctx.addIssue({ code: "custom", path: ["value"], message: "Nilai nol memerlukan bukti eksplisit reported_zero; tahun kosong harus masuk missingYears" });
});
export const intelligenceSourceSchema = z.object({ code: z.string().regex(/^[PHLG]\d+$/), slug, name: text.max(200), type: z.enum(["government", "statistics_agency", "company_report", "academic", "regulation", "market_data", "other"]), organization: text.max(200), url, description: text.nullable(), isOfficial: z.literal(true), verificationStatus: z.literal("verified") }).strict();

function duplicates(values: (string | number)[], ctx: z.RefinementCtx, path: (string | number)[]) {
  const seen = new Set<string | number>();
  values.forEach((value, i) => { if (seen.has(value)) ctx.addIssue({ code: "custom", path: [...path, i], message: "Natural key duplikat" }); seen.add(value); });
}
export const intelligenceManifestSchema = z.object({
  schemaVersion: z.literal("2.0"), datasetName: text, effectiveDate: z.iso.date(),
  canonicalDocument: z.object({ fileName: text, sha256: z.string().regex(/^[a-f0-9]{64}$/) }).strict(),
  commodityFiles: z.array(z.object({ commoditySlug: z.enum(INTELLIGENCE_SLUGS), filePath: text }).strict()).length(7),
  sourceCatalog: z.array(intelligenceSourceSchema).min(1),
}).strict().superRefine((manifest, ctx) => {
  duplicates(manifest.commodityFiles.map((file) => file.commoditySlug), ctx, ["commodityFiles"]);
  manifest.commodityFiles.forEach((file, i) => { if (file.filePath !== `${file.commoditySlug}.json`) ctx.addIssue({ code: "custom", path: ["commodityFiles", i, "filePath"], message: "Path harus tepat <commoditySlug>.json" }); });
  duplicates(manifest.sourceCatalog.map((source) => source.slug), ctx, ["sourceCatalog"]);
  duplicates(manifest.sourceCatalog.map((source) => source.code), ctx, ["sourceCatalog"]);
});

export const intelligenceCoverageSchema = z.object({
  regionSlug: slug.max(180), regionName: text.max(160), coverageType: z.enum(["primary", "secondary", "known_occurrence", "historical"]), areaDescription: text,
  relatedCompanyName: text.nullable(), industryCompanySlug: slug.max(180).nullable(),
  productionValue: intelligenceDecimalSchema.nullable(), productionYear: year.nullable(), unitCode: unit.nullable(),
  rank: z.number().int().positive().nullable(), rankingStatus: z.enum(["verified", "unverified", "unavailable"]), rankingEvidence: text.nullable(),
  sources: z.array(sourceReference), verificationStatus: z.enum(["verified", "pending"]), notes: text,
}).strict().superRefine((row, ctx) => {
  if (row.verificationStatus === "verified" && !row.sources.length) ctx.addIssue({ code: "custom", path: ["sources"], message: "Wilayah verified wajib memiliki sumber langsung" });
  if (row.rankingStatus === "verified" && (row.rank === null || row.productionValue === null || row.productionYear === null || row.unitCode === null || !row.rankingEvidence || !row.sources.length)) ctx.addIssue({ code: "custom", path: ["rankingStatus"], message: "Ranking verified wajib mempunyai nilai, tahun, unit, sumber, dan bukti pembanding lengkap" });
  if (row.rankingStatus !== "verified" && row.rank !== null) ctx.addIssue({ code: "custom", path: ["rank"], message: "Rank harus null tanpa pembanding terverifikasi" });
  if (row.productionValue !== null && (row.productionYear === null || row.unitCode === null)) ctx.addIssue({ code: "custom", path: ["productionValue"], message: "Produksi wilayah wajib mempunyai tahun dan satuan" });
});
export const intelligenceLocationSchema = z.object({
  regionSlug: slug.max(180), siteSlug: slug.max(180), siteName: text, siteType: z.enum(["mine", "processing_plant", "smelter", "refinery", "project", "deposit"]),
  companyName: text.nullable(), industryCompanySlug: slug.max(180).nullable(),
  latitude: z.number().finite().min(-90).max(90).nullable(), longitude: z.number().finite().min(-180).max(180).nullable(),
  locationAccuracy: z.enum(["exact", "approximate", "regency_centroid", "unknown"]), geometrySourceUrl: url.nullable(),
  operationStatus: z.enum(["operating", "development", "historical", "inactive", "unknown"]), isPrimary: z.boolean(), primaryReason: text.nullable(),
  sources: z.array(sourceReference).min(1), verificationStatus: z.enum(["verified", "pending"]), notes: text,
}).strict().superRefine((row, ctx) => {
  if ((row.latitude === null) !== (row.longitude === null)) ctx.addIssue({ code: "custom", path: ["latitude"], message: "Latitude dan longitude harus tersedia berpasangan" });
  if (row.latitude !== null && (!row.geometrySourceUrl || row.locationAccuracy === "unknown")) ctx.addIssue({ code: "custom", path: ["locationAccuracy"], message: "Koordinat wajib memiliki sumber geometri dan tingkat ketelitian" });
  if (row.isPrimary && (!row.primaryReason || row.verificationStatus !== "verified")) ctx.addIssue({ code: "custom", path: ["primaryReason"], message: "Lokasi utama wajib memiliki alasan dan bukti terverifikasi" });
  if (["project", "deposit"].includes(row.siteType) && row.operationStatus === "operating") ctx.addIssue({ code: "custom", path: ["operationStatus"], message: "Project/deposit tidak boleh dianggap produksi aktif" });
});

const EXPECTED_FORMS = { batubara: "coal", nikel: "ore", emas: "metal", tembaga: "concentrate", timah: "concentrate", "bijih-besi": "concentrate", bauksit: "ore" } as const;
const EXPECTED_PRICES = { batubara: ["HBA_6322", "metric_ton"], nikel: ["HMA_NIKEL", "dry_metric_ton"], emas: ["HMA_EMAS", "troy_ounce"] } as const;
export const intelligenceCanonicalFileSchema = z.object({
  schemaVersion: z.literal("2.0"), commoditySlug: z.enum(INTELLIGENCE_SLUGS), documentSlug: slug, name: text,
  productionSeries: z.object({ seriesCode: slug.max(180), name: text, productForm: z.enum(["coal", "ore", "concentrate", "metal"]), productionScope: z.literal("national"), unitCode: unit, specification: text.nullable(), methodologyNotes: text.nullable(), isCanonical: z.literal(true), isPublicDefault: z.literal(true), records: z.array(observation).min(1), missingYears: z.array(year) }).strict(),
  priceSeries: z.object({ seriesCode: slug.max(180).nullable(), standardCode: z.enum(["HBA_6322", "HMA_NIKEL", "HMA_EMAS"]).nullable(), name: text, period: z.literal("annual"), aggregationMethod: z.literal("annual_average").nullable(), isCanonical: z.literal(true).nullable(), isPublicDefault: z.literal(true).nullable(), currencyCode: z.literal("USD").nullable(), unitCode: unit.nullable(), methodologyNotes: text.nullable(), records: z.array(observation), missingYears: z.array(year) }).strict(),
  regionCoverage: z.array(intelligenceCoverageSchema), locations: z.array(intelligenceLocationSchema),
}).strict().superRefine((file, ctx) => {
  if (file.productionSeries.productForm !== EXPECTED_FORMS[file.commoditySlug]) ctx.addIssue({ code: "custom", path: ["productionSeries", "productForm"], message: "Bentuk produk tidak sesuai seri kanonik; bijih/konsentrat/logam tidak boleh dicampur" });
  if (file.productionSeries.unitCode !== (file.commoditySlug === "emas" ? "kilogram" : "metric_ton")) ctx.addIssue({ code: "custom", path: ["productionSeries", "unitCode"], message: "Satuan produksi tidak sesuai dokumen kanonik" });
  for (const field of ["productionSeries", "priceSeries"] as const) {
    const series = file[field];
    const years = [...series.records.map((record) => record.year), ...series.missingYears];
    duplicates(years, ctx, [field, "years"]);
    if (years.length !== 7) ctx.addIssue({ code: "custom", path: [field, "missingYears"], message: "Seluruh tahun 2019–2025 wajib tercatat sebagai observasi atau missingYears" });
    series.records.forEach((record, i) => duplicates(record.sources.map((source) => source.sourceSlug), ctx, [field, "records", i, "sources"]));
  }
  const price = file.priceSeries;
  const expected = file.commoditySlug in EXPECTED_PRICES ? EXPECTED_PRICES[file.commoditySlug as keyof typeof EXPECTED_PRICES] : null;
  if (expected
    ? price.standardCode !== expected[0] || price.unitCode !== expected[1] || price.currencyCode !== "USD" || !price.seriesCode || price.aggregationMethod !== "annual_average" || price.isCanonical !== true || price.isPublicDefault !== true
    : price.seriesCode !== null || price.standardCode !== null || price.unitCode !== null || price.currencyCode !== null || price.aggregationMethod !== null || price.isCanonical !== null || price.isPublicDefault !== null || price.records.length > 0
  ) ctx.addIssue({ code: "custom", path: ["priceSeries"], message: "Identitas seri, standard, currency, atau unit harga tidak sesuai acuan domestik final" });
  duplicates(file.regionCoverage.map((row) => row.regionSlug), ctx, ["regionCoverage"]);
  duplicates(file.locations.map((row) => `${row.regionSlug}:${row.siteSlug}`), ctx, ["locations"]);
  file.locations.forEach((row, i) => { if (!file.regionCoverage.some((region) => region.regionSlug === row.regionSlug)) ctx.addIssue({ code: "custom", path: ["locations", i, "regionSlug"], message: "Wilayah lokasi tidak terdapat dalam coverage" }); });
});
export type IntelligenceCanonicalFile = z.infer<typeof intelligenceCanonicalFileSchema>;
export type IntelligenceManifest = z.infer<typeof intelligenceManifestSchema>;
export function isPublicIntelligenceMarker(row: z.infer<typeof intelligenceLocationSchema>) {
  return row.verificationStatus === "verified" && row.latitude !== null && row.longitude !== null && ["exact", "approximate"].includes(row.locationAccuracy) && row.geometrySourceUrl !== null;
}
