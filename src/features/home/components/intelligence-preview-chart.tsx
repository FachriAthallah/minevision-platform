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

const productionData = [
  { year: "2019", actual: 420, projected: null },
  { year: "2020", actual: 405, projected: null },
  { year: "2021", actual: 480, projected: null },
  { year: "2022", actual: 370, projected: null },
  { year: "2023", actual: 610, projected: 610 },
  { year: "2024", actual: null, projected: 760 },
  { year: "2025", actual: null, projected: 920 },
];

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
  return (
    <div
      role="img"
      aria-label="Grafik demonstrasi produksi aktual dan proyeksi tahun 2019 sampai 2025"
      className="h-full w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={productionData}
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
            dataKey="actual"
            name="Produksi aktual"
            stroke="var(--chart-production, #22d3ee)"
            strokeWidth={3}
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
            dataKey="projected"
            name="Proyeksi"
            stroke="var(--chart-projection, #2dd4bf)"
            strokeWidth={3}
            strokeDasharray="6 6"
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
  );
}