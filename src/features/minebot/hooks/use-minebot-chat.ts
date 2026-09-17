import { useState, useCallback, useRef, useEffect } from "react";
import type { MineBotUiMessage } from "../client/chat-state";
import { applyStreamEvent, ensureTerminal } from "../client/chat-state";
import { NDJSONParser } from "../client/ndjson-parser";
import { buildMineBotRequestPayload } from "../client/request-payload";
import {
  clearPersistedMessages,
  loadPersistedMessages,
  persistMessages,
} from "../client/chat-persistence";
import type { MineBotRequestContext } from "../types/orchestrator";

export function useMineBotChat() {
  const [messages, setMessages] = useState<MineBotUiMessage[]>(() =>
    loadPersistedMessages()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isSendingRef = useRef(false);
  const lastQuestionRef = useRef<{ content: string; context?: MineBotRequestContext } | null>(null);

  // Keep the conversation across page navigation and full reloads by persisting
  // it to sessionStorage (client-side only; nothing leaves the browser).
  useEffect(() => {
    persistMessages(messages);
  }, [messages]);

  const patchAssistant = useCallback((id: string, fn: (m: MineBotUiMessage) => MineBotUiMessage) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? fn(m) : m))
    );
  }, []);

  const sendMessage = useCallback(async (content: string, context?: MineBotRequestContext) => {
    if (!content.trim() || isSendingRef.current) return;

    isSendingRef.current = true;
    lastQuestionRef.current = { content, context };
    const requestPayload = buildMineBotRequestPayload({
      question: content,
      messages,
      context,
    });

    const userMessage: MineBotUiMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
      status: "complete",
    };

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: MineBotUiMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      status: "streaming",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);
    setError(null);

    abortControllerRef.current = new AbortController();
    const parser = new NDJSONParser();
    let hasTerminalEvent = false;

    const processEvent = (event: NonNullable<ReturnType<NDJSONParser["parseChunk"]>[number]>) => {
      if (event.type === "final" || event.type === "error") hasTerminalEvent = true;
      patchAssistant(assistantMessageId, (m) => applyStreamEvent(m, event));
    };

    try {
      const response = await fetch("/api/v1/minebot/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
        signal: abortControllerRef.current.signal,
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        for (const event of parser.parseChunk(value)) {
          processEvent(event);
        }
      }

      for (const event of parser.flush()) {
        processEvent(event);
      }

      if (!hasTerminalEvent) {
        patchAssistant(assistantMessageId, ensureTerminal);
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") {
        patchAssistant(assistantMessageId, (m) => ({
          ...m,
          content: "Permintaan dihentikan.",
          status: "cancelled",
        }));
      } else {
        setError("Koneksi terputus");
        patchAssistant(assistantMessageId, (m) => ({
          ...m,
          content: "Koneksi terputus sebelum jawaban selesai.",
          status: "error",
          error: {
            code: "NETWORK_ERROR",
            message: "Koneksi terputus sebelum jawaban selesai.",
            retryable: true,
          },
        }));
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      isSendingRef.current = false;
    }
  }, [messages, patchAssistant]);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const retryLast = useCallback(() => {
    if (lastQuestionRef.current && !isSendingRef.current) {
      return sendMessage(lastQuestionRef.current.content, lastQuestionRef.current.context);
    }
    return Promise.resolve();
  }, [sendMessage]);

  const clearChat = useCallback(() => {
    setMessages([]);
    lastQuestionRef.current = null;
    clearPersistedMessages();
  }, []);

  return { messages, isLoading, error, sendMessage, cancelRequest, retryLast, clearChat };
}
