import type { Metadata } from "next";

import { faqSections } from "@/features/resources/resource-content";
import { ResourcePage } from "@/features/resources/resource-page";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Pertanyaan umum tentang data dan fitur MineVision.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <ResourcePage eyebrow="Resource" title="Pertanyaan Umum" description="Jawaban singkat mengenai cakupan data publik dan fitur MineVision." sections={faqSections} />
  );
}
