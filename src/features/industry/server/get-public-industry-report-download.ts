import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { industryCompanies, industryReports } from "@/db/schema";

export type PublicIndustryReportDownload = {
  storagePath: string;
  fileName: string;
};

export async function getPublicIndustryReportDownload(
  reportId: string,
): Promise<PublicIndustryReportDownload | null> {
  const [report] = await db
    .select({
      storagePath: industryReports.storagePath,
      fileName: industryReports.fileName,
    })
    .from(industryReports)
    .innerJoin(
      industryCompanies,
      eq(industryReports.companyId, industryCompanies.id),
    )
    .where(
      and(
        eq(industryReports.id, reportId),
        eq(industryReports.verificationStatus, "verified"),
        eq(industryReports.publicationStatus, "published"),
        eq(industryCompanies.isActive, true),
        eq(industryCompanies.verificationStatus, "verified"),
        eq(industryCompanies.publicationStatus, "published"),
      ),
    )
    .limit(1);

  return report ?? null;
}
