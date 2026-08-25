import { z } from "zod";

const yearSchema = z.coerce
  .number()
  .int("Tahun harus berupa bilangan bulat")
  .min(1900, "Tahun minimal 1900")
  .max(2100, "Tahun maksimal 2100");

export const investmentOriginSchema = z.enum(["pma", "pmdn"]);

export const investmentQuerySchema = z
  .object({
    region: z
      .string()
      .trim()
      .min(1)
      .max(30)
      .transform((value) => value.toUpperCase())
      .refine((value) => /^[A-Z0-9_-]+$/.test(value), {
        message: "Region harus menggunakan format kode wilayah",
      })
      .optional(),
    origin: investmentOriginSchema.optional(),
    fromYear: yearSchema.optional(),
    toYear: yearSchema.optional(),
  })
  .refine(
    (query) =>
      query.fromYear === undefined ||
      query.toYear === undefined ||
      query.fromYear <= query.toYear,
    {
      message: "fromYear tidak boleh lebih besar dari toYear",
      path: ["fromYear"],
    },
  );

export type InvestmentQuery = z.infer<typeof investmentQuerySchema>;
