import { describe, expect, it } from "vitest";

import { developerProfile } from "./resource-content";

describe("developer contact profile", () => {
  it("uses the provided canonical contact destinations", () => {
    expect(developerProfile.phone.href).toBe("tel:+62895403968513");
    expect(developerProfile.socialLinks.map((item) => item.href)).toEqual([
      "https://github.com/FachriAthallah",
      "https://www.linkedin.com/in/muhammad-fachri-114a11314/",
      "https://www.instagram.com/fchrathallah?stkn=MWJibzRkcnczaTZzYQ==",
    ]);
  });
});
