import { z } from "zod";

import { economySections } from "../types/dashboard";

export const economyDashboardQuerySchema = z
  .object({
    section: z.enum(economySections).optional(),
  })
  .strict();

export type EconomyDashboardQuery = z.infer<
  typeof economyDashboardQuerySchema
>;
