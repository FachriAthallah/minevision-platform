import type {
  MineBotDataTopic,
  MineBotEconomyMetric,
  MineBotHistory,
  MineBotIntent,
  MineBotRequestContext,
  ResolvedConversationContext,
} from "../types/orchestrator";

const COMMODITY_ALIASES = new Map<string, string>([
  ["batubara", "batubara"],
  ["batu bara", "batubara"],
  ["batbara", "batubara"],
  ["baubara", "batubara"],
  ["coal", "batubara"],
  ["nikel", "nikel"],
  ["nikle", "nikel"],
  ["nikkel", "nikel"],
  ["emas", "emas"],
  ["tembaga", "tembaga"],
  ["timah", "timah"],
  ["bijih besi", "bijih-besi"],
  ["bauksit", "bauksit"],
]);

const COMPANY_ALIASES = new Map<string, string>([
  ["freeport", "freeport-indonesia"],
  ["pt freeport", "freeport-indonesia"],
  ["freeport indonesia", "freeport-indonesia"],
  ["fi", "freeport-indonesia"],
  ["antam", "antam"],
  ["pt antam", "antam"],
  ["aneka tambang", "antam"],
  ["inco", "vale-indonesia"],
  ["pt inco", "vale-indonesia"],
  ["vale", "vale-indonesia"],
  ["pt vale", "vale-indonesia"],
  ["nikel indonesia", "vale-indonesia"],
  ["amman", "amman-mineral"],
  ["amman mineral", "amman-mineral"],
  ["bukit asam", "bukit-asam"],
  ["ptba", "bukit-asam"],
  ["bumi resources", "bumi-resources"],
  ["merdeka", "merdeka-copper-gold"],
  ["merdeka copper gold", "merdeka-copper-gold"],
  ["mdka", "merdeka-copper-gold"],
  ["alamtri", "alamtri-resources"],
  ["adaro", "alamtri-resources"],
  ["harum", "harum-energy"],
  ["harum energy", "harum-energy"],
  ["bayan", "bayan-resources"],
  ["bayan resources", "bayan-resources"],
  ["tambang timah", "timah"],
  ["trimegah", "trimegah-bangun-persada"],
  ["harita", "trimegah-bangun-persada"],
]);

const MODULE_BY_PATH: Array<[RegExp, string]> = [
  [/^\/education\b/, "education"],
  [/^\/industry\b/, "industry"],
  [/^\/commodity\b/, "commodity"],
  [/^\/career\b/, "career"],
  [/^\/intelligence\b/, "intelligence"],
  [/^\/economy\b/, "economy"],
  [/^\/search\b/, "search"],
  [/^\/sources\b/, "sources"],
  [/^\/about\b/, "about"],
];

export function normalizeMineBotText(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("id-ID")
    .replace(/[?!.,;:]+$/g, "")
    .replace(/\s+/g, " ")
    .replace(/\b(slmt|selmt|met)\b/g, "selamat")
    .replace(/\bpgi\b/g, "pagi")
    .replace(/\b(gm|morning|good morning)\b/g, "pagi")
    .replace(/\bgood afternoon\b/g, "siang")
    .replace(/\b(good evening|good night)\b/g, "malam")
    .replace(/\b(thx|thanks|thank you)\b/g, "terima kasih")
    .replace(/\b(batbara|baubara)\b/g, "batubara")
    .replace(/\b(oke|ok|sip)\b/g, "oke");
}

export function extractCommodity(text: string): string | undefined {
  const normalized = normalizeMineBotText(text);

  for (const [alias, canonical] of COMMODITY_ALIASES.entries()) {
    if (new RegExp(`(^|\\W)${escapeRegExp(alias)}(\\W|$)`, "i").test(normalized)) {
      return canonical;
    }
  }

  return undefined;
}

export function extractYears(text: string): number[] {
  const matches = normalizeMineBotText(text).match(/\b(19\d{2}|20\d{2})\b/g) ?? [];
  const years = matches
    .map((year) => Number.parseInt(year, 10))
    .filter((year) => year >= 1900 && year <= 2100);

  return Array.from(new Set(years));
}

export function extractCompany(text: string): string | undefined {
  const normalized = normalizeMineBotText(text);

  for (const [alias, canonical] of COMPANY_ALIASES.entries()) {
    if (new RegExp(`(^|\\W)${escapeRegExp(alias)}(\\W|$)`, "i").test(normalized)) {
      return canonical;
    }
  }

  return undefined;
}

