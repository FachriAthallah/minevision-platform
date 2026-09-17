import { describe, expect, it, vi, beforeEach } from "vitest";
import type { MineBotStreamEvent } from "../types/orchestrator";
import { MineBotOrchestrator } from "./orchestrator";
import { createIntentRouter } from "./intent-router";
import { retrievePriceEvidence, retrieveProductionEvidence } from "../retrieval/intelligence-evidence";

const { geminiCallSpy } = vi.hoisted(() => ({
  geminiCallSpy: { calls: 0, generateStream: vi.fn() },
}));

vi.mock("./gemini-server-client", () => ({
  GeminiServerClient: class {
    isAvailable() {
      return true;
    }
    async *generateStream() {
      geminiCallSpy.calls += 1;
      yield { type: "delta", text: "jawaban mock" };
      yield { type: "complete" };
    }
  },
}));

describe("MineBot greeting intent (deterministic, no external calls)", () => {
  beforeEach(() => {
    geminiCallSpy.calls = 0;
    vi.mocked(retrieveProductionEvidence).mockReset();
    vi.mocked(retrievePriceEvidence).mockReset();
  });

  it.each(["halo", "halo?", "hai", "hei", "hello", "selamat pagi", "selamat siang", "slmt siang", "good morning", "good evening", "selamat sore", "selamat malam"])(
    "routes %s as greeting with high confidence",
    (greeting) => {
      const router = createIntentRouter();
      const result = router.route(greeting);
      expect(result.intent).toBe("greeting");
      expect(result.confidence).toBe(0.9);
    }
  );

  it.each([
    ["halo", "Halo! Saya MineBot, asisten MineVision. Ada yang ingin kamu cari tentang pertambangan Indonesia?"],
    ["hei", "Halo! Saya MineBot, asisten MineVision. Ada yang ingin kamu cari tentang pertambangan Indonesia?"],
    ["selamat siang", "Selamat siang! Mau melihat data komoditas atau mencari materi pertambangan?"],
    ["makasih", "Sama-sama! Kalau ada data atau materi lain yang ingin dicari, tinggal tanyakan."],
  ])("produces deterministic final response for %s without Gemini or retrieval", async (question, expected) => {
    const orchestrator = new MineBotOrchestrator();
    const events: MineBotStreamEvent[] = [];
    for await (const event of orchestrator.orchestrate({ question }, [])) {
      events.push(event);
    }

    expect(vi.mocked(retrieveProductionEvidence)).not.toHaveBeenCalled();
    expect(vi.mocked(retrievePriceEvidence)).not.toHaveBeenCalled();
    expect(geminiCallSpy.calls).toBe(0);

    const finalEvent = events.find((e) => e.type === "final");
    expect(finalEvent).toBeDefined();
    if (finalEvent && finalEvent.type === "final") {
      expect(finalEvent.data.answer).toBe(expected);
      expect(finalEvent.data.citations).toEqual([]);
    }
  });

  it("answers capability questions without Gemini or retrieval", async () => {
    const orchestrator = new MineBotOrchestrator();
    const events: MineBotStreamEvent[] = [];
    for await (const event of orchestrator.orchestrate({ question: "kamu bisa apa?" }, [])) {
      events.push(event);
    }

    expect(vi.mocked(retrieveProductionEvidence)).not.toHaveBeenCalled();
    expect(vi.mocked(retrievePriceEvidence)).not.toHaveBeenCalled();
    expect(geminiCallSpy.calls).toBe(0);

    const finalEvent = events.find((e) => e.type === "final");
    expect(finalEvent?.type).toBe("final");
    if (finalEvent?.type === "final") {
      expect(finalEvent.data.answer).toContain("data Intelligence");
      expect(finalEvent.data.relatedLinks[0]?.href).toBe("/about");
    }
  });
});
