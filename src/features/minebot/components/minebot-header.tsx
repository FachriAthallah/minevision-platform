"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, Trash2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { MineBotBrandMark } from "./minebot-brand";

type MineBotHeaderProps = {
  onClose: () => void;
  onClear: () => void;
};

export function MineBotHeader({ onClose, onClear }: MineBotHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
        setConfirmClear(false);
      }
    };
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setConfirmClear(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [menuOpen]);

  const handleClearClick = () => {
    if (confirmClear) {
      onClear();
      setConfirmClear(false);
      setMenuOpen(false);
    } else {
      setConfirmClear(true);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3.5 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <MineBotBrandMark className="h-8 w-8" iconClassName="h-3.5 w-3.5" />
        <div className="min-w-0">
          <h2 className="truncate font-serif text-[18px] font-bold leading-tight text-foreground">
            MineBot
          </h2>
          <p className="truncate text-[11px] leading-snug text-muted-foreground">
            MineVision AI Assistant
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setMenuOpen((open) => !open);
              setConfirmClear(false);
            }}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Menu percakapan"
            className={cn(
              "grid h-9 w-9 place-items-center rounded-[12px] text-muted-foreground transition",
              "hover:bg-white/[0.06] hover:text-foreground",
              "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-cyan"
            )}
          >
            <MoreVertical className="h-5 w-5" aria-hidden="true" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              aria-label="Menu percakapan"
              className={cn(
                "absolute right-0 top-full z-10 mt-1.5 w-56 overflow-hidden",
                "rounded-2xl border border-white/10 bg-surface-secondary shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
              )}
            >
              {!confirmClear ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleClearClick}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium text-foreground/85 transition hover:bg-white/[0.05] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-brand-cyan"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  Bersihkan percakapan
                </button>
              ) : (
                <div className="px-3.5 py-3">
                  <p className="text-[12px] leading-relaxed text-muted-foreground">
                    Hapus semua pesan dalam percakapan ini?
                  </p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClearClick}
                      className="rounded-lg bg-danger/15 px-3 py-1.5 text-[12px] font-semibold text-danger transition hover:bg-danger/25 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-cyan"
                    >
                      Hapus
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition hover:bg-white/[0.05] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-cyan"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup MineBot"
          className={cn(
            "grid h-9 w-9 place-items-center rounded-[12px] text-muted-foreground transition",
            "hover:bg-white/[0.06] hover:text-foreground",
            "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-cyan"
          )}
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}