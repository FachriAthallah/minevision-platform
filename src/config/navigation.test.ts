import { describe, expect, it } from "vitest";
import { officialSourceLinks, publicRoutes, siteConfig } from "./site";

describe("canonical public navigation",()=>{
  it("maps every platform and explore destination to a real route",()=>{expect(siteConfig.mainNavigation.map((item)=>item.href)).toEqual(["/","/education","/industry","/commodity","/career","/intelligence","/economy"]);expect(publicRoutes.economyDownstream).toBe("/economy?section=downstream");expect(publicRoutes.educationGlossary).toBe("/education/istilah-pertambangan");expect(publicRoutes.careerCategories).toBe("/career#kategori-karier");expect(publicRoutes.industryOperations).toBe("/industry?category=operations");});
  it("has no placeholder links and secures official destinations",()=>{expect(Object.values(publicRoutes)).not.toContain("#");for(const item of officialSourceLinks){expect(item.href).not.toBe("#");if(item.external)expect(item.href).toMatch(/^https:\/\//);}});
});
