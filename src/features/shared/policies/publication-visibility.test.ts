import { describe, expect, it } from "vitest";

import { isPubliclyVisible } from "./publication-visibility";

describe("isPubliclyVisible", () => {
  it("mengizinkan data verified dan published", () => {
    expect(
      isPubliclyVisible({
        verificationStatus: "verified",
        publicationStatus: "published",
      }),
    ).toBe(true);
  });

  it("menolak data pending", () => {
    expect(
      isPubliclyVisible({
        verificationStatus: "pending",
        publicationStatus: "published",
      }),
    ).toBe(false);
  });

  it("menolak data rejected", () => {
    expect(
      isPubliclyVisible({
        verificationStatus: "rejected",
        publicationStatus: "published",
      }),
    ).toBe(false);
  });

  it("menolak data draft", () => {
    expect(
      isPubliclyVisible({
        verificationStatus: "verified",
        publicationStatus: "draft",
      }),
    ).toBe(false);
  });

  it("menolak data in_review", () => {
    expect(
      isPubliclyVisible({
        verificationStatus: "verified",
        publicationStatus: "in_review",
      }),
    ).toBe(false);
  });

  it("menolak data archived", () => {
    expect(
      isPubliclyVisible({
        verificationStatus: "verified",
        publicationStatus: "archived",
      }),
    ).toBe(false);
  });
});
