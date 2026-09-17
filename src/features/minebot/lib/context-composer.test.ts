import { describe, expect, it } from "vitest";

import type { MineBotContext } from "../types/minebot";
import { composeContext, hasSufficientContext, buildFullPrompt, createFallbackResponse } from "./context-composer";

describe("context-composer", () => {
  describe("composeContext", () => {
    it("returns empty context for empty array", () => {
      const result = composeContext([]);

      expect(result.contextText).toBe("");
      expect(result.sourceMap.size).toBe(0);
    });

    it("creates context with source markers", () => {
      const contexts: MineBotContext[] = [
        {
          sourceId: "source-1",
          content: "Produksi batubara 2023: 775 juta ton",
          source: {
            id: "source-1",
            title: "Produksi Batubara 2023",
            module: "intelligence",
          },
        },
      ];

      const result = composeContext(contexts);

      expect(result.contextText).toContain("[source-1]");
      expect(result.contextText).toContain("Produksi batubara");
      expect(result.sourceMap.size).toBe(1);
      expect(result.sourceMap.get("source-1")).toEqual(contexts[0]);
    });

    it("handles multiple contexts", () => {
      const contexts: MineBotContext[] = [
        {
          sourceId: "source-1",
          content: "Data 1",
          source: { id: "source-1", title: "Title 1", module: "intelligence" },
        },
        {
          sourceId: "source-2",
          content: "Data 2",
          source: { id: "source-2", title: "Title 2", module: "intelligence" },
        },
      ];

      const result = composeContext(contexts);

      expect(result.contextText).toContain("[source-1]");
      expect(result.contextText).toContain("[source-2]");
      expect(result.sourceMap.size).toBe(2);
    });
  });

  describe("hasSufficientContext", () => {
    it("returns false for empty array", () => {
      expect(hasSufficientContext([])).toBe(false);
    });

    it("returns true for non-empty array", () => {
      const contexts: MineBotContext[] = [
        {
          sourceId: "source-1",
          content: "Data",
          source: { id: "source-1", title: "Title", module: "intelligence" },
        },
      ];

      expect(hasSufficientContext(contexts)).toBe(true);
    });
  });

  describe("buildFullPrompt", () => {
    it("returns null for empty contexts", () => {
      const result = buildFullPrompt("system", "query", []);

      expect(result).toBeNull();
    });

    it("builds full prompt with all components", () => {
      const contexts: MineBotContext[] = [
        {
          sourceId: "source-1",
          content: "Produksi batubara: 775 juta ton",
          source: {
            id: "source-1",
            title: "Produksi 2023",
            module: "intelligence",
          },
        },
      ];

      const result = buildFullPrompt("System instruction", "Berapa produksi batubara?", contexts);

      expect(result).not.toBeNull();
      expect(result!.prompt).toContain("System instruction");
      expect(result!.prompt).toContain("Berapa produksi batubara?");
      expect(result!.prompt).toContain("KONTEKS MINEVISION");
      expect(result!.prompt).toContain("[source-1]");
      expect(result!.sourceMap.size).toBe(1);
    });
  });

  describe("createFallbackResponse", () => {
    it("returns fallback response with correct structure", () => {
      const result = createFallbackResponse();

      expect(result.fallback).toBe(true);
      expect(result.citations).toEqual([]);
      expect(result.answer).toContain("Maaf, MineBot");
    });
  });
});
