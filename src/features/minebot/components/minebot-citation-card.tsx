import { ExternalLink, FileText } from "lucide-react";

import type { MineBotCitation } from "../types/orchestrator";
import { sanitizeHref } from "../client/chat-citations";
import { MineBotLink } from "./minebot-link";

function moduleLabelFromUrl(url: string): string {
  const segment = url.split("/").find(Boolean);
  if (!segment) return "MineVision";
  const label = segment.charAt(0).toUpperCase() + segment.slice(1);
  return label;
}

type MineBotCitationCardProps = {
  citation: MineBotCitation;
};

/**
 * Elegant source reference card. Renders one clean source per citation the
 * backend actually used — never raw IDs, URLs, or retrieval metadata.
 */
export function MineBotCitationCard({ citation }: MineBotCitationCardProps) {
  const href = sanitizeHref(citation.url);
  const context = citation.organization ?? moduleLabelFromUrl(citation.url);

  const inner = (
    <>
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-cyan/15 text-brand-cyan">
        <FileText className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Sumber
        </span>
        <span className="block truncate text-[13px] font-semibold leading-snug text-foreground">
          {citation.label}
        </span>
        <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
          {context}
        </span>
      </span>
      <span className="mt-1 shrink-0 text-muted-foreground transition group-hover:text-brand-cyan">
        <span aria-hidden="true">→</span>
      </span>
    </>
  );

  const className =
    "group flex w-full items-start gap-3 rounded-2xl border border-white/[0.07] bg-surface-elevated/50 px-3 py-2.5 transition hover:border-brand-cyan/40 hover:bg-surface-secondary/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan";

  if (!href) {
    return (
      <span className={className}>
        {inner}
        <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      </span>
    );
  }

  return (
    <MineBotLink
      href={href}
      aria-label={`Buka sumber: ${citation.label}`}
      className={className}
    >
      {inner}
    </MineBotLink>
  );
}