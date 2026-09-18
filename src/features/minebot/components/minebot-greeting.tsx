"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { MineBotBrandMark } from "./minebot-brand";

const STORAGE_KEY = "minevision.minebot.greeted.v1";

const GREETING_DELAY_MS = 4200;
const GREETING_HOLD_MS = 4500;
const GREETING_FADE_MS = 420;

type MineBotGreetingProps = {
  open: boolean;
};

/**
 * Automatic first-visit greeting. Appears once per browser session, shortly
 * after the page loads, as a small speech bubble anchored to the FAB. It never
 * opens the chat panel, and it is dismissed for the rest of the session if the
 * user opens the panel first.
 */
export function MineBotGreeting({ open }: MineBotGreetingProps) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const dismissedRef = useRef(false);

  // If the user opens the panel before the bubble sequence finishes, stop it.
  useEffect(() => {
    if (open) dismissedRef.current = true;
  }, [open]);

  // Run the greeting sequence once per mounted session.
  useEffect(() => {
    let cancelled = false;

    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {
      // Storage may be unavailable (private mode) — greeting simply shows.
    }

    const show = window.setTimeout(() => {
      if (cancelled || dismissedRef.current) return;
      setVisible(true);
    }, GREETING_DELAY_MS);

    const fade = window.setTimeout(() => {
      if (cancelled || dismissedRef.current) return;
      setLeaving(true);
    }, GREETING_DELAY_MS + GREETING_HOLD_MS);

    const hide = window.setTimeout(() => {
      if (cancelled || dismissedRef.current) return;
      setVisible(false);
      setLeaving(false);
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // ignore storage failures
      }
    }, GREETING_DELAY_MS + GREETING_HOLD_MS + GREETING_FADE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(show);
      window.clearTimeout(fade);
      window.clearTimeout(hide);
    };
  }, []);

  if (!visible || open) return null;

  return (
    <div
      className={cn(
        "fixed bottom-[136px] right-4 z-40 sm:right-8",
        leaving ? "minebot-greeting-out" : "minebot-greeting-in"
      )}
    >
      <div className="relative max-w-[248px] rounded-2xl rounded-br-[6px] border border-white/10 bg-surface-elevated px-3.5 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.4)]">
        <div className="mb-1.5 flex items-center gap-1.5">
          <MineBotBrandMark className="h-4 w-4" iconClassName="h-2 w-2" />
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-cyan/90">
            MineBot
          </span>
        </div>
        <p className="text-[13px] leading-relaxed text-foreground/90">
          Hai! Butuh informasi tentang pertambangan? Tanya MineBot saja.
        </p>
        <span
          className="absolute -bottom-[7px] right-6 h-3.5 w-3.5 rotate-45 rounded-[2px] border-b border-r border-white/10 bg-surface-elevated"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}