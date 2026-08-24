import type { Metadata } from "next";

import { SectionHeading } from "@/components/shared/section-heading";
import { Container } from "@/components/ui/container";
import { ProductionDetailDashboard } from "@/features/intelligence/components/production-detail-dashboard";
import { getPublicProductionOptions } from "@/features/intelligence/server/get-public-production-options";
import type { PublicProductionOption } from "@/features/intelligence/types/production";

export const metadata: Metadata = {
  title: "Produksi Komoditas | Intelligence",
  description:
    "Jelajahi tren produksi tahunan komoditas pertambangan Indonesia dari data publik yang telah diverifikasi.",
};

type IntelligencePageProps = {
  searchParams: Promise<{
    commodity?: string | string[];
    fromYear?: string | string[];
    toYear?: string | string[];
  }>;
};

function getSingleSearchParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

function getInitialFilters(
  options: PublicProductionOption[],
  searchParams: Awaited<IntelligencePageProps["searchParams"]>,
) {
  const requestedCommodity = getSingleSearchParam(searchParams.commodity);
  const selectedOption =
    options.find((option) => option.slug === requestedCommodity) ?? options[0];

  if (!selectedOption) {
    return null;
  }

  const requestedFromYear = Number(getSingleSearchParam(searchParams.fromYear));
  const requestedToYear = Number(getSingleSearchParam(searchParams.toYear));
  const fromYear = Number.isInteger(requestedFromYear)
    ? requestedFromYear
    : selectedOption.fromYear;
  const toYear = Number.isInteger(requestedToYear)
    ? requestedToYear
    : selectedOption.toYear;

  const normalizedFromYear =
    fromYear >= 1900 && fromYear <= 2100
      ? fromYear
      : selectedOption.fromYear;
  const normalizedToYear =
    toYear >= 1900 && toYear <= 2100 ? toYear : selectedOption.toYear;

  return {
    commodity: selectedOption.slug,
    fromYear:
      normalizedFromYear <= normalizedToYear
        ? normalizedFromYear
        : selectedOption.fromYear,
    toYear:
      normalizedFromYear <= normalizedToYear
        ? normalizedToYear
        : selectedOption.toYear,
  };
}

export default async function IntelligencePage({
  searchParams,
}: IntelligencePageProps) {
  let options: PublicProductionOption[] = [];
  let optionsError = false;

  try {
    options = await getPublicProductionOptions();
  } catch (error: unknown) {
    console.error("Failed to get public production filter options:", error);
    optionsError = true;
  }

  const resolvedSearchParams = await searchParams;
  const initialFilters = getInitialFilters(options, resolvedSearchParams);

  return (
    <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.13),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(8,121,232,0.1),transparent_42%)]"
      />

      <Container className="relative">
        <SectionHeading
          eyebrow="Data Intelligence"
          title="Produksi Komoditas Pertambangan Indonesia"
          description="Jelajahi tren produksi tahunan dari data publik yang telah diverifikasi. Data aktual, provisional, revised, dan projection ditandai secara terpisah."
          className="max-w-4xl"
        />

        <div className="mt-10">
          <ProductionDetailDashboard
            options={options}
            initialFilters={initialFilters}
            optionsError={optionsError}
          />
        </div>
      </Container>
    </section>
  );
}
