# MineVision Development Roadmap

Dokumen ini mencatat urutan pembangunan, status implementasi, milestone, dan target setiap tahap MineVision.

Detail teknis berada pada dokumen sesuai bidangnya dan tidak dijelaskan ulang di sini.

Terakhir diperbarui:

```text
23 Agustus 2026
```

## 1. Status Legend

| Status        | Keterangan                                |
| ------------- | ----------------------------------------- |
| `Completed`   | Tahap telah selesai dan diverifikasi      |
| `In Progress` | Sedang dikerjakan                         |
| `Next`        | Tahap berikutnya                          |
| `Planned`     | Akan dikerjakan setelah tahap sebelumnya  |
| `Blocked`     | Tidak dapat dilanjutkan karena dependency |
| `Deferred`    | Ditunda dan bukan prioritas saat ini      |

## 2. Development Stages

| Tahap | Fokus                                  | Status      |
| ----: | -------------------------------------- | ----------- |
|     1 | UI dan UX Layout                       | Completed   |
|     2 | Project Foundation                     | Completed   |
|     3 | Database dan Data Ingestion Foundation | Completed   |
|     4 | Content dan API Integration            | In Progress |
|     5 | Authentication dan Admin CRUD          | Planned     |
|     6 | Global Search dan MineBot AI           | Planned     |
|     7 | Testing, Security, dan CI/CD           | Planned     |
|     8 | Production Deployment                  | Planned     |

## 3. Stage 1 — UI and UX Layout

Status:

```text
Completed
```

Tujuan:

- menetapkan struktur halaman;
- menetapkan navigasi;
- menetapkan layout dasar;
- menetapkan identitas visual;
- membuat rancangan halaman utama.

Hasil:

- sitemap publik;
- user flow;
- public layout;
- header;
- footer;
- MineBot floating button;
- desain dasar halaman;
- font dan visual direction.

Keputusan utama:

- public website tidak membutuhkan login;
- Admin Dashboard bersifat private;
- Merriweather digunakan untuk judul besar;
- Lato digunakan untuk teks utama;
- tampilan menggunakan gaya tenang dan elegan.

## 4. Stage 2 — Project Foundation

Status:

```text
Completed
```

Tujuan:

- membuat repository yang bersih;
- membangun fondasi Next.js;
- menyiapkan struktur route;
- menyiapkan environment;
- menyiapkan lint dan build;
- menghapus ketergantungan dari mockup lama.

Hasil:

- Next.js App Router;
- TypeScript strict mode;
- public route group;
- shared public layout;
- environment validation;
- `.env.example`;
- repository GitHub;
- type checking berhasil;
- lint berhasil;
- production build berhasil.

## 5. Stage 3 — Database and Data Ingestion Foundation

Status:

```text
Completed
```

Tujuan:

- membangun database terstruktur;
- menetapkan master data;
- membuat migration;
- membuat validation;
- membuat ingestion pipeline;
- memastikan data dapat diimpor dengan aman.

Hasil:

- Supabase Development tersedia;
- PostgreSQL terhubung;
- Drizzle ORM dan Drizzle Kit tersedia;
- master sources tersedia;
- content foundation tersedia;
- master komoditas tersedia;
- measurement units tersedia;
- production data schema tersedia;
- price data schema tersedia;
- region data schema tersedia;
- production location schema tersedia;
- production citation schema tersedia;
- Row Level Security telah diaktifkan;
- Intelligence staging validation tersedia;
- database preflight tersedia;
- dry run tersedia;
- importer tersedia;
- import verification tersedia;
- importer idempotent;
- data produksi Batubara telah diimpor;
- database verification berhasil.

Completed milestone:

```text
Database foundation dan data ingestion foundation telah digabungkan ke main.
```

Exit criteria yang telah terpenuhi:

- Drizzle schema dan migration sinkron;
- database verification berhasil;
- ingestion pipeline dapat dijalankan;
- staging data tervalidasi;
- database reference tervalidasi;
- dry run berhasil;
- importer idempotent;
- hasil import dapat diverifikasi;
- data memiliki sumber;
- type check berhasil;
- lint berhasil;
- build berhasil.

## 6. Stage 4 — Content and API Integration

Status:

```text
In Progress
```

Tujuan:

