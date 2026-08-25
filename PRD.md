# MineVision Intelligence Platform Indonesia

## Product Requirements Document

| Field            | Detail                                            |
| ---------------- | ------------------------------------------------- |
| Product          | MineVision Intelligence Platform Indonesia (MVIP) |
| Document         | Product Requirements Document                     |
| Version          | 2.0 Draft                                         |
| Status           | Planning Review                                   |
| Product Owner    | Muhammad Fachri Athallah Sofyan                   |
| Last Updated     | 25 August 2026                                    |
| Primary Language | Bahasa Indonesia                                  |

> Dokumen ini menjadi sumber utama untuk tujuan produk, ruang lingkup, MVP, kebutuhan teknis tingkat produk, dan metrik keberhasilan MineVision. Detail arsitektur, UI/UX, database, dan aturan engineering dipelihara secara terpisah dalam `ARCHITECTURE.md`, `DESIGN.md`, `SCHEMA.md`, dan `RULES.md`.

---

## 1. Product Overview

MineVision Intelligence Platform Indonesia (MVIP) adalah platform web publik yang mengintegrasikan edukasi, informasi industri, komoditas, karier, Data Intelligence, dan Data Ekonomi sektor pertambangan Indonesia dalam satu sistem yang terstruktur dan dapat ditelusuri sumbernya.

MineVision membantu pelajar, akademisi, pencari kerja, pelaku industri, dan masyarakat umum memahami keterkaitan antara konsep pertambangan, komoditas, perusahaan, wilayah, produksi, harga, fasilitas pengolahan, indikator ekonomi, regulasi, dan profesi pertambangan.

Platform tidak dimaksudkan untuk menggantikan sumber resmi. MineVision berfungsi sebagai lapisan kurasi, penyajian, eksplorasi, dan interpretasi atas informasi yang berasal dari sumber kredibel.

### 1.1 Problem Statement

Informasi pertambangan Indonesia tersebar pada berbagai publikasi pemerintah, laporan perusahaan, dokumen regulasi, spreadsheet, dan sumber lainnya. Format, cakupan, periode, satuan, serta kualitas metadata pada sumber tersebut tidak selalu seragam.

Kondisi tersebut menimbulkan beberapa permasalahan:

- Pengguna harus berpindah antar-sumber untuk memahami satu topik.
- Hubungan antara data produksi, wilayah, perusahaan, ekonomi, dan karier sulit ditelusuri.
- Data numerik sering ditampilkan tanpa konteks sumber, periode, satuan, atau status validasi.
- Dokumen panjang sulit dipahami oleh pengguna nonspesialis.
- Informasi yang belum diverifikasi berisiko dianggap sebagai fakta publik.
- Sistem pencarian dan tanya jawab umum belum terhubung dengan knowledge base pertambangan Indonesia yang terkurasi.

### 1.2 Product Proposition

MineVision menyediakan pengalaman eksplorasi terpadu dengan:

- konten edukatif yang terstruktur;
- direktori komoditas, perusahaan, dan karier;
- dashboard Data Intelligence dan Data Ekonomi;
- katalog fasilitas smelter;
- sumber dan periode data yang dapat ditelusuri;
- pencarian lintas modul;
- MineBot AI yang menggunakan knowledge base MineVision;
- private admin dashboard untuk pengelolaan, verifikasi, dan publikasi data.

---

## 2. Product Goals

### G1. Unified Mining Information

Menyediakan satu pintu akses untuk informasi pertambangan Indonesia yang sebelumnya tersebar pada berbagai dokumen dan sumber.

### G2. Traceable and Trustworthy Data

Memastikan informasi faktual publik memiliki sumber, periode, satuan jika relevan, serta status verifikasi dan publikasi yang jelas.

### G3. Accessible Knowledge

Mengubah konten dan dataset yang kompleks menjadi pengalaman yang mudah dipahami melalui ringkasan, tabel, grafik, peta, filter, pencarian, dan penjelasan kontekstual.

### G4. Connected Exploration

