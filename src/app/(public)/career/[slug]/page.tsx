import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { CareerDetail } from "@/features/career/components/career-detail";
import { careerSlugSchema } from "@/features/career/schemas/career-query";
import { getPublicCareerBySlug } from "@/features/career/server/public-career-queries";

export const dynamic = "force-dynamic";
const getCareer = cache(getPublicCareerBySlug);
type Props = { params: Promise<{ slug: string }> };
async function resolveCareer(params: Props["params"]) {
  const parsed = careerSlugSchema.safeParse((await params).slug);
  return parsed.success ? getCareer(parsed.data) : null;
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const career = await resolveCareer(params);
  if (!career) return { title: "Kategori karier tidak ditemukan", robots: { index: false } };
  const description = career.profile.excerpt ?? career.category.description ?? undefined;
  return { title: career.profile.title, description, alternates: { canonical: `/career/${career.category.slug}` }, openGraph: { title: `${career.profile.title} | MineVision`, description, url: `/career/${career.category.slug}` } };
}
export default async function CareerDetailPage({ params }: Props) {
  const career = await resolveCareer(params);
  if (!career) notFound();
  return <CareerDetail career={career} />;
}

