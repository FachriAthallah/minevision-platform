import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = {
  title: "Education",
  description:
    "Edukasi mengenai konsep, tahapan, metode, teknologi, dan keselamatan pertambangan.",
};

export default function EducationPage() {
  return (
    <ModulePlaceholder
      eyebrow="Education"
      title="Memahami Pertambangan dari Dasar"
      description="Pelajari pengertian pertambangan, tahapan kegiatan, metode penambangan, alat berat, keselamatan kerja, dan istilah pertambangan."
      nextStep="memindahkan layout dan struktur konten Education dari referensi Lovable."
    />
  );
}