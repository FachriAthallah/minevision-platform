# MineVision — Engineering and Contribution Rules

## 1. Document Information

- Document: `RULES.md`
- Product: MineVision Intelligence Platform
- Status: Active
- Applies to:
  - Human contributors
  - AI coding assistants
  - Automated scripts
  - Data ingestion processes
  - Database migrations
  - Frontend and backend development
- Related documents:
  - `PRD.md`
  - `ARCHITECTURE.md`
  - `DESIGN.md`
  - `SCHEMA.md`

Dokumen ini menetapkan aturan pengembangan MineVision agar seluruh perubahan tetap:

- Konsisten.
- Aman.
- Dapat diuji.
- Dapat ditelusuri.
- Tidak merusak data.
- Sesuai arsitektur.
- Sesuai desain.
- Dapat dipelihara dalam jangka panjang.

---

# 2. Rule Priority

Jika terdapat aturan yang bertentangan, gunakan prioritas berikut:

1. Keamanan dan perlindungan data.
2. Database migration yang sudah diterapkan.
3. Source code pada branch utama.
4. `PRD.md`.
5. `ARCHITECTURE.md`.
6. `SCHEMA.md`.
7. `DESIGN.md`.
8. `RULES.md`.
9. Task atau prompt individual.
10. Asumsi contributor atau AI.

Task individual tidak boleh mengesampingkan:

- Security rule.
- Publication rule.
- Database constraint.
- Data provenance.
- Protected branch rule.
- Secret management.

Jika konflik belum dapat diselesaikan, contributor wajib berhenti dan meminta keputusan.

---

# 3. Requirement Keywords

Istilah berikut digunakan dalam dokumen ini:

| Keyword      | Meaning                   |
| ------------ | ------------------------- |
| `MUST`       | Wajib dipatuhi            |
| `MUST NOT`   | Dilarang                  |
| `SHOULD`     | Sangat disarankan         |
| `SHOULD NOT` | Sebaiknya tidak dilakukan |
| `MAY`        | Opsional jika relevan     |

---

# 4. Source of Truth

Setiap area mempunyai sumber kebenaran masing-masing.

| Area                | Source of truth                            |
| ------------------- | ------------------------------------------ |
| Product scope       | `PRD.md`                                   |
| System architecture | `ARCHITECTURE.md`                          |
| UI/UX dan visual    | `DESIGN.md`                                |
| Database structure  | Drizzle schema, migration, dan `SCHEMA.md` |
| Engineering rules   | `RULES.md`                                 |
| Current behavior    | Source code dan automated test             |
| Statistical data    | Database record dan source citation        |
| Public visibility   | Publication policy dan RLS                 |

Dokumentasi harus diperbarui jika perubahan implementasi membuat dokumen tidak lagi akurat.

---

# 5. General Contribution Rules

Setiap contributor MUST:

1. Memahami tujuan task.
2. Memeriksa branch aktif.
3. Memeriksa working tree.
4. Membaca file yang relevan sebelum mengubahnya.
5. Mengikuti pola yang sudah digunakan.
6. Membatasi perubahan pada scope task.
7. Menambahkan atau memperbarui test.
8. Menjalankan verification pipeline.
9. Memeriksa diff.
10. Menjelaskan perubahan dan hasil pengujian.

Contributor MUST NOT:

- Mengubah file yang tidak berhubungan tanpa alasan.
- Menghapus perubahan milik contributor lain.
- Mengganti arsitektur secara sepihak.
- Menonaktifkan test agar pipeline lulus.
- Menyembunyikan error dengan type assertion sembarangan.
- Memasukkan secret ke repository.
- Memublikasikan data yang belum disetujui.
- Menggunakan data buatan seolah-olah data faktual.

---

# 6. Database Rules

## 6.1 Database Source of Truth

Struktur database didefinisikan melalui:

`src/db/schema/`

Schema export dikumpulkan melalui:

`src/db/schema/index.ts`

Migration dikelola melalui Drizzle Kit.

`SCHEMA.md` merupakan dokumentasi struktur, bukan pengganti migration.

---

## 6.2 Database Naming

Database MUST menggunakan `snake_case`.

Contoh benar:

- `commodity_production`
- `production_value`
- `verification_status`
- `source_published_at`

Contoh salah:

- `CommodityProduction`
- `productionValue`
- `Verification-Status`

Nama tabel SHOULD:

- Jelas.
- Berbasis domain.
- Tidak menggunakan singkatan ambigu.
- Konsisten dengan tabel yang sudah ada.

Nama TypeScript untuk table dan column menggunakan `camelCase`.

Contoh:

