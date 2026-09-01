import { describe, expect, it } from "vitest";

import operationSitesData from "../../../../data/staging/industry/operation-sites.json";
import reportsData from "../../../../data/staging/industry/reports.json";
import {
  industryCompanySlugs,
  industryCompanyPresentation,
} from "../content/industry-company-content";
import type {
  PublicIndustryCompanySummary,
  PublicIndustryFinancialRecord,
  PublicIndustryOperationSite,
  PublicIndustryProductionRecord,
} from "../types/industry";
import {
  buildFinancialRows,
  buildPrimaryProductionRows,
  filterOperationSitesByCompany,
  formatIndustryProductionBasis,
  formatIndustryProductionCell,
  getIndustryHeroStatistics,
  getIndustryMarkerColor,
} from "./industry-company-view";

function createCompany(
  slug: string,
  reportCount: number,
): PublicIndustryCompanySummary {
  return {
    id: `${slug}-id`,
    name: slug,
    slug,
    description: null,
    companyType: null,
    businessField: null,
    headquartersAddress: null,
    establishedYear: null,
    operationAreaDescription: null,
    officialWebsiteUrl: null,
    logoPath: "/images/industry/logos/test.png",
    displayOrder: 1,
    reportCount,
    availableReportYears: [],
    availableReportTypes: [],
  };
}

function createSite(
  id: string,
  companySlug: string,
): PublicIndustryOperationSite {
  return {
    id,
    name: id,
    slug: id,
    operatorName: "Operator",
    siteType: "mine",
    currentStatus: "operating",
    statusLabel: "Beroperasi",
    commoditySlugs: ["timah"],
    provinceName: "Kepulauan Bangka Belitung",
    regencyName: null,
    locationDescription: "Lokasi uji",
    latitude: "-2.1",
    longitude: "106.1",
    coordinatePrecision: "exact",
    displayOrder: 1,
    company: {
      name: companySlug,
      slug: companySlug,
      logoPath: "/images/industry/logos/test.png",
    },
    source: {
      name: "Sumber resmi",
      url: "https://example.com",
      pageReference: null,
      reportId: null,
    },
  };
}

function createProduction(
  metricCode: string,
  year: number,
  reportedValue: string,
): PublicIndustryProductionRecord {
  return {
    id: `${metricCode}-${year}`,
    year,
    metricCode,
    metricName:
      metricCode === "coal_production" ? "Batubara" : "Bijih timah",
    productName: "Produk",
    commodity: {
      name: metricCode === "coal_production" ? "Batubara" : "Timah",
      slug: metricCode === "coal_production" ? "batubara" : "timah",
      symbol: null,
    },
    productionValue: reportedValue,
    reportedValue,
    valueScale: 1,
    unit: { code: "ton", name: "Ton", symbol: "t" },
    reportedUnitLabel: "ton",
    productionBasis: "Produksi",
    recordType: "actual",
    source: {
      name: "Laporan resmi",
      url: "https://example.com/report",
      pageReference: null,
      reportId: null,
    },
  };
}

function createFinancial(
  metric: PublicIndustryFinancialRecord["metric"],
  year: number,
  reportedValue: string,
  currencyCode: "IDR" | "USD",
): PublicIndustryFinancialRecord {
  return {
    id: `${metric}-${year}`,
    year,
    metric,
    metricLabel: metric === "total_assets" ? "Total Aset" : "Pendapatan",
    amount: reportedValue,
    currencyCode,
    reportedValue,
    valueScale: 1_000_000,
    reportedUnitLabel: currencyCode === "IDR" ? "Rp juta" : "US$ juta",
    statementScope: "Konsolidasian",
    profitDefinition: null,
    auditStatus: "audited",
    presentation: {
      value: reportedValue,
      unitCode: currencyCode === "IDR" ? "trillion_idr" : "million_usd",
      unitLabel: currencyCode === "IDR" ? "Rp triliun" : "US$ juta",
      fractionDigits: 2,
    },
    source: {
      name: "Laporan resmi",
      url: "https://example.com/report",
      pageReference: null,
      reportId: null,
    },
  };
}

