import { describe, expect, it } from "vitest";

import {
  REQUIRED_CAREER_CATEGORY_SLUGS,
  REQUIRED_CAREER_PROFILE_SECTIONS,
} from "../schemas/career-import";
import {
  validateCareerImport,
  type CareerImportFileInput,
} from "./validate-career-import";

type CareerCategorySlug = (typeof REQUIRED_CAREER_CATEGORY_SLUGS)[number];

function createValidManifest() {
  return {
    schemaVersion: "1.0",
    datasetName: "Dataset Career MineVision",
    description: null,
    effectiveDate: "2026-09-05",
    categoryFiles: REQUIRED_CAREER_CATEGORY_SLUGS.map((categorySlug) => ({
      categorySlug,
      filePath: `categories/${categorySlug}.json`,
    })),
    sourceCatalog: [
      {
        slug: "kementerian-esdm",
        name: "Kementerian Energi dan Sumber Daya Mineral",
        type: "government",
        organization: "Kementerian ESDM",
        url: "https://www.esdm.go.id",
        description: null,
        isOfficial: true,
        verificationStatus: "verified",
      },
    ],
  };
}

function createValidCategoryFile(
  categorySlug: CareerCategorySlug,
  displayOrder: number,
) {
  return {
    schemaVersion: "1.0",
    categorySlug,
    category: {
      name: `Kategori ${displayOrder}`,
      slug: categorySlug,
      description: `Deskripsi kategori Career ${displayOrder}.`,
      displayOrder,
      isActive: true,
    },
    profile: {
      title: `Profil kategori Career ${displayOrder}`,
      slug: categorySlug,
      excerpt: `Ringkasan kategori Career ${displayOrder}.`,
      body: "## Profil\n\nMateri karier yang telah diverifikasi.",
      coverImageUrl: null,
      status: "published",
      publishedAt: "2026-09-05T08:00:00+07:00",
      readingTimeMinutes: null,
      isFeatured: false,
      metadata: {},
      sources: [
        {
          sourceSlug: "kementerian-esdm",
          citationLabel: null,
          pageReference: null,
          displayOrder: 0,
        },
      ],
    },
    professions: [
      {
        groupKey: "profesi-utama",
        groupLabel: "Profesi Utama",
        name: `Profesi ${displayOrder}`,
        slug: `profesi-${displayOrder}`,
        description: null,
        displayOrder: 0,
      },
    ],
    profileItems: REQUIRED_CAREER_PROFILE_SECTIONS.map((section) => ({
      itemKey: `${section.replaceAll("_", "-")}-${displayOrder}`,
      section,
      groupKey: "utama",
      groupLabel: "Informasi Utama",
      value: `Informasi ${section}.`,
      displayOrder: 0,
    })),
  };
}

function createValidInputs(): CareerImportFileInput[] {
  return REQUIRED_CAREER_CATEGORY_SLUGS.map((categorySlug, index) => ({
    filePath: `categories/${categorySlug}.json`,
    input: createValidCategoryFile(categorySlug, index + 1),
  }));
}

describe("validateCareerImport", () => {
  it("menghasilkan success true untuk dataset valid dan mengurutkan file sesuai manifest", () => {
    const manifest = createValidManifest();
    const inputs = createValidInputs().reverse();

    const result = validateCareerImport(manifest, inputs);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.categoryFiles).toHaveLength(13);
      expect(result.data.categoryFiles.map((file) => file.data.categorySlug)).toEqual(
        REQUIRED_CAREER_CATEGORY_SLUGS,
      );
    }
  });

  it("mendeteksi file kategori yang hilang", () => {
    const inputs = createValidInputs();
    const missing = inputs.shift();

    const result = validateCareerImport(createValidManifest(), inputs);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          filePath: missing?.filePath,
          path: "root",
          code: "missing_file",
        }),
      );
    }
  });

  it("mendeteksi file yang tidak tercantum dalam manifest", () => {
    const inputs = createValidInputs();
    inputs.push({
      filePath: "categories/tidak-dikenal.json",
      input: createValidCategoryFile(REQUIRED_CAREER_CATEGORY_SLUGS[0], 1),
    });

    const result = validateCareerImport(createValidManifest(), inputs);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          filePath: "categories/tidak-dikenal.json",
          code: "unexpected_file",
        }),
      );
    }
  });

  it("menolak categorySlug file yang tidak cocok dengan manifest", () => {
    const inputs = createValidInputs();
    inputs[0].input = createValidCategoryFile(
      REQUIRED_CAREER_CATEGORY_SLUGS[1],
      1,
    );

    const result = validateCareerImport(createValidManifest(), inputs);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          filePath: `categories/${REQUIRED_CAREER_CATEGORY_SLUGS[0]}.json`,
          path: "categorySlug",
          code: "category_slug_mismatch",
        }),
      );
    }
  });

  it("menolak referensi source yang tidak tersedia dalam sourceCatalog", () => {
    const inputs = createValidInputs();
    const firstInput = inputs[0].input as ReturnType<
      typeof createValidCategoryFile
    >;
    firstInput.profile.sources[0].sourceSlug = "source-tidak-dikenal";

    const result = validateCareerImport(createValidManifest(), inputs);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          path: "profile.sources.0.sourceSlug",
          code: "unknown_source",
        }),
      );
    }
  });

  it("menolak displayOrder kategori duplikat", () => {
    const inputs = createValidInputs();
    const secondInput = inputs[1].input as ReturnType<
      typeof createValidCategoryFile
    >;
    secondInput.category.displayOrder = 1;

    const result = validateCareerImport(createValidManifest(), inputs);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          filePath: inputs[1].filePath,
          path: "category.displayOrder",
          code: "duplicate_category_display_order",
        }),
      );
    }
  });

  it("mewajibkan urutan kategori mencakup angka 1 sampai 13", () => {
    const inputs = createValidInputs();
    const lastInput = inputs[12].input as ReturnType<
      typeof createValidCategoryFile
    >;
    lastInput.category.displayOrder = 12;

    const result = validateCareerImport(createValidManifest(), inputs);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({
          filePath: "data/staging/career/manifest.json",
          path: "categoryFiles",
          code: "missing_category_display_order",
          message: expect.stringContaining("13"),
        }),
      );
    }
  });
});