| PostgreSQL             | TypeScript            |
| ---------------------- | --------------------- |
| `commodity_production` | `commodityProduction` |
| `production_value`     | `productionValue`     |
| `source_published_at`  | `sourcePublishedAt`   |

---

## 6.3 Primary Key

Sebagian besar entity MUST menggunakan:

- `uuid`
- Random UUID default
- Primary key
- Non-null

Natural key hanya digunakan jika nilainya:

- Stabil.
- Unik secara domain.
- Tidak berubah karena kebutuhan presentasi.

Contoh natural key yang diperbolehkan:

`measurement_units.code`

Composite primary key MAY digunakan pada pure junction table.

Contoh:

`content_sources(content_id, source_id)`

---

## 6.4 Foreign Key

Relasi penting MUST mempunyai foreign key.

Foreign key MUST menentukan perilaku:

- `ON UPDATE`
- `ON DELETE`

Aturan umum:

### `RESTRICT`

Digunakan untuk master data yang masih direferensikan.

Contoh:

- Commodity.
- Measurement unit.
- Source.
- Region.
- Smelter operator.

### `CASCADE`

Digunakan jika child tidak mempunyai arti tanpa parent.

Contoh:

- Citation record.
- Smelter output.
- Entity-specific source record.

### `SET NULL`

Digunakan jika child masih valid tanpa optional parent.

Foreign key MUST mempunyai index jika digunakan untuk:

- Join.
- Filter.
- Sorting.
- Access control.

---

## 6.5 Data Types

Gunakan tipe data berikut:

| Data                | PostgreSQL type         |
| ------------------- | ----------------------- |
| Entity ID           | `uuid`                  |
| Short identifier    | `varchar(n)`            |
| Long content        | `text`                  |
| Exact numeric data  | `numeric(p,s)`          |
| Year                | `smallint`              |
| Count               | `integer` atau `bigint` |
| Boolean state       | `boolean`               |
| Calendar date       | `date`                  |
| Timestamp           | `timestamptz`           |
| Extensible metadata | `jsonb`                 |
| Controlled state    | PostgreSQL enum         |

Statistical value MUST NOT menggunakan:

- `float`
- `real`
- JavaScript-only rounding sebagai sumber nilai utama

Nilai produksi, harga, GDP, investasi, kapasitas, dan ekspor MUST menggunakan `numeric`.

---

## 6.6 Null and Zero

`NULL` dan `0` mempunyai arti berbeda.

- `NULL`: tidak tersedia, tidak diketahui, atau tidak berlaku.
- `0`: sumber secara eksplisit menyatakan nilai nol.

Contributor MUST NOT:

- Mengubah `NULL` menjadi `0` hanya agar chart tampil.
- Mengisi nilai yang hilang dengan estimasi tanpa label.
- Menganggap empty API response sebagai nilai nol.
- Menganggap `not_reported` sama dengan `reported_zero`.

Frontend harus menampilkan state data yang sesuai.

---

## 6.7 Year Constraint

Kolom tahun statistik MUST menggunakan constraint:

`year BETWEEN 1900 AND 2100`

Optional year menggunakan:

`year IS NULL OR year BETWEEN 1900 AND 2100`

Urutan tahun lifecycle MUST konsisten.

Contoh:

`construction_year <= commissioning_year <= commercial_operation_year`

---

## 6.8 Numeric Constraint

Nilai berikut MUST tidak negatif:

- Production.
- Price.
- GDP.
- Investment.
- Project count.
- Export volume.
- FOB value.
- Smelter capacity.
- Percentage yang secara domain tidak mungkin negatif.

Percentage share MUST berada antara 0 dan 100.

Coordinate MUST berada pada:

- Latitude: -90 sampai 90.
- Longitude: -180 sampai 180.

---

## 6.9 Currency and Unit

Currency code MUST menggunakan uppercase three-letter code.

Pattern:

`^[A-Z]{3}$`

Contoh:

- `IDR`
- `USD`

Unit MUST merujuk ke:

`measurement_units.code`

Unit tidak boleh ditulis bebas pada statistical record jika sudah tersedia master unit.

Nilai yang mempunyai unit MUST tidak boleh disimpan tanpa unit.

---

## 6.10 Enum

Enum digunakan untuk nilai yang:

- Terbatas.
- Stabil.
- Menjadi dasar business rule.
- Membutuhkan validation database.

Enum MUST NOT ditambahkan hanya untuk label presentasi.

Perubahan enum membutuhkan:

1. Analisis backward compatibility.
2. Perubahan Drizzle schema.
3. Migration baru.
4. Update validation schema.
5. Update TypeScript type.
6. Update test.
7. Update dokumentasi.

Nilai enum yang sudah dipakai tidak boleh dihapus secara langsung.

