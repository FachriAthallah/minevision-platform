import { z } from "zod";

export const REQUIRED_CAREER_CATEGORY_SLUGS = [
  "eksplorasi-dan-geologi",
  "perencanaan-dan-rekayasa-tambang",
  "operasi-dan-produksi-tambang",
  "survei-gis-dan-geospasial",
  "pengolahan-mineral-dan-metalurgi",
  "keselamatan-kesehatan-dan-tanggap-darurat",
  "lingkungan-dan-keberlanjutan",
  "pemeliharaan-dan-keandalan-peralatan",
  "logistik-rantai-pasok-dan-pengadaan",
  "data-teknologi-informasi-dan-otomasi",
  "keuangan-komersial-dan-manajemen",
  "legal-perizinan-dan-kepatuhan",
  "sumber-daya-manusia-dan-administrasi",
] as const;

export const REQUIRED_CAREER_PROFILE_SECTIONS = [
  "work_scope",
  "competency",
  "education",
  "software",
  "training",
] as const;

const POSTGRES_INTEGER_MAX = 2_147_483_647;

function createSlugSchema(maxLength: number, label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} wajib diisi`)
    .max(maxLength, `${label} maksimal ${maxLength} karakter`)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      `${label} hanya boleh menggunakan huruf kecil, angka, dan tanda hubung`,
    );
}

function createBoundedTextSchema(maxLength: number, label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} wajib diisi`)
    .max(maxLength, `${label} maksimal ${maxLength} karakter`);
}

const nonEmptyTextSchema = z.string().trim().min(1, "Nilai wajib diisi");
const nullableTextSchema = nonEmptyTextSchema.nullable();
const sourceSlugSchema = createSlugSchema(220, "Source slug");
const professionGroupKeySchema = createSlugSchema(120, "Group key profesi");
const professionSlugSchema = createSlugSchema(200, "Slug profesi");
const profileItemKeySchema = createSlugSchema(160, "Item key profil");
const profileItemGroupKeySchema = createSlugSchema(120, "Group key profil");

const httpsUrlSchema = z
  .string()
  .trim()
  .url("URL harus berupa URL yang valid")
  .regex(/^https:\/\//, "URL wajib menggunakan HTTPS");

function addDuplicateIssues(
  values: readonly string[],
  pathForIndex: (index: number) => (string | number)[],
  fieldName: string,
  context: z.RefinementCtx,
) {
  const firstIndexByValue = new Map<string, number>();

  values.forEach((value, index) => {
    if (firstIndexByValue.has(value)) {
      context.addIssue({
        code: "custom",
        message: `${fieldName} duplikat: ${value}`,
        path: pathForIndex(index),
      });
      return;
    }

    firstIndexByValue.set(value, index);
  });
}

export const careerCategorySlugSchema = z.enum(
  REQUIRED_CAREER_CATEGORY_SLUGS,
);

export const careerSourceTypeSchema = z.enum([
  "government",
  "statistics_agency",
  "company_report",
  "academic",
  "regulation",
  "market_data",
  "other",
]);

const careerSourceCatalogEntrySchema = z
  .object({
    slug: sourceSlugSchema,
    name: createBoundedTextSchema(200, "Nama source"),
    type: careerSourceTypeSchema,
    organization: createBoundedTextSchema(200, "Organisasi source"),
    url: httpsUrlSchema.nullable(),
    description: nullableTextSchema,
    isOfficial: z.boolean(),
    verificationStatus: z.literal("verified"),
  })
  .strict();

const careerCategoryFileReferenceSchema = z
  .object({
    categorySlug: careerCategorySlugSchema,
    filePath: z.string().trim().min(1, "File path wajib diisi"),
  })
  .strict();

export const careerImportManifestSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    datasetName: nonEmptyTextSchema,
    description: nullableTextSchema,
    effectiveDate: z.iso.date({
      error: "Tanggal efektif harus menggunakan format YYYY-MM-DD",
    }),
    categoryFiles: z
      .array(careerCategoryFileReferenceSchema)
      .length(13, "Manifest wajib memiliki tepat 13 file kategori Career"),
    sourceCatalog: z
      .array(careerSourceCatalogEntrySchema)
      .min(1, "Manifest wajib memiliki minimal satu source"),
  })
  .strict()
  .superRefine((manifest, context) => {
    addDuplicateIssues(
      manifest.categoryFiles.map((entry) => entry.categorySlug),
      (index) => ["categoryFiles", index, "categorySlug"],
      "Category slug",
      context,
    );

    addDuplicateIssues(
      manifest.categoryFiles.map((entry) => entry.filePath),
      (index) => ["categoryFiles", index, "filePath"],
      "File path",
      context,
    );

    manifest.categoryFiles.forEach((entry, index) => {
      const expectedPath = `categories/${entry.categorySlug}.json`;

      if (entry.filePath !== expectedPath) {
        context.addIssue({
          code: "custom",
          message: `File path harus persis ${expectedPath}`,
          path: ["categoryFiles", index, "filePath"],
        });
      }
    });

    const availableSlugs = new Set(
      manifest.categoryFiles.map((entry) => entry.categorySlug),
    );

    for (const requiredSlug of REQUIRED_CAREER_CATEGORY_SLUGS) {
      if (!availableSlugs.has(requiredSlug)) {
        context.addIssue({
          code: "custom",
          message: `Kategori Career wajib belum tersedia: ${requiredSlug}`,
          path: ["categoryFiles"],
        });
      }
    }

    addDuplicateIssues(
      manifest.sourceCatalog.map((source) => source.slug),
      (index) => ["sourceCatalog", index, "slug"],
      "Source slug",
      context,
    );
  });

