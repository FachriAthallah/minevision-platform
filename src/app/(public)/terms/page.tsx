import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description: "Syarat dan ketentuan penggunaan platform MineVision.",
};

export default function TermsPage() {
  return (
    <ModulePlaceholder
      eyebrow="Syarat & Ketentuan"
      title="Ketentuan Penggunaan MineVision"
      description="Halaman ini akan menjelaskan ketentuan akses, penggunaan konten dan data, batas tanggung jawab, serta perilaku pengguna pada platform MineVision."
      nextStep="menyusun ketentuan final setelah autentikasi, data publik, Global Search, dan MineBot AI selesai didefinisikan."
    />
  );
}
