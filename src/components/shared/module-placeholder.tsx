import Link from "next/link";

import { SectionHeading } from "@/components/shared/section-heading";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/ui/container";

type ModulePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  nextStep: string;
};

export function ModulePlaceholder({
  eyebrow,
  title,
  description,
  nextStep,
}: ModulePlaceholderProps) {
  return (
    <section className="relative flex min-h-[calc(100vh-5rem)] items-center overflow-hidden py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.14),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(8,121,232,0.12),transparent_40%)]"
      />

      <Container className="relative">
        <div className="max-w-4xl">
          <span className="inline-flex rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-4 py-2 text-sm font-bold text-brand-cyan">
            Module Foundation
          </span>

          <SectionHeading
            eyebrow={eyebrow}
            title={title}
            description={description}
            className="mt-8"
          />

          <Card variant="glass" className="mt-10 max-w-3xl">
            <CardHeader>
              <CardTitle>Status Pengembangan</CardTitle>

              <CardDescription>
                Route dan struktur halaman sudah tersedia. Implementasi konten
                serta integrasi data akan dikerjakan secara bertahap.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                Langkah berikutnya: {nextStep}
              </p>
            </CardContent>
          </Card>

          <div className="mt-8">
            <Link
              href="/"
              className={buttonVariants({
                variant: "outline",
                size: "medium",
              })}
            >
              Kembali ke Home
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
