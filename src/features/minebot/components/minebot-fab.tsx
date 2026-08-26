import { Bot } from "lucide-react";

export function MineBotFab() {
  return (
    <button
      type="button"
      className="fixed right-4 bottom-6 z-40 flex flex-col items-center gap-1.5 sm:right-8 sm:bottom-8"
      aria-label="Buka MineBot AI"
    >
      <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(var(--surface-elevated),var(--surface-elevated))_padding-box,linear-gradient(135deg,var(--brand-blue),var(--brand-cyan),var(--brand-teal))_border-box] border border-transparent shadow-[var(--shadow-float)] sm:h-[72px] sm:w-[72px]">
        <Bot aria-hidden="true" className="h-7 w-7 text-brand-cyan sm:h-8 sm:w-8" />
      </span>

      <span className="text-[11px] font-medium text-nav-muted">MineBot AI</span>

      <span className="flex items-center gap-1.5 text-[10px] text-brand-teal">
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-teal shadow-[0_0_7px_rgba(60,195,171,0.85)]" />
        Online
      </span>
    </button>
  );
}
