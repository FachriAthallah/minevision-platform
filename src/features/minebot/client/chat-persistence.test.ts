import { describe, expect, it, vi, beforeEach } from "vitest";

import { loadPersistedMessages, persistMessages, clearPersistedMessages } from "./chat-persistence";

function answerMessage(id = "assistant-1", overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id,
    role: "assistant" as const,
    content: "Jawaban test.",
    status: "complete" as const,
    ...overrides,
  };
}

const storage = new Map<string, string>();

function installStorage() {
  (globalThis as unknown as { sessionStorage?: unknown }).sessionStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
  };
}

describe("chat persistence", () => {
  beforeEach(() => {
    storage.clear();
    installStorage();
    vi.restoreAllMocks();
  });

  it("round-trips messages through sessionStorage", () => {
    persistMessages([answerMessage()]);
    const loaded = loadPersistedMessages();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.content).toBe("Jawaban test.");
  });

  it("restores empty array when nothing stored", () => {
    expect(loadPersistedMessages()).toEqual([]);
  });

  it("promotes a mid-stream message to complete on restore", () => {
    persistMessages([
      answerMessage("a1", { status: "streaming", content: "Sebagian" }),
    ]);
    const loaded = loadPersistedMessages();
    expect(loaded[0]?.status).toBe("complete");
    expect(loaded[0]?.content).toBe("Sebagian");
  });

  it("drops empty streaming placeholders", () => {
    persistMessages([
      answerMessage("a1", { status: "streaming", content: "" }),
    ]);
    expect(loadPersistedMessages()).toEqual([]);
  });

  it("ignores malformed storage payloads", () => {
    storage.set("minevision.minebot.chat.v1", "not-json{");
    expect(loadPersistedMessages()).toEqual([]);
  });

  it("clearPersistedMessages removes stored conversation", () => {
    persistMessages([answerMessage()]);
    clearPersistedMessages();
    expect(loadPersistedMessages()).toEqual([]);
  });
});