import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Pertanyaan umum mengenai platform dan layanan MineVision.",
};

export default function FaqPage() {
  return (
    <ModulePlaceholder
      eyebrow="FAQ"
      title="Pertanyaan yang Sering Diajukan"
      description="Halaman ini akan membantu pengguna memahami akses platform, sumber data, status publikasi, fitur akun, Global Search, dan MineBot AI."
      nextStep="menyusun daftar pertanyaan dan jawaban setelah cakupan fitur MVP dikunci."
    />
  );
}
