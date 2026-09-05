import type { Metadata } from "next";

import { CommodityCatalog } from "@/features/commodity/components/commodity-catalog";
import { parseCommodityCatalogFilters } from "@/features/commodity/lib/commodity-view";
import { getPublicCommodities } from "@/features/commodity/server/get-public-commodities";

export const metadata: Metadata = {
  title: "Komoditas Pertambangan Indonesia",
  description:
    "Jelajahi 23 profil komoditas mineral logam, mineral non-logam, dan energi Indonesia beserta data serta sumber resminya.",
  alternates: {
    canonical: "/commodity",
  },
};

export default async function CommoditiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string | string[];
    category?: string | string[];
  }>;
}) {
  const filters = parseCommodityCatalogFilters(await searchParams);
  const commodities = await getPublicCommodities({});

  return (
    <CommodityCatalog
      commodities={commodities}
      filters={filters}
    />
  );
}
