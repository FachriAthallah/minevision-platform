import type { NewRegion } from "../../src/db/schema";

export const regionSeed: NewRegion[] = [
  {
    name: "Indonesia",
    slug: "indonesia",
    code: "ID",
    level: "country",
    parentId: null,
    latitude: null,
    longitude: null,
    isActive: true,
  },
];
