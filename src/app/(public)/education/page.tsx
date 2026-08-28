import type { Metadata } from "next";

import { educationArticles } from "@/features/education/content/education-content";
import { EducationPage as EducationExperience } from "@/features/education/education-page";

export const metadata: Metadata = {
  title: "Edukasi Pertambangan",
  description:
    "Materi edukasi pertambangan mengenai konsep, tahapan kegiatan, metode, alat berat, keselamatan kerja, dan istilah teknis.",
  alternates: {
    canonical: "/education",
  },
};

export default function EducationPage() {
  return <EducationExperience article={educationArticles[0]} />;
}
