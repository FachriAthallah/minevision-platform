import "server-only";

import type { CitationRegistryEntry, MineBotCitation } from "../types/orchestrator";

export class CitationRegistry {
  private entries: Map<string, CitationRegistryEntry> = new Map();
  private idCounter: number = 1;

  addEntry(entry: Omit<CitationRegistryEntry, "id">): string {
    const id = `S${this.idCounter}`;
    this.idCounter++;

    this.entries.set(id, {
      id,
      ...entry,
    });

    return id;
  }

  getEntry(id: string): CitationRegistryEntry | undefined {
    return this.entries.get(id);
  }

  getAllEntries(): CitationRegistryEntry[] {
    return Array.from(this.entries.values());
  }

  getCitationDTO(id: string): MineBotCitation | null {
    const entry = this.getEntry(id);
    if (!entry) return null;

    return {
      id: entry.id,
      label: entry.label,
      organization: entry.organization,
      url: entry.url,
      pageReference: entry.pageReference,
    };
  }

  getAllCitationDTOs(): MineBotCitation[] {
    return Array.from(this.entries.values()).map((entry) => ({
      id: entry.id,
      label: entry.label,
      organization: entry.organization,
      url: entry.url,
      pageReference: entry.pageReference,
    }));
  }

  validateCitationIds(ids: string[]): { valid: string[]; invalid: string[] } {
    const valid: string[] = [];
    const invalid: string[] = [];

    for (const id of ids) {
      if (this.entries.has(id)) {
        valid.push(id);
      } else {
        invalid.push(id);
      }
    }

    return { valid, invalid };
  }

  extractCitationIds(text: string): string[] {
    const regex = /\[S(\d+)\]/g;
    const ids: string[] = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      const id = `S${match[1]}`;
      if (!ids.includes(id)) {
        ids.push(id);
      }
    }

    return ids;
  }

  deduplicateCitations(citations: MineBotCitation[]): MineBotCitation[] {
    const seen = new Set<string>();
    return citations.filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }
}
