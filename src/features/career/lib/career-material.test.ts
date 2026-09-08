import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { careerMaterialGroups } from "./career-material";

describe("Career material hierarchy", () => {
  it("promotes competency titles and omits editorial introductions", () => {
    const body = "Kompetensi\n\nKompetensi Teknis Umum\n\nKompetensi berikut relevan bagi banyak profesi:\n\nPemetaan\n\nKompetensi Teknis Spesialis\n\nKompetensi berikut umumnya dibutuhkan pada profesi tertentu:\n\nGeostatistika\n\nKompetensi Nonteknis\n\nKomunikasi\n\nPendidikan yang Relevan\n\nPendidikan utama\n\nGeologi";
    const result = careerMaterialGroups(body, "competency", []);
    expect(result.map((group) => group.title)).toEqual(["Kompetensi Teknis Umum", "Kompetensi Teknis Spesialis", "Kompetensi Non-Teknis"]);
    expect(result.flatMap((group) => group.blocks)).toEqual([
      { kind: "item", text: "Pemetaan" }, { kind: "item", text: "Geostatistika" }, { kind: "item", text: "Komunikasi" },
    ]);
  });
  it("preserves software table group boundaries and exact names", () => {
    const body = "Software yang Digunakan\n\n| A. Manajemen Armada dan Dispatch |\n| --- |\n| Komatsu DISPATCH Fleet Management System |\n| B. Pemantauan Produksi |\n| Microsoft Excel |\n\nPelatihan Relevan\n\nPelatihan Teknis\n\nPelatihan SQL";
    const result = careerMaterialGroups(body, "software", []);
    expect(result.map((group) => group.title)).toEqual(["Manajemen Armada dan Dispatch", "Pemantauan Produksi"]);
    expect(result[1].blocks).toEqual([{ kind: "item", text: "Microsoft Excel" }]);
    expect(result[0].blocks[0].text).toBe("Komatsu DISPATCH Fleet Management System");
  });
  it.each(["Pelatihan keselamatan", "Pelatihan keselamatan kerja"])("renders %s as a direct group while retaining its items", (heading) => {
    const result = careerMaterialGroups(`Pelatihan Relevan\n\nJenis pelatihan sesuai aktivitas.\n\nPelatihan teknis\n\nPemodelan\n\n${heading}\n\nPertolongan pertama\n\nTanggap darurat`, "training", []);
    expect(result).toEqual([
      { title: null, blocks: [{ kind: "note", text: "Jenis pelatihan sesuai aktivitas." }] },
      { title: "Pelatihan Teknis", blocks: [{ kind: "item", text: "Pemodelan" }] },
      { title: "Pelatihan Keselamatan", blocks: [
        { kind: "item", text: "Pertolongan pertama" },
        { kind: "item", text: "Tanggap darurat" },
      ] },
    ]);
  });
  it("uses structured items if the body has no recognized section", () => {
    expect(careerMaterialGroups("Materi singkat", "education", [{ section: "education", groupKey: "utama", groupLabel: "Informasi Utama", displayOrder: 0, values: [{ itemKey: "geologi", value: "Geologi", displayOrder: 0 }] }])).toEqual([{ title: null, blocks: [{ kind: "item", text: "Geologi" }] }]);
  });
  // Read-only regression against the imported document bodies; never imports data or contacts DB.
  const directory = join(process.cwd(), "data/staging/career/categories");
  for (const file of readdirSync(directory).filter((name) => name.endsWith(".json"))) {
    it(`restores the document groups for ${file}`, () => {
      const data = JSON.parse(readFileSync(join(directory, file), "utf8")) as { profile: { body: string } };
      const body = data.profile.body;
      expect(careerMaterialGroups(body, "competency", []).filter((group) => group.title).map((group) => group.title)).toEqual(["Kompetensi Teknis Umum", "Kompetensi Teknis Spesialis", "Kompetensi Non-Teknis"]);
      expect(careerMaterialGroups(body, "education", []).map((group) => group.title)).toEqual(["Pendidikan Utama", "Pendidikan Pendukung untuk Posisi Tertentu"]);
      const training = careerMaterialGroups(body, "training", []).filter((group) => group.title);
      expect(training.map((group) => group.title)).toEqual(["Pelatihan Teknis", "Pelatihan Keselamatan"]);
      // Compare every training item with its original staging paragraph, including order.
      const paragraphs = body.split(/\r?\n\s*\r?\n/).map((text) => text.trim()).filter(Boolean);
      const technicalStart = paragraphs.findIndex((text) => /^pelatihan teknis$/i.test(text));
      const safetyStart = paragraphs.findIndex((text) => /^pelatihan keselamatan(?: kerja)?$/i.test(text));
      expect(technicalStart).toBeGreaterThanOrEqual(0);
      expect(safetyStart).toBeGreaterThan(technicalStart);
      const referencesStart = paragraphs.findIndex((text, index) => index > safetyStart && /^(referensi|sumber)$/i.test(text));
      expect(training[0].blocks.map((block) => block.text)).toEqual(paragraphs.slice(technicalStart + 1, safetyStart).map((text) => text.replace(/:$/, "")));
      expect(training[1].blocks.map((block) => block.text)).toEqual(paragraphs.slice(safetyStart + 1, referencesStart < 0 ? undefined : referencesStart).map((text) => text.replace(/:$/, "")));
      const software = careerMaterialGroups(body, "software", []);
      expect(software.length).toBeGreaterThan(0);
      expect(software.every((group) => group.blocks.length > 0)).toBe(true);
      expect(software.flatMap((group) => group.blocks).some((block) => /^[A-Z]\.\s/.test(block.text))).toBe(false);
      for (const section of ["competency", "education", "training", "software"] as const) {
        expect(JSON.stringify(careerMaterialGroups(body, section, []))).not.toContain("Informasi Utama");
      }
    });
  }
});
