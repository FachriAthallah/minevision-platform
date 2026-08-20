import type { Metadata } from "next";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Private Admin Dashboard MineVision.",
};

export default function AdminLoginPage() {
  return (
    <main className="relative flex min-h-screen items-center overflow-hidden py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.15),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(8,121,232,0.12),transparent_40%)]"
      />

      <Container className="relative">
        <Card variant="glass" className="mx-auto max-w-md">
          <CardHeader>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-cyan">
              Private Access
            </p>

            <CardTitle className="text-2xl">MineVision Admin</CardTitle>

            <CardDescription>
              Admin Dashboard hanya digunakan untuk mengelola konten, dataset,
              sumber informasi, MineBot AI, serta audit keamanan.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
              <p className="text-sm leading-6 text-warning">
                Authentication belum diaktifkan. Form login akan dibuat setelah
                database dan Supabase Auth dikonfigurasi.
              </p>
            </div>

            <Link
              href="/"
              className={buttonVariants({
                variant: "outline",
                size: "medium",
              })}
            >
              Kembali ke Website
            </Link>
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}
