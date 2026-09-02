import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = {
  title: "Commodity",
  description:
    "Informasi komoditas mineral logam, non-logam, dan energi Indonesia.",
};

export default function CommoditiesPage() {
  return (
    <ModulePlaceholder
      eyebrow="Commodity"
      title="Jelajahi Komoditas Tambang Indonesia"
      description="Pelajari mineral logam, mineral non-logam, dan komoditas energi beserta karakteristik, metode penambangan, kegunaan, cadangan, dan produksinya."
      nextStep="membangun kategori komoditas dan halaman detail setiap komoditas."
    />
  );
}