- menghubungkan frontend dengan database;
- mengimplementasikan public API;
- mengganti data contoh dengan data tervalidasi;
- menampilkan konten dan data dari sumber kanonis;
- menyediakan loading, empty, dan error state.

Current progress:

- public health endpoint tersedia;
- public Intelligence production API tersedia;
- filter komoditas dan tahun tersedia;
- data produksi Batubara tersedia;
- actual dan projection tersedia pada data;
- Intelligence preview pada Home sedang diintegrasikan;
- production chart sedang dikembangkan;
- production preview section sedang dikembangkan.

Current branch:

```text
feat/intelligence-production-ui
```

Current files:

```text
src/features/home/components/intelligence-preview-chart.tsx

src/features/home/components/intelligence-preview-section.tsx
```

Current milestone:

```text
Menghubungkan Intelligence production preview pada Home dengan public production API.
```

### Stage 4 Implementation Order

1. Intelligence production preview;
2. Intelligence production detail;
3. commodity master integration;
4. domestic price integration;
5. production location integration;
6. Education content integration;
7. Industry content integration;
8. Commodity content integration;
9. Career content integration;
10. Economy content integration;
11. About content integration.

Urutan dapat disesuaikan jika terdapat dependency teknis, tetapi perubahan harus dicatat pada roadmap.

### Current API

```text
GET /api/health

GET /api/v1/intelligence/production
```

### Target API Stage 4

```text
GET /api/v1/commodities

GET /api/v1/intelligence/prices

GET /api/v1/intelligence/production-locations
```

### Stage 4 UI Requirements

Setiap halaman atau komponen data harus memiliki:

- loading state;
- empty state;
- error state;
- source citation;
- responsive layout;
- actual dan projection indicator;
- unit yang jelas;
- periode yang jelas.

### Stage 4 Exit Criteria

Stage 4 selesai jika:

- public page mengambil data dari sumber kanonis;
- data contoh telah dihapus dari fitur aktif;
- data faktual memiliki citation;
- actual dan projection dibedakan;
- public API hanya mengirim data yang boleh dipublikasikan;
- loading, empty, dan error state tersedia;
- content utama telah terintegrasi;
- type check berhasil;
- lint berhasil;
- build berhasil;
- integration test relevan berhasil.

## 7. Stage 5 — Authentication and Admin CRUD

Status:

```text
Planned
```

Tujuan:

- mengamankan Admin Dashboard;
- mengelola role dan permission;
- menyediakan CRUD terkontrol;
- membuat verification dan publication workflow;
- mencatat aktivitas administratif.

Scope:

- Supabase Auth;
- admin login;
- secure session;
- application RBAC;
- RLS policies;
- content CRUD;
- source CRUD;
- commodity CRUD;
- Intelligence CRUD;
- verification;
- publication;
- audit log.

Target roles:

```text
administrator

content_editor

data_editor

data_verifier

publisher
```

Exit criteria:

- public user tidak dapat mengakses admin;
- admin session diverifikasi pada server;
- mutation memiliki authorization;
- RLS policy telah diuji;
- record belum verified tidak dapat dipublikasikan;
- perubahan penting masuk audit log;
- Admin CRUD berhasil diuji.

## 8. Stage 6 — Global Search and MineBot AI

Status:

```text
Planned
```

### Global Search

Scope:

- pencarian seluruh modul publik;
- filter berdasarkan modul;
- result ranking;
- pagination;
- empty state;
- published content filtering;
- rate limiting.

Exit criteria:

- hanya konten publik yang muncul;
- query tervalidasi;
- hasil memiliki URL yang benar;
- performa pencarian telah diuji;
- rate limiting tersedia.

### MineBot AI

Scope:

- knowledge document;
- normalization;
- chunking;
- embedding;
- indexing;
- document retrieval;
- structured data retrieval;
- context assembly;
- answer generation;
- citation;
- fallback;
- evaluation.

Exit criteria:

- jawaban berdasarkan context;
- structured data berasal dari database;
- citation mendukung jawaban;
- actual dan projection dibedakan;
- fallback bekerja;
- prompt injection diuji;
- data nonpublik tidak muncul;
- rate limiting tersedia.

Detail MineBot berada di `RAG_PIPELINE.md`.

## 9. Stage 7 — Testing, Security, and CI/CD

Status:

```text
Planned
```

Tujuan:

