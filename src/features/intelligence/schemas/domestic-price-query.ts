import { z } from "zod";

const commoditySlugSchema = z
  .string()
  .trim()
  .min(1, "Parameter commodity tidak boleh kosong")
  .max(180)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Commodity harus menggunakan format slug",
  );

const standardCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .regex(/^[A-Za-z0-9_]+$/, "Standard harus menggunakan kode yang valid")
  .transform((value) => value.toUpperCase());

const dateSchema = z.iso.date({
  message: "Tanggal harus menggunakan format YYYY-MM-DD",
});

export const domesticPriceQuerySchema = z
  .object({
    // Opsional:
    // tanpa commodity mengambil semua komoditas;
    // dengan commodity mengambil satu komoditas.
    commodity: commoditySlugSchema.optional(),

    standard: standardCodeSchema.optional(),

    fromDate: dateSchema.optional(),

    toDate: dateSchema.optional(),

    period: z
      .enum(["daily", "weekly", "monthly", "quarterly", "annual", "custom"])
      .optional(),
  })
  .refine(
    (query) =>
      query.fromDate === undefined ||
      query.toDate === undefined ||
      query.fromDate <= query.toDate,
    {
      message: "fromDate tidak boleh lebih besar dari toDate",
      path: ["fromDate"],
    },
  );

export type DomesticPriceQuery = z.infer<typeof domesticPriceQuerySchema>;
