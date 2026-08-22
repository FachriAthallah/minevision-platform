# MineVision Security

Dokumen ini menetapkan aturan keamanan aplikasi MineVision untuk public website, Admin Dashboard, API, database, data ingestion, Global Search, dan MineBot AI.

Detail endpoint berada di `API_CONTRACTS.md`. Environment variable berada di `ENVIRONMENT.md`. Keamanan khusus RAG berada di `RAG_PIPELINE.md`.

## 1. Security Objectives

Keamanan MineVision bertujuan menjaga:

- kerahasiaan credential;
- integritas konten dan data;
- ketersediaan layanan;
- pemisahan akses publik dan admin;
- keamanan database;
- keterlacakan perubahan administratif;
- perlindungan terhadap penyalahgunaan API;
- keamanan layanan eksternal.

## 2. Security Principles

MineVision menggunakan prinsip:

- least privilege;
- deny by default;
- defense in depth;
- server-side enforcement;
- input validation;
- secure by default;
- separation of duties;
- auditability;
- minimal data exposure.

Frontend tidak boleh menjadi satu-satunya lapisan keamanan.

## 3. Security Boundaries

MineVision memiliki batas akses berikut:

| Area               | Access                            |
| ------------------ | --------------------------------- |
| Public Website     | Tanpa login                       |
| Public API         | Tanpa login dengan pembatasan     |
| Admin Dashboard    | Admin terautentikasi              |
| Admin API          | Authentication dan authorization  |
| Database           | Server-side dan role terbatas     |
| Migration          | Developer atau deployment process |
| Data ingestion     | Internal process                  |
| MineBot            | Public dengan rate limit          |
| Environment secret | Server-side only                  |

Public user tidak boleh memiliki akses ke fungsi administratif.

## 4. Authentication

Authentication hanya digunakan untuk Admin Dashboard.

Authentication harus:

- menggunakan Supabase Auth;
- dilakukan melalui mekanisme session yang aman;
- memeriksa session pada server;
- menolak session yang tidak valid;
- mendukung logout;
- menggunakan expiration;
- melindungi proses pemulihan akun;
- mencegah brute-force login.

Tidak adanya tombol admin pada frontend bukan authentication.

Jika session tidak tersedia:

```text
401 UNAUTHENTICATED
```

## 5. Authorization

Authorization menentukan tindakan yang dapat dilakukan admin.

Target role:

| Role             | Tanggung jawab                   |
| ---------------- | -------------------------------- |
| `administrator`  | Mengelola sistem dan akses       |
| `content_editor` | Membuat dan mengubah konten      |
| `data_editor`    | Mengelola data intelligence      |
| `data_verifier`  | Memverifikasi data               |
| `publisher`      | Mempublikasikan data atau konten |

Setiap admin operation harus memeriksa:

- identitas;
- role;
- permission;
- resource;
- action;
- status workflow.

Authorization wajib diperiksa pada setiap endpoint yang menerima resource ID. Pemeriksaan role pada halaman saja tidak cukup.

Jika session valid tetapi permission tidak tersedia:

```text
403 FORBIDDEN
```

## 6. Separation of Duties

Workflow penting harus memisahkan:

- pembuat data;
- verifier;
- publisher;
- administrator.

Record hanya dapat dipublikasikan setelah diverifikasi.

Server harus menolak publication request jika:

```text
verificationStatus != verified
```

Frontend tidak boleh menjadi satu-satunya pihak yang mengatur urutan workflow.

## 7. Row Level Security

RLS digunakan sebagai lapisan perlindungan database.

Status saat ini:

```text
RLS enabled

Explicit policies belum final
```

RLS aktif tidak berarti akses sudah aman tanpa policy yang benar.

Target policy harus membedakan:

- public read;
- authenticated admin read;
- editor write;
- verifier action;
- publisher action;
- internal service access.

RLS policy harus diuji untuk:

- anonymous user;
- authenticated user;
- setiap admin role;
- service process;
- unauthorized access.

Jangan menonaktifkan RLS hanya untuk memperbaiki error akses.

## 8. Database Access

Database hanya boleh diakses melalui server-side code, migration, seed, atau ingestion script.

Client Component tidak boleh:

- mengimpor database client;
- menerima database URL;
- menerima database password;
- menerima service-role key;
- menjalankan privileged query.

