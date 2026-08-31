import type { Metadata } from "next";

import { IndustryPublicPage as IndustryExperience } from "@/features/industry/components/industry-public-page";
import { parseIndustryCategory } from "@/features/industry/lib/industry-view";
import {
  getPublicIndustryExperience,
  type PublicIndustryExperience,
} from "@/features/industry/server/get-public-industry-experience";

export const metadata: Metadata = {
  title: "Industri Pertambangan Indonesia",
  description:
    "Direktori perusahaan tambang utama, laporan tahunan dan keberlanjutan, serta wilayah operasi pertambangan Indonesia.",
  alternates: {
    canonical: "/industry",
  },
};

type IndustryPageProps = {
  searchParams: Promise<{
    category?: string | string[];
  }>;
};

const emptyExperience: PublicIndustryExperience = {
  companies: [],
  reports: [],
};

export default async function IndustryPage({ searchParams }: IndustryPageProps) {
  const query = await searchParams;
  const activeCategory = parseIndustryCategory(query.category);
  let experience = emptyExperience;
  let dataError = false;

  try {
    experience = await getPublicIndustryExperience(activeCategory === "reports");
  } catch (error: unknown) {
    console.error("Failed to load Industry public experience:", error);
    dataError = true;
  }

  return (
    <IndustryExperience
      activeCategory={activeCategory}
      experience={experience}
      dataError={dataError}
    />
  );
}
