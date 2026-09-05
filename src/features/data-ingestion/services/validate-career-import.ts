import type { ZodError } from "zod";

import {
  careerImportFileSchema,
  careerImportManifestSchema,
  type CareerImportFile,
  type CareerImportManifest,
} from "../schemas/career-import";

export type CareerValidationIssue = {
  filePath: string;
  path: string;
  code: string;
  message: string;
};

export type CareerImportFileInput = {
  filePath: string;
  input: unknown;
};

export type ValidatedCareerImport = {
  manifest: CareerImportManifest;
  categoryFiles: Array<{
    filePath: string;
    data: CareerImportFile;
  }>;
};

export type CareerValidationResult<T> =
  | {
      success: true;
      data: T;
      issues: [];
    }
  | {
      success: false;
      data: null;
      issues: CareerValidationIssue[];
    };

function formatIssuePath(path: PropertyKey[]) {
  return path.length > 0 ? path.map(String).join(".") : "root";
}

function mapZodIssues(filePath: string, error: ZodError) {
  return error.issues.map<CareerValidationIssue>((issue) => ({
    filePath,
    path: formatIssuePath(issue.path),
    code: issue.code,
    message: issue.message,
  }));
}

export function validateCareerManifest(
  input: unknown,
  filePath = "data/staging/career/manifest.json",
): CareerValidationResult<CareerImportManifest> {
  const result = careerImportManifestSchema.safeParse(input);

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

export function validateCareerFile(
  input: unknown,
  filePath: string,
): CareerValidationResult<CareerImportFile> {
  const result = careerImportFileSchema.safeParse(input);

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

export function validateCareerImport(
  manifestInput: unknown,
  categoryFileInputs: CareerImportFileInput[],
  manifestPath = "data/staging/career/manifest.json",
): CareerValidationResult<ValidatedCareerImport> {
  const manifestResult = validateCareerManifest(manifestInput, manifestPath);

  if (!manifestResult.success) {
    return manifestResult;
  }

  const manifest = manifestResult.data;
  const issues: CareerValidationIssue[] = [];
  const expectedPaths = new Set(
    manifest.categoryFiles.map((entry) => entry.filePath),
  );
  const inputByPath = new Map<string, unknown>();

  for (const file of categoryFileInputs) {
    if (!expectedPaths.has(file.filePath)) {
      issues.push({
        filePath: file.filePath,
        path: "root",
        code: "unexpected_file",
        message: "File kategori tidak tercantum dalam manifest Career",
      });
      continue;
    }

    if (inputByPath.has(file.filePath)) {
      issues.push({
        filePath: file.filePath,
        path: "root",
        code: "duplicate_file_input",
        message: "File kategori diberikan lebih dari satu kali",
      });
      continue;
    }

    inputByPath.set(file.filePath, file.input);
  }

  const categoryFiles: ValidatedCareerImport["categoryFiles"] = [];

  for (const manifestEntry of manifest.categoryFiles) {
    if (!inputByPath.has(manifestEntry.filePath)) {
      issues.push({
        filePath: manifestEntry.filePath,
        path: "root",
        code: "missing_file",
        message: "File kategori yang tercantum dalam manifest tidak tersedia",
      });
      continue;
    }

    const fileResult = validateCareerFile(
      inputByPath.get(manifestEntry.filePath),
      manifestEntry.filePath,
    );

    if (!fileResult.success) {
      issues.push(...fileResult.issues);
      continue;
    }

    if (fileResult.data.categorySlug !== manifestEntry.categorySlug) {
      issues.push({
        filePath: manifestEntry.filePath,
        path: "categorySlug",
        code: "category_slug_mismatch",
        message:
          `categorySlug harus sama dengan manifest: ` +
          manifestEntry.categorySlug,
      });
      continue;
    }

    categoryFiles.push({
      filePath: manifestEntry.filePath,
      data: fileResult.data,
    });
  }

  const sourceSlugs = new Set(
    manifest.sourceCatalog.map((source) => source.slug),
  );
  const firstFileByDisplayOrder = new Map<number, string>();

  for (const categoryFile of categoryFiles) {
    categoryFile.data.profile.sources.forEach((source, index) => {
      if (!sourceSlugs.has(source.sourceSlug)) {
        issues.push({
          filePath: categoryFile.filePath,
          path: `profile.sources.${index}.sourceSlug`,
          code: "unknown_source",
          message:
            `Source slug tidak tersedia di sourceCatalog: ` +
            source.sourceSlug,
        });
      }
    });

    const displayOrder = categoryFile.data.category.displayOrder;

    if (firstFileByDisplayOrder.has(displayOrder)) {
      issues.push({
        filePath: categoryFile.filePath,
        path: "category.displayOrder",
        code: "duplicate_category_display_order",
        message:
          `Display order kategori ${displayOrder} sudah digunakan oleh ` +
          firstFileByDisplayOrder.get(displayOrder),
      });
    } else {
      firstFileByDisplayOrder.set(displayOrder, categoryFile.filePath);
    }
  }

  for (let displayOrder = 1; displayOrder <= 13; displayOrder += 1) {
    if (!firstFileByDisplayOrder.has(displayOrder)) {
      issues.push({
        filePath: manifestPath,
        path: "categoryFiles",
        code: "missing_category_display_order",
        message: `Urutan kategori wajib belum tersedia: ${displayOrder}`,
      });
    }
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
      categoryFiles,
    },
    issues: [],
  };
}
