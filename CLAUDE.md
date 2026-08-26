# MVIP — MineVision Intelligence Platform Indonesia

## AI Project Context (CLAUDE.md)

> File ini adalah context utama untuk AI coding assistant yang membaca `CLAUDE.md`.
> Baca file ini sebelum membuat kode, schema, atau struktur baru.
> Sumber kebenaran detail: `MVIP_PRD_Final.docx` untuk scope dan acceptance serta `MVIP_SRS.docx` untuk requirement, business rules, entity, dan cardinality.
> Implementasi aktif tetap mengikuti kode, configuration, migration, dan dokumentasi repository.
> Jangan mengambil keputusan stack, arsitektur, atau schema di luar yang telah disetujui tanpa konfirmasi Product Owner.

---

## 1. Ringkasan Produk

MVIP adalah platform web publik yang mengintegrasikan enam domain sektor pertambangan Indonesia:
**Edukasi, Industri, Komoditas, Karier, Data Intelligence, dan Data Ekonomi** — ditambah **MineBot AI** dan **Private Admin Dashboard**.

Prinsip produk yang wajib dipatuhi:

| Prinsip | Arti praktis |
|---|---|
| Source-first | Setiap data faktual publik harus memiliki sumber, periode, satuan, dan status. Jangan menampilkan angka tanpa sumber. |
| No fabricated data | Jangan mengisi data kosong dengan estimasi atau interpolasi otomatis. Tampilkan sebagai data tidak tersedia. |
| Public by default | Seluruh modul publik dapat diakses tanpa login. User login melalui Google bersifat opsional; Admin Dashboard tetap memerlukan role dan permission. |
| Progressive complexity | Tampilkan ringkasan lebih dahulu. Detail, grafik, sumber, dan relasi ditampilkan ketika dibutuhkan. |
| One source of truth | Indikator yang digunakan beberapa modul harus mengambil record yang sama, bukan salinan terpisah. |

---

## 2. Tech Stack

| Layer | Teknologi |
|---|---|
| Bahasa | TypeScript strict mode |
| Framework | Next.js App Router dengan Server Components, Server Actions, dan Route Handlers |
| UI | React, Tailwind CSS, dan shadcn/ui |
| Validasi | Zod untuk form, API payload, import, dan environment |
| Database | Supabase PostgreSQL sebagai single source of truth |
| ORM | Drizzle ORM dan Drizzle Kit |
| Auth | Supabase Auth untuk optional Google user login dan administrator |
| Authorization | Application RBAC dan PostgreSQL RLS |
| Storage | Supabase Storage |
| Search | PostgreSQL Full-Text Search dan `pg_trgm`; `pgvector` untuk MineBot jika telah diimplementasikan |
| Charts | Recharts |
| Map | MapLibre GL JS dan GeoJSON |
| AI | OpenAI API melalui server-side code |
| Vector store | `pgvector` pada Supabase PostgreSQL |
| CI/CD | GitHub Actions dan Vercel |
| Test | Vitest, React Testing Library, dan Playwright |
| Observability | Sentry dan Vercel Analytics |
| Edge dan security | Cloudflare setelah dikonfigurasi |
| Package manager | npm |

Teknologi yang belum tersedia pada `package.json`, configuration, atau kode dianggap sebagai target. Jangan menggunakannya sebelum tahap implementasinya dimulai.

---

## 3. Urutan Pembangunan

```text
1. UI dan UX layout
2. Project foundation Next.js, environment, lint, dan type-check
3. Database foundation, migration, seed, dan data ingestion
4. Content dan API integration
5. Unified user/admin authentication, RBAC, RLS, dan Admin CRUD
6. Global Search dan MineBot AI
7. Testing, security, monitoring, dan CI/CD
8. Production deployment
```

Tahap yang belum dikerjakan tidak boleh memblokir tahap sebelumnya yang sudah dapat digunakan.

Status dan prioritas implementasi terbaru mengikuti `ROADMAP.md` dan kondisi repository.

---

