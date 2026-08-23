"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { fetchPublicProduction } from "@/features/intelligence/client/fetch-public-production";
import { transformProductionRecords } from "@/features/intelligence/lib/production-series";
import type { PublicProductionRecord } from "@/features/intelligence/types/production";

type ProductionRequestState =
  | {
      status: "loading";
    }
  | {
      status: "error";
    }
  | {
      status: "success";
      records: PublicProductionRecord[];
    };

const axisStyle = {
  stroke: "var(--color-muted-foreground, #94a3b8)",
  fontSize: 12,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  background: "var(--color-surface-elevated, #0f1c33)",
  border: "1px solid var(--color-border, #243550)",
  borderRadius: 12,
  color: "var(--color-foreground, #f8fafc)",
  fontSize: 12,
};

export function ProductionPreviewChart() {
  const [requestVersion, setRequestVersion] = useState(0);

  const [requestState, setRequestState] = useState<ProductionRequestState>({
    status: "loading",
  });

  useEffect(() => {
    const abortController = new AbortController();

    async function loadProduction() {
      try {
        const records = await fetchPublicProduction({
          commodity: "batubara",
          signal: abortController.signal,
        });

        setRequestState({
          status: "success",
          records,
        });
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        console.error("Failed to load public production data:", error);

        setRequestState({
          status: "error",
        });
      }
    }

    void loadProduction();

    return () => {
      abortController.abort();
    };
  }, [requestVersion]);

  const chartData = useMemo(() => {
    if (requestState.status !== "success") {
      return [];
    }

    return transformProductionRecords(requestState.records);
  }, [requestState]);

  if (requestState.status === "loading") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/20 px-6 text-center"
      >
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />

        <p className="mt-4 text-sm font-medium text-foreground">
          Memuat data produksi
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          Mengambil data publik yang telah diverifikasi.
        </p>
      </div>
    );
  }

  if (requestState.status === "error") {
    return (
      <div
        role="alert"
        className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-red-400/40 bg-red-400/5 px-6 text-center"
      >
        <p className="text-sm font-semibold text-foreground">
          Data produksi gagal dimuat
        </p>

        <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
          Terjadi gangguan ketika menghubungi layanan Intelligence.
        </p>

        <button
          type="button"
          onClick={() => {
            setRequestState({
              status: "loading",
            });

            setRequestVersion((currentVersion) => currentVersion + 1);
          }}
          className="mt-4 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-accent hover:text-accent"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  if (chartData.length === 0 || requestState.records.length === 0) {
    return (
      <div
        role="status"
        className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/20 px-6 text-center"
      >
        <p className="text-sm font-semibold text-foreground">
          Data produksi belum dipublikasikan
        </p>

        <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">
          Data Batubara masih berada dalam proses validasi dan publikasi. Nilai
          yang belum final tidak ditampilkan sebagai fakta publik.
        </p>
      </div>
    );
  }

  const firstRecord = requestState.records[0];

  if (!firstRecord) {
    return null;
  }

  const sourceOrganizations = Array.from(
    new Set(
      requestState.records.flatMap((record) =>
        record.sources.map((source) => source.source.organization),
      ),
    ),
  );

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-foreground">
          {firstRecord.commodity.name}
        </span>

        <span className="rounded-md border border-border px-2 py-1 text-muted-foreground">
          {firstRecord.unit.symbol}
        </span>
      </div>

      <div
        role="img"
        aria-label={`Grafik produksi ${firstRecord.commodity.name} berdasarkan data publik yang telah diverifikasi`}
        className="min-h-0 flex-1"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 8,
              right: 12,
              bottom: 0,
              left: -12,
            }}
          >
            <CartesianGrid
              stroke="var(--chart-grid, #1e3a5f)"
              strokeDasharray="4 4"
              vertical={false}
            />

            <XAxis dataKey="year" {...axisStyle} />

            <YAxis {...axisStyle} />

            <Tooltip contentStyle={tooltipStyle} />

            <Line
              type="monotone"
              dataKey="historical"
              name="Data historis"
              stroke="var(--chart-production, #22d3ee)"
              strokeWidth={3}
              connectNulls={false}
              dot={{
                r: 3,
                fill: "var(--chart-production, #22d3ee)",
                strokeWidth: 0,
              }}
              activeDot={{
                r: 5,
                fill: "var(--chart-production, #22d3ee)",
                strokeWidth: 0,
              }}
            />

            <Line
              type="monotone"
              dataKey="projection"
              name="Proyeksi"
              stroke="var(--chart-projection, #2dd4bf)"
              strokeWidth={3}
              strokeDasharray="6 6"
              connectNulls={false}
              dot={{
                r: 3,
                fill: "var(--chart-projection, #2dd4bf)",
                strokeWidth: 0,
              }}
              activeDot={{
                r: 5,
                fill: "var(--chart-projection, #2dd4bf)",
                strokeWidth: 0,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 truncate text-[11px] text-muted-foreground">
        {sourceOrganizations.length > 0
          ? `Sumber: ${sourceOrganizations.join(", ")}`
          : "Sumber tercatat pada metadata dataset."}
      </p>
    </div>
  );
}
