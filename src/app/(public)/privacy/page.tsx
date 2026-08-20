import type { Metadata } from "next";

import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Kebijakan privasi dan penggunaan data MineVision.",
};

export default function PrivacyPage() {
  return (
    <ModulePlaceholder
      eyebrow="Privacy"
      title="Privasi dan Penggunaan Data"
      description="Halaman ini akan menjelaskan data yang diproses MineVision, penggunaan cookie, aktivitas pencarian, interaksi MineBot AI, serta perlindungan informasi pengguna."
      nextStep="menyusun kebijakan privasi setelah sistem analytics, authentication, dan MineBot AI dikunci."
    />
  );
}