## 4. Data Governance — Publication Lifecycle

MineVision menggunakan dua status yang berbeda:

```text
Verification

  pending

  verified

  rejected

Publication

  draft

  in_review

  published

  archived
```

- Data faktual publik harus berstatus `verified` dan `published`.
- Record tanpa sumber, periode, atau satuan yang diwajibkan tidak boleh dipublikasikan.
- Perubahan status penting dicatat pada audit log setelah fitur audit tersedia.
- Record `archived` tetap disimpan untuk keterlacakan historis.

Public query harus menggunakan filter berikut secara default:

```text
verification_status = verified
publication_status = published
```

---

## 5. Business Rules Kunci

- Data faktual tidak boleh disajikan tanpa sumber.
- Data kosong tidak boleh diisi menggunakan asumsi otomatis.
- MineBot harus menjawab menggunakan knowledge base MineVision ketika pipeline RAG sudah tersedia.
- Pertanyaan di luar domain MineVision harus menghasilkan fallback, bukan jawaban karangan.
- Data nonpublik tidak boleh digunakan pada jawaban publik MineBot.
- Data yang dapat diunduh publik tidak boleh menyertakan data internal atau terbatas.
- Data dari periode berbeda tidak boleh digabungkan menjadi satu indikator tanpa keterangan periode.
- Data `actual`, `provisional`, `projection`, dan `revised` harus dibedakan.

---

## 6. Struktur Folder yang Disarankan

```text
/src
  /app
    /(public)
      /edukasi
      /industri
      /komoditas
      /karier
      /intelligence
      /ekonomi
      /search
    /admin
    /api
  /components
    /ui
    /charts
    /map
    /shared
  /db
    /schema
  /lib
  /services
  /types
/data
  /staging
/drizzle
/scripts
/public
```

Struktur aktual repository menjadi acuan. Jangan membuat folder baru jika tanggung jawab yang sama sudah memiliki lokasi.

---

## 7. Aturan untuk AI Saat Membuat atau Mengubah Kode

1. Sebelum membuat tabel atau entity baru, periksa `DATABASE_SCHEMA.md`, Drizzle schema aktif, dan migration yang tersedia. Entity pada SRS dapat bersifat konseptual dan tidak otomatis sudah diimplementasikan.
2. Data faktual publik harus memiliki relasi ke `sources`, periode, satuan, verification status, dan publication status sesuai kebutuhan domain.
3. Jangan hardcode data pertambangan seperti harga dan produksi pada komponen. Gunakan database atau seed yang tervalidasi.
4. Server Action dan Route Handler untuk data admin wajib memeriksa authentication dan authorization. RLS diterapkan sesuai policy yang sudah tersedia.
5. MineBot harus menggunakan retrieval. Jika retrieval kosong, gunakan fallback message yang jelas.
6. Ikuti urutan pembangunan pada bagian 3. Jangan membangun fitur future scope sebelum diminta.
7. Jangan mengganti stack tanpa alasan teknis dan persetujuan Product Owner.
8. Gunakan Server Component sebagai default dan Client Component hanya ketika membutuhkan interaksi browser.
9. Jangan melakukan commit, push, destructive Git command, atau destructive database operation kecuali diminta.
10. Setelah perubahan, jalankan pemeriksaan yang relevan.

Pemeriksaan dasar:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Untuk perubahan database atau ingestion:

```bash
npm run db:verify
```

---

## 8. Referensi

- `AGENTS.md` — aturan kerja utama seluruh coding agent.
- `MVIP_PRD_Final.docx` — scope, acceptance criteria, dan roadmap produk.
- `MVIP_SRS.docx` — requirement, business rules, entity, dan cardinality konseptual.
- `DATABASE_SCHEMA.md` — struktur database aktif.
- `ARCHITECTURE.md` — struktur sistem.
- `API_CONTRACTS.md` — endpoint dan contract API.
- `DATA_GOVERNANCE.md` — validation, verification, dan publication data.
- `ROADMAP.md` — status serta urutan implementasi.
