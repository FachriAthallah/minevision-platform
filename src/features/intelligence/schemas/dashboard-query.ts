import { z } from "zod";

import { intelligenceCommoditySlugs } from "../types/dashboard";

export const intelligenceDashboardQuerySchema = z
  .object({
    commodity: z.enum(intelligenceCommoditySlugs).optional(),
  })
  .strict();

export type IntelligenceDashboardQuery = z.infer<
  typeof intelligenceDashboardQuerySchema
>;
