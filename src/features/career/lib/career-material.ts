import type { CareerProfileItemGroup, CareerSection } from "../types/career";

export type CareerMaterialBlock = {
  kind: "item" | "heading" | "note";
  text: string;
};
export type CareerMaterialGroup = {
  title: string | null;
  blocks: CareerMaterialBlock[];
};

const sectionTitles: Record<string, CareerSection> = {
  "ruang lingkup pekerjaan": "workScope",
  kompetensi: "competency",
  "pendidikan yang relevan": "education",
  "software yang digunakan": "software",
  "pelatihan relevan": "training",
};
const clean = (value: string) =>
  value
    .trim()
    .replace(/^#{1,6}\s+/, "")
    .replace(/^\*\*(.*?)\*\*$/, "$1")
    .trim();
const key = (value: string) =>
  clean(value).replace(/:$/, "").toLocaleLowerCase("id-ID");

function groupTitle(value: string, section: CareerSection): string | null {
  const text = key(value);
  if (section === "competency") {
    if (text === "kompetensi teknis umum") return "Kompetensi Teknis Umum";
    if (text === "kompetensi teknis spesialis")
      return "Kompetensi Teknis Spesialis";
    // These spelling variants occur in the imported document headings.
    if (/^(kompetensi|komepetensi) non[ -]?tekni[sk]$/.test(text))
      return "Kompetensi Non-Teknis";
  }
  if (section === "education") {
    if (text === "pendidikan utama") return "Pendidikan Utama";
    if (/^pendidikan pendukung untuk posisi (tertentu|terentu)$/.test(text))
      return "Pendidikan Pendukung untuk Posisi Tertentu";
  }
  if (section === "training") {
    if (text === "pelatihan teknis") return "Pelatihan Teknis";
    if (/^pelatihan (non[ -]?teknis|keselamatan(?: kerja)?)$/.test(text))
      return "Pelatihan Keselamatan";
  }
  return null;
}

function isIntro(value: string) {
  return /^(Kompetensi berikut |Program pendidikan yang |Beberapa posisi tertentu juga dapat berkaitan dengan)/i.test(
    value,
  );
}

/** Restore document hierarchy from the published body, not ingestion group labels.
 * The body retains table rows and heading order that the legacy flat items lost.
 * No content, ranks, or professional requirements are invented here.
 */
export function careerMaterialGroups(
  body: string,
  section: CareerSection,
  fallback: CareerProfileItemGroup[],
): CareerMaterialGroup[] {
  const paragraphs = body
    .split(/\r?\n\s*\r?\n/)
    .map(clean)
    .filter(Boolean);
  const start = paragraphs.findIndex(
    (value) => sectionTitles[key(value)] === section,
  );
  if (start < 0) {
    return fallback.map((group) => ({
      title: group.groupLabel === "Informasi Utama" ? null : group.groupLabel,
      blocks: group.values.map(({ value }) => ({
        kind: "item" as const,
        text: value,
      })),
    }));
  }
  const end = paragraphs.findIndex(
    (value, index) =>
      index > start &&
      (sectionTitles[key(value)] !== undefined ||
        /^(referensi|sumber)$/i.test(value)),
  );
  const values = paragraphs.slice(start + 1, end < 0 ? undefined : end);
  const groups: CareerMaterialGroup[] = [];
  let current: CareerMaterialGroup | undefined;
  const addGroup = (title: string | null) => {
    current = { title, blocks: [] };
    groups.push(current);
  };
  for (const value of values) {
    const title = groupTitle(value, section);
    if (title) {
      addGroup(title);
      continue;
    }
    if (isIntro(value)) continue;
    if (section === "software" && value.startsWith("|")) {
      for (const row of value.split(/\r?\n/)) {
        const cells = row
          .trim()
          .replace(/^\||\|$/g, "")
          .split(/(?<!\\)\|/)
          .map((cell) => cell.trim().replace(/\\\|/g, "|"));
        if (cells.every((cell) => /^:?-+:?$/.test(cell))) continue;
        const text = cells.filter(Boolean).join(" — ");
        if (!text) continue;
        if (/^[A-Z]\.\s+/.test(text)) addGroup(text.replace(/^[A-Z]\.\s+/, ""));
        else {
          if (!current) addGroup(null);
          current!.blocks.push({ kind: "item", text });
        }
      }
      continue;
    }
    // The education introduction is intentionally omitted; only the two study groups are shown.
    if (!current && section === "education") continue;
    if (!current) addGroup(null);
    const isNote =
      (current!.title === null && section === "training") ||
      (section === "workScope" &&
        /^(Tidak semua profesi|Profesi dalam kategori)/i.test(value));
    current!.blocks.push({
      kind: isNote ? "note" : value.endsWith(":") ? "heading" : "item",
      text: value.replace(/:$/, ""),
    });
  }
  return groups.filter((group) => group.blocks.length > 0);
}
