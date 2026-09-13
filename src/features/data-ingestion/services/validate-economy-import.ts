import { lstat, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import {
  ECONOMY_DATASETS,
  economyExportsFileSchema,
  economyGdpFileSchema,
  economyInvestmentFileSchema,
  economyManifestSchema,
  economyRegulationsFileSchema,
  economySmeltersFileSchema,
  type EconomyDatasetFiles,
  type EconomyManifest,
} from "../schemas/economy-import";

export type EconomyValidationIssue = {
  filePath: string;
  path: string;
  code: string;
  message: string;
};

export type EconomyDataset = {
  manifest: EconomyManifest;
  files: EconomyDatasetFiles;
};

export type EconomyValidationResult =
  | { success: true; data: EconomyDataset; issues: [] }
  | { success: false; issues: EconomyValidationIssue[] };

const schemas = {
  gdp: economyGdpFileSchema,
  investment: economyInvestmentFileSchema,
  exports: economyExportsFileSchema,
  smelters: economySmeltersFileSchema,
  regulations: economyRegulationsFileSchema,
} as const;

function zodIssues(
  filePath: string,
  issues: { path: PropertyKey[]; code: string; message: string }[],
): EconomyValidationIssue[] {
  return issues.map((issue) => ({
    filePath,
    path: issue.path.join("."),
    code: issue.code,
    message: issue.message,
  }));
}

function addDuplicateIssues(
  issues: EconomyValidationIssue[],
  filePath: string,
  keys: string[],
  path: string,
) {
  const seen = new Set<string>();
  keys.forEach((key, index) => {
    if (seen.has(key)) {
      issues.push({
        filePath,
        path: `${path}.${index}`,
        code: "duplicate_natural_key",
        message: `Natural key duplikat: ${key}`,
      });
    }
    seen.add(key);
  });
}

export function validateEconomyImport(
  manifestInput: unknown,
  inputs: { filePath: string; data: unknown }[],
): EconomyValidationResult {
  const parsedManifest = economyManifestSchema.safeParse(manifestInput);
  if (!parsedManifest.success) {
    return {
      success: false,
      issues: zodIssues("manifest.json", parsedManifest.error.issues),
    };
  }

  const issues: EconomyValidationIssue[] = [];
  const manifest = parsedManifest.data;
  const expectedPaths = new Set(manifest.datasets.map((entry) => entry.filePath));
  const sourceSlugs = new Set(manifest.sourceCatalog.map((source) => source.slug));
  const files = {} as EconomyDatasetFiles;

  for (const input of inputs) {
    if (!expectedPaths.has(input.filePath)) {
      issues.push({
        filePath: input.filePath,
        path: "root",
        code: "unexpected_file",
        message: "File tidak tercantum pada manifest Economy",
      });
    }
  }

  for (const descriptor of manifest.datasets) {
    const matches = inputs.filter((input) => input.filePath === descriptor.filePath);
    if (matches.length !== 1) {
      issues.push({
        filePath: descriptor.filePath,
        path: "root",
        code: matches.length === 0 ? "missing_file" : "duplicate_file",
        message: "Manifest wajib mempunyai tepat satu file dataset yang sesuai",
      });
      continue;
    }

    const parsed = schemas[descriptor.dataset].safeParse(matches[0].data);
    if (!parsed.success) {
      issues.push(...zodIssues(descriptor.filePath, parsed.error.issues));
      continue;
    }
    (files as Record<string, unknown>)[descriptor.dataset] = parsed.data;

    if (parsed.data.records.length !== descriptor.recordCount) {
      issues.push({
        filePath: descriptor.filePath,
        path: "records",
        code: "record_count_mismatch",
        message: "Jumlah record berbeda dari metadata manifest",
      });
    }
  }

  if (Object.keys(files).length !== ECONOMY_DATASETS.length) {
    return { success: false, issues };
  }

  const assertSources = (
    filePath: string,
    records: { sourceSlugs: string[] }[],
  ) => {
    records.forEach((record, index) => {
      for (const sourceSlug of record.sourceSlugs) {
        if (!sourceSlugs.has(sourceSlug)) {
          issues.push({
            filePath,
            path: `records.${index}.sourceSlugs`,
            code: "unknown_source",
            message: `Sumber ${sourceSlug} tidak tersedia pada sourceCatalog`,
          });
        }
      }
      if (new Set(record.sourceSlugs).size !== record.sourceSlugs.length) {
        issues.push({
          filePath,
          path: `records.${index}.sourceSlugs`,
          code: "duplicate_source",
          message: "Referensi sumber dalam satu record tidak boleh duplikat",
        });
      }
    });
  };

  assertSources("gdp.json", files.gdp.records);
  assertSources("investment.json", files.investment.records);
  assertSources("exports.json", files.exports.records);

  addDuplicateIssues(
    issues,
    "gdp.json",
    files.gdp.records.map(
      (row) => `${row.regionSlug}:${row.year}:${row.priceBasis}:${row.recordType}`,
    ),
    "records",
  );
  addDuplicateIssues(
    issues,
    "investment.json",
    files.investment.records.map(
      (row) =>
        `${row.regionSlug}:${row.year}:${row.sectorCode}:${row.investmentOrigin}:${row.recordType}`,
    ),
    "records",
  );
  addDuplicateIssues(
    issues,
    "exports.json",
    files.exports.records.map(
      (row) =>
        `${row.year}:${row.commoditySlug}:${row.hsCode ?? "hold"}:${row.productForm ?? "hold"}:${row.originRegionSlug}:${row.destinationCountryCode ?? "none"}:${row.recordType}`,
    ),
    "records",
  );
  addDuplicateIssues(
    issues,
    "smelters.json",
    files.smelters.records.map((row) => row.facilityCode),
    "records",
  );
  addDuplicateIssues(
    issues,
    "regulations.json",
    files.regulations.records.map((row) => row.id),
    "records",
  );

  files.smelters.records.forEach((record, index) => {
    if (
      record.canonicalSourceSlug !== null &&
      !sourceSlugs.has(record.canonicalSourceSlug)
    ) {
      issues.push({
        filePath: "smelters.json",
        path: `records.${index}.canonicalSourceSlug`,
        code: "unknown_source",
        message: "Sumber kanonik fasilitas tidak tersedia pada sourceCatalog",
      });
    }
    if (
      record.publicationStatus === "published" &&
      record.verificationStatus === "verified" &&
      record.canonicalSourceSlug === null
    ) {
      issues.push({
        filePath: "smelters.json",
        path: `records.${index}.canonicalSourceSlug`,
        code: "missing_public_source",
        message: "Fasilitas public wajib mempunyai sumber kanonik aktif dan verified",
      });
    }
  });

  files.regulations.records.forEach((record, index) => {
    for (const relatedId of record.relatedRegulationIds) {
      if (!files.regulations.records.some((candidate) => candidate.id === relatedId)) {
        issues.push({
          filePath: "regulations.json",
          path: `records.${index}.relatedRegulationIds`,
          code: "unknown_regulation",
          message: `Relasi regulasi ${relatedId} tidak tersedia dalam dataset`,
        });
      }
    }
  });

  return issues.length > 0
    ? { success: false, issues }
    : { success: true, data: { manifest, files }, issues: [] };
}

export async function loadEconomyImport(
  manifestPath: string,
): Promise<EconomyValidationResult> {
  const issues: EconomyValidationIssue[] = [];
  const resolvedManifestPath = resolve(manifestPath);

  const readJson = async (path: string, label: string): Promise<unknown> => {
    try {
      const stat = await lstat(path);
      if (stat.isSymbolicLink() || !stat.isFile()) {
        issues.push({
          filePath: label,
          path: "root",
          code: "invalid_file",
          message: "Hanya regular file, bukan symbolic link, yang diizinkan",
        });
        return undefined;
      }
      try {
        return JSON.parse(await readFile(path, "utf8")) as unknown;
      } catch {
        issues.push({
          filePath: label,
          path: "root",
          code: "invalid_json",
          message: "Isi file bukan JSON yang valid",
        });
      }
    } catch {
      issues.push({
        filePath: label,
        path: "root",
        code: "missing_file",
        message: "File tidak tersedia atau tidak dapat dibaca",
      });
    }
    return undefined;
  };

  const manifestInput = await readJson(resolvedManifestPath, "manifest.json");
  const parsedManifest = economyManifestSchema.safeParse(manifestInput);
  if (!parsedManifest.success) {
    const result = validateEconomyImport(manifestInput, []);
    return {
      success: false,
      issues: [...issues, ...(result.success ? [] : result.issues)],
    };
  }

  const base = dirname(resolvedManifestPath);
  const inputs = await Promise.all(
    parsedManifest.data.datasets.map(async (entry) => ({
      filePath: entry.filePath,
      data: await readJson(resolve(base, entry.filePath), entry.filePath),
    })),
  );
  const validation = validateEconomyImport(manifestInput, inputs);
  if (issues.length > 0) {
    return {
      success: false,
      issues: [...issues, ...(validation.success ? [] : validation.issues)],
    };
  }
  return validation;
}
