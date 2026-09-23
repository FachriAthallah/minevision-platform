"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

const PRESETS = [
  { days: 7, label: "7 hari" },
  { days: 30, label: "30 hari" },
  { days: 90, label: "90 hari" },
];

export function AdminRangeSelector({ days }: { days: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [custom, setCustom] = useState("");

  function navigate(target: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("days", String(Math.min(Math.max(Math.round(target), 1), 365)));
    router.push(`${pathname}?${params.toString()}`);
  }

  const isPreset = PRESETS.some((preset) => preset.days === days);

  return (
    <div
      role="group"
      aria-label="Rentang tanggal"
      className="flex flex-wrap items-center gap-1 rounded-md border border-admin-line bg-admin-surface p-1"
    >
      {PRESETS.map((preset) => (
        <button
          key={preset.days}
          type="button"
          onClick={() => navigate(preset.days)}
          aria-pressed={days === preset.days}
          className={cn(
            "rounded px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent",
            days === preset.days
              ? "bg-admin-accent/15 text-admin-accent"
              : "text-admin-muted hover:bg-admin-raised hover:text-admin-text",
          )}
        >
          {preset.label}
        </button>
      ))}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const value = Number(custom);
          if (!Number.isNaN(value) && value >= 1 && value <= 365) {
            navigate(value);
            setCustom("");
          }
        }}
        className="flex items-center gap-1 border-l border-admin-line pl-1"
      >
        <input
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="Custom"
          aria-label="Jumlah hari kustom"
          className={cn(
            "w-16 rounded bg-admin-raised/60 px-2 py-1.5 text-xs tabular-nums text-admin-text outline-none transition-colors placeholder:text-admin-muted/60 focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20",
            !isPreset && "bg-admin-accent/15",
          )}
        />
      </form>
    </div>
  );
}