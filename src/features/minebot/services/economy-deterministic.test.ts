import { describe, expect, it, vi, beforeEach } from "vitest";

import type { PublicGdpRecord } from "@/features/economy/types/gdp";
import type { MineBotStreamEvent } from "../types/orchestrator";
import { MineBotOrchestrator } from "./orchestrator";
import { getPublicGdp } from "@/features/economy/server/get-public-gdp";

vi.mock("./gemini-server-client", () => ({
  GeminiServerClient: class {
    isAvailable() {
      return false;
    }
    async *generateStream() {
      yield { type: "error", error: { code: "AI_SERVICE_UNAVAILABLE", message: "unavailable" } };
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

describe("MineBot economy deterministic fallback", () => {
  beforeEach(() => {
    vi.mocked(getPublicGdp).mockReset();
  });

  it("answers deterministically from evidence when Gemini is unavailable", async () => {
    vi.mocked(getPublicGdp).mockResolvedValue([gdpFixture(2023)]);

    const orchestrator = new MineBotOrchestrator();
    const events: MineBotStreamEvent[] = [];
    for await (const event of orchestrator.orchestrate({ question: "Berapa PDB Indonesia tahun 2023?" })) {
      events.push(event);
    }

    const finalEvent = events.find((e) => e.type === "final");
    expect(finalEvent?.type).toBe("final");
    if (finalEvent?.type === "final") {
      expect(finalEvent.data.answer).toContain("20.892.312,3");
      expect(finalEvent.data.citations[0]?.label).toContain("PDB nasional Indonesia 2023");
      expect(finalEvent.data.limitations.some((l) => l.includes("tanpa sintesis AI"))).toBe(true);
    }
  });
});