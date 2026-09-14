// Curated against the canonical public slugs. These links express editorial
// relevance only; they do not create new database relationships.
export const educationRelatedSlugs: Record<string, readonly string[]> = {
  "pengertian-pertambangan": ["tahapan-kegiatan-pertambangan", "metode-penambangan", "istilah-pertambangan"],
  "tahapan-kegiatan-pertambangan": ["pengertian-pertambangan", "metode-penambangan", "keselamatan-dan-kesehatan-kerja"],
  "metode-penambangan": ["tahapan-kegiatan-pertambangan", "alat-berat-tambang", "keselamatan-dan-kesehatan-kerja"],
  "alat-berat-tambang": ["metode-penambangan", "keselamatan-dan-kesehatan-kerja", "istilah-pertambangan"],
  "keselamatan-dan-kesehatan-kerja": ["tahapan-kegiatan-pertambangan", "metode-penambangan", "alat-berat-tambang"],
  "istilah-pertambangan": ["pengertian-pertambangan", "tahapan-kegiatan-pertambangan", "keselamatan-dan-kesehatan-kerja"],
};

export const careerEducationRelations: Record<string, string> = {
  "eksplorasi-dan-geologi": "tahapan-kegiatan-pertambangan",
  "perencanaan-dan-rekayasa-tambang": "metode-penambangan",
  "operasi-dan-produksi-tambang": "tahapan-kegiatan-pertambangan",
  "survei-gis-dan-geospasial": "tahapan-kegiatan-pertambangan",
  "pengolahan-mineral-dan-metalurgi": "tahapan-kegiatan-pertambangan",
  "keselamatan-kesehatan-dan-tanggap-darurat": "keselamatan-dan-kesehatan-kerja",
  "lingkungan-dan-keberlanjutan": "keselamatan-dan-kesehatan-kerja",
  "pemeliharaan-dan-keandalan-peralatan": "alat-berat-tambang",
  "logistik-rantai-pasok-dan-pengadaan": "alat-berat-tambang",
  "data-teknologi-informasi-dan-otomasi": "istilah-pertambangan",
  "keuangan-komersial-dan-manajemen": "pengertian-pertambangan",
  "legal-perizinan-dan-kepatuhan": "pengertian-pertambangan",
  "sumber-daya-manusia-dan-administrasi": "pengertian-pertambangan",
};
