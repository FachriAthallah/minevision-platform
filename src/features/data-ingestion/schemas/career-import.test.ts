import { describe, expect, it } from "vitest";

import {
  REQUIRED_CAREER_CATEGORY_SLUGS,
  REQUIRED_CAREER_PROFILE_SECTIONS,
  careerImportFileSchema,
  careerImportManifestSchema,
} from "./career-import";

type CareerCategorySlug = (typeof REQUIRED_CAREER_CATEGORY_SLUGS)[number];

const sourceCatalogEntry = {
  slug: "kementerian-esdm",
  name: "Kementerian Energi dan Sumber Daya Mineral",
  type: "government",
  organization: "Kementerian ESDM",
  url: "https://www.esdm.go.id",
  description: "Sumber resmi pemerintah.",
  isOfficial: true,
  verificationStatus: "verified",
};

function createValidManifest() {
  return {
    schemaVersion: "1.0",
    datasetName: "Dataset Career MineVision",
    description: "Profil kategori karier pertambangan.",
    effectiveDate: "2026-09-05",
    categoryFiles: REQUIRED_CAREER_CATEGORY_SLUGS.map((categorySlug) => ({
      categorySlug,
      filePath: `categories/${categorySlug}.json`,
    })),
    sourceCatalog: [{ ...sourceCatalogEntry }],
  };
}

function createValidCareerFile(
  categorySlug: CareerCategorySlug = REQUIRED_CAREER_CATEGORY_SLUGS[0],
  displayOrder = 1,
) {
  return {
    schemaVersion: "1.0",
    categorySlug,
    category: {
      name: "Eksplorasi dan Geologi",
      slug: categorySlug,
      description: "Bidang karier eksplorasi dan geologi pertambangan.",
      displayOrder,
      isActive: true,
    },
    profile: {
      title: "Karier Eksplorasi dan Geologi",
      slug: categorySlug,
      excerpt: "Ringkasan karier eksplorasi dan geologi.",
      body: "## Ruang Lingkup\n\nMateri karier yang bersumber.",
      coverImageUrl: "/images/career/eksplorasi.webp",
      status: "published",
      publishedAt: "2026-09-05T08:00:00+07:00",
      readingTimeMinutes: 8,
      isFeatured: false,
      metadata: { audience: "public" },
      sources: [
        {
          sourceSlug: sourceCatalogEntry.slug,
          citationLabel: "Informasi karier pertambangan",
          pageReference: null,
          displayOrder: 0,
        },
      ],
    },
    professions: [
      {
        groupKey: "geologi",
        groupLabel: "Geologi",
        name: "Geologist",
        slug: "geologist",
        description: "Menganalisis kondisi geologi wilayah tambang.",
        displayOrder: 0,
      },
    ],
    profileItems: REQUIRED_CAREER_PROFILE_SECTIONS.map((section, index) => ({
      itemKey: `${section.replaceAll("_", "-")}-utama`,
      section,
      groupKey: "utama",
      groupLabel: "Informasi Utama",
      value: `Informasi ${section}.`,
      displayOrder: index,
    })),
  };
}

function expectIssuePath(
  result: ReturnType<typeof careerImportFileSchema.safeParse>,
  path: string,
) {
  expect(result.success).toBe(false);

  if (!result.success) {
    expect(result.error.issues.map((issue) => issue.path.join("."))).toContain(
      path,
    );
  }
}

describe("careerImportManifestSchema", () => {
  it("menerima manifest valid dengan tepat 13 kategori wajib", () => {
    const result = careerImportManifestSchema.safeParse(createValidManifest());

    expect(result.success).toBe(true);
    expect(result.success && result.data.categoryFiles).toHaveLength(13);
  });

  it("menolak manifest yang tidak memiliki tepat 13 kategori", () => {
    const manifest = createValidManifest();
    manifest.categoryFiles.pop();

    const result = careerImportManifestSchema.safeParse(manifest);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join("."))).toContain(
        "categoryFiles",
      );
      expect(result.error.issues.some((issue) =>
        issue.message.includes("Kategori Career wajib belum tersedia"),
      )).toBe(true);
    }
  });

  it("menolak categorySlug dan filePath duplikat", () => {
    const manifest = createValidManifest();
    manifest.categoryFiles[1] = { ...manifest.categoryFiles[0] };

    const result = careerImportManifestSchema.safeParse(manifest);

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join("."));
      expect(paths).toContain("categoryFiles.1.categorySlug");
      expect(paths).toContain("categoryFiles.1.filePath");
    }
  });

  it("menolak path kategori yang tidak persis mengikuti slug", () => {
    const manifest = createValidManifest();
    manifest.categoryFiles[0].filePath = "categories/geologi.json";

    const result = careerImportManifestSchema.safeParse(manifest);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join("."))).toContain(
        "categoryFiles.0.filePath",
      );
    }
  });

  it("menolak source slug duplikat dan URL non-HTTPS", () => {
    const duplicateSource = createValidManifest();
    duplicateSource.sourceCatalog.push({ ...sourceCatalogEntry });
    expect(careerImportManifestSchema.safeParse(duplicateSource).success).toBe(
      false,
    );

    const insecureSource = createValidManifest();
    insecureSource.sourceCatalog[0].url = "http://example.com";
    expect(careerImportManifestSchema.safeParse(insecureSource).success).toBe(
      false,
    );
  });

  it("menolak unknown key pada object manifest", () => {
    const result = careerImportManifestSchema.safeParse({
      ...createValidManifest(),
      unknownKey: true,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) =>
        issue.code === "unrecognized_keys",
      )).toBe(true);
    }
  });
});

