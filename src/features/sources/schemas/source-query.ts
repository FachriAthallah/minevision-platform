import { z } from "zod";

export const publicSourceModules = ["education", "industry", "commodity", "career", "intelligence", "economy"] as const;
export const publicSourceTypes = ["government", "statistics_agency", "company_report", "academic", "regulation", "market_data", "other"] as const;

export const sourceQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  publisher: z.string().trim().max(100).optional(),
  type: z.enum(publicSourceTypes).optional(),
  module: z.enum(publicSourceModules).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(18),
});
export type SourceQuery = z.infer<typeof sourceQuerySchema>;
