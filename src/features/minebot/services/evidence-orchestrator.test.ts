import { describe, expect, it, vi, beforeEach } from "vitest";

import type { PublicGdpRecord } from "@/features/economy/types/gdp";
import type { Evidence, MineBotHistory, MineBotStreamEvent } from "../types/orchestrator";
import { MineBotOrchestrator } from "./orchestrator";
import { resolveConversationContext } from "./conversation-context";
import { retrievePublicContentEvidence } from "../retrieval/public-content-evidence";
import { retrieveProductionEvidence, retrievePriceEvidence } from "../retrieval/intelligence-evidence";
import { getPublicGdp } from "@/features/economy/server/get-public-gdp";

const { geminiMock } = vi.hoisted(() => ({
  geminiMock: { available: true },
}));

vi.mock("./gemini-server-client", () => ({
  GeminiServerClient: class {
    isAvailable() {
      return geminiMock.available;
    }
    async *generateStream() {
      yield { type: "delta", text: "jawaban grounded [S1]" };
      yield { type: "complete" };
    }
  },
}));

vi.mock("@/features/economy/server/get-public-gdp", () => ({
  getPublicGdp: vi.fn(),
}));

vi.mock("@/features/economy/server/get-public-exports", () => ({
  getPublicExports: vi.fn(),
}));

vi.mock("@/features/economy/server/get-public-investment", () => ({
  getPublicInvestment: vi.fn(),
}));

function productionEvidence(year: number, quantityTon: string): Evidence {
  return {
    evidenceId: `production-batubara-${year}`,
    kind: "structured",
    module: "intelligence",
    entityType: "commodity_production",
    title: `Produksi Batubara ${year}`,
    facts: `Produksi batubara Indonesia tahun ${year} tercatat sebesar ${quantityTon}.`,
    period: { year },
    unit: "ton",
    verificationStatus: "verified",
    publicationStatus: "published",
    sourceIds: ["esdm"],
    canonicalUrl: "/intelligence?commodity=batubara",
    limitations: [],
  };
}

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
    nominalYoyChangePercentage: -8.16,
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

function user(content: string): MineBotHistory {
  return { role: "user", content };
}

async function collect(
  question: string,
  request: Partial<Parameters<MineBotOrchestrator["orchestrate"]>[0] & { history: MineBotHistory[] }> = {}
): Promise<MineBotStreamEvent[]> {
  const orchestrator = new MineBotOrchestrator();
  const events: MineBotStreamEvent[] = [];
  for await (const event of orchestrator.orchestrate({ question, ...request })) {
    events.push(event);
  }
  return events;
}

function finalData(events: MineBotStreamEvent[]) {
  const finalEvent = events.find((e) => e.type === "final");
  return finalEvent && finalEvent.type === "final" ? finalEvent.data : null;
}

