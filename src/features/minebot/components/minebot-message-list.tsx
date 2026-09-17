"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Square } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MineBotUiMessage } from "../client/chat-state";
import { MineBotMessage } from "./minebot-message";
import { MineBotWelcome } from "./minebot-welcome";

type MineBotMessageListProps = {
  messages: MineBotUiMessage[];
  isLoading: boolean;
  onSuggested: (question: string) => void;
  onRetry: () => void;
  onCancel: () => void;
};

const BOTTOM_THRESHOLD = 56;

/**
 * Distance kept between the last answer text and the bottom edge of the list.
 * Citations ("Sumber"), related links, and follow-up pills stay just below the
 * fold so autoscroll lands on the core of the answer instead of the sources.
 */
const ANSWER_MARGIN = 28;

function resolveAnswerAnchor(el: HTMLElement, messageId: string): HTMLElement | null {
  return el.querySelector(`[data-answer-id="${CSS.escape(messageId)}"]`);
}

function scrollToAnswer(
  el: HTMLElement,
  anchor: HTMLElement,
  behavior: ScrollBehavior
) {
  const anchorBottom = anchor.getBoundingClientRect().bottom;
  const containerBottom = el.getBoundingClientRect().bottom;
  const target = el.scrollTop + (anchorBottom - containerBottom) + ANSWER_MARGIN;
  el.scrollTo({ top: target, behavior });
}

export function MineBotMessageList({
  messages,
  isLoading,
  onSuggested,
  onRetry,
  onCancel,
}: MineBotMessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const followRef = useRef(true);
  const [showJump, setShowJump] = useState(false);

  // Anchor to the latest conversation whenever new content arrives while the
  // user is following from the bottom. For assistant answers the scroll target
  // is the answer body itself — not the citations below it. No fixed timeouts:
  // this runs on every message/stream update (including citation cards).
  useEffect(() => {
    const el = listRef.current;
    if (!el || !followRef.current) return;

    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (lastAssistant) {
      const anchor = resolveAnswerAnchor(el, lastAssistant.id);
      if (anchor) {
        scrollToAnswer(el, anchor, "auto");
        return;
      }
    }
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_THRESHOLD;
    followRef.current = atBottom;
    setShowJump(!atBottom);
  };

  const scrollToLatest = () => {
    const el = listRef.current;
    if (!el) return;

    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    const anchor = lastAssistant ? resolveAnswerAnchor(el, lastAssistant.id) : null;
    if (anchor) {
      scrollToAnswer(el, anchor, "smooth");
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
    followRef.current = true;
    setShowJump(false);
  };

  const lastUserMessage = [...messages]
    .reverse()
    .find((m) => m.role === "user")?.content ?? "";

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <MineBotWelcome onSuggested={onSuggested} disabled={isLoading} />
      </div>
    );
  }

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-4 py-5"
        role="log"
        aria-live="polite"
        aria-label="Percakapan MineBot"
      >
        <div className="mx-auto flex w-full max-w-[520px] flex-col gap-5">
          {messages.map((message, index) => (
            <MineBotMessage
              key={message.id}
              message={message}
              isLastAssistant={
                message.role === "assistant" &&
                index === messages.length - 1
              }
              lastUserMessage={lastUserMessage}
              onSuggested={onSuggested}
              onRetry={onRetry}
            />
          ))}

          {isLoading && (
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-surface-elevated/50 px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition hover:border-danger/40 hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan"
                aria-label="Hentikan permintaan"
              >
                <Square className="h-2.5 w-2.5" aria-hidden="true" />
                Hentikan
              </button>
            </div>
          )}
        </div>
      </div>

      {showJump && (
        <button
          type="button"
          onClick={scrollToLatest}
          className={cn(
            "absolute bottom-4 left-1/2 -translate-x-1/2",
            "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-surface-elevated px-3.5 py-1.5",
            "text-[12px] font-semibold text-foreground shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
            "transition hover:border-brand-cyan/40 hover:text-brand-cyan",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan"
          )}
        >
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          Pesan terbaru
        </button>
      )}
    </div>
  );
}