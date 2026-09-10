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

Website publik dapat diakses tanpa login. MVP merencanakan optional user login melalui Google dan administrator login melalui akun email/password internal, dengan Supabase Auth sebagai identity provider tunggal dan role terpisah untuk melindungi Admin Dashboard.

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

Pipeline Career memakai manifest berisi tepat 13 kategori dan kontrak staging
yang tersedia. Jalankan dari root repository dengan konfigurasi development
`DATABASE_MIGRATION_URL` di `.env.local`:

```powershell
npm run data:validate:career -- data/staging/career/manifest.json
npm run data:preflight:career -- data/staging/career/manifest.json
npm run data:dry-run:career -- data/staging/career/manifest.json
```

Preflight dan dry-run membandingkan field serta natural key keenam tabel,
memeriksa struktur Drizzle terhadap katalog PostgreSQL, dan melaporkan rencana
insert/update/unchanged serta total per kategori. Keduanya memakai transaksi
`READ ONLY` yang selalu diakhiri `ROLLBACK`. Output menyertakan audit jenis
statement, transaction ID yang belum dialokasikan, dan fingerprint snapshot
sebelum/sesudah. Rencana dengan `passed: false` hanya diagnostik; import diblokir.
Konflik identitas source harus diselesaikan pada dataset melalui peninjauan
sumber, bukan dengan menimpa source bersama secara paksa.

Actual import membutuhkan flag eksplisit (hanya jalankan setelah preflight dan
dry-run lulus serta perubahan database diizinkan):

```powershell
npm run data:import:career -- data/staging/career/manifest.json --commit
npm run data:verify:career -- data/staging/career/manifest.json
```

Importer memakai satu transaksi serializable, upsert natural key, batch maksimal
300 record (juga dibatasi jumlah parameter), dan pemeriksaan ulang sebelum
commit. Record identik tidak dikirim ke writer; tidak ada delete/prune.
Kegagalan satu batch membatalkan seluruh transaksi. Verifier read-only memeriksa
field, missing/duplicate/unexpected key, source, dan lima section hanya untuk
13 content Career target. Data Career lain tidak diubah. Source dibaca berdasarkan
catalog manifest dan relasi target, sehingga tidak bergantung pada total global.

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

# MineVision Industry Metadata Import

## Penempatan file

Salin file ke lokasi berikut di root proyek `minevision-platform`:

| File paket ini                             | Lokasi proyek                              |
| ------------------------------------------ | ------------------------------------------ |
| `data/staging/industry/companies.json`     | `data/staging/industry/companies.json`     |
| `scripts/industry/import-industry-data.ts` | `scripts/industry/import-industry-data.ts` |
| `scripts/industry/verify-industry-data.ts` | `scripts/industry/verify-industry-data.ts` |

File `data/staging/industry/reports.json` yang sudah tersedia tetap digunakan dan tidak perlu diganti.

## Tambahan `package.json`

Tambahkan tiga properti berikut ke dalam objek `scripts` tanpa menghapus script yang sudah ada:

```json
{
  "data:dry-run:industry": "tsx scripts/industry/import-industry-data.ts",
  "data:import:industry": "tsx scripts/industry/import-industry-data.ts --commit",
  "data:verify:industry": "tsx scripts/industry/verify-industry-data.ts"
}
```

## Urutan menjalankan

```powershell
npm run data:dry-run:industry
npm run data:import:industry
npm run data:verify:industry
npm run db:verify
npx tsc --noEmit
git diff --check
```

Dry-run memvalidasi 12 perusahaan, 35 laporan, 12 logo, 35 objek Storage, dan kesesuaian ukuran file tanpa mengubah database.

Importer menggunakan satu transaksi database. Jika satu record gagal, seluruh perubahan dalam transaksi dibatalkan. Importer juga idempotent: data yang sama akan dilewati pada eksekusi berikutnya.

## Target hasil

| Data                            | Target |
| ------------------------------- | -----: |
| `industry_companies`            |     12 |
| `industry_reports`              |     35 |
| objek bucket `industry-reports` |     35 |

Freeport Indonesia memiliki dua laporan untuk 2024 dan 2025. Sebelas perusahaan lainnya masing-masing memiliki tiga laporan untuk 2023-2025.

Profil lengkap dalam dokumen Industri tersedia untuk 10 perusahaan. Bayan Resources dan Trimegah Bangun Persada tetap dibuat sebagai perusahaan terverifikasi agar laporan resminya memiliki foreign key yang valid, tetapi field profil yang belum tersedia dibiarkan `null` dan diberi catatan untuk pengayaan berikutnya.

## Intelligence — dataset kanonik versi 2.0 (belum diterapkan)

Pipeline Intelligence sekarang menerima `data/staging/intelligence/manifest.json`,
bukan bundle produksi legacy satu komoditas. Kontrak v1 tetap tersedia untuk audit,
tetapi CLI import tidak lagi menerima bundle tanpa identitas seri.

```powershell
npm run data:validate:intelligence -- data/staging/intelligence/manifest.json
npm run data:preflight:intelligence -- data/staging/intelligence/manifest.json
npm run data:dry-run:intelligence -- data/staging/intelligence/manifest.json
```

Preflight/dry-run memakai transaksi READ ONLY dengan ROLLBACK dan fingerprint
sebelum/sesudah. Missing schema dan konflik data menghasilkan exit code 1.
Importer memakai transaksi serializable, insert-only, parameter binding,
post-write verification, serta rollback otomatis bila gagal. Tanpa `--commit`,
CLI berhenti sebelum membuka koneksi. Source/nilai existing yang berbeda ditolak,
bukan ditimpa; pengayaan atau koreksi memerlukan keputusan terpisah.

Migration lokal 0020 belum dijalankan. Jangan menjalankan import atau deploy query
seri baru sebelum migration diuji pada PostgreSQL disposable dan disetujui.
Sepuluh konflik harga diselesaikan melalui `commodity_price_series`, bukan
production series. Migration membentuk seri legacy deterministic dan menjaga
nilai/status observation lama, termasuk HMA emas 2025 published. Tiga seri
kanonik baru menyimpan 10 observation dokumen final sebagai draft. HBA dan HMA
Nikel 2025 tidak mempunyai observation kanonik dan tidak fallback ke legacy.

Setelah prasyarat dan konflik diselesaikan, perintah verifikasi pasca-import adalah:

```powershell
npm run data:verify:intelligence -- data/staging/intelligence/manifest.json
npm run data:promote:intelligence -- data/staging/intelligence/manifest.json
```

Verifier menuntut tidak ada insert/konflik tersisa pada manifest. Observasi,
coverage, dan lokasi baru tetap draft; publikasi merupakan tahap terpisah.
Identitas seri kanonik sendiri ditandai public-default/verified/published agar
pilihan default eksplisit, tetapi tidak membuat observasi draft menjadi publik.
Promotion tanpa `--commit` selalu memakai transaksi READ ONLY dan ROLLBACK.
Promotion dengan `--commit` harus dilakukan secara terpisah setelah pre-check;
series serta observation kanonik dipromosikan atomik dan legacy tidak diubah.