describe("careerImportFileSchema", () => {
  it("menerima file kategori lengkap", () => {
    expect(careerImportFileSchema.safeParse(createValidCareerFile()).success).toBe(
      true,
    );
  });

  it("menolak slug category dan profile yang tidak konsisten", () => {
    const categoryMismatch = createValidCareerFile();
    categoryMismatch.category.slug = REQUIRED_CAREER_CATEGORY_SLUGS[1];
    expectIssuePath(
      careerImportFileSchema.safeParse(categoryMismatch),
      "category.slug",
    );

    const profileMismatch = createValidCareerFile();
    profileMismatch.profile.slug = REQUIRED_CAREER_CATEGORY_SLUGS[1];
    expectIssuePath(
      careerImportFileSchema.safeParse(profileMismatch),
      "profile.slug",
    );
  });

  it("menolak duplicate natural key profesi", () => {
    const careerFile = createValidCareerFile();
    careerFile.professions.push({
      ...careerFile.professions[0],
      displayOrder: 1,
    });

    expectIssuePath(
      careerImportFileSchema.safeParse(careerFile),
      "professions.1.slug",
    );
  });

  it("menolak duplicate displayOrder profesi dalam group yang sama", () => {
    const careerFile = createValidCareerFile();
    careerFile.professions.push({
      ...careerFile.professions[0],
      name: "Senior Geologist",
      slug: "senior-geologist",
    });

    expectIssuePath(
      careerImportFileSchema.safeParse(careerFile),
      "professions.1.displayOrder",
    );
  });

  it("mengizinkan displayOrder profesi yang sama pada group berbeda", () => {
    const careerFile = createValidCareerFile();
    careerFile.professions.push({
      ...careerFile.professions[0],
      groupKey: "survei",
      groupLabel: "Survei",
      name: "Surveyor",
      slug: "surveyor",
    });

    expect(careerImportFileSchema.safeParse(careerFile).success).toBe(true);
  });

  it("menolak duplicate itemKey", () => {
    const careerFile = createValidCareerFile();
    careerFile.profileItems.push({
      ...careerFile.profileItems[0],
      displayOrder: 99,
    });

    expectIssuePath(
      careerImportFileSchema.safeParse(careerFile),
      "profileItems.5.itemKey",
    );
  });

  it("menolak duplicate displayOrder profile item per section dan group", () => {
    const careerFile = createValidCareerFile();
    careerFile.profileItems.push({
      ...careerFile.profileItems[0],
      itemKey: "work-scope-tambahan",
    });

    expectIssuePath(
      careerImportFileSchema.safeParse(careerFile),
      "profileItems.5.displayOrder",
    );
  });

  it("mewajibkan semua lima section profile item", () => {
    const careerFile = createValidCareerFile();
    careerFile.profileItems = careerFile.profileItems.filter(
      (item) => item.section !== "training",
    );

    const result = careerImportFileSchema.safeParse(careerFile);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) =>
        issue.message.includes("training"),
      )).toBe(true);
    }
  });

  it("mewajibkan groupLabel konsisten dalam section dan group yang sama", () => {
    const careerFile = createValidCareerFile();
    careerFile.profileItems.push({
      ...careerFile.profileItems[0],
      itemKey: "work-scope-lanjutan",
      groupLabel: "Label Berbeda",
      displayOrder: 1,
    });

    expectIssuePath(
      careerImportFileSchema.safeParse(careerFile),
      "profileItems.5.groupLabel",
    );
  });

  it("menolak referensi source profil duplikat", () => {
    const careerFile = createValidCareerFile();
    careerFile.profile.sources.push({
      ...careerFile.profile.sources[0],
      displayOrder: 1,
    });

    expectIssuePath(
      careerImportFileSchema.safeParse(careerFile),
      "profile.sources.1.sourceSlug",
    );
  });

  it("menolak unknown key pada nested object", () => {
    const careerFile = createValidCareerFile();
    const result = careerImportFileSchema.safeParse({
      ...careerFile,
      category: {
        ...careerFile.category,
        unknownKey: true,
      },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) =>
        issue.code === "unrecognized_keys",
      )).toBe(true);
    }
  });

  it("menolak cover image di luar direktori Career atau path traversal", () => {
    const wrongDirectory = createValidCareerFile();
    wrongDirectory.profile.coverImageUrl = "/images/commodity/geologi.webp";
    expect(
      careerImportFileSchema.safeParse(wrongDirectory).success,
    ).toBe(false);

    const traversal = createValidCareerFile();
    traversal.profile.coverImageUrl = "/images/career/../secret.webp";
    expect(careerImportFileSchema.safeParse(traversal).success).toBe(false);
  });
});
