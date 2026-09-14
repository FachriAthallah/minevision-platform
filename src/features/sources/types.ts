import type { publicSourceModules, publicSourceTypes } from "./schemas/source-query";
export type PublicSourceModule = (typeof publicSourceModules)[number];
export type PublicSourceType = (typeof publicSourceTypes)[number];
export type PublicSourceItem = {
  name: string;
  slug: string;
  organization: string;
  type: PublicSourceType;
  url: string;
  description: string | null;
  isOfficial: boolean;
  verifiedAt: string | null;
  modules: PublicSourceModule[];
};
export type PublicSourceCatalog = {
  items: PublicSourceItem[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
  filters: { publishers: string[]; types: PublicSourceType[]; modules: PublicSourceModule[] };
};
