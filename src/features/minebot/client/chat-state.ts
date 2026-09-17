import type { MineBotStreamEvent, MineBotCitation, MineBotRelatedLink } from "../types/orchestrator";

export type MineBotUiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: "complete" | "streaming" | "error" | "cancelled";
  citations?: MineBotCitation[];
  relatedLinks?: MineBotRelatedLink[];
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
};

export const PROTOCOL_ERROR_MESSAGE = "Jawaban MineBot tidak dapat diproses dengan benar.";

export function applyStreamEvent(
  message: MineBotUiMessage,
  event: MineBotStreamEvent
): MineBotUiMessage {
  switch (event.type) {
    case "delta":
      return { ...message, content: message.content + event.data.text };
    case "final":
      return {
        ...message,
        content: event.data.answer,
        status: "complete",
        citations: event.data.citations,
        relatedLinks: event.data.relatedLinks,
      };
    case "error":
      return {
        ...message,
        content: event.data.message,
        status: "error",
        error: {
          code: event.data.code,
          message: event.data.message,
          retryable: event.data.retryable ?? false,
        },
      };
    default:
      return message;
  }
}

export function ensureTerminal(message: MineBotUiMessage): MineBotUiMessage {
  if (message.status !== "streaming") return message;
  return {
    ...message,
    content: PROTOCOL_ERROR_MESSAGE,
    status: "error",
    error: {
      code: "PROTOCOL_ERROR",
      message: PROTOCOL_ERROR_MESSAGE,
      retryable: false,
    },
  };
}