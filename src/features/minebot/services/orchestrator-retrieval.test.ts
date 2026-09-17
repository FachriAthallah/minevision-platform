import { describe, expect, it, vi, beforeEach } from "vitest";

import type { Evidence, MineBotStreamEvent } from "../types/orchestrator";
import { MineBotOrchestrator } from "./orchestrator";
import { retrievePriceEvidence, retrieveProductionEvidence } from "../retrieval/intelligence-evidence";
import { createIntentRouter } from "./intent-router";

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
      yield { type: "delta", text: "Produksi batubara Indonesia pada 2023 mencapai ..." };
      yield { type: "complete" };
    }
  },
}));

function createEligible(commodity: string, year = 2023): Evidence[] {
  return [
    {
      evidenceId: `production-${commodity}-${year}`,
      kind: "structured" as const,
      module: "intelligence",
      entityType: "commodity_production" as const,
      title: `Produksi ${commodity} ${year}`,
      facts: `Produksi ${commodity} Indonesia tahun ${year} mencapai ${year === 2023 ? "775" : "687"} juta ton.`,
      period: { year },
      unit: "Ton",
      recordType: "actual" as const,
      verificationStatus: "verified" as const,
      publicationStatus: "published" as const,
      sourceIds: ["kementerian-esdm"],
      canonicalUrl: `/intelligence?commodity=${commodity}`,
      limitations: [],
    },
  ];
}

