"use client";

import { useEffect } from "react";

type GlobalErrorPageProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function GlobalErrorPage({
  error,
  reset,
}: GlobalErrorPageProps) {
  useEffect(() => {
    console.error("MineVision global error:", error);
  }, [error]);

  return (
    <html lang="id">
      <body className="flex min-h-screen items-center justify-center bg-[#020817] px-6 text-[#f8fafc]">
        <main className="max-w-xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#ef4444]">
            Critical Error
          </p>

          <h1 className="mt-4 text-3xl font-bold">
            MineVision Tidak Dapat Dimuat
          </h1>

          <p className="mt-4 leading-7 text-[#aebbd0]">
            Terjadi kesalahan pada sistem utama. Silakan coba memuat kembali
            aplikasi.
          </p>

          {error.digest ? (
            <p className="mt-4 font-mono text-xs text-[#aebbd0]">
              Error reference: {error.digest}
            </p>
          ) : null}

          <button
            type="button"
            onClick={reset}
            className="mt-8 rounded-full bg-[#06b6d4] px-6 py-3 font-bold text-[#020817]"
          >
            Muat Ulang
          </button>
        </main>
      </body>
    </html>
  );
}
