import type { LucideIcon } from "lucide-react";
import { Building2, FileText, MapPinned } from "lucide-react";
import Link from "next/link";

import type { IndustryCategory } from "@/features/industry/types/industry-view";
import { cn } from "@/lib/utils";

type IndustryCategoryItem = {
  id: IndustryCategory;
  title: string;
  description: string;
  icon: LucideIcon;
};

const categories: IndustryCategoryItem[] = [
  {
    id: "companies",
    title: "Perusahaan Tambang Utama",
    description: "Direktori perusahaan pertambangan utama Indonesia.",
    icon: Building2,
  },
  {
    id: "reports",
    title: "Sustainability & Annual Report",
    description: "Katalog laporan tahunan dan keberlanjutan perusahaan.",
    icon: FileText,
  },
  {
    id: "operations",
    title: "Wilayah Operasi",
    description: "Keterangan persebaran kegiatan operasional perusahaan.",
    icon: MapPinned,
  },
];

export function IndustryCategoryNavigation({
  activeCategory,
}: {
  activeCategory: IndustryCategory;
}) {
  return (
    <nav aria-label="Kategori Industri">
      <ul className="grid gap-4 lg:grid-cols-3">
        {categories.map((category) => {
          const active = category.id === activeCategory;
          const Icon = category.icon;

          return (
            <li key={category.id}>
              <Link
                href={`/industry?category=${category.id}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex h-full min-h-36 items-start gap-4 rounded-2xl border p-5 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan motion-reduce:transition-none",
                  active
                    ? "border-brand-cyan/55 bg-[linear-gradient(115deg,rgba(40,103,228,0.16),rgba(0,177,196,0.13),rgba(60,195,171,0.09))] shadow-[0_16px_42px_rgba(0,177,196,0.08)]"
                    : "border-border bg-surface hover:border-brand-cyan/35 hover:bg-surface-secondary",
                )}
              >
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl border",
                    active
                      ? "border-brand-cyan/35 bg-brand-cyan/10"
                      : "border-border bg-background/40 group-hover:border-brand-cyan/25",
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className={cn(
                      "size-5",
                      active ? "text-brand-cyan" : "text-muted-foreground",
                    )}
                  />
                </span>
                <span>
                  <span className="block font-serif text-lg font-bold leading-7 text-foreground">
                    {category.title}
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-muted-foreground">
                    {category.description}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