---

## 6.11 Unique Constraint

Natural uniqueness MUST dijamin database, tidak hanya diperiksa di application code.

Contoh:

- Commodity slug.
- Source slug.
- Region slug.
- Facility code.
- Annual statistical record.
- Entity-source citation combination.

Unique constraint juga digunakan untuk menjaga idempotency importer.

---

## 6.12 Check Constraint

Aturan integritas yang dapat diverifikasi database SHOULD dibuat sebagai check constraint.

Contoh:

- Nilai tidak negatif.
- Tahun valid.
- Currency format.
- Latitude dan longitude valid.
- Investment scale valid.
- Export availability sesuai dengan nilai yang tersedia.
- Mining GDP tidak lebih besar dari national GDP.
- Capacity value mempunyai unit.

Validation Zod tidak menggantikan database constraint.

---

## 6.13 JSONB

`jsonb` hanya digunakan untuk metadata tambahan.

JSONB MUST NOT menjadi tempat utama untuk:

- Foreign key.
- Statistical value.
- Year.
- Currency.
- Unit.
- Publication status.
- Verification status.
- Data yang sering digunakan sebagai filter.

Jika property JSONB mulai sering digunakan untuk query atau validation, property tersebut SHOULD dipromosikan menjadi kolom.

---

## 6.14 Timestamp

Entity utama SHOULD mempunyai:

- `created_at`
- `updated_at`

Timestamp MUST menggunakan timezone:

`timestamptz`

Application harus memperbarui `updated_at` ketika record berubah.

Waktu tidak boleh disimpan sebagai string bebas jika dapat menggunakan `date` atau `timestamptz`.

---

# 7. Database Migration Rules

## 7.1 Migration-Only Changes

Perubahan physical database MUST dilakukan melalui migration.

Contributor MUST NOT:

- Mengedit production database secara manual tanpa migration.
- Mengubah tabel melalui dashboard lalu melupakan source schema.
- Mengedit migration yang sudah diterapkan.
- Menghapus migration history agar database terlihat bersih.
- Menggunakan destructive migration tanpa pemeriksaan data.

---

## 7.2 Migration Procedure

Urutan wajib:

1. Perbarui Drizzle schema.
2. Generate migration.
3. Baca SQL migration.
4. Periksa operasi destructive.
5. Jalankan migration di development.
6. Jalankan database verification.
7. Periksa schema snapshot.
8. Jalankan application test.
9. Perbarui `SCHEMA.md`.

---

## 7.3 Destructive Migration

Operasi berikut dianggap destructive:

- `DROP TABLE`
- `DROP COLUMN`
- Mengubah tipe yang kehilangan presisi.
- Menghapus enum value.
- Mengubah nullable menjadi non-nullable tanpa backfill.
- Menghapus unique constraint.
- Menghapus foreign key.
- Mengubah cascade behavior.
- Menghapus record massal.

Destructive migration MUST mendapatkan persetujuan eksplisit.

Sebelum destructive migration:

- Hitung affected records.
- Buat backup atau recovery plan.
- Siapkan backfill.
- Jelaskan rollback.
- Uji pada development database.

---

## 7.4 Migration Immutability

Migration yang sudah diterapkan MUST dianggap immutable.

Jika terdapat kesalahan:

- Buat migration koreksi.
- Jangan mengedit migration lama.
- Jangan menghapus migration lama dari Git history.

---

# 8. Row Level Security Rules

RLS MUST tetap aktif pada public schema.

Contributor MUST NOT:

- Menonaktifkan RLS untuk mempermudah development.
- Menggunakan service role pada browser.
- Membuat public policy yang membaca seluruh record.
- Menganggap API validation sebagai pengganti RLS.

Canonical public rule:

`verification_status = 'verified'`

dan:

`publication_status = 'published'`

Jika tabel mempunyai `is_active`, public rule juga membutuhkan:

`is_active = true`

Child source atau citation harus mewarisi visibility dari parent record.

---

# 9. Publication and Verification Rules

## 9.1 Verification Workflow

Lifecycle verifikasi:

`pending → verified`

atau:

`pending → rejected`

Data rejected tidak boleh dipublikasikan.

Perubahan dari rejected ke verified membutuhkan review ulang.

## 9.2 Publication Workflow

Lifecycle publikasi:

`draft → in_review → published → archived`

Data tidak boleh langsung masuk sebagai `published` melalui importer biasa.

## 9.3 Public Eligibility

Record hanya public jika:

- Verified.
- Published.
- Entity aktif jika relevan.
- Source aktif.
- Source memenuhi tingkat verifikasi yang diperlukan.

## 9.4 Defense in Depth

