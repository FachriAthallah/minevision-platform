import { z } from "zod";

const contextSchema = z
  .object({
    module: z
      .enum([
        "home",
        "education",
        "industry",
        "commodity",
        "career",
        "intelligence",
        "economy",
        "search",
        "sources",
      ])
      .optional(),
    pageUrl: z
      .string()
      .refine((url) => url.startsWith("/"), "pageUrl harus relative URL")
      .optional(),
    entitySlug: z.string().optional(),
    commodity: z.string().optional(),
    section: z.string().optional(),
    year: z.number().int().min(1900).max(2100).optional(),
  })
  .strict()
  .optional();

const historySchema = z
  .array(
    z
      .object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      })
      .strict()
  )
  .max(6, "History maksimal 6 pesan");

export const minebotQuerySchema = z
  .object({
    question: z
      .string()
      .trim()
      .min(2, "Question minimal 2 karakter")
      .max(500, "Question maksimal 500 karakter"),
    conversationId: z.string().uuid().optional(),
    history: historySchema.optional(),
    context: contextSchema,
  })
  .strict();

export type MineBotQueryInput = z.infer<typeof minebotQuerySchema>;