const profileSourceReferenceSchema = z
  .object({
    sourceSlug: sourceSlugSchema,
    citationLabel: nullableTextSchema,
    pageReference: nullableTextSchema,
    displayOrder: z.number().int().nonnegative().max(POSTGRES_INTEGER_MAX),
  })
  .strict();

const careerProfileSchema = z
  .object({
    title: createBoundedTextSchema(240, "Judul profil"),
    slug: careerCategorySlugSchema,
    excerpt: nonEmptyTextSchema,
    body: nonEmptyTextSchema,
    coverImageUrl: z
      .string()
      .trim()
      .startsWith(
        "/images/career/",
        "Cover image URL harus diawali /images/career/",
      )
      .refine(
        (value) =>
          !value.includes("\\") &&
          !value.split("/").some((segment) => segment === ".."),
        "Cover image URL tidak boleh mengandung path traversal",
      )
      .nullable(),
    status: z.literal("published"),
    publishedAt: z.iso.datetime({
      offset: true,
      error: "Published at harus berupa ISO datetime dengan timezone",
    }),
    readingTimeMinutes: z
      .number()
      .int()
      .positive()
      .max(POSTGRES_INTEGER_MAX)
      .nullable(),
    isFeatured: z.boolean(),
    metadata: z.record(z.string(), z.unknown()),
    sources: z
      .array(profileSourceReferenceSchema)
      .min(1, "Profil wajib memiliki minimal satu sumber"),
  })
  .strict()
  .superRefine((profile, context) => {
    addDuplicateIssues(
      profile.sources.map((source) => source.sourceSlug),
      (index) => ["sources", index, "sourceSlug"],
      "Referensi source profil",
      context,
    );
  });

const careerProfessionSchema = z
  .object({
    groupKey: professionGroupKeySchema,
    groupLabel: createBoundedTextSchema(180, "Group label profesi"),
    name: createBoundedTextSchema(180, "Nama profesi"),
    slug: professionSlugSchema,
    description: nullableTextSchema,
    displayOrder: z.number().int().nonnegative().max(POSTGRES_INTEGER_MAX),
  })
  .strict();

