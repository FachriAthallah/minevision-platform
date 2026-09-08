import { Container } from "@/components/ui/container";
export default function CareerLoading() {
  return <Container className="min-h-[70vh] pb-20 pt-36"><div role="status" className="rounded-2xl border border-border bg-surface p-8"><p className="font-semibold text-brand-cyan">Memuat informasi karier…</p><p className="mt-3 text-muted-foreground">Menyiapkan kategori dan materi yang tersedia.</p><div aria-hidden="true" className="mt-6 h-32 rounded-xl bg-muted motion-safe:animate-pulse" /></div></Container>;
}

