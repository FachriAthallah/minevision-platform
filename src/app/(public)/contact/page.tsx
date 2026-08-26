import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = {
  title: "Kontak",
  description: "Informasi kontak dan kanal komunikasi MineVision.",
};

export default function ContactPage() {
  return (
    <ModulePlaceholder
      eyebrow="Kontak"
      title="Hubungi MineVision"
      description="Halaman ini akan menyediakan kanal untuk pertanyaan umum, koreksi data, kerja sama, dan masukan mengenai pengembangan MineVision."
      nextStep="menentukan alamat kontak resmi dan alur penanganan pesan sebelum formulir publik diaktifkan."
    />
  );
}
