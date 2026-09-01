import Link from "next/link";
import { Bot, BookOpenCheck } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function IndustryActionCards() {
  return (
    <section aria-labelledby="industry-actions-heading" className="mt-12">
      <h2 id="industry-actions-heading" className="sr-only">
        Pelajari Industri lebih lanjut
      </h2>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card variant="elevated" className="relative overflow-hidden p-6 sm:p-7">
          <div aria-hidden="true" className="absolute -right-14 -top-14 size-40 rounded-full bg-brand-blue/10 blur-3xl" />
          <div className="relative">
            <BookOpenCheck aria-hidden="true" className="size-7 text-brand-cyan" />
            <h3 className="mt-5 text-2xl text-foreground">Tentang Industri</h3>
            <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
              Informasi Industri MineVision disusun dari website resmi serta
              laporan tahunan dan keberlanjutan perusahaan.
            </p>
            <Link
              href="#sumber-terpercaya"
              className={cn(
                buttonVariants({ variant: "outline", size: "medium" }),
                "mt-6 motion-reduce:transition-none",
              )}
            >
              Pelajari Selengkapnya
            </Link>
          </div>
        </Card>

        <Card variant="elevated" className="relative overflow-hidden p-6 sm:p-7">
          <div aria-hidden="true" className="absolute -right-14 -top-14 size-40 rounded-full bg-brand-teal/10 blur-3xl" />
          <div className="relative">
            <Bot aria-hidden="true" className="size-7 text-brand-teal" />
            <h3 className="mt-5 text-2xl text-foreground">Tanya MineBot AI</h3>
            <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
              Tanyakan perusahaan, komoditas, laporan, atau lokasi operasi
              melalui entry point MineBot yang tersedia di halaman.
            </p>
            <Link
              href="#minebot"
              className={cn(
                buttonVariants({ variant: "primary", size: "medium" }),
                "mt-6 motion-reduce:transition-none",
              )}
            >
              Tanya MineBot
            </Link>
          </div>
        </Card>
      </div>
    </section>
  );
}
