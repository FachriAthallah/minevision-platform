"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { buildMineBotPageContext } from "../client/request-payload";
import { useMineBot } from "./minebot-provider";
import { MineBotHeader } from "./minebot-header";
import { MineBotMessageList } from "./minebot-message-list";
import { MineBotInput } from "./minebot-input";

type MineBotPanelProps = {
  onClose: () => void;
};

export function MineBotPanel({ onClose }: MineBotPanelProps) {
  const { messages, isLoading, sendMessage, retryLast, cancelRequest, clearChat } = useMineBot();
  const [input, setInput] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus management: move focus into the panel when it opens.
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  useEffect(() => {
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  }, [onClose]);

  const getPageContext = useCallback(() => {
    if (typeof window === "undefined") return undefined;
    return buildMineBotPageContext(`${window.location.pathname}${window.location.search}`);
  }, []);

  const handleSend = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isLoading) return;
      sendMessage(trimmed, getPageContext());
      setInput("");
    },
    [isLoading, sendMessage, getPageContext]
  );

  const handleSuggested = useCallback(
    (question: string) => {
      if (isLoading) return;
      sendMessage(question, getPageContext());
    },
    [isLoading, sendMessage, getPageContext]
  );

  return (
    <div
      ref={panelRef}
      id="minebot-panel"
      role="dialog"
      aria-modal="true"
      aria-label="MineBot"
      tabIndex={-1}
      className={[
        "minebot-panel-in",
        "fixed inset-x-2 bottom-2 top-2 z-[60] flex flex-col overflow-hidden",
        "rounded-[24px] border border-white/10 bg-[#071426]",
        "shadow-[0_24px_80px_rgba(0,0,0,0.5)]",
        "sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-auto",
        "sm:h-[min(720px,calc(100vh-80px))] sm:w-[440px] sm:rounded-[28px]",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-cyan/60 to-transparent" aria-hidden="true" />

      <MineBotHeader onClose={onClose} onClear={clearChat} />

      <MineBotMessageList
        messages={messages}
        isLoading={isLoading}
        onSuggested={handleSuggested}
        onRetry={retryLast}
        onCancel={cancelRequest}
      />

      <MineBotInput
        value={input}
        onChange={setInput}
        onSend={() => handleSend(input)}
        disabled={isLoading}
      />
    </div>
  );
}