- meningkatkan kualitas aplikasi;
- mengotomatisasi pemeriksaan;
- menguji keamanan;
- menyiapkan monitoring.

Scope:

- unit test;
- integration test;
- end-to-end test;
- API contract test;
- database test;
- RLS test;
- authorization test;
- ingestion test;
- RAG evaluation;
- dependency scanning;
- secret scanning;
- GitHub Actions;
- preview deployment;
- error monitoring;
- performance monitoring.

Minimum CI checks:

```text
Type check

Lint

Build

Automated test

Migration check

Secret scan
```

Exit criteria:

- pipeline berjalan pada Pull Request;
- test kritis berhasil;
- unauthorized access ditolak;
- secret tidak masuk build;
- dependency vulnerability ditinjau;
- error monitoring tersedia;
- preview deployment dapat diverifikasi.

## 10. Stage 8 — Production Deployment

Status:

```text
Planned
```

Tujuan:

- menyediakan MineVision kepada pengguna publik;
- memisahkan development dan production;
- memastikan sistem dapat dipantau dan dipulihkan.

Scope:

- Supabase Production;
- production migration;
- production environment;
- Vercel Production;
- custom domain;
- HTTPS;
- production security headers;
- backup;
- restore procedure;
- monitoring;
- smoke test;
- rollback plan.

Exit criteria:

- production database terpisah;
- environment variable lengkap;
- migration berhasil;
- build production berhasil;
- HTTPS aktif;
- public website dapat diakses;
- Admin Dashboard terlindungi;
- backup tersedia;
- restore procedure diuji;
- monitoring aktif;
- smoke test berhasil.

## 11. Deferred Scope

Fitur berikut tidak menjadi prioritas sebelum core platform selesai:

- akun pengguna publik;
- bookmark;
- komentar;
- forum;
- quiz;
- personal recommendation;
- mobile application;
- public content submission;
- social features;
- fitur komersial.

Deferred feature hanya dipindahkan ke tahap aktif setelah keputusan Product Owner.

## 12. Dependency Rules

| Tahap               | Dependency                               |
| ------------------- | ---------------------------------------- |
| Content integration | Database foundation                      |
| Admin CRUD          | Database dan authentication              |
| Global Search       | Published content                        |
| MineBot             | Published knowledge dan retrieval schema |
| CI/CD lengkap       | Build dan test commands                  |
| Production          | Seluruh critical feature terverifikasi   |

Tahap berikutnya dapat dimulai setelah dependency utamanya stabil.

Pekerjaan independen boleh berjalan paralel jika tidak mengubah contract yang belum stabil.

## 13. Priority Rules

Urutan prioritas:

1. correctness;
2. data integrity;
3. security;
4. core functionality;
5. usability;
6. performance;
7. enhancement.

Visual enhancement tidak boleh menghambat penyelesaian data dan fungsi utama.

## 14. Current Next Action

Langkah berikutnya:

1. menyelesaikan `intelligence-preview-chart.tsx`;
2. menyelesaikan `intelligence-preview-section.tsx`;
3. menghubungkan Intelligence preview dengan production API;
4. memeriksa mapping data produksi;
5. membedakan visual actual dan projection;
6. menambahkan loading state;
7. menambahkan empty state;
8. menambahkan error state;
9. memeriksa responsive layout;
10. menjalankan type check, lint, dan build;
11. membuat commit dokumentasi;
12. membuat commit Intelligence UI;
13. push branch;
14. membuat Pull Request ke `main`.

## 15. Roadmap Update Rules

Roadmap diperbarui jika:

- tahap selesai;
- tahap baru dimulai;
- milestone berubah;
- priority berubah;
- terdapat blocker;
- fitur ditunda;
- dependency berubah;
- production target berubah.

Setiap pembaruan minimal menyesuaikan:

- status;
- current progress;
- current milestone;
- next action;
- exit criteria jika diperlukan.

Detail implementasi tidak dimasukkan ke roadmap.

## 16. Definition of Done

Roadmap dianggap terpelihara jika:

- status sesuai kondisi repository;
- pekerjaan selesai dan target dibedakan;
- tahap aktif memiliki milestone;
- tindakan berikutnya jelas;
- dependency tercatat;
- deferred scope tidak dikerjakan tanpa keputusan;
- roadmap diperbarui setelah milestone selesai.
