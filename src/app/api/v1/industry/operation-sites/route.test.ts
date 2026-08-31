import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getPublicIndustryOperationSitesMock } = vi.hoisted(() => ({
  getPublicIndustryOperationSitesMock: vi.fn(),
}));

vi.mock(
  "@/features/industry/server/get-public-industry-operation-sites",
  () => ({
    getPublicIndustryOperationSites: getPublicIndustryOperationSitesMock,
  }),
);

import { GET } from "./route";

const sampleOperationSite = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Sorowako Operations",
  slug: "sorowako-operations",
  operatorName: "PT Vale Indonesia Tbk",
  siteType: "industrial_complex",
  currentStatus: "operating",
  statusLabel: "Beroperasi",
  commoditySlugs: ["nikel"],
  provinceName: "Sulawesi Selatan",
  regencyName: "Luwu Timur",
  locationDescription: "Sorowako, Luwu Timur, Sulawesi Selatan",
  latitude: "-2.5367000",
  longitude: "121.3574000",
  coordinatePrecision: "approximate",
  displayOrder: 1,
  company: {
    name: "PT Vale Indonesia Tbk",
    slug: "vale-indonesia",
    logoPath: "/images/industry/logos/vale.png",
  },
  source: {
    name: "PT Vale Indonesia - Operations",
    url: "https://vale.com/indonesia/operations",
    pageReference: null,
    reportId: null,
  },
};

describe("GET /api/v1/industry/operation-sites", () => {
  beforeEach(() => {
    getPublicIndustryOperationSitesMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("mengembalikan marker wilayah operasi berdasarkan perusahaan", async () => {
    getPublicIndustryOperationSitesMock.mockResolvedValue([
      sampleOperationSite,
    ]);

    const request = new NextRequest(
      "http://localhost/api/v1/industry/operation-sites?companySlug=VALE-INDONESIA",
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=300, stale-while-revalidate=600",
    );
    expect(getPublicIndustryOperationSitesMock).toHaveBeenCalledWith({
      companySlug: "vale-indonesia",
    });
    expect(body).toEqual({
      success: true,
      data: [sampleOperationSite],
      meta: {
        count: 1,
        filters: {
          companySlug: "vale-indonesia",
        },
      },
    });
  });

  it("mengembalikan 400 untuk slug perusahaan yang tidak valid", async () => {
    const request = new NextRequest(
      "http://localhost/api/v1/industry/operation-sites?companySlug=vale_indonesia",
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
    expect(getPublicIndustryOperationSitesMock).not.toHaveBeenCalled();
  });

  it("mengembalikan 500 ketika data access gagal", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    getPublicIndustryOperationSitesMock.mockRejectedValue(
      new Error("Database unavailable"),
    );

    const request = new NextRequest(
      "http://localhost/api/v1/industry/operation-sites",
    );

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toEqual({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Wilayah operasi belum dapat dimuat.",
      },
    });
    expect(consoleErrorSpy).toHaveBeenCalledOnce();
  });
});