Public visibility MUST diperiksa pada beberapa lapisan:

1. RLS.
2. Database query.
3. Application publication policy.
4. API response mapping.
5. Automated test.

---

# 10. Source and Data Provenance Rules

Statistical record MUST mempunyai source.

Source SHOULD mencatat:

- Organization.
- Document title.
- URL.
- Publication date.
- Page reference.
- Access date.
- Citation label.
- Official status.

Contributor MUST NOT:

- Mengarang sumber.
- Menggunakan URL yang tidak mendukung claim.
- Menghapus source hanya karena URL tidak lagi aktif.
- Menggabungkan dua dataset berbeda tanpa metodologi.
- Mengubah proyeksi menjadi actual.
- Mengubah provisional menjadi final tanpa bukti.

Jika source tidak dapat diverifikasi, record tetap:

- `verification_status = pending`
- `publication_status = draft`

---

# 11. Data Ingestion Rules

Importer MUST melalui tahapan:

1. Structure validation.
2. Semantic validation.
3. Master reference preflight.
4. Dry-run.
5. Transactional import.
6. Post-import verification.
7. Audit summary.

Importer MUST:

- Idempotent.
- Menolak reference yang tidak dikenal.
- Menolak unit yang tidak valid.
- Menolak duplicate conflicting record.
- Menjaga publication status.
- Menggunakan transaction.
- Menghasilkan error yang dapat ditindaklanjuti.

Importer MUST NOT:

- Membuat master commodity secara otomatis karena typo.
- Membuat source tanpa informasi minimum.
- Mengubah published record tanpa approval.
- Menghapus record yang tidak ditemukan pada staging file.
- Menampilkan credential pada log.

Default imported record:

- `verification_status = pending`
- `publication_status = draft`

---

# 12. TypeScript Rules

## 12.1 Strict Type Safety

TypeScript strict mode MUST dipertahankan.

Contributor MUST NOT menggunakan:

- `any` tanpa alasan kuat.
- `@ts-ignore` untuk menyembunyikan masalah.
- Non-null assertion sembarangan.
- Type assertion hanya untuk memaksa compiler diam.

Gunakan:

- `unknown` untuk external error atau unknown input.
- Type guard.
- Zod parsing.
- Discriminated union.
- Explicit return type pada public service contract.

---

## 12.2 Naming

| Element              | Convention                                   |
| -------------------- | -------------------------------------------- |
| Variable             | `camelCase`                                  |
| Function             | `camelCase`                                  |
| Component            | `PascalCase`                                 |
| Type                 | `PascalCase`                                 |
| Enum-like constant   | `UPPER_SNAKE_CASE` jika benar-benar constant |
| File                 | `kebab-case.ts`                              |
| React component file | `kebab-case.tsx`                             |
| Route folder         | `kebab-case`                                 |
| Database column      | `snake_case`                                 |
| Environment variable | `UPPER_SNAKE_CASE`                           |

Names MUST menggambarkan intent.

Contoh baik:

- `getPublicProduction`
- `isPubliclyVisible`
- `productionQuerySchema`
- `PublicProductionRecord`

Contoh buruk:

- `getData`
- `result2`
- `tempFinal`
- `handleThing`

---

## 12.3 Function Design

Function SHOULD:

- Mempunyai satu tanggung jawab utama.
- Menggunakan nama berbasis aksi.
- Tidak memiliki terlalu banyak side effect.
- Mempunyai input dan output yang jelas.
- Mudah diuji.

Function yang kompleks SHOULD dipecah jika:

- Menangani validation, query, mapping, dan response sekaligus.
- Memiliki conditional yang sulit dipahami.
- Digunakan oleh beberapa domain.

---

## 12.4 Imports

Gunakan path alias untuk import lintas feature:

`@/features/...`

Relative import digunakan untuk file dalam feature yang sama.

Import order:

1. Framework dan external package.
2. Internal absolute import.
3. Relative import.
4. Type-only import jika relevan.

Gunakan:

`import type`

untuk dependency yang hanya digunakan sebagai type.

---

## 12.5 Server-Only Code

File yang:

- Mengakses database.
- Membaca private environment variable.
- Menggunakan service credential.
- Menjalankan server business logic.

MUST menggunakan:

`import "server-only";`

Server-only module tidak boleh di-import oleh Client Component.

---

## 12.6 Error Handling

Catch block menggunakan:

`error: unknown`

Error internal boleh dicatat pada server.

API response tidak boleh mengungkap:

- Stack trace.
- Database query.
- Credential.
- Internal path.
- Raw driver error.

Public error response harus:

- Konsisten.
- Aman.
- Mempunyai code.
- Mempunyai message yang dapat dipahami.

---

