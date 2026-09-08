import { z } from "zod";

export const careerListQuerySchema = z.object({
  q: z.string().trim().max(100, "Pencarian maksimal 100 karakter").optional(),
}).strict();
export const careerSlugSchema = z.string().trim().min(1).max(180)
  .transform((value) => value.toLowerCase())
  .pipe(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug kategori karier tidak valid"));
export type CareerListQuery = z.infer<typeof careerListQuerySchema>;
