import "server-only";

import { educationArticles } from "@/features/education/content/education-content";
import { industryCompanyPresentation } from "@/features/industry/content/industry-company-content";
import { regulations } from "@/features/economy/data/regulations";

import { normalizeMineBotText } from "../services/conversation-context";
import type { Evidence } from "../types/orchestrator";

const COMPANY_CATALOG: Record<
  string,
  { name: string; aliases: string[] }
> = {
  "alamtri-resources": {
    name: "PT Alamtri Resources Indonesia Tbk",
    aliases: ["alamtri", "adaro"],
  },
  "amman-mineral": {
    name: "PT Amman Mineral Internasional Tbk",
    aliases: ["amman", "amman mineral"],
  },
  antam: {
    name: "PT Aneka Tambang Tbk",
    aliases: ["antam", "aneka tambang", "pt antam"],
  },
  "bayan-resources": {
    name: "PT Bayan Resources Tbk",
    aliases: ["bayan", "bayan resources"],
  },
  "bukit-asam": {
    name: "PT Bukit Asam Tbk",
    aliases: ["bukit asam", "ptba"],
  },
  "bumi-resources": {
    name: "PT Bumi Resources Tbk",
    aliases: ["bumi resources"],
  },
  "freeport-indonesia": {
    name: "PT Freeport Indonesia",
    aliases: ["freeport", "pt freeport", "fi"],
  },
  "harum-energy": {
    name: "PT Harum Energy Tbk",
    aliases: ["harum", "harum energy"],
  },
  "merdeka-copper-gold": {
    name: "PT Merdeka Copper Gold Tbk",
    aliases: ["merdeka", "merdeka copper gold", "mdka"],
  },
  timah: {
    name: "PT Timah Tbk",
    aliases: ["timah", "tambang timah"],
  },
  "trimegah-bangun-persada": {
    name: "PT Trimegah Bangun Persada Tbk",
    aliases: ["trimegah", "harita"],
  },
  "vale-indonesia": {
    name: "PT Vale Indonesia Tbk",
    aliases: ["vale", "inco", "pt inco", "nickel indonesia"],
  },
};

const COMMODITY_CATALOG: Record<
  string,
  { name: string; description: string }
> = {
  batubara: {
    name: "Batubara",
    description:
      "Batubara merupakan komoditas energi utama Indonesia, digunakan untuk pembangkit listrik, bahan bakar industri, dan bahan baku produk karbon.",
  },
  nikel: {
    name: "Nikel",
    description:
      "Nikel merupakan komoditas mineral yang digunakan untuk baja tahan karat (stainless steel), baterai kendaraan listrik, dan pelapisan logam.",
  },
  emas: {
    name: "Emas",
    description:
      "Emas digunakan sebagai logam mulia investasi, perhiasan, dan komponen elektronik.",
  },
  tembaga: {
    name: "Tembaga",
    description:
      "Tembaga digunakan untuk kabel listrik, konstruksi, dan komponen elektronik.",
  },
  timah: {
    name: "Timah",
    description:
      "Timah digunakan untuk solder, pelapisan logam, dan komponen elektronik.",
  },
  "bijih-besi": {
    name: "Bijih Besi",
    description:
      "Bijih besi merupakan bahan baku utama pembuatan baja.",
  },
  bauksit: {
    name: "Bauksit",
    description:
      "Bauksit merupakan bijih utama penghasil aluminium.",
  },
};

const GLOSSARY_LIMIT = 12;

const STOPWORDS = new Set([
  "apa",
  "itu",
  "yang",
  "dan",
  "atau",
  "untuk",
  "dengan",
  "dari",
  "pada",
  "di",
  "ke",
  "saya",
  "kamu",
  "bisa",
  "ada",
  "mau",
  "berapa",
  "bagaimana",
  "mengapa",
  "kenapa",
  "ini",
  "apakah",
  "tolong",
  "silahkan",
  "sebutkan",
  "jelaskan",
  "buka",
  "tampilkan",
  "berikan",
  "perihal",
  "soal",
  "tentang",
  "data",
  "informasi",
  "tolong",
]);

const GENERIC_NAME_PARTS = new Set([
  "pt",
  "tbk",
  "indonesia",
  "internasional",
  "resources",
  "mineral",
  "tambang",
  "pertambangan",
  "industri",
  "teknologi",
]);