Menghubungkan edukasi, komoditas, perusahaan, wilayah, karier, Data Intelligence, dan Data Ekonomi agar pengguna dapat berpindah dari informasi umum ke detail terkait tanpa mengalami dead end.

### G5. Governed Publication

Menyediakan workflow yang memastikan data non-final tidak dapat muncul pada website atau API publik sebelum melewati verifikasi dan persetujuan publikasi.

### G6. Sustainable Product Foundation

Membangun fondasi aplikasi yang modular, aman, dapat diuji, dan dapat dikembangkan bertahap tanpa mengulang struktur inti.

### G7. Grounded AI Assistance

Menyediakan MineBot AI yang membantu pengguna memahami informasi MineVision melalui jawaban berbasis knowledge base, citation, disclaimer, dan fallback yang transparan.

### 2.1 Product Principles

| Principle              | Product Application                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------- |
| Source-first           | Data faktual publik harus dapat ditelusuri kembali ke sumbernya.                          |
| No fabricated data     | Nilai yang tidak tersedia tidak boleh dibuat atau disajikan sebagai fakta.                |
| Public by default      | Konten publik dapat diakses tanpa registrasi atau login.                                  |
| Governed publication   | Hanya data verified dan published yang dapat muncul secara publik.                        |
| Progressive complexity | Ringkasan ditampilkan terlebih dahulu, kemudian detail dan sumber.                        |
| One source of truth    | Informasi yang sama harus menggunakan record terkontrol yang konsisten.                   |
| Accessible by design   | Fitur utama harus dapat digunakan pada desktop dan perangkat mobile.                      |
| Human-controlled AI    | MineBot membantu interpretasi dan tidak menggantikan keputusan manusia atau sumber resmi. |

---

## 3. Product Scope

### 3.1 Public Website Scope

#### 3.1.1 Home

- Menjelaskan identitas dan nilai utama MineVision.
- Memberikan akses ke seluruh modul utama.
- Menampilkan ringkasan informasi dan data prioritas.
- Menyediakan entry point menuju Global Search dan MineBot AI.

#### 3.1.2 Edukasi Pertambangan

- Pengertian pertambangan.
- Tahapan kegiatan pertambangan.
- Metode penambangan.
- Alat berat pertambangan.
- Keselamatan dan Kesehatan Kerja.
- Istilah pertambangan.
- Navigasi menuju topik, komoditas, atau karier terkait.

#### 3.1.3 Industri Pertambangan

- Direktori perusahaan pertambangan.
- Profil dan sejarah perusahaan.
- Komoditas utama.
- Wilayah operasi.
- Informasi produksi dan kontribusi ketika tersedia.
- Teknologi pertambangan.
- Hubungan menuju komoditas, wilayah, dan data terkait.

#### 3.1.4 Data Komoditas

- Mineral logam.
- Mineral non-logam.
- Komoditas energi.
- Identitas dan karakteristik komoditas.
- Jenis dan metode penambangan.
- Kegunaan.
- Wilayah penghasil.
- Cadangan dan produksi ketika tersedia.
- Perusahaan terkait.
- Dampak lingkungan.
- Sumber dan periode informasi.

#### 3.1.5 Data Karier

- Tiga belas kategori profesi pertambangan.
- Deskripsi profesi.
- Ruang lingkup pekerjaan.
- Kompetensi.
- Pendidikan.
- Perangkat lunak.
- Pelatihan teknis dan keselamatan.
- Referensi dan hubungan menuju modul terkait.

#### 3.1.6 Data Intelligence

- Eksplorasi data produksi komoditas.
- Filter komoditas dan periode.
- Visualisasi dengan satuan yang konsisten.
- Metadata sumber, periode, status, dan tipe record.
- Harga domestik berdasarkan standar yang sesuai ketika data tervalidasi tersedia.
- Katalog fasilitas smelter.
- Filter smelter berdasarkan komoditas, lokasi, tipe, dan status.
- Ringkasan dan detail fasilitas.
- Peta untuk record yang memiliki koordinat tervalidasi.

#### 3.1.7 Data Ekonomi

