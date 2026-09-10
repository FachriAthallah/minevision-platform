import { lstat, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { intelligenceCanonicalFileSchema, intelligenceManifestSchema, type IntelligenceCanonicalFile, type IntelligenceManifest } from "../schemas/intelligence-canonical";

export type CanonicalIssue = { filePath: string; path: string; code: string; message: string };
export type CanonicalDataset = { manifest: IntelligenceManifest; files: IntelligenceCanonicalFile[] };
export type CanonicalValidation = { success: true; data: CanonicalDataset; issues: [] } | { success: false; issues: CanonicalIssue[] };

/** Pure cross-file validation; neither opens a connection nor mutates source values. */
export function validateIntelligenceCanonical(manifestInput: unknown, inputs: { filePath: string; data: unknown }[]): CanonicalValidation {
  const manifest = intelligenceManifestSchema.safeParse(manifestInput);
  const issues: CanonicalIssue[] = [];
  if (!manifest.success) return { success: false, issues: manifest.error.issues.map((issue) => ({ filePath: "manifest.json", path: issue.path.join("."), code: issue.code, message: issue.message })) };
  const catalog = new Map(manifest.data.sourceCatalog.map((source) => [source.slug, source]));
  const expected = new Set(manifest.data.commodityFiles.map((file) => file.filePath));
  const files: IntelligenceCanonicalFile[] = [];
  const seriesCodes = new Set<string>();
  for (const input of inputs) if (!expected.has(input.filePath)) issues.push({ filePath: input.filePath, path: "root", code: "unexpected_file", message: "File tidak tercantum pada manifest" });
  for (const entry of manifest.data.commodityFiles) {
    const matches = inputs.filter((input) => input.filePath === entry.filePath);
    if (matches.length !== 1) { issues.push({ filePath: entry.filePath, path: "root", code: matches.length ? "duplicate_file" : "missing_file", message: "Manifest harus mempunyai tepat satu file yang sesuai" }); continue; }
    const parsed = intelligenceCanonicalFileSchema.safeParse(matches[0].data);
    if (!parsed.success) { issues.push(...parsed.error.issues.map((issue) => ({ filePath: entry.filePath, path: issue.path.join("."), code: issue.code, message: issue.message }))); continue; }
    const file = parsed.data;
    const add = (path: string, message: string) => issues.push({ filePath: entry.filePath, path, code: "reference_conflict", message });
    if (file.commoditySlug !== entry.commoditySlug) add("commoditySlug", "Slug file tidak sesuai manifest");
    if (seriesCodes.has(file.productionSeries.seriesCode)) add("productionSeries.seriesCode", "Identitas seri harus unik lintas komoditas");
    seriesCodes.add(file.productionSeries.seriesCode);
    const collections = [
      ["productionSeries.records", file.productionSeries.records],
      ["priceSeries.records", file.priceSeries.records],
      ["regionCoverage", file.regionCoverage], ["locations", file.locations],
    ] as const;
    for (const [path, rows] of collections) rows.forEach((row, i) => {
      const seen = new Set<string>();
      row.sources.forEach((reference, j) => {
        const source = catalog.get(reference.sourceSlug);
        const refPath = `${path}.${i}.sources.${j}`;
        if (!source) add(`${refPath}.sourceSlug`, "Sumber tidak tersedia pada sourceCatalog");
        else if (reference.sourceUrl !== source.url) add(`${refPath}.sourceUrl`, "URL referensi berbeda dari identitas sumber katalog");
        if (seen.has(reference.sourceSlug)) add(refPath, "Referensi sumber duplikat");
        seen.add(reference.sourceSlug);
      });
    });
    files.push(file);
  }
  return issues.length ? { success: false, issues } : { success: true, data: { manifest: manifest.data, files }, issues: [] };
}

export async function loadIntelligenceCanonical(manifestPath: string): Promise<CanonicalValidation> {
  const issues: CanonicalIssue[] = [];
  const read = async (path: string): Promise<unknown> => {
    try {
      const stat = await lstat(path);
      if (stat.isSymbolicLink() || !stat.isFile()) { issues.push({ filePath: path, path: "root", code: "invalid_file", message: "Hanya regular file, bukan symbolic link, yang diizinkan" }); return undefined; }
      const content = await readFile(path, "utf8");
      try { return JSON.parse(content) as unknown; } catch { issues.push({ filePath: path, path: "root", code: "invalid_json", message: "JSON tidak valid" }); }
    } catch { issues.push({ filePath: path, path: "root", code: "unreadable_file", message: "File tidak tersedia atau tidak dapat dibaca" }); }
    return undefined;
  };
  const path = resolve(manifestPath);
  const input = await read(path);
  const manifest = intelligenceManifestSchema.safeParse(input);
  if (!manifest.success) return issues.length ? { success: false, issues } : validateIntelligenceCanonical(input, []);
  const inputs = await Promise.all(manifest.data.commodityFiles.map(async (file) => ({ filePath: file.filePath, data: await read(resolve(dirname(path), file.filePath)) })));
  const result = validateIntelligenceCanonical(input, inputs);
  if (issues.length) return { success: false, issues: [...issues, ...(result.success ? [] : result.issues)] };
  return result;
}
