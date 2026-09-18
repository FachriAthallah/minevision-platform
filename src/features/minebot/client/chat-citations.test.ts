import { describe, expect, it } from "vitest";

import { parseCitationMarkers, sanitizeHref, isExternalHref, citationCount } from "./chat-citations";

const citations = [
  { id: "S1", label: "Istilah Pertambangan", organization: "Edukasi MineVision", url: "/education/istilah-pertambangan#glosarium", pageReference: null },
  { id: "S2", label: "Produksi Batubara 2023", organization: "ESDM", url: "/intelligence?commodity=batubara", pageReference: null },
];

describe("parseCitationMarkers", () => {
  it("splits text and resolves markers to citation DTOs", () => {
    const parts = parseCitationMarkers("Overburden adalah [S1] lapisan [S2] penutup.", citations);
    expect(parts).toEqual([
      { type: "text", value: "Overburden adalah " },
      { type: "citation", index: 1, citation: citations[0] },
      { type: "text", value: " lapisan " },
      { type: "citation", index: 2, citation: citations[1] },
      { type: "text", value: " penutup." },
    ]);
  });

  it("keeps pure text unchanged without markers", () => {
    const parts = parseCitationMarkers("Jawaban tanpa referensi.", []);
    expect(parts).toEqual([{ type: "text", value: "Jawaban tanpa referensi." }]);
  });

  it("returns null citation for a marker not present in the citation list", () => {
    const parts = parseCitationMarkers("Lihat [S9].", citations);
    expect(parts).toContainEqual({ type: "citation", index: 9, citation: null });
  });

  it("does not treat plain bracket text as a citation", () => {
    const parts = parseCitationMarkers("Nota [catatan] biasa.", citations);
    expect(parts).toEqual([{ type: "text", value: "Nota [catatan] biasa." }]);
  });
});

describe("citationCount", () => {
  it("counts markers in content", () => {
    expect(citationCount("[S1] [S2]")).toBe(2);
    expect(citationCount("tanpa marker")).toBe(0);
  });
});

describe("sanitizeHref", () => {
  it("allows relative MineVision paths", () => {
    expect(sanitizeHref("/education/istilah")).toBe("/education/istilah");
  });

  it("allows explicit http(s) urls", () => {
    expect(sanitizeHref("https://esdm.go.id/")).toBe("https://esdm.go.id/");
  });

  it("blocks javascript:, data:, and protocol-relative urls", () => {
    expect(sanitizeHref("javascript:alert(1)")).toBeNull();
    expect(sanitizeHref("data:text/html,x")).toBeNull();
    expect(sanitizeHref("//evil.example")).toBeNull();
  });

  it("blocks non-root relative urls", () => {
    expect(sanitizeHref("education/foo")).toBeNull();
  });
});

describe("isExternalHref", () => {
  it("distinguishes external http(s) from internal pages", () => {
    expect(isExternalHref("https://esdm.go.id/")).toBe(true);
    expect(isExternalHref("/about")).toBe(false);
    expect(isExternalHref("/education/istilah#glosarium")).toBe(false);
  });
});