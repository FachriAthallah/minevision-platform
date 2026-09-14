import type { Metadata } from "next";

import { aboutSections } from "@/features/resources/resource-content";
import { ResourcePage } from "@/features/resources/resource-page";

export const metadata: Metadata = {
  title: "Tentang MineVision",
  description: "Tujuan, modul, pengguna, dan prinsip sumber MineVision.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <ResourcePage eyebrow="Tentang" title="MineVision" description="Platform informasi pertambangan Indonesia yang menghubungkan pembelajaran, profil entitas, dan data publik terverifikasi." sections={aboutSections} />
  );
}
