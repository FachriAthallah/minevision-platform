import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

type ProvinceMapAsset = {
  metadata: { license: string; sourceUrl: string };
  features: Array<{
    id: string;
    properties: { regionCode: string; regionLevel: string };
  }>;
};

const mapAsset = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "public/maps/indonesia-provinces.geo.json"),
    "utf8",
  ),
) as ProvinceMapAsset;

describe("Indonesia province map asset", () => {
  it("contains 38 unique province codes with explicit attribution", () => {
    const codes = mapAsset.features.map((feature) => feature.properties.regionCode);
    expect(mapAsset.features).toHaveLength(38);
    expect(new Set(codes).size).toBe(38);
    expect(mapAsset.features.every((feature) => feature.properties.regionLevel === "province")).toBe(true);
    expect(mapAsset.metadata.license).toBe("CC BY 4.0");
    expect(mapAsset.metadata.sourceUrl).toMatch(/^https:\/\//);
  });

  it("contains every province code referenced by current Intelligence coverage", () => {
    const codes = new Set(
      mapAsset.features.map((feature) => feature.properties.regionCode),
    );
    const referencedCodes = [
      "ID-JA",
      "ID-KS",
      "ID-KT",
      "ID-KI",
      "ID-SS",
      "ID-KB",
      "ID-KR",
      "ID-SN",
      "ID-JB",
      "ID-JI",
      "ID-MU",
      "ID-NB",
      "ID-PT",
      "ID-SA",
      "ID-PD",
      "ID-ST",
      "ID-SG",
      "ID-MA",
      "ID-BB",
    ];
    expect(referencedCodes.filter((code) => !codes.has(code))).toEqual([]);
  });
});