const careerProfileItemSchema = z
  .object({
    itemKey: profileItemKeySchema,
    section: z.enum(REQUIRED_CAREER_PROFILE_SECTIONS),
    groupKey: profileItemGroupKeySchema,
    groupLabel: createBoundedTextSchema(180, "Group label profil"),
    value: nonEmptyTextSchema,
    displayOrder: z.number().int().nonnegative().max(POSTGRES_INTEGER_MAX),
  })
  .strict();

export const careerImportFileSchema = z
  .object({
    schemaVersion: z.literal("1.0"),
    categorySlug: careerCategorySlugSchema,
    category: z
      .object({
        name: createBoundedTextSchema(160, "Nama kategori"),
        slug: careerCategorySlugSchema,
        description: nonEmptyTextSchema,
        displayOrder: z.number().int().min(1).max(13),
        isActive: z.literal(true),
      })
      .strict(),
    profile: careerProfileSchema,
    professions: z
      .array(careerProfessionSchema)
      .min(1, "Kategori wajib memiliki minimal satu profesi"),
    profileItems: z
      .array(careerProfileItemSchema)
      .min(1, "Kategori wajib memiliki minimal satu profile item"),
  })
  .strict()
  .superRefine((careerFile, context) => {
    if (careerFile.category.slug !== careerFile.categorySlug) {
      context.addIssue({
        code: "custom",
        message: "Category slug harus sama dengan categorySlug file",
        path: ["category", "slug"],
      });
    }

    if (careerFile.profile.slug !== careerFile.categorySlug) {
      context.addIssue({
        code: "custom",
        message: "Profile slug harus sama dengan categorySlug file",
        path: ["profile", "slug"],
      });
    }

    addDuplicateIssues(
      careerFile.professions.map(
        (profession) => `${profession.groupKey}\u0000${profession.slug}`,
      ),
      (index) => ["professions", index, "slug"],
      "Natural key profesi",
      context,
    );

    addDuplicateIssues(
      careerFile.professions.map(
        (profession) =>
          `${profession.groupKey}\u0000${profession.displayOrder}`,
      ),
      (index) => ["professions", index, "displayOrder"],
      "Display order profesi dalam group",
      context,
    );

    addDuplicateIssues(
      careerFile.profileItems.map((item) => item.itemKey),
      (index) => ["profileItems", index, "itemKey"],
      "Item key profil",
      context,
    );

    addDuplicateIssues(
      careerFile.profileItems.map(
        (item) =>
          `${item.section}\u0000${item.groupKey}\u0000${item.displayOrder}`,
      ),
      (index) => ["profileItems", index, "displayOrder"],
      "Display order profile item",
      context,
    );

    const labelBySectionAndGroup = new Map<string, string>();

    careerFile.profileItems.forEach((item, index) => {
      const groupIdentity = `${item.section}\u0000${item.groupKey}`;
      const existingLabel = labelBySectionAndGroup.get(groupIdentity);

      if (existingLabel !== undefined && existingLabel !== item.groupLabel) {
        context.addIssue({
          code: "custom",
          message:
            "Group key yang sama dalam satu section wajib memakai group label yang sama",
          path: ["profileItems", index, "groupLabel"],
        });
        return;
      }

      labelBySectionAndGroup.set(groupIdentity, item.groupLabel);
    });

    const availableSections = new Set(
      careerFile.profileItems.map((item) => item.section),
    );

    for (const requiredSection of REQUIRED_CAREER_PROFILE_SECTIONS) {
      if (!availableSections.has(requiredSection)) {
        context.addIssue({
          code: "custom",
          message: `Section profile item wajib belum tersedia: ${requiredSection}`,
          path: ["profileItems"],
        });
      }
    }
  });

export type CareerImportManifest = z.infer<
  typeof careerImportManifestSchema
>;

export type CareerImportFile = z.infer<typeof careerImportFileSchema>;

export type CareerProfileSourceReference = z.infer<
  typeof profileSourceReferenceSchema
>;
