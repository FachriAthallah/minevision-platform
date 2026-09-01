import { describe, expect, it } from "vitest";

import type { PublicIndustryCompanySummary } from "../types/industry";
import type { IndustryReportCatalogItem } from "../types/industry-view";
import {
  filterIndustryCompanies,
  filterIndustryReports,
  formatFileSize,
  formatIndustryReportType,
  getIndustryReportDownloadUrl,
  parseIndustryCategory,
} from "./industry-view";

const companies: PublicIndustryCompanySummary[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "PT Vale Indonesia Tbk",
    slug: "vale-indonesia",
    description: "Perusahaan pertambangan nikel terintegrasi.",
    companyType: "Perusahaan terbuka",
    businessField: "Pertambangan dan pengolahan nikel",
    headquartersAddress: "Jakarta",
    establishedYear: 1968,
    operationAreaDescription: "Sorowako, Sulawesi Selatan",
    officialWebsiteUrl: "https://vale.com/indonesia",
    logoPath: "/images/industry/logos/vale.png",
    displayOrder: 1,
    reportCount: 1,
    availableReportYears: [2025],
    availableReportTypes: ["annual_report"],
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "PT Bukit Asam Tbk",
    slug: "bukit-asam",
    description: "Perusahaan pertambangan batubara.",
    companyType: "BUMN",
    businessField: "Pertambangan batubara",
    headquartersAddress: "Tanjung Enim",
    establishedYear: 1981,
    operationAreaDescription: "Sumatera Selatan dan Riau",
    officialWebsiteUrl: null,
    logoPath: "/images/industry/logos/bukitasam.png",
    displayOrder: 2,
    reportCount: 1,
    availableReportYears: [2024],
    availableReportTypes: ["sustainability_report"],
  },
];

const reports: IndustryReportCatalogItem[] = [
  {
    id: "33333333-3333-4333-8333-333333333333",
    reportYear: 2025,
    reportType: "annual_report",
    title: "Annual Report 2025",
    fileName: "vale-annual-report-2025.pdf",
    mimeType: "application/pdf",
    fileSizeBytes: 1_048_576,
    sourceUrl: null,
    publishedAt: null,
    downloadUrl:
      "/api/v1/industry/reports/33333333-3333-4333-8333-333333333333/download",
    companyId: companies[0].id,
    companyName: companies[0].name,
    companySlug: companies[0].slug,
    companyLogoPath: companies[0].logoPath,
    companyDisplayOrder: companies[0].displayOrder,
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    reportYear: 2024,
    reportType: "sustainability_report",
    title: "Sustainability Report 2024",
    fileName: "ptba-sustainability-report-2024.pdf",
    mimeType: "application/pdf",
    fileSizeBytes: 2_097_152,
    sourceUrl: null,
    publishedAt: null,
    downloadUrl:
      "/api/v1/industry/reports/44444444-4444-4444-8444-444444444444/download",
    companyId: companies[1].id,
    companyName: companies[1].name,
    companySlug: companies[1].slug,
    companyLogoPath: companies[1].logoPath,
    companyDisplayOrder: companies[1].displayOrder,
  },
];

describe("Industry public UI helpers", () => {
  it("menggunakan kategori companies untuk nilai URL yang tidak dikenal", () => {
    expect(parseIndustryCategory(undefined)).toBe("companies");
    expect(parseIndustryCategory("reports")).toBe("reports");
    expect(parseIndustryCategory("kategori-lama")).toBe("companies");
  });

  it("memfilter perusahaan berdasarkan nama dan bidang usaha", () => {
    expect(filterIndustryCompanies(companies, "vale")).toHaveLength(1);
    expect(filterIndustryCompanies(companies, "batubara")[0]?.slug).toBe(
      "bukit-asam",
    );
  });

  it("memfilter laporan berdasarkan pencarian, perusahaan, tahun, dan tipe", () => {
    expect(
      filterIndustryReports(reports, {
        search: "sustainability",
        companySlug: "bukit-asam",
        reportYear: "2024",
        reportType: "sustainability_report",
      }),
    ).toEqual([reports[1]]);
  });

  it("memetakan label laporan dan format ukuran file", () => {
    expect(formatIndustryReportType("annual_report")).toBe(
      "Laporan Tahunan",
    );
    expect(formatIndustryReportType("sustainability_report")).toBe(
      "Laporan Keberlanjutan",
    );
    expect(formatFileSize(1_048_576)).toBe("1 MB");
    expect(formatFileSize(0)).toBe("Ukuran tidak tersedia");
  });

  it("membuat URL download internal tanpa Storage URL", () => {
    expect(
      getIndustryReportDownloadUrl(
        "33333333-3333-4333-8333-333333333333",
      ),
    ).toBe(
      "/api/v1/industry/reports/33333333-3333-4333-8333-333333333333/download",
    );
  });
});
