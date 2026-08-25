import { z } from "zod";

const yearSchema = z.coerce
  .number()
  .int("Tahun harus berupa bilangan bulat")
  .min(1900, "Tahun minimal 1900")
  .max(2100, "Tahun maksimal 2100");

const regionCodeSchema = z
  .string()
  .trim()
  .min(1, "Kode wilayah tidak boleh kosong")
  .max(30, "Kode wilayah maksimal 30 karakter")
  .regex(
    /^[a-zA-Z0-9]+(?:[-_][a-zA-Z0-9]+)*$/,
    "Kode wilayah memiliki format yang tidak valid",
  )
  .transform((value) => value.toUpperCase());

export const gdpQuerySchema = z
  .object({
    region: regionCodeSchema.optional(),

    priceBasis: z.enum(["current_prices", "constant_prices"]).optional(),

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

export type GdpQuery = z.infer<typeof gdpQuerySchema>;
