import type { LucideIcon } from "lucide-react";
import { Building2, FileSearch, MapPinned, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

type IndustryStateProps = {
  kind: "companies" | "reports" | "operations" | "error";
  title: string;
  description: string;
  className?: string;
};

const stateIcons: Record<IndustryStateProps["kind"], LucideIcon> = {
  companies: Building2,
  reports: FileSearch,
  operations: MapPinned,
  error: TriangleAlert,
};

export function IndustryState({
  kind,
  title,
  description,
  className,
}: IndustryStateProps) {
  const Icon = stateIcons[kind];

  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={cn(
        "rounded-2xl border border-border bg-surface p-7 text-center sm:p-10",
        className,
      )}
    >
      <span className="mx-auto flex size-12 items-center justify-center rounded-full border border-brand-cyan/25 bg-brand-cyan/5">
        <Icon
          aria-hidden="true"
          className={cn(
            "size-5",
            kind === "error" ? "text-danger" : "text-brand-cyan",
          )}
        />
      </span>
      <h3 className="mt-5 text-xl text-foreground">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
