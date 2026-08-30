import { createReadStream } from "node:fs";
import { open, readFile, stat } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import * as tus from "tus-js-client";
import { z } from "zod";

config({
  path: ".env.local",
});

const BUCKET_NAME = "industry-reports";
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const TUS_CHUNK_SIZE_BYTES = 6 * 1024 * 1024;

const MANIFEST_PATH = resolve("data", "staging", "industry", "reports.json");

const environmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),

  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .refine(
      (value) => value.split(".").length === 3,
      "SUPABASE_SERVICE_ROLE_KEY harus berupa JWT tiga segmen.",
    ),
});

const reportSchema = z.object({
  companySlug: z.string().min(1),
  reportYear: z.number().int().min(2023).max(2025),
  reportType: z.enum(["annual_report", "sustainability_report"]),
  title: z.string().min(1),
  localRelativePath: z.string().min(1),
  storagePath: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.literal("application/pdf"),
  fileSizeBytes: z.number().int().positive(),
  sourceUrl: z.string().url().nullable(),
  verificationStatus: z.literal("verified"),
  publicationStatus: z.literal("published"),
});

const manifestSchema = z.object({
  schemaVersion: z.literal(1),
  reportCount: z.number().int().positive(),
  companyCount: z.number().int().positive(),
  totalSizeBytes: z.number().int().positive(),
  reports: z.array(reportSchema),
});

type IndustryReportManifestItem = z.infer<typeof reportSchema>;

function parseArguments() {
  const argumentsList = process.argv.slice(2);
  const execute = argumentsList.includes("--execute");

  const sourceRootArgument = argumentsList.find(
    (argument) => !argument.startsWith("--"),
  );

  if (!sourceRootArgument) {
    throw new Error(
      [
        "Lokasi folder sumber PDF wajib diberikan.",
        "",
        "Contoh:",
        'npm run data:upload:industry-reports -- "C:\\Projects\\MineVision\\industry-reports-source"',
      ].join("\n"),
    );
  }

  return {
    execute,
    sourceRoot: resolve(sourceRootArgument),
  };
}

