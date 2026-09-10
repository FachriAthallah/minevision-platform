import { and, eq } from "drizzle-orm";

import { commodityPriceSeries } from "@/db/schema";

export type PublicPriceSeriesState = {
  isCanonical: boolean;
  isPublicDefault: boolean;
  publicationStatus: string;
  verificationStatus: string;
};

export function isPublicPriceSeries(series: PublicPriceSeriesState) {
  return (
    series.isCanonical &&
    series.isPublicDefault &&
    series.publicationStatus === "published" &&
    series.verificationStatus === "verified"
  );
}

export function publicPriceSeriesConditions() {
  return and(
    eq(commodityPriceSeries.isCanonical, true),
    eq(commodityPriceSeries.isPublicDefault, true),
    eq(commodityPriceSeries.publicationStatus, "published"),
    eq(commodityPriceSeries.verificationStatus, "verified"),
  );
}
