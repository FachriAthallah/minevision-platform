import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = {
  title: "Search",
  description: "Pencarian informasi lintas modul MineVision.",
};

export default function SearchPage() {
  return (
    <ModulePlaceholder
      eyebrow="Global Search"
      title="Temukan Informasi di Seluruh MineVision"
      description="Cari artikel edukasi, profil perusahaan, komoditas, profesi, data intelligence, indikator ekonomi, dan informasi pertambangan lainnya."
      nextStep="membangun search input, filter kategori, hasil pencarian, pagination, dan search API."
    />
  );
}
