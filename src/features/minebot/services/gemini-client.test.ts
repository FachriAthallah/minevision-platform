import { describe, expect, it, vi, beforeEach } from "vitest";

import { FALLBACK_SERVICE_UNAVAILABLE } from "../types/minebot";
import { generateMineBotAnswer, isMineBotAvailable } from "./gemini-client";

vi.mock("@google/genai", () => ({
  GoogleGenAI: class {
    models = {
      generateContent: vi.fn().mockResolvedValue({
        text: "Produksi batubara Indonesia tahun 2023 adalah 775 juta ton.",
      }),
    };
  },
}));

describe("gemini-client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.MINEBOT_API_KEY;
    delete process.env.MINEBOT_GEMINI_MODEL;
  });

  describe("isMineBotAvailable", () => {
    it("returns false when MINEBOT_API_KEY is not set", () => {
      delete process.env.MINEBOT_API_KEY;
      expect(isMineBotAvailable()).toBe(false);
    });

    it("returns true when MINEBOT_API_KEY is set", () => {
      process.env.MINEBOT_API_KEY = "test-api-key";
      expect(isMineBotAvailable()).toBe(true);
    });
  });

  describe("generateMineBotAnswer", () => {
    it("returns fallback when API key is missing", async () => {
      delete process.env.MINEBOT_API_KEY;

      const result = await generateMineBotAnswer(
        "system prompt",
        "test query",
        "test context"
      );

      expect(result.fallback).toBe(true);
      expect(result.answer).toBe(FALLBACK_SERVICE_UNAVAILABLE);
      expect(result.citations).toEqual([]);
    });

    it("returns generated answer when API key is available", async () => {
      process.env.MINEBOT_API_KEY = "test-api-key";

      const result = await generateMineBotAnswer(
        "system prompt",
        "test query",
        "test context"
      );

      expect(result.fallback).toBe(false);
      expect(result.answer).toContain("batubara");
    });
  });
});
