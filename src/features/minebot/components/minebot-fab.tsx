"use client";

import { useState } from "react";
import { Bot, X, Send, Trash2, Ban } from "lucide-react";
import { useMineBot } from "./minebot-provider";
import { suggestedQuestions } from "../config/suggested-questions";
import { buildMineBotPageContext } from "../client/request-payload";

function renderContent(m: {
  content: string;
  status: string;
  error?: { message: string };
}) {
  if (m.content.trim()) return m.content;
  if (m.status === "streaming") return "Mengetik...";
  if (m.status === "error" && m.error?.message) return m.error.message;
  return "Jawaban MineBot tidak dapat diproses dengan benar.";
}

function sanitizeHref(href: string): string | null {
  if (
    href.startsWith("javascript:") ||
    href.startsWith("data:") ||
    href.startsWith("//") ||
    /^https?:\/\//i.test(href)
  ) {
    return href.startsWith("//") ? null : href;
  }
  if (!href.startsWith("/")) return null;
  return href;
}

export function MineBotFab() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, isLoading, sendMessage, retryLast, cancelRequest, clearChat } = useMineBot();
  const getPageContext = () => {
    if (typeof window === "undefined") return undefined;
    return buildMineBotPageContext(`${window.location.pathname}${window.location.search}`);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim(), getPageContext());
    setInput("");
  };

  const handleSuggested = (q: string) => {
    if (isLoading) return;
    sendMessage(q, getPageContext());
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 bottom-6 z-40 flex flex-col items-center gap-1.5 sm:right-8 sm:bottom-8"
        aria-label="Tanya MineBot"
      >
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(var(--surface-elevated),var(--surface-elevated))_padding-box,linear-gradient(135deg,var(--brand-blue),var(--brand-cyan),var(--brand-teal))_border-box] border border-transparent shadow-[var(--shadow-float)] sm:h-[72px] sm:w-[72px]">
          <Bot aria-hidden="true" className="h-7 w-7 text-brand-cyan sm:h-8 sm:w-8" />
        </span>
        <span className="text-[11px] font-medium text-nav-muted">MineBot AI</span>
      </button>

      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-background border-l shadow-2xl">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="font-semibold">MineBot AI</h2>
            <div className="flex items-center gap-2">
              <button onClick={clearChat} aria-label="Percakapan baru" className="p-2 text-muted-foreground hover:text-foreground">
                <Trash2 className="h-4 w-4" />
              </button>
              <button onClick={() => setIsOpen(false)} aria-label="Tutup" className="p-2 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !isLoading && (
              <div className="space-y-4 text-center py-8">
                <p className="text-sm text-muted-foreground">Halo, saya MineBot. Ada yang bisa saya bantu terkait pertambangan Indonesia?</p>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Pertanyaan disarankan:</p>
                  {suggestedQuestions.default.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggested(q)}
                      disabled={isLoading}
                      className="block w-full rounded-md border p-2 text-left text-xs hover:bg-accent disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`rounded-lg p-3 text-sm max-w-[85%] ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <p className="whitespace-pre-wrap">{renderContent(m)}</p>
                  {m.status === "streaming" && (
                    <span className="sr-only" role="status">MineBot sedang mengetik jawaban</span>
                  )}
                  {m.role === "assistant" && m.status === "error" && m.error?.retryable && (
                    <button
                      onClick={() => retryLast()}
                      className="mt-2 text-xs text-brand-cyan hover:underline"
                    >
                      Coba lagi
                    </button>
                  )}
                </div>
                {m.citations && m.citations.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground space-y-1">
                    <p className="font-semibold">Referensi:</p>
                    {m.citations.map((c) => {
                      const href = sanitizeHref(c.url);
                      return href ? (
                        <a key={c.id} href={href} target="_blank" rel="noopener noreferrer" className="block text-brand-cyan hover:underline">
                          [{c.id}] {c.label}
                        </a>
                      ) : (
                        <span key={c.id} className="block">
                          [{c.id}] {c.label}
                        </span>
                      );
                    })}
                  </div>
                )}
                {m.relatedLinks && m.relatedLinks.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground space-y-1">
                    <p className="font-semibold">Halaman terkait:</p>
                    {m.relatedLinks.map((l, idx) => {
                      const href = sanitizeHref(l.href);
                      if (!href) return null;
                      return (
                        <a key={`${l.href}-${idx}`} href={href} className="block text-brand-cyan hover:underline">
                          {l.label}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-sm">
                <button
                  onClick={cancelRequest}
                  className="inline-flex items-center gap-1 rounded-md border p-2 text-xs"
                  aria-label="Hentikan permintaan"
                >
                  <Ban className="h-3 w-3" aria-hidden="true" />
                  Hentikan
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="border-t p-4 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanyakan sesuatu..."
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
              disabled={isLoading}
              aria-label="Pertanyaan ke MineBot"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
              aria-label="Kirim pertanyaan"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