describe("Industry company view model", () => {
  it("memetakan tepat 12 perusahaan yang tersedia pada source of truth", () => {
    expect(industryCompanySlugs).toHaveLength(12);
    expect(industryCompanySlugs).toEqual(
      expect.arrayContaining([
        "alamtri-resources",
        "amman-mineral",
        "antam",
        "bayan-resources",
        "bukit-asam",
        "bumi-resources",
        "freeport-indonesia",
        "harum-energy",
        "merdeka-copper-gold",
        "timah",
        "trimegah-bangun-persada",
        "vale-indonesia",
      ]),
    );
  });

  it("menghitung statistik hero dari data publik yang diterima", () => {
    const companies = [createCompany("timah", 3), createCompany("antam", 4)];
    const sites = [createSite("site-1", "timah"), createSite("site-2", "antam")];

    expect(getIndustryHeroStatistics(companies, sites)).toEqual({
      companyCount: 2,
      reportCount: 7,
      operationSiteCount: 2,
    });
  });

  it("staging laporan hanya menghitung 35 laporan verified/published", () => {
    const publishedReports = reportsData.reports.filter(
      (report) =>
        report.verificationStatus === "verified" &&
        report.publicationStatus === "published",
    );

    expect(publishedReports).toHaveLength(35);
    expect(publishedReports).toHaveLength(reportsData.reportCount);
  });

  it("staging peta hanya memiliki 46 lokasi publik berkoordinat dan mengecualikan Juloi", () => {
    const publicSites = operationSitesData.filter(
      (site) =>
        site.isActive &&
        site.verificationStatus === "verified" &&
        site.publicationStatus === "published" &&
        site.latitude !== null &&
        site.longitude !== null &&
        site.coordinatePrecision !== null,
    );

    expect(publicSites).toHaveLength(46);
    expect(publicSites.some((site) => site.slug === "juloi-kalteng-sumber-barito")).toBe(false);
    expect(
      operationSitesData.find((site) => site.slug === "juloi-kalteng-sumber-barito"),
    ).toMatchObject({ verificationStatus: "pending", publicationStatus: "draft" });
  });

  it("memfilter marker berdasarkan perusahaan tanpa mengubah input", () => {
    const sites = [createSite("site-1", "timah"), createSite("site-2", "antam")];

    expect(filterOperationSitesByCompany(sites, "timah")).toEqual([sites[0]]);
    expect(filterOperationSitesByCompany(sites, "")).toEqual(sites);
  });

  it("menyediakan warna marker konsisten untuk seluruh perusahaan", () => {
    const colors = industryCompanySlugs.map(getIndustryMarkerColor);

    expect(colors).toHaveLength(12);
    expect(new Set(colors)).toHaveLength(12);
    expect(industryCompanyPresentation.timah.markerColor).toBe("#64748b");
  });

  it("menampilkan not_reported sebagai em dash, bukan nol", () => {
    expect(
      formatIndustryProductionCell({
        dataAvailability: "not_reported",
        reportedValue: null,
      }),
    ).toBe("—");
  });

  it("mempertahankan basis resmi untuk not_normalized", () => {
    expect(
      formatIndustryProductionBasis({
        dataAvailability: "not_normalized",
        reportedUnitLabel: "wmt",
      }),
    ).toBe("wmt · basis resmi belum dinormalisasi");
  });

  it("tabel produksi TIMAH hanya memuat komoditas primer", () => {
    const rows = buildPrimaryProductionRows({
      slug: "timah",
      production: [
        createProduction("tin_ore_contained_tin_production", 2023, "14855"),
        createProduction("coal_production", 2023, "438483"),
      ],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.key).toBe("tin_ore_contained_tin_production");
  });

  it("tabel finansial mempertahankan currency dan basis asli", () => {
    const rows = buildFinancialRows([
      createFinancial("total_assets", 2023, "42850000", "IDR"),
      createFinancial("revenue", 2023, "2033", "USD"),
    ]);

    expect(rows.map((row) => row.basis)).toEqual(["Rp juta", "US$ juta"]);
  });
});
