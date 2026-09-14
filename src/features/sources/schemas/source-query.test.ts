import { describe, expect, it } from "vitest";
import { sourceQuerySchema } from "./source-query";
describe("source catalog query",()=>{it("rejects unknown filters",()=>expect(sourceQuerySchema.safeParse({module:"admin"}).success).toBe(false));it("caps public result limits",()=>expect(sourceQuerySchema.safeParse({limit:1000}).success).toBe(false));});
