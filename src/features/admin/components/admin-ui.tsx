import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
      <div>
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-cyan">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#9FACBA]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </header>
  );
}

export function AdminCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/10 bg-[#071426] p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function AdminStat({
  label,
  value,
  delta,
  deltaLabel,
  deltaDirection,
}: {
  label: string;
  value: string;
  delta?: number | null;
  deltaLabel?: string;
  deltaDirection?: "up" | "down";
}) {
  const hasDelta = typeof delta === "number" && delta !== null;

  return (
    <AdminCard>
      <p className="text-xs font-bold uppercase tracking-wider text-[#9FACBA]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      {hasDelta ? (
        <p
          className={cn(
            "mt-2 inline-flex items-center gap-1 text-xs font-semibold",
            deltaDirection === "down" ? "text-success" : "text-brand-cyan",
          )}
        >
          {delta > 0 ? "↑" : "↓"} {Math.abs(delta).toFixed(1)}%
          {deltaLabel ? <span className="text-[#718196]">{deltaLabel}</span> : null}
        </p>
      ) : (
        <p className="mt-2 text-xs text-[#718196]">Belum cukup data</p>
      )}
    </AdminCard>
  );
}

export function AdminRangeHint({ from, to }: { from: string; to: string }) {
  return (
    <p className="text-xs text-[#718196]">
      Rentang: {new Date(from).toLocaleDateString("id-ID")} –{" "}
      {new Date(to).toLocaleDateString("id-ID")}
    </p>
  );
}

export function AdminEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      role="status"
      className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#061122] px-6 py-12 text-center"
    >
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-[#9FACBA]">
        {description}
      </p>
    </div>
  );
}

export function AdminSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div role="status" aria-label="Memuat konten" className="animate-pulse space-y-3">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-4 rounded bg-white/5",
            index === 0 && "w-1/3",
            index === lines - 1 && "w-2/3",
          )}
        />
      ))}
    </div>
  );
}

export function AdminForbidden({ message }: { message: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-bold text-white">403</h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#9FACBA]">
        {message}
      </p>
    </div>
  );
}