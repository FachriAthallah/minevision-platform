import { z } from "zod";

const reportYearSchema = z.coerce
  .number()
  .int("Tahun laporan harus berupa bilangan bulat")
  .min(2023, "Tahun laporan minimal 2023")
  .max(2025, "Tahun laporan maksimal 2025");

export const industryCompanyQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .min(1, "Pencarian tidak boleh kosong")
    .max(100, "Pencarian maksimal 100 karakter")
    .optional(),

  reportYear: reportYearSchema.optional(),

  reportType: z
    .enum(["annual_report", "sustainability_report"])
    .optional(),
});

export const industryCompanySlugSchema = z
  .string()
  .trim()
  .min(1, "Slug perusahaan tidak boleh kosong")
  .max(180, "Slug perusahaan maksimal 180 karakter")
  .transform((value) => value.toLowerCase())
  .pipe(
    z
      .string()
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug perusahaan memiliki format yang tidak valid",
      ),
  );

export const industryReportIdSchema = z
  .string()
  .uuid("ID laporan memiliki format yang tidak valid");

export const industryOperationSiteQuerySchema = z.object({
  companySlug: industryCompanySlugSchema.optional(),
});

export type IndustryCompanyQuery = z.infer<
  typeof industryCompanyQuerySchema
>;

export type IndustryOperationSiteQuery = z.infer<
  typeof industryOperationSiteQuerySchema
>;
