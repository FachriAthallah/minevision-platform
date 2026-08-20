"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

type ErrorPageProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("MineVision route error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center py-20">
      <Container className="text-center">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-danger">
          Application Error
        </p>

        <h1 className="mt-4 font-serif text-3xl font-bold text-foreground sm:text-4xl">
          Terjadi Kesalahan
        </h1>

        <p className="mx-auto mt-4 max-w-xl leading-7 text-muted-foreground">
          MineVision tidak dapat memproses permintaan ini. Silakan coba kembali
          atau kembali ke halaman utama.
        </p>

        {error.digest ? (
          <p className="mt-4 font-mono text-xs text-muted-foreground">
            Error reference: {error.digest}
          </p>
        ) : null}

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button variant="primary" size="large" onClick={reset}>
            Coba Lagi
          </Button>

          <Link
            href="/"
            className={buttonVariants({
              variant: "outline",
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
