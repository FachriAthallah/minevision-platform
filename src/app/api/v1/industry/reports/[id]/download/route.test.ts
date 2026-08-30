import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  createSignedUrlMock,
  getPublicIndustryReportDownloadMock,
  getStorageAdminClientMock,
  storageFromMock,
} = vi.hoisted(() => {
  const createSignedUrl = vi.fn();
  const storageFrom = vi.fn(() => ({
    createSignedUrl,
  }));

  return {
    createSignedUrlMock: createSignedUrl,
    getPublicIndustryReportDownloadMock: vi.fn(),
    getStorageAdminClientMock: vi.fn(() => ({
      storage: {
        from: storageFrom,
      },
    })),
    storageFromMock: storageFrom,
  };
});

vi.mock(
  "@/features/industry/server/get-public-industry-report-download",
  () => ({
    getPublicIndustryReportDownload: getPublicIndustryReportDownloadMock,
  }),
);

vi.mock("@/lib/supabase/admin", () => ({
  getStorageAdminClient: getStorageAdminClientMock,
}));

import { GET } from "./route";

const reportId = "22222222-2222-4222-8222-222222222222";

describe("GET /api/v1/industry/reports/[id]/download", () => {
  beforeEach(() => {
    createSignedUrlMock.mockReset();
    getPublicIndustryReportDownloadMock.mockReset();
    getStorageAdminClientMock.mockClear();
    storageFromMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("mengalihkan permintaan ke signed URL berumur pendek", async () => {
    getPublicIndustryReportDownloadMock.mockResolvedValue({
      storagePath: "vale-indonesia/vale-annual-report-2024.pdf",
      fileName: "vale-annual-report-2024.pdf",
    });
    createSignedUrlMock.mockResolvedValue({
      data: {
        signedUrl:
          "https://example.supabase.co/storage/v1/object/sign/industry-reports/file.pdf?token=test",
      },
      error: null,
    });

    const request = new NextRequest(
      `http://localhost/api/v1/industry/reports/${reportId}/download`,
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: reportId }),
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("Location")).toContain(
      "https://example.supabase.co/storage/v1/object/sign/",
    );
    expect(storageFromMock).toHaveBeenCalledWith("industry-reports");
    expect(createSignedUrlMock).toHaveBeenCalledWith(
      "vale-indonesia/vale-annual-report-2024.pdf",
      60,
      {
        download: "vale-annual-report-2024.pdf",
      },
    );
  });

  it("mengembalikan 400 untuk ID tidak valid", async () => {
    const request = new NextRequest(
      "http://localhost/api/v1/industry/reports/bukan-uuid/download",
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: "bukan-uuid" }),
    });

    expect(response.status).toBe(400);
    expect(getPublicIndustryReportDownloadMock).not.toHaveBeenCalled();
    expect(getStorageAdminClientMock).not.toHaveBeenCalled();
  });

  it("mengembalikan 404 untuk laporan yang tidak publik", async () => {
    getPublicIndustryReportDownloadMock.mockResolvedValue(null);

    const request = new NextRequest(
      `http://localhost/api/v1/industry/reports/${reportId}/download`,
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: reportId }),
    });

    expect(response.status).toBe(404);
    expect(getStorageAdminClientMock).not.toHaveBeenCalled();
  });

  it("mengembalikan 500 ketika Storage gagal membuat signed URL", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    getPublicIndustryReportDownloadMock.mockResolvedValue({
      storagePath: "vale-indonesia/vale-annual-report-2024.pdf",
      fileName: "vale-annual-report-2024.pdf",
    });
    createSignedUrlMock.mockResolvedValue({
      data: null,
      error: new Error("Storage unavailable"),
    });

    const request = new NextRequest(
      `http://localhost/api/v1/industry/reports/${reportId}/download`,
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: reportId }),
    });

    expect(response.status).toBe(500);
    expect(consoleErrorSpy).toHaveBeenCalledOnce();
  });
});
