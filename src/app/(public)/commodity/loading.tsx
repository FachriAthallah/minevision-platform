import { Container } from "@/components/ui/container";

export default function CommodityLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen bg-[#020817] pb-20 pt-36"
    >
      <span className="sr-only">Memuat data Commodity...</span>
      <Container className="max-w-[1320px] animate-pulse motion-reduce:animate-none">
        <div className="h-4 w-28 rounded-full bg-muted" />
        <div className="mt-6 h-14 max-w-3xl rounded-2xl bg-muted" />
        <div className="mt-5 h-6 max-w-2xl rounded-xl bg-muted" />
        <div className="mt-14 h-44 rounded-3xl border border-border bg-surface" />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-[410px] rounded-3xl border border-border bg-surface"
            />
          ))}
        </div>
      </Container>
    </div>
  );
}
