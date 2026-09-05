"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function CommodityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Commodity route error:", error);
  }, [error]);

  return (
    <Container className="flex min-h-[72vh] max-w-3xl items-center justify-center pb-20 pt-36 text-center">
      <div className="w-full rounded-3xl border border-border bg-surface p-8 sm:p-12">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-danger">
          Commodity Error
        </p>
        <h1 className="mt-3 text-3xl text-foreground sm:text-4xl">
          Data Commodity belum dapat dimuat
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
          Terjadi kendala saat mengambil data publik. Silakan coba kembali atau
          buka ulang katalog komoditas.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="primary" size="large" onClick={reset}>
            <RotateCcw aria-hidden="true" className="size-4" />
            Coba lagi
          </Button>
          <Link
            href="/commodity"
            className={buttonVariants({ variant: "outline", size: "large" })}
          >
            Kembali ke katalog
          </Link>
        </div>
      </div>
    </Container>
  );
}
