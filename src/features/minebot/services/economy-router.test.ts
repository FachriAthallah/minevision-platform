import { describe, expect, it, vi, beforeEach } from "vitest";

import type { PublicGdpRecord } from "@/features/economy/types/gdp";
import type { MineBotStreamEvent } from "../types/orchestrator";
import { MineBotOrchestrator } from "./orchestrator";
import { resolveConversationContext } from "./conversation-context";
import { getPublicGdp } from "@/features/economy/server/get-public-gdp";

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

vi.mock("@/features/economy/server/get-public-gdp", () => ({
  getPublicGdp: vi.fn(),
}));

function gdpFixture(year: number): PublicGdpRecord {
  return {
    id: `gdp-${year}`,
    region: { code: "ID", name: "Indonesia" },
    year,
    priceBasis: "current_prices",
    baseYear: null,
    nationalGdpValue: 20892312.3,
    miningQuarryingGdpValue: 2198018.1,
    contributionPercentage: 10.5208,
    nominalYoyChangePercentage: year === 2019 ? null : -8.16,
    currencyCode: "IDR",
    valueScale: "billion",
    dataStatus: "final",
    recordType: "actual",
    sourcePublishedAt: null,
    sources: [
      { label: "BPS", pageReference: null, url: null, isPrimary: true, source: { name: "Badan Pusat Statistik", slug: "bps", organization: "BPS" } },
    ],
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

describe("MineBot economy routing", () => {
  beforeEach(() => {
    geminiCallSpy.calls = 0;
    vi.mocked(getPublicGdp).mockReset();
  });

  describe("metric resolution", () => {
    it.each([
      ["Berapa PDB Indonesia tahun 2023?", "national_gdp"],
      ["Berapa PDB nasional?", "national_gdp"],
      ["Berapa PDB sektor pertambangan tahun 2023?", "mining_gdp"],
      ["Berapa kontribusi pertambangan terhadap PDB?", "gdp_contribution"],
      ["Bagaimana pertumbuhan sektor pertambangan?", "gdp_growth"],
      ["Berapa nilai ekspor batubara 2023?", "exports"],
      ["Berapa investasi sektor pertambangan?", "investment"],
      ["Berapa penanaman modal di pertambangan?", "investment"],
    ])("resolves %s to metric %s and data_query economy", (question, metric) => {
      const result = resolveConversationContext({ question });
      expect(result.intent).toBe("data_query");
      expect(result.topic).toBe("economy");
      expect(result.economyMetric).toBe(metric);
      expect(result.module).toBe("economy");
    });

    it("keeps explanation questions as content, not numeric", () => {
      const result = resolveConversationContext({ question: "Apa itu hilirisasi?" });
      expect(result.intent).toBe("content_query");
      expect(result.economyMetric).toBeUndefined();
    });

    it("routes economy navigation as navigation", () => {
      const result = resolveConversationContext({ question: "Buka halaman ekonomi" });
      expect(result.intent).toBe("navigation");
      expect(result.module).toBe("economy");
    });
  });

  describe("follow-up context", () => {
    it("inherits economy metric and changes only the year for follow-up", () => {
      const result = resolveConversationContext({
        question: "Kalau 2022?",
        history: [{ role: "user", content: "Berapa PDB sektor pertambangan tahun 2023?" }],
      });

      expect(result.intent).toBe("follow_up");
      expect(result.economyMetric).toBe("mining_gdp");
      expect(result.topic).toBe("economy");
      expect(result.years).toEqual([2022]);
    });

    it("inherits export commodity while switching year", () => {
      const result = resolveConversationContext({
        question: "Bagaimana dengan 2022?",
        history: [{ role: "user", content: "Berapa nilai ekspor batubara pada 2023?" }],
      });

      expect(result.economyMetric).toBe("exports");
      expect(result.commodity).toBe("batubara");
      expect(result.years).toEqual([2022]);
    });
  });

  describe("orchestrator integration", () => {
    it("answers GDP numeric question from evidence with citation and no referral", async () => {
      vi.mocked(getPublicGdp).mockResolvedValue([gdpFixture(2023)]);

      const events = await collect("Berapa PDB Indonesia tahun 2023?");
      const finalEvent = events.find((e) => e.type === "final") as MineBotStreamEvent & { type: "final" };
      expect(finalEvent).toBeDefined();
      const answer = finalEvent.type === "final" ? finalEvent.data.answer : "";
      expect(answer).not.toContain("sedang dikembangkan");
      expect(answer.toLocaleLowerCase("id-ID")).not.toContain("google gemini");
      expect(finalEvent.type === "final" ? finalEvent.data.citations.length : 0).toBeGreaterThan(0);
    });

    it("requests only the explicitly requested year, not a neighboring one", async () => {
      vi.mocked(getPublicGdp).mockResolvedValue([gdpFixture(2023)]);

      await collect("Berapa PDB Indonesia tahun 2023?");

      expect(vi.mocked(getPublicGdp)).toHaveBeenCalledWith(
        expect.objectContaining({ fromYear: 2023, toYear: 2023 })
      );
    });

    it("falls back to no_public_evidence when the year has no record", async () => {
      vi.mocked(getPublicGdp).mockResolvedValue([gdpFixture(2023)]);

      const events = await collect("Berapa PDB Indonesia tahun 2035?");
      const errorEvent = events.find((e) => e.type === "error");
      expect(errorEvent?.type).toBe("error");
      if (errorEvent?.type === "error") {
        expect(errorEvent.data.fallbackCategory).toBe("no_public_evidence");
      }
    });

    it("gives a grounded final answer when economy evidence is available", async () => {
      vi.mocked(getPublicGdp).mockResolvedValue([gdpFixture(2023)]);

      const events = await collect("Berapa PDB sektor pertambangan tahun 2023?");
      const finalEvent = events.find((e) => e.type === "final");
      expect(finalEvent?.type).toBe("final");
      if (finalEvent?.type === "final") {
        expect(finalEvent.data.answer).not.toBe("");
        expect(finalEvent.data.citations.length).toBeGreaterThan(0);
      }
    });
  });
});