# 13. Next.js Rules

## 13.1 Server Components by Default

Component baru menggunakan Server Component secara default.

`"use client"` hanya digunakan jika membutuhkan:

- Browser event.
- Local interactive state.
- Effect.
- Client chart.
- Client map.
- Browser storage.
- Interactive dialog atau drawer.

Client boundary harus sekecil mungkin.

---

## 13.2 Route Handlers

Public API mengikuti struktur:

`src/app/api/v1/<domain>/<resource>/route.ts`

Route handler bertanggung jawab atas:

- Membaca request.
- Memvalidasi input.
- Memanggil service.
- Menghasilkan response.
- Menangani error.

Route handler tidak boleh berisi query database kompleks.

Query ditempatkan pada:

`src/features/<domain>/server/`

---

## 13.3 Query Validation

Semua query parameter MUST divalidasi menggunakan Zod.

Raw `searchParams` tidak boleh langsung digunakan dalam query database.

Validation harus mencakup:

- Required parameter.
- Format.
- Enum.
- Minimum dan maximum.
- Range consistency.
- Slug format.

Invalid query menghasilkan HTTP 400.

---

## 13.4 API Response

Success response:

    {
      "success": true,
      "data": [],
      "meta": {}
    }

Error response:

    {
      "success": false,
      "error": {
        "code": "ERROR_CODE",
        "message": "Pesan aman untuk pengguna"
      }
    }

Status umum:

| Status | Usage                      |
| ------ | -------------------------- |
| `200`  | Request berhasil           |
| `400`  | Query tidak valid          |
| `401`  | Belum terautentikasi       |
| `403`  | Tidak memiliki izin        |
| `404`  | Resource tidak ditemukan   |
| `409`  | Conflict                   |
| `422`  | Semantically invalid input |
| `500`  | Internal error             |

---

## 13.5 Caching

Public statistical API MAY menggunakan caching jika datanya:

- Published.
- Tidak bersifat personal.
- Tidak berubah setiap saat.

Error response dan private response MUST menggunakan:

`Cache-Control: no-store`

Cache tidak boleh menyebabkan draft record menjadi terlihat setelah status record berubah.

---

# 14. Feature Structure Rules

Feature menggunakan struktur:

    src/features/<feature>/
    ├── components/
    ├── lib/
    ├── policies/
    ├── schemas/
    ├── server/
    ├── types/
    └── tests/

Aturan:

- `components`: UI feature.
- `schemas`: Zod validation.
- `server`: database dan server logic.
- `types`: public contract.
- `policies`: business/access policy.
- `lib`: pure helper.
- Shared code ditempatkan di `features/shared` hanya jika benar-benar digunakan lintas feature.

Contributor SHOULD NOT membuat shared abstraction sebelum terdapat minimal dua penggunaan nyata.

---

# 15. UI and Style Guide Rules

Detail visual terdapat pada `DESIGN.md`.

Implementasi MUST mengikuti:

- MineVision visual identity.
- Dark navy foundation.
- Cyan, blue, dan teal accents.
- Merriweather untuk heading.
- Lato untuk body dan interface.
- Semantic design token.
- Responsive layout.
- Accessible interaction.

Contributor MUST NOT:

- Menggunakan warna acak tanpa token.
- Membuat tampilan baru dengan visual language berbeda.
- Menggunakan gradient berlebihan.
- Menggunakan glow yang mengurangi keterbacaan.
- Menghilangkan focus state.
- Menganggap desktop Figma sebagai satu-satunya ukuran layar.

---

## 15.1 Component Reuse

Sebelum membuat komponen baru, contributor harus memeriksa:

- `src/components/ui`
- `src/components/shared`
- Feature components yang relevan

Komponen baru SHOULD dibuat reusable jika pola yang sama dipakai pada beberapa halaman.

Contoh shared data components:

- `MetricCard`
- `ChartCard`
- `CitationList`
- `FilterPanel`
- `EmptyState`
- `VerificationPendingState`

---

## 15.2 Responsive Rules

Minimum target:

- Mobile.
- Tablet.
- Desktop.

Komponen MUST diuji pada ukuran sempit.

Contributor MUST memeriksa:

- Horizontal overflow.
- Text wrapping.
- Touch target.
- Chart readability.
- Filter usability.
- Table scrolling.
- MineBot position.
- Header navigation.

---

## 15.3 Accessibility

Target minimum:

WCAG 2.2 Level AA.

MUST:

- Menggunakan semantic HTML.
- Menyediakan accessible name.
- Menjaga heading hierarchy.
- Menyediakan visible focus.
- Mendukung keyboard.
- Menyediakan label form.
- Menjaga contrast.
- Memberikan text alternative untuk chart.
- Tidak menggunakan warna sebagai satu-satunya indikator.
- Menghormati `prefers-reduced-motion`.

