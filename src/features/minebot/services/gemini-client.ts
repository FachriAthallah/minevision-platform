import "server-only";

import { GoogleGenAI } from "@google/genai";

import {
  FALLBACK_SERVICE_UNAVAILABLE,
  type MineBotAnswer,
} from "../types/minebot";

const DEFAULT_MODEL = "gemini-3.8-flash";
const REQUEST_TIMEOUT_MS = 30000;

let client: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.MINEBOT_API_KEY;
  if (!apiKey) return null;

  if (client) return client;

  client = new GoogleGenAI({ apiKey });
  return client;
}

export function isMineBotAvailable(): boolean {
  return getGeminiClient() !== null;
}

export async function generateMineBotAnswer(
  systemPrompt: string,
  userQuery: string,
  context: string
): Promise<MineBotAnswer> {
  const geminiClient = getGeminiClient();

  if (!geminiClient) {
    return {
      answer: FALLBACK_SERVICE_UNAVAILABLE,
      citations: [],
      fallback: true,
    };
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  const fullPrompt = `${systemPrompt}

---

Pertanyaan:
${userQuery}

---

${context}

---

Jawaban:`;

  try {
    const response = await Promise.race([
      geminiClient.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), REQUEST_TIMEOUT_MS)
      ),
    ]);

    const text = response.text;

    if (!text) {
      return {
        answer: FALLBACK_SERVICE_UNAVAILABLE,
        citations: [],
        fallback: true,
      };
    }

    return {
      answer: text,
      citations: [],
      fallback: false,
    };
  } catch (error) {
    console.error("MineBot Gemini error:", error instanceof Error ? error.message : "Unknown error");

    return {
      answer: FALLBACK_SERVICE_UNAVAILABLE,
      citations: [],
      fallback: true,
    };
  }
}
