import { Container } from "@/components/ui/container";

export default function LoadingPage() {
  return (
    <main role="status" aria-live="polite" className="min-h-screen py-24">
      <Container>
        <span className="sr-only">Memuat halaman MineVision...</span>

        <div className="animate-pulse space-y-8">
          <div className="space-y-4">
            <div className="h-4 w-40 rounded-full bg-muted" />

            <div className="h-12 max-w-3xl rounded-xl bg-muted" />

            <div className="h-6 max-w-2xl rounded-lg bg-muted" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-56 rounded-2xl border border-border bg-surface"
              />
            ))}
          </div>
        </div>
      </Container>
    </main>
  );
}