Gunakan query terparameterisasi melalui Drizzle ORM.

User input tidak boleh digabungkan menjadi raw SQL.

## 9. Supabase Keys

Publishable key hanya boleh digunakan untuk operasi yang memang dirancang aman dengan RLS.

Secret atau service-role key:

- hanya digunakan pada backend terpercaya;
- tidak boleh dikirim ke browser;
- tidak boleh dimasukkan ke Git;
- tidak boleh dicatat pada log;
- tidak boleh dikirim melalui API response;
- tidak boleh digunakan pada Client Component.

Service-role access dapat melewati RLS sehingga penggunaannya harus sangat terbatas.

## 10. Secret Management

Secret disimpan melalui:

- `.env.local` untuk local development;
- Vercel Environment Variables untuk deployment;
- platform secret management untuk layanan lain.

Secret mencakup:

- database credential;
- Supabase secret key;
- AI API key;
- webhook secret;
- monitoring token;
- encryption key;
- session secret.

Secret tidak boleh berada pada:

- source code;
- screenshot;
- dokumentasi;
- issue;
- commit;
- browser storage;
- query parameter;
- public log.

Jika secret terpapar:

1. hentikan penggunaan;
2. rotasi secret;
3. periksa log;
4. periksa commit history;
5. periksa aktivitas mencurigakan;
6. catat insiden.

## 11. Environment Variables

Variable dengan prefix berikut dapat masuk ke browser:

```text
NEXT_PUBLIC_
```

Jangan gunakan prefix tersebut untuk secret.

Environment production dan development harus terpisah.

Production tidak boleh menggunakan:

- database development;
- development API key;
- debug configuration;
- default credential;
- placeholder secret.

## 12. Input Validation

Seluruh input eksternal harus dianggap tidak terpercaya.

Validasi menggunakan Zod untuk:

- query parameter;
- route parameter;
- request body;
- form;
- environment variable;
- upload metadata;
- staging file;
- external service response;
- MineBot question.

Validation harus memeriksa:

- required field;
- tipe;
- panjang;
- format;
- rentang;
- enum;
- kombinasi parameter;
- business rule.

TypeScript type tidak menggantikan runtime validation.

## 13. Output Protection

Response hanya boleh memuat field yang dibutuhkan client.

Jangan mengirim:

- database row mentah;
- internal identifier yang tidak diperlukan;
- password hash;
- session token;
- role internal yang tidak relevan;
- environment variable;
- stack trace;
- SQL query;
- raw provider error.

Data publik harus difilter pada server sebelum response dibuat.

## 14. API Protection

Setiap API route harus:

- membatasi HTTP method;
- memvalidasi input;
- menggunakan content type yang benar;
- menggunakan authorization jika diperlukan;
- membatasi ukuran request;
- menggunakan rate limiting jika berisiko disalahgunakan;
- mengembalikan error yang aman;
- mencatat security event penting.

Method yang tidak didukung harus menghasilkan:

```text
405 METHOD_NOT_ALLOWED
```

Request yang terlalu besar dapat menghasilkan:

```text
413 PAYLOAD_TOO_LARGE
```

## 15. Rate Limiting

Rate limiting diprioritaskan untuk:

```text
authentication endpoint
/api/v1/search
/api/v1/minebot/query
/api/v1/admin/*
file upload
data export
```

Rate limit dapat mempertimbangkan:

- IP;
- session;
- user;
- route;
- time window;
- request cost.

Jika batas terlampaui:

```text
429 RATE_LIMIT_EXCEEDED
```

Rate limiting bukan pengganti authentication atau authorization.

## 16. Session Security

Admin session harus:

- menggunakan cookie yang aman;
- menggunakan `HttpOnly` jika session disimpan pada cookie;
- menggunakan `Secure` pada production;
- menggunakan `SameSite` yang sesuai;
- memiliki expiration;
- dihapus saat logout;
- diverifikasi pada server.

Token tidak boleh disimpan dalam URL.

Tindakan sensitif dapat meminta verifikasi ulang jika risiko penggunaannya tinggi.

## 17. CSRF Protection

Jika authentication menggunakan cookie, mutation harus dilindungi dari Cross-Site Request Forgery.

Perlindungan dapat menggunakan:

