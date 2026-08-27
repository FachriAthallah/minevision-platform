# MineVision Environment Configuration

Dokumen ini menjelaskan environment dan environment variable yang digunakan MineVision.

Struktur aplikasi dibahas di `ARCHITECTURE.md`, sedangkan aturan keamanan dibahas di `SECURITY.md`.

## 1. Environment Types

MineVision menggunakan empat environment:

| Environment | Fungsi |
|---|---|
| Local | Pengembangan pada komputer developer |
| Development | Database dan layanan pengembangan |
| Preview | Deployment sementara dari Pull Request |
| Production | Website yang digunakan pengguna publik |

Development dan production harus menggunakan database serta credential yang berbeda.

## 2. Environment Files

### `.env.example`

Berisi nama environment variable yang dibutuhkan aplikasi tanpa nilai rahasia.

File ini boleh dimasukkan ke Git.

### `.env.local`

Berisi konfigurasi lokal dan credential development.

File ini tidak boleh dimasukkan ke Git.

### Vercel Environment Variables

Digunakan untuk Preview dan Production Deployment.

Nilainya dikonfigurasi melalui pengaturan project Vercel dan tidak disimpan di repository.

## 3. Current Environment Variables

| Variable | Scope | Fungsi |
|---|---|---|
| `DATABASE_URL` | Server | Koneksi aplikasi ke PostgreSQL |
| `DATABASE_MIGRATION_URL` | Server | Koneksi session/direct untuk Drizzle migration |
| `NEXT_PUBLIC_APP_URL` | Public | Base URL aplikasi jika absolute URL diperlukan |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | URL project Supabase untuk Auth client |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public | Publishable key Supabase untuk Auth client |
| `NODE_ENV` | Runtime | Menentukan mode runtime |

Variable aktual yang diwajibkan aplikasi mengikuti:

```text
.env.example

src/lib/env.ts
```

## 4. Database Connection Variables

### `DATABASE_URL`

Digunakan oleh aplikasi saat runtime.

Untuk Supabase, gunakan transaction pooler agar sesuai dengan aplikasi serverless seperti Vercel.

Contoh format:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:6543/postgres
```

### `DATABASE_MIGRATION_URL`

Digunakan untuk Drizzle migration dan operasi database yang membutuhkan koneksi langsung atau session pooler.

Contoh format:

```env
DATABASE_MIGRATION_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
```

Contoh tersebut hanya menunjukkan format. Jangan menyalin placeholder sebagai credential sebenarnya.

## 5. Public Variables

Variable dengan prefix berikut dapat masuk ke browser:

```text
NEXT_PUBLIC_
```

Karena itu, prefix tersebut hanya boleh digunakan untuk nilai yang aman diketahui publik.

Boleh digunakan untuk:

- public application URL;
- public feature configuration;
- identifier publik yang memang dirancang untuk frontend.
- Supabase project URL dan publishable key yang tetap dibatasi oleh Auth serta RLS.

Tidak boleh digunakan untuk:

- database URL;
- database password;
- service-role key;
- private API key;
- authentication secret;
- webhook secret.

## 6. Application URL

Untuk local development:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Untuk Preview dan Production, gunakan URL environment masing-masing.

Jika request menuju aplikasi yang sama, prioritaskan relative URL:

```text
/api/health
```

Gunakan absolute URL hanya jika benar-benar dibutuhkan.

## 6.1 Supabase Auth Client

Authentication menggunakan:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

Publishable key bukan service-role credential dan tidak boleh digunakan untuk melewati RLS. Service-role key tidak diperlukan oleh unified authentication foundation dan tidak boleh dikirim ke browser.

## 7. Local Setup

Buat `.env.local` dari template:

```powershell
Copy-Item ".env.example" ".env.local"
```

Kemudian isi nilai development pada:

```text
.env.local
```

Jalankan aplikasi:

```powershell
npm run dev
```

Akses aplikasi melalui:

```text
http://localhost:3000
```

## 8. Environment Validation

Environment variable harus divalidasi sebelum digunakan aplikasi.

Validation berada pada:

```text
src/lib/env.ts
```

Validation harus memastikan:

- variable wajib tersedia;
- URL memiliki format yang valid;
- secret tidak menggunakan prefix public;
- production tidak menggunakan credential development;
- error konfigurasi diketahui saat aplikasi dijalankan.

Aplikasi tidak boleh menggunakan fallback palsu untuk credential wajib.

Contoh yang dilarang:

```ts
const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://default";
```

## 9. Environment Access

Server-side code dapat menggunakan environment variable melalui:

```ts
process.env.DATABASE_URL
```

Client Component hanya boleh menggunakan variable dengan prefix:

```text
NEXT_PUBLIC_
```

Database dan private service variable tidak boleh dikirim melalui:

- component props;
- API response;
- browser storage;
- client-side JavaScript;
- error message;
- application log.

## 10. Environment Separation

### Local dan Development

Digunakan untuk:

- coding;
- migration development;
- seed;
- data ingestion;
- pengujian API;
- verifikasi database.

### Preview

Digunakan untuk:

- memeriksa hasil Pull Request;
- pengujian tampilan;
- integration testing;
- verifikasi sebelum production.

Preview tidak boleh menggunakan production database untuk operasi perubahan data.

### Production

Digunakan untuk:

- website publik;
- data yang sudah disetujui;
- Admin Dashboard production;
- layanan production.

Production credential hanya disimpan pada platform deployment yang berwenang.

## 11. Vercel Configuration

Environment variable di Vercel dibagi berdasarkan scope:

```text
Development