---

# 16. Data Visualization Rules

Chart MUST mempunyai:

- Title.
- Unit.
- Period.
- Source.
- Status data.
- Tooltip.
- Empty state.
- Loading state.
- Error state.
- Text atau table fallback.

Chart MUST NOT:

- Mengubah `NULL` menjadi nol.
- Menggabungkan unit berbeda.
- Menggabungkan currency berbeda tanpa konversi.
- Menampilkan projection seperti actual.
- Memotong axis secara menyesatkan.
- Menyembunyikan tahun yang hilang.

Status visual:

| Record type   | Visual treatment    |
| ------------- | ------------------- |
| `actual`      | Solid primary line  |
| `provisional` | Warning indicator   |
| `projection`  | Dashed line         |
| `revised`     | Info indicator      |
| Missing       | Gap                 |
| Reported zero | Explicit zero point |

---

# 17. Content and Language Rules

Bahasa utama public content adalah Bahasa Indonesia.

Istilah module dapat mempertahankan brand naming seperti:

- Intelligence.
- Economy.
- MineBot.

Content MUST:

- Jelas.
- Berbasis fakta.
- Menyebut sumber.
- Tidak membuat klaim berlebihan.
- Membedakan fakta dan interpretasi.
- Menjelaskan istilah teknis jika diperlukan.

Content MUST NOT:

- Menjiplak sumber.
- Menggunakan paragraf panjang dari sumber lain.
- Menampilkan statistik tanpa periode.
- Menampilkan angka tanpa satuan.
- Menyatakan proyeksi sebagai fakta aktual.

---

# 18. Security Rules

## 18.1 Environment Variables

Secret hanya disimpan pada environment variable.

Dilarang commit:

- `.env`
- `.env.local`
- Database password.
- Supabase service role key.
- API secret.
- Private token.
- Connection string berisi credential.

`.env.example` hanya berisi:

- Nama variable.
- Placeholder aman.
- Penjelasan singkat.

---

## 18.2 Database Credential

Client browser tidak boleh menerima:

- Direct database URL.
- Service role key.
- Migration credential.
- Admin database credential.

Service role hanya digunakan pada trusted server environment.

---

## 18.3 Input Validation

Semua external input dianggap tidak tepercaya.

Validation diperlukan pada:

- Query parameter.
- Route parameter.
- Request body.
- Uploaded file.
- Search query.
- Admin form.
- AI input.
- Ingestion data.

---

## 18.4 Logging

Log tidak boleh menyimpan:

- Password.
- Token.
- Connection string.
- Full environment dump.
- Sensitive user information.
- Raw uploaded private document tanpa kebutuhan.

Log SHOULD mempunyai:

- Event.
- Safe identifier.
- Timestamp.
- Error category.
- Request context yang tidak sensitif.

---

## 18.5 Authentication and Authorization

- Konten publik MUST tetap dapat diakses tanpa login.
- Optional user login MUST menggunakan Google OAuth melalui Supabase Auth pada MVP.
- Administrator MUST menggunakan akun email/password yang dibuat atau diundang melalui trusted internal process.
- User dan administrator MUST menggunakan Supabase Auth sebagai identity source yang sama.
- Password, access token, refresh token, dan provider token MUST NOT disimpan pada application tables atau log.
- User baru MUST memperoleh application role `user` secara default.
- Role administratif MUST NOT diberikan berdasarkan provider, alamat email, domain email, redirect parameter, atau pilihan UI saja.
- PostgreSQL/Supabase role `authenticated` MUST NOT dianggap sama dengan application role administrator.
- Protected admin operation MUST memeriksa session, role, permission, resource, dan action pada server.
- User MUST NOT dapat mengubah role assignment miliknya sendiri.
- OAuth callback MUST menggunakan redirect allowlist dan menolak external destination yang tidak disetujui.
- UI hiding dan navigation state MUST NOT digunakan sebagai authorization mechanism.

---

# 19. Testing Rules

## 19.1 Required Test Types

Perubahan SHOULD menambahkan test yang sesuai:

- Unit test.
- Schema validation test.
- Policy test.
- Route handler test.
- Data access test.
- Integration test jika diperlukan.

Database publication policy MUST mempunyai test yang memastikan:

- Draft tidak public.
- Pending tidak public.
- Rejected tidak public.
- Verified dan published dapat public.
- Invalid filter ditolak.

---

## 19.2 Mandatory Verification Pipeline

Sebelum commit atau Pull Request:

    npx tsc --noEmit
    npm test
    npm run lint
    npm run build
    git diff --check

