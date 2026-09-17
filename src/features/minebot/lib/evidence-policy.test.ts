import { describe, expect, it } from "vitest";

import {
  isStructuredEvidenceEligible,
  isCuratedPublicEvidenceEligible,
  isNavigationEvidenceEligible,
  isEvidenceEligible,
  filterEligibleEvidence,
  hasFactualEvidence,
  shouldCallGemini,
} from "./evidence-policy";
import type { Evidence } from "../types/orchestrator";

describe("evidence-policy", () => {
  const baseStructuredEvidence: Evidence = {
    evidenceId: "e1",
    kind: "structured",
    module: "intelligence",
    entityType: "commodity_production",
    title: "Produksi Batubara 2023",
    facts: "Produksi batubara mencapai 775 juta ton",
    verificationStatus: "verified",
    publicationStatus: "published",
    sourceIds: ["src-1"],
    canonicalUrl: "/intelligence?commodity=batubara",
    limitations: [],
  };

  describe("isStructuredEvidenceEligible", () => {
    it("returns true for verified and published structured evidence", () => {
      expect(isStructuredEvidenceEligible(baseStructuredEvidence)).toBe(true);
    });

    it("returns false for pending verification", () => {
      expect(
        isStructuredEvidenceEligible({
          ...baseStructuredEvidence,
          verificationStatus: "pending",
        })
      ).toBe(false);
    });

    it("returns false for draft publication", () => {
      expect(
        isStructuredEvidenceEligible({
          ...baseStructuredEvidence,
          publicationStatus: "draft",
        })
      ).toBe(false);
    });

    it("returns false without source IDs", () => {
      expect(
        isStructuredEvidenceEligible({
          ...baseStructuredEvidence,
          sourceIds: [],
        })
      ).toBe(false);
    });
  });

  describe("isCuratedPublicEvidenceEligible", () => {
    it("returns true for curated public education", () => {
      const education: Evidence = {
        evidenceId: "e2",
        kind: "curated_public",
        module: "education",
        entityType: "article",
        title: "Tambang Terbuka",
        facts: "Penjelasan tentang tambang terbuka",
        sourceIds: [],
        canonicalUrl: "/education/tambang-terbuka",
        limitations: [],
      };

      expect(isCuratedPublicEvidenceEligible(education)).toBe(true);
    });

    it("returns false for non-whitelisted module", () => {
      const external: Evidence = {
        evidenceId: "e3",
        kind: "curated_public",
        module: "external",
        entityType: "article",
        title: "External",
        facts: "External content",
        sourceIds: [],
        canonicalUrl: "/external/article",
        limitations: [],
      };

      expect(isCuratedPublicEvidenceEligible(external)).toBe(false);
    });

    it("returns false without canonical URL", () => {
      expect(
        isCuratedPublicEvidenceEligible({
          ...baseStructuredEvidence,
          kind: "curated_public",
          canonicalUrl: "",
        })
      ).toBe(false);
    });
  });

  describe("isNavigationEvidenceEligible", () => {
    it("returns true with canonical URL", () => {
      const nav: Evidence = {
        evidenceId: "e4",
        kind: "navigation",
        module: "home",
        entityType: "link",
        title: "Intelligence",
        facts: "Link to Intelligence",
        sourceIds: [],
        canonicalUrl: "/intelligence",
        limitations: [],
      };

      expect(isNavigationEvidenceEligible(nav)).toBe(true);
    });

    it("returns false without canonical URL", () => {
      const nav: Evidence = {
        evidenceId: "e5",
        kind: "navigation",
        module: "home",
        entityType: "link",
        title: "Intelligence",
        facts: "Link to Intelligence",
        sourceIds: [],
        canonicalUrl: "",
        limitations: [],
      };

      expect(isNavigationEvidenceEligible(nav)).toBe(false);
    });
  });

  describe("isEvidenceEligible", () => {
    it("delegates to specific validators", () => {
      expect(isEvidenceEligible(baseStructuredEvidence)).toBe(true);
    });

    it("returns false for none kind", () => {
      expect(
        isEvidenceEligible({
          ...baseStructuredEvidence,
          kind: "none",
        })
      ).toBe(false);
    });
  });

  describe("filterEligibleEvidence", () => {
    it("separates eligible and ineligible evidence", () => {
      const eligible: Evidence = {
        ...baseStructuredEvidence,
      };

      const ineligible: Evidence = {
        ...baseStructuredEvidence,
        evidenceId: "e6",
        verificationStatus: "pending",
      };

      const result = filterEligibleEvidence([eligible, ineligible]);

      expect(result.eligible).toHaveLength(1);
      expect(result.ineligible).toHaveLength(1);
    });
  });

  describe("hasFactualEvidence", () => {
    it("returns true if structured evidence exists", () => {
      expect(hasFactualEvidence([baseStructuredEvidence])).toBe(true);
    });

    it("returns false for navigation only", () => {
      const nav: Evidence = {
        evidenceId: "e7",
        kind: "navigation",
        module: "home",
        entityType: "link",
        title: "Link",
        facts: "Link",
        sourceIds: [],
        canonicalUrl: "/link",
        limitations: [],
      };

      expect(hasFactualEvidence([nav])).toBe(false);
    });

    it("returns false for empty evidence", () => {
      expect(hasFactualEvidence([])).toBe(false);
    });
  });

  describe("shouldCallGemini", () => {
    it("returns true if factual evidence exists", () => {
      expect(shouldCallGemini([baseStructuredEvidence])).toBe(true);
    });

    it("returns false without factual evidence", () => {
      const nav: Evidence = {
        evidenceId: "e8",
        kind: "navigation",
        module: "home",
        entityType: "link",
        title: "Link",
        facts: "Link",
        sourceIds: [],
        canonicalUrl: "/link",
        limitations: [],
      };

      expect(shouldCallGemini([nav])).toBe(false);
    });
  });
});
