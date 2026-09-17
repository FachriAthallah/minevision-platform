import { describe, expect, it } from "vitest";

import { minebotQuerySchema } from "./minebot-query";

describe("minebotQuerySchema", () => {
  it("menerima question valid", () => {
    const result = minebotQuerySchema.safeParse({
      question: "Berapa produksi batubara tahun 2023?",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.question).toBe("Berapa produksi batubara tahun 2023?");
    }
  });

  it("menolak question kurang dari 2 karakter", () => {
    const result = minebotQuerySchema.safeParse({ question: "a" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.question).toBeDefined();
    }
  });

  it("menolak question lebih dari 500 karakter", () => {
    const longQuestion = "a".repeat(501);
    const result = minebotQuerySchema.safeParse({ question: longQuestion });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.question).toBeDefined();
    }
  });

  it("menormalisasi whitespace", () => {
    const result = minebotQuerySchema.safeParse({
      question: "  produksi batubara  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.question).toBe("produksi batubara");
    }
  });

  it("menolak question kosong setelah trim", () => {
    const result = minebotQuerySchema.safeParse({ question: "   " });

    expect(result.success).toBe(false);
  });

  it("menolak body tanpa field question", () => {
    const result = minebotQuerySchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it("menerima request dengan context lengkap", () => {
    const result = minebotQuerySchema.safeParse({
      question: "Berapa produksi nikel?",
      conversationId: "550e8400-e29b-41d4-a716-446655440000",
      context: {
        module: "intelligence",
        pageUrl: "/intelligence?commodity=nikel",
        commodity: "nikel",
      },
    });

    expect(result.success).toBe(true);
  });

  it("menolak context dengan pageUrl eksternal", () => {
    const result = minebotQuerySchema.safeParse({
      question: "Pertanyaan?",
      context: {
        pageUrl: "https://external.com/page",
      },
    });

    expect(result.success).toBe(false);
  });
});
