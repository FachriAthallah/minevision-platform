import { describe, it, expect } from "vitest";
import { NDJSONParser } from "./ndjson-parser";

describe("NDJSONParser", () => {
  it("parses single complete line", () => {
    const parser = new NDJSONParser();
    const encoder = new TextEncoder();
    const chunk = encoder.encode(JSON.stringify({ type: "delta", data: { text: "Halo" } }) + "\n");
    const events = parser.parseChunk(chunk);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("delta");
  });

  it("handles partial lines across chunks", () => {
    const parser = new NDJSONParser();
    const encoder = new TextEncoder();
    const chunk1 = encoder.encode('{"type": "delta", "data": {"text":');
    const chunk2 = encoder.encode(' "Halo"}}\n');

    expect(parser.parseChunk(chunk1)).toHaveLength(0);
    const events = parser.parseChunk(chunk2);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("delta");
  });

  it("flushes remaining buffer", () => {
    const parser = new NDJSONParser();
    const encoder = new TextEncoder();
    const chunk = encoder.encode('{"type": "final", "data": {"answer": "Selesai"}}');
    parser.parseChunk(chunk);
    const events = parser.flush();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("final");
  });
});
