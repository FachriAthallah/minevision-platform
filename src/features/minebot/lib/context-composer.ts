import { FALLBACK_INSUFFICIENT_CONTEXT, type MineBotContext } from "../types/minebot";

export function composeContext(contexts: MineBotContext[]): {
  contextText: string;
  sourceMap: Map<string, MineBotContext>;
} {
  if (contexts.length === 0) {
    return {
      contextText: "",
      sourceMap: new Map(),
    };
  }

  const sourceMap = new Map<string, MineBotContext>();
  const contextParts: string[] = [];

  for (const ctx of contexts) {
    sourceMap.set(ctx.sourceId, ctx);

    contextParts.push(
      `[${ctx.sourceId}]\n${ctx.content}\n`
    );
  }

  return {
    contextText: `KONTEKS MINEVISION:\n\n${contextParts.join("\n")}`,
    sourceMap,
  };
}

export function hasSufficientContext(contexts: MineBotContext[]): boolean {
  return contexts.length > 0;
}

export function buildFullPrompt(
  systemPrompt: string,
  userQuery: string,
  contexts: MineBotContext[]
): { prompt: string; sourceMap: Map<string, MineBotContext> } | null {
  if (!hasSufficientContext(contexts)) {
    return null;
  }

  const { contextText, sourceMap } = composeContext(contexts);

  const prompt = `${systemPrompt}

---

PERTANYAAN PENGGUNA:
${userQuery}

---

${contextText}

---

PETUNJUK JAWABAN:
1. Jawab hanya berdasarkan konteks MineVision yang diberikan di atas.
2. Jika informasi tidak cukup untuk menjawab, nyatakan dengan jelas.
3. Gunakan marker [source-N] untuk mengutip sumber yang relevan.
4. Jangan mengubah angka, tahun, atau satuan dari konteks.
5. Gunakan Bahasa Indonesia.`;

  return { prompt, sourceMap };
}

export function createFallbackResponse() {
  return {
    answer: FALLBACK_INSUFFICIENT_CONTEXT,
    citations: [],
    fallback: true,
  };
}
