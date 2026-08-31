import { ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function IndustryCompanyNotFound() {
  return (
    <Container className="flex min-h-[72vh] max-w-3xl items-center justify-center pb-20 pt-36 text-center">
      <div className="w-full rounded-3xl border border-border bg-surface p-8 sm:p-12">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full border border-brand-cyan/30 bg-brand-cyan/5">
          <Building2 aria-hidden="true" className="size-6 text-brand-cyan" />
        </span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-brand-teal">
          Industry
        </p>
        <h1 className="mt-3 text-3xl text-foreground sm:text-4xl">
          Perusahaan tidak ditemukan
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
          Profil perusahaan belum tersedia, tidak dipublikasikan, atau alamatnya
          telah berubah.
        </p>
        <Link
          href="/industry?category=companies"
          className={`${buttonVariants({ variant: "primary", size: "large" })} mt-7`}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Kembali ke Industry
        </Link>
      </div>
    </Container>
  );
}
