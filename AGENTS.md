<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# MineVision Agent Instructions

Panduan kerja utama untuk AI coding agent dalam repository MineVision Intelligence Platform Indonesia.

## 1. Project Overview

MineVision adalah platform publik mengenai:

- edukasi pertambangan;
- industri dan komoditas;
- karier pertambangan;
- data intelligence;
- ekonomi pertambangan;
- Global Search;
- MineBot AI.

Seluruh konten publik tetap dapat digunakan tanpa login. MVP mendukung optional user account melalui Google atau registrasi email/password. Administrator memakai entry point Login yang sama, tetapi akunnya dibuat atau diundang secara internal dan memperoleh role melalui proses tepercaya. Seluruh identity menggunakan Supabase Auth; akses Admin Dashboard tetap memerlukan server-side role dan permission validation.

## 2. Technology Baseline

Gunakan teknologi yang sudah ditetapkan dalam repository:

- Next.js dengan App Router;
- TypeScript;
- PostgreSQL melalui Supabase;
- Drizzle ORM dan Drizzle Kit;
- Zod untuk runtime validation;
- npm sebagai package manager;
- Vercel sebagai deployment target.

Jangan mengganti teknologi utama tanpa persetujuan pengguna.

## 3. Source of Truth

Baca dokumen berdasarkan pekerjaan yang sedang dilakukan:

| Pekerjaan | Dokumen |
|---|---|
| Menjalankan project | `README.md` |
| Struktur sistem | `ARCHITECTURE.md` |
| Database | `DATABASE_SCHEMA.md` |
| API | `API_CONTRACTS.md` |
| Environment variable | `ENVIRONMENT.md` |
| Konvensi coding | `CONVENTIONS.md` |
| Pengelolaan data | `DATA_GOVERNANCE.md` |
| MineBot dan RAG | `RAG_PIPELINE.md` |
| Keamanan | `SECURITY.md` |
| Rencana pengembangan | `ROADMAP.md` |

Jangan membaca seluruh dokumen jika tidak berkaitan dengan tugas.

Jika dokumentasi berbeda dengan implementasi aktif, periksa kode dan jelaskan perbedaannya sebelum melakukan perubahan.

## 4. Working Rules

Sebelum mengubah kode:

1. pahami permintaan pengguna;
2. periksa file yang berkaitan;
3. periksa pola implementasi yang sudah digunakan;
4. identifikasi dampak perubahan;
5. buat perubahan sekecil dan sejelas mungkin.

Saat mengubah kode:

- gunakan TypeScript secara ketat;
- pertahankan struktur project;
- gunakan kembali komponen dan utility yang tersedia;
- hindari duplikasi;
- jangan melakukan refactor di luar ruang lingkup;
- jangan menambahkan dependency tanpa kebutuhan yang jelas;
- jangan mengubah public contract secara diam-diam.

## 5. Data Rules

Untuk data faktual MineVision:

- gunakan sumber yang dapat diverifikasi;
- bedakan data aktual, sementara, revisi, dan proyeksi;
- jangan membuat angka atau sumber;
- jangan memublikasikan data berstatus draft atau belum terverifikasi;
- pertahankan hubungan data dengan sumbernya.

Aturan lengkap berada di `DATA_GOVERNANCE.md`.

## 6. Security Rules

Agent tidak boleh:

- menulis secret ke source code;
- menampilkan database URL atau API key;
- memasukkan file `.env` ke Git;
- mengirim service-role key ke browser;
- mempercayai input pengguna tanpa validasi;
- melewati authentication atau authorization;
- menampilkan stack trace kepada public user.

Gunakan `.env.example` hanya untuk nama variable dan contoh yang aman.

Aturan lengkap berada di `SECURITY.md`.

## 7. Database Changes

Perubahan database harus:

- menggunakan Drizzle schema dan migration;
- mempertahankan foreign key dan constraint;
- tidak dilakukan langsung pada production;
- diperiksa dampaknya terhadap importer dan API;
- diperbarui pada `DATABASE_SCHEMA.md` jika contract berubah.

Jangan menghapus tabel, kolom, migration, atau data tanpa persetujuan pengguna.

## 8. API Changes

Perubahan API harus:

- memiliki input validation;
- menggunakan HTTP status yang sesuai;
- tidak membocorkan struktur internal;
- hanya mengembalikan data yang boleh dipublikasikan;
- mempertahankan compatibility dengan frontend;
- diperbarui pada `API_CONTRACTS.md` jika contract berubah.

## 9. Verification

Jalankan pemeriksaan yang relevan setelah perubahan.

Pemeriksaan dasar:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Untuk perubahan database atau ingestion:

npm run db:verify

Gunakan test tambahan yang tersedia untuk bagian yang diubah.

Jangan menyatakan pekerjaan selesai jika pemeriksaan yang relevan gagal.

## 10. Git Rules
- Periksa git status sebelum dan sesudah perubahan.
- Jangan mengubah atau menghapus pekerjaan pengguna yang tidak berkaitan.
- Jangan melakukan commit atau push kecuali diminta.
- Jangan menggunakan destructive Git command tanpa persetujuan.
- Gunakan commit message yang menjelaskan perubahan secara spesifik.

## 11. Documentation Rules

Dokumentasi harus:

- ringkas;
- sesuai implementasi;
- hanya membahas topik dokumen tersebut;
- tidak mengulang penjelasan dari dokumen lain;
- membedakan fitur yang sudah tersedia dan yang masih direncanakan.

Jangan membuat dokumen baru jika informasi masih dapat ditempatkan pada dokumen yang sudah ada.

## 12. Definition of Done

Pekerjaan dianggap selesai jika:

- permintaan pengguna telah diterapkan;
- perubahan mengikuti pola repository;
- tidak ada secret atau data internal yang bocor;
- data faktual memiliki sumber;
- pemeriksaan yang relevan berhasil;
- dokumentasi terkait diperbarui jika diperlukan;
- hasil dan keterbatasan dilaporkan dengan jelas.
