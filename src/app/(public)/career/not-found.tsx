import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
export default function CareerNotFound() {
  return <Container className="min-h-[70vh] pb-20 pt-36"><div className="rounded-2xl border border-border bg-surface p-8"><p className="text-sm text-brand-cyan">Career · 404</p><h1 className="mt-4 text-3xl">Kategori karier tidak ditemukan</h1><p className="mt-4 leading-7 text-muted-foreground">Kategori ini belum tersedia. Jelajahi materi lain melalui katalog karier.</p><Link href="/career" className={buttonVariants({ className: "mt-6" })}>Kembali ke katalog karier</Link></div></Container>;
}

