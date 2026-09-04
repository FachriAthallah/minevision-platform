import { z } from "zod";

export const commodityCategorySchema = z.enum([
  "metal_mineral",
  "non_metal_mineral",
  "energy",
]);

const booleanQuerySchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

export const commodityListQuerySchema = z
  .object({
    search: z
      .string()
      .trim()
      .min(1, "Pencarian tidak boleh kosong")
      .max(100, "Pencarian maksimal 100 karakter")
      .optional(),

    category: commodityCategorySchema.optional(),

    intelligenceTracked: booleanQuerySchema.optional(),
  })
  .strict();

export const commoditySlugSchema = z
  .string()
  .trim()
  .min(1, "Slug komoditas tidak boleh kosong")
  .max(180, "Slug komoditas maksimal 180 karakter")
  .transform((value) => value.toLowerCase())
  .pipe(
    z
      .string()
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug komoditas memiliki format yang tidak valid",
      ),
  );

export type CommodityListQuery = z.infer<typeof commodityListQuerySchema>;

export type CommoditySlug = z.infer<typeof commoditySlugSchema>;
