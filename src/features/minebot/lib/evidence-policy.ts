import "server-only";

import type { Evidence } from "../types/orchestrator";

export function isStructuredEvidenceEligible(evidence: Evidence): boolean {
  if (evidence.kind !== "structured") return false;

  const hasRequiredStatus =
    evidence.verificationStatus === "verified" &&
    evidence.publicationStatus === "published";

  if (!hasRequiredStatus) return false;

  const hasSourceIds = evidence.sourceIds && evidence.sourceIds.length > 0;

  return hasSourceIds;
}

export function isCuratedPublicEvidenceEligible(evidence: Evidence): boolean {
  if (evidence.kind !== "curated_public") return false;

  const allowedModules = [
    "education",
    "industry",
    "commodity",
    "career",
    "intelligence",
    "economy",
    "resource",
    "source",
  ];

  if (!allowedModules.includes(evidence.module)) return false;

  return !!evidence.canonicalUrl;
}

export function isNavigationEvidenceEligible(evidence: Evidence): boolean {
  if (evidence.kind !== "navigation") return false;

  return !!evidence.canonicalUrl;
}

export function isEvidenceEligible(evidence: Evidence): boolean {
  switch (evidence.kind) {
    case "structured":
      return isStructuredEvidenceEligible(evidence);
    case "curated_public":
      return isCuratedPublicEvidenceEligible(evidence);
    case "navigation":
      return isNavigationEvidenceEligible(evidence);
    case "none":
      return false;
    default:
      return false;
  }
}

export function filterEligibleEvidence(
  evidence: Evidence[]
): { eligible: Evidence[]; ineligible: Evidence[] } {
  const eligible = evidence.filter(isEvidenceEligible);
  const ineligible = evidence.filter((e) => !isEvidenceEligible(e));

  return { eligible, ineligible };
}

export function hasFactualEvidence(evidence: Evidence[]): boolean {
  return evidence.some(
    (e) => e.kind === "structured" || e.kind === "curated_public"
  );
}

export function shouldCallGemini(evidence: Evidence[]): boolean {
  return hasFactualEvidence(evidence);
}
