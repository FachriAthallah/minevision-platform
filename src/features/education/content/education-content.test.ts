import { describe, expect, it } from "vitest";

import {
  educationArticles,
  getAdjacentEducationArticles,
  getEducationArticle,
  getEducationArticleHref,
} from "@/features/education/content/education-content";

describe("education content", () => {
  it("provides the six MVP education categories with unique slugs", () => {
    const slugs = educationArticles.map((article) => article.slug);

    expect(educationArticles).toHaveLength(6);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("keeps sources and readable content on every article", () => {
    for (const article of educationArticles) {
      expect(article.sections.length).toBeGreaterThan(0);
      expect(article.sources.length).toBeGreaterThan(0);
      expect(article.summary.length).toBeGreaterThan(20);
    }
  });

  it("contains the complete 110-term glossary", () => {
    const glossaryArticle = getEducationArticle("istilah-pertambangan");
    const termCount = glossaryArticle?.glossary?.reduce(
      (total, group) => total + group.entries.length,
      0,
    );

    expect(termCount).toBe(110);
  });

  it("uses the Education index as the canonical first article route", () => {
    expect(getEducationArticleHref(educationArticles[0])).toBe("/education");
    expect(getEducationArticleHref(educationArticles[1])).toBe(
      "/education/tahapan-kegiatan-pertambangan",
    );
  });

  it("returns adjacent article navigation", () => {
    expect(
      getAdjacentEducationArticles("metode-penambangan").previous?.slug,
    ).toBe("tahapan-kegiatan-pertambangan");
    expect(getAdjacentEducationArticles("metode-penambangan").next?.slug).toBe(
      "alat-berat-tambang",
    );
  });
});