export function resolveEconomyMetric(text: string): MineBotEconomyMetric | null {
  const normalized = normalizeMineBotText(text);

  if (/\b(ekspor|export|nilai ekspor)\b/i.test(normalized)) return "exports";
  if (/\b(investasi|penanaman modal)\b/i.test(normalized)) return "investment";

  const mentionsGdp = /\b(pdb|gdp|produk domestik bruto|domestik bruto)\b/i.test(
    normalized,
  );
  const mentionsMining = /\b(pertambangan|penggalian|sektor tambang)\b/i.test(
    normalized,
  );

  if (!mentionsGdp && !mentionsMining) return null;

  if (/\b(kontribusi|porsi|bagian terhadap)\b/i.test(normalized)) {
    return "gdp_contribution";
  }
  if (/\b(pertumbuhan|growth|tumbuh|perubahan)\b/i.test(normalized)) {
    return "gdp_growth";
  }
  if (mentionsGdp) {
    return mentionsMining ? "mining_gdp" : "national_gdp";
  }
  return null;
}

export function resolveConversationContext({
  question,
  history = [],
  pageContext,
}: {
  question: string;
  history?: MineBotHistory[];
  pageContext?: MineBotRequestContext;
}): ResolvedConversationContext {
  const normalized = normalizeMineBotText(question);
  const intent = resolveIntent(normalized, history);

  // History only supplies context for genuine fragments/continuations. A
  // self-contained question always resolves from the current question itself.
  const inheritFromHistory = intent === "follow_up";
  const allowPageFallback = intent === "data_query" || intent === "follow_up";

  const questionCommodity = extractCommodity(normalized);
  const questionYears = extractYears(normalized);
  const recentUserContext = extractRecentUserContext(history);
  const pageCommodity = extractPageCommodity(pageContext);
  const pageYears = typeof pageContext?.year === "number" ? [pageContext.year] : [];
  const questionMetric = resolveEconomyMetric(normalized);

  const topic = resolveDataTopic(normalized) ?? (inheritFromHistory ? recentUserContext.topic : null);
  const pageModule = resolveModule(normalized, pageContext, intent);
  const company = extractCompany(normalized) ?? (inheritFromHistory ? recentUserContext.company : undefined);
  const economyMetric =
    (questionMetric ?? (inheritFromHistory ? recentUserContext.economyMetric : null)) ?? undefined;

  const commodity =
    questionCommodity ??
    (inheritFromHistory ? recentUserContext.commodity : undefined) ??
    (allowPageFallback ? pageCommodity : undefined);
  const inheritedFrom = questionCommodity
    ? "question"
    : inheritFromHistory && recentUserContext.commodity
      ? "history"
      : allowPageFallback && pageCommodity
        ? "page"
        : "none";

  const comparisonFollowUp = /\b(banding|dibandingkan|compare|versus|vs)\b/i.test(normalized);
  const years =
    questionYears.length > 0
      ? uniqueNumbers(
          comparisonFollowUp && inheritFromHistory
            ? [...questionYears, ...recentUserContext.years]
            : questionYears,
        )
      : inheritFromHistory
        ? recentUserContext.years
        : allowPageFallback
          ? pageYears
          : [];

  const dataLikeIntent = intent === "data_query" || intent === "follow_up";
  const clarification = dataLikeIntent && (topic === "production" || topic === "price")
    ? !commodity
      ? "commodity"
      : topic === "production" && years.length === 0
        ? "year"
        : undefined
    : undefined;

  return {
    intent,
    commodity,
    years,
    module: pageModule,
    company,
    topic,
    economyMetric,
    inheritedFrom,
    needsClarification: clarification !== undefined,
    clarification,
  };
}

function resolveIntent(normalized: string, history: MineBotHistory[]): MineBotIntent {
  if (isCapability(normalized)) return "capability";
  if (isGreeting(normalized) || isThanks(normalized)) return "greeting";
  if (isCommodityListQuestion(normalized)) return "content_query";
  if (isPlatformInfo(normalized)) return "platform_info";
  if (isOutOfScope(normalized)) return "out_of_scope";
  if (isFollowUp(normalized) && hasRecentContext(history)) return "follow_up";
  if (isNavigationOnly(normalized)) return "navigation";
  if (isCompanyQuestion(normalized)) return "content_query";
  if (isCommodityContentQuestion(normalized)) return "content_query";
  if (resolveEconomyMetric(normalized) !== null) return "data_query";
  if (isDataQuestion(normalized)) return "data_query";
  if (isContentQuestion(normalized)) return "content_query";
  return "ambiguous";
}