export function detectCompanySlug(text: string): string | undefined {
  const normalized = normalizeMineBotText(text);

  // Prefer explicit aliases: they are the most specific human-supervised signal.
  for (const [slug, catalog] of Object.entries(COMPANY_CATALOG)) {
    const matchAlias = catalog.aliases.some(
      (alias) => new RegExp(`(^|\\W)${escapeRegExp(alias)}(\\W|$)`, "i").test(normalized)
    );
    if (matchAlias) return slug;
  }

  // Fall back to distinctive name fragments, skipping generic words such as
  // "pt", "tbk", "indonesia", or "tambang" that appear in many unrelated rows.
  for (const [slug, catalog] of Object.entries(COMPANY_CATALOG)) {
    const matchName = catalog.name.toLocaleLowerCase("id-ID").split(" ")
      .filter((part) => part.length >= 3 && !GENERIC_NAME_PARTS.has(part))
      .some((part) => normalized.includes(part));
    if (matchName) return slug;
  }
  return undefined;
}

function detectCommoditySlug(text: string): string | undefined {
  const normalized = normalizeMineBotText(text);
  for (const slug of Object.keys(COMMODITY_CATALOG)) {
    const name = COMMODITY_CATALOG[slug].name.toLocaleLowerCase("id-ID");
    if (normalized.includes(name) || normalized.includes(slug)) return slug;
  }
  if (normalized.includes("batu bara")) return "batubara";
  if (normalized.includes("bijih besi")) return "bijih-besi";
  return undefined;
}

const GLOSSARY_QUERY_ALIASES: Record<string, string> = {
  "tambang terbuka": "open pit",
  "pertambangan terbuka": "open pit",
  "penambangan terbuka": "open pit",
  "tambang bawah tanah": "underground mining",
  "penambangan bawah tanah": "underground mining",
  "lapisan penutup": "overburden",
  "pengupasan": "overburden",
  "pemulihan lahan": "reclamation",
  "pemulihan lahan bekas tambang": "reclamation",
  "reklamasi": "reclamation",
  "peleburan dan pemurnian": "smelter",
  "peningkatan kualitas mineral": "beneficiation",
  "jenjang": "bench",
  "peledakan": "blasting",
  "pemboran": "drilling",
  "pengangkutan": "hauling",
  "eksplorasi": "exploration",
  "bijih": "ore",
};

export type QuestionShape =
  | "definition"
  | "function"
  | "responsibility"
  | "comparison"
  | "factual"
  | "list"
  | "other";

export function classifyQuestionShape(question: string): QuestionShape {
  const normalized = normalizeMineBotText(question);

  if (
    /\b(perbedaan|perbandingan|dibandingkan|bandingkan|banding|compare|versus|vs\.?)\b/i.test(normalized)
  ) {
    return "comparison";
  }

  if (
    /\b(apa saja|sebutkan|daftar|list|macam|jenis|kategori)\b/i.test(normalized)
  ) {
    return "list";
  }

  if (
    /\b(apa fungsi|fungsi|untuk apa|dipakai untuk|kegunaan|manfaat|berfungsi)\b/i.test(normalized)
  ) {
    return "function";
  }

  if (
    /\b(apa tugas|tugas|tanggung jawab|bertanggung jawab)\b/i.test(normalized)
  ) {
    return "responsibility";
  }

  if (
    /\b(apa itu|itu apa|apa yang dimaksud|dimaksud|definisi|pengertian|jelaskan|apakah|arti|artinya|maksudnya)\b/i.test(normalized)
  ) {
    return "definition";
  }

  if (
    /\b(di mana|dimana|kapan|siapa|berapa|wilayah|lokasi|komoditas utama)\b/i.test(normalized)
  ) {
    return "factual";
  }

  return "other";
}