function createStorageAdminClient(supabaseUrl: string, serviceRoleKey: string) {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

type StorageAdminClient = ReturnType<typeof createStorageAdminClient>;

function validateRelativePath(relativePath: string, label: string) {
  const normalized = relativePath.replaceAll("\\", "/");
  const segments = normalized.split("/");

  if (
    isAbsolute(relativePath) ||
    normalized.startsWith("/") ||
    segments.includes("..") ||
    segments.includes(".") ||
    segments.some((segment) => segment.length === 0)
  ) {
    throw new Error(`${label} tidak aman: ${relativePath}`);
  }
}

async function verifyPdfSignature(filePath: string) {
  const fileHandle = await open(filePath, "r");

  try {
    const signature = Buffer.alloc(5);

    await fileHandle.read(signature, 0, signature.length, 0);

    if (signature.toString("ascii") !== "%PDF-") {
      throw new Error(`File bukan PDF valid: ${filePath}`);
    }
  } finally {
    await fileHandle.close();
  }
}

async function validateManifestAndFiles(sourceRoot: string) {
  const rawManifest = await readFile(MANIFEST_PATH, "utf8");
  const manifest = manifestSchema.parse(JSON.parse(rawManifest));

  if (manifest.reportCount !== manifest.reports.length) {
    throw new Error(
      `reportCount ${manifest.reportCount} tidak sama dengan jumlah laporan ${manifest.reports.length}.`,
    );
  }

  if (manifest.reportCount !== 35) {
    throw new Error(
      `Jumlah laporan seharusnya 35, ditemukan ${manifest.reportCount}.`,
    );
  }

  const companySlugs = new Set(
    manifest.reports.map((report) => report.companySlug),
  );

  if (companySlugs.size !== manifest.companyCount) {
    throw new Error(
      `companyCount ${manifest.companyCount} tidak sama dengan jumlah slug perusahaan ${companySlugs.size}.`,
    );
  }

  if (manifest.companyCount !== 12) {
    throw new Error(
      `Jumlah perusahaan seharusnya 12, ditemukan ${manifest.companyCount}.`,
    );
  }

  const calculatedTotalSize = manifest.reports.reduce(
    (total, report) => total + report.fileSizeBytes,
    0,
  );

  if (calculatedTotalSize !== manifest.totalSizeBytes) {
    throw new Error(
      `Total ukuran manifest tidak cocok: ${calculatedTotalSize} != ${manifest.totalSizeBytes}.`,
    );
  }

  const storagePaths = new Set<string>();

  for (const report of manifest.reports) {
    validateRelativePath(report.localRelativePath, "localRelativePath");

    validateRelativePath(report.storagePath, "storagePath");

    if (storagePaths.has(report.storagePath)) {
      throw new Error(`storagePath duplikat: ${report.storagePath}`);
    }

    storagePaths.add(report.storagePath);

    if (basename(report.storagePath) !== report.fileName) {
      throw new Error(
        `fileName tidak cocok dengan storagePath: ${report.storagePath}`,
      );
    }

    if (report.fileSizeBytes > MAX_FILE_SIZE_BYTES) {
      throw new Error(`Ukuran file melebihi 50 MiB: ${report.storagePath}`);
    }

    const localFilePath = join(
      sourceRoot,
      ...report.localRelativePath.split("/"),
    );

    const fileInformation = await stat(localFilePath);

    if (!fileInformation.isFile()) {
      throw new Error(`Bukan file: ${localFilePath}`);
    }

    if (fileInformation.size !== report.fileSizeBytes) {
      throw new Error(
        [
          `Ukuran file berubah: ${report.localRelativePath}`,
          `Manifest: ${report.fileSizeBytes} byte`,
          `Aktual: ${fileInformation.size} byte`,
        ].join("\n"),
      );
    }

    await verifyPdfSignature(localFilePath);
  }

  return manifest;
}

function getDirectStorageEndpoint(supabaseUrl: string) {
  const hostname = new URL(supabaseUrl).hostname;
  const projectReferenceMatch = hostname.match(/^([a-z0-9-]+)\.supabase\.co$/);

  if (!projectReferenceMatch) {
    throw new Error(
      `Project reference tidak dapat diperoleh dari ${hostname}.`,
    );
  }

  return `https://${projectReferenceMatch[1]}.storage.supabase.co/storage/v1/upload/resumable`;
}

function getRemoteSize(metadata: Record<string, unknown> | null | undefined) {
  const rawSize =
    metadata?.size ?? metadata?.contentLength ?? metadata?.content_length;

  const parsedSize = Number(rawSize);

  return Number.isFinite(parsedSize) ? parsedSize : null;
}

async function findExistingObject(
  supabase: StorageAdminClient,
  report: IndustryReportManifestItem,
) {
  const folderPath = dirname(report.storagePath).replaceAll("\\", "/");

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(folderPath, {
      limit: 100,
      search: report.fileName,
    });

  if (error) {
    throw new Error(`Gagal memeriksa ${report.storagePath}: ${error.message}`);
  }

  return data.find((object) => object.name === report.fileName);
}

async function uploadReport({
  endpoint,
  localFilePath,
  report,
  serviceRoleKey,
}: {
  endpoint: string;
  localFilePath: string;
  report: IndustryReportManifestItem;
  serviceRoleKey: string;
}) {
  const fileStream = createReadStream(localFilePath);
  let lastDisplayedProgress = -10;

  await new Promise<void>((resolveUpload, rejectUpload) => {
    const upload = new tus.Upload(fileStream, {
      endpoint,
      uploadSize: report.fileSizeBytes,
      chunkSize: TUS_CHUNK_SIZE_BYTES,
      retryDelays: [0, 3000, 5000, 10000, 20000],

      headers: {
        authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "x-upsert": "false",
      },

      metadata: {
        bucketName: BUCKET_NAME,
        objectName: report.storagePath,
        contentType: report.mimeType,
        cacheControl: "3600",
      },

      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      addRequestId: true,

      onProgress(bytesUploaded, bytesTotal) {
        const progress = Math.floor((bytesUploaded / bytesTotal) * 100);

        const progressStep = Math.floor(progress / 10) * 10;

        if (progressStep >= lastDisplayedProgress + 10 || progress === 100) {
          lastDisplayedProgress = progressStep;

          console.log(`    Progres: ${progress.toString().padStart(3, " ")}%`);
        }
      },

      onError(error) {
        fileStream.destroy();
        rejectUpload(error);
      },

      onSuccess() {
        resolveUpload();
      },
    });

    upload.start();
  });
}

async function main() {
  const { execute, sourceRoot } = parseArguments();
  const environment = environmentSchema.parse(process.env);

  console.log("Memvalidasi manifest dan file laporan...");
  console.log(`Folder sumber: ${sourceRoot}`);

  const manifest = await validateManifestAndFiles(sourceRoot);

  console.log(
    `[OK] ${manifest.reportCount} PDF dari ${manifest.companyCount} perusahaan valid.`,
  );

  console.log(
    `[OK] Total ukuran: ${manifest.totalSizeBytes.toLocaleString("id-ID")} byte.`,
  );

  if (!execute) {
    console.log("");
    console.log("DRY-RUN selesai. Belum ada file yang diunggah.");
    console.log("Gunakan opsi --execute setelah hasil ini dipastikan aman.");

    return;
  }

  const supabase = createStorageAdminClient(
    environment.NEXT_PUBLIC_SUPABASE_URL,
    environment.SUPABASE_SERVICE_ROLE_KEY,
  );

  const endpoint = getDirectStorageEndpoint(
    environment.NEXT_PUBLIC_SUPABASE_URL,
  );

  let uploadedCount = 0;
  let skippedCount = 0;

  for (const [index, report] of manifest.reports.entries()) {
    console.log("");
    console.log(`[${index + 1}/${manifest.reportCount}] ${report.storagePath}`);

    const existingObject = await findExistingObject(supabase, report);

    if (existingObject) {
      const remoteSize = getRemoteSize(
        existingObject.metadata as Record<string, unknown> | null | undefined,
      );

      if (remoteSize === report.fileSizeBytes) {
        console.log("    [SKIP] File sudah tersedia dan ukurannya cocok.");
        skippedCount += 1;

        continue;
      }

      throw new Error(
        [
          `File sudah tersedia tetapi ukurannya berbeda: ${report.storagePath}`,
          `Manifest: ${report.fileSizeBytes} byte`,
          `Storage: ${remoteSize ?? "tidak diketahui"} byte`,
          "File tidak ditimpa otomatis.",
        ].join("\n"),
      );
    }

    const localFilePath = join(
      sourceRoot,
      ...report.localRelativePath.split("/"),
    );

    await uploadReport({
      endpoint,
      localFilePath,
      report,
      serviceRoleKey: environment.SUPABASE_SERVICE_ROLE_KEY,
    });

    const uploadedObject = await findExistingObject(supabase, report);

    const uploadedSize = getRemoteSize(
      uploadedObject?.metadata as Record<string, unknown> | null | undefined,
    );

    if (!uploadedObject || uploadedSize !== report.fileSizeBytes) {
      throw new Error(`Verifikasi setelah upload gagal: ${report.storagePath}`);
    }

    console.log("    [OK] Upload dan verifikasi berhasil.");
    uploadedCount += 1;
  }

  console.log("");
  console.log("Upload laporan selesai.");
  console.log(`Berhasil diunggah: ${uploadedCount}`);
  console.log(`Dilewati: ${skippedCount}`);
  console.log(`Total manifest: ${manifest.reportCount}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error("");
  console.error(`[GAGAL] ${message}`);

  process.exitCode = 1;
});
