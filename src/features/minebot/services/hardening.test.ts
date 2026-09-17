import { describe, expect, it, vi, beforeEach } from "vitest";

import type { Evidence, MineBotStreamEvent } from "../types/orchestrator";
import { MineBotOrchestrator } from "./orchestrator";
import { createIntentRouter } from "./intent-router";
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
      yield { type: "delta", text: "jawaban grounded [S1]" };
      yield { type: "complete" };
    }
  },
}));

function run(question: string): {
  events: MineBotStreamEvent[];
  route: ReturnType<ReturnType<typeof createIntentRouter>["route"]>;
} {
  const router = createIntentRouter();
  const events: MineBotStreamEvent[] = [];
  return {
    events,
    route: router.route(question),
  };
}

async function collect(question: string, request?: Partial<Parameters<MineBotOrchestrator["orchestrate"]>[0]>) {
  const orchestrator = new MineBotOrchestrator();
  const events: MineBotStreamEvent[] = [];
  for await (const event of orchestrator.orchestrate({ question, ...request })) {
    events.push(event);
  }
  return events;
}

describe("MineBot v1 hardening: MineVision-wide knowledge", () => {
  beforeEach(() => {
    geminiCallSpy.calls = 0;
    vi.mocked(retrieveProductionEvidence).mockReset();
    vi.mocked(retrievePriceEvidence).mockReset();
  });

  describe("commodity list", () => {
    it.each([
      "Apa saja data komoditas yang tersedia?",
      "Komoditas apa saja yang ada di MineVision?",
      "Data komoditas apa yang tersedia?",
    ])("routes %s to content retrieval, not data or fallback", (question) => {
      const { route } = run(question);
      expect(route.intent).toBe("content_query");
      expect(route.confidence).toBeGreaterThan(0);
    });

    it("answers commodity list from site knowledge without Gemini referral", async () => {
      vi.mocked(retrieveProductionEvidence).mockResolvedValue([]);
      vi.mocked(retrievePriceEvidence).mockResolvedValue([]);
      const events = await collect("Apa saja data komoditas yang tersedia?");
      const finalEvent = events.find((e) => e.type === "final") as MineBotStreamEvent & { type: "final" };
      expect(finalEvent).toBeDefined();
      const answer = finalEvent.type === "final" ? finalEvent.data.answer : "";
      expect(answer).not.toContain("sedang dikembangkan");
      expect(answer.toLocaleLowerCase("id-ID")).not.toContain("google gemini");
      expect(finalEvent.type === "final" ? finalEvent.data.citations.length : 0).toBeGreaterThan(0);
    });
  });

  describe("education content", () => {
    it.each([
      "Apa itu tambang terbuka?",
      "Apa itu overburden?",
      "Apa itu reklamasi?",
      "Apa tahapan eksplorasi?",
      "Apa itu pertambangan?",
    ])("routes %s to content_query", (question) => {
      const { route } = run(question);
      expect(route.intent).toBe("content_query");
    });

    it("produces evidence-based answer with citation for overburden", async () => {
      const events = await collect("Apa itu overburden?");
      const finalEvent = events.find((e) => e.type === "final");
      expect(finalEvent?.type).toBe("final");
      if (finalEvent?.type === "final") {
        expect(finalEvent.data.answer).not.toContain("sedang dikembangkan");
        expect(finalEvent.data.citations.length).toBeGreaterThan(0);
      }
    });
  });

  describe("industry company location", () => {
    it.each([
      "Di mana lokasi PT Freeport?",
      "Dimana lokasi freeport",
      "Di mana wilayah operasi Freeport?",
    ])("routes %s to content_query, not data coverage", (question) => {
      const { route } = run(question);
      expect(route.intent).toBe("content_query");
      expect(route.topic).not.toBe("coverage");
    });

    it("answers Freeport location from company content without dataset_unavailable", async () => {
      const events = await collect("Di mana lokasi PT Freeport?");
      const finalEvent = events.find((e) => e.type === "final");
      expect(finalEvent?.type).toBe("final");
      if (finalEvent?.type === "final") {
        expect(finalEvent.data.answer).not.toContain("sedang dikembangkan");
      }
    });
  });

  describe("career content", () => {
    it.each([
      "Apa tugas Mining Engineer?",
      "Kompetensi yang dibutuhkan Mining Engineer?",
      "Apakah lulusan IT bisa bekerja di pertambangan?",
    ])("routes %s to content_query or browsing", (question) => {
      const { route } = run(question);
      expect(["content_query", "navigation"]).toContain(route.intent);
    });
  });

  describe("typo and aliases", () => {
    it("normalizes batbara to batubara for data query", () => {
      const { route } = run("Berapa produksi batbara tahun 2023?");
      expect(route.commodity).toBe("batubara");
      expect(route.intent).toBe("data_query");
    });
  });

  describe("no evidence fallback is transparent, not a referral", () => {
    it("returns no_public_evidence error without any external referral", async () => {
      vi.mocked(retrieveProductionEvidence).mockResolvedValue([]);
      vi.mocked(retrievePriceEvidence).mockResolvedValue([]);
      const events = await collect("Berapa produksi batubara tahun 2035?", {
        context: { module: "intelligence" },
      });
      const errorEvent = events.find((e) => e.type === "error");
      expect(errorEvent?.type).toBe("error");
      if (errorEvent?.type === "error") {
        expect(errorEvent.data.fallbackCategory).toBe("no_public_evidence");
        expect(errorEvent.data.message.toLocaleLowerCase("id-ID")).not.toContain("google");
        expect(errorEvent.data.message.toLocaleLowerCase("id-ID")).not.toContain("gemini");
      }
    });

    it("routes out-of-scope question distinctly from no-evidence", async () => {
      const events = await collect("Siapa pemain sepak bola terbaik?");
      const errorEvent = events.find((e) => e.type === "error");
      expect(errorEvent?.type).toBe("error");
      if (errorEvent?.type === "error") {
        expect(errorEvent.data.fallbackCategory).toBe("out_of_scope");
      }
    });
  });

  describe("prompt injection defense", () => {
    it("blocks draft evidence from context", async () => {
      vi.mocked(retrieveProductionEvidence).mockResolvedValue([]);
      const evidence: Evidence[] = [
        {
          evidenceId: "e-draft",
          kind: "structured",
          module: "intelligence",
          entityType: "commodity",
          title: "Draft",
          facts: "Rahasia draft 987654321",
          canonicalUrl: "/intelligence",
          verificationStatus: "verified",
          publicationStatus: "draft",
          sourceIds: ["src"],
          limitations: [],
        },
      ];
      const orchestrator = new MineBotOrchestrator();
      const events: MineBotStreamEvent[] = [];
      for await (const event of orchestrator.orchestrate(
        { question: "Berapa produksi batubara pada 2023?" },
        evidence
      )) {
        events.push(event);
      }
      const errorEvent = events.find((e) => e.type === "error");
      expect(errorEvent?.type).toBe("error");
      if (errorEvent?.type === "error") {
        expect(errorEvent.data.fallbackCategory).toBe("no_public_evidence");
      }
      const asText = JSON.stringify(events);
      expect(asText).not.toContain("987654321");
    });

    it("does not leak internal retrieval details in answers", async () => {
      const events = await collect("Apa itu pertambangan?");
      const asText = JSON.stringify(events);
      expect(asText.toLocaleLowerCase("id-ID")).not.toContain("retrieval");
      expect(asText.toLocaleLowerCase("id-ID")).not.toContain("query sql");
    });
  });

  describe("follow-up conversation", () => {
    it("switches only the period for 'kalau tahun 2022?'", async () => {
      vi.mocked(retrieveProductionEvidence).mockResolvedValue([]);
      await collect("Kalau tahun 2022?", {
        history: [{ role: "user", content: "Berapa produksi batubara pada 2023?" }],
      });
      expect(vi.mocked(retrieveProductionEvidence)).toHaveBeenCalledWith(
        expect.objectContaining({ commodity: "batubara", year: 2022 })
      );
    });
  });
});