function resolveDataTopic(normalized: string): MineBotDataTopic {
  if (resolveEconomyMetric(normalized) !== null) return "economy";
  if (/\b(harga|price|hba|hpm|acuan)\b/i.test(normalized)) return "price";
  if (/\b(coverage|sebaran|wilayah produksi)\b/i.test(normalized)) return "coverage";
  if (/\b(produksi|produksinya|production)\b/i.test(normalized)) return "production";
  return null;
}

function extractRecentUserContext(history: MineBotHistory[]) {
  const initial = {
    commodity: undefined as string | undefined,
    years: [] as number[],
    topic: null as MineBotDataTopic,
    company: undefined as string | undefined,
    economyMetric: null as MineBotEconomyMetric | null,
  };

  for (const item of [...history].reverse()) {
    if (item.role !== "user") continue;

    const normalized = normalizeMineBotText(item.content);
    initial.commodity ??= extractCommodity(normalized);
    initial.company ??= extractCompany(normalized);
    initial.topic ??= resolveDataTopic(normalized);
    initial.economyMetric ??= resolveEconomyMetric(normalized);
    if (initial.years.length === 0) {
      initial.years = extractYears(normalized);
    }

    if (initial.years.length > 0 && (initial.topic || initial.commodity)) {
      break;
    }
  }

  return initial;
}

function extractPageCommodity(context?: MineBotRequestContext): string | undefined {
  if (!context) return undefined;
  return normalizeSlug(context.commodity ?? context.entitySlug);
}

function resolveModule(
  normalized: string,
  context: MineBotRequestContext | undefined,
  intent: MineBotIntent
): string | undefined {
  if (intent === "data_query" || intent === "follow_up") {
    if (resolveEconomyMetric(normalized) !== null) return "economy";
    return "intelligence";
  }
  if (/\b(karier|profesi|engineer|pekerjaan)\b/i.test(normalized)) return "career";
  if (/\b(hilirisasi|pdb|ekspor|investasi|regulasi|smelter|ekonomi)\b/i.test(normalized)) return "economy";
  if (/\b(tambang terbuka|tambang bawah tanah|overburden|reklamasi|eksplorasi|metode penambangan|edukasi)\b/i.test(normalized)) return "education";
  if (extractCompany(normalized)) return "industry";
  if (context?.module) return context.module;
  if (context?.pageUrl) {
    const match = MODULE_BY_PATH.find(([pattern]) => pattern.test(context.pageUrl ?? ""));
    if (match) return match[1];
  }
  return undefined;
}

function isGreeting(normalized: string): boolean {
  const words = normalized.split(" ");
  const greetings = [
    "halo",
    "hallo",
    "helo",
    "hai",
    "hi",
    "hei",
    "hey",
    "hello",
    "pagi",
    "siang",
    "sore",
    "malam",
    "selamat",
  ];
  return words.some((word) => greetings.includes(word)) && !isDataQuestion(normalized) && !isContentQuestion(normalized);
}

function isThanks(normalized: string): boolean {
  return ["terima kasih", "makasih", "thanks", "thank you"].includes(normalized);
}

function isCapability(normalized: string): boolean {
  return /\b(siapa kamu|kamu siapa|kamu bisa apa|bisa bantu apa|apa kemampuanmu|bisa apa)\b/i.test(normalized);
}

function isPlatformInfo(normalized: string): boolean {
  return /\b(minevision|mvip|platform ini|website ini|sit ini)\b/i.test(normalized);
}

function isNavigationOnly(normalized: string): boolean {
  const hasNavigationVerb = /\b(buka|membuka|tampilkan|lihat|tunjukkan|navigasi|pergi ke|ke halaman|arahkan ke|buka halaman)\b/i.test(normalized);
  const hasNumericRequirement = /\b(berapa|data|statistik|harga|produksi)\b/i.test(normalized);
  return hasNavigationVerb && !hasNumericRequirement;
}

function isCompanyQuestion(normalized: string): boolean {
  const company = extractCompany(normalized);
  if (!company) return false;

  const locationHint = /\b(lokasi|dimana|di mana|wilayah operasi|berada|operasi|profil|tentang|apa itu|jelaskan|komoditas utama|utama)\b/i.test(normalized);
  const dataHint = /\b(produksi|harga)\b/i.test(normalized);

  return locationHint && !dataHint;
}

