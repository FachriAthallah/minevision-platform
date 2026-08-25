import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(180)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Filter harus menggunakan format slug",
  );

export const smelterFacilityTypeSchema = z.enum([
  "smelter",
  "refinery",
  "integrated_processing",
  "other",
]);

export const smelterFacilityStatusSchema = z.enum([
  "planned",
  "construction",
  "commissioning",
  "operating",
  "temporarily_suspended",
  "inactive",
  "unknown",
]);

export const smelterQuerySchema = z.object({
  commodity: slugSchema.optional(),
  province: z.string().trim().min(1).max(180).optional(),
  operator: slugSchema.optional(),
  facilityType: smelterFacilityTypeSchema.optional(),
  status: smelterFacilityStatusSchema.optional(),
});

export type SmelterQuery = z.infer<typeof smelterQuerySchema>;
