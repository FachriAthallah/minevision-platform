import type {
  MineBotHistory,
  MineBotRequestBody,
  MineBotRequestContext,
} from "../types/orchestrator";
import type { MineBotUiMessage } from "./chat-state";

const HISTORY_LIMIT = 6;

const MODULE_PREFIXES: Array<[RegExp, NonNullable<MineBotRequestContext["module"]>]> = [
  [/^\/education\b/, "education"],
  [/^\/industry\b/, "industry"],
  [/^\/commodity\b/, "commodity"],
  [/^\/career\b/, "career"],
  [/^\/intelligence\b/, "intelligence"],
  [/^\/economy\b/, "economy"],
  [/^\/search\b/, "search"],
  [/^\/sources\b/, "sources"],
];

export function buildMineBotRequestPayload({
  question,
  messages,
  context,
}: {
  question: string;
  messages: MineBotUiMessage[];
  context?: MineBotRequestContext;
}): MineBotRequestBody {
  const history = buildMineBotHistory(messages);

  return {
    question,
    ...(history.length > 0 ? { history } : {}),
    ...(context ? { context } : {}),
  };
}

export function buildMineBotHistory(messages: MineBotUiMessage[]): MineBotHistory[] {
  return messages
    .filter((message) => {
      if (message.status !== "complete") return false;
      if (!message.content.trim()) return false;
      return message.role === "user" || message.role === "assistant";
    })
    .slice(-HISTORY_LIMIT)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
}

export function buildMineBotPageContext(pageUrl?: string): MineBotRequestContext | undefined {
  if (!pageUrl || !pageUrl.startsWith("/")) return undefined;

  const [pathname, rawQuery = ""] = pageUrl.split("?");
  const pageModule = resolveModule(pathname);
  if (!pageModule && pathname !== "/") return { pageUrl };

  const context: MineBotRequestContext = {
    ...(pageModule ? { module: pageModule } : { module: "home" }),
    pageUrl,
  };

  const segments = pathname.split("/").filter(Boolean);
  const entitySlug = segments[1];
  if (entitySlug && ["education", "industry", "commodity", "career"].includes(segments[0] ?? "")) {
    context.entitySlug = entitySlug;
    if (segments[0] === "commodity") {
      context.commodity = entitySlug;
    }
  }

  const searchParams = new URLSearchParams(rawQuery);
  const commodity = searchParams.get("commodity");
  const section = searchParams.get("section");
  const year = searchParams.get("year");

  if (commodity) context.commodity = commodity;
  if (section) context.section = section;
  if (year && /^\d{4}$/.test(year)) context.year = Number.parseInt(year, 10);

  return context;
}

function resolveModule(pathname: string): MineBotRequestContext["module"] | undefined {
  if (pathname === "/") return "home";
  return MODULE_PREFIXES.find(([pattern]) => pattern.test(pathname))?.[1];
}
