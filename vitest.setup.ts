import { vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/features/minebot/retrieval/intelligence-evidence", () => ({
  retrieveProductionEvidence: vi.fn().mockResolvedValue([]),
  retrievePriceEvidence: vi.fn().mockResolvedValue([]),
}));

// Unit tests must not reach the database through the site search aggregator.
vi.mock("@/features/search/server/search-public-site", () => ({
  searchPublicSite: vi.fn().mockResolvedValue({
    items: [],
    total: 0,
    page: 1,
    limit: 6,
    pageCount: 1,
    query: "",
  }),
}));
