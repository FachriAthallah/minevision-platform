"use client";

import type {
  PublicIndustryCompanySummary,
  PublicIndustryOperationSite,
} from "@/features/industry/types/industry";
import type {
  IndustryCategory,
  IndustryReportCatalogItem,
} from "@/features/industry/types/industry-view";

import { IndustryCompaniesDirectory } from "./industry-companies-directory";
import { IndustryOperationExperience } from "./industry-operation-experience";
import { IndustryReportCatalog } from "./industry-report-catalog";
import { IndustryState } from "./industry-states";

type IndustryExplorerProps = {
  category: IndustryCategory;
  companies: PublicIndustryCompanySummary[];
  reports: IndustryReportCatalogItem[];
  operationSites: PublicIndustryOperationSite[];
  dataError: boolean;
};

export function IndustryExplorer({
  category,
  companies,
  reports,
  operationSites,
  dataError,
}: IndustryExplorerProps) {
  if (dataError) {
    return (
      <IndustryState
        kind="error"
        title="Data Industri belum dapat dimuat"
        description="Terjadi kendala saat mengambil data publik. Silakan muat ulang halaman atau coba kembali beberapa saat lagi."
      />
    );
  }

  if (companies.length === 0) {
    return (
      <IndustryState
        kind="companies"
        title="Data Industri belum tersedia"
        description="Belum ada perusahaan terverifikasi dan dipublikasikan yang dapat ditampilkan."
      />
    );
  }

  if (category === "reports") {
    return <IndustryReportCatalog companies={companies} reports={reports} />;
  }

  if (category === "operations") {
    return (
      <IndustryOperationExperience
        companies={companies}
        operationSites={operationSites}
      />
    );
  }

  return <IndustryCompaniesDirectory companies={companies} />;
}
