import type { MineBotUiMessage } from "./chat-state";

const STORAGE_KEY = "minevision.minebot.chat.v1";

/**
 * Restore the conversation from sessionStorage (client-side only). Any message
 * that was mid-stream when the page unloaded is promoted to complete so the
 * restored list is always terminal.
 */
export function loadPersistedMessages(): MineBotUiMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { messages?: MineBotUiMessage[] };
    if (!Array.isArray(parsed.messages)) return [];

    return parsed.messages
      .filter(
        (m) =>
          m &&
          typeof m.id === "string" &&
          (m.role === "user" || m.role === "assistant")
      )
      .map((m) =>
        m.status === "streaming" ? { ...m, status: "complete" as const } : m
      )
      .filter(
        (m) =>
          m.role === "user" || m.content.trim().length > 0 || m.status === "error"
      );
  } catch {
    return [];
  }
}

export function persistMessages(messages: MineBotUiMessage[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ messages }));
  } catch {
    // storage unavailable — chat simply stays in memory for this session
  }
}

export function clearPersistedMessages(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage failures
  }
}