- PDB pertambangan.
- Investasi pertambangan.
- Ekspor minerba.
- Hilirisasi mineral.
- Kebijakan pemerintah.
- Grafik, indikator, dan filter ketika data tervalidasi tersedia.
- Empty state yang informatif apabila data belum dapat dipublikasikan.
- Citation dan periode data.

#### 3.1.8 Global Search

- Pencarian lintas modul.
- Pengelompokan hasil berdasarkan kategori.
- Tautan menuju halaman detail yang valid.
- Filter hasil dasar.
- Kondisi tidak ada hasil.

#### 3.1.9 MineBot AI

- Tanya jawab dalam ruang lingkup pengetahuan MineVision.
- Jawaban berdasarkan knowledge base yang disetujui.
- Citation ketika metadata sumber tersedia.
- Tautan menuju konten pendukung.
- Disclaimer.
- Fallback untuk pertanyaan yang tidak didukung atau memiliki konteks tidak memadai.

#### 3.1.10 About dan Supporting Pages

- Informasi mengenai MineVision.
- Tujuan dan batas penggunaan platform.
- Metodologi dan sumber data tingkat umum.
- Privacy information.
- Error dan not-found pages.

### 3.2 Private Admin Scope

- Administrator authentication.
- Protected admin routes.
- Role and permission enforcement.
- Dashboard ringkasan operasional.
- Pengelolaan konten dan data.
- Pengelolaan sumber dan citation.
- Import data terkontrol.
- Validasi input dan relasi.
- Verification workflow.
- Publication workflow.
- Archive workflow.
- Audit log untuk tindakan penting.
- Monitoring status data dan kegagalan proses.

### 3.3 Platform Scope

- Public API yang terversi.
- Relational database sebagai sumber data utama.
- File dan media storage dengan kebijakan akses.
- Search index.
- AI retrieval index.
- Development, preview, dan production environments.
- Automated testing dan continuous integration.
- Logging, error monitoring, dan performance monitoring.
- Backup dan recovery preparation.
- Security controls pada aplikasi, database, API, dan deployment.

### 3.4 Out of Scope for Initial Product Release

- Registrasi dan login pengguna publik.
- Profil pengguna publik.
- Bookmark dan personalisasi.
- Riwayat percakapan MineBot yang tersimpan untuk pengguna publik.
- Native Android atau iOS application.
- Bahasa Inggris sebagai bahasa antarmuka awal.
- Real-time market or government feeds tanpa sumber resmi yang stabil.
- Automated publication tanpa human review.
- Estimasi otomatis yang disajikan sebagai data faktual.
- Fitur transaksi, investasi, trading, atau rekomendasi finansial.
- Keputusan hukum, keselamatan, atau operasional yang hanya bergantung pada MineVision.

### 3.5 Conditional Scope

Fitur berikut hanya ditampilkan apabila data pendukungnya memenuhi persyaratan kualitas:

- Peta smelter membutuhkan koordinat yang tervalidasi.
- Grafik time-series membutuhkan observasi waktu yang valid dan konsisten.
- Perbandingan data membutuhkan satuan dan definisi indikator yang kompatibel.
- Investasi dan ekspor hanya muncul sebagai data publik setelah verified dan published.
- MineBot hanya menggunakan konten yang diizinkan sebagai knowledge base publik.

---

## 4. Minimum Viable Product

### 4.1 MVP Objective

MVP MineVision harus membuktikan bahwa platform dapat menyajikan informasi pertambangan Indonesia yang terhubung, dapat ditelusuri sumbernya, aman dari publikasi data non-final, dan dapat digunakan melalui alur publik serta admin minimum.

### 4.2 MVP Public Experience

MVP mencakup:

