export type CareerSection = "workScope" | "competency" | "education" | "software" | "training";
export type CareerSectionCode = "work_scope" | "competency" | "education" | "software" | "training";
export type CareerSectionCounts = Record<CareerSection, number>;
export type CareerCategoryLink = { slug: string; name: string; displayOrder: number };
export type CareerCategorySummary = CareerCategoryLink & {
  title: string;
  excerpt: string | null;
  description: string | null;
  professionCount: number;
  sourceCount: number;
  sectionCounts: CareerSectionCounts;
};
export type CareerAggregateCounts = {
  totalCategories: number;
  totalProfessions: number;
  totalProfileItems: number;
  sectionTotals: CareerSectionCounts;
};
export type CareerCatalog = { categories: CareerCategorySummary[]; counts: CareerAggregateCounts };
export type CareerProfessionItem = { name: string; slug: string; description: string | null; displayOrder: number };
export type CareerProfessionGroup = { groupKey: string; groupLabel: string; displayOrder: number; professionCount: number; professions: CareerProfessionItem[] };
export type CareerProfileItemGroup = { section: CareerSectionCode; groupKey: string; groupLabel: string; displayOrder: number; values: { itemKey: string; value: string; displayOrder: number }[] };
export type CareerSectionCollection = Record<CareerSection, CareerProfileItemGroup[]>;
export type CareerSource = { name: string; organization: string | null; type: string; url: string | null; citationLabel: string | null; pageReference: string | null; displayOrder: number };
export type CareerDetail = {
  category: CareerCategoryLink & { description: string | null };
  profile: { title: string; excerpt: string | null; body: string; publishedAt: string | null; readingTimeMinutes: number | null };
  counts: CareerSectionCounts & { professions: number; sources: number };
  professionGroups: CareerProfessionGroup[];
  sections: CareerSectionCollection;
  sources: CareerSource[];
  navigation: { previous: CareerCategoryLink | null; next: CareerCategoryLink | null };
};