describe("MineBot answer/citation hardening", () => {
  beforeEach(() => {
    geminiMock.available = true;
    vi.mocked(retrieveProductionEvidence).mockReset();
    vi.mocked(retrievePriceEvidence).mockReset();
  });

  describe("12. context-dependent follow-up works", () => {
    it("kalau tahun 2022 inherits batubara + production intent", async () => {
      vi.mocked(retrieveProductionEvidence).mockResolvedValue([
        productionEvidence(2023, "775.183.592 ton"),
        productionEvidence(2022, "687.402.285 ton"),
      ]);
      await collect("Kalau tahun 2022?", {
        history: [user("Berapa produksi batubara tahun 2023?")],
      });
      expect(vi.mocked(retrieveProductionEvidence)).toHaveBeenCalledWith(
        expect.objectContaining({ commodity: "batubara", year: 2022 })
      );
    });
  });

  describe("13. self-contained domain switch still works", () => {
    it("apa itu tambang terbuka breaks the production context", () => {
      const result = resolveConversationContext({
        question: "Apa itu tambang terbuka?",
        history: [user("Berapa produksi batubara tahun 2023?")],
      });
      expect(result.intent).toBe("content_query");
      expect(result.module).toBe("education");
      expect(result.commodity).toBeUndefined();
      expect(result.topic ?? null).toBeNull();
      expect(result.years).toEqual([]);
    });

    it("does not invoke intelligence retrieval for the education turn", async () => {
      await collect("Apa itu tambang terbuka?", {
        history: [user("Berapa produksi batubara tahun 2023?")],
      });
      expect(vi.mocked(retrieveProductionEvidence)).not.toHaveBeenCalled();
      expect(vi.mocked(retrievePriceEvidence)).not.toHaveBeenCalled();
    });
  });

  describe("9/10. citation precision", () => {
    it("overburden answer cites only the glossary evidence, not generic pages", async () => {
      const events = await collect("Apa fungsi overburden dalam kegiatan pertambangan?");
      const citations = finalData(events)?.citations ?? [];
      expect(citations.length).toBeGreaterThan(0);
      expect(citations[0]?.label.toLocaleLowerCase("id-ID")).toContain("overburden");
      expect(citations.some((c) => c.label.includes("Pengertian Pertambangan"))).toBe(false);
      expect(citations.some((c) => c.url === "/about")).toBe(false);
      expect(citations.some((c) => c.url === "/education")).toBe(false);
    });

    it("reklamasi answer cites the reclamation glossary, not generic pages", async () => {
      const events = await collect("Apa yang dimaksud dengan reklamasi dalam pertambangan?");
      const citations = finalData(events)?.citations ?? [];
      expect(citations[0]?.label).toContain("Reclamation");
      expect(citations.some((c) => c.label.includes("Pengertian Pertambangan"))).toBe(false);
    });

    it("Freeport question cites only the company page", async () => {
      const events = await collect("Apa komoditas utama PT Freeport Indonesia?");
      const citations = finalData(events)?.citations ?? [];
      expect(citations[0]?.label).toContain("Freeport");
      expect(citations.some((c) => c.label.includes("Tentang MineVision"))).toBe(false);
      expect(citations.some((c) => c.label.includes("Modul Education"))).toBe(false);
    });

    it("hilirisasi question cites the economy concept page", async () => {
      const events = await collect("Apa itu hilirisasi?");
      const citations = finalData(events)?.citations ?? [];
      expect(citations[0]?.label).toContain("Hilirisasi");
    });
  });

  describe("4. missing evidence falls back honestly", () => {
    it("unsupported entity emits no_public_evidence instead of answering generically", async () => {
      const events = await collect("Apa itu geopolimer?");
      const errorEvent = events.find((e) => e.type === "error");
      expect(errorEvent?.type).toBe("error");
      if (errorEvent?.type === "error") {
        expect(errorEvent.data.fallbackCategory).toBe("no_public_evidence");
      }
    });
  });

  describe("14/15. numeric exactness preserved", () => {
    it("Intelligence production answer keeps exact number in deterministic mode", async () => {
      geminiMock.available = false;
      vi.mocked(retrieveProductionEvidence).mockResolvedValue([
        productionEvidence(2023, "775.183.592 ton"),
      ]);
      const events = await collect("Berapa produksi batubara tahun 2023?");
      const data = finalData(events);
      expect(data?.answer).toContain("775.183.592 ton");
      expect(data?.answer).toContain("[S1]");
    });

    it("follow-up 2022 keeps exact number", async () => {
      geminiMock.available = false;
      vi.mocked(retrieveProductionEvidence)
        .mockResolvedValueOnce([productionEvidence(2023, "775.183.592 ton")])
        .mockResolvedValueOnce([productionEvidence(2022, "687.402.285 ton")]);
      await collect("Berapa produksi batubara tahun 2023?");
      const events = await collect("Kalau tahun 2022?", {
        history: [user("Berapa produksi batubara tahun 2023?")],
      });
      expect(finalData(events)?.answer).toContain("687.402.285 ton");
    });

    it("Economy GDP answer keeps exact formatted value", async () => {
      geminiMock.available = false;
      vi.mocked(getPublicGdp).mockResolvedValue([gdpFixture(2023)]);
      const events = await collect("Berapa PDB nasional tahun 2023?");
      const data = finalData(events);
      expect(data?.answer).toContain("20.892.312,3");
      expect(data?.answer).toContain("[S1]");
    });
  });

  describe("comparison answer uses both concepts in deterministic mode", () => {
    it("perbedaan tambang terbuka vs bawah tanah contains both glossary facts", async () => {
      geminiMock.available = false;
      const evidence = await retrievePublicContentEvidence(
        "Apa perbedaan tambang terbuka dan tambang bawah tanah?"
      );
      const orchestrator = new MineBotOrchestrator();
      const events: MineBotStreamEvent[] = [];
      for await (const event of orchestrator.orchestrate(
        { question: "Apa perbedaan tambang terbuka dan tambang bawah tanah?" },
        evidence
      )) {
        events.push(event);
      }
      const data = finalData(events);
      const answerLower = data?.answer.toLocaleLowerCase("id-ID") ?? "";
      expect(answerLower).toContain("open pit");
      expect(answerLower).toContain("underground mining");
      expect(answerLower).toContain("[s1]");
      expect(answerLower).toContain("[s2]");
    });
  });

  describe("17. streaming contract unchanged", () => {
    it("emits meta, delta, then terminal final event", async () => {
      const events = await collect("Apa itu tambang terbuka?");
      expect(events[0]).toMatchObject({ type: "meta" });
      expect(events.some((e) => e.type === "delta")).toBe(true);
      const terminal = events[events.length - 1];
      expect(terminal?.type).toBe("final");
    });
  });

  describe("mandatory regression conversation A–J", () => {
    it("routes each turn to the expected evidence", async () => {
      geminiMock.available = true;
      vi.mocked(retrieveProductionEvidence).mockResolvedValue([
        productionEvidence(2023, "775.183.592 ton"),
        productionEvidence(2022, "687.402.285 ton"),
      ]);

      const history: MineBotHistory[] = [];

      async function ask(question: string): Promise<MineBotStreamEvent[]> {
        const events = await collect(question, { history });
        history.push({ role: "user", content: question });
        history.push({ role: "assistant", content: "ok" });
        return events;
      }

      // A. production 2023
      await ask("Berapa produksi batubara tahun 2023?");
      expect(vi.mocked(retrieveProductionEvidence)).toHaveBeenLastCalledWith(
        expect.objectContaining({ commodity: "batubara", year: 2023 })
      );

      // B. follow-up 2022
      await ask("Kalau tahun 2022?");
      expect(vi.mocked(retrieveProductionEvidence)).toHaveBeenLastCalledWith(
        expect.objectContaining({ commodity: "batubara", year: 2022 })
      );

      // C. self-contained domain switch: must NOT hit production retrieval
      vi.mocked(retrieveProductionEvidence).mockClear();
      const cEvents = await ask("Apa itu tambang terbuka?");
      expect(vi.mocked(retrieveProductionEvidence)).not.toHaveBeenCalled();
      expect(finalData(cEvents)?.citations[0]?.label).toContain("Open pit");

      // D. reklamasi must not use generic Pengertian Pertambangan
      const dEvents = await ask("Apa yang dimaksud dengan reklamasi dalam pertambangan?");
      const dLabel = finalData(dEvents)?.citations[0]?.label ?? "";
      expect(dLabel).toContain("Reclamation");
      expect(dLabel).not.toContain("Pengertian Pertambangan");

      // E. overburden must not use generic Pengertian Pertambangan
      const eEvents = await ask("Apa fungsi overburden dalam kegiatan pertambangan?");
      const eLabel = finalData(eEvents)?.citations[0]?.label ?? "";
      expect(eLabel.toLocaleLowerCase("id-ID")).toContain("overburden");
      expect(eLabel).not.toContain("Pengertian Pertambangan");

      // F. comparison retrieves both concepts
      const fEvidence = await retrievePublicContentEvidence(
        "Apa perbedaan tambang terbuka dan tambang bawah tanah?"
      );
      const fIds = fEvidence.map((ev) => ev.evidenceId);
      expect(fIds).toContain("glossary-open-pit");
      expect(fIds).toContain("glossary-underground-mining");

      // G. Mining Engineer → career-specific evidence
      const gEvents = await ask("Apa tugas Mining Engineer?");
      expect(finalData(gEvents)?.citations[0]?.label).toContain("Mining Engineer");

      // H. Freeport location → company evidence
      const hEvents = await ask("Dimana wilayah operasi Freeport?");
      expect(finalData(hEvents)?.citations[0]?.label).toContain("Freeport");

      // I. Freeport commodity → company evidence
      const iEvents = await ask("Apa komoditas utama PT Freeport Indonesia?");
      expect(finalData(iEvents)?.citations[0]?.label).toContain("Freeport");

      // J. hilirisasi → economy concept evidence
      const jEvents = await ask("Apa itu hilirisasi?");
      expect(finalData(jEvents)?.citations[0]?.label).toContain("Hilirisasi");
    });
  });
});