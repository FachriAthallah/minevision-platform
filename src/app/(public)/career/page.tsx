import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { CareerHero } from "@/features/career/components/career-hero";
import { CareerCatalogExplorer } from "@/features/career/components/career-catalog";
import { CareerCta } from "@/features/career/components/career-cta";
import { getPublicCareers } from "@/features/career/server/public-career-queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Career",
  alternates: { canonical: "/career" },
  description:
    "Informasi profesi, kompetensi, pendidikan, dan pelatihan dalam industri pertambangan.",
};

export default async function CareerPage() {
  const catalog = await getPublicCareers();
  return (
    <><CareerHero counts={catalog.counts} /><Container className="max-w-[1320px] space-y-14 py-12 sm:space-y-20 sm:py-16 lg:py-20"><CareerCatalogExplorer categories={catalog.categories} /><CareerCta /></Container></>
  );
}
