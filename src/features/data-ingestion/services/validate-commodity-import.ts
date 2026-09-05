import type { ZodError } from "zod";

import {
  commodityImportFileSchema,
  commodityImportManifestSchema,
  type CommodityImportFile,
  type CommodityImportManifest,
  type CommoditySourceReference,
} from "../schemas/commodity-import";

export type CommodityValidationIssue = {
  filePath: string;
  path: string;
  code: string;
  message: string;
};

export type CommodityImportFileInput = {
  filePath: string;
  input: unknown;
};

export type ValidatedCommodityImport = {
  manifest: CommodityImportManifest;
  commodityFiles: Array<{
    filePath: string;
    data: CommodityImportFile;
  }>;
};

export type CommodityValidationResult<T> =
  | {
      success: true;
      data: T;
      issues: [];
    }
  | {
      success: false;
      data: null;
      issues: CommodityValidationIssue[];
    };

function formatIssuePath(path: PropertyKey[]) {
  return path.length > 0 ? path.map(String).join(".") : "root";
}

function mapZodIssues(filePath: string, error: ZodError) {
  return error.issues.map<CommodityValidationIssue>((issue) => ({
    filePath,
    path: formatIssuePath(issue.path),
    code: issue.code,
    message: issue.message,
  }));
}

export function validateCommodityManifest(
  input: unknown,
  filePath = "data/staging/commodity/manifest.json",
): CommodityValidationResult<CommodityImportManifest> {
  const result = commodityImportManifestSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      data: null,
      issues: mapZodIssues(filePath, result.error),
    };
  }

  return {
    success: true,
    data: result.data,
    issues: [],
  };
}

export function validateCommodityFile(
  input: unknown,
  filePath: string,
): CommodityValidationResult<CommodityImportFile> {
  const result = commodityImportFileSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      data: null,
      issues: mapZodIssues(filePath, result.error),
    };
  }

  return {
    success: true,
    data: result.data,
    issues: [],
  };
}

function visitSourceReferences(
  commodityFile: CommodityImportFile,
  visit: (reference: CommoditySourceReference, path: string) => void,
) {
  commodityFile.profile.sources.forEach((source, index) => {
    visit(source, `profile.sources.${index}.sourceSlug`);
  });

  commodityFile.resourceStatistics.forEach((statistic, statisticIndex) => {
    visit(
      statistic.primarySource,
      `resourceStatistics.${statisticIndex}.primarySource.sourceSlug`,
    );

    statistic.supportingSources.forEach((source, sourceIndex) => {
      visit(
        source,
        `resourceStatistics.${statisticIndex}.supportingSources.${sourceIndex}.sourceSlug`,
      );
    });
  });

  commodityFile.productionLocations.forEach((location, index) => {
    visit(
      location.primarySource,
      `productionLocations.${index}.primarySource.sourceSlug`,
    );
  });

  commodityFile.globalStatisticSets.forEach((statisticSet, statisticSetIndex) => {
    if (statisticSet.primarySource !== null) {
      visit(
        statisticSet.primarySource,
        `globalStatisticSets.${statisticSetIndex}.primarySource.sourceSlug`,
      );
    }

    statisticSet.supportingSources.forEach((source, sourceIndex) => {
      visit(
        source,
        `globalStatisticSets.${statisticSetIndex}.supportingSources.${sourceIndex}.sourceSlug`,
      );
    });
  });

  commodityFile.producers.forEach((producer, index) => {
    visit(producer.primarySource, `producers.${index}.primarySource.sourceSlug`);
  });
}

export function validateCommodityImport(
  manifestInput: unknown,
  commodityFileInputs: CommodityImportFileInput[],
  manifestPath = "data/staging/commodity/manifest.json",
): CommodityValidationResult<ValidatedCommodityImport> {
  const manifestResult = validateCommodityManifest(manifestInput, manifestPath);

  if (!manifestResult.success) {
    return manifestResult;
  }

  const manifest = manifestResult.data;
  const issues: CommodityValidationIssue[] = [];
  const inputByPath = new Map<string, unknown>();

  for (const file of commodityFileInputs) {
    if (inputByPath.has(file.filePath)) {
      issues.push({
        filePath: file.filePath,
        path: "root",
        code: "duplicate_file_input",
        message: "File komoditas diberikan lebih dari satu kali",
      });
      continue;
    }

    inputByPath.set(file.filePath, file.input);
  }

  const commodityFiles: ValidatedCommodityImport["commodityFiles"] = [];

  for (const manifestEntry of manifest.commodityFiles) {
    if (!inputByPath.has(manifestEntry.filePath)) {
      issues.push({
        filePath: manifestEntry.filePath,
        path: "root",
        code: "missing_file",
        message: "File komoditas yang tercantum dalam manifest tidak tersedia",
      });
      continue;
    }

    const fileResult = validateCommodityFile(
      inputByPath.get(manifestEntry.filePath),
      manifestEntry.filePath,
    );

    if (!fileResult.success) {
      issues.push(...fileResult.issues);
      continue;
    }

    if (fileResult.data.commoditySlug !== manifestEntry.commoditySlug) {
      issues.push({
        filePath: manifestEntry.filePath,
        path: "commoditySlug",
        code: "commodity_slug_mismatch",
        message:
          `commoditySlug harus sama dengan manifest: ` +
          manifestEntry.commoditySlug,
      });
      continue;
    }

    commodityFiles.push({
      filePath: manifestEntry.filePath,
      data: fileResult.data,
    });
  }

  const sourceSlugs = new Set(
    manifest.sourceCatalog.map((source) => source.slug),
  );
  const countrySlugs = new Set(
    manifest.countryCatalog.map((country) => country.slug),
  );

  for (const commodityFile of commodityFiles) {
    visitSourceReferences(commodityFile.data, (source, path) => {
      if (!sourceSlugs.has(source.sourceSlug)) {
        issues.push({
          filePath: commodityFile.filePath,
          path,
          code: "unknown_source",
          message: `Source slug tidak tersedia di sourceCatalog: ${source.sourceSlug}`,
        });
      }
    });

    commodityFile.data.globalStatisticSets.forEach(
      (statisticSet, statisticSetIndex) => {
        statisticSet.entries.forEach((entry, entryIndex) => {
          if (!countrySlugs.has(entry.countryRegionSlug)) {
            issues.push({
              filePath: commodityFile.filePath,
              path:
                `globalStatisticSets.${statisticSetIndex}.entries.` +
                `${entryIndex}.countryRegionSlug`,
              code: "unknown_country",
              message:
                `Country region slug tidak tersedia di countryCatalog: ` +
                entry.countryRegionSlug,
            });
          }
        });
      },
    );
  }

  if (issues.length > 0) {
    return {
      success: false,
      data: null,
      issues,
    };
  }

  return {
    success: true,
    data: {
      manifest,
      commodityFiles,
    },
    issues: [],
  };
}
