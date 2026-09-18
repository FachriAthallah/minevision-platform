"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axis = { stroke: "#8190a3", fontSize: 11, tickLine: false, axisLine: false };
const tooltipStyle = {
  background: "#08172a",
  border: "1px solid rgba(255,255,255,.14)",
  borderRadius: 12,
  color: "#ffffff",
  fontSize: 12,
};

export function AdminTrafficSeries({
  data,
}: {
  data: Array<{ day: string; visitors: number; pageviews: number }>;
}) {
  return (
    <div
      role="img"
      aria-label="Tren pengunjung dan pageviews harian"
      className="h-[280px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -12 }} accessibilityLayer>
          <CartesianGrid stroke="#18304d" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="day" {...axis} />
          <YAxis {...axis} width={44} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#ffffff", fontWeight: 700 }} itemStyle={{ color: "#ffffff" }} />
          <Line type="monotone" dataKey="visitors" stroke="#00b1c4" strokeWidth={2} dot={false} name="Visitors" />
          <Line type="monotone" dataKey="pageviews" stroke="#3cc3ab" strokeWidth={2} dot={false} name="Pageviews" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AdminDonutByKey({
  data,
}: {
  data: Array<{ label: string; value: number }>;
}) {
  if (!data.length) return null;

  const max = Math.max(...data.map((row) => row.value), 1);

  return (
    <div className="space-y-3">
      {data.map((row) => (
        <div key={row.label}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-white">{row.label}</span>
            <span className="text-[#9FACBA]">{row.value.toLocaleString("id-ID")}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#061122]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand-blue),var(--brand-cyan),var(--brand-teal))]"
              style={{ width: `${Math.max(6, (row.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminEngagementBars({
  data,
}: {
  data: Array<{ label: string; value: number }>;
}) {
  return (
    <div role="img" aria-label="Breakdown interaksi" className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -12 }} accessibilityLayer>
          <CartesianGrid stroke="#18304d" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="label" {...axis} tickFormatter={(value) => String(value).slice(0, 12)} />
          <YAxis {...axis} width={44} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#ffffff", fontWeight: 700 }} itemStyle={{ color: "#ffffff" }} />
          <Bar dataKey="value" fill="#00b1c4" radius={[6, 6, 0, 0]} name="Interaksi" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}