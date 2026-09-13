import { Container } from "@/components/ui/container";

export default function EconomyLoading() {
  return (
    <div role="status" aria-live="polite" className="pb-16 pt-32">
      <Container className="max-w-[1320px]">
        <span className="sr-only">Memuat dashboard Economy</span>
        <div className="h-72 animate-pulse rounded-3xl border border-white/10 bg-surface motion-reduce:animate-none" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="h-96 animate-pulse rounded-2xl border border-white/10 bg-surface motion-reduce:animate-none" />
          <div className="h-[38rem] animate-pulse rounded-3xl border border-white/10 bg-surface motion-reduce:animate-none" />
        </div>
      </Container>
    </div>
  );
}
