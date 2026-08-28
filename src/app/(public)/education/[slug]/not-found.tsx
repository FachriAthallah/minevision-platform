import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/ui/container";

export default function EducationArticleNotFound() {
  return (
    <Container className="flex min-h-[72vh] max-w-3xl items-center justify-center pb-20 pt-36 text-center">
      <div className="w-full rounded-3xl border border-white/10 bg-[#08172a] p-8 sm:p-12">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-brand-cyan/30 bg-brand-cyan/5">
          <BookOpen aria-hidden="true" className="h-6 w-6 text-brand-cyan" />
        </span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-brand-teal">
          Education
        </p>
        <h1 className="mt-3 text-3xl text-white sm:text-4xl">
          Materi tidak ditemukan
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#9facba]">
          Artikel yang Anda cari belum tersedia atau alamatnya telah berubah.
          Kembali ke halaman Education untuk memilih materi lain.
        </p>
        <Link
          href="/education"
          className="brand-gradient mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cyan"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Kembali ke Education
        </Link>
      </div>
    </Container>
  );
}
