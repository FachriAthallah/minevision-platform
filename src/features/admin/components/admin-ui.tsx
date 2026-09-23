import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-admin-line pb-5">
      <div>
        <h1 className="text-[26px] font-semibold leading-tight text-admin-text sm:text-[28px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-admin-muted">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-3">{actions}</div>
      ) : null}
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
        "rounded-lg border border-admin-line bg-admin-surface p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function AdminCardTitle({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <h2
      className={cn(
        "text-[15px] font-semibold leading-6 text-admin-text",
        className,
      )}
    >
      {children}
    </h2>
  );
}

export function AdminStat({
  label,
  value,
  delta,
  deltaLabel,
  deltaDirection,
  hint = "Belum ada data perbandingan.",
}: {
  label: string;
  value: string;
  delta?: number | null;
  deltaLabel?: string;
  deltaDirection?: "up" | "down";
  hint?: string;
}) {
  const hasDelta = typeof delta === "number" && delta !== null;

  return (
    <AdminCard className="flex flex-col">
      <p className="text-xs font-medium text-admin-muted">{label}</p>
      <p className="mt-2 text-[34px] font-bold leading-none tracking-tight text-admin-text tabular-nums">
        {value}
      </p>
      {hasDelta ? (
        <p
          className={cn(
            "mt-3 inline-flex items-center gap-1 text-xs font-medium",
            deltaDirection === "down" ? "text-admin-good" : "text-admin-accent",
          )}
        >
          {delta > 0 ? "↑" : "↓"} {Math.abs(delta).toFixed(1)}%
          {deltaLabel ? (
            <span className="text-admin-muted">{deltaLabel}</span>
          ) : null}
        </p>
      ) : (
        <p className="mt-3 text-xs leading-5 text-admin-muted">{hint}</p>
      )}
    </AdminCard>
  );
}

export function AdminRangeHint({ from, to }: { from: string; to: string }) {
  return (
    <p className="text-xs text-admin-muted">
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
      className="flex flex-col items-center justify-center rounded-md border border-dashed border-admin-line bg-admin-raised/40 px-6 py-10 text-center"
    >
      <h3 className="text-base font-semibold text-admin-text">{title}</h3>
      <p className="mt-1 max-w-xl text-sm leading-6 text-admin-muted">
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
            "h-4 rounded bg-admin-raised",
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
      <h1 className="text-2xl font-semibold text-admin-text">403</h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-admin-muted">
        {message}
      </p>
    </div>
  );
}

export function AdminNote({
  tone = "info",
  className,
  children,
}: {
  tone?: "info" | "good" | "warn" | "bad";
  className?: string;
  children: ReactNode;
}) {
  const tones: Record<typeof tone, string> = {
    info: "border-admin-line bg-admin-raised/50 text-admin-muted",
    good: "border-admin-good/30 bg-admin-good/10 text-admin-good",
    warn: "border-admin-warn/30 bg-admin-warn/10 text-admin-warn",
    bad: "border-admin-bad/30 bg-admin-bad/10 text-admin-bad",
  };

  return (
    <p
      className={cn(
        "rounded-md border px-4 py-3 text-xs leading-5",
        tones[tone],
        className,
      )}
    >
      {children}
    </p>
  );
}

export type StatusTone = "good" | "warn" | "bad" | "neutral";

const STATUS_BADGE: Record<StatusTone, { badge: string; dot: string }> = {
  good: {
    badge: "bg-admin-good/10 text-admin-good",
    dot: "bg-admin-good",
  },
  warn: {
    badge: "bg-admin-warn/10 text-admin-warn",
    dot: "bg-admin-warn",
  },
  bad: {
    badge: "bg-admin-bad/10 text-admin-bad",
    dot: "bg-admin-bad",
  },
  neutral: {
    badge: "bg-admin-raised text-admin-muted",
    dot: "bg-admin-muted",
  },
};

export function StatusBadge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: StatusTone;
  children: ReactNode;
  className?: string;
}) {
  const { badge, dot } = STATUS_BADGE[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        badge,
        className,
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", dot)} />
      {children}
    </span>
  );
}

export function AdminTable({
  caption,
  headers,
  aligns,
  children,
}: {
  caption?: string;
  headers: string[];
  aligns?: Array<"right" | "left">;
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-admin-line">
      <table className="admin-table w-full text-left text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th
                  key={header}
                  scope="col"
                  className={cn(
                    "text-left",
                    aligns?.[index] === "right" && "text-right",
                  )}
                >
                  {header}
                </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function AdminNumberCell({
  children,
  className,
  align = "right",
}: {
  children: ReactNode;
  className?: string;
  align?: "right" | "left";
}) {
  return (
    <td
      className={cn(
        "tabular-nums text-admin-muted",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
    >
      {children}
    </td>
  );
}

const buttonBase =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent disabled:cursor-not-allowed disabled:opacity-40";

const buttonVariants: Record<string, string> = {
  primary:
    "bg-admin-accent text-admin-ink hover:bg-[#45e0d4] disabled:hover:bg-admin-accent",
  secondary:
    "border border-admin-line text-admin-text hover:border-admin-muted hover:text-white",
  ghost: "text-admin-muted hover:bg-admin-raised hover:text-admin-text",
  danger:
    "border border-admin-bad/30 text-admin-bad hover:border-admin-bad/60 hover:bg-admin-bad/10",
};

export function AdminButton({
  variant = "primary",
  className,
  children,
  ...props
}: {
  variant?: keyof typeof buttonVariants;
  className?: string;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(buttonBase, buttonVariants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export const ADMIN_INPUT_CLASS =
  "min-h-10 w-full rounded-md border border-admin-line bg-admin-raised/60 px-3.5 text-sm text-admin-text outline-none transition-colors placeholder:text-admin-muted/60 focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20";

export const ADMIN_TEXTAREA_CLASS =
  "w-full rounded-md border border-admin-line bg-admin-raised/60 px-3.5 py-2.5 text-sm text-admin-text outline-none transition-colors placeholder:text-admin-muted/60 focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20";

export function AdminFieldLabel({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <span className="mb-1.5 block text-xs font-medium text-admin-muted">
      {children}
    </span>
  );
}