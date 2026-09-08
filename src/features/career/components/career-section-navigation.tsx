"use client";

import { useEffect, useState } from "react";
import { careerSections } from "../lib/career-view";
import { cn } from "@/lib/utils";
import { careerSectionIcons } from "./career-section-heading";

const links = [{ id: "professions", label: "Daftar Profesi" }, ...careerSections.map(({ key, label }) => ({ id: key, label })), { id: "references", label: "Referensi" }];
export function CareerSectionNavigation() {
  const [active, setActive] = useState("professions");
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(visible[0].target.id);
    }, { rootMargin: "-150px 0px -45% 0px", threshold: 0 });
    for (const link of links) { const element = document.getElementById(link.id); if (element) observer.observe(element); }
    return () => observer.disconnect();
  }, []);
  return (
    <nav aria-label="Isi kategori karier" className="rounded-2xl border border-white/10 bg-[#08172a] p-4 shadow-[0_14px_38px_rgba(0,0,0,0.2)]">
      <h2 className="text-lg text-white">Dalam Kategori Ini</h2>
      <ul className="mt-3 flex gap-1 overflow-x-auto [color-scheme:dark] [scrollbar-width:thin] lg:block lg:space-y-1">
        {links.map((link) => {
          const Icon = careerSectionIcons[link.id];
          const isActive = active === link.id;
          return (
            <li key={link.id} className="shrink-0 lg:shrink">
              <a
                href={`#${link.id}`}
                onClick={() => setActive(link.id)}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "group flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan",
                  isActive
                    ? "border-brand-cyan/50 bg-[linear-gradient(110deg,rgba(40,103,228,0.2),rgba(0,177,196,0.2),rgba(60,195,171,0.17))]"
                    : "border-transparent hover:border-white/10 hover:bg-white/[0.035]",
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-brand-cyan" : "text-[#7f90a5] group-hover:text-brand-cyan group-focus-visible:text-brand-cyan",
                  )}
                />
                <span className={cn("block min-w-0 text-sm font-semibold leading-5", isActive ? "text-white" : "text-[#c4ced9]")}>
                  {link.label}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