- Home dan About.
- Navigasi publik yang responsive.
- Halaman utama enam kelompok informasi: Edukasi, Industri, Komoditas, Karier, Intelligence, dan Ekonomi.
- List dan detail untuk konten prioritas yang telah disiapkan.
- Data Intelligence produksi menggunakan record verified dan published.
- Dashboard PDB pertambangan 2019–2025.
- Katalog fasilitas smelter yang telah verified dan published.
- Informative empty state untuk investasi dan ekspor jika record belum dipublikasikan.
- Source, period, unit, record type, dan status yang relevan.
- Global Search dasar lintas konten publik.
- MineBot AI beta yang menggunakan approved MineVision knowledge base.
- Loading, empty, error, and not-found states.
- Tampilan responsive dan accessibility baseline.

### 4.3 MVP Admin Experience

MVP admin mencakup:

- Administrator login.
- Protected admin layout and routes.
- Administrator role validation.
- Tampilan daftar dan detail record prioritas.
- Create and update untuk konten/data prioritas.
- Pengelolaan sumber data.
- Perubahan verification status.
- Perubahan publication status.
- Pencegahan publikasi record yang belum memenuhi field wajib.
- Audit log untuk login, create, update, verify, publish, archive, dan tindakan sensitif lainnya.

### 4.4 MVP Search and MineBot

Global Search minimum harus:

- mencari konten publik;
- mengelompokkan hasil berdasarkan modul;
- mengarahkan pengguna ke detail yang valid;
- menampilkan no-result state.

MineBot AI beta minimum harus:

- mengambil konteks dari knowledge base MineVision;
- tidak menggunakan record non-publik sebagai fakta publik;
- menyertakan citation jika tersedia;
- memberikan fallback jika konteks tidak memadai;
- menampilkan disclaimer;
- memiliki pembatasan penggunaan dan error handling.

### 4.5 MVP Data Baseline

MVP menggunakan data yang sudah melalui gate publikasi. Pada checkpoint penyusunan dokumen ini:

- PDB pertambangan memiliki 7 record verified/published untuk 2019–2025.
- Smelter memiliki 7 fasilitas verified/published dan 2 fasilitas pending/draft.
- Investasi pertambangan memiliki 14 record pending/draft.
- Ekspor minerba memiliki 49 record pending/draft.

Record pending/draft tetap menjadi bagian database dan admin workflow, tetapi tidak dihitung sebagai data publik MVP sebelum statusnya memenuhi persyaratan publikasi.

### 4.6 MVP Completion Criteria

MVP dinyatakan selesai apabila:

- seluruh fitur Must Have telah memenuhi acceptance criteria;
- seluruh priority public flows dapat digunakan end-to-end;
- admin publication flow bekerja end-to-end;
- data publik mempertahankan source dan period metadata;
- tidak ada data non-final yang bocor melalui UI atau API;
- Global Search dasar bekerja pada konten publik;
- MineBot beta memenuhi grounding, citation, fallback, dan disclaimer requirements;
- testing, security, accessibility, performance, monitoring, dan deployment gates terpenuhi;
- production environment dapat dioperasikan dan dipulihkan;
- Product Owner memberikan persetujuan rilis.

### 4.7 Deferred after MVP

- Public user accounts.
- Bookmark dan personalization.
- Persistent public chat history.
- Advanced comparison and data export.
- Automated content recommendation.
- Career recommendation engine.
- Quiz and learning progress.
- English localization.
- Native mobile application.
- Advanced regional and ESG analytics.
- Automated data synchronization yang belum memiliki sumber stabil.

---

## 5. Technical Requirements

Bagian ini menetapkan kebutuhan teknis tingkat produk. Detail keputusan komponen, struktur folder, aliran data, deployment topology, dan implementation pattern dijelaskan dalam `ARCHITECTURE.md`.

### TR-01. Application Platform

- Aplikasi harus menggunakan arsitektur web full-stack yang mendukung server rendering, interactive client components, route handlers, dan responsive delivery.
- Bahasa utama aplikasi, API, validation, dan testing adalah TypeScript.
- Implementasi saat ini menggunakan Next.js App Router dan React.
- Halaman publik harus dapat digunakan tanpa autentikasi.
- Halaman admin harus dilindungi oleh authentication dan authorization.

### TR-02. User Interface

