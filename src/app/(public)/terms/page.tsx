import type { Metadata } from "next";

import { resourceUpdatedAt, termsSections } from "@/features/resources/resource-content";
import { ResourcePage } from "@/features/resources/resource-page";

export const metadata: Metadata = {
  title: "Ketentuan Penggunaan",
  description: "Ketentuan penggunaan informasi dan data MineVision.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <ResourcePage eyebrow="Resource" title="Ketentuan Penggunaan" description="Batas penggunaan informasi, tanggung jawab verifikasi sumber, dan cakupan layanan MineVision." updatedAt={resourceUpdatedAt} sections={termsSections} />
  );
}
