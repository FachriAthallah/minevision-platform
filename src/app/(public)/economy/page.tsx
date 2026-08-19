import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = {
  title: "Economy",
  description:
    "Informasi ekonomi pertambangan, PDB, ekspor, investasi, hilirisasi, dan regulasi.",
};

export default function EconomyPage() {
  return (
    <ModulePlaceholder
      eyebrow="Economy"
      title="Memahami Peran Ekonomi Sektor Pertambangan"
      description="Eksplorasi kontribusi PDB, ekspor minerba, investasi pertambangan, hilirisasi mineral, serta kebijakan pemerintah."
      nextStep="membangun visualisasi indikator ekonomi dan halaman detail setiap topik."
    />
  );
}
