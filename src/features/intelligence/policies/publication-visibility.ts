import type { CommodityProduction } from "../../../db/schema/commodity-production";

export type PublicVisibilityRecord = Pick<
  CommodityProduction,
  "verificationStatus" | "publicationStatus"
>;

export function isPubliclyVisible(record: PublicVisibilityRecord): boolean {
  return (
    record.verificationStatus === "verified" &&
    record.publicationStatus === "published"
  );
}
