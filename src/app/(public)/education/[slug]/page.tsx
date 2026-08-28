import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  educationArticleSlugs,
  getEducationArticle,
} from "@/features/education/content/education-content";
import { EducationPage } from "@/features/education/education-page";

type EducationArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return educationArticleSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: EducationArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getEducationArticle(slug);

  if (!article) {
    return {
      title: "Materi tidak ditemukan",
    };
  }

  return {
    title: `${article.title} | Education`,
    description: article.summary,
    alternates: {
      canonical: `/education/${article.slug}`,
    },
  };
}

export default async function EducationArticlePage({
  params,
}: EducationArticlePageProps) {
  const { slug } = await params;
  const article = getEducationArticle(slug);

  if (!article) {
    notFound();
  }

  return <EducationPage article={article} />;
}
