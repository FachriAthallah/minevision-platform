import { describe, expect, it } from "vitest";

import { economyDashboardQuerySchema } from "./dashboard-query";

describe("Economy dashboard query", () => {
  it("accepts a known section", () => {
    expect(economyDashboardQuerySchema.parse({ section: "downstream" })).toEqual({
      section: "downstream",
    });
  });

  it("rejects an invalid section and unknown keys", () => {
    expect(economyDashboardQuerySchema.safeParse({ section: "legacy" }).success).toBe(false);
    expect(economyDashboardQuerySchema.safeParse({ section: "gdp", debug: true }).success).toBe(false);
  });
});
