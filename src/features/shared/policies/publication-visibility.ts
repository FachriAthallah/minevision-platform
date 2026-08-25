export type PublicVisibilityRecord = {
  verificationStatus: "pending" | "verified" | "rejected";
  publicationStatus: "draft" | "in_review" | "published" | "archived";
};

export function isPubliclyVisible(record: PublicVisibilityRecord): boolean {
  return (
    record.verificationStatus === "verified" &&
    record.publicationStatus === "published"
  );
}
