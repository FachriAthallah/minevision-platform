import type { NextRequest } from "next/server";

import { minebotQuerySchema } from "@/features/minebot/schemas/minebot-query";
import { createOrchestrator } from "@/features/minebot/services/orchestrator";
import type { MineBotStreamEvent } from "@/features/minebot/types/orchestrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_HISTORY_LENGTH = 6;
const REQUEST_TIMEOUT_MS = 25000;

function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function validateContext(context: unknown): boolean {
  if (!context || typeof context !== "object") return true;
  const ctx = context as Record<string, unknown>;

  const allowedModules = [
    "home",
    "education",
    "industry",
    "commodity",
    "career",
    "intelligence",
    "economy",
    "search",
    "sources",
  ];

  if (ctx.module && !allowedModules.includes(ctx.module as string)) {
    return false;
  }

  if (ctx.pageUrl && typeof ctx.pageUrl === "string" && !ctx.pageUrl.startsWith("/")) {
    return false;
  }

  if (ctx.year && typeof ctx.year === "number" && (ctx.year < 1900 || ctx.year > 2100)) {
    return false;
  }

  return true;
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    if (request.headers.get("content-type") !== "application/json") {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "Content-Type harus application/json",
          },
          meta: { requestId, timestamp: new Date().toISOString() },
        }),
        {
          status: 415,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INVALID_REQUEST",
            message: "JSON tidak valid",
          },
          meta: { requestId, timestamp: new Date().toISOString() },
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const validationResult = minebotQuerySchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Parameter tidak valid",
          },
          meta: { requestId, timestamp: new Date().toISOString() },
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const { question, conversationId, history, context } = validationResult.data;

    if (history && history.length > MAX_HISTORY_LENGTH) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "HISTORY_LIMIT_EXCEEDED",
            message: `History maksimal ${MAX_HISTORY_LENGTH} pesan`,
          },
          meta: { requestId, timestamp: new Date().toISOString() },
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    if (!validateContext(context)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "UNSUPPORTED_CONTEXT",
            message: "Context tidak didukung",
          },
          meta: { requestId, timestamp: new Date().toISOString() },
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          const orchestrator = createOrchestrator();

          for await (const event of orchestrator.orchestrate({
            question,
            conversationId,
            history,
            context,
          }, [])) {
            const eventData = JSON.stringify(event) + "\n";
            controller.enqueue(encoder.encode(eventData));
          }

          controller.close();
        } catch (error) {
          console.error("Orchestration error:", error instanceof Error ? error.message : "Unknown error");

          const errorEvent: MineBotStreamEvent = {
            type: "error",
            data: {
              code: "INTERNAL_ERROR",
              message: "Terjadi kesalahan saat memproses pertanyaan",
            },
          };

          const eventData = JSON.stringify(errorEvent) + "\n";
          controller.enqueue(encoder.encode(eventData));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-store",
        "X-Request-ID": requestId,
      },
    });
  } finally {
    clearTimeout(timeoutHandle);
  }
}
