"use client";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
export default function CareerError({ reset }: { reset: () => void }) {
  return <Container className="min-h-[70vh] pb-20 pt-36"><div className="rounded-2xl border border-border bg-surface p-8"><h1 className="text-3xl">Informasi karier belum dapat dimuat</h1><p className="mt-4 leading-7 text-muted-foreground">Terjadi kendala saat mengambil materi. Silakan coba kembali.</p><div className="mt-6 flex flex-wrap gap-3"><Button onClick={reset}>Coba lagi</Button><Link href="/career" className={buttonVariants({ variant: "outline" })}>Katalog karier</Link></div></div></Container>;
}

