import { Gem } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/ui/container";

export default function CommodityNotFound() {
  return (
    <Container className="flex min-h-[72vh] max-w-3xl items-center justify-center pb-20 pt-36 text-center">
      <div className="w-full rounded-3xl border border-white/10 bg-[#08172a] p-8 sm:p-12">
        <Gem aria-hidden="true" className="mx-auto h-9 w-9 text-brand-cyan" />
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-brand-teal">
          Commodity
        </p>
        <h1 className="mt-3 text-3xl text-white sm:text-4xl">
          Komoditas tidak ditemukan
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#9facba]">
          Profil yang Anda cari tidak tersedia atau belum dipublikasikan.
        </p>
        <Link
          href="/commodity"
          className="brand-gradient mt-7 inline-flex min-h-12 items-center rounded-full px-6 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan"
        >
          Kembali ke katalog
        </Link>
      </div>
    </Container>
  );
}
