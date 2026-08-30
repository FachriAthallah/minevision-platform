import { promises as fs } from "node:fs";
import path from "node:path";

const sourceRoot = process.env.INDUSTRY_REPORTS_SOURCE_DIR;

if (!sourceRoot) {
  throw new Error(
    "INDUSTRY_REPORTS_SOURCE_DIR belum diatur. " +
      "Arahkan ke folder industry-reports-source.",
  );
}

const companies = new Map([
  [
    "alamtri-resources",
    {
      filePrefix: "alamtri",
      expectedYears: [2023, 2024, 2025],
    },
  ],
  [
    "amman-mineral",
    {
      filePrefix: "amman",
      expectedYears: [2023, 2024, 2025],
    },
  ],
  [
    "antam",
    {
      filePrefix: "antam",
      expectedYears: [2023, 2024, 2025],
    },
  ],
  [
    "bayan-resources",
    {
      filePrefix: "bayan",
      expectedYears: [2023, 2024, 2025],
    },
  ],
  [
    "bukit-asam",
    {
      filePrefix: "bukit-asam",
      expectedYears: [2023, 2024, 2025],
    },
  ],
  [
    "bumi-resources",
    {
      filePrefix: "bumi-resources",
      expectedYears: [2023, 2024, 2025],
    },
  ],
  [
    "freeport-indonesia",
    {
      filePrefix: "freeport",
      expectedYears: [2024, 2025],
    },
  ],
  [
    "harum-energy",
    {
      filePrefix: "harum",
      expectedYears: [2023, 2024, 2025],
    },
  ],
  [
    "merdeka-copper-gold",
    {
      filePrefix: "merdeka",
      expectedYears: [2023, 2024, 2025],
    },
  ],
  [
    "timah",
    {
      filePrefix: "timah",
      expectedYears: [2023, 2024, 2025],
    },
  ],
  [
    "trimegah-bangun-persada",
    {
      filePrefix: "trimegah",
      expectedYears: [2023, 2024, 2025],
    },
  ],
  [
    "vale-indonesia",
    {
      filePrefix: "vale",
      expectedYears: [2023, 2024, 2025],
    },
  ],
]);

const reportFilePattern =
  /^(.+)-(annual-report|sustainability-report)-(2023|2024|2025)\.pdf$/i;

const maximumFileSizeBytes = 50 * 1024 * 1024;
const expectedReportCount = 35;
const reports = [];

for (const [companySlug, companyConfig] of companies) {
  const companyDirectory = path.join(sourceRoot, companySlug);

  let directoryEntries;

  try {
    directoryEntries = await fs.readdir(companyDirectory, {
      withFileTypes: true,
    });
  } catch {
    throw new Error(`Folder perusahaan tidak ditemukan: ${companyDirectory}`);
  }

  const pdfEntries = directoryEntries.filter(
    (entry) =>
      entry.isFile() && path.extname(entry.name).toLowerCase() === ".pdf",
  );

  const discoveredYears = new Set();

  for (const entry of pdfEntries) {
    const match = entry.name.match(reportFilePattern);

    if (!match) {
      throw new Error(`Nama file tidak valid: ${companySlug}/${entry.name}`);
    }

    const [, filePrefix, rawReportType, rawYear] = match;

    if (filePrefix.toLowerCase() !== companyConfig.filePrefix) {
      throw new Error(
        `Prefix file tidak sesuai pada ${companySlug}/${entry.name}. ` +
          `Seharusnya menggunakan "${companyConfig.filePrefix}".`,
      );
    }

    const reportYear = Number(rawYear);
    const reportType = rawReportType.toLowerCase().replaceAll("-", "_");

    const absoluteFilePath = path.join(companyDirectory, entry.name);
    const fileStat = await fs.stat(absoluteFilePath);

    if (fileStat.size <= 0) {
      throw new Error(`PDF kosong: ${companySlug}/${entry.name}`);
    }

    if (fileStat.size > maximumFileSizeBytes) {
      throw new Error(`PDF melebihi 50 MB: ${companySlug}/${entry.name}`);
    }

    const localRelativePath = `${companySlug}/${entry.name}`;
    const reportLabel =
      reportType === "annual_report"
        ? "Annual Report"
        : "Sustainability Report";

    discoveredYears.add(reportYear);

    reports.push({
      companySlug,
      reportYear,
      reportType,
      title: `${reportLabel} ${reportYear}`,
      localRelativePath,
      storagePath: localRelativePath,
      fileName: entry.name,
      mimeType: "application/pdf",
      fileSizeBytes: fileStat.size,

      // Diisi dengan URL resmi sebelum proses import database.
      sourceUrl: null,

      verificationStatus: "verified",
      publicationStatus: "published",
    });
  }

  const actualYears = [...discoveredYears].sort();
  const expectedYears = [...companyConfig.expectedYears].sort();

  if (JSON.stringify(actualYears) !== JSON.stringify(expectedYears)) {
    throw new Error(
      `Tahun laporan ${companySlug} tidak sesuai. ` +
        `Ditemukan: ${actualYears.join(", ")}. ` +
        `Diharapkan: ${expectedYears.join(", ")}.`,
    );
  }
}

if (reports.length !== expectedReportCount) {
  throw new Error(
    `Jumlah laporan tidak sesuai. ` +
      `Ditemukan ${reports.length}, seharusnya ${expectedReportCount}.`,
  );
}

reports.sort(
  (firstReport, secondReport) =>
    firstReport.companySlug.localeCompare(secondReport.companySlug) ||
    firstReport.reportYear - secondReport.reportYear,
);

const totalSizeBytes = reports.reduce(
  (total, report) => total + report.fileSizeBytes,
  0,
);

const manifest = {
  schemaVersion: 1,
  reportCount: reports.length,
  companyCount: companies.size,
  totalSizeBytes,
  reports,
};

const outputPath = path.resolve(
  process.cwd(),
  "data/staging/industry/reports.json",
);

await fs.mkdir(path.dirname(outputPath), {
  recursive: true,
});

await fs.writeFile(
  outputPath,
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

const totalSizeMegabytes = (totalSizeBytes / (1024 * 1024)).toFixed(2);

console.log(`Manifest berhasil dibuat: ${outputPath}`);
console.log(`Perusahaan: ${companies.size}`);
console.log(`Laporan: ${reports.length}`);
console.log(`Total ukuran: ${totalSizeMegabytes} MB`);
