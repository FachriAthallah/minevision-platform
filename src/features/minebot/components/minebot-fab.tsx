"use client";

import { useEffect, useRef, useState } from "react";
import { Bot } from "lucide-react";

import { cn } from "@/lib/utils";
import { MineBotGreeting } from "./minebot-greeting";
import { MineBotPanel } from "./minebot-panel";

export function MineBotFab() {
  const [isOpen, setIsOpen] = useState(false);
  const [pressed, setPressed] = useState(false);
  const fabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (pressed) {
      const id = window.setTimeout(() => setPressed(false), 300);
      return () => window.clearTimeout(id);
    }
  }, [pressed]);

  const handleOpen = () => {
    setPressed(true);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);

    requestAnimationFrame(() => {
      fabRef.current?.focus();
    });
  };

  return (
    <>
      <MineBotGreeting open={isOpen} />

      <div
        className="fixed right-4 z-40 bottom-[max(24px,env(safe-area-inset-bottom))] sm:bottom-8 sm:right-8"
        aria-hidden={isOpen}
      >
        <div
          className={cn(
            "relative",
            !isOpen && "minebot-fab-idle",
            pressed && "minebot-fab-open",
          )}
        >
          {!isOpen && <span className="minebot-fab-ring" aria-hidden="true" />}

          <button
            ref={fabRef}
            type="button"
            onClick={handleOpen}
            aria-label="Tanya MineBot"
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            tabIndex={isOpen ? -1 : 0}
            className={cn(
              "group relative flex h-[54px] items-center gap-2.5 rounded-full pr-5 pl-2",
              "border border-white/10 bg-[#0b1b31]/95 shadow-[0_14px_44px_rgba(0,0,0,0.45)]",
              "backdrop-blur transition hover:border-brand-cyan/50 hover:shadow-[0_16px_50px_rgba(0,177,196,0.22)]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan",
              "active:scale-[0.97]",
              isOpen && "pointer-events-none opacity-0",
            )}
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-blue via-brand-cyan to-brand-teal shadow-[0_4px_16px_rgba(0,177,196,0.4)]">
              <Bot
                className="h-5 w-5 text-[#02131a]"
                strokeWidth={2.1}
                aria-hidden="true"
              />
            </span>

            <span className="hidden flex-col items-start text-left min-[380px]:flex">
              <span className="text-[13px] font-semibold leading-tight text-foreground">
                MineBot
              </span>

              <span className="text-[10px] leading-tight text-muted-foreground">
                Tanya pertambangan
              </span>
            </span>
          </button>
        </div>
      </div>

      {isOpen && <MineBotPanel onClose={handleClose} />}
    </>
  );
}
