import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getPublicIndustryCompaniesMock } = vi.hoisted(() => ({
  getPublicIndustryCompaniesMock: vi.fn(),
}));

vi.mock(
  "@/features/industry/server/get-public-industry-companies",
  () => ({
    getPublicIndustryCompanies: getPublicIndustryCompaniesMock,
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
};

describe("GET /api/v1/industry/companies", () => {
  beforeEach(() => {
    getPublicIndustryCompaniesMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("mengembalikan daftar perusahaan dengan filter valid", async () => {
    getPublicIndustryCompaniesMock.mockResolvedValue([sampleCompany]);

    const request = new NextRequest(
      "http://localhost/api/v1/industry/companies" +
        "?search=vale" +
        "&reportYear=2024" +
        "&reportType=annual_report",
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=300, stale-while-revalidate=600",
    );
    expect(getPublicIndustryCompaniesMock).toHaveBeenCalledWith({
      search: "vale",
      reportYear: 2024,
      reportType: "annual_report",
    });
    expect(body).toEqual({
      success: true,
      data: [sampleCompany],
      meta: {
        count: 1,
        filters: {
          search: "vale",
          reportYear: 2024,
          reportType: "annual_report",
        },
      },
    });
  });

  it("mengembalikan 400 untuk filter tidak valid", async () => {
    const request = new NextRequest(
      "http://localhost/api/v1/industry/companies?reportYear=2022",
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toMatchObject({
      success: false,
      error: {
        code: "INVALID_QUERY",
      },
    });
    expect(getPublicIndustryCompaniesMock).not.toHaveBeenCalled();
  });

  it("mengembalikan 500 ketika data access gagal", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    getPublicIndustryCompaniesMock.mockRejectedValue(
      new Error("Database unavailable"),
    );

    const request = new NextRequest(
      "http://localhost/api/v1/industry/companies",
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toEqual({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Daftar perusahaan belum dapat dimuat.",
      },
    });
    expect(consoleErrorSpy).toHaveBeenCalledOnce();
  });
});
