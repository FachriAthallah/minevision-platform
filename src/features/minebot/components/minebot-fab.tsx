import { Bot } from "lucide-react";

export function MineBotFab() {
  return (
    <button
      type="button"
      className="fixed right-4 bottom-6 z-50 flex flex-col items-center gap-1.5 sm:right-8 sm:bottom-8"
      aria-label="Buka MineBot AI"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-accent/50 bg-surface-elevated shadow-[var(--shadow-float)] transition-transform hover:scale-105">
        <Bot aria-hidden="true" className="h-7 w-7 text-accent" />
      </span>

      <span className="text-[11px] text-muted-foreground">MineBot AI</span>

      <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-teal" />
        Online
      </span>
    </button>
  );
}
