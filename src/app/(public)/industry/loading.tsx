import { Container } from "@/components/ui/container";

export default function IndustryLoading() {
  return (
    <div role="status" aria-live="polite" className="min-h-screen bg-background pb-20 pt-36">
      <span className="sr-only">Memuat data Industri...</span>
      <Container className="max-w-[1320px] animate-pulse motion-reduce:animate-none">
        <div className="h-4 w-28 rounded-full bg-muted" />
        <div className="mt-5 h-14 max-w-3xl rounded-2xl bg-muted" />
        <div className="mt-5 h-6 max-w-2xl rounded-xl bg-muted" />
        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-36 rounded-2xl border border-border bg-surface" />
          ))}
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-80 rounded-2xl border border-border bg-surface" />
          ))}
        </div>
      </Container>
    </div>
  );
}