Jika database berubah:

    npm run db:verify

Jika ingestion berubah, jalankan validation pipeline yang relevan:

    npm run data:validate:intelligence -- <file>
    npm run data:preflight:intelligence -- <file>
    npm run data:dry-run:intelligence -- <file>
    npm run data:verify:intelligence -- <file>

Semua command harus selesai tanpa error.

Warning baru harus diperiksa dan tidak boleh diabaikan tanpa alasan.

---

# 20. Git Rules

## 20.1 Protected Main Branch

Perubahan tidak dilakukan langsung pada `main`.

Workflow:

1. Update `main`.
2. Buat feature branch.
3. Implementasi.
4. Test.
5. Commit.
6. Push.
7. Pull Request.
8. Review.
9. Merge.

---

## 20.2 Branch Naming

Format:

`<type>/<short-description>`

Contoh:

- `feat/economy-dashboard`
- `feat/admin-content-crud`
- `fix/export-filter`
- `refactor/shared-data-components`
- `docs/project-rules`
- `chore/update-dependencies`

---

## 20.3 Commit Message

Gunakan Conventional Commits.

Format:

`<type>(<scope>): <description>`

Type:

- `feat`
- `fix`
- `refactor`
- `test`
- `docs`
- `chore`
- `perf`
- `ci`
- `build`

Contoh:

`feat(economy): build public GDP dashboard`

Commit harus:

- Fokus.
- Dapat dipahami.
- Tidak mencampur perubahan tidak terkait.
- Tidak menyertakan generated atau temporary file yang tidak diperlukan.

---

## 20.4 Pull Request

Pull Request harus menjelaskan:

- Summary.
- Perubahan utama.
- Alasan teknis.
- Test yang dijalankan.
- Database impact.
- Security impact.
- Screenshot jika UI berubah.
- Known limitation.

PR tidak boleh di-merge jika:

- Test gagal.
- Build gagal.
- Migration belum diperiksa.
- Secret terdeteksi.
- Public data policy dilanggar.
- Scope perubahan tidak jelas.

---

# 21. AI Contributor Rules

## 21.1 Required AI Behavior

AI contributor MUST:

1. Membaca file yang relevan.
2. Memeriksa pola codebase.
3. Menjelaskan asumsi.
4. Membatasi perubahan pada scope.
5. Menjaga perubahan existing contributor.
6. Menambahkan test.
7. Menjalankan verification.
8. Melaporkan hasil secara jujur.
9. Menjelaskan file yang diubah.
10. Menyebutkan hal yang belum diverifikasi.

AI MUST membedakan:

- Fakta dari codebase.
- Informasi dari dokumen.
- Asumsi.
- Rekomendasi.
- Planned implementation.

---

## 21.2 AI Prohibitions

AI MUST NOT:

- Mengarang data pertambangan.
- Mengarang citation atau URL.
- Mengubah pending/draft menjadi verified/published.
- Menghapus data tanpa persetujuan.
- Menonaktifkan RLS.
- Memasukkan secret ke source code.
- Menjalankan destructive database command tanpa persetujuan.
- Mengedit migration yang sudah diterapkan.
- Menghapus test yang gagal hanya agar pipeline lulus.
- Menggunakan `any` atau `@ts-ignore` sebagai jalan pintas.
- Membuat dependency baru tanpa alasan.
- Mengganti framework atau arsitektur secara sepihak.
- Mengubah visual identity tanpa keputusan desain.
- Mengklaim test berhasil jika belum dijalankan.
- Mengklaim implementasi selesai jika masih ada error.
- Mengubah file yang tidak berhubungan dengan task.
- Melakukan push, merge, deployment, atau publication tanpa authorization.

---

## 21.3 Actions Requiring Explicit Approval

AI atau contributor harus meminta persetujuan sebelum:

- Menghapus tabel atau kolom.
- Menghapus record dalam jumlah besar.
- Menjalankan production migration.
- Mengubah public access policy.
- Mengubah data menjadi published.
- Menambah service eksternal berbayar.
- Mengganti database provider.
- Mengganti authentication provider.
- Mengganti chart atau map library utama.
- Mengubah major product scope.
- Mengirim data ke external AI service.
- Melakukan deployment production.
- Mengubah protected branch.
- Menggunakan credential dengan scope baru.

---

## 21.4 Allowed Autonomous Actions

Dalam scope task yang sudah jelas, AI MAY:

- Membaca source code.
- Membaca documentation.
- Menganalisis schema.
- Menambahkan file baru.
- Memperbaiki type error.
- Menambahkan test.
- Menjalankan test.
- Menjalankan lint.
- Menjalankan build.
- Melakukan non-destructive database verification.
- Menyarankan migration.
- Menyiapkan commit atau PR description.