- `SameSite` cookie;
- origin validation;
- CSRF token;
- server-side session validation.

Public GET endpoint tidak boleh mengubah data.

## 18. XSS Protection

Konten yang berasal dari pengguna atau database tidak boleh dianggap aman.

Gunakan rendering React standar yang melakukan escaping.

Hindari:

```tsx
dangerouslySetInnerHTML;
```

Jika HTML harus ditampilkan:

- gunakan sanitizer yang terpercaya;
- batasi tag;
- batasi attribute;
- hapus script;
- hapus event handler;
- hapus URL berbahaya.

Markdown dan rich text harus disanitasi sebelum dirender.

## 19. Security Headers

Target production harus memiliki header yang sesuai, seperti:

```text
Content-Security-Policy
Strict-Transport-Security
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
```

Header harus diuji agar tidak merusak asset, font, chart, map, analytics, dan layanan yang digunakan.

Jangan menggunakan konfigurasi permisif tanpa kebutuhan.

## 20. HTTPS

Production hanya boleh diakses melalui HTTPS.

HTTP harus diarahkan ke HTTPS.

Credential, token, dan data sensitif tidak boleh dikirim melalui koneksi tanpa enkripsi.

## 21. CORS

Default API MineVision digunakan dari origin yang sama.

Jangan menggunakan:

```http
Access-Control-Allow-Origin: *
```

untuk Admin API atau endpoint sensitif.

Jika external client diizinkan:

- gunakan origin allowlist;
- batasi method;
- batasi header;
- dokumentasikan consumer;
- tinjau credential dan rate limit.

## 22. File Upload

Jika file upload diimplementasikan, server harus memeriksa:

- ukuran file;
- extension;
- MIME type;
- nama file;
- lokasi penyimpanan;
- permission;
- isi berbahaya;
- jumlah upload.

Jangan mempercayai extension atau MIME type dari browser saja.

Nama file yang diberikan pengguna tidak boleh digunakan langsung sebagai storage path.

File upload tidak boleh disimpan pada folder executable.

## 23. External URL and SSRF Protection

Jika server mengambil file atau URL dari input pengguna:

- gunakan allowlist protocol;
- izinkan hanya `https` jika memungkinkan;
- blokir localhost;
- blokir private IP;
- blokir metadata service;
- batasi redirect;
- batasi ukuran response;
- gunakan timeout;
- validasi destination setelah redirect.

Jangan menjalankan request server ke URL pengguna tanpa pemeriksaan.

## 24. External Services

Response dari external service harus dianggap tidak terpercaya.

Validasi:

- status response;
- content type;
- response size;
- response structure;
- timeout;
- error handling.

Integrasi eksternal tidak boleh mendapatkan credential atau data lebih banyak daripada yang diperlukan.

## 25. MineBot Security

MineBot harus memiliki:

- input limit;
- output limit;
- rate limiting;
- domain restriction;
- prompt injection protection;
- retrieval publication filter;
- citation validation;
- fallback;
- provider timeout.

MineBot tidak boleh mengembalikan:

- system prompt;
- API key;
- raw retrieval context;
- unpublished document;
- admin information;
- internal instruction.

Aturan pipeline lengkap berada di `RAG_PIPELINE.md`.

## 26. Data Ingestion Security

Data ingestion hanya dijalankan melalui proses internal.

Sebelum import:

- validasi struktur;
- validasi referensi;
- jalankan preflight;
- jalankan dry run;
- periksa destructive change;
- pastikan file tidak mengandung credential.

Importer harus menggunakan permission minimum yang tetap memungkinkan tugasnya berjalan.

## 27. Error Handling

Public error response tidak boleh memuat detail internal.

Internal error dicatat menggunakan request identifier.

Gunakan pesan umum untuk pengguna:

```text
Terjadi kesalahan saat memproses permintaan.
```

Detail teknis hanya tersedia pada log yang aksesnya terbatas.

## 28. Security Logging

Security log dapat mencatat:

- timestamp;
- request ID;
- actor ID;
- route;
- action;
- resource;
- status;
- IP atau fingerprint yang diperbolehkan;
- authentication failure;
- authorization failure;
- validation failure;
- rate-limit event;
- publication action.

Log tidak boleh memuat:

