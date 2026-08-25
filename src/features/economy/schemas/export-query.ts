import { z } from "zod";

const yearSchema = z.coerce
  .number()
  .int("Tahun harus berupa bilangan bulat")
  .min(1900, "Tahun minimal 1900")
  .max(2100, "Tahun maksimal 2100");

const regionCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(30)
  .transform((value) => value.toUpperCase())
  .refine((value) => /^[A-Z0-9_-]+$/.test(value), {
    message: "Wilayah harus menggunakan format kode wilayah",
  });

export const tradeDataAvailabilitySchema = z.enum([
  "reported",
  "not_reported",
  "reported_zero",
  "estimated",
]);

export const exportCoverageSchema = z.enum([
  "destination_country",
  "national_total",
]);

export const exportQuerySchema = z
  .object({
    commodity: z
      .string()
      .trim()
      .min(1)
      .max(180)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Commodity harus menggunakan format slug",
      )
      .optional(),
    origin: regionCodeSchema.optional(),
    destination: regionCodeSchema.optional(),
    availability: tradeDataAvailabilitySchema.optional(),
    coverage: exportCoverageSchema.optional(),
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

export type ExportQuery = z.infer<typeof exportQuerySchema>;