export function buildEducationEvidence(question: string): Evidence[] {
  const normalized = normalizeMineBotText(question);
  const results: Evidence[] = [];
  const glossary = flattenGlossary();
  const requestedTerms = new Set<string>();

  for (const [alias, term] of Object.entries(GLOSSARY_QUERY_ALIASES)) {
    if (normalized.includes(alias)) requestedTerms.add(term.toLocaleLowerCase("id-ID"));
  }

  if (glossary.size > 0) {
    for (const [term, entry] of glossary) {
      if (normalized.includes(term) || requestedTerms.has(term)) {
        results.push(
          buildCurated({
            evidenceId: `glossary-${slugify(term)}`,
            title: entry.label,
            facts: `${entry.label}: ${entry.definition}.`,
            module: "education",
            entityType: "glossary",
            canonicalUrl: glossaryCanonicalUrl(term),
          })
        );
        if (results.length >= GLOSSARY_LIMIT) break;
      }
    }
  }

  for (const article of educationArticles) {
    const articleText = `${article.title} ${article.summary}`.toLocaleLowerCase("id-ID");
    const tokens = tokensFrom(question);
    const relevance = tokens.filter((token) => articleText.includes(token)).length;

    if (relevance > 0 || normalized.includes(article.slug)) {
      results.push(
        buildCurated({
          evidenceId: `education-${article.slug}`,
          title: article.title,
          facts: trim(`${article.summary} ${articleParagraphSnippet(article)}`),
          module: "education",
          entityType: "article",
          canonicalUrl: `/education/${article.slug}`,
        })
      );
    }
  }

  return results.slice(0, 12);
}

export function buildIndustryEvidence(
  question: string,
  companySlugOverride?: string
): Evidence[] {
  const companySlug = companySlugOverride ?? detectCompanySlug(question);
  if (!companySlug) return [];

  const company = industryCompanyPresentation[
    companySlug as keyof typeof industryCompanyPresentation
  ];
  if (!company) return [];

  const title = COMPANY_CATALOG[companySlug]?.name ?? companySlug;

  return [
    buildCurated({
      evidenceId: `company-${companySlug}`,
      title,
      facts: trim(
        `${title} adalah perusahaan tambang di Indonesia. ` +
          `Operasi utama berada di ${company.mainOperation}, dengan komoditas utama ${company.primaryCommodity}.`
      ),
      module: "industry",
      entityType: "company",
      canonicalUrl: `/industry/${companySlug}`,
    }),
  ];
}

export function buildCommodityEvidence(question: string): Evidence[] {
  const normalized = normalizeMineBotText(question);
  const slug = detectCommoditySlug(question);

  const results: Evidence[] = [];

  const isListing = /(apa saja|daftar|list|yang tersedia|ada apa|komoditas apa)/i.test(normalized);
  const mentionsCommodity = /komoditas/i.test(normalized);
  const targetsCompany = detectCompanySlug(normalized) !== undefined;

  if ((isListing || mentionsCommodity) && !targetsCompany) {
    results.push(buildCommodityListEvidence());
  }

  if (slug) {
    const catalog = COMMODITY_CATALOG[slug];
    results.push(
      buildCurated({
        evidenceId: `commodity-${slug}`,
        title: catalog.name,
        facts: catalog.description,
        module: "commodity",
        entityType: "commodity_profile",
        canonicalUrl: `/commodity/${slug}`,
      })
    );
  }

  return results.slice(0, 6);
}

function buildCommodityListEvidence(): Evidence {
  const names = Object.values(COMMODITY_CATALOG).map((item) => item.name);
  const joined = names.length > 1
    ? `${names.slice(0, -1).join(", ")}, dan ${names[names.length - 1]}`
    : names[0];
  return buildCurated({
    evidenceId: "commodity-list",
    title: "Komoditas yang Tersedia",
    facts: `MineVision menghadirkan data komoditas pertambangan Indonesia, antara lain ${joined}. Detail karakteristik dan data Intelligence masing-masing dapat dibuka pada halaman Commodity.`,
    module: "commodity",
    entityType: "commodity_list",
    canonicalUrl: "/commodity",
  });
}

export function buildCareerEvidence(question: string): Evidence[] {
  const normalized = normalizeMineBotText(question);
  const results: Evidence[] = [];

  if (/(engineer|karier|profesi|kompetensi|software|pelatihan|pekerjaan|it)/.test(normalized)) {
    results.push(
      buildCurated({
        evidenceId: "career-overview",
        title: "Karier Pertambangan",
        facts:
          "MineVision menyediakan informasi kategori karier di pertambangan Indonesia: profesi, kompetensi, software yang digunakan, serta pelatihan yang relevan. Setiap kategori menampilkan profesi beserta deskripsi dan kualifikasinya.",
        module: "career",
        entityType: "career_overview",
        canonicalUrl: "/career",
      }),
      buildCurated({
        evidenceId: "career-mining-engineer",
        title: "Mining Engineer",
        facts:
          "Mining Engineer merancang dan mengawasi kegiatan penambangan agar aman, efisien, dan taat regulasi; mencakup perencanaan tambang, pengelolaan material, serta koordinasi dengan tim teknis dan operasional.",
        module: "career",
        entityType: "profession",
        canonicalUrl: "/career#professions",
      })
    );
  }

  if (/\bit\b|teknologi|sistem informasi|informasi\b/.test(normalized)) {
    results.push(
      buildCurated({
        evidenceId: "career-it-mining",
        title: "Karier IT di Sektor Pertambangan",
        facts:
          "Lulusan jurusan IT sangat dibutuhkan di perusahaan tambang untuk peran seperti Data Analyst, Software Engineer, IoT & Automation Specialist, Fleet Management System Engineer, serta Cybersecurity Analyst.",
        module: "career",
        entityType: "career_info",
        canonicalUrl: "/career",
      })
    );
  }

  return results.slice(0, 6);
}

