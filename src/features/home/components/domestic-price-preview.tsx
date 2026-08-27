"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Info, RefreshCw } from "lucide-react";

import { fetchPublicDomesticPrices } from "@/features/intelligence/client/fetch-public-domestic-prices";
import type { PublicDomesticPriceRecord } from "@/features/intelligence/types/domestic-price";

const previewTargets = [
  {
    commodity: "batubara",
    standard: "HBA_6322",
    commodityLabel: "Batubara",
    standardLabel: "Harga Batubara Acuan 6.322 kcal/kg GAR",
    fallbackUnit: "USD/ton",
  },
  {
    commodity: "nikel",
    standard: "HMA_NIKEL",
    commodityLabel: "Nikel",
    standardLabel: "Harga Mineral Acuan Nikel",
    fallbackUnit: "USD/dmt",
  },
  {
    commodity: "emas",
    standard: "HMA_EMAS",
    commodityLabel: "Emas",
    standardLabel: "Harga Mineral Acuan Emas",
    fallbackUnit: "USD/oz t",
  },
  {
    commodity: "tembaga",
    standard: "HMA_TEMBAGA",
    commodityLabel: "Tembaga",
    standardLabel: "Harga Mineral Acuan Tembaga",
    fallbackUnit: "USD/dmt",
  },
] as const;

type PreviewTarget = (typeof previewTargets)[number];

type PricePreviewResult = {
  target: PreviewTarget;
  record: PublicDomesticPriceRecord | null;
  hasError: boolean;
};

type PricePreviewState =
  | {
      status: "loading";
    }
  | {
      status: "success";
      items: PricePreviewResult[];
    };

const recordTypeLabels = {
  actual: "Aktual",
  provisional: "Sementara",
  projection: "Proyeksi",
  revised: "Revisi",
} as const;

function getUnitLabel(unitCode: string, unitName: string, unitSymbol: string) {
  if (unitCode === "metric_ton") {
    return "ton";
  }

  if (unitCode === "dry_metric_ton") {
    return "dmt";
  }

  if (unitCode === "troy_ounce") {
    return "oz t";
  }

  if (unitCode === "gram") {
    return "gram";
  }

  return unitSymbol || unitName;
}

function formatPrice(value: number, currencyCode: string) {
  const fractionDigits = currencyCode === "IDR" ? 0 : 2;

  const formattedValue = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);

  return `${currencyCode} ${formattedValue}`;
}

function PriceCard({
  target,
  record,
  status,
}: {
  target: PreviewTarget;
  record: PublicDomesticPriceRecord | null;
  status: "loading" | "ready" | "error";
}) {
  const unitLabel = record
    ? getUnitLabel(record.unit.code, record.unit.name, record.unit.symbol)
    : null;

  const unitText = record
    ? `${record.currencyCode}/${unitLabel}`
    : target.fallbackUnit;

  return (
    <div className="flex min-h-[154px] flex-col rounded-xl border border-border bg-background/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-semibold text-foreground">
            {record?.commodity.name ?? target.commodityLabel}
          </h4>

          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {record?.standard.name ?? target.standardLabel}
          </p>
        </div>

        <span className="shrink-0 rounded-md border border-border px-2 py-1 text-[10px] text-accent">
          {unitText}
        </span>
      </div>

      <div aria-live="polite" className="mt-auto pt-4">
        {status === "loading" ? (
          <div className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-16 animate-pulse rounded bg-white/5" />
          </div>
        ) : null}

        {status === "error" ? (
          <p className="text-sm font-semibold text-red-300">Gagal dimuat</p>
        ) : null}

        {status === "ready" && record === null ? (
          <p className="text-sm font-semibold text-muted-foreground">
            Data belum dipublikasikan
          </p>
        ) : null}

        {status === "ready" && record !== null ? (
          <>
            <p className="text-base font-bold text-foreground">
              {formatPrice(record.value, record.currencyCode)}
            </p>

            <p className="mt-1 text-[11px] text-muted-foreground">
              Periode {record.periodLabel ?? record.effectiveDate}
              {" • "}
              {recordTypeLabels[record.recordType]}
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function DomesticPricePreview() {
  const [requestVersion, setRequestVersion] = useState(0);

  const [requestState, setRequestState] = useState<PricePreviewState>({
    status: "loading",
  });

  useEffect(() => {
    const abortController = new AbortController();

    async function loadPrices() {
      const results = await Promise.all(
        previewTargets.map(async (target): Promise<PricePreviewResult> => {
          try {
            const records = await fetchPublicDomesticPrices({
              commodity: target.commodity,
              standard: target.standard,
              signal: abortController.signal,
            });

            return {
              target,
              record: records[0] ?? null,
              hasError: false,
            };
          } catch (error) {
            if (!abortController.signal.aborted) {
              console.error(
                `Failed to load ${target.commodity} domestic price:`,
                error,
              );
            }

            return {
              target,
              record: null,
              hasError: true,
            };
          }
        }),
      );

      if (abortController.signal.aborted) {
        return;
      }

      setRequestState({
        status: "success",
        items: results,
      });
    }

    void loadPrices();

    return () => {
      abortController.abort();
    };
  }, [requestVersion]);

  const publicRecords =
    requestState.status === "success"
      ? requestState.items.flatMap((item) => (item.record ? [item.record] : []))
      : [];

  const sourceOrganizations = Array.from(
    new Set(publicRecords.map((record) => record.source.organization)),
  );

  const hasRequestError =
    requestState.status === "success" &&
    requestState.items.some((item) => item.hasError);

  return (
    <article className="rounded-2xl border border-border bg-surface/70 p-6 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
            Harga Domestik Komoditas
            <Info
              aria-hidden="true"
              className="h-4 w-4 text-muted-foreground"
            />
          </h3>

          <p className="mt-1 text-xs text-muted-foreground">
            Nilai terbaru berdasarkan standar harga setiap komoditas
          </p>
        </div>

        <Link
          href="/intelligence"
          className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Lihat detail
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {requestState.status === "loading"
          ? previewTargets.map((target) => (
              <PriceCard
                key={target.commodity}
                target={target}
                record={null}
                status="loading"
              />
            ))
          : requestState.items.map((item) => (
              <PriceCard
                key={item.target.commodity}
                target={item.target}
                record={item.record}
                status={item.hasError ? "error" : "ready"}
              />
            ))}
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          {sourceOrganizations.length > 0
            ? `Data verified dan published. Sumber: ${sourceOrganizations.join(
                ", ",
              )}.`
            : "Hanya data verified dan published yang dapat ditampilkan."}
        </p>

        {hasRequestError ? (
          <button
            type="button"
            onClick={() => {
              setRequestState({
                status: "loading",
              });

              setRequestVersion((currentVersion) => currentVersion + 1);
            }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
            Coba lagi
          </button>
        ) : null}
      </div>
    </article>
  );
}