describe("MineBot entity resolution and retrieval integration", () => {
  beforeEach(() => {
    geminiCallSpy.calls = 0;
    vi.mocked(retrieveProductionEvidence).mockReset();
    vi.mocked(retrievePriceEvidence).mockReset();
  });

  it("routes explicit question entity and triggers retrieval with batubara", async () => {
    const router = createIntentRouter();
    const result = router.route("Berapa produksi batubara Indonesia pada 2023?", {
      module: "intelligence",
    });
    expect(result.intent).toBe("data_query");
    expect(result.topic).toBe("production");
    expect(result.commodity).toBe("batubara");
    expect(result.year).toBe(2023);
  });

  it("explicit question commodity overrides page context commodity", async () => {
    const router = createIntentRouter();
    const result = router.route("Berapa produksi batubara pada 2023?", {
      module: "intelligence",
      commodity: "nikel",
    });
    expect(result.commodity).toBe("batubara");
  });

  it("falls back to page context when question has no commodity", async () => {
    const router = createIntentRouter();
    const result = router.route("Berapa produksinya pada 2023?", {
      module: "intelligence",
      commodity: "nikel",
    });
    expect(result.commodity).toBe("nikel");
    expect(result.intent).toBe("data_query");
  });

  it("missing entity produces clarification without retrieval or Gemini", async () => {
    vi.mocked(retrieveProductionEvidence).mockResolvedValue([]);
    const orchestrator = new MineBotOrchestrator();

    const events: MineBotStreamEvent[] = [];
    for await (const event of orchestrator.orchestrate(
      {
        question: "Berapa produksinya pada 2023?",
        context: { module: "intelligence" },
      },
      []
    )) {
      events.push(event);
    }

    expect(vi.mocked(retrieveProductionEvidence)).not.toHaveBeenCalled();
    expect(geminiCallSpy.calls).toBe(0);
    const errorEvent = events.find((e) => e.type === "error");
    expect(errorEvent?.type).toBe("error");
    if (errorEvent?.type === "error") {
      expect(errorEvent.data.fallbackCategory).toBe("clarification_commodity");
    }
  });

  it("retrieves evidence and calls Gemini at most once when eligible evidence found", async () => {
    vi.mocked(retrieveProductionEvidence).mockResolvedValue(createEligible("batubara"));
    vi.mocked(retrievePriceEvidence).mockResolvedValue([]);

    const orchestrator = new MineBotOrchestrator();
    const events: MineBotStreamEvent[] = [];
    for await (const event of orchestrator.orchestrate(
      {
        question: "Berapa produksi batubara pada 2023?",
        context: { module: "intelligence" },
      },
      []
    )) {
      events.push(event);
    }

    expect(vi.mocked(retrieveProductionEvidence)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(retrieveProductionEvidence)).toHaveBeenCalledWith(
      expect.objectContaining({ commodity: "batubara", year: 2023 })
    );
    expect(geminiCallSpy.calls).toBe(1);
    expect(events.map((e) => e.type)).toContain("final");
  });

  it("filters production retrieval to the explicitly requested year", async () => {
    vi.mocked(retrieveProductionEvidence).mockResolvedValue([
      ...createEligible("batubara", 2022),
      ...createEligible("batubara", 2023),
    ]);
    vi.mocked(retrievePriceEvidence).mockResolvedValue([]);

    const orchestrator = new MineBotOrchestrator();
    const events: MineBotStreamEvent[] = [];
    for await (const event of orchestrator.orchestrate(
      {
        question: "Berapa produksi batubara pada 2023?",
      },
      []
    )) {
      events.push(event);
    }

    const finalEvent = events.find((event) => event.type === "final");
    expect(finalEvent?.type).toBe("final");
    if (finalEvent?.type === "final") {
      expect(finalEvent.data.citations).toHaveLength(1);
      expect(finalEvent.data.citations[0]?.label).toBe("Produksi batubara 2023");
    }
  });

  it("no eligible evidence produces fallback without Gemini", async () => {
    vi.mocked(retrieveProductionEvidence).mockResolvedValue([]);
    vi.mocked(retrievePriceEvidence).mockResolvedValue([]);

    const orchestrator = new MineBotOrchestrator();
    const events: MineBotStreamEvent[] = [];
    for await (const event of orchestrator.orchestrate(
      {
        question: "Berapa produksi batubara pada 2023?",
        context: { module: "intelligence" },
      },
      []
    )) {
      events.push(event);
    }

    expect(geminiCallSpy.calls).toBe(0);
    const errorEvent = events.find((e) => e.type === "error");
    expect(errorEvent?.type).toBe("error");
    if (errorEvent?.type === "error") {
      expect(errorEvent.data.fallbackCategory).toBe("no_public_evidence");
    }
  });

  it("uses supplied eligible evidence without extra retrieval when provided", async () => {
    const orchestrator = new MineBotOrchestrator();
    const events: MineBotStreamEvent[] = [];
    for await (const event of orchestrator.orchestrate(
      {
        question: "Berapa produksi batubara pada 2023?",
        context: { module: "intelligence" },
      },
      createEligible("batubara")
    )) {
      events.push(event);
    }

    expect(vi.mocked(retrieveProductionEvidence)).not.toHaveBeenCalled();
    expect(geminiCallSpy.calls).toBe(1);
    expect(events.map((e) => e.type)).toContain("final");
  });

  it("inherits commodity and year from recent user history for production follow-up", async () => {
    vi.mocked(retrieveProductionEvidence).mockResolvedValue(createEligible("batubara"));
    vi.mocked(retrievePriceEvidence).mockResolvedValue([]);

    const orchestrator = new MineBotOrchestrator();
    const events: MineBotStreamEvent[] = [];
    for await (const event of orchestrator.orchestrate(
      {
        question: "Berapa produksinya?",
        history: [{ role: "user", content: "Berapa produksi batubara pada 2023?" }],
      },
      []
    )) {
      events.push(event);
    }

    expect(vi.mocked(retrieveProductionEvidence)).toHaveBeenCalledWith(
      expect.objectContaining({ commodity: "batubara", year: 2023 })
    );
    expect(events.map((e) => e.type)).toContain("final");
  });

  it("overrides historical commodity while inheriting year for commodity follow-up", async () => {
    vi.mocked(retrieveProductionEvidence).mockResolvedValue(createEligible("nikel"));

    const orchestrator = new MineBotOrchestrator();
    for await (const event of orchestrator.orchestrate(
      {
        question: "Kalau nikel?",
        history: [{ role: "user", content: "Berapa produksi batubara pada 2023?" }],
      },
      []
    )) {
      expect(event).toBeDefined();
    }

    expect(vi.mocked(retrieveProductionEvidence)).toHaveBeenCalledWith(
      expect.objectContaining({ commodity: "nikel", year: 2023 })
    );
  });

  it("retrieves both comparison years from follow-up context", async () => {
    vi.mocked(retrieveProductionEvidence).mockResolvedValue(createEligible("batubara"));

    const orchestrator = new MineBotOrchestrator();
    for await (const event of orchestrator.orchestrate(
      {
        question: "Kalau dibandingkan 2022?",
        history: [{ role: "user", content: "Berapa produksi batubara pada 2023?" }],
      },
      []
    )) {
      expect(event).toBeDefined();
    }

    expect(vi.mocked(retrieveProductionEvidence)).toHaveBeenCalledWith(
      expect.objectContaining({ commodity: "batubara", year: 2022 })
    );
    expect(vi.mocked(retrieveProductionEvidence)).toHaveBeenCalledWith(
      expect.objectContaining({ commodity: "batubara", year: 2023 })
    );
  });
});