Push, merge, publication, dan production deployment tetap membutuhkan authorization jika belum diminta.

---

## 21.5 AI Data Boundaries

AI-generated data tidak dianggap verified data.

Jika AI membantu:

- Normalisasi label.
- Mapping field.
- Membuat staging template.
- Menulis insight.
- Menyarankan metadata.

Hasilnya tetap harus:

- Ditinjau manusia.
- Diverifikasi dengan sumber.
- Disimpan sebagai pending/draft.
- Mempunyai provenance.

AI tidak boleh menjadi satu-satunya source untuk statistical record.

---

# 22. Dependency Rules

Dependency baru hanya ditambahkan jika:

- Fitur tidak dapat dibuat secara wajar dengan dependency yang ada.
- Package aktif dipelihara.
- License kompatibel.
- Security risk dapat diterima.
- Bundle impact diketahui.
- Tidak menduplikasi fungsi dependency lain.

Contributor MUST NOT menambahkan package hanya untuk helper sederhana.

Setelah dependency berubah:

- Periksa lockfile.
- Jalankan test.
- Jalankan build.
- Periksa vulnerability yang relevan.

---

# 23. Performance Rules

Frontend SHOULD:

- Menggunakan Server Component untuk content awal.
- Meminimalkan Client Component.
- Mengoptimalkan gambar.
- Lazy-load visualisasi berat.
- Menghindari duplicate request.
- Menghindari hydration yang tidak diperlukan.

Database SHOULD:

- Menggunakan index sesuai pola query.
- Menghindari N+1 query.
- Menghindari select semua kolom jika tidak diperlukan.
- Menggunakan pagination untuk dataset besar.
- Menggunakan view untuk metric berulang.
- Menggunakan transaction untuk perubahan terkait.

---

# 24. Documentation Rules

Dokumentasi diperbarui jika terjadi perubahan pada:

| Change                              | Required document |
| ----------------------------------- | ----------------- |
| Product scope                       | `PRD.md`          |
| Architecture                        | `ARCHITECTURE.md` |
| UI pattern                          | `DESIGN.md`       |
| Table, column, relation, constraint | `SCHEMA.md`       |
| Workflow atau convention            | `RULES.md`        |

Dokumentasi tidak boleh menggambarkan fitur planned sebagai implemented.

Gunakan status:

- Implemented.
- In progress.
- Planned.
- Deferred.
- Deprecated.

---

# 25. Exception Process

Jika contributor harus melanggar aturan karena alasan teknis:

1. Jelaskan aturan yang terpengaruh.
2. Jelaskan alasan.
3. Jelaskan risiko.
4. Jelaskan alternatif yang dipertimbangkan.
5. Minta persetujuan.
6. Dokumentasikan keputusan.
7. Tambahkan test atau mitigation.

Exception tidak boleh dibuat hanya untuk mempercepat pekerjaan.

---

# 26. Definition of Done

Task dianggap selesai jika:

- Scope terpenuhi.
- Implementasi mengikuti arsitektur.
- Database integrity terjaga.
- Public visibility terjaga.
- Source dan provenance terjaga.
- UI mengikuti design system.
- Accessibility dasar terpenuhi.
- Test tersedia.
- Type-check berhasil.
- Test berhasil.
- Lint berhasil.
- Build berhasil.
- Diff check berhasil.
- Tidak ada secret.
- Dokumentasi diperbarui.
- Working tree hanya berisi perubahan terkait.
- Limitation dilaporkan secara jujur.

---

# 27. Contributor Checklist

Sebelum memulai:

- [ ] Branch sudah benar.
- [ ] Working tree sudah diperiksa.
- [ ] Scope task dipahami.
- [ ] File terkait sudah dibaca.
- [ ] Dokumen terkait sudah diperiksa.

Sebelum commit:

- [ ] Tidak ada data atau source yang dikarang.
- [ ] Tidak ada secret.
- [ ] Tidak ada debug code.
- [ ] Tidak ada unrelated change.
- [ ] Schema dan migration sinkron.
- [ ] Public visibility aman.
- [ ] Test sudah ditambahkan.
- [ ] Type-check berhasil.
- [ ] Test berhasil.
- [ ] Lint berhasil.
- [ ] Build berhasil.
- [ ] Diff check berhasil.

Sebelum merge:

- [ ] Pull Request menjelaskan scope.
- [ ] Migration telah diperiksa.
- [ ] Security impact diperiksa.
- [ ] Database impact diperiksa.
- [ ] Dokumentasi telah diperbarui.
- [ ] Review selesai.
- [ ] CI berhasil.
