"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axis = {
  stroke: "var(--admin-muted)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
  strokeWidth: 0,
};
const gridColor = "var(--admin-line)";
const tooltipStyle = {
  background: "var(--admin-surface)",
  border: "1px solid var(--admin-line)",
  borderRadius: 8,
  color: "var(--admin-text)",
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
          <CartesianGrid stroke={gridColor} strokeOpacity={0.5} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" {...axis} />
          <YAxis {...axis} width={44} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: "var(--admin-text)", fontWeight: 600 }}
            itemStyle={{ color: "var(--admin-text)" }}
            formatter={(value, name) => [
              Number(value ?? 0).toLocaleString("id-ID"),
              name,
            ]}
          />
          <Line type="monotone" dataKey="visitors" stroke="var(--admin-accent)" strokeWidth={2} dot={false} name="Visitors" />
          <Line type="monotone" dataKey="pageviews" stroke="var(--admin-muted)" strokeWidth={2} dot={false} name="Pageviews" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AdminDonutByKey({
  data,
  colors,
}: {
  data: Array<{ label: string; value: number }>;
  colors?: string[];
}) {
  if (!data.length) return null;

  const max = Math.max(...data.map((row) => row.value), 1);
  const palette = colors ?? ["var(--admin-accent)", "var(--admin-gold)", "var(--admin-muted)"];

  return (
    <div className="space-y-3">
      {data.map((row, index) => (
        <div key={row.label}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 font-medium text-admin-text">
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-sm"
                style={{ background: palette[index % palette.length] }}
              />
              {row.label}
            </span>
            <span className="tabular-nums text-admin-muted">
              {row.value.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-admin-ink">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(4, (row.value / max) * 100)}%`,
                background: palette[index % palette.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminEngagementBars({
  data,
  colors,
}: {
  data: Array<{ label: string; value: number }>;
  colors?: string[];
}) {
  const palette = colors ?? ["var(--admin-accent)", "var(--admin-gold)", "var(--admin-good)"];

  return (
    <div role="img" aria-label="Breakdown interaksi" className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -12 }} accessibilityLayer>
          <CartesianGrid stroke={gridColor} strokeOpacity={0.5} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" {...axis} tickFormatter={(value) => String(value).slice(0, 12)} />
          <YAxis {...axis} width={44} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: "var(--admin-text)", fontWeight: 600 }}
            itemStyle={{ color: "var(--admin-text)" }}
            formatter={(value) =>
              Number(value ?? 0).toLocaleString("id-ID")
            }
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Interaksi" maxBarSize={42}>
            {data.map((entry, index) => (
              <Cell
                key={entry.label}
                fill={palette[index % palette.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AdminDonutChart({
  data,
  colors,
  centerLabel,
}: {
  data: Array<{ label: string; value: number }>;
  colors?: string[];
  centerLabel?: string;
}) {
  if (!data.length) return null;

  const total = data.reduce((sum, row) => sum + row.value, 0);
  const palette = colors ?? ["var(--admin-accent)", "var(--admin-gold)", "var(--admin-muted)"];

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div
        role="img"
        aria-label="Distribusi kategori"
        className="relative h-[190px] w-full max-w-[190px] shrink-0"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart accessibilityLayer>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={62}
              outerRadius={90}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((row, index) => (
                <Cell
                  key={row.label}
                  fill={palette[index % palette.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: "var(--admin-text)", fontWeight: 600 }}
              itemStyle={{ color: "var(--admin-text)" }}
              formatter={(value) =>
                Number(value ?? 0).toLocaleString("id-ID")
              }
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-[22px] font-bold leading-none tracking-tight text-admin-text tabular-nums">
            {total.toLocaleString("id-ID")}
          </p>
          {centerLabel ? (
            <p className="mt-1 text-[11px] leading-tight text-admin-muted">
              {centerLabel}
            </p>
          ) : null}
        </div>
      </div>
      <div className="w-full min-w-0 space-y-2.5">
        {data.map((row, index) => {
          const share = total > 0 ? (row.value / total) * 100 : 0;
          return (
            <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 font-medium text-admin-text">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-sm"
                  style={{ background: palette[index % palette.length] }}
                />
                <span className="truncate">{row.label}</span>
              </span>
              <span className="shrink-0 tabular-nums text-admin-muted">
                {share.toFixed(1)}% · {row.value.toLocaleString("id-ID")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}