Preview

Production
```

Pastikan setiap variable ditempatkan pada environment yang sesuai.

Setelah environment variable diubah, lakukan deployment ulang agar konfigurasi terbaru digunakan.

## 12. Target Variables

Variable berikut baru ditambahkan ketika fiturnya diimplementasikan:

| Area | Contoh fungsi |
|---|---|
| Authentication | Session dan authentication configuration |
| MineBot | AI provider credential |
| Search | Search service configuration |
| Monitoring | Error tracking dan observability |
| Rate limiting | Rate-limit storage atau provider |
| File storage | Storage configuration |

Nama variable final harus ditambahkan ke `.env.example` dan validation sebelum digunakan.

Jangan menambahkan variable target sebelum layanan terkait dipilih.

## 13. `.env.example` Rules

Setiap variable baru harus ditambahkan tanpa secret:

```env
VARIABLE_NAME=
```

Nilai publik yang aman dapat memiliki contoh:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`.env.example` harus:

- menggunakan nama yang sama dengan implementasi;
- hanya memuat variable yang masih digunakan;
- tidak mengandung credential asli;
- diperbarui bersama perubahan konfigurasi.

## 14. Verification

Periksa keberadaan file lokal:

```powershell
Get-Item ".env.local"
```

Jalankan environment validation melalui aplikasi:

```powershell
npm run dev
```

Kemudian jalankan pemeriksaan project:

```powershell
npx tsc --noEmit
npm run lint
npm run build
```

Jangan menampilkan isi `.env.local` pada terminal bersama, screenshot, log, atau percakapan.

## 15. Troubleshooting

### Environment variable tidak terbaca

Periksa:

- nama variable;
- lokasi `.env.local`;
- apakah development server sudah dimulai ulang;
- apakah variable tersedia pada environment deployment.

### Database tidak terhubung

Periksa:

- connection string;
- password;
- hostname;
- port;
- SSL;
- status project Supabase;
- jenis pooler yang digunakan.

### Migration gagal tetapi aplikasi terhubung

Periksa apakah migration menggunakan `DATABASE_MIGRATION_URL`, bukan transaction pooler runtime.

### Build production gagal

Periksa apakah seluruh variable wajib telah tersedia pada Vercel Production Environment.

## 16. Change Rules

Jika menambahkan atau mengubah environment variable:

1. perbarui `.env.example`;
2. perbarui validation;
3. perbarui penggunaan pada kode;
4. perbarui konfigurasi deployment;
5. perbarui dokumen ini;
6. jalankan type check, lint, dan build.

Hapus environment variable yang tidak lagi digunakan dari kode, validation, template, dan deployment configuration.

## 17. Definition of Done

Perubahan environment selesai jika:

- nama variable konsisten;
- `.env.example` diperbarui;
- validation tersedia;
- secret tidak masuk ke Git;
- variable public dan private terpisah;
- development dan production tidak berbagi credential;
- local development berjalan;
- type check berhasil;
- lint berhasil;
- build berhasil.
