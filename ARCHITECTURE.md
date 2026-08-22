# MineVision System Architecture

Dokumen ini menjelaskan struktur utama sistem MineVision, pembagian lapisan aplikasi, aliran data, dan batas tanggung jawab setiap bagian.

Detail tabel berada di `DATABASE_SCHEMA.md`, sedangkan detail endpoint berada di `API_CONTRACTS.md`.

## 1. Architecture Overview

MineVision menggunakan arsitektur web berbasis Next.js dengan dua bagian utama:

1. Public Website
2. Private Admin Dashboard

Public Website dapat diakses tanpa login.

Admin Dashboard membutuhkan authentication dan authorization.

Alur utama sistem:

```text
User
  Next.js Application
    Server Component atau Route Handler
      Service dan Validation
        Drizzle ORM
          PostgreSQL Supabase
```

## 2. Main Systems

### Public Website

Menyediakan:

- Home;
- Edukasi;
- Industri;
- Komoditas;
- Karier;
- Intelligence;
- Ekonomi;
- Global Search;
- MineBot AI;
- About.

Public Website hanya menampilkan konten dan data yang sudah dipublikasikan.

### Admin Dashboard

Digunakan untuk:

- mengelola konten;
- mengelola sumber;
- mengelola komoditas;
- mengelola data intelligence;
- melakukan verifikasi;
- melakukan publikasi;
- melihat aktivitas administratif.

Admin Dashboard tidak boleh menggunakan akses publik untuk melakukan perubahan data.

## 3. Application Layers

### Presentation Layer

Berisi:

- halaman;
- layout;
- komponen UI;
- form;
- chart;
- map;
- loading state;
- error state;
- empty state.

Presentation Layer tidak boleh mengakses database secara langsung.

### Application Layer

Berisi:

- use case;
- service;
- business rule;
- authorization;
- data transformation;
- publication filtering.

Lapisan ini menghubungkan UI dengan database atau layanan eksternal.

### Validation Layer

Zod digunakan untuk memvalidasi:

- query parameter;
- route parameter;
- request body;
- environment variable;
- staging data;
- external service response.

### Data Access Layer

Berisi:

- Drizzle schema;
- database query;
- transaction;
- migration;
- seed;
- importer;
- verification script.

Database hanya diakses dari server-side code.

### External Service Layer

Digunakan untuk layanan di luar aplikasi, seperti:

- Supabase;
- AI provider;
- monitoring;
- external data source;
- file storage.

Integrasi eksternal harus ditempatkan pada adapter atau service khusus.

## 4. Project Structure

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
      /about
    /admin
    /api
  /components
    /layout
    /ui
    /features
  /db
    /schema
  /lib
  /services
  /types
/data
  /staging
  /seeds
/drizzle
/scripts
/public
```

Struktur aktual repository tetap menjadi acuan apabila terdapat perbedaan.

## 5. Directory Responsibilities

| Direktori         | Tanggung jawab                        |
|---                |---                                    |
| `src/app`         | Route, page, layout, dan API handler  |
| `src/components`  | Komponen antarmuka                    |
| `src/db`          | Database client dan Drizzle schema    |
| `src/lib`         | Utility dan konfigurasi umum          |
| `src/services`    | Business logic dan integrasi          |
| `src/types`       | TypeScript types bersama              |
| `data/staging`    | Data sebelum diimpor                  |
| `data/seeds`      | Data awal database                    |
| `drizzle`         |SQL migration                          |
| `scripts`         | Seed, importer, dan verification      |
| `public`          | Static assets                         |

## 6. Public Request Flow

Alur halaman publik:

```text
Browser Request

  Next.js Route

    Server Component atau Route Handler

      Input Validation

        Service

          Database Query

            Publication Filter

              Response
```

Public response hanya boleh berisi data yang:

- aktif;
- terverifikasi jika diwajibkan;
- berstatus `published`;
- berasal dari sumber yang diperbolehkan.

Filtering tidak boleh hanya dilakukan pada frontend.

## 7. Admin Request Flow

Alur perubahan data melalui Admin Dashboard:

```text
Admin Request

  Authentication

    Authorization

      Input Validation

        Business Rule

          Database Transaction

            Audit Log

              Response
```

Authentication membuktikan identitas pengguna.

Authorization menentukan tindakan yang boleh dilakukan pengguna tersebut.

## 8. Rendering Strategy

Gunakan Server Component sebagai pilihan utama untuk:

- mengambil data;
- membaca database;
- membangun halaman berbasis konten;
- menjaga credential tetap di server.

Gunakan Client Component hanya untuk:

- interaksi pengguna;
- state browser;
- chart interaktif;
- map interaktif;
- form;
- dialog;
- filter dinamis;
- browser API.

Jangan menambahkan `"use client"` pada seluruh halaman jika hanya sebagian komponen yang membutuhkan interaksi.

## 9. Database Access

Database hanya boleh diakses melalui:

- Server Component;
- Route Handler;
- Server Action;
- server service;
- migration;
- ingestion script;
- verification script.

Client Component tidak boleh:

- mengimpor database client;
- menggunakan `DATABASE_URL`;
- menerima service-role key;
- menjalankan query database langsung.

Struktur database dijelaskan di `DATABASE_SCHEMA.md`.

## 10. API Architecture

API menggunakan Next.js Route Handler pada:

```text
/src

  /app

    /api
