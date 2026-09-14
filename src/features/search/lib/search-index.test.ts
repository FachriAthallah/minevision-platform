import { describe, expect, it } from "vitest";
import { matchesSearch, normalizedSearchText, rankSearchResults } from "./search-index";
describe("public search index",()=>{
  it("normalizes whitespace and case",()=>expect(normalizedSearchText("  Mining   ENGINEER ")).toBe("mining engineer"));
  it("matches case-insensitively",()=>expect(matchesSearch({title:"Hilirisasi Pertambangan",summary:"Smelter",type:"Data"},"HILIRISASI")).toBe(true));
  it("deduplicates by canonical key and prioritizes exact title",()=>{const result=rankSearchResults([{key:"a",title:"Nikel",summary:"Profil",module:"Commodity",type:"Komoditas",href:"/commodity/nikel"},{key:"a",title:"Nikel",summary:"Duplikat",module:"Commodity",type:"Komoditas",href:"/x"},{key:"b",title:"Intelligence Nikel",summary:"Data",module:"Intelligence",type:"Data",href:"/intelligence?commodity=nikel"}],"nikel");expect(result).toHaveLength(2);expect(result[0]?.href).toBe("/commodity/nikel");});
});
