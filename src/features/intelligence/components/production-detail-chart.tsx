"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { transformProductionRecords } from "../lib/production-series";
import type {
  ProductionRecordType,
  PublicProductionRecord,
} from "../types/production";

type ProductionDetailChartProps = {
  records: PublicProductionRecord[];
};

type HistoricalDotProps = {
  cx?: number;
  cy?: number;
  payload?: {
    historicalType:
      | Exclude<ProductionRecordType, "projection">
      | null;
  };
};

const historicalColors: Record<
  Exclude<ProductionRecordType, "projection">,
  string
> = {
  actual: "var(--chart-production, #22d3ee)",
  provisional: "var(--chart-provisional, #f59e0b)",
  revised: "var(--chart-revised, #c7a86b)",
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

function HistoricalDot({ cx, cy, payload }: HistoricalDotProps) {
  if (
    cx === undefined ||
    cy === undefined ||
    !payload?.historicalType
  ) {
    return <g />;
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={historicalColors[payload.historicalType]}
      stroke="var(--color-background, #020817)"
      strokeWidth={2}
    />
  );
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function ProductionDetailChart({
  records,
}: ProductionDetailChartProps) {
  const chartData = transformProductionRecords(records);
  const firstRecord = records[0];

  if (!firstRecord) {
    return null;
  }

  return (
    <div className="flex h-[360px] w-full flex-col sm:h-[430px]">
      <div
        role="img"
        aria-label={`Grafik produksi ${firstRecord.commodity.name} dalam ${firstRecord.unit.symbol}. Data historis ditampilkan dengan garis solid dan proyeksi dengan garis putus-putus.`}
        className="min-h-0 flex-1"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 12,
              right: 16,
              bottom: 4,
              left: 0,
            }}
          >
            <CartesianGrid
              stroke="var(--chart-grid, #1e3a5f)"
              strokeDasharray="4 4"
              vertical={false}
            />

            <XAxis dataKey="year" {...axisStyle} />

            <YAxis
              {...axisStyle}
              width={54}
              tickFormatter={formatCompactNumber}
            />

            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value, name) => [
                `${Number(value).toLocaleString("id-ID", {
                  maximumFractionDigits: 2,
                })} ${firstRecord.unit.symbol}`,
                name,
              ]}
            />

            <Line
              type="monotone"
              dataKey="historical"
              name="Data historis"
              stroke="var(--chart-production, #22d3ee)"
              strokeWidth={3}
              connectNulls={false}
              dot={<HistoricalDot />}
              activeDot={{
                r: 6,
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
              strokeDasharray="7 6"
              connectNulls={false}
              dot={{
                r: 4,
                fill: "var(--chart-projection, #2dd4bf)",
                strokeWidth: 0,
              }}
              activeDot={{
                r: 6,
                fill: "var(--chart-projection, #2dd4bf)",
                strokeWidth: 0,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-7 bg-brand-cyan" />
          Historis
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-cyan" />
          Actual
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-warning" />
          Provisional
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-gold" />
          Revised
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="w-7 border-t-2 border-dashed border-brand-teal" />
          Projection
        </span>
      </div>
    </div>
  );
}
