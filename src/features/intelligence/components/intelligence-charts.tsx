"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  formatCompactNumber,
  formatFullValue,
  formatPriceValue,
} from "../lib/intelligence-format";
import { getPriceYear } from "../lib/intelligence-dashboard";
import type {
  PublicIntelligencePrice,
  PublicIntelligenceProduction,
} from "../types/dashboard";

const axis = {
  stroke: "#8190a3",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

const tooltip = {
  background: "#08172a",
  border: "1px solid rgba(255,255,255,.13)",
  borderRadius: 12,
  color: "#f8fafc",
  fontSize: 12,
};

export function IntelligenceProductionChart({
  records,
  selectedYear,
  color,
}: {
  records: PublicIntelligenceProduction[];
  selectedYear: "all" | number;
  color: string;
}) {
  const unit = records[0]?.unit.symbol ?? "";
  return (
    <div
      role="img"
      aria-label={`Grafik batang tren produksi dalam ${unit}`}
      className="h-[290px] w-full sm:h-[340px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={records} margin={{ top: 12, right: 8, bottom: 0, left: -10 }} accessibilityLayer>
          <CartesianGrid stroke="#18304d" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="year" {...axis} />
          <YAxis {...axis} width={58} tickFormatter={formatCompactNumber} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,.035)" }}
            contentStyle={tooltip}
            labelStyle={{ color: "#f8fafc", fontWeight: 700 }}
            itemStyle={{ color: "#f8fafc" }}
            formatter={(value) => [formatFullValue(Number(value), unit), "Produksi"]}
            labelFormatter={(label) => `Tahun ${label}`}
          />
          <Bar dataKey="value" name="Produksi" radius={[6, 6, 0, 0]} isAnimationActive={false}>
            {records.map((record) => (
              <Cell
                key={`${record.year}-${record.recordType}`}
                fill={color}
                fillOpacity={selectedYear === "all" || selectedYear === record.year ? 1 : 0.34}
                stroke={selectedYear === record.year ? "#ffffff" : "transparent"}
                strokeWidth={selectedYear === record.year ? 2 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function IntelligencePriceChart({
  records,
  selectedYear,
  color,
}: {
  records: PublicIntelligencePrice[];
  selectedYear: "all" | number;
  color: string;
}) {
  const data = records.map((record) => ({ ...record, year: getPriceYear(record) }));
  const first = records[0];

  return (
    <div
      role="img"
      aria-label={`Grafik garis harga ${first?.standard.name ?? "domestik"}`}
      className="h-[290px] w-full sm:h-[340px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -10 }} accessibilityLayer>
          <CartesianGrid stroke="#18304d" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="year" {...axis} />
          <YAxis {...axis} width={58} tickFormatter={formatCompactNumber} />
          <Tooltip
            contentStyle={tooltip}
            labelStyle={{ color: "#f8fafc", fontWeight: 700 }}
            itemStyle={{ color: "#f8fafc" }}
            formatter={(value, _name, item) => {
              const payload = item.payload as (typeof data)[number];
              return [
                formatPriceValue(Number(value), payload.currencyCode, payload.unit.symbol, false),
                `${payload.standard.code} · ${payload.periodLabel ?? payload.period} · ${payload.recordType}`,
              ];
            }}
            labelFormatter={(label) => `Tahun ${label}`}
          />
          <Line
            type="monotone"
            dataKey="value"
            name="Harga"
            stroke={color}
            strokeWidth={3}
            connectNulls={false}
            isAnimationActive={false}
            dot={({ cx, cy, payload }) => {
              const active = selectedYear === "all" || selectedYear === payload.year;
              return (
                <circle
                  key={`${payload.year}-${payload.recordType}`}
                  cx={cx}
                  cy={cy}
                  r={selectedYear === payload.year ? 6 : 4}
                  fill={active ? color : "#415169"}
                  stroke={selectedYear === payload.year ? "#ffffff" : "#020817"}
                  strokeWidth={2}
                />
              );
            }}
            activeDot={{ r: 7, fill: color, stroke: "#ffffff", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