- password;
- access token;
- refresh token;
- authorization header;
- database URL;
- API key;
- full request body yang sensitif.

## 29. Audit Log

Audit log wajib untuk tindakan administratif penting, seperti:

- login admin;
- perubahan role;
- pembuatan konten;
- perubahan data;
- verification;
- publication;
- archive;
- delete;
- import;
- export.

Audit record minimal mencatat:

- actor;
- action;
- resource;
- resource identifier;
- timestamp;
- result.

Audit log tidak boleh dapat diubah oleh role biasa.

## 30. Dependency Security

Dependency harus:

- berasal dari registry resmi;
- memiliki kebutuhan yang jelas;
- kompatibel dengan project;
- dipantau terhadap vulnerability;
- diperbarui secara terkendali.

Jalankan pemeriksaan dependency:

```bash
npm audit
```

Hasil audit harus ditinjau. Jangan menjalankan automatic force fix tanpa memahami perubahan dependency.

## 31. CI/CD Security

Pipeline harus memeriksa:

- type checking;
- lint;
- build;
- test;
- dependency vulnerability;
- accidental secret;
- migration;
- environment separation.

Pull Request dari branch tidak terpercaya tidak boleh mendapatkan production secret.

Production deployment hanya dilakukan dari branch dan workflow yang disetujui.

## 32. Backup and Recovery

Database production harus memiliki:

- backup;
- jadwal backup;
- retention;
- restore procedure;
- restore test;
- akses terbatas.

Backup harus dilindungi dengan tingkat keamanan yang sama seperti database utama.

Backup dianggap dapat digunakan hanya setelah proses restore pernah diuji.

## 33. Security Incident Response

Jika terjadi insiden:

1. identifikasi jenis insiden;
2. batasi akses yang terdampak;
3. rotasi credential jika diperlukan;
4. simpan bukti dan log;
5. tentukan data yang terdampak;
6. perbaiki penyebab;
7. verifikasi pemulihan;
8. dokumentasikan tindakan;
9. tambahkan pencegahan agar tidak berulang.

Jangan menghapus log yang dibutuhkan untuk investigasi.

## 34. Security Testing

Pengujian keamanan minimal mencakup:

- public user tidak dapat mengakses Admin Dashboard;
- unauthenticated request ditolak;
- role tanpa permission ditolak;
- object-level authorization diperiksa;
- draft data tidak muncul;
- rejected data tidak muncul;
- input tidak valid ditolak;
- rate limiting bekerja;
- secret tidak masuk bundle browser;
- error tidak menampilkan informasi internal;
- RLS policy sesuai role;
- upload berbahaya ditolak jika fitur upload tersedia;
- MineBot tidak membocorkan internal context.

## 35. Security Verification

Pemeriksaan dasar:

```powershell
npx tsc --noEmit
npm run lint
npm run build
npm audit
```

Periksa file yang berpotensi mengandung secret:

```powershell
git status --short
git diff --cached
```

Jangan menampilkan isi `.env.local` untuk melakukan pemeriksaan.

## 36. Prohibited Practices

Dilarang:

- commit secret;
- mengirim service-role key ke browser;
- menonaktifkan RLS tanpa keputusan;
- mengandalkan frontend untuk authorization;
- menggunakan raw SQL dari user input;
- mengembalikan stack trace kepada publik;
- menampilkan draft atau rejected data;
- menggunakan wildcard CORS pada Admin API;
- menyimpan token pada URL;
- mencatat password atau authorization header;
- menggunakan dependency force fix tanpa review;
- menggunakan production database untuk eksperimen;
- melewati verification sebelum publication;
- mengabaikan security failure agar build berhasil.

## 37. Definition of Done

Perubahan dianggap aman jika:

- input eksternal divalidasi;
- authentication diterapkan jika diperlukan;
- authorization diperiksa pada server;
- RLS tetap aktif;
- secret tidak masuk kode atau browser;
- public response tidak memuat data internal;
- rate limiting diterapkan pada endpoint berisiko;
- error response aman;
- security event penting dapat dilacak;
- test authorization berhasil;
- dependency telah diperiksa;
- type check, lint, build, dan test relevan berhasil.

## 38. References

- [OWASP API Security Top 10](https://owasp.org/API-Security/editions/2023/en/0x11-t10/)
- [OWASP REST Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
