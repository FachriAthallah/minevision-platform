export type SearchModule = "Education" | "Industry" | "Commodity" | "Career" | "Intelligence" | "Economy" | "Resource" | "Source";
export type PublicSearchResult = { key: string; title: string; summary: string; module: SearchModule; type: string; href: string };
export type PublicSearchResponse = { items: PublicSearchResult[]; total: number; page: number; limit: number; pageCount: number; query: string };
