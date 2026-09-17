import type { Evidence } from "../types/orchestrator";

export function dedupeEvidence(evidence: Evidence[]): Evidence[] {
  const seen = new Set<string>();
  return evidence.filter((item) => {
    if (seen.has(item.evidenceId)) return false;
    seen.add(item.evidenceId);
    return true;
  });
}