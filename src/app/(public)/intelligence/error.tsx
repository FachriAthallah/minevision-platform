"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function IntelligenceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="py-32">
      <Container className="max-w-3xl">
        <div role="alert" className="rounded-3xl border border-danger/25 bg-danger/5 p-8 text-center">
          <AlertTriangle aria-hidden="true" className="mx-auto size-10 text-danger" />
          <h1 className="mt-5 text-3xl text-white">Dashboard belum dapat dimuat</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">Koneksi data publik sedang mengalami gangguan. Tidak ada data internal yang ditampilkan.</p>
          <Button type="button" onClick={reset} className="mt-6"><RefreshCw aria-hidden="true" className="size-4" />Coba lagi</Button>
        </div>
      </Container>
    </section>
  );
}
