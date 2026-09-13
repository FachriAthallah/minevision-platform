"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { PublicGdpRecord } from "../types/gdp";
import {
  formatEconomyCompactNumber,
  formatEconomyCurrency,
  formatEconomyNumber,
} from "../lib/economy-format";

const axis = {
  stroke: "#8190a3",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  background: "#08172a",
  border: "1px solid rgba(255,255,255,.14)",
  borderRadius: 12,
  color: "#ffffff",
  fontSize: 12,
};

export function GdpContributionChart({
  records,
  activeYear,
}: {
  records: PublicGdpRecord[];
  activeYear: number | null;
}) {
  return (
    <div role="img" aria-label="Grafik kontribusi pertambangan terhadap PDB nasional" className="h-[280px] w-full sm:h-[330px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={records} margin={{ top: 12, right: 12, bottom: 0, left: -12 }} accessibilityLayer>
          <CartesianGrid stroke="#18304d" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="year" {...axis} />
          <YAxis {...axis} width={58} tickFormatter={(value) => `${formatEconomyNumber(Number(value))}%`} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: "#ffffff", fontWeight: 700 }}
            itemStyle={{ color: "#ffffff" }}
            formatter={(value) => [`${formatEconomyNumber(Number(value))}%`, "Kontribusi"]}
            labelFormatter={(label) => `Tahun ${label}`}
          />
          <Line
            type="monotone"
            dataKey="contributionPercentage"
            name="Kontribusi"
            connectNulls={false}
            stroke="#00b1c4"
            strokeWidth={3}
            isAnimationActive
            animationDuration={500}
            dot={({ cx, cy, payload }) => (
              <circle
                cx={cx}
                cy={cy}
                r={payload.year === activeYear ? 6 : 4}
                fill={payload.year === activeYear ? "#3cc3ab" : "#00b1c4"}
                stroke={payload.year === activeYear ? "#ffffff" : "#020817"}
                strokeWidth={2}
              />
            )}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GdpValueChart({
  records,
  activeYear,
}: {
  records: PublicGdpRecord[];
  activeYear: number | null;
}) {
  const first = records[0];
  return (
    <div role="img" aria-label="Grafik nilai nominal PDB Pertambangan dan Penggalian ADHB" className="h-[280px] w-full sm:h-[330px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={records} margin={{ top: 12, right: 8, bottom: 0, left: -8 }} accessibilityLayer>
          <CartesianGrid stroke="#18304d" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="year" {...axis} />
          <YAxis {...axis} width={70} tickFormatter={formatEconomyCompactNumber} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,.035)" }}
            contentStyle={tooltipStyle}
            labelStyle={{ color: "#ffffff", fontWeight: 700 }}
            itemStyle={{ color: "#ffffff" }}
            formatter={(value) => [
              formatEconomyCurrency(Number(value), first?.currencyCode ?? "IDR", first?.valueScale ?? "billion"),
              "PDB Pertambangan ADHB",
            ]}
            labelFormatter={(label) => `Tahun ${label}`}
          />
          <Bar dataKey="miningQuarryingGdpValue" name="PDB Pertambangan ADHB" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={500}>
            {records.map((record) => (
              <Cell
                key={record.year}
                fill={record.year === activeYear ? "#3cc3ab" : "#2867e4"}
                fillOpacity={record.year === activeYear ? 1 : 0.7}
                stroke={record.year === activeYear ? "#ffffff" : "transparent"}
                strokeWidth={record.year === activeYear ? 2 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export type EconomyChartPoint = {
  label: string;
  value: number;
  secondaryValue?: number | null;
};

export function EconomyReadyBarChart({
  data,
  label,
  valueLabel,
}: {
  data: EconomyChartPoint[];
  label: string;
  valueLabel: string;
}) {
  return (
    <div role="img" aria-label={label} className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: -8 }} accessibilityLayer>
          <CartesianGrid stroke="#18304d" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="label" {...axis} />
          <YAxis {...axis} width={70} tickFormatter={formatEconomyCompactNumber} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: "#ffffff", fontWeight: 700 }}
            itemStyle={{ color: "#ffffff" }}
            formatter={(value) => [formatEconomyNumber(Number(value)), valueLabel]}
          />
          <Bar dataKey="value" name={valueLabel} fill="#00b1c4" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export type EconomyGroupedChartPoint = {
  label: string;
  pma: number | null;
  pmdn: number | null;
};

export function EconomyGroupedInvestmentChart({
  data,
  currencyCode,
  valueScale,
}: {
  data: EconomyGroupedChartPoint[];
  currencyCode: string;
  valueScale: string;
}) {
  return (
    <div role="img" aria-label="Grafik PMA dan PMDN per tahun" className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: -8 }} accessibilityLayer>
          <CartesianGrid stroke="#18304d" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="label" {...axis} />
          <YAxis {...axis} width={70} tickFormatter={formatEconomyCompactNumber} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,.035)" }}
            contentStyle={tooltipStyle}
            labelStyle={{ color: "#ffffff", fontWeight: 700 }}
            itemStyle={{ color: "#ffffff" }}
            formatter={(value, name) => [
              formatEconomyCurrency(Number(value), currencyCode, valueScale),
              String(name).toUpperCase(),
            ]}
          />
          <Legend wrapperStyle={{ color: "#b7c3d1", fontSize: 12 }} />
          <Bar dataKey="pma" name="PMA" fill="#2867e4" radius={[6, 6, 0, 0]} />
          <Bar dataKey="pmdn" name="PMDN" fill="#3cc3ab" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
