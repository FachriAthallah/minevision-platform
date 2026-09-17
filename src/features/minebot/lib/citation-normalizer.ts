import type { MineBotCitation, MineBotContext } from "../types/minebot";

const SOURCE_MARKER_REGEX = /\[source-(\d+)\]/g;

export function extractSourceMarkers(text: string): string[] {
  const markers: string[] = [];
  const regex = new RegExp(SOURCE_MARKER_REGEX);

  let match;
  while ((match = regex.exec(text)) !== null) {
    const marker = `source-${match[1]}`;
    if (!markers.includes(marker)) {
      markers.push(marker);
    }
  }

  return markers;
}

export function normalizeCitations(
  answer: string,
  sourceMap: Map<string, MineBotContext>
): { cleanedAnswer: string; citations: MineBotCitation[] } {
  const usedMarkers = extractSourceMarkers(answer);
  const validCitations: MineBotCitation[] = [];
  const validMarkers = new Set<string>();

  for (const marker of usedMarkers) {
    const context = sourceMap.get(marker);

    if (context) {
      validMarkers.add(marker);
      validCitations.push({
        id: marker,
        title: context.source.title,
        sourceName: context.source.sourceName,
        sourceUrl: context.source.sourceUrl,
      });
    }
  }

  const cleanedAnswer = answer.replace(SOURCE_MARKER_REGEX, (match) => {
    const marker = `source-${match.replace(/[^\d]/g, "")}`;
    return validMarkers.has(marker) ? match : "";
  });

  const uniqueCitations = validCitations.filter(
    (citation, index, self) =>
      index === self.findIndex((c) => c.id === citation.id)
  );

  return {
    cleanedAnswer: cleanedAnswer.trim(),
    citations: uniqueCitations,
  };
}

export function hasValidCitations(citations: MineBotCitation[]): boolean {
  return citations.length > 0;
}
