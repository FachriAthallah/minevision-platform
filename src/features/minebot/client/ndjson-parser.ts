import type { MineBotStreamEvent, MineBotCitation, MineBotRelatedLink } from "../types/orchestrator";

export type MineBotUiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: "complete" | "streaming" | "error" | "cancelled";
  citations?: MineBotCitation[];
  relatedLinks?: MineBotRelatedLink[];
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
};

export class NDJSONParser {
  private buffer = "";
  private decoder = new TextDecoder();

  parseChunk(chunk: Uint8Array): MineBotStreamEvent[] {
    this.buffer += this.decoder.decode(chunk, { stream: true });
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() || "";

    const events: MineBotStreamEvent[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const parsed = JSON.parse(trimmed) as MineBotStreamEvent;
        events.push(parsed);
      } catch {
        // Ignore malformed JSON lines
      }
    }
    return events;
  }

  flush(): MineBotStreamEvent[] {
    const trimmed = this.buffer.trim();
    this.buffer = "";
    if (!trimmed) return [];
    try {
      return [JSON.parse(trimmed) as MineBotStreamEvent];
    } catch {
      return [];
    }
  }
}
