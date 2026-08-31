import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { IndustryCompanyDetail } from "@/features/industry/components/industry-company-detail";
import { industryCompanySlugSchema } from "@/features/industry/schemas/industry-query";
import { getPublicIndustryCompanyBySlug } from "@/features/industry/server/get-public-industry-company";

type IndustryCompanyPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const getCompany = cache(getPublicIndustryCompanyBySlug);

export async function generateMetadata({
  params,
}: IndustryCompanyPageProps): Promise<Metadata> {
  const validationResult = industryCompanySlugSchema.safeParse(
    (await params).slug,
  );

  if (!validationResult.success) {
    return {
      title: "Perusahaan tidak ditemukan",
    };
  }

  const company = await getCompany(validationResult.data);

  if (!company) {
    return {
      title: "Perusahaan tidak ditemukan",
    };
  }

  return {
    title: `${company.name} | Industry`,
    description:
      company.description ??
      `Profil, wilayah operasi, dan laporan publik ${company.name}.`,
    alternates: {
      canonical: `/industry/${company.slug}`,
    },
  };
}

export default async function IndustryCompanyPage({
  params,
}: IndustryCompanyPageProps) {
  const validationResult = industryCompanySlugSchema.safeParse(
    (await params).slug,
  );

  if (!validationResult.success) {
    notFound();
  }

  const company = await getCompany(validationResult.data);

  if (!company) {
    notFound();
  }

  return <IndustryCompanyDetail company={company} />;
}