- UI harus responsive pada mobile, tablet, dan desktop.
- Komponen umum harus dapat digunakan kembali.
- Loading, empty, error, success, and not-found states harus ditangani secara eksplisit.
- Grafik harus menampilkan label, unit, periode, sumber, dan tooltip yang relevan.
- Data dengan satuan tidak kompatibel tidak boleh dijumlahkan atau dibandingkan secara menyesatkan.
- UI harus mengikuti accessibility baseline yang ditentukan dalam `DESIGN.md` dan `RULES.md`.

### TR-03. Data Storage

- PostgreSQL menjadi relational source of truth untuk data terstruktur.
- Schema database harus dikelola melalui migration versioning.
- Relasi, constraints, indexes, dan Row Level Security harus didefinisikan secara eksplisit.
- Data numerik harus mempertahankan unit, periode, source, dan status yang relevan.
- Dokumen atau media disimpan melalui storage dengan access policy yang sesuai.
- Struktur dan lifecycle data dijelaskan dalam `SCHEMA.md`.

### TR-04. Data Governance

- Public visibility memerlukan `verification_status = verified` dan `publication_status = published`.
- Public API dan server-side data access harus menerapkan visibility gate.
- Data pending, rejected, draft, in-review, atau archived tidak boleh keluar melalui public endpoints kecuali ada aturan historis yang disetujui.
- Missing values tidak boleh digantikan dengan nilai buatan.
- Citation dan provenance metadata tidak boleh dihapus dari record faktual.
- Tindakan administratif penting harus dapat diaudit.

### TR-05. API

- Public endpoint harus menggunakan versioned route, seperti `/api/v1`.
- Query dan payload harus divalidasi pada server.
- API harus menggunakan response structure dan error format yang konsisten.
- Query tidak valid harus menghasilkan HTTP 400.
- Server error harus ditangani tanpa mengekspos secret atau internal database detail.
- Cache policy harus disesuaikan dengan sifat data dan status publikasinya.
- API contract detail dijelaskan dalam `ARCHITECTURE.md` dan `RULES.md`.

### TR-06. Search

- Global Search harus mengindeks hanya konten yang dapat diakses pengguna terkait.
- Exact filtering dan full-text search harus tersedia untuk kebutuhan pencarian dasar.
- Search result harus mengarah ke canonical detail page.
- Search tidak boleh mengungkap draft atau record non-publik.

### TR-07. MineBot AI

- MineBot menggunakan Retrieval-Augmented Generation.
- Retrieval publik hanya menggunakan knowledge base yang telah disetujui.
- API key dan credential AI tidak boleh dikirim ke browser.
- Jawaban faktual harus grounded pada konteks yang ditemukan.
- Citation ditampilkan ketika metadata tersedia.
- Sistem harus memiliki fallback untuk konteks yang lemah, tidak tersedia, atau di luar ruang lingkup.
- Prompt injection, data poisoning, excessive usage, dan disclosure of secrets harus dipertimbangkan dalam kontrol keamanan.
- Provider dan model harus dapat dikonfigurasi melalui environment configuration.

### TR-08. Authentication and Authorization

- Autentikasi hanya diwajibkan untuk administrator pada MVP.
- Authorization harus diterapkan pada application layer dan database layer bila relevan.
- Route protection tidak boleh hanya bergantung pada UI hiding.
- Session dan credential harus dikelola secara aman.
- Tindakan sensitif harus dicatat dalam audit log.

### TR-09. Security

- Secret hanya disimpan melalui protected environment configuration.
- Input harus divalidasi dan output harus ditangani untuk mencegah injection dan cross-site scripting.
- Admin, Search, dan MineBot endpoint harus mendukung rate limiting.
- Security headers harus diterapkan pada production.
- Dependency, source code, dan secret scanning harus menjadi bagian release checks.
- Tidak boleh ada critical atau high-severity vulnerability yang belum ditangani pada release.

### TR-10. Quality Assurance

