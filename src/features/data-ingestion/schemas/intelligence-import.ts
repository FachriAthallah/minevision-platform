import { z } from "zod";

/*
|--------------------------------------------------------------------------
| Shared schemas
|--------------------------------------------------------------------------
*/

const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug wajib diisi")
  .max(120, "Slug maksimal 120 karakter")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug hanya boleh menggunakan huruf kecil, angka, dan tanda hubung",
  );

const codeSchema = z
  .string()
  .trim()
  .min(1, "Kode wajib diisi")
  .max(100, "Kode maksimal 100 karakter");

const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus menggunakan format YYYY-MM-DD");

export const intelligenceRecordTypeSchema = z.enum([
  "actual",
  "provisional",
  "projection",
  "revised",
]);

export const intelligenceVerificationStatusSchema = z.enum([
  "pending",
  "verified",
  "rejected",
]);

export const intelligencePricePeriodSchema = z.enum([
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "annual",
  "custom",
]);

/*
|--------------------------------------------------------------------------
| Source reference
|--------------------------------------------------------------------------
*/

export const intelligenceSourceReferenceSchema = z
  .object({
    sourceSlug: slugSchema,

    citationLabel: z
      .string()
      .trim()
      .min(1, "Label sitasi wajib diisi")
      .max(255, "Label sitasi maksimal 255 karakter"),

    pageReference: z
      .string()
      .trim()
      .max(100, "Referensi halaman maksimal 100 karakter")
      .nullable()
      .optional(),

    sourceUrl: z
      .string()
      .trim()
      .url("Source URL harus berupa URL yang valid")
      .nullable()
      .optional(),
  })
  .strict();

/*
|--------------------------------------------------------------------------
| Production record
|--------------------------------------------------------------------------
*/

export const intelligenceProductionRecordSchema = z
  .object({
    commoditySlug: slugSchema,

    year: z
      .number()
      .int("Tahun harus berupa bilangan bulat")
      .min(1900, "Tahun minimal adalah 1900")
      .max(2100, "Tahun maksimal adalah 2100"),

    value: z
      .number()
      .finite("Nilai produksi harus berupa angka valid")
      .nonnegative("Nilai produksi tidak boleh negatif"),

    unitCode: codeSchema,

    recordType: intelligenceRecordTypeSchema,

    verificationStatus: intelligenceVerificationStatusSchema.default("pending"),

    notes: z
      .string()
      .trim()
      .max(1000, "Catatan maksimal 1.000 karakter")
      .nullable()
      .optional(),

    sources: z
      .array(intelligenceSourceReferenceSchema)
      .min(1, "Setiap data produksi harus memiliki sumber"),
  })
  .strict();

/*
|--------------------------------------------------------------------------
| Domestic price record
|--------------------------------------------------------------------------
*/

export const intelligencePriceRecordSchema = z
  .object({
    commoditySlug: slugSchema,

    priceStandardCode: codeSchema,

    period: intelligencePricePeriodSchema,

    periodStart: isoDateSchema,

    periodEnd: isoDateSchema,

    value: z
      .number()
      .finite("Nilai harga harus berupa angka valid")
      .nonnegative("Nilai harga tidak boleh negatif"),

    currencyCode: z
      .string()
      .trim()
      .length(3, "Kode mata uang harus terdiri dari tiga karakter")
      .transform((value) => value.toUpperCase()),

    unitCode: codeSchema,

    recordType: intelligenceRecordTypeSchema,

    verificationStatus: intelligenceVerificationStatusSchema.default("pending"),

    notes: z
      .string()
      .trim()
      .max(1000, "Catatan maksimal 1.000 karakter")
      .nullable()
      .optional(),

    sources: z
      .array(intelligenceSourceReferenceSchema)
      .min(1, "Setiap data harga harus memiliki sumber"),
  })
  .strict()
  .refine((record) => record.periodEnd >= record.periodStart, {
    message: "Tanggal akhir periode tidak boleh lebih kecil dari tanggal awal",
    path: ["periodEnd"],
  });

/*
|--------------------------------------------------------------------------
| Intelligence import bundle
|--------------------------------------------------------------------------
*/

export const intelligenceImportBundleSchema = z
  .object({
    schemaVersion: z.literal("1.0"),

    datasetName: z
      .string()
      .trim()
      .min(1, "Nama dataset wajib diisi")
      .max(255, "Nama dataset maksimal 255 karakter"),

    description: z
      .string()
      .trim()
      .max(1000, "Deskripsi maksimal 1.000 karakter")
      .nullable()
      .optional(),

    productionRecords: z.array(intelligenceProductionRecordSchema).default([]),

    priceRecords: z.array(intelligencePriceRecordSchema).default([]),
  })
  .strict()
  .refine(
    (bundle) =>
      bundle.productionRecords.length > 0 || bundle.priceRecords.length > 0,
    {
      message: "Dataset harus memiliki minimal satu data produksi atau harga",
      path: ["productionRecords"],
    },
  );

/*
|--------------------------------------------------------------------------
| TypeScript types
|--------------------------------------------------------------------------
*/

export type IntelligenceSourceReference = z.infer<
  typeof intelligenceSourceReferenceSchema
>;

export type IntelligenceProductionRecord = z.infer<
  typeof intelligenceProductionRecordSchema
>;

export type IntelligencePriceRecord = z.infer<
  typeof intelligencePriceRecordSchema
>;

export type IntelligenceImportBundle = z.infer<
  typeof intelligenceImportBundleSchema
>;
