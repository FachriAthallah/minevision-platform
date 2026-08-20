import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = {
  title: "Industry",
  description:
    "Informasi perusahaan, operasi, dan teknologi industri pertambangan Indonesia.",
};

export default function IndustryPage() {
  return (
    <ModulePlaceholder
      eyebrow="Industry"
      title="Mengenal Industri Pertambangan Indonesia"
      description="Jelajahi profil perusahaan tambang, lokasi operasi, komoditas utama, produksi, kontribusi industri, dan perkembangan teknologi."
      nextStep="membangun daftar perusahaan, halaman detail perusahaan, dan teknologi pertambangan."
    />
  );
}
