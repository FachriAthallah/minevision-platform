import { describe, expect, it } from "vitest";

import { resolveConversationContext } from "./conversation-context";

describe("resolveConversationContext", () => {
  it("classifies platform information questions", () => {
    const result = resolveConversationContext({
      question: "Apa itu MineVision?",
    });

    expect(result.intent).toBe("platform_info");
    expect(result.needsClarification).toBe(false);
  });

  it("inherits production commodity and year from recent user history", () => {
    const result = resolveConversationContext({
      question: "Berapa produksinya?",
      history: [{ role: "user", content: "Berapa produksi batubara pada 2023?" }],
    });

    expect(result.intent).toBe("follow_up");
    expect(result.commodity).toBe("batubara");
    expect(result.years).toEqual([2023]);
    expect(result.inheritedFrom).toBe("history");
    expect(result.needsClarification).toBe(false);
  });

  it("lets current question commodity override history while inheriting year", () => {
    const result = resolveConversationContext({
      question: "Kalau nikel?",
      history: [{ role: "user", content: "Berapa produksi batubara pada 2023?" }],
    });

    expect(result.intent).toBe("follow_up");
    expect(result.commodity).toBe("nikel");
    expect(result.years).toEqual([2023]);
    expect(result.inheritedFrom).toBe("question");
  });

  it("includes current and historical years for comparison follow-up", () => {
    const result = resolveConversationContext({
      question: "Kalau dibandingkan 2022?",
      history: [{ role: "user", content: "Berapa produksi batubara pada 2023?" }],
    });

    expect(result.commodity).toBe("batubara");
    expect(result.years).toEqual([2022, 2023]);
  });

  it("uses current question before history and page context", () => {
    const result = resolveConversationContext({
      question: "Berapa produksi tembaga pada 2023?",
      history: [{ role: "user", content: "Berapa produksi batubara pada 2022?" }],
      pageContext: { module: "commodity", commodity: "nikel", pageUrl: "/commodity/nikel" },
    });

    expect(result.commodity).toBe("tembaga");
    expect(result.years).toEqual([2023]);
    expect(result.inheritedFrom).toBe("question");
  });

  it("asks clarification after new conversation has no history", () => {
    const result = resolveConversationContext({
      question: "Berapa produksinya?",
    });

    expect(result.needsClarification).toBe(true);
    expect(result.clarification).toBe("commodity");
  });
});
