import { lstat, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import {
  validateCareerImport,
  validateCareerManifest,
  type CareerImportFileInput,
  type CareerValidationIssue,
} from "../src/features/data-ingestion/services/validate-career-import";

function printIssues(issues: CareerValidationIssue[]) {
  console.error("\nDataset Career tidak valid:");

  for (const issue of issues) {
    console.error(
      `- ${issue.filePath} :: ${issue.path} ` +
        `[${issue.code}]: ${issue.message}`,
    );
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Kesalahan tidak diketahui";
}

function isMissingFileError(error: unknown) {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as Error & { code?: unknown }).code === "ENOENT"
  );
}

async function main() {
  const inputArgument = process.argv[2];

  if (!inputArgument) {
    throw new Error(
      "Lokasi manifest wajib diberikan. Contoh: " +
        "npm run data:validate:career -- " +
        "data/staging/career/manifest.json",
    );
  }

  const manifestPath = resolve(process.cwd(), inputArgument);

  console.log(`Memvalidasi manifest Career: ${manifestPath}`);

  let manifestInput: unknown;

  try {
    const manifestStatus = await lstat(manifestPath);

    if (!manifestStatus.isFile()) {
      printIssues([
        {
          filePath: inputArgument,
          path: "root",
          code: "not_regular_file",
          message: "Manifest harus berupa regular file dan bukan symbolic link",
        },
      ]);
      process.exitCode = 1;
      return;
    }

    manifestInput = JSON.parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    printIssues([
      {
        filePath: inputArgument,
        path: "root",
        code: "invalid_json_or_file",
        message:
          `Manifest tidak dapat dibaca sebagai JSON valid: ` +
          getErrorMessage(error),
      },
    ]);
    process.exitCode = 1;
    return;
  }

  const manifestResult = validateCareerManifest(manifestInput, inputArgument);

  if (!manifestResult.success) {
    printIssues(manifestResult.issues);
    process.exitCode = 1;
    return;
  }

  const manifestDirectory = dirname(manifestPath);
  const fileInputs: CareerImportFileInput[] = [];
  const loadIssues: CareerValidationIssue[] = [];

  for (const categoryFile of manifestResult.data.categoryFiles) {
    const absoluteFilePath = resolve(manifestDirectory, categoryFile.filePath);

    try {
      const fileStatus = await lstat(absoluteFilePath);

      if (!fileStatus.isFile()) {
        loadIssues.push({
          filePath: categoryFile.filePath,
          path: "root",
          code: "not_regular_file",
          message: "Target harus berupa regular file dan bukan symbolic link",
        });
        continue;
      }

      const fileContent = await readFile(absoluteFilePath, "utf8");

      try {
        fileInputs.push({
          filePath: categoryFile.filePath,
          input: JSON.parse(fileContent) as unknown,
        });
      } catch (error) {
        loadIssues.push({
          filePath: categoryFile.filePath,
          path: "root",
          code: "invalid_json",
          message: `File bukan JSON yang valid: ${getErrorMessage(error)}`,
        });
      }
    } catch (error) {
      loadIssues.push({
        filePath: categoryFile.filePath,
        path: "root",
        code: isMissingFileError(error) ? "missing_file" : "file_read_error",
        message: isMissingFileError(error)
          ? "File kategori yang tercantum dalam manifest tidak tersedia"
          : `File tidak dapat dibaca: ${getErrorMessage(error)}`,
      });
    }
  }

  const validationResult = validateCareerImport(
    manifestInput,
    fileInputs,
    inputArgument,
  );
  const unavailableFiles = new Set(
    loadIssues.map((issue) => issue.filePath),
  );
  const structureIssues = validationResult.success
    ? []
    : validationResult.issues.filter(
        (issue) =>
          issue.code !== "missing_file" ||
          !unavailableFiles.has(issue.filePath),
      );
  const issues = [...loadIssues, ...structureIssues];

  if (issues.length > 0 || !validationResult.success) {
    printIssues(issues);
    process.exitCode = 1;
    return;
  }

  const professionCount = validationResult.data.categoryFiles.reduce(
    (total, file) => total + file.data.professions.length,
    0,
  );
  const profileItemCount = validationResult.data.categoryFiles.reduce(
    (total, file) => total + file.data.profileItems.length,
    0,
  );

  console.log("\nDataset Career valid.");
  console.log(`Categories  : ${validationResult.data.categoryFiles.length}`);
  console.log(`Sources     : ${validationResult.data.manifest.sourceCatalog.length}`);
  console.log(`Professions : ${professionCount}`);
  console.log(`Profile item: ${profileItemCount}`);
}

main().catch((error: unknown) => {
  console.error("\nValidasi dataset Career gagal:", getErrorMessage(error));
  process.exitCode = 1;
});
