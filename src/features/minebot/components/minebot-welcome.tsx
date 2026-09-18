"use client";

import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { suggestedQuestions } from "../config/suggested-questions";
import { MineBotBrandMark } from "./minebot-brand";

type MineBotWelcomeProps = {
  onSuggested: (question: string) => void;
  disabled: boolean;
};

export function MineBotWelcome({ onSuggested, disabled }: MineBotWelcomeProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
      <div className="relative">
        <MineBotBrandMark className="h-12 w-12" iconClassName="h-5 w-5" />
        <span className="absolute inset-0 -z-10 rounded-[16px] bg-brand-cyan/10 blur-lg" aria-hidden="true" />
      </div>

      <h3 className="mt-5 font-serif text-xl font-bold leading-snug text-foreground">
        Hai, saya MineBot.
      </h3>
      <p className="mt-2 max-w-[280px] text-[13px] leading-relaxed text-muted-foreground">
        Jelajahi informasi pertambangan di MineVision atau tanyakan sesuatu
        yang ingin kamu ketahui.
      </p>

      <div className="mt-7 w-full max-w-[300px] space-y-2">
        {suggestedQuestions.default.slice(0, 3).map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => onSuggested(question)}
            disabled={disabled}
            className={cn(
              "group flex w-full items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-surface-elevated/50 px-4 py-3",
              "text-left text-[13px] font-medium text-foreground/85 transition",
              "hover:border-brand-cyan/40 hover:bg-surface-secondary/70",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan",
              disabled && "opacity-50"
            )}
          >
            <span>{question}</span>
            <ArrowRight
              className="h-3.5 w-3.5 shrink-0 text-brand-cyan opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100"
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    </div>
  );
}