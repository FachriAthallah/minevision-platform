import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = {
  title: "Intelligence",
  description:
    "Dashboard data produksi, harga, persebaran, dan statistik komoditas pertambangan.",
};

export default function IntelligencePage() {
  return (
    <ModulePlaceholder
      eyebrow="Intelligence"
      title="Data Pertambangan dalam Visual yang Lebih Jelas"
      description="Analisis produksi, harga, persebaran wilayah, cadangan, smelter, dan tren tujuh komoditas utama pertambangan Indonesia."
      nextStep="membangun dashboard, filter, grafik, tabel, peta, dan sumber data."
    />
  );
}
