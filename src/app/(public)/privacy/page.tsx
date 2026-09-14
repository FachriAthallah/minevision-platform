import type { Metadata } from "next";

import { privacySections, resourceUpdatedAt } from "@/features/resources/resource-content";
import { ResourcePage } from "@/features/resources/resource-page";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: "Ringkasan pemrosesan data akun, sesi, pencarian, dan tautan eksternal MineVision.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <ResourcePage eyebrow="Resource" title="Kebijakan Privasi" description="Penjelasan ringkas dan faktual tentang data yang diproses oleh fitur MineVision saat ini." updatedAt={resourceUpdatedAt} sections={privacySections} />
  );
}
