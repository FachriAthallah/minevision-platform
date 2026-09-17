import { describe, expect, it } from "vitest";

import { CitationRegistry } from "./citation-registry";

describe("CitationRegistry", () => {
  it("adds entries and generates sequential IDs", () => {
    const registry = new CitationRegistry();

    const id1 = registry.addEntry({
      label: "Source 1",
      organization: "Org 1",
      url: "https://example.com/1",
      pageReference: "p.1",
      evidence: {
        evidenceId: "e1",
        kind: "structured",
        module: "intelligence",
        entityType: "production",
        title: "Title",
        facts: "Facts",
        sourceIds: [],
        canonicalUrl: "/url",
        limitations: [],
      },
    });

    const id2 = registry.addEntry({
      label: "Source 2",
      organization: "Org 2",
      url: "https://example.com/2",
      pageReference: "p.2",
      evidence: {
        evidenceId: "e2",
        kind: "structured",
        module: "intelligence",
        entityType: "production",
        title: "Title",
        facts: "Facts",
        sourceIds: [],
        canonicalUrl: "/url",
        limitations: [],
      },
    });

    expect(id1).toBe("S1");
    expect(id2).toBe("S2");
  });

  it("retrieves entry by ID", () => {
    const registry = new CitationRegistry();

    const id = registry.addEntry({
      label: "Test",
      organization: "Org",
      url: "https://example.com",
      pageReference: null,
      evidence: {
        evidenceId: "e1",
        kind: "structured",
        module: "intelligence",
        entityType: "production",
        title: "Title",
        facts: "Facts",
        sourceIds: [],
        canonicalUrl: "/url",
        limitations: [],
      },
    });

    const entry = registry.getEntry(id);
    expect(entry).toBeDefined();
    expect(entry?.label).toBe("Test");
  });

  it("returns null for non-existent ID", () => {
    const registry = new CitationRegistry();
    expect(registry.getEntry("S999")).toBeUndefined();
  });

  it("converts entry to citation DTO", () => {
    const registry = new CitationRegistry();

    const id = registry.addEntry({
      label: "Citation",
      organization: "Organization",
      url: "https://example.com",
      pageReference: "p.5",
      evidence: {
        evidenceId: "e1",
        kind: "structured",
        module: "intelligence",
        entityType: "production",
        title: "Title",
        facts: "Facts",
        sourceIds: [],
        canonicalUrl: "/url",
        limitations: [],
      },
    });

    const dto = registry.getCitationDTO(id);
    expect(dto?.label).toBe("Citation");
    expect(dto?.url).toBe("https://example.com");
    expect(dto?.pageReference).toBe("p.5");
  });

  it("extracts citation IDs from text", () => {
    const registry = new CitationRegistry();
    const text = "According to [S1], the data shows [S2] and [S1] again.";

    const ids = registry.extractCitationIds(text);
    expect(ids).toEqual(["S1", "S2"]);
  });

  it("validates citation IDs", () => {
    const registry = new CitationRegistry();

    registry.addEntry({
      label: "Source 1",
      organization: null,
      url: "https://example.com",
      pageReference: null,
      evidence: {
        evidenceId: "e1",
        kind: "structured",
        module: "intelligence",
        entityType: "production",
        title: "Title",
        facts: "Facts",
        sourceIds: [],
        canonicalUrl: "/url",
        limitations: [],
      },
    });

    const result = registry.validateCitationIds(["S1", "S999"]);
    expect(result.valid).toEqual(["S1"]);
    expect(result.invalid).toEqual(["S999"]);
  });

  it("deduplicates citations", () => {
    const citations = [
      { id: "S1", label: "Source 1", organization: null, url: "https://example.com", pageReference: null },
      { id: "S2", label: "Source 2", organization: null, url: "https://example.com", pageReference: null },
      { id: "S1", label: "Source 1", organization: null, url: "https://example.com", pageReference: null },
    ];

    const registry = new CitationRegistry();
    const deduped = registry.deduplicateCitations(citations);

    expect(deduped).toHaveLength(2);
    expect(deduped[0].id).toBe("S1");
    expect(deduped[1].id).toBe("S2");
  });
});