export function isCommodityListQuestion(normalized: string): boolean {
  return /komoditas/.test(normalized) &&
    /(apa saja|daftar|list|yang tersedia|tersedia|ada apa|punya)/i.test(normalized);
}

function isCommodityContentQuestion(normalized: string): boolean {
  const commodity = extractCommodity(normalized);
  if (!commodity) return false;
  return /(karakteristik|guna|untuk apa|dipakai|kegunaan|manfaat|fungsi|daftar|ada data|punya data|tersedia|apa itu|jelaskan|profil|seperti apa|negara|wilayah|perusahaan)/i.test(normalized);
}

function isDataQuestion(normalized: string): boolean {
  return /\b(produksi|produksinya|harganya|harga|data|statistik|coverage|sebaran)\b/i.test(normalized) ||
    (extractCommodity(normalized) !== undefined && /\b(berapa|besar|nilai)\b/i.test(normalized));
}

// A fragment only makes sense by referring back to the previous turn.
function isContextDependentFragment(normalized: string): boolean {
  if (isSelfContainedQuestion(normalized)) return false;

  if (/\b(kalau|kalo|bagaimana dengan|bagaimana tahun|dibandingkan|banding|tersebut|tadi|sebelumnya|yang tadi|yang tahun)\b/i.test(normalized)) {
    return true;
  }

  if (/\btahun\s+\d{4}\b/i.test(normalized)) {
    return true;
  }

  if (/^(kalau |kalo |yang |bagaimana |berapa |tahun |di )?\d{4}$/.test(normalized)) {
    return true;
  }

  if (/\b(produksinya|harganya|angkanya|datanya|nilainya|komoditas utamanya|komoditasnya|perusahaannya)\b/i.test(normalized)) {
    return true;
  }

  return false;
}

// A self-contained question carries its own subject/domain and must not inherit
// entity, topic, metric, or period from earlier turns.
function isSelfContainedQuestion(normalized: string): boolean {
  if (/\b(apa itu|itu apa|apakah|definisi|pengertian|maksudnya|artinya|jelaskan|apa tugas|tugas|karakteristik|kompetensi|kualifikasi|di mana|dimana|wilayah operasi|apa saja|bagaimana proses|bagaimana cara|apa kegunaan|fungsi|manfaat|untuk apa|dipakai untuk|apa perbedaan)\b/i.test(normalized)) {
    return true;
  }

  if (resolveEconomyMetric(normalized) !== null) return true;

  if (
    extractCommodity(normalized) !== undefined &&
    /\b(berapa|produksi|harga|ekspor|data)\b/i.test(normalized)
  ) {
    return true;
  }

  if (
    extractCompany(normalized) !== undefined &&
    /\b(berapa|produksi|harga|lokasi|wilayah|profil|operasi)\b/i.test(normalized)
  ) {
    return true;
  }

  return false;
}

function isFollowUp(normalized: string): boolean {
  return isContextDependentFragment(normalized);
}

function hasRecentContext(history: MineBotHistory[]): boolean {
  return history.some((item) => {
    if (item.role !== "user") return false;
    const normalized = normalizeMineBotText(item.content);
    return (
      isDataQuestion(normalized) ||
      resolveEconomyMetric(normalized) !== null ||
      extractCommodity(normalized) !== undefined ||
      extractCompany(normalized) !== undefined
    );
  });
}

function isContentQuestion(normalized: string): boolean {
  return /\b(apa itu|itu apa|apakah|definisi|pengertian|apa saja|jelaskan|bagaimana|tahapan|kegunaan|fungsi|manfaat|untuk apa|dipakai|tugas|materi|metode|istilah|perbedaan|macam|jenis|pelajari|karakteristik|kompetensi|kualifikasi|dibutuhkan|syarat|hilirisasi|eksplorasi|pertambangan|tambang|reklamasi|overburden|smelter|underground|open pit|mining engineer|karier|profesi)\b/i.test(normalized);
}

function isOutOfScope(normalized: string): boolean {
  return /\b(forex|crypto|resep|olahraga|film|game|sepak bola|pemilu|politik|covid)\b/i.test(normalized);
}

function normalizeSlug(value?: string): string | undefined {
  if (!value?.trim()) return undefined;
  return value.trim().toLocaleLowerCase("id-ID").replace(/\s+/g, "-");
}

function uniqueNumbers(values: number[]): number[] {
  return Array.from(new Set(values)).sort((left, right) => left - right);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}