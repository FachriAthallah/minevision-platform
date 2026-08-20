import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = {
  title: "About",
  description: "Informasi mengenai MineVision Intelligence Platform Indonesia.",
};

export default function AboutPage() {
  return (
    <ModulePlaceholder
      eyebrow="About MineVision"
      title="Platform Informasi Pertambangan Indonesia"
      description="MineVision mengintegrasikan edukasi, informasi industri, komoditas, karier, data intelligence, ekonomi, pencarian global, dan MineBot AI dalam satu platform."
      nextStep="membangun profil platform, visi, tujuan, metodologi data, dan daftar sumber informasi."
    />
  );
}
