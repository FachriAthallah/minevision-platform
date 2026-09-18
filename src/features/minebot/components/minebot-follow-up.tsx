import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MineBotUiMessage } from "../client/chat-state";
import { suggestedQuestions } from "../config/suggested-questions";

type MineBotFollowUpProps = {
  message: MineBotUiMessage;
  lastUserMessage: string;
  onSuggested: (question: string) => void;
};

function questionsForModule(module: string | undefined): string[] {
  const list = module ? suggestedQuestions[module as keyof typeof suggestedQuestions] : undefined;
  return list ?? suggestedQuestions.default;
}

/**
 * Compact contextual continuation questions. Derived from the message's module
 * (via its related links) so they feel like a conversation, not an ad.
 */
export function MineBotFollowUp({ message, lastUserMessage, onSuggested }: MineBotFollowUpProps) {
  const moduleKey = message.relatedLinks?.[0]?.module;
  const pool = questionsForModule(moduleKey);
  const lastUser = lastUserMessage.trim().toLocaleLowerCase("id-ID");

  const suggestions = pool
    .filter((q) => !lastUser || q.trim().toLocaleLowerCase("id-ID") !== lastUser)
    .slice(0, 2);

  if (suggestions.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Lanjutkan percakapan
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {suggestions.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => onSuggested(question)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-surface-elevated/50 px-3 py-1.5",
              "text-[12px] font-medium text-foreground/85 transition hover:border-brand-cyan/40 hover:bg-surface-secondary/80",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-cyan"
            )}
          >
            {question}
            <ArrowRight className="h-3 w-3 text-brand-cyan" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}