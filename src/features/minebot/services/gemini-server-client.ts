import "server-only";

import { GoogleGenAI } from "@google/genai";

export interface GeminiStreamEvent {
  type: "delta" | "complete" | "error";
  text?: string;
  error?: {
    code: string;
    message: string;
  };
}

export class GeminiServerClient {
  private model: string;

  constructor() {
    this.model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  }

  isAvailable(): boolean {
    return !!process.env.GEMINI_API_KEY;
  }

  async *generateStream(
    systemPrompt: string,
    userMessage: string
  ): AsyncGenerator<GeminiStreamEvent, void, unknown> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      yield {
        type: "error",
        error: {
          code: "AI_SERVICE_UNAVAILABLE",
          message: "Gemini API key tidak dikonfigurasi",
        },
      };
      return;
    }

    const client = new GoogleGenAI({ apiKey });

    const fullPrompt = `${systemPrompt}

---

PERTANYAAN PENGGUNA:
${userMessage}

---

JAWABAN:`;

    try {
      let timedOut = false;
      const timeoutId = setTimeout(() => {
        timedOut = true;
      }, 20000);

      try {
        const response = await client.models.generateContentStream({
          model: this.model,
          contents: fullPrompt,
        });

        for await (const chunk of response) {
          if (timedOut) break;

          if (chunk.candidates?.[0]?.content?.parts?.[0]?.text) {
            yield {
              type: "delta",
              text: chunk.candidates[0].content.parts[0].text,
            };
          }
        }

        if (timedOut) {
          yield {
            type: "error",
            error: { code: "AI_TIMEOUT", message: "Permintaan melampaui batas waktu" },
          };
        } else {
          yield { type: "complete" };
        }
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      const code = this.mapErrorCode(error);
      const message = this.mapErrorMessage(error);

      yield {
        type: "error",
        error: { code, message },
      };
    }
  }

  private mapErrorCode(error: unknown): string {
    if (error instanceof Error) {
      if (error.message.includes("429")) return "RATE_LIMITED";
      if (error.message.includes("timeout") || error.message.includes("aborted"))
        return "AI_TIMEOUT";
      if (error.message.includes("5")) return "AI_SERVICE_UNAVAILABLE";
      if (error.message.includes("401") || error.message.includes("403"))
        return "AI_SERVICE_UNAVAILABLE";
    }

    return "INTERNAL_ERROR";
  }

  private mapErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      if (error.message.includes("429")) {
        return "MineBot sedang mencapai batas penggunaan sementara";
      }
      if (error.message.includes("timeout")) {
        return "Permintaan melampaui batas waktu";
      }
      if (error.message.includes("5")) {
        return "Layanan AI tidak tersedia";
      }
    }

    return "Terjadi kesalahan saat memproses pertanyaan";
  }
}

export function createGeminiClient(): GeminiServerClient {
  return new GeminiServerClient();
}
