"use client";

import { useEffect, useRef } from "react";
import { ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";

type MineBotInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
};

export function MineBotInput({ value, onChange, onSend, disabled }: MineBotInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, [value]);

  const canSend = value.trim().length > 0 && !disabled;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (canSend) onSend();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSend) onSend();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-white/[0.07] px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 sm:px-4"
    >
      <div
        className={cn(
          "flex items-end gap-2 rounded-[18px] border border-white/10 bg-surface-secondary/70 px-3 py-1.5",
          "transition-shadow focus-within:border-brand-cyan/50 focus-within:shadow-[0_0_0_3px_rgba(0,177,196,0.12)]"
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Tanya MineBot..."
          aria-label="Pertanyaan ke MineBot"
          className={cn(
            "max-h-24 min-h-[24px] flex-1 resize-none bg-transparent py-1.5 text-[14px] leading-relaxed text-foreground",
            "placeholder:text-muted-foreground/60 focus:outline-none"
          )}
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Kirim pertanyaan"
          aria-disabled={!canSend}
          className={cn(
            "mb-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[14px] text-[#02131a] transition",
            "enabled:bg-gradient-to-br enabled:from-brand-cyan enabled:to-brand-teal",
            "enabled:shadow-[0_4px_14px_rgba(0,177,196,0.35)] enabled:hover:brightness-110 enabled:active:scale-95",
            "disabled:cursor-not-allowed disabled:opacity-35",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan"
          )}
        >
          <ArrowUp className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <p className="mt-2 hidden text-[10px] text-muted-foreground/60 sm:block">
        Enter untuk mengirim · Shift+Enter untuk baris baru
      </p>
    </form>
  );
}