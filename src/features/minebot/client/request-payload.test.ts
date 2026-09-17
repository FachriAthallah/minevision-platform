import { describe, expect, it } from "vitest";

import type { MineBotUiMessage } from "./chat-state";
import {
  buildMineBotHistory,
  buildMineBotPageContext,
  buildMineBotRequestPayload,
} from "./request-payload";

function message(
  role: MineBotUiMessage["role"],
  content: string,
  status: MineBotUiMessage["status"] = "complete"
): MineBotUiMessage {
  return {
    id: `${role}-${content}`,
    role,
    content,
    status,
  };
}

describe("MineBot request payload builder", () => {
  it("sends only final non-empty messages as bounded history", () => {
    const history = buildMineBotHistory([
      message("user", "halo"),
      message("assistant", "Halo!"),
      message("assistant", "", "streaming"),
      message("assistant", "Koneksi terputus", "error"),
      message("user", "Berapa produksi batubara pada 2023?"),
      message("assistant", "Produksi batubara 2023 ..."),
      message("user", "Kalau nikel?"),
      message("assistant", "Produksi nikel 2023 ..."),
      message("user", "makasih"),
    ]);

    expect(history).toHaveLength(6);
    expect(history.map((item) => item.content)).toEqual([
      "Halo!",
      "Berapa produksi batubara pada 2023?",
      "Produksi batubara 2023 ...",
      "Kalau nikel?",
      "Produksi nikel 2023 ...",
      "makasih",
    ]);
    expect(history.some((item) => item.content === "Koneksi terputus")).toBe(false);
  });

  it("does not duplicate the current question into history", () => {
    const payload = buildMineBotRequestPayload({
      question: "Berapa produksinya?",
      messages: [message("user", "Berapa produksi batubara pada 2023?")],
      context: { module: "intelligence", pageUrl: "/intelligence" },
    });

    expect(payload.question).toBe("Berapa produksinya?");
    expect(payload.history).toEqual([
      { role: "user", content: "Berapa produksi batubara pada 2023?" },
    ]);
    expect(payload.history?.some((item) => item.content === payload.question)).toBe(false);
    expect(payload.context).toEqual({ module: "intelligence", pageUrl: "/intelligence" });
  });

  it("builds valid public page context without empty commodity overrides", () => {
    expect(buildMineBotPageContext("/intelligence")).toEqual({
      module: "intelligence",
      pageUrl: "/intelligence",
    });
    expect(buildMineBotPageContext("/commodity/nikel")).toEqual({
      module: "commodity",
      pageUrl: "/commodity/nikel",
      entitySlug: "nikel",
      commodity: "nikel",
    });
    expect(buildMineBotPageContext("/intelligence?commodity=batubara&year=2023")).toEqual({
      module: "intelligence",
      pageUrl: "/intelligence?commodity=batubara&year=2023",
      commodity: "batubara",
      year: 2023,
    });
  });
});
