import "server-only";

import { isCommodityListQuestion, normalizeMineBotText } from "../services/conversation-context";
import type { Evidence } from "../types/orchestrator";
import {
  buildCareerEvidence,
  buildCommodityEvidence,
  buildEconomyEvidence,
  buildEducationEvidence,
  buildIndustryEvidence,
  buildPlatformEvidence,
  classifyQuestionShape,
  computeEvidenceTier,
  rankEvidence,
  mentionsKnownCatalogEntity,
} from "./domain-evidence";

const MAX_EVIDENCE = 8;

export function retrievePlatformEvidence(): Evidence[] {
  return buildPlatformEvidence();
}

export async function retrievePublicContentEvidence(
  question: string,
  options: { company?: string } = {}
): Promise<Evidence[]> {
  // Aggregate/list questions resolve from a single canonical page to keep the
  // answer (and its citations) focused, instead of dumping broad search hits.
  if (isCommodityListQuestion(question.toLocaleLowerCase("id-ID"))) {
    return buildCommodityEvidence(question);
  }

  const staticEvidence = [
    ...buildEducationEvidence(question),
    ...buildIndustryEvidence(question, options.company),
    ...buildCommodityEvidence(question),
    ...buildCareerEvidence(question),
    ...buildEconomyEvidence(question),
  ];

  // When the static catalog already yields a strong entity match, avoid
  // pulling loosely related search hits into the citation set.
  const rankedStatic = rankEvidence(question, staticEvidence);
  const primaryStaticTier =
    rankedStatic.length > 0 ? computeEvidenceTier(rankedStatic[0] as Evidence, question) : 4;

  const searchEvidence =
    primaryStaticTier <= 1 ? [] : await retrieveSearchEvidence(question);

  const combined = dedupeEvidence([
    ...staticEvidence,
    ...searchEvidence,
    ...buildPlatformEvidence(),
  ]);

  const ranked = rankEvidence(question, combined);
  const focused = applySufficiencyPolicy(question, ranked);

  return focused.slice(0, MAX_EVIDENCE);
}

/**
 * Definition/function/responsibility/comparison questions must be answered from
 * evidence that directly covers the requested concept. When the catalog knows
 * the concept but no matching evidence exists, return nothing so the
 * orchestrator produces the honest insufficient-evidence fallback instead of
 * answering from an unrelated generic page.
 */
function applySufficiencyPolicy(question: string, ranked: Evidence[]): Evidence[] {
  const normalized = normalizeMineBotText(question);
  const shape = classifyQuestionShape(question);

  const strictDefinition = /\b(apa itu|itu apa|apakah|definisi|pengertian|apa yang dimaksud|dimaksud|arti|maksudnya|artinya)\b/i.test(normalized);
  const namedEntityQuestion = shape !== "other" && shape !== "list" && mentionsKnownCatalogEntity(question);

  if (strictDefinition) {
    const hasSpecific = ranked.some((item) => computeEvidenceTier(item, question) <= 2);
    return hasSpecific ? ranked : [];
  }

  if (namedEntityQuestion) {
    const hasSpecific = ranked.some((item) => computeEvidenceTier(item, question) <= 1);
    return hasSpecific ? ranked : [];
  }

  return ranked;
}

async function retrieveSearchEvidence(question: string): Promise<Evidence[]> {
  try {
    const { searchPublicSite } = await import("@/features/search/server/search-public-site");
    const response = await searchPublicSite({ q: expandSearchQuery(question), page: 1, limit: 6 });
    return response.items.slice(0, 6).map((item) => ({
      evidenceId: `public-content-${item.key}`,
      kind: "curated_public" as const,
      module: item.module.toLocaleLowerCase("id-ID"),
      entityType: item.type,
      title: item.title,
      facts: trim(item.summary),
      sourceIds: [item.key],
      canonicalUrl: item.href,
      limitations: [],
    }));
  } catch {
    return [];
  }
}

function expandSearchQuery(question: string): string {
  const normalized = question.toLocaleLowerCase("id-ID");
  if (/(komoditas).*(apa saja|daftar|list|yang tersedia)|(apa saja|daftar).*(komoditas)/i.test(normalized)) {
    return "komoditas";
  }
  if (/lokasi|dimana|wilayah operasi/.test(normalized)) {
    return "perusahaan operasi wilayah";
  }
  if (/(mining engineer|tugas|kompetensi|software|pelatihan)/.test(normalized)) {
    return "karier profesi";
  }
  if (/overburden|reklamasi|open pit|underground|tambang terbuka|eksplorasi|istilah/.test(normalized)) {
    return "istilah pertambangan";
  }
  if (/nikel/.test(normalized)) {
    return "nikel";
  }
  if (/batubara|batu bara/.test(normalized)) {
    return "batubara";
  }
  return question;
}

function trim(value: string): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length > 500 ? `${normalized.slice(0, 497)}...` : normalized;
}

function dedupeEvidence(evidence: Evidence[]): Evidence[] {
  const seen = new Set<string>();
  return evidence.filter((item) => {
    if (seen.has(item.evidenceId)) return false;

    // Distinct glossary entries legitimately share the parent article's
    // #glosarium anchor, so a canonicalUrl alone is not a duplicate signal.
    const contentKey = `${item.title.toLocaleLowerCase("id-ID")}\u0000${item.canonicalUrl}`;
    if (seen.has(contentKey)) return false;

    seen.add(item.evidenceId);
    seen.add(contentKey);
    return true;
  });
}