export function buildEconomyEvidence(question: string): Evidence[] {
  const normalized = normalizeMineBotText(question);
  const results: Evidence[] = [];

  if (/(hilirisasi|smelter|olahan)/.test(normalized)) {
    results.push(
      buildCurated({
        evidenceId: "economy-hilirisasi",
        title: "Hilirisasi Pertambangan",
        facts:
          "Hilirisasi pertambangan adalah upaya meningkatkan nilai tambah hasil tambang melalui pengolahan dan pemurnian di dalam negeri, misalnya melalui fasilitas smelter nikel, pemurnian tembaga, dan pengolahan batubara.",
        module: "economy",
        entityType: "economy_concept",
        canonicalUrl: "/economy",
      })
    );
  }

  if (/(regulasi|peraturan|undang)|\buu\b|\bpp\b/.test(normalized)) {
    const allowed = regulations.filter(
      (regulation) =>
        regulation.status === "active" ||
        regulation.status === "amended" ||
        regulation.status === "revoked"
    );
    const top = allowed.slice(0, 5).map(
      (regulation) => `${regulation.type} ${regulation.number} Tahun ${regulation.year} (${regulation.title})`
    );
    results.push(
      buildCurated({
        evidenceId: "economy-regulations",
        title: "Regulasi Pertambangan",
        facts: `MineVision mencatat regulasi pertambangan Indonesia: ${top.join("; ")}. ${allowed.length > top.length ? `Masih ada ${allowed.length - top.length} regulasi lain yang tercatat.` : ""}`,
        module: "economy",
        entityType: "regulations",
        canonicalUrl: "/economy",
      })
    );
  }

  return results.slice(0, 4);
}

export function buildPlatformEvidence(): Evidence[] {
  return [
    buildCurated({
      evidenceId: "about-minevision",
      title: "Tentang MineVision",
      facts:
        "MineVision adalah platform informasi pertambangan Indonesia yang menghubungkan materi edukasi, profil industri dan komoditas, informasi karier, data Intelligence, serta indikator ekonomi.",
      module: "resource",
      entityType: "platform_profile",
      canonicalUrl: "/about",
    }),
    buildCurated({
      evidenceId: "about-minebot",
      title: "Tentang MineBot",
      facts:
        "MineBot adalah asisten di MineVision yang membantu kamu menelusuri halaman, memahami materi publik, serta membaca data Intelligence yang tersedia.",
      module: "resource",
      entityType: "platform_profile",
      canonicalUrl: "/about",
    }),
    buildCurated({
      evidenceId: "module-education",
      title: "Modul Education",
      facts:
        "Modul Education menyajikan materi edukasi pertambangan: pengertian pertambangan, tahapan kegiatan, metode penambangan, alat berat, keselamatan kerja, dan istilah pertambangan.",
      module: "education",
      entityType: "module_info",
      canonicalUrl: "/education",
    }),
    buildCurated({
      evidenceId: "module-industry",
      title: "Modul Industry",
      facts:
        "Modul Industry menyajikan profil perusahaan pertambangan Indonesia beserta wilayah operasi dan komoditas utamanya.",
      module: "industry",
      entityType: "module_info",
      canonicalUrl: "/industry",
    }),
    buildCurated({
      evidenceId: "module-commodity",
      title: "Modul Commodity",
      facts:
        "Modul Commodity menyajikan data komoditas pertambangan Indonesia, termasuk batubara dan mineral logam seperti nikel, emas, tembaga, timah, bijih besi, dan bauksit.",
      module: "commodity",
      entityType: "module_info",
      canonicalUrl: "/commodity",
    }),
    buildCurated({
      evidenceId: "module-career",
      title: "Modul Career",
      facts:
        "Modul Career menyajikan kategori karier di sektor pertambangan: profesi, kompetensi, software, dan pelatihan.",
      module: "career",
      entityType: "module_info",
      canonicalUrl: "/career",
    }),
    buildCurated({
      evidenceId: "module-intelligence",
      title: "Modul Intelligence",
      facts:
        "Modul Intelligence menyajikan data terstruktur produksi dan harga komoditas pertambangan Indonesia.",
      module: "intelligence",
      entityType: "module_info",
      canonicalUrl: "/intelligence",
    }),
    buildCurated({
      evidenceId: "module-economy",
      title: "Modul Economy",
      facts:
        "Modul Economy menyajikan indikator ekonomi sektor pertambangan: PDB, ekspor, investasi, hilirisasi, dan regulasi.",
      module: "economy",
      entityType: "module_info",
      canonicalUrl: "/economy",
    }),
    buildCurated({
      evidenceId: "module-search",
      title: "Global Search",
      facts:
        "Global Search memungkinkan pencarian menyeluruh konten MineVision, mencakup edukasi, komoditas, perusahaan, karier, laporan, dan data Intelligence.",
      module: "resource",
      entityType: "module_info",
      canonicalUrl: "/search",
    }),
  ];
}

