import "server-only";

import type { IntentRouterResult, MineBotHistory, MineBotRequestContext } from "../types/orchestrator";
import { extractCommodity, extractYears, resolveConversationContext } from "./conversation-context";

export class IntentRouter {
  resolveCommodity(text: string): string | null {
    return extractCommodity(text) ?? null;
  }

  extractYear(text: string): number | null {
    return extractYears(text)[0] ?? null;
  }

  route(
    question: string,
    context?: MineBotRequestContext,
    history?: MineBotHistory[]
  ): IntentRouterResult {
    const resolved = resolveConversationContext({
      question,
      history,
      pageContext: context,
    });

    return {
      intent: resolved.intent,
      commodity: resolved.commodity,
      year: resolved.years?.[resolved.years.length - 1],
      years: resolved.years,
      topic: resolved.topic,
      section: context?.section,
      entity: resolved.company ? { type: "company", slug: resolved.company } : undefined,
      confidence: resolved.intent === "ambiguous" ? 0.5 : 0.9,
    };
  }
}

export function createIntentRouter(): IntentRouter {
  return new IntentRouter();
}
