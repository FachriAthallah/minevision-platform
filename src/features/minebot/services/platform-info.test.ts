import { describe, expect, it, vi, beforeEach } from "vitest";

import type { MineBotStreamEvent } from "../types/orchestrator";
import { MineBotOrchestrator } from "./orchestrator";
import { retrievePriceEvidence, retrieveProductionEvidence } from "../retrieval/intelligence-evidence";

const { geminiCallSpy } = vi.hoisted(() => ({
  geminiCallSpy: { calls: 0 },
}));

vi.mock("./gemini-server-client", () => ({
  GeminiServerClient: class {
    isAvailable() {
      return true;
    }
    async *generateStream() {
      geminiCallSpy.calls += 1;
      yield {
        type: "delta",
        text:
          "MineVision adalah platform informasi pertambangan Indonesia yang menghubungkan materi edukasi, profil industri dan komoditas, karier, data Intelligence, serta indikator ekonomi. [S1]",
      };
      yield { type: "complete" };
    }
  },
}));

describe("MineBot platform information", () => {
  beforeEach(() => {
    geminiCallSpy.calls = 0;
    vi.mocked(retrieveProductionEvidence).mockReset();
    vi.mocked(retrievePriceEvidence).mockReset();
  });

  it.each(["apa itu MineVision?", "apa itu MVIP?"])(
    "answers %s from curated public evidence",
    async (question) => {
      const orchestrator = new MineBotOrchestrator();
      const events: MineBotStreamEvent[] = [];
      for await (const event of orchestrator.orchestrate({ question }, [])) {
        events.push(event);
      }

      expect(vi.mocked(retrieveProductionEvidence)).not.toHaveBeenCalled();
      expect(vi.mocked(retrievePriceEvidence)).not.toHaveBeenCalled();
      expect(geminiCallSpy.calls).toBe(1);

      const finalEvent = events.find((event) => event.type === "final");
      expect(finalEvent?.type).toBe("final");
      if (finalEvent?.type === "final") {
        expect(finalEvent.data.answer).toContain("MineVision adalah platform informasi pertambangan Indonesia");
        expect(finalEvent.data.citations[0]?.url).toBe("/about");
        expect(finalEvent.data.relatedLinks[0]?.href).toBe("/about");
        expect(finalEvent.data.fallbackCategory).toBeUndefined();
      }
    }
  );
});
