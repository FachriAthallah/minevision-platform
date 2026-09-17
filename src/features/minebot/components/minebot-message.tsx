import { RotateCcw } from "lucide-react";
import { memo } from "react";

import { cn } from "@/lib/utils";
import type { MineBotUiMessage } from "../client/chat-state";
import { parseCitationMarkers, sanitizeHref } from "../client/chat-citations";
import { MineBotBrandMark } from "./minebot-brand";
import { MineBotCitationCard } from "./minebot-citation-card";
import { MineBotFollowUp } from "./minebot-follow-up";
import { MineBotLink } from "./minebot-link";
import { MineBotWritingIndicator } from "./minebot-writing-indicator";

type MineBotMessageProps = {
  message: MineBotUiMessage;
  isLastAssistant: boolean;
  lastUserMessage: string;
  onSuggested: (question: string) => void;
  onRetry: () => void;
};

function CitationChip({
  index,
  citation,
}: {
  index: number;
  citation: { url: string; label: string } | null;
}) {
  const href = citation ? sanitizeHref(citation.url) : null;
  const title = citation?.label;

  const className = cn(
    "align-super inline-flex h-[15px] min-w-[15px] items-center justify-center rounded-[6px] px-[3px]",
    "text-[9px] font-bold leading-none text-brand-cyan",
    href ? "bg-brand-cyan/15 hover:bg-brand-cyan/25" : "bg-brand-cyan/10",
    "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-cyan"
  );

  if (!href) {
    return (
      <sup title={title} aria-label={title ? `Referensi ${title}` : undefined}>
        <span className={className}>{index}</span>
      </sup>
    );
  }

  return (
    <sup>
      <MineBotLink
        href={href}
        className={className}
        aria-label={`Buka referensi ${index}: ${title ?? "sumber"}`}
      >
        {index}
      </MineBotLink>
    </sup>
  );
}

function AssistantContent({ message }: { message: MineBotUiMessage }) {
  if (message.status === "streaming") {
    if (!message.content) {
      return <MineBotWritingIndicator />;
    }
  }

  const markers = parseCitationMarkers(message.content, message.citations ?? []);

  return (
    <div
      data-answer-id={message.id}
      className="whitespace-pre-wrap break-words text-[14px] leading-relaxed text-foreground/90"
    >
      {markers.map((marker, index) =>
        marker.type === "text" ? (
          <span key={index}>{marker.value}</span>
        ) : (
          <CitationChip
            key={index}
            index={marker.index}
            citation={
              marker.citation
                ? { url: marker.citation.url, label: marker.citation.label }
                : null
            }
          />
        )
      )}
    </div>
  );
}

function RelaxedLink({ href, label }: { href: string; label: string }) {
  const safe = sanitizeHref(href);
  if (!safe) return null;
  return (
    <MineBotLink
      href={safe}
      className="inline-flex max-w-full items-center gap-1 rounded-full border border-white/[0.08] bg-surface-elevated/50 px-3 py-1.5 text-[12px] font-medium text-foreground/85 transition hover:border-brand-cyan/40 hover:bg-surface-secondary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan"
    >
      <span className="truncate">{label}</span>
      <span aria-hidden="true" className="text-brand-cyan">→</span>
    </MineBotLink>
  );
}

function AssistantMessage({
  message,
  isLastAssistant,
  lastUserMessage,
  onSuggested,
  onRetry,
}: MineBotMessageProps) {
  const isError = message.status === "error";

  return (
    <div className="flex flex-col items-start">
      <div className="mb-1.5 inline-flex items-center gap-1.5">
        <MineBotBrandMark className="h-4.5 w-4.5" iconClassName="h-2.5 w-2.5" />
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-cyan/90">
          MineBot
        </span>
      </div>

      <div
        className={cn(
          "max-w-[88%] rounded-[18px] rounded-bl-[6px] px-4 py-3",
          isError ? "border border-danger/25 bg-danger/[0.06]" : "border border-white/[0.06] bg-surface/70"
        )}
      >
        <AssistantContent message={message} />

        {isError && message.error?.retryable && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-1.5 text-[12px] font-semibold text-brand-cyan transition hover:bg-brand-cyan/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            Coba lagi
          </button>
        )}

        {message.citations && message.citations.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {message.citations.map((citation) => (
              <MineBotCitationCard key={citation.id} citation={citation} />
            ))}
          </div>
        )}

        {message.relatedLinks && message.relatedLinks.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Jelajahi
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {message.relatedLinks.slice(0, 3).map((link) => (
                <RelaxedLink key={`${link.href}`} href={link.href} label={link.label} />
              ))}
            </div>
          </div>
        )}
      </div>

      {isLastAssistant && message.status === "complete" && !isError && (
        <MineBotFollowUp
          message={message}
          lastUserMessage={lastUserMessage}
          onSuggested={onSuggested}
        />
      )}
    </div>
  );
}

function UserMessage({ message }: { message: MineBotUiMessage }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] break-words whitespace-pre-wrap rounded-[18px] rounded-br-[6px] bg-primary/15 px-4 py-2.5 text-[14px] font-medium leading-relaxed text-foreground ring-1 ring-primary/25">
        {message.content}
      </div>
    </div>
  );
}

export const MineBotMessage = memo(function MineBotMessage(props: MineBotMessageProps) {
  const { message } = props;
  if (message.role === "user") {
    return <UserMessage message={message} />;
  }
  return <AssistantMessage {...props} />;
});