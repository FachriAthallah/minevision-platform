import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getPublicIndustryCompanyBySlugMock } = vi.hoisted(() => ({
  getPublicIndustryCompanyBySlugMock: vi.fn(),
}));

vi.mock(
  "@/features/industry/server/get-public-industry-company",
  () => ({
    getPublicIndustryCompanyBySlug: getPublicIndustryCompanyBySlugMock,
  }),
);

import { GET } from "./route";

const sampleCompany = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "PT Vale Indonesia Tbk",
  slug: "vale-indonesia",
  description: "Perusahaan pertambangan dan pengolahan nikel.",
  companyType: "Perusahaan terbuka",
  businessField: "Pertambangan dan pengolahan nikel",
  headquartersAddress: "Jakarta",
  establishedYear: 1968,
  operationAreaDescription: "Sulawesi Selatan",
  officialWebsiteUrl: "https://vale.com/indonesia",
  logoPath: "/images/industry/logos/vale.png",
  displayOrder: 12,
  reportCount: 1,
  availableReportYears: [2024],
  availableReportTypes: ["annual_report"],
  reports: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      reportYear: 2024,
      reportType: "annual_report",
      title: "Annual Report 2024",
      fileName: "vale-annual-report-2024.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 1024,
      sourceUrl: null,
      publishedAt: "2025-03-01T00:00:00.000Z",
      downloadUrl:
        "/api/v1/industry/reports/22222222-2222-4222-8222-222222222222/download",
    },
  ],
  production: [],
  financials: [],
  operationSites: [],
  dataSummary: {
    productionRecordCount: 0,
    financialRecordCount: 0,
    operationSiteCount: 0,
    productionYears: [],
    financialYears: [],
  },
};

describe("GET /api/v1/industry/companies/[slug]", () => {
  beforeEach(() => {
    getPublicIndustryCompanyBySlugMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("mengembalikan detail perusahaan yang tersedia", async () => {
    getPublicIndustryCompanyBySlugMock.mockResolvedValue(sampleCompany);

    const request = new NextRequest(
      "http://localhost/api/v1/industry/companies/vale-indonesia",
    );

    const response = await GET(request, {
      params: Promise.resolve({ slug: "VALE-INDONESIA" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getPublicIndustryCompanyBySlugMock).toHaveBeenCalledWith(
      "vale-indonesia",
    );
    expect(body).toEqual({
      success: true,
      data: sampleCompany,
    });
  });

  it("mengembalikan 400 untuk slug tidak valid", async () => {
    const request = new NextRequest(
      "http://localhost/api/v1/industry/companies/vale_indonesia",
    );

    const response = await GET(request, {
      params: Promise.resolve({ slug: "vale_indonesia" }),
    });

    expect(response.status).toBe(400);
    expect(getPublicIndustryCompanyBySlugMock).not.toHaveBeenCalled();
  });

  it("mengembalikan 404 ketika perusahaan tidak tersedia", async () => {
    getPublicIndustryCompanyBySlugMock.mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost/api/v1/industry/companies/tidak-tersedia",
    );

    const response = await GET(request, {
      params: Promise.resolve({ slug: "tidak-tersedia" }),
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      success: false,
      error: {
        code: "COMPANY_NOT_FOUND",
        message: "Perusahaan tidak ditemukan.",
      },
    });
  });
});
