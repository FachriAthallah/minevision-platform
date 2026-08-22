import { describe, expect, it } from "vitest";

import {
  isPubliclyVisible,
  type PublicVisibilityRecord,
} from "./publication-visibility";

type VisibilityTestCase = {
  name: string;
  record: PublicVisibilityRecord;
  expected: boolean;
};

const visibilityTestCases: VisibilityTestCase[] = [
  {
    name: "mengizinkan record verified dan published",
    record: {
      verificationStatus: "verified",
      publicationStatus: "published",
    },
    expected: true,
  },
  {
    name: "menolak record verified tetapi masih draft",
    record: {
      verificationStatus: "verified",
      publicationStatus: "draft",
    },
    expected: false,
  },
  {
    name: "menolak record verified tetapi masih in review",
    record: {
      verificationStatus: "verified",
      publicationStatus: "in_review",
    },
    expected: false,
  },
  {
    name: "menolak record verified tetapi sudah archived",
    record: {
      verificationStatus: "verified",
      publicationStatus: "archived",
    },
    expected: false,
  },
  {
    name: "menolak record pending walaupun berstatus published",
    record: {
      verificationStatus: "pending",
      publicationStatus: "published",
    },
    expected: false,
  },
  {
    name: "menolak record rejected walaupun berstatus published",
    record: {
      verificationStatus: "rejected",
      publicationStatus: "published",
    },
    expected: false,
  },
];

describe("isPubliclyVisible", () => {
  for (const testCase of visibilityTestCases) {
    it(testCase.name, () => {
      expect(isPubliclyVisible(testCase.record)).toBe(testCase.expected);
    });
  }
});
