import { describe, expect, it } from "vitest";
import { applyStreamEvent, ensureTerminal, MineBotUiMessage, PROTOCOL_ERROR_MESSAGE } from "./chat-state";

function streamingMessage(): MineBotUiMessage {
  return {
    id: "assistant-1",
    role: "assistant",
    content: "",
    status: "streaming",
  };
}

describe("MineBot client chat state", () => {
  it("reads error payload from nested event.data and fills assistant message", () => {
    const msg = streamingMessage();
    const result = applyStreamEvent(msg, {
      type: "error",
      data: { code: "NO_ELIGIBLE_EVIDENCE", message: "Informasi belum tersedia.", retryable: false },
    });
    expect(result.status).toBe("error");
    expect(result.content).toBe("Informasi belum tersedia.");
    expect(result.error).toEqual({
      code: "NO_ELIGIBLE_EVIDENCE",
      message: "Informasi belum tersedia.",
      retryable: false,
    });
  });

  it("reads delta text from nested event.data", () => {
    const msg = streamingMessage();
    const afterDelta = applyStreamEvent(msg, { type: "delta", data: { text: "Produksi" } });
    expect(afterDelta.content).toBe("Produksi");
    expect(afterDelta.status).toBe("streaming");
  });

  it("reads final answer, citations, and relatedLinks from nested event.data", () => {
    const msg = streamingMessage();
    const result = applyStreamEvent(msg, {
      type: "final",
      data: {
        answer: "Produksi batubara 2023 mencapai 775 juta ton.",
        citations: [
          { id: "S1", label: "Kementerian ESDM", organization: "Kementerian ESDM", url: "/intelligence?commodity=batubara", pageReference: "2023" },
        ],
        relatedLinks: [{ label: "Intelligence", href: "/intelligence", module: "intelligence" }],
        limitations: [],
        generatedAt: "2026-01-01T00:00:00.000Z",
      },
    });
    expect(result.status).toBe("complete");
    expect(result.content).toContain("775 juta ton");
    expect(result.citations).toHaveLength(1);
    expect(result.citations?.[0].id).toBe("S1");
    expect(result.relatedLinks?.[0].href).toBe("/intelligence");
  });

  it("marks retryable when error event carries retryable=true", () => {
    const result = applyStreamEvent(streamingMessage(), {
      type: "error",
      data: { code: "AI_TIMEOUT", message: "Waktu habis.", retryable: true },
    });
    expect(result.status).toBe("error");
    expect(result.error?.retryable).toBe(true);
  });

  it("defaults retryable to false when absent", () => {
    const result = applyStreamEvent(streamingMessage(), {
      type: "error",
      data: { code: "NO_ELIGIBLE_EVIDENCE", message: "Kosong" },
    });
    expect(result.error?.retryable).toBe(false);
  });

  it("assistant placeholder is never empty after terminal error", () => {
    const result = applyStreamEvent(streamingMessage(), {
      type: "error",
      data: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan." },
    });
    expect(result.content.length).toBeGreaterThan(0);
    expect(result.status).toBe("error");
  });

  it("assistant placeholder is never empty after final", () => {
    const result = applyStreamEvent(streamingMessage(), {
      type: "final",
      data: { answer: "Jawaban lengkap.", citations: [], relatedLinks: [], limitations: [], generatedAt: "2026-01-01T00:00:00.000Z" },
    });
    expect(result.content.length).toBeGreaterThan(0);
    expect(result.status).toBe("complete");
  });

  it("stream without terminal produces protocol error placeholder", () => {
    const result = ensureTerminal(streamingMessage());
    expect(result.status).toBe("error");
    expect(result.content).toBe(PROTOCOL_ERROR_MESSAGE);
    expect(result.error?.code).toBe("PROTOCOL_ERROR");
    expect(result.error?.retryable).toBe(false);
  });

  it("ensureTerminal leaves already-terminal messages untouched", () => {
    const finalMsg = ensureTerminal(
      applyStreamEvent(streamingMessage(), {
        type: "final",
        data: { answer: "Selesai.", citations: [], relatedLinks: [], limitations: [], generatedAt: "2026-01-01T00:00:00.000Z" },
      })
    );
    expect(finalMsg.status).toBe("complete");
    expect(finalMsg.content).toBe("Selesai.");
  });
});