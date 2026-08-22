import { z } from "zod";

const yearSchema = z.coerce
  .number()
  .int("Tahun harus berupa bilangan bulat")
  .min(1900, "Tahun minimal 1900")
  .max(2100, "Tahun maksimal 2100");

export const productionQuerySchema = z
  .object({
    commodity: z
      .string()
      .trim()
      .min(1, "Parameter commodity wajib diisi")
      .max(180)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Commodity harus menggunakan format slug",
      ),

    fromYear: yearSchema.optional(),

    toYear: yearSchema.optional(),
  })
  .refine(
    (query) =>
      query.fromYear === undefined ||
      query.toYear === undefined ||
      query.fromYear <= query.toYear,
    {
      message:
        "fromYear tidak boleh lebih besar dari toYear",
      path: ["fromYear"],
    },
  );

export type ProductionQuery = z.infer<
  typeof productionQuerySchema
>;