import { describe, expect, it, vi, beforeEach } from "vitest";

import type { MineBotHistory, MineBotStreamEvent } from "../types/orchestrator";
import { MineBotOrchestrator } from "./orchestrator";
import { resolveConversationContext } from "./conversation-context";
import { retrievePublicContentEvidence } from "../retrieval/public-content-evidence";
import { retrieveProductionEvidence, retrievePriceEvidence } from "../retrieval/intelligence-evidence";

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

function user(content: string): MineBotHistory {
  return { role: "user", content };
}

async function collect(question: string, history: MineBotHistory[] = []) {
  const orchestrator = new MineBotOrchestrator();
  const events: MineBotStreamEvent[] = [];
  for await (const event of orchestrator.orchestrate({ question, history })) {
    events.push(event);
  }
  return events;
}

describe("MineBot context inheritance policy", () => {
  beforeEach(() => {
    geminiCallSpy.calls = 0;
    vi.mocked(retrieveProductionEvidence).mockReset();
    vi.mocked(retrievePriceEvidence).mockReset();
  });

  describe("regression: self-contained question must break old context (browser bug)", () => {
    const browserHistory: MineBotHistory[] = [
      user("Apa saja data komoditas yang tersedia?"),
      user("Berapa produksi batubara tahun 2023?"),
      user("kalau tahun 2022"),
    ];

    it.each(["Apa itu tambang terbuka?", "tambang terbuka itu apa?"])(
      "routes %s to education without inheriting batubara/2022/production",
      (question) => {
        const result = resolveConversationContext({ question, history: browserHistory });

        expect(result.intent).toBe("content_query");
        expect(result.module).toBe("education");
        expect(result.commodity).toBeUndefined();
        expect(result.topic).not.toBe("production");
        expect(result.topic ?? null).toBeNull();
        expect(result.years).toEqual([]);
        expect(result.economyMetric).toBeUndefined();
        expect(result.needsClarification).toBe(false);
      }
    );

    it("does not invoke intelligence retrieval for the education turn", async () => {
      await collect("Apa itu tambang terbuka?", browserHistory);
      expect(vi.mocked(retrieveProductionEvidence)).not.toHaveBeenCalled();
      expect(vi.mocked(retrievePriceEvidence)).not.toHaveBeenCalled();
    });

    it("still keeps the earlier production follow-up working", () => {
      const result = resolveConversationContext({
        question: "kalau tahun 2022",
        history: [user("Berapa produksi batubara tahun 2023?")],
      });

      expect(result.intent).toBe("follow_up");
      expect(result.topic).toBe("production");
      expect(result.commodity).toBe("batubara");
      expect(result.years).toEqual([2022]);
    });
  });

  describe("domain switching", () => {
    it("Intelligence -> Education", () => {
      const result = resolveConversationContext({
        question: "Apa itu tambang terbuka?",
        history: [user("Berapa produksi batubara 2023?")],
      });
      expect(result.intent).toBe("content_query");
      expect(result.module).toBe("education");
      expect(result.commodity).toBeUndefined();
    });

    it("Education -> Career", () => {
      const result = resolveConversationContext({
        question: "Apa tugas Mining Engineer?",
        history: [user("Apa itu tambang terbuka?")],
      });
      expect(result.intent).toBe("content_query");
      expect(result.module).toBe("career");
    });

    it("Career -> Industry", () => {
      const result = resolveConversationContext({
        question: "Di mana wilayah operasi Freeport?",
        history: [user("Apa tugas Mining Engineer?")],
      });
      expect(result.intent).toBe("content_query");
      expect(result.module).toBe("industry");
      expect(result.company).toBe("freeport-indonesia");
    });

    it("Industry -> Economy", () => {
      const result = resolveConversationContext({
        question: "Berapa PDB pertambangan 2023?",
        history: [user("Di mana wilayah operasi Freeport?")],
      });
      expect(result.intent).toBe("data_query");
      expect(result.topic).toBe("economy");
      expect(result.economyMetric).toBe("mining_gdp");
      expect(result.years).toEqual([2023]);
    });

    it("Economy -> Commodity", () => {
      const result = resolveConversationContext({
        question: "Apa karakteristik nikel?",
        history: [user("Berapa PDB pertambangan 2023?")],
      });
      expect(result.intent).toBe("content_query");
      expect(result.economyMetric).toBeUndefined();
      expect(result.topic).not.toBe("economy");
    });

    it("Industry -> pronoun follow-up keeps company context", () => {
      const result = resolveConversationContext({
        question: "Apa komoditas utamanya?",
        history: [user("Di mana wilayah operasi Freeport?")],
      });
      expect(result.intent).toBe("follow_up");
      expect(result.company).toBe("freeport-indonesia");
    });
  });

  describe("follow-up regression (must keep passing)", () => {
    it("Intelligence year follow-up", () => {
      const result = resolveConversationContext({
        question: "Kalau tahun 2022?",
        history: [user("Berapa produksi batubara 2023?")],
      });
      expect(result.intent).toBe("follow_up");
      expect(result.topic).toBe("production");
      expect(result.commodity).toBe("batubara");
      expect(result.years).toEqual([2022]);
    });

    it("Economy metric + year follow-up", () => {
      const result = resolveConversationContext({
        question: "Kalau tahun 2022?",
        history: [user("Berapa PDB sektor pertambangan 2023?")],
      });
      expect(result.intent).toBe("follow_up");
      expect(result.economyMetric).toBe("mining_gdp");
      expect(result.topic).toBe("economy");
      expect(result.years).toEqual([2022]);
    });

    it("Export commodity + year follow-up", () => {
      const result = resolveConversationContext({
        question: "Bagaimana tahun 2023?",
        history: [user("Berapa ekspor batubara ke India tahun 2022?")],
      });
      expect(result.intent).toBe("follow_up");
      expect(result.economyMetric).toBe("exports");
      expect(result.commodity).toBe("batubara");
      expect(result.years).toEqual([2023]);
    });

    it("comparison follow-up unions current and previous year", () => {
      const result = resolveConversationContext({
        question: "Kalau dibandingkan 2022?",
        history: [user("Berapa produksi batubara 2023?")],
      });
      expect(result.years).toEqual([2022, 2023]);
    });
  });

  describe("citation relevance for list questions", () => {
    it("returns only the canonical aggregate commodity evidence", async () => {
      const evidence = await retrievePublicContentEvidence("Apa saja data komoditas yang tersedia?");

      expect(evidence).toHaveLength(1);
      expect(evidence[0]?.evidenceId).toBe("commodity-list");
      expect(evidence[0]?.canonicalUrl).toBe("/commodity");
    });

    it("does not attach unrelated export/about evidence to the list answer", async () => {
      const evidence = await retrievePublicContentEvidence("Komoditas apa saja yang ada di MineVision?");
      const urls = evidence.map((item) => item.canonicalUrl);

      expect(urls).not.toContain("/about");
      expect(urls.every((url) => url === "/commodity")).toBe(true);
    });
  });
});