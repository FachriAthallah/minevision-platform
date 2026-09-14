import type { Metadata } from "next";
import { methodologySections, resourceUpdatedAt } from "@/features/resources/resource-content";
import { ResourcePage } from "@/features/resources/resource-page";
export const metadata: Metadata = { title: "Metodologi Data", description: "Metodologi kurasi, verifikasi, publikasi, dan koreksi data MineVision.", alternates: { canonical: "/methodology" } };
export default function MethodologyPage() { return <ResourcePage eyebrow="Resource" title="Metodologi Data" description="Cara MineVision menjaga definisi, sumber, status, dan seri data agar informasi publik tidak tercampur." updatedAt={resourceUpdatedAt} sections={methodologySections} />; }
