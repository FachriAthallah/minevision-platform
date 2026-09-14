import type { Metadata } from "next";

import { DeveloperContactCard } from "@/features/resources/developer-contact-card";
import { contactSections } from "@/features/resources/resource-content";
import { ResourcePage } from "@/features/resources/resource-page";

export const metadata: Metadata = {
  title: "Kontak",
  description: "Kanal proyek dan panduan pertanyaan data MineVision.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <ResourcePage eyebrow="Resource" title="Kontak" description="Terhubung dengan pengembang MineVision dan telusuri sumber data yang digunakan platform." sections={contactSections}>
      <DeveloperContactCard />
    </ResourcePage>
  );
}
