import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { CommodityDetail } from "@/features/commodity/components/commodity-detail";
import { getAdjacentCommodities } from "@/features/commodity/lib/commodity-view";
import { commoditySlugSchema } from "@/features/commodity/schemas/commodity-query";
import { getPublicCommodities } from "@/features/commodity/server/get-public-commodities";
import { getPublicCommodityBySlug } from "@/features/commodity/server/get-public-commodity";

const getCommodity = cache(getPublicCommodityBySlug);

type CommodityDetailPageProps = {
  params: Promise<{ slug: string }>;
};

async function resolveSlug(params: CommodityDetailPageProps["params"]) {
  const result = commoditySlugSchema.safeParse((await params).slug);
  return result.success ? result.data : null;
}

export async function generateMetadata({
  params,
}: CommodityDetailPageProps): Promise<Metadata> {
  const slug = await resolveSlug(params);
  if (!slug) return { title: "Komoditas tidak ditemukan" };

  const commodity = await getCommodity(slug);
  if (!commodity) return { title: "Komoditas tidak ditemukan" };

  const description =
    commodity.description ??
    commodity.profile.excerpt ??
    `Profil dan data publik komoditas ${commodity.name}.`;

  return {
    title: commodity.name,
    description,
    alternates: { canonical: `/commodity/${commodity.slug}` },
    openGraph: {
      title: `${commodity.name} | MineVision`,
      description,
      url: `/commodity/${commodity.slug}`,
      images: commodity.image
        ? [{ url: commodity.image.url, alt: commodity.image.alt ?? commodity.name }]
        : undefined,
    },
  };
}

export default async function CommodityDetailPage({
  params,
}: CommodityDetailPageProps) {
  const slug = await resolveSlug(params);
  if (!slug) notFound();

  const [commodity, commodities] = await Promise.all([
    getCommodity(slug),
    getPublicCommodities({}),
  ]);

  if (!commodity) notFound();

  const { previous, next } = getAdjacentCommodities(commodities, commodity.slug);

  return (
    <CommodityDetail commodity={commodity} previous={previous} next={next} />
  );
}
