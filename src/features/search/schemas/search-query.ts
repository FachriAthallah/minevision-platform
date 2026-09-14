import { z } from "zod";
export const publicSearchQuerySchema = z.object({
  q: z.string().trim().min(2, "Gunakan minimal 2 karakter.").max(100),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(40).default(20),
});
export type PublicSearchQuery = z.infer<typeof publicSearchQuerySchema>;
