import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = {
  title: "Career",
  description:
    "Informasi profesi, kompetensi, pendidikan, dan pelatihan dalam industri pertambangan.",
};

export default function CareerPage() {
  return (
    <ModulePlaceholder
      eyebrow="Career"
      title="Bangun Karier di Industri Pertambangan"
      description="Jelajahi kategori profesi, ruang lingkup pekerjaan, kompetensi, pendidikan, software, serta pelatihan yang dibutuhkan di industri pertambangan."
      nextStep="memindahkan layout Career dan membangun 13 kategori profesi."
    />
  );
}
