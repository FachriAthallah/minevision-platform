import { Bot } from "lucide-react";

import { cn } from "@/lib/utils";

type MineBotBrandMarkProps = {
  className?: string;
  iconClassName?: string;
};

/**
 * Small MineBot identity mark — a cyan gradient orb used across the FAB,
 * header, welcome state, and assistant messages. Kept in one place so the
 * identity feels consistent everywhere.
 */
export function MineBotBrandMark({ className, iconClassName }: MineBotBrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-brand-blue via-brand-cyan to-brand-teal shadow-[0_4px_14px_rgba(0,177,196,0.35)]",
        className
      )}
    >
      <Bot className={cn("text-[#02131a]", iconClassName)} strokeWidth={2.2} />
    </span>
  );
}