```

Pembagian route:

```text
/api

  /health

  /v1

    /intelligence

    /commodities

    /search

    /minebot

    /admin
```

Public API hanya menyediakan operasi baca.

Admin API menyediakan operasi pengelolaan data setelah authentication dan authorization berhasil.

Contract endpoint dijelaskan di `API_CONTRACTS.md`.

## 11. Data Ingestion Architecture

Alur data Intelligence:

```text
Source Document

  Staging JSON

    Structure Validation

      Database Preflight

        Dry Run

          Import

            Import Verification

              Public API
```

Importer harus:

- aman dijalankan ulang;
- memvalidasi referensi;
- menggunakan transaction jika diperlukan;
- menghentikan proses ketika data tidak valid;
- tidak langsung memublikasikan data yang belum diverifikasi.

Aturan data dijelaskan di `DATA_GOVERNANCE.md`.

## 12. Global Search Architecture

Global Search akan menggabungkan konten publik dari beberapa modul.

Alur pencarian:

```text
Search Query

  Input Validation

    Public Search Service

      Published Content Index

        Ranked Results
```

Search hanya boleh mengembalikan halaman dan data yang dapat diakses publik.

Implementasi dilakukan bertahap sesuai `ROADMAP.md`.

## 13. MineBot Architecture

MineBot menggunakan Retrieval-Augmented Generation untuk menjawab berdasarkan pengetahuan MineVision.

Alur MineBot:

```text
User Question

  Input Validation

    Relevant Document Retrieval

      Context Selection

        AI Provider

          Answer and Citation
```

MineBot harus:

- menggunakan sumber MineVision yang disetujui;
- menyertakan sitasi jika tersedia;
- membatasi panjang input dan output;
- tidak membocorkan prompt internal;
- tidak membocorkan credential;
- tidak menganggap jawaban AI sebagai sumber data utama.

Detail pipeline berada di `RAG_PIPELINE.md`.

## 14. Authentication and Authorization

Public Website tidak membutuhkan login.

Authentication digunakan untuk:

- Admin Dashboard;
- content management;
- data verification;
- publication;
- administrative activity.

Authorization diterapkan berdasarkan role dan permission.

Pemeriksaan permission harus dilakukan pada server. Menyembunyikan tombol pada frontend tidak dianggap sebagai authorization.

## 15. Publication Boundary

MineVision memisahkan data internal dan data publik.

```text
Internal Data

  Draft

  In Review

  Pending Verification

  Rejected

Public Data

  Verified

  Published
```

Frontend publik tidak boleh menerima draft kemudian menyembunyikannya sendiri.

Server query harus memastikan hanya data publik yang dikirim.

## 16. Error Handling

Error dibagi menjadi:

- validation error;
- authentication error;
- authorization error;
- resource not found;
- business rule violation;
- database error;
- external service error.

Public response tidak boleh menampilkan:

- stack trace;
- SQL query;
- absolute file path;
- environment variable;
- database credential;
- internal provider response.

## 17. Deployment Architecture

Target deployment:

| Komponen | Platform |
|---|---|
| Next.js application | Vercel |
| PostgreSQL database | Supabase |
| Migration | Drizzle Kit |
| Source code | GitHub |
| CI/CD | GitHub dan Vercel |

Environment dipisahkan menjadi:

```text
Local Development

Development Database

Preview Deployment

Production
```

Production menggunakan database dan environment variable yang terpisah dari development.

## 18. Current and Target Architecture

### Current

- Next.js project foundation;
- public layout dan routes;
- PostgreSQL melalui Supabase;
- Drizzle schema dan migration;
- data ingestion foundation;
- health endpoint;
- production Intelligence endpoint.

### Target

- Admin authentication;
- role dan permission;
- Admin CRUD;
- Global Search;
- MineBot RAG;
- monitoring;
- audit log;
- security event log;
- production deployment.

Urutan implementasi mengikuti `ROADMAP.md`.

## 19. Architecture Rules

- Gunakan Server Component sebagai default.
- Pisahkan UI, business logic, dan database query.
- Jangan mengakses database dari Client Component.
- Jangan menempatkan secret pada browser.
- Jangan membuat route baru tanpa validasi.
- Jangan mengirim draft data ke public frontend.
- Jangan membuat integrasi eksternal langsung di komponen UI.
- Jangan mengubah teknologi utama tanpa keputusan yang jelas.
- Hindari abstraksi baru jika hanya digunakan satu kali.
- Perbarui dokumen ini jika struktur utama sistem berubah.

## 20. Definition of Done

Perubahan arsitektur selesai jika:

- tanggung jawab setiap lapisan jelas;
- dependency berjalan ke arah yang benar;
- database tetap berada di server;
- input eksternal telah divalidasi;
- public dan admin boundary tetap terpisah;
- tidak ada secret yang dikirim ke browser;
- type check berhasil;
- lint berhasil;
- build berhasil;
- dokumentasi terkait diperbarui.