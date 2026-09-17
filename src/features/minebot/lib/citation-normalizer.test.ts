import { describe, expect, it } from "vitest";

import type { MineBotContext } from "../types/minebot";
import { extractSourceMarkers, normalizeCitations, hasValidCitations } from "./citation-normalizer";

describe("citation-normalizer", () => {
  describe("extractSourceMarkers", () => {
    it("extracts single marker", () => {
      const text = "Berdasarkan [source-1], produksi batubara mencapai 775 juta ton.";
      const result = extractSourceMarkers(text);

      expect(result).toEqual(["source-1"]);
    });

    it("extracts multiple markers", () => {
      const text = "Menurut [source-1] dan [source-2], data tersebut valid.";
      const result = extractSourceMarkers(text);

      expect(result).toEqual(["source-1", "source-2"]);
    });

    it("deduplicates markers", () => {
      const text = "[source-1] menunjukkan hal itu. [source-1] juga mengonfirmasi.";
      const result = extractSourceMarkers(text);

      expect(result).toEqual(["source-1"]);
    });

    it("returns empty array for no markers", () => {
      const text = "Tidak ada citation marker di sini.";
      const result = extractSourceMarkers(text);

      expect(result).toEqual([]);
    });
  });

  describe("normalizeCitations", () => {
    const sourceMap = new Map<string, MineBotContext>([
      [
        "source-1",
        {
          sourceId: "source-1",
          content: "Data produksi",
          source: {
            id: "source-1",
            title: "Produksi Batubara 2023",
            module: "intelligence",
            sourceName: "Kementerian ESDM",
            sourceUrl: "https://example.go.id",
          },
        },
      ],
      [
        "source-2",
        {
          sourceId: "source-2",
          content: "Data harga",
          source: {
            id: "source-2",
            title: "Harga Batubara Acuan",
            module: "intelligence",
            sourceName: "Kementerian ESDM",
            sourceUrl: "https://example.go.id/hba",
          },
        },
      ],
    ]);

    it("returns valid citation", () => {
      const answer = "Produksi batubara [source-1] mencapai 775 juta ton.";
      const result = normalizeCitations(answer, sourceMap);

      expect(result.citations.length).toBe(1);
      expect(result.citations[0].id).toBe("source-1");
      expect(result.citations[0].title).toBe("Produksi Batubara 2023");
      expect(result.cleanedAnswer).toContain("[source-1]");
    });

    it("removes invalid marker from answer", () => {
      const answer = "Data dari [source-99] menunjukkan hal tersebut.";
      const result = normalizeCitations(answer, sourceMap);

      expect(result.citations.length).toBe(0);
      expect(result.cleanedAnswer).not.toContain("[source-99]");
    });

    it("handles mixed valid and invalid markers", () => {
      const answer = "[source-1] valid, tetapi [source-99] tidak valid.";
      const result = normalizeCitations(answer, sourceMap);

      expect(result.citations.length).toBe(1);
      expect(result.citations[0].id).toBe("source-1");
      expect(result.cleanedAnswer).toContain("[source-1]");
      expect(result.cleanedAnswer).not.toContain("[source-99]");
    });

    it("deduplicates citations", () => {
      const answer = "[source-1] dan [source-1] adalah sumber yang sama.";
      const result = normalizeCitations(answer, sourceMap);

      expect(result.citations.length).toBe(1);
    });

    it("returns empty citations for empty source map", () => {
      const answer = "[source-1] data here.";
      const result = normalizeCitations(answer, new Map());

      expect(result.citations).toEqual([]);
      expect(result.cleanedAnswer).not.toContain("[source-1]");
    });
  });

  describe("hasValidCitations", () => {
    it("returns true for non-empty citations", () => {
      expect(hasValidCitations([{ id: "source-1", title: "Title" }])).toBe(true);
    });

    it("returns false for empty citations", () => {
      expect(hasValidCitations([])).toBe(false);
    });
  });
});
