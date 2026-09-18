import type { MineBotCitation } from "../types/orchestrator";

/**
 * Block unsafe or off-site hrefs. Only allow relative MineVision paths and
 * explicit http(s) destinations; never javascript:, data:, or protocol-relative.
 */
export function sanitizeHref(href: string): string | null {
  if (href.startsWith("javascript:") || href.startsWith("data:") || href.startsWith("//")) {
    return null;
  }
  if (/^https?:\/\//i.test(href)) return href;
  if (!href.startsWith("/")) return null;
  return href;
}

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

export type CitationMarker =
  | { type: "text"; value: string }
  | { type: "citation"; index: number; citation: MineBotCitation | null };

/**
 * Split streamed answer content on backend citation markers ([S1], [S2], ...)
 * and resolve each marker against the citation DTOs supplied by the backend.
 * Unresolved markers still render as a numbered chip so the reference stays
 * readable without exposing technical metadata.
 */
export function parseCitationMarkers(
  content: string,
  citations: MineBotCitation[]
): CitationMarker[] {
  const byId = new Map<string, MineBotCitation>();
  for (const citation of citations) byId.set(citation.id, citation);

  return content
    .split(/(\[S\d+\])/g)
    .filter((part) => part.length > 0)
    .map((part): CitationMarker => {
      const match = /^\[S(\d+)\]$/.exec(part);
      if (!match) return { type: "text", value: part };
      const index = Number(match[1]);
      return { type: "citation", index, citation: byId.get(`S${index}`) ?? null };
    });
}

export function citationCount(content: string): number {
  const matches = content.match(/\[S\d+\]/g);
  return matches ? matches.length : 0;
}