export function rankEvidence(question: string, evidence: Evidence[]): Evidence[] {
  const normalized = normalizeMineBotText(question);
  const tokens = tokensFrom(question);

  return [...evidence]
    .map((item, position) => {
      const itemText = `${item.title} ${item.facts} ${item.module} ${item.entityType}`.toLocaleLowerCase("id-ID");
      const hits = tokens.filter((token) => matchesToken(itemText, token)).length;
      const tier = computeEvidenceTier(item, normalized);
      return { item, tier, hits, position };
    })
    .sort((left, right) => {
      if (left.tier !== right.tier) return left.tier - right.tier;
      if (right.hits !== left.hits) return right.hits - left.hits;
      return left.position - right.position;
    })
    .map(({ item }) => item);
}

/**
 * Deterministic relevance tier for an evidence item against a question.
 * 0 = exact entity match (glossary/company/commodity/profession/concept/article title)
 * 1 = strong content match (entity phrase present inside the evidence content)
 * 2 = multiple distinct keyword hits
 * 3 = single keyword hit
 * 4 = generic / module-level page with no direct relationship
 */
export function computeEvidenceTier(item: Evidence, question: string): number {
  const normalized = normalizeMineBotText(question);
  const title = item.title.toLocaleLowerCase("id-ID");
  const itemText = `${item.title} ${item.facts} ${item.module}`.toLocaleLowerCase("id-ID");
  const tokens = tokensFrom(question);
  const hits = tokens.filter((token) => matchesToken(itemText, token)).length;
  const type = item.entityType.toLocaleLowerCase("id-ID");

  switch (type) {
    case "glossary":
    case "istilah":
    case "glosarium":
      return glossaryTermInQuestion(normalized, title) ? 0 : hits >= 1 ? 1 : 4;

    case "company":
    case "perusahaan":
      return detectCompanySlug(normalized) !== undefined ? 0 : hits >= 1 ? 1 : 4;

    case "commodity_profile":
    case "komoditas":
      return commodityInQuestion(normalized, item) ? 0 : hits >= 1 ? 1 : 4;

    case "profession":
    case "profesi":
      return /\b(mining engineer|engineer)\b/.test(normalized) ? 0 : hits >= 1 ? 1 : 4;

    case "career_overview":
    case "career_info":
    case "kategori":
      return /\b(karier|profesi|karir|pekerjaan|kompetensi)\b/.test(normalized) ? 1 : hits >= 1 ? 2 : 4;

    case "economy_concept":
    case "hilirisasi":
      return /(hilirisasi|smelter|regulasi|ekonomi)/.test(normalized) ? 0 : hits >= 1 ? 1 : 4;

    case "regulations":
      return /\b(regulasi|peraturan|undang)\b/i.test(normalized) ? 0 : 4;

    case "article":
    case "materi":
      if (normalized.includes(title)) return 0;
      if (entityPhraseInText(normalized, itemText)) return 1;
      if (hits >= 2) return 2;
      if (hits === 1) return 3;
      return 4;

    case "module_info":
      return normalized.includes(title) ? 0 : hits >= 1 ? 2 : 4;

    default:
      if (hits >= 2) return 2;
      if (hits === 1) return 3;
      return 4;
  }
}

function glossaryTermInQuestion(normalized: string, glossaryTitle: string): boolean {
  if (normalized.includes(glossaryTitle)) return true;

  for (const [alias, mapped] of Object.entries(GLOSSARY_QUERY_ALIASES)) {
    if (mapped === glossaryTitle && normalized.includes(alias)) return true;
  }

  const titleKeywords = glossaryTitle.split(/\s+/).filter((word) => word.length >= 5);
  const questionTokens = normalized.split(/\s+/);
  return titleKeywords.some((word) => questionTokens.includes(word));
}

function commodityInQuestion(normalized: string, item: Evidence): boolean {
  const title = item.title.toLocaleLowerCase("id-ID");
  if (normalized.includes(title)) return true;

  const slug = item.entitySlug ?? item.evidenceId.replace(/^commodity-/, "");
  if (slug && normalized.includes(slug)) return true;

  return false;
}

function entityPhraseInText(normalized: string, haystack: string): boolean {
  for (const alias of Object.keys(GLOSSARY_QUERY_ALIASES)) {
    if (normalized.includes(alias) && haystack.includes(alias)) return true;
  }
  for (const term of flattenGlossary().keys()) {
    if (normalized.includes(term) && haystack.includes(term)) return true;
  }
  return false;
}

/**
 * True when the question names a concept the MineVision catalog knows about
 * (glossary term/alias, company, commodity, career, economy concept). Used by
 * the sufficiency policy to demand concept-specific evidence instead of a
 * generic module page.
 */
export function mentionsKnownCatalogEntity(question: string): boolean {
  const normalized = normalizeMineBotText(question);

  if (detectCompanySlug(normalized)) return true;

  for (const commodity of Object.keys(COMMODITY_CATALOG)) {
    if (
      normalized.includes(commodity) ||
      normalized.includes(COMMODITY_CATALOG[commodity].name.toLocaleLowerCase("id-ID"))
    ) {
      return true;
    }
  }

  if (/\b(mining engineer|engineer|karier|profesi|hilirisasi|smelter|regulasi)\b/i.test(normalized)) {
    return true;
  }

  for (const alias of Object.keys(GLOSSARY_QUERY_ALIASES)) {
    if (normalized.includes(alias)) return true;
  }
  for (const term of flattenGlossary().keys()) {
    if (glossaryTermInQuestion(normalized, term)) return true;
  }

  return false;
}

function matchesToken(haystack: string, token: string): boolean {
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(token)}([^a-z0-9]|$)`, "i").test(haystack);
}

function tokensFrom(question: string): string[] {
  return normalizeMineBotText(question)
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function flattenGlossary(): Map<string, { label: string; definition: string }> {
  const map = new Map<string, { label: string; definition: string }>();
  for (const article of educationArticles) {
    for (const group of article.glossary ?? []) {
      for (const entry of group.entries) {
        const key = entry.term.toLocaleLowerCase("id-ID");
        if (!map.has(key)) {
          map.set(key, { label: entry.term, definition: entry.definition });
        }
      }
    }
  }
  return map;
}

function articleParagraphSnippet(article: (typeof educationArticles)[number]): string {
  const paragraphs: string[] = [];
  for (const section of article.sections) {
    for (const paragraph of section.paragraphs ?? []) {
      paragraphs.push(paragraph);
    }
  }
  return paragraphs.length > 0 ? paragraphs[0] : "";
}

function glossaryCanonicalUrl(term: string): string {
  for (const article of educationArticles) {
    if (article.glossary) {
      for (const group of article.glossary) {
        if (group.entries.some((entry) => entry.term.toLocaleLowerCase("id-ID") === term)) {
          return `/education/${article.slug}#glosarium`;
        }
      }
    }
  }
  return "/education#glosarium";
}

function buildCurated({
  evidenceId,
  title,
  facts,
  module,
  entityType,
  canonicalUrl,
}: {
  evidenceId: string;
  title: string;
  facts: string;
  module: string;
  entityType: string;
  canonicalUrl: string;
}): Evidence {
  return {
    evidenceId,
    kind: "curated_public",
    module,
    entityType,
    title,
    facts: trim(facts),
    sourceIds: [evidenceId],
    canonicalUrl,
    limitations: [],
  };
}

function trim(value: string): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length > 600 ? `${normalized.slice(0, 597)}...` : normalized;
}

function slugify(value: string): string {
  return value.toLocaleLowerCase("id-ID").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export { COMPANY_CATALOG, COMMODITY_CATALOG };