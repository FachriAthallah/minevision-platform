import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function CareerCta() {
  return <Card variant="elevated" className="relative overflow-hidden p-6 sm:p-9 lg:p-10">
    <div className="grid items-center gap-7 lg:grid-cols-[1fr_auto]">
      <div className="max-w-2xl">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-cyan"><GraduationCap className="size-5" aria-hidden="true" />Rencanakan Langkah Berikutnya</p>
        <h2 className="mt-4 text-2xl leading-snug sm:text-3xl">Bangun Fondasi Kariermu</h2>
        <p className="mt-4 text-base leading-8 text-muted-foreground">Kenali dunia pertambangan lebih dekat. Pelajari proses, metode, peralatan, dan keselamatan kerja melalui materi Education.</p>
      </div>
      <Link href="/education" className={cn(buttonVariants({ size: "large" }), "w-fit max-w-full whitespace-normal motion-reduce:transition-none")}>Jelajahi Edukasi<ArrowRight className="size-4 shrink-0" aria-hidden="true" /></Link>
    </div>
  </Card>;
}

