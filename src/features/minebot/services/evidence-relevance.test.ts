import { describe, expect, it } from "vitest";

import { classifyQuestionShape } from "../retrieval/domain-evidence";
import { retrievePublicContentEvidence } from "../retrieval/public-content-evidence";

describe("MineBot evidence relevance hardening", () => {
  describe("1. exact glossary term outranks generic page", () => {
    it("overburden glossary beats Pengertian Pertambangan for fungsi question", async () => {
      const evidence = await retrievePublicContentEvidence(
        "Apa fungsi overburden dalam kegiatan pertambangan?"
      );
      expect(evidence[0]?.evidenceId).toBe("glossary-overburden");
      expect(evidence[0]?.entityType).toBe("glossary");
    });

    it("overburden glossary beats Pengertian Pertambangan for definition question", async () => {
      const evidence = await retrievePublicContentEvidence("Apa itu overburden?");
      expect(evidence[0]?.evidenceId).toBe("glossary-overburden");
    });
  });

  describe("2. entity-specific evidence outranks generic page", () => {
    it("Freeport company evidence is primary for a Freeport question", async () => {
      const evidence = await retrievePublicContentEvidence(
        "Apa komoditas utama PT Freeport Indonesia?"
      );
      expect(evidence[0]?.evidenceId).toBe("company-freeport-indonesia");
      expect(evidence[0]?.entityType).toBe("company");
    });

    it("Freeport company evidence is primary for a location question", async () => {
      const evidence = await retrievePublicContentEvidence("Dimana wilayah operasi Freeport?");
      expect(evidence[0]?.evidenceId).toBe("company-freeport-indonesia");
    });
  });

  describe("3. direct evidence outranks related evidence", () => {
    it("reklamasi resolves to the Reclamation glossary rather than a related article", async () => {
      const evidence = await retrievePublicContentEvidence(
        "Apa yang dimaksud dengan reklamasi dalam pertambangan?"
      );
      expect(evidence[0]?.evidenceId).toBe("glossary-reclamation");
      expect(evidence[0]?.title).toBe("Reclamation");
    });
  });

  describe("4. missing evidence does NOT trigger unrelated generic fallback", () => {
    it("unsupported specific term returns no evidence", async () => {
      const evidence = await retrievePublicContentEvidence("Apa itu geopolimer?");
      expect(evidence).toEqual([]);
    });
  });

  describe("5. definition question produces definition-focused evidence", () => {
    it("tambang terbuka routes to Open pit glossary", async () => {
      const evidence = await retrievePublicContentEvidence("Apa itu tambang terbuka?");
      expect(evidence[0]?.evidenceId).toBe("glossary-open-pit");
      expect(evidence[0]?.entityType).toBe("glossary");
    });
  });

  describe("6. function question produces function-relevant evidence", () => {
    it("fungsi overburden routes to overburden glossary", async () => {
      const evidence = await retrievePublicContentEvidence("Apa fungsi overburden?");
      expect(evidence[0]?.evidenceId).toBe("glossary-overburden");
    });
  });

  describe("7. responsibility question produces role-specific evidence", () => {
    it("tugas Mining Engineer routes to the profession evidence", async () => {
      const evidence = await retrievePublicContentEvidence("Apa tugas Mining Engineer?");
      expect(evidence[0]?.evidenceId).toBe("career-mining-engineer");
      expect(evidence[0]?.entityType).toBe("profession");
    });
  });

  describe("8. comparison retrieves both requested concepts", () => {
    it("perbedaan tambang terbuka vs bawah tanah keeps both concepts + method article", async () => {
      const evidence = await retrievePublicContentEvidence(
        "Apa perbedaan tambang terbuka dan tambang bawah tanah?"
      );
      const ids = evidence.map((item) => item.evidenceId);
      expect(ids).toContain("glossary-open-pit");
      expect(ids).toContain("glossary-underground-mining");
      expect(ids.some((id) => id.startsWith("education-metode"))).toBe(true);
    });

    it("hilirisasi routes to economy concept evidence", async () => {
      const evidence = await retrievePublicContentEvidence("Apa itu hilirisasi?");
      expect(evidence[0]?.evidenceId).toBe("economy-hilirisasi");
    });
  });

  describe("11. list questions use canonical aggregate evidence", () => {
    it("komoditas list returns a single canonical evidence", async () => {
      const evidence = await retrievePublicContentEvidence("Apa saja data komoditas yang tersedia?");
      expect(evidence).toHaveLength(1);
      expect(evidence[0]?.evidenceId).toBe("commodity-list");
      expect(evidence[0]?.canonicalUrl).toBe("/commodity");
    });

    it("does not attach unrelated generic pages to list answers", async () => {
      const evidence = await retrievePublicContentEvidence(
        "Komoditas apa saja yang ada di MineVision?"
      );
      const urls = evidence.map((item) => item.canonicalUrl);
      expect(urls).not.toContain("/about");
      expect(urls.every((url) => url === "/commodity")).toBe(true);
    });
  });

  describe("question shape classification", () => {
    it.each([
      ["Apa itu tambang terbuka?", "definition"],
      ["Apa yang dimaksud dengan reklamasi?", "definition"],
      ["Jelaskan overburden", "definition"],
      ["Apa fungsi overburden?", "function"],
      ["Untuk apa tailings?", "function"],
      ["Apa tugas Mining Engineer?", "responsibility"],
      ["Apa perbedaan tambang terbuka dan bawah tanah?", "comparison"],
      ["Bandingkan tambang terbuka dan tambang bawah tanah", "comparison"],
      ["Dimana wilayah operasi Freeport?", "factual"],
      ["Apa komoditas utama PT Freeport Indonesia?", "factual"],
      ["Apa saja data komoditas yang tersedia?", "list"],
      ["Sebutkan jenis alat berat tambang", "list"],
    ])("classifies %s as %s", (question, expected) => {
      expect(classifyQuestionShape(question as string)).toBe(expected);
    });
  });
});