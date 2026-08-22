# MineVision Intelligence Platform Indonesia

MineVision adalah platform informasi pertambangan Indonesia yang menyediakan edukasi, informasi industri, komoditas, karier, data intelligence, informasi ekonomi, pencarian global, dan asisten AI.

## Fitur Utama

- Edukasi pertambangan
- Informasi industri
- Profil komoditas
- Informasi karier
- Dashboard data intelligence
- Informasi ekonomi pertambangan
- Global Search
- MineBot AI
- Private Admin Dashboard

Website publik dapat diakses tanpa login. Authentication digunakan untuk Admin Dashboard.

## Technology Stack

- Next.js
- TypeScript
- PostgreSQL
- Supabase
- Drizzle ORM
- Zod
- npm
- Vercel

Versi dependency aktif mengikuti `package.json`.

## Requirements

Pastikan perangkat telah memiliki:

- Node.js
- npm
- Git
- akses ke Supabase Development

## Local Setup

Clone repository dan masuk ke folder project:

```bash
git clone REPOSITORY_URL
cd minevision-platform
```

Install dependency:

```bash
npm install
```

Buat environment file dari template:

```powershell
Copy-Item ".env.example" ".env.local"
```

Isi variable yang diperlukan pada `.env.local`.

Jangan membagikan atau memasukkan `.env.local` ke Git.

Jalankan development server:

```bash
npm run dev
```

Buka:

```text
http://localhost:3000
```

## Environment Variables

Daftar variable tersedia di:

```text
.env.example
```

Penjelasan penggunaan environment terdapat di:

```text
ENVIRONMENT.md
```

Gunakan database development untuk pengembangan lokal. Jangan menggunakan database production untuk eksperimen atau pengujian.

## Main Commands

Menjalankan development server:

```bash
npm run dev
```

Memeriksa TypeScript:

```bash
npx tsc --noEmit
```

Menjalankan lint:

```bash
npm run lint
```

Membuat production build:

```bash
npm run build
```

Memverifikasi database dan data ingestion:

```bash
npm run db:verify
```

Perintah tambahan mengikuti scripts yang tersedia di `package.json`.

## Project Structure

```text
src/
    app/          Next.js routes dan layouts
    components/   Komponen antarmuka
    db/           Database schema dan query
    lib/          Utility dan konfigurasi
    types/        TypeScript types

data/
    staging/      Data sebelum diimpor
    seeds/        Data awal jika tersedia

scripts/          Script database dan data ingestion
public/           Static assets
```

Struktur aktual repository menjadi acuan utama apabila terdapat perubahan.

## Current API

Health check:

```http
GET /api/health
```

Intelligence production:

```http
GET /api/v1/intelligence/production
```

Contoh:

```http
GET /api/v1/intelligence/production?commodity=batubara&fromYear=2019&toYear=2025
```

Daftar endpoint dan contract lengkap terdapat di `API_CONTRACTS.md`.

## Data Rules

Data faktual harus:

- memiliki sumber yang dapat diverifikasi;
- membedakan actual dan projection;
- melalui validasi sebelum diimpor;
- melalui verifikasi sebelum dipublikasikan;
- tidak diubah langsung pada database production.

Aturan lengkap terdapat di `DATA_GOVERNANCE.md`.

## Development Workflow

Gunakan alur kerja berikut:

1. buat atau gunakan feature branch;
2. lakukan perubahan sesuai ruang lingkup;
3. jalankan pemeriksaan yang relevan;
4. periksa perubahan dengan Git;
5. commit setelah pemeriksaan berhasil;
6. buat Pull Request ke `main`.

Pemeriksaan minimum sebelum Pull Request:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Untuk perubahan database atau ingestion, jalankan juga:

```bash
npm run db:verify
```

## Documentation

| Dokumen | Isi |
|---|---|
| `AGENTS.md` | Aturan kerja coding agent |
| `ARCHITECTURE.md` | Struktur dan hubungan sistem |
| `DATABASE_SCHEMA.md` | Struktur database |
| `API_CONTRACTS.md` | Kontrak API |
| `ENVIRONMENT.md` | Environment dan konfigurasi |
| `CONVENTIONS.md` | Konvensi coding |
| `DATA_GOVERNANCE.md` | Pengelolaan dan kualitas data |
| `RAG_PIPELINE.md` | MineBot dan retrieval pipeline |
| `SECURITY.md` | Aturan keamanan |
| `ROADMAP.md` | Rencana pengembangan |

Baca hanya dokumen yang berkaitan dengan pekerjaan yang sedang dilakukan.

## Security

- Jangan commit secret.
- Jangan mengirim database credential ke browser.
- Jangan mengekspos service-role key.
- Validasi seluruh input eksternal.
- Terapkan authentication dan authorization pada Admin Dashboard.
- Jangan menampilkan error internal kepada pengguna publik.

Detail keamanan terdapat di `SECURITY.md`.

## Deployment

Target deployment MineVision adalah Vercel.

Deployment production hanya dilakukan setelah:

- type checking berhasil;
- lint berhasil;
- build berhasil;
- migration telah diperiksa;
- environment production tersedia;
- fitur utama telah diverifikasi.

## Project Status

MineVision masih dalam tahap pengembangan aktif.

Status fitur dan rencana implementasi selanjutnya dicatat pada `ROADMAP.md`.

## License

Status lisensi project belum ditentukan.