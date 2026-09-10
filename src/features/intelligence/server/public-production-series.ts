import { and, eq } from "drizzle-orm";
import { commodityProductionSeries } from "@/db/schema";

export function publicProductionSeriesConditions() {
  return and(
    eq(commodityProductionSeries.isCanonical, true),
    eq(commodityProductionSeries.isPublicDefault, true),
    eq(commodityProductionSeries.productionScope, "national"),
    eq(commodityProductionSeries.publicationStatus, "published"),
    eq(commodityProductionSeries.verificationStatus, "verified"),
  );
}
