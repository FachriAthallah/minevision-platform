"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  CalendarRange,
  ExternalLink,
  FileText,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { fetchPublicProduction } from "../client/fetch-public-production";
import {
  calculateProductionStatistics,
  getProductionCitations,
} from "../lib/production-series";
import type {
  PublicProductionOption,
  PublicProductionRecord,
} from "../types/production";
import { ProductionDetailChart } from "./production-detail-chart";

type AppliedFilters = {
  commodity: string;
  fromYear: number;
  toYear: number;
};

type ProductionDetailDashboardProps = {
  options: PublicProductionOption[];
  initialFilters: AppliedFilters | null;
  optionsError?: boolean;
};

type RequestState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; records: PublicProductionRecord[] };

const inputClassName =
  "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20";

function formatValue(value: number, unit: string): string {
  return `${value.toLocaleString("id-ID", {
    maximumFractionDigits: 2,
  })} ${unit}`;
}

function LoadingState() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[430px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background/30 px-6 text-center"
    >
      <span className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-brand-cyan" />
      <p className="mt-5 font-semibold text-foreground">Memuat data produksi</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Mengambil data publik yang telah diverifikasi.
      </p>
    </div>
  );
}

export function ProductionDetailDashboard({
  options,
  initialFilters,
  optionsError = false,
}: ProductionDetailDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [requestVersion, setRequestVersion] = useState(0);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters | null>(
    initialFilters,
  );
  const [draftCommodity, setDraftCommodity] = useState(
    initialFilters?.commodity ?? "",
  );
  const [draftFromYear, setDraftFromYear] = useState(
    initialFilters ? String(initialFilters.fromYear) : "",
  );
  const [draftToYear, setDraftToYear] = useState(
    initialFilters ? String(initialFilters.toYear) : "",
  );
  const [requestState, setRequestState] = useState<RequestState>(
    initialFilters ? { status: "loading" } : { status: "success", records: [] },
  );

  useEffect(() => {
    if (!appliedFilters) {
      return;
    }

    const filters = appliedFilters;
    const abortController = new AbortController();

    async function loadProduction() {
      setRequestState({ status: "loading" });

      try {
        const records = await fetchPublicProduction({
          ...filters,
          signal: abortController.signal,
        });

        setRequestState({ status: "success", records });
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setRequestState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Data produksi belum dapat dimuat.",
        });
      }
    }

    void loadProduction();

    return () => {
      abortController.abort();
    };
  }, [appliedFilters, requestVersion]);

  const records = useMemo(
    () =>
      requestState.status === "success" ? requestState.records : [],
    [requestState],
  );
  const statistics = useMemo(
    () => calculateProductionStatistics(records),
    [records],
  );
  const citations = useMemo(() => getProductionCitations(records), [records]);
  const unitCount = useMemo(
    () => new Set(records.map((record) => record.unit.code)).size,
    [records],
  );

  function handleCommodityChange(commoditySlug: string) {
    const option = options.find((item) => item.slug === commoditySlug);

    setDraftCommodity(commoditySlug);

    if (option) {
      setDraftFromYear(String(option.fromYear));
      setDraftToYear(String(option.toYear));
    }
  }

  function applyFilters() {
    const option = options.find((item) => item.slug === draftCommodity);
    const fromYear = Number(draftFromYear);
    const toYear = Number(draftToYear);

    if (!option) {
      setValidationMessage("Pilih komoditas yang tersedia.");
      return;
    }

    if (
      !Number.isInteger(fromYear) ||
      !Number.isInteger(toYear) ||
      fromYear < 1900 ||
      toYear > 2100
    ) {
      setValidationMessage("Gunakan rentang tahun antara 1900 dan 2100.");
      return;
    }

    if (fromYear > toYear) {
      setValidationMessage("Tahun awal tidak boleh melebihi tahun akhir.");
      return;
    }

    const nextFilters = {
      commodity: option.slug,
      fromYear,
      toYear,
    };
    const searchParams = new URLSearchParams({
      commodity: option.slug,
      fromYear: String(fromYear),
      toYear: String(toYear),
    });

    setValidationMessage(null);
    setAppliedFilters(nextFilters);
    router.replace(`${pathname}?${searchParams.toString()}`, {
      scroll: false,
    });
  }

  if (optionsError) {
    return (
      <Card variant="glass">
        <CardContent className="flex min-h-64 flex-col items-center justify-center pt-6 text-center">
          <AlertTriangle className="h-9 w-9 text-danger" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-bold text-foreground">
            Filter produksi belum dapat dimuat
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            Daftar komoditas publik sedang tidak tersedia. Muat ulang halaman
            untuk mencoba kembali.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (options.length === 0 || !initialFilters) {
    return (
      <Card variant="glass">
        <CardContent className="flex min-h-64 flex-col items-center justify-center pt-6 text-center">
          <BarChart3 className="h-9 w-9 text-brand-cyan" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-bold text-foreground">
            Data produksi belum dipublikasikan
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            Belum ada komoditas dengan data produksi terverifikasi dan berstatus
            published yang dapat ditampilkan.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Filter data produksi</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            Pilih komoditas dan periode dari data publik yang tersedia.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_1fr_1fr_auto] md:items-end">
            <label className="space-y-2 text-sm font-semibold text-foreground">
              <span>Komoditas</span>
              <select
                value={draftCommodity}
                onChange={(event) => handleCommodityChange(event.target.value)}
                className={inputClassName}
              >
                {options.map((option) => (
                  <option key={option.slug} value={option.slug}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-semibold text-foreground">
              <span>Tahun awal</span>
              <input
                type="number"
                min={1900}
                max={2100}
                value={draftFromYear}
                onChange={(event) => setDraftFromYear(event.target.value)}
                className={inputClassName}
              />
            </label>

            <label className="space-y-2 text-sm font-semibold text-foreground">
              <span>Tahun akhir</span>
              <input
                type="number"
                min={1900}
                max={2100}
                value={draftToYear}
                onChange={(event) => setDraftToYear(event.target.value)}
                className={inputClassName}
              />
            </label>

            <Button onClick={applyFilters} className="w-full md:w-auto">
              Terapkan
            </Button>
          </div>

          {validationMessage ? (
            <p role="alert" className="mt-4 text-sm text-danger">
              {validationMessage}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {requestState.status === "loading" ? <LoadingState /> : null}

      {requestState.status === "error" ? (
        <div
          role="alert"
          className="flex min-h-[430px] flex-col items-center justify-center rounded-2xl border border-danger/30 bg-danger/5 px-6 text-center"
        >
          <AlertTriangle className="h-10 w-10 text-danger" aria-hidden="true" />
          <h2 className="mt-5 text-xl font-bold text-foreground">
            Data produksi gagal dimuat
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            {requestState.message}
          </p>
          <Button
            variant="secondary"
            className="mt-5"
            onClick={() => setRequestVersion((version) => version + 1)}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Coba lagi
          </Button>
        </div>
      ) : null}

      {requestState.status === "success" && records.length === 0 ? (
        <div
          role="status"
          className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background/30 px-6 text-center"
        >
          <CalendarRange
            className="h-10 w-10 text-brand-cyan"
            aria-hidden="true"
          />
          <h2 className="mt-5 text-xl font-bold text-foreground">
            Tidak ada data pada rentang ini
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
            Ubah komoditas atau rentang tahun. Nilai kosong tidak diisi dengan
            estimasi maupun interpolasi.
          </p>
        </div>
      ) : null}

      {requestState.status === "success" && records.length > 0 ? (
        <>
          {unitCount > 1 ? (
            <div
              role="alert"
              className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm leading-6 text-foreground"
            >
              Dataset memiliki lebih dari satu satuan. Nilai tidak digabungkan
              untuk mencegah perbandingan yang menyesatkan.
            </div>
          ) : null}

          {statistics ? (
            <section aria-labelledby="production-summary-heading">
              <h2 id="production-summary-heading" className="sr-only">
                Ringkasan statistik produksi
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <CalendarRange className="h-5 w-5 text-brand-cyan" aria-hidden="true" />
                    <p className="mt-4 text-sm text-muted-foreground">Periode data</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {statistics.fromYear}–{statistics.toYear}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <BarChart3 className="h-5 w-5 text-brand-cyan" aria-hidden="true" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      Historis terbaru ({statistics.latestYear})
                    </p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {formatValue(statistics.latestValue, statistics.unit.symbol)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <TrendingUp className="h-5 w-5 text-brand-cyan" aria-hidden="true" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      Perubahan historis
                    </p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {statistics.changePercentage === null
                        ? "Tidak dapat dihitung"
                        : `${statistics.changePercentage >= 0 ? "+" : ""}${statistics.changePercentage.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <FileText className="h-5 w-5 text-brand-cyan" aria-hidden="true" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      Rata-rata historis
                    </p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {formatValue(statistics.averageValue, statistics.unit.symbol)}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {statistics.historicalCount} titik historis • {statistics.projectionCount} proyeksi
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>
          ) : null}

          {unitCount === 1 ? (
            <Card variant="glass">
              <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 space-y-0">
                <div>
                  <CardTitle>
                    Tren Produksi {records[0]?.commodity.name}
                  </CardTitle>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Satuan: {records[0]?.unit.name} ({records[0]?.unit.symbol})
                  </p>
                </div>
                <span className="rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-1 text-xs font-semibold text-brand-cyan">
                  Verified &amp; published
                </span>
              </CardHeader>
              <CardContent>
                <ProductionDetailChart records={records} />
              </CardContent>
            </Card>
          ) : null}

          <Card variant="glass">
            <CardHeader>
              <CardTitle>Sumber dan citation</CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                Referensi yang terkait dengan record pada periode terpilih.
              </p>
            </CardHeader>
            <CardContent>
              {citations.length > 0 ? (
                <ol className="space-y-3">
                  {citations.map((citation, index) => (
                    <li
                      key={`${citation.source.slug}-${citation.label}-${index}`}
                      className="rounded-xl border border-border bg-background/40 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">
                            {citation.label}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {citation.source.organization}
                            {citation.pageReference
                              ? ` • ${citation.pageReference}`
                              : ""}
                          </p>
                        </div>
                        <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
                          {citation.isPrimary ? "Sumber utama" : "Pendukung"}
                        </span>
                      </div>
                      {citation.url ? (
                        <a
                          href={citation.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-cyan hover:text-brand-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan"
                        >
                          Buka sumber
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="rounded-xl border border-dashed border-border p-5 text-sm leading-6 text-muted-foreground">
                  Citation publik tidak tersedia untuk record pada periode ini.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