- Business rules dan validation logic harus memiliki automated tests.
- Priority API routes harus memiliki route tests.
- Priority public dan admin flows harus memiliki end-to-end coverage sebelum production.
- Type checking, tests, lint, dan production build harus berhasil sebelum merge atau release.
- Database migration dan public visibility behavior harus dapat diverifikasi.
- Regression yang membocorkan data non-publik harus dianggap sebagai release blocker.

### TR-11. Performance and Reliability

- Priority pages harus memenuhi target Core Web Vitals pada kondisi production yang representatif.
- Public read operations harus menggunakan caching ketika aman.
- Query database harus menggunakan filter dan index yang sesuai.
- External service failure harus menghasilkan fallback atau error state yang dapat dipahami.
- Sistem harus menyediakan health check dan error monitoring.
- Production release harus memiliki backup dan rollback preparation.

### TR-12. Deployment and Operations

- Source code dikelola menggunakan Git dan GitHub.
- Perubahan fitur dilakukan melalui branch dan pull request.
- Preview deployment digunakan untuk memeriksa perubahan sebelum production.
- Development dan production database harus terpisah.
- Production deployment harus menggunakan HTTPS dan protected secrets.
- Monitoring, logging, migration procedure, backup, dan recovery procedure harus tersedia.

### 5.1 Current Technical Baseline

Baseline implementasi yang sudah digunakan:

| Area                   | Baseline                               |
| ---------------------- | -------------------------------------- |
| Language               | TypeScript                             |
| Framework              | Next.js 16 App Router                  |
| UI                     | React, Tailwind CSS                    |
| Validation             | Zod                                    |
| Database               | Supabase PostgreSQL                    |
| ORM and migration      | Drizzle ORM, Drizzle Kit               |
| Public API             | Next.js Route Handlers under `/api/v1` |
| Unit and route testing | Vitest                                 |
| Source control         | Git and GitHub                         |
| Deployment target      | Vercel                                 |

Technology not yet implemented remains a planning baseline until it is validated in `ARCHITECTURE.md`.

---

## 6. Success Metrics

### 6.1 Product and Content Metrics

| ID    | Metric                                                 | MVP Target                        | Measurement                    |
| ----- | ------------------------------------------------------ | --------------------------------- | ------------------------------ |
| SM-01 | Priority public modules accessible                     | 100%                              | Release navigation audit       |
| SM-02 | Priority user flows completed without blocker          | 100%                              | Acceptance and E2E test report |
| SM-03 | Public factual records with required source and period | 100%                              | Release data audit             |
| SM-04 | Broken canonical links in priority flows               | 0                                 | Link and navigation test       |
| SM-05 | Required empty, loading, and error states implemented  | 100% of priority data experiences | UI acceptance audit            |

### 6.2 Data Governance Metrics

| ID    | Metric                                                        | MVP Target | Measurement                        |
| ----- | ------------------------------------------------------------- | ---------- | ---------------------------------- |
| SM-06 | Non-final records exposed publicly                            | 0          | API, UI, and database policy tests |
| SM-07 | Public records without required provenance                    | 0          | Dataset verification report        |
| SM-08 | Published numerical records without applicable unit or period | 0          | Data quality audit                 |
| SM-09 | Priority administrative publication actions recorded          | 100%       | Audit log test                     |
| SM-10 | Public visibility regression                                  | 0          | Automated regression suite         |

### 6.3 Performance and Accessibility Metrics

| ID    | Metric                         | MVP Target                                 | Measurement                                         |
| ----- | ------------------------------ | ------------------------------------------ | --------------------------------------------------- |
| SM-11 | Largest Contentful Paint       | p75 ≤ 2.5 seconds on priority public pages | Production or representative performance monitoring |
| SM-12 | Interaction to Next Paint      | p75 ≤ 200 milliseconds                     | Production or representative performance monitoring |
| SM-13 | Cumulative Layout Shift        | p75 ≤ 0.1                                  | Production or representative performance monitoring |
| SM-14 | Accessibility score            | ≥ 90 on priority page templates            | Automated audit plus manual review                  |
| SM-15 | Critical accessibility defects | 0 at release                               | Accessibility acceptance report                     |

