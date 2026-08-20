import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function NotFoundPage() {
  return (
    <main className="relative flex min-h-screen items-center overflow-hidden py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12),transparent_40%)]"
      />

      <Container className="relative text-center">
        <p className="font-serif text-8xl font-black text-brand-cyan sm:text-9xl">
          404
        </p>

        <h1 className="mt-6 font-serif text-3xl font-bold text-foreground sm:text-4xl">
          Halaman Tidak Ditemukan
        </h1>

        <p className="mx-auto mt-4 max-w-xl leading-7 text-muted-foreground">
          Halaman yang Anda cari mungkin telah dipindahkan, belum tersedia, atau
          alamat yang dimasukkan tidak tepat.
        </p>

        <div className="mt-8">
          <Link
            href="/"
            className={buttonVariants({
              variant: "primary",
              size: "large",
            })}
          >
            Kembali ke Home
          </Link>
        </div>
      </Container>
    </main>
  );
}