### 6.4 Quality and Security Metrics

| ID    | Metric                                               | MVP Target | Measurement                    |
| ----- | ---------------------------------------------------- | ---------- | ------------------------------ |
| SM-16 | Required CI checks passing                           | 100%       | CI status                      |
| SM-17 | Automated test failures at release                   | 0          | Test report                    |
| SM-18 | Critical or high-severity unresolved vulnerabilities | 0          | Security scan and review       |
| SM-19 | Secrets committed to repository                      | 0          | Secret scanning                |
| SM-20 | Priority authorization and RLS scenarios passing     | 100%       | Security and integration tests |

### 6.5 Search and MineBot Metrics

| ID    | Metric                                                                    | MVP Target | Measurement               |
| ----- | ------------------------------------------------------------------------- | ---------- | ------------------------- |
| SM-21 | Curated search queries returning a relevant result in top five            | ≥ 80%      | Search evaluation set     |
| SM-22 | In-scope MineBot evaluation questions answered without unsupported claims | ≥ 85%      | Curated AI evaluation set |
| SM-23 | Supported factual MineBot answers with citation when metadata exists      | 100%       | AI evaluation log         |
| SM-24 | Unsupported or low-context questions receiving fallback                   | 100%       | Negative evaluation set   |
| SM-25 | MineBot responses exposing non-public records or secrets                  | 0          | AI security evaluation    |

### 6.6 Operational Metrics

| ID    | Metric                                              | MVP Target    | Measurement                          |
| ----- | --------------------------------------------------- | ------------- | ------------------------------------ |
| SM-26 | Production health check after deployment            | Pass          | Release smoke test                   |
| SM-27 | Backup and recovery procedure documented            | 100% complete | Operational review                   |
| SM-28 | Rollback procedure validated for release            | Pass          | Release rehearsal or controlled test |
| SM-29 | Unhandled blocker-level production errors at launch | 0             | Error monitoring                     |
| SM-30 | Production environment secrets protected            | 100%          | Deployment configuration audit       |

### 6.7 Post-Launch Metrics

Adoption metrics seperti unique visitors, monthly active users, returning visitors, search usage, dashboard interaction, dan MineBot usage mulai diukur setelah production launch. Target numeriknya ditetapkan setelah tersedia baseline traffic yang cukup agar tidak menggunakan angka asumsi tanpa bukti.

---

## 7. MVP Product Acceptance

Product Owner dapat menyetujui MVP apabila seluruh kondisi berikut terpenuhi:

- scope MVP tidak memiliki blocker yang belum diselesaikan;
- success metrics yang dikategorikan sebagai release gate telah terpenuhi;
- data governance audit tidak menemukan data non-publik yang terekspos;
- priority flows dapat digunakan pada desktop dan mobile;
- administrator dapat mengelola lifecycle data prioritas;
- search dan MineBot memenuhi minimum quality gate yang disepakati;
- production deployment, monitoring, backup, dan rollback tersedia;
- tidak ada critical atau high-severity vulnerability yang belum ditangani;
- dokumentasi `ARCHITECTURE.md`, `DESIGN.md`, `SCHEMA.md`, dan `RULES.md` sesuai dengan implementasi final.

---

## 8. Document Boundaries

Untuk mencegah duplikasi dokumentasi:

- `PRD.md` menjelaskan apa yang dibangun, mengapa dibangun, ruang lingkup, MVP, kebutuhan teknis tingkat produk, dan ukuran keberhasilan.
- `ARCHITECTURE.md` menjelaskan bagaimana sistem dan komponennya disusun.
- `DESIGN.md` menjelaskan UI/UX, design system, interaction, dan accessibility behavior.
- `SCHEMA.md` menjelaskan struktur database, relasi, constraints, status, policies, dan data lifecycle.
- `RULES.md` menjelaskan aturan coding, Git, API, data governance, testing, security, dan release.

Jika detail implementasi berubah tanpa mengubah tujuan atau scope produk, pembaruan dilakukan pada dokumen teknis terkait dan tidak perlu memperluas PRD.
