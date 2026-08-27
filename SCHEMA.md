# MineVision — Database Schema

## 1. Document Information

- Document: `SCHEMA.md`
- Product: MineVision Intelligence Platform
- Database: PostgreSQL
- Database provider: Supabase
- ORM and schema management: Drizzle ORM + Drizzle Kit
- Status: Current implementation baseline
- Related documents:
  - `PRD.md`
  - `ARCHITECTURE.md`
  - `DESIGN.md`
  - `RULES.md`

Dokumen ini menjelaskan struktur database MineVision yang sudah diterapkan, meliputi:

- Tabel.
- Kolom dan tipe data.
- Primary key.
- Foreign key.
- Relasi.
- Enum.
- Unique constraint.
- Check constraint.
- Index.
- Database view.
- Row Level Security.
- Aturan integritas data.

Jika terdapat perbedaan antara dokumen ini dan source code, urutan sumber kebenaran adalah:

1. Migration PostgreSQL yang telah diterapkan.
2. Drizzle schema pada `src/db/schema`.
3. Dokumen `SCHEMA.md`.

---

# 2. Schema Design Principles

## 2.1 Relational Core

Data utama menggunakan model relasional agar:

- Foreign key dapat menjamin integritas.
- Duplikasi data berkurang.
- Sumber data dapat ditelusuri.
- Status verifikasi dan publikasi dapat dikontrol.
- Data dapat di-query dan diagregasi secara aman.

## 2.2 UUID Primary Key

Sebagian besar tabel menggunakan:

- Tipe: `uuid`
- Default: `gen_random_uuid()`
- Constraint: `PRIMARY KEY`

UUID dipilih agar data dapat dibuat dari beberapa proses ingestion tanpa bergantung pada sequence database.

Pengecualian:

- `measurement_units.code` menggunakan natural key.
- `content_sources` menggunakan composite primary key.

## 2.3 Exact Numeric Values

Nilai produksi, harga, GDP, investasi, kapasitas, dan ekspor menggunakan `numeric`, bukan floating point.

Tujuannya:

- Menghindari floating-point rounding.
- Menjaga presisi data ekonomi.
- Mendukung skala nilai yang besar.
- Menjamin hasil agregasi lebih konsisten.

## 2.4 Source Traceability

Setiap statistical record harus mempunyai sumber utama melalui `source_id`.

Record juga dapat mempunyai beberapa citation melalui tabel penghubung:

- `commodity_production_sources`
- `economic_gdp_sources`
- `mining_investment_sources`
- `minerba_export_sources`
- `smelter_facility_sources`
- `content_sources`

## 2.5 Publication Workflow

Data statistik menggunakan dua status terpisah:

- `verification_status`
- `publication_status`

Data hanya boleh ditampilkan melalui API publik jika:

- `verification_status = verified`
- `publication_status = published`

Pemisahan ini mencegah data yang sudah diverifikasi otomatis menjadi publik sebelum mendapatkan persetujuan publikasi.

## 2.6 Metadata Extension

Beberapa tabel mempunyai kolom:

`metadata jsonb NOT NULL DEFAULT '{}'::jsonb`

Metadata digunakan untuk atribut tambahan yang:

- Tidak cukup stabil untuk menjadi kolom utama.
- Tidak menjadi dasar relasi.
- Tidak sering digunakan sebagai filter.
- Tidak mempunyai aturan integritas penting.

Informasi penting seperti nilai, unit, tahun, status, wilayah, dan sumber tidak boleh disimpan hanya di dalam `metadata`.

---

# 3. Naming Conventions

## 3.1 Database Naming

Database menggunakan `snake_case`.

Contoh:

- `commodity_production`
- `verification_status`
- `source_published_at`

## 3.2 TypeScript Naming

Drizzle schema menggunakan `camelCase`.

Contoh:

- `commodityProduction`
- `verificationStatus`
- `sourcePublishedAt`

## 3.3 Constraint Naming

Format umum:

- Primary key: `<table>_pkey`
- Foreign key: `<table>_<column>_fk`
- Unique: `<table>_<purpose>_unique`
- Check: `<table>_<purpose>_check`
- Index: `<table>_<purpose>_idx`
- RLS policy: `public_read_<purpose>`

## 3.4 Timestamp Naming

Kolom audit standar:

| Column       | Type          | Default |
| ------------ | ------------- | ------- |
| `created_at` | `timestamptz` | `now()` |
| `updated_at` | `timestamptz` | `now()` |

`updated_at` harus diperbarui oleh application service atau database trigger ketika record berubah.

---

# 4. PostgreSQL Enums

## 4.1 `commodity_category`

Kategori komoditas.

- `metal_mineral`
- `non_metal_mineral`
- `energy`

## 4.2 `content_module`

Modul pemilik content.

- `education`
- `industry`
- `commodities`
- `career`
- `intelligence`
- `economy`
- `about`

## 4.3 `content_type`

Jenis content.

- `article`
- `glossary`
- `company_profile`
- `commodity_profile`
- `profession`
- `data_insight`
- `policy`
- `page`

## 4.4 `data_record_type`

Jenis record berdasarkan tingkat kematangan data.

- `actual`
- `provisional`
- `projection`
- `revised`

## 4.5 `verification_status`

Status pemeriksaan data.

- `pending`
- `verified`
- `rejected`

## 4.6 `publication_status`

Status publikasi.

- `draft`
- `in_review`
- `published`
- `archived`

## 4.7 `measurement_category`

Kategori satuan.

- `mass`
- `currency`
- `currency_per_mass`
- `percentage`
- `energy`
- `count`
- `other`

## 4.8 `price_period`

Periode harga.

- `daily`
- `weekly`
- `monthly`
- `quarterly`
- `annual`
- `custom`

## 4.9 `region_level`

Tingkat administratif atau geografis.

- `country`
- `province`
- `regency`
- `city`

## 4.10 `source_type`

Jenis sumber.

- `government`
- `statistics_agency`
- `company_report`
- `academic`
- `regulation`
- `market_data`
- `other`

## 4.11 `gdp_price_basis`

Dasar harga GDP.

- `current_prices`
- `constant_prices`

## 4.12 `statistical_data_status`

Status resmi data statistik.

- `final`
- `preliminary`
- `very_preliminary`

## 4.13 `investment_origin_type`

Asal investasi.

- `pma`
- `pmdn`

## 4.14 `trade_data_availability`

Ketersediaan data perdagangan.

- `reported`
- `not_reported`
- `reported_zero`
- `estimated`

Arti status:

| Status          | Meaning                          |
| --------------- | -------------------------------- |
| `reported`      | Nilai tersedia dan dilaporkan    |
| `not_reported`  | Data tidak dilaporkan            |
| `reported_zero` | Data dilaporkan dengan nilai nol |
| `estimated`     | Nilai merupakan hasil estimasi   |

## 4.15 `smelter_facility_type`

Jenis fasilitas pengolahan.

- `smelter`
- `refinery`
- `integrated_processing`
- `other`

## 4.16 `smelter_facility_status`

Status fasilitas.

- `planned`
- `construction`
- `commissioning`
- `operating`
- `temporarily_suspended`
- `inactive`
- `unknown`

---

# 5. Schema Overview

Database MineVision dibagi menjadi beberapa domain.

## 5.1 Master Data

- `sources`
- `measurement_units`
- `regions`
- `commodities`

## 5.2 Content

- `content_categories`
- `contents`
- `content_sources`

## 5.3 Commodity Intelligence

- `commodity_production`
- `commodity_production_sources`
- `commodity_production_locations`
- `commodity_price_standards`
- `commodity_domestic_prices`

## 5.4 Economy

- `economic_gdp_annual`
- `economic_gdp_sources`
- `mining_investment_annual`
- `mining_investment_sources`
- `minerba_exports_annual`
- `minerba_export_sources`

## 5.5 Smelters

- `smelter_operators`
- `smelter_facilities`
- `smelter_facility_outputs`
- `smelter_facility_sources`

## 5.6 Analytical Views

- `economic_gdp_annual_metrics`
- `mining_investment_annual_metrics`
- `mining_investment_annual_summary`
- `minerba_exports_annual_metrics`
- `smelter_facility_catalog`
- `smelter_summary_by_commodity`

Total current physical tables: 22.

Total current analytical views: 6.

---

# 6. Core Relationship Map

Relasi utama:

- `sources` menjadi master referensi untuk content dan statistical data.
- `measurement_units` menjadi master satuan untuk produksi, harga, ekspor, dan kapasitas smelter.
- `regions` mempunyai hierarchical self-reference melalui `parent_id`.
- `commodities` menjadi master komoditas untuk Intelligence, ekspor, dan smelter.
- `commodity_production` dimiliki oleh satu komoditas dan satu unit.
- `economic_gdp_annual` dimiliki oleh satu wilayah.
- `mining_investment_annual` dimiliki oleh satu wilayah.
- `minerba_exports_annual` dimiliki oleh satu komoditas, satu wilayah asal, dan optional wilayah tujuan.
- `smelter_facilities` dimiliki satu operator dan satu provinsi.
- `smelter_facility_outputs` menghubungkan fasilitas dengan komoditas dan produk.
- `contents` dapat dimiliki satu kategori dan mempunyai banyak sumber.

Cardinality summary:

| Parent                     | Child                       | Cardinality           |
| -------------------------- | --------------------------- | --------------------- |
| `sources`                  | Statistical records         | One-to-many           |
| `measurement_units`        | Data records                | One-to-many           |
| `regions`                  | `regions`                   | One-to-many recursive |
| `commodities`              | `commodity_production`      | One-to-many           |
| `commodities`              | `commodity_domestic_prices` | One-to-many           |
| `commodities`              | `minerba_exports_annual`    | One-to-many           |
| `commodities`              | `smelter_facility_outputs`  | One-to-many           |
| `content_categories`       | `contents`                  | One-to-many           |
| `contents`                 | `sources`                   | Many-to-many          |
| `commodity_production`     | `sources`                   | Many-to-many          |
| `economic_gdp_annual`      | `sources`                   | Many-to-many          |
| `mining_investment_annual` | `sources`                   | Many-to-many          |
| `minerba_exports_annual`   | `sources`                   | Many-to-many          |
| `smelter_operators`        | `smelter_facilities`        | One-to-many           |
| `smelter_facilities`       | `smelter_facility_outputs`  | One-to-many           |
| `smelter_facilities`       | `smelter_facility_sources`  | One-to-many           |

---

# 7. Master Data Tables

## 7.1 `sources`

Menyimpan organisasi dan referensi sumber yang digunakan MineVision.

| Column                | Type                  | Null | Default     | Description              |
| --------------------- | --------------------- | ---: | ----------- | ------------------------ |
| `id`                  | `uuid`                |   No | Random UUID | Primary key              |
| `name`                | `varchar(200)`        |   No | —           | Nama sumber              |
| `slug`                | `varchar(220)`        |   No | —           | Identifier URL           |
| `type`                | `source_type`         |   No | —           | Jenis sumber             |
| `organization`        | `varchar(200)`        |   No | —           | Organisasi penerbit      |
| `url`                 | `text`                |  Yes | —           | URL utama                |
| `description`         | `text`                |  Yes | —           | Deskripsi sumber         |
| `is_official`         | `boolean`             |   No | `false`     | Sumber resmi             |
| `verification_status` | `verification_status` |   No | `pending`   | Status verifikasi sumber |
| `verified_at`         | `timestamptz`         |  Yes | —           | Waktu verifikasi         |
| `is_active`           | `boolean`             |   No | `true`      | Status aktif             |
| `created_at`          | `timestamptz`         |   No | `now()`     | Waktu pembuatan          |
| `updated_at`          | `timestamptz`         |   No | `now()`     | Waktu perubahan          |

Constraints:

- Primary key: `id`
- Unique: `slug`

Indexes:

- `type`
- `is_official`
- `verification_status`
- `is_active`

Business invariant:

- Sumber publik harus aktif dan terverifikasi.
- `verified_at` diisi ketika `verification_status` menjadi `verified`.

---

## 7.2 `measurement_units`

Master satuan pengukuran.

| Column        | Type                   | Null | Default | Description     |
| ------------- | ---------------------- | ---: | ------- | --------------- |
| `code`        | `varchar(50)`          |   No | —       | Primary key     |
| `name`        | `varchar(120)`         |   No | —       | Nama satuan     |
| `symbol`      | `varchar(30)`          |   No | —       | Simbol          |
| `category`    | `measurement_category` |   No | —       | Kategori satuan |
| `description` | `text`                 |  Yes | —       | Deskripsi       |
| `is_active`   | `boolean`              |   No | `true`  | Status aktif    |
| `created_at`  | `timestamptz`          |   No | `now()` | Waktu pembuatan |
| `updated_at`  | `timestamptz`          |   No | `now()` | Waktu perubahan |

Constraints:

- Primary key: `code`

Contoh code:

- `metric_ton`
- `kilogram`
- `troy_ounce`
- `idr`
- `usd`
- `usd_per_metric_ton`
- `percentage`

Satuan yang sudah digunakan oleh record tidak boleh dihapus. Satuan dapat dinonaktifkan dengan `is_active = false`.

---

## 7.3 `regions`

Master wilayah hierarkis.

| Column       | Type            | Null | Default     | Description       |
| ------------ | --------------- | ---: | ----------- | ----------------- |
| `id`         | `uuid`          |   No | Random UUID | Primary key       |
| `parent_id`  | `uuid`          |  Yes | —           | Parent region     |
| `code`       | `varchar(30)`   |  Yes | —           | Kode wilayah      |
| `name`       | `varchar(160)`  |   No | —           | Nama wilayah      |
| `slug`       | `varchar(180)`  |   No | —           | Identifier URL    |
| `level`      | `region_level`  |   No | —           | Tingkat wilayah   |
| `latitude`   | `numeric(10,7)` |  Yes | —           | Latitude          |
| `longitude`  | `numeric(10,7)` |  Yes | —           | Longitude         |
| `metadata`   | `jsonb`         |   No | `{}`        | Metadata tambahan |
| `is_active`  | `boolean`       |   No | `true`      | Status aktif      |
| `created_at` | `timestamptz`   |   No | `now()`     | Waktu pembuatan   |
| `updated_at` | `timestamptz`   |   No | `now()`     | Waktu perubahan   |

Foreign key:

- `parent_id → regions.id`
- On update: `CASCADE`
- On delete: `RESTRICT`

Constraints:

- Unique: `code`
- Unique: `slug`
- Latitude: `-90 ≤ latitude ≤ 90`
- Longitude: `-180 ≤ longitude ≤ 180`

Indexes:

- `parent_id`
- `level`
- `name`
- `is_active`

Hierarchy example:

`Indonesia → Sulawesi Tengah → Morowali`

Negara tujuan ekspor juga dapat disimpan sebagai region level `country`.

---

## 7.4 `commodities`

Master komoditas pertambangan.

| Column                         | Type                 | Null | Default     | Description                 |
| ------------------------------ | -------------------- | ---: | ----------- | --------------------------- |
| `id`                           | `uuid`               |   No | Random UUID | Primary key                 |
| `name`                         | `varchar(160)`       |   No | —           | Nama komoditas              |
| `slug`                         | `varchar(180)`       |   No | —           | Identifier URL              |
| `symbol`                       | `varchar(30)`        |  Yes | —           | Simbol kimia atau singkatan |
| `category`                     | `commodity_category` |   No | —           | Kategori komoditas          |
| `description`                  | `text`               |  Yes | —           | Deskripsi                   |
| `specification`                | `text`               |  Yes | —           | Spesifikasi                 |
| `default_production_unit_code` | `varchar(50)`        |  Yes | —           | Satuan produksi default     |
| `image_url`                    | `text`               |  Yes | —           | URL gambar                  |
| `is_intelligence_tracked`      | `boolean`            |   No | `false`     | Masuk Intelligence          |
| `display_order`                | `integer`            |   No | `0`         | Urutan tampilan             |
| `is_active`                    | `boolean`            |   No | `true`      | Status aktif                |
| `metadata`                     | `jsonb`              |   No | `{}`        | Metadata tambahan           |
| `created_at`                   | `timestamptz`        |   No | `now()`     | Waktu pembuatan             |
| `updated_at`                   | `timestamptz`        |   No | `now()`     | Waktu perubahan             |

Foreign key:

- `default_production_unit_code → measurement_units.code`
- On update: `CASCADE`
- On delete: `RESTRICT`

Constraints:

- Primary key: `id`
- Unique: `slug`

Indexes:

- `name`
- `category`
- `display_order`
- `is_intelligence_tracked`
- `is_active`

---

# 8. Content Tables

## 8.1 `content_categories`

Kategori hierarchical untuk content.

| Column          | Type             | Null | Default     | Description     |
| --------------- | ---------------- | ---: | ----------- | --------------- |
| `id`            | `uuid`           |   No | Random UUID | Primary key     |
| `module`        | `content_module` |   No | —           | Modul           |
| `parent_id`     | `uuid`           |  Yes | —           | Parent category |
| `name`          | `varchar(160)`   |   No | —           | Nama kategori   |
| `slug`          | `varchar(180)`   |   No | —           | Slug            |
| `description`   | `text`           |  Yes | —           | Deskripsi       |
| `display_order` | `integer`        |   No | `0`         | Urutan          |
| `is_active`     | `boolean`        |   No | `true`      | Status aktif    |
| `created_at`    | `timestamptz`    |   No | `now()`     | Waktu pembuatan |
| `updated_at`    | `timestamptz`    |   No | `now()`     | Waktu perubahan |

Foreign key:

- `parent_id → content_categories.id`
- On delete: `SET NULL`

Constraints:

- Unique combination: `(module, slug)`

Indexes:

- `module`
- `parent_id`
- `is_active`

---

## 8.2 `contents`

Menyimpan artikel, glossary, profil perusahaan, profesi, insight, policy, dan halaman.

| Column                 | Type                 | Null | Default      | Description      |
| ---------------------- | -------------------- | ---: | ------------ | ---------------- |
| `id`                   | `uuid`               |   No | Random UUID  | Primary key      |
| `module`               | `content_module`     |   No | —            | Modul            |
| `type`                 | `content_type`       |   No | —            | Jenis content    |
| `category_id`          | `uuid`               |  Yes | —            | Kategori         |
| `title`                | `varchar(240)`       |   No | —            | Judul            |
| `slug`                 | `varchar(260)`       |   No | —            | Slug             |
| `excerpt`              | `text`               |  Yes | —            | Ringkasan        |
| `body`                 | `text`               |   No | Empty string | Isi utama        |
| `cover_image_url`      | `text`               |  Yes | —            | Gambar utama     |
| `status`               | `publication_status` |   No | `draft`      | Status publikasi |
| `published_at`         | `timestamptz`        |  Yes | —            | Waktu publikasi  |
| `reading_time_minutes` | `integer`            |  Yes | —            | Estimasi baca    |
| `is_featured`          | `boolean`            |   No | `false`      | Featured content |
| `metadata`             | `jsonb`              |   No | `{}`         | Metadata         |
| `created_at`           | `timestamptz`        |   No | `now()`      | Waktu pembuatan  |
| `updated_at`           | `timestamptz`        |   No | `now()`      | Waktu perubahan  |

Foreign key:

- `category_id → content_categories.id`
- On delete: `SET NULL`

Constraints:

- Unique combination: `(module, slug)`

Indexes:

- `module`
- `type`
- `category_id`
- `status`
- `published_at`
- `is_featured`

Publication invariant:

- Content publik harus mempunyai `status = published`.
- `published_at` harus terisi untuk content published.

Regulasi Minerba tidak menggunakan dedicated statistical table. Regulasi editorial disimpan sebagai:

- `module = economy`
- `type = policy`

Referensinya disimpan melalui `content_sources`.

---

## 8.3 `content_sources`

Many-to-many relationship antara content dan source.

| Column           | Type          | Null | Default | Description     |
| ---------------- | ------------- | ---: | ------- | --------------- |
| `content_id`     | `uuid`        |   No | —       | Content         |
| `source_id`      | `uuid`        |   No | —       | Source          |
| `citation_label` | `text`        |  Yes | —       | Label citation  |
| `page_reference` | `text`        |  Yes | —       | Halaman         |
| `notes`          | `text`        |  Yes | —       | Catatan         |
| `accessed_at`    | `timestamptz` |  Yes | —       | Waktu akses     |
| `display_order`  | `integer`     |   No | `0`     | Urutan sumber   |
| `created_at`     | `timestamptz` |   No | `now()` | Waktu pembuatan |
| `updated_at`     | `timestamptz` |   No | `now()` | Waktu perubahan |

Primary key:

- `(content_id, source_id)`

Foreign keys:

- `content_id → contents.id`
  - On delete: `CASCADE`
- `source_id → sources.id`
  - On delete: `RESTRICT`

---

# 9. Commodity Intelligence Tables

## 9.1 `commodity_production`

Data produksi komoditas tahunan.

| Column                | Type                  | Null | Default     | Description     |
| --------------------- | --------------------- | ---: | ----------- | --------------- |
| `id`                  | `uuid`                |   No | Random UUID | Primary key     |
| `commodity_id`        | `uuid`                |   No | —           | Komoditas       |
| `year`                | `smallint`            |   No | —           | Tahun           |
| `production_value`    | `numeric(24,6)`       |   No | —           | Nilai produksi  |
| `unit_code`           | `varchar(50)`         |   No | —           | Satuan          |
| `record_type`         | `data_record_type`    |   No | `actual`    | Jenis record    |
| `source_id`           | `uuid`                |   No | —           | Sumber utama    |
| `verification_status` | `verification_status` |   No | `pending`   | Verifikasi      |
| `publication_status`  | `publication_status`  |   No | `draft`     | Publikasi       |
| `notes`               | `text`                |  Yes | —           | Catatan         |
| `created_at`          | `timestamptz`         |   No | `now()`     | Waktu pembuatan |
| `updated_at`          | `timestamptz`         |   No | `now()`     | Waktu perubahan |

Foreign keys:

- `commodity_id → commodities.id`
- `unit_code → measurement_units.code`
- `source_id → sources.id`

Semua menggunakan:

- On update: `CASCADE`
- On delete: `RESTRICT`

Constraints:

- `production_value >= 0`
- `1900 ≤ year ≤ 2100`
- Unique: `(commodity_id, year, record_type)`

Indexes:

- `commodity_id`
- `year`
- `record_type`
- `source_id`
- `verification_status`
- `publication_status`

---

## 9.2 `commodity_production_sources`

Citation tambahan untuk production record.

| Column           | Type           | Null | Default     |
| ---------------- | -------------- | ---: | ----------- |
| `id`             | `uuid`         |   No | Random UUID |
| `production_id`  | `uuid`         |   No | —           |
| `source_id`      | `uuid`         |   No | —           |
| `citation_label` | `varchar(255)` |   No | —           |
| `source_url`     | `text`         |  Yes | —           |
| `page_reference` | `varchar(100)` |  Yes | —           |
| `is_primary`     | `boolean`      |   No | `false`     |
| `created_at`     | `timestamptz`  |   No | `now()`     |
| `updated_at`     | `timestamptz`  |   No | `now()`     |

Foreign keys:

- `production_id → commodity_production.id`
  - On delete: `CASCADE`
- `source_id → sources.id`
  - On delete: `RESTRICT`

Constraints:

- Citation label tidak boleh kosong.
- Unique: `(production_id, source_id, citation_label)`
- Maksimum satu `is_primary = true` untuk setiap production record.

---

## 9.3 `commodity_production_locations`

Lokasi utama penghasil komoditas.

| Column                | Type                  | Null | Default     |
| --------------------- | --------------------- | ---: | ----------- |
| `id`                  | `uuid`                |   No | Random UUID |
| `commodity_id`        | `uuid`                |   No | —           |
| `region_id`           | `uuid`                |   No | —           |
| `year`                | `smallint`            |  Yes | —           |
| `production_value`    | `numeric(24,6)`       |  Yes | —           |
| `unit_code`           | `varchar(50)`         |  Yes | —           |
| `share_percentage`    | `numeric(7,4)`        |  Yes | —           |
| `producer_rank`       | `smallint`            |  Yes | —           |
| `record_type`         | `data_record_type`    |   No | `actual`    |
| `source_id`           | `uuid`                |   No | —           |
| `verification_status` | `verification_status` |   No | `pending`   |
| `publication_status`  | `publication_status`  |   No | `draft`     |
| `notes`               | `text`                |  Yes | —           |
| `location_detail`     | `text`                |  Yes | —           |
| `created_at`          | `timestamptz`         |   No | `now()`     |
| `updated_at`          | `timestamptz`         |   No | `now()`     |

Foreign keys:

- `commodity_id → commodities.id`
- `region_id → regions.id`
- `unit_code → measurement_units.code`
- `source_id → sources.id`

Constraints:

- `production_value >= 0`
- `producer_rank > 0`
- `0 ≤ share_percentage ≤ 100`
- Production value wajib mempunyai unit.
- Record harus mempunyai minimal salah satu:
  - `production_value`
  - `share_percentage`
  - `producer_rank`
  - `location_detail`
- Jika `year IS NULL`, numeric annual data harus kosong.
- Annual unique: `(commodity_id, region_id, year, record_type)`
- Undated unique: `(commodity_id, region_id, record_type)`

---

## 9.4 `commodity_price_standards`

Master standar harga, misalnya HBA, HMA, atau HPM.

| Column                  | Type           | Null | Default     |
| ----------------------- | -------------- | ---: | ----------- |
| `id`                    | `uuid`         |   No | Random UUID |
| `commodity_id`          | `uuid`         |   No | —           |
| `code`                  | `varchar(60)`  |   No | —           |
| `name`                  | `varchar(200)` |   No | —           |
| `description`           | `text`         |  Yes | —           |
| `methodology`           | `text`         |  Yes | —           |
| `default_currency_code` | `varchar(3)`   |   No | —           |
| `default_unit_code`     | `varchar(50)`  |   No | —           |
| `issuing_source_id`     | `uuid`         |   No | —           |
| `is_active`             | `boolean`      |   No | `true`      |
| `created_at`            | `timestamptz`  |   No | `now()`     |
| `updated_at`            | `timestamptz`  |   No | `now()`     |

Foreign keys:

- `commodity_id → commodities.id`
- `default_unit_code → measurement_units.code`
- `issuing_source_id → sources.id`

Constraints:

- Unique: `code`
- Unique: `(commodity_id, name)`
- Currency code harus sesuai `^[A-Z]{3}$`.

---

## 9.5 `commodity_domestic_prices`

Nilai harga domestik berdasarkan standar harga.

| Column                | Type                  | Null | Default     |
| --------------------- | --------------------- | ---: | ----------- |
| `id`                  | `uuid`                |   No | Random UUID |
| `commodity_id`        | `uuid`                |   No | —           |
| `price_standard_id`   | `uuid`                |   No | —           |
| `effective_date`      | `date`                |   No | —           |
| `period`              | `price_period`        |   No | `monthly`   |
| `period_label`        | `varchar(100)`        |  Yes | —           |
| `price_value`         | `numeric(24,6)`       |   No | —           |
| `currency_code`       | `varchar(3)`          |   No | —           |
| `unit_code`           | `varchar(50)`         |   No | —           |
| `record_type`         | `data_record_type`    |   No | `actual`    |
| `source_id`           | `uuid`                |   No | —           |
| `verification_status` | `verification_status` |   No | `pending`   |
| `publication_status`  | `publication_status`  |   No | `draft`     |
| `notes`               | `text`                |  Yes | —           |
| `created_at`          | `timestamptz`         |   No | `now()`     |
| `updated_at`          | `timestamptz`         |   No | `now()`     |

Constraints:

- `price_value >= 0`
- Currency code sesuai `^[A-Z]{3}$`
- Unique: `(price_standard_id, effective_date, record_type)`

---

# 10. Economy Tables

## 10.1 `economic_gdp_annual`

Data GDP nasional dan GDP sektor pertambangan/penggalian.

| Column                       | Type                      | Null | Default          |
| ---------------------------- | ------------------------- | ---: | ---------------- |
| `id`                         | `uuid`                    |   No | Random UUID      |
| `region_id`                  | `uuid`                    |   No | —                |
| `year`                       | `smallint`                |   No | —                |
| `price_basis`                | `gdp_price_basis`         |   No | `current_prices` |
| `base_year`                  | `smallint`                |  Yes | —                |
| `national_gdp_value`         | `numeric(24,2)`           |   No | —                |
| `mining_quarrying_gdp_value` | `numeric(24,2)`           |   No | —                |
| `currency_code`              | `varchar(3)`              |   No | `IDR`            |
| `value_scale`                | `varchar(20)`             |   No | `billion`        |
| `data_status`                | `statistical_data_status` |   No | `final`          |
| `record_type`                | `data_record_type`        |   No | `actual`         |
| `source_id`                  | `uuid`                    |   No | —                |
| `source_published_at`        | `date`                    |  Yes | —                |
| `verification_status`        | `verification_status`     |   No | `pending`        |
| `publication_status`         | `publication_status`      |   No | `draft`          |
| `notes`                      | `text`                    |  Yes | —                |
| `metadata`                   | `jsonb`                   |   No | `{}`             |
| `created_at`                 | `timestamptz`             |   No | `now()`          |
| `updated_at`                 | `timestamptz`             |   No | `now()`          |

Foreign keys:

- `region_id → regions.id`
- `source_id → sources.id`

Constraints:

- `1900 ≤ year ≤ 2100`
- National GDP value tidak negatif.
- Mining GDP value tidak negatif.
- Mining GDP tidak boleh lebih besar dari national GDP.
- Currency code sesuai `^[A-Z]{3}$`.
- `value_scale`:
  - `unit`
  - `thousand`
  - `million`
  - `billion`
  - `trillion`
- `current_prices` mewajibkan `base_year IS NULL`.
- `constant_prices` mewajibkan `base_year` antara 1900–2100.
- Unique:
  `(region_id, year, price_basis, base_year, record_type)`

Public RLS:

`publication_status = published AND verification_status = verified`

---

## 10.2 `economic_gdp_sources`

Citation tambahan GDP.

| Column            | Type          | Null | Default     |
| ----------------- | ------------- | ---: | ----------- |
| `id`              | `uuid`        |   No | Random UUID |
| `economic_gdp_id` | `uuid`        |   No | —           |
| `source_id`       | `uuid`        |   No | —           |
| `citation_label`  | `text`        |  Yes | —           |
| `source_url`      | `text`        |  Yes | —           |
| `page_reference`  | `text`        |  Yes | —           |
| `notes`           | `text`        |  Yes | —           |
| `is_primary`      | `boolean`     |   No | `false`     |
| `created_at`      | `timestamptz` |   No | `now()`     |
| `updated_at`      | `timestamptz` |   No | `now()`     |

Constraints:

- Unique: `(economic_gdp_id, source_id, source_url)`

Foreign keys:

- GDP record: `CASCADE` on delete.
- Source: `RESTRICT` on delete.

RLS mengizinkan sumber dibaca hanya jika parent GDP telah verified dan published.

---

## 10.3 `mining_investment_annual`

Data investasi pertambangan PMA dan PMDN.

| Column                | Type                      | Null | Default        |
| --------------------- | ------------------------- | ---: | -------------- |
| `id`                  | `uuid`                    |   No | Random UUID    |
| `region_id`           | `uuid`                    |   No | —              |
| `year`                | `smallint`                |   No | —              |
| `sector_code`         | `varchar(50)`             |   No | `mining`       |
| `sector_name`         | `varchar(160)`            |   No | `Pertambangan` |
| `investment_origin`   | `investment_origin_type`  |   No | —              |
| `investment_value`    | `numeric(24,6)`           |   No | —              |
| `currency_code`       | `varchar(3)`              |   No | `IDR`          |
| `value_scale`         | `varchar(20)`             |   No | `trillion`     |
| `project_count`       | `integer`                 |  Yes | —              |
| `data_status`         | `statistical_data_status` |   No | `final`        |
| `record_type`         | `data_record_type`        |   No | `actual`       |
| `source_id`           | `uuid`                    |   No | —              |
| `source_published_at` | `date`                    |  Yes | —              |
| `verification_status` | `verification_status`     |   No | `pending`      |
| `publication_status`  | `publication_status`      |   No | `draft`        |
| `notes`               | `text`                    |  Yes | —              |
| `metadata`            | `jsonb`                   |   No | `{}`           |
| `created_at`          | `timestamptz`             |   No | `now()`        |
| `updated_at`          | `timestamptz`             |   No | `now()`        |

Constraints:

- `investment_value >= 0`
- `project_count IS NULL OR project_count >= 0`
- `1900 ≤ year ≤ 2100`
- Currency code sesuai `^[A-Z]{3}$`
- `sector_code` menggunakan lower snake case.
- Valid scale:
  - `unit`
  - `thousand`
  - `million`
  - `billion`
  - `trillion`
- Unique:
  `(region_id, year, sector_code, investment_origin, record_type)`

Public RLS:

`publication_status = published AND verification_status = verified`

---

## 10.4 `mining_investment_sources`

Citation tambahan investasi.

Strukturnya mengikuti pola source bridge:

- Primary key UUID.
- `mining_investment_id`.
- `source_id`.
- `citation_label`.
- `source_url`.
- `page_reference`.
- `notes`.
- `is_primary`.
- Timestamp.

Unique:

`(mining_investment_id, source_id, source_url)`

Parent delete:

- Investment record: `CASCADE`
- Source: `RESTRICT`

---

## 10.5 `minerba_exports_annual`

Data ekspor Minerba tahunan.

| Column                   | Type                      | Null | Default               |
| ------------------------ | ------------------------- | ---: | --------------------- |
| `id`                     | `uuid`                    |   No | Random UUID           |
| `commodity_id`           | `uuid`                    |   No | —                     |
| `origin_region_id`       | `uuid`                    |   No | —                     |
| `destination_region_id`  | `uuid`                    |  Yes | —                     |
| `year`                   | `smallint`                |   No | —                     |
| `source_commodity_label` | `varchar(160)`            |   No | —                     |
| `hs_code`                | `varchar(20)`             |  Yes | —                     |
| `coverage_type`          | `varchar(40)`             |   No | `destination_country` |
| `export_volume`          | `numeric(24,6)`           |  Yes | —                     |
| `volume_unit_code`       | `varchar(50)`             |  Yes | —                     |
| `volume_scale`           | `varchar(20)`             |  Yes | —                     |
| `fob_value`              | `numeric(24,6)`           |  Yes | —                     |
| `currency_code`          | `varchar(3)`              |   No | `USD`                 |
| `fob_value_scale`        | `varchar(20)`             |  Yes | —                     |
| `data_availability`      | `trade_data_availability` |   No | `reported`            |
| `data_status`            | `statistical_data_status` |   No | `final`               |
| `record_type`            | `data_record_type`        |   No | `actual`              |
| `source_id`              | `uuid`                    |   No | —                     |
| `source_published_at`    | `date`                    |  Yes | —                     |
| `verification_status`    | `verification_status`     |   No | `pending`             |
| `publication_status`     | `publication_status`      |   No | `draft`               |
| `notes`                  | `text`                    |  Yes | —                     |
| `metadata`               | `jsonb`                   |   No | `{}`                  |
| `created_at`             | `timestamptz`             |   No | `now()`               |
| `updated_at`             | `timestamptz`             |   No | `now()`               |

Foreign keys:

- `commodity_id → commodities.id`
- `origin_region_id → regions.id`
- `destination_region_id → regions.id`
- `volume_unit_code → measurement_units.code`
- `source_id → sources.id`

Constraints:

- `1900 ≤ year ≤ 2100`
- Volume tidak negatif.
- FOB value tidak negatif.
- Currency code sesuai `^[A-Z]{3}$`.
- HS code berisi 2–10 digit.
- `coverage_type`:
  - `destination_country`
  - `national_total`
- Scale:
  - `unit`
  - `thousand`
  - `million`
  - `billion`
- Unique:
  `(commodity_id, origin_region_id, destination_region_id, year, hs_code, record_type)`

Availability constraints:

### `reported`

Wajib mempunyai:

- Destination region.
- Export volume.
- Volume unit.
- Volume scale.
- FOB value.
- FOB scale.

### `not_reported`

Wajib tidak mempunyai:

- Destination region.
- Export volume.
- Volume unit.
- Volume scale.
- FOB value.
- FOB scale.

### `reported_zero`

Menandakan sumber secara eksplisit melaporkan nilai nol. Status ini berbeda dengan `not_reported`.

### `estimated`

Digunakan jika nilai diperoleh melalui proses estimasi yang dapat dipertanggungjawabkan.

Public RLS:

`publication_status = published AND verification_status = verified`

---

## 10.6 `minerba_export_sources`

Citation tambahan ekspor.

Struktur:

- `id uuid`
- `minerba_export_id uuid`
- `source_id uuid`
- `citation_label text`
- `source_url text`
- `page_reference text`
- `notes text`
- `is_primary boolean`
- Timestamp

Unique:

`(minerba_export_id, source_id, source_url)`

RLS hanya mengizinkan citation dari parent export yang verified dan published.

---

# 11. Smelter Tables

## 11.1 `smelter_operators`

Master perusahaan operator smelter.

| Column         | Type           | Null | Default     |
| -------------- | -------------- | ---: | ----------- |
| `id`           | `uuid`         |   No | Random UUID |
| `legal_name`   | `varchar(200)` |   No | —           |
| `slug`         | `varchar(220)` |   No | —           |
| `website_url`  | `text`         |  Yes | —           |
| `country_code` | `varchar(2)`   |   No | `ID`        |
| `is_active`    | `boolean`      |   No | `true`      |
| `metadata`     | `jsonb`        |   No | `{}`        |
| `created_at`   | `timestamptz`  |   No | `now()`     |
| `updated_at`   | `timestamptz`  |   No | `now()`     |

Constraints:

- Unique: `slug`
- Country code sesuai `^[A-Z]{2}$`

Public RLS:

`is_active = true`

---

## 11.2 `smelter_facilities`

Master fasilitas smelter dan refinery.

| Column                      | Type                      | Null | Default     |
| --------------------------- | ------------------------- | ---: | ----------- |
| `id`                        | `uuid`                    |   No | Random UUID |
| `facility_code`             | `varchar(30)`             |   No | —           |
| `name`                      | `varchar(240)`            |   No | —           |
| `slug`                      | `varchar(260)`            |   No | —           |
| `operator_id`               | `uuid`                    |   No | —           |
| `facility_type`             | `smelter_facility_type`   |   No | —           |
| `current_status`            | `smelter_facility_status` |   No | `unknown`   |
| `province_region_id`        | `uuid`                    |   No | —           |
| `city_regency_name`         | `varchar(160)`            |   No | —           |
| `address`                   | `text`                    |  Yes | —           |
| `latitude`                  | `numeric(9,6)`            |  Yes | —           |
| `longitude`                 | `numeric(10,6)`           |  Yes | —           |
| `reported_operation_year`   | `smallint`                |  Yes | —           |
| `construction_year`         | `smallint`                |  Yes | —           |
| `commissioning_year`        | `smallint`                |  Yes | —           |
| `commercial_operation_year` | `smallint`                |  Yes | —           |
| `source_id`                 | `uuid`                    |  Yes | —           |
| `verification_status`       | `verification_status`     |   No | `pending`   |
| `publication_status`        | `publication_status`      |   No | `draft`     |
| `is_active`                 | `boolean`                 |   No | `true`      |
| `notes`                     | `text`                    |  Yes | —           |
| `metadata`                  | `jsonb`                   |   No | `{}`        |
| `created_at`                | `timestamptz`             |   No | `now()`     |
| `updated_at`                | `timestamptz`             |   No | `now()`     |

Foreign keys:

- `operator_id → smelter_operators.id`
- `province_region_id → regions.id`
- `source_id → sources.id`

Constraints:

- Unique: `facility_code`
- Unique: `slug`
- Semua tahun antara 1900–2100.
- `construction_year ≤ commissioning_year`
- `commissioning_year ≤ commercial_operation_year`
- Latitude antara -90 sampai 90.
- Longitude antara -180 sampai 180.

Public RLS saat ini:

`is_active = true AND publication_status = published`

Application data-access layer tetap wajib menambahkan:

`verification_status = verified`

Constraint tersebut perlu dipertahankan di application policy. RLS dapat diperketat kemudian agar sama dengan public visibility rule global.

---

## 11.3 `smelter_facility_outputs`

Input, output, proses, dan kapasitas fasilitas.

| Column                      | Type            | Null | Default     |
| --------------------------- | --------------- | ---: | ----------- |
| `id`                        | `uuid`          |   No | Random UUID |
| `facility_id`               | `uuid`          |   No | —           |
| `commodity_id`              | `uuid`          |   No | —           |
| `input_material`            | `varchar(240)`  |   No | —           |
| `output_product`            | `varchar(240)`  |   No | —           |
| `process_type`              | `varchar(100)`  |  Yes | —           |
| `input_capacity_value`      | `numeric(24,6)` |  Yes | —           |
| `input_capacity_unit_code`  | `varchar(50)`   |  Yes | —           |
| `output_capacity_value`     | `numeric(24,6)` |  Yes | —           |
| `output_capacity_unit_code` | `varchar(50)`   |  Yes | —           |
| `capacity_reference_year`   | `smallint`      |  Yes | —           |
| `is_primary`                | `boolean`       |   No | `true`      |
| `notes`                     | `text`          |  Yes | —           |
| `metadata`                  | `jsonb`         |   No | `{}`        |
| `created_at`                | `timestamptz`   |   No | `now()`     |
| `updated_at`                | `timestamptz`   |   No | `now()`     |

Foreign keys:

- `facility_id → smelter_facilities.id`
  - On delete: `CASCADE`
- `commodity_id → commodities.id`
  - On delete: `RESTRICT`
- Capacity unit codes → `measurement_units.code`

Constraints:

- Unique: `(facility_id, commodity_id, output_product)`
- Capacity tidak negatif.
- Capacity value wajib mempunyai unit.
- Reference year antara 1900–2100.

Public access mengikuti status parent facility.

---

## 11.4 `smelter_facility_sources`

Referensi detail fasilitas smelter.

| Column            | Type           | Null | Default      |
| ----------------- | -------------- | ---: | ------------ |
| `id`              | `uuid`         |   No | Random UUID  |
| `facility_id`     | `uuid`         |   No | —            |
| `source_id`       | `uuid`         |  Yes | —            |
| `publisher_name`  | `varchar(240)` |   No | —            |
| `document_title`  | `text`         |   No | —            |
| `source_url`      | `text`         |   No | —            |
| `published_date`  | `date`         |  Yes | —            |
| `accessed_at`     | `date`         |   No | Current date |
| `supports_fields` | `text[]`       |   No | Empty array  |
| `is_official`     | `boolean`      |   No | `false`      |
| `notes`           | `text`         |  Yes | —            |
| `created_at`      | `timestamptz`  |   No | `now()`      |
| `updated_at`      | `timestamptz`  |   No | `now()`      |

Foreign keys:

- `facility_id → smelter_facilities.id`
  - On delete: `CASCADE`
- `source_id → sources.id`
  - On delete: `SET NULL`

Constraints:

- Unique: `(facility_id, source_url)`
- `source_url` harus menggunakan HTTPS.

`supports_fields` mencatat field yang didukung sumber, misalnya:

- `current_status`
- `operation_year`
- `output_product`
- `capacity`
- `location`

---

# 12. Analytical Views

## 12.1 `economic_gdp_annual_metrics`

View untuk membaca GDP beserta metric turunan.

Metric:

- `contribution_percentage`
- `nominal_yoy_change_percentage`
- Region code dan name.

Formula kontribusi:

`mining_quarrying_gdp_value / national_gdp_value × 100`

Formula nominal YoY:

`(current_value / previous_value - 1) × 100`

Pembagian menggunakan `NULLIF` untuk mencegah division by zero.

---

## 12.2 `mining_investment_annual_metrics`

View metric per investment origin.

Menambahkan:

- Total investasi tahunan.
- Total jumlah proyek tahunan.
- Share PMA atau PMDN.
- Nominal year-over-year change.

Perhitungan dipartisi berdasarkan:

- Region.
- Sector.
- Origin.
- Currency.
- Scale.
- Record type.

---

## 12.3 `mining_investment_annual_summary`

Menggabungkan PMA dan PMDN per tahun.

Output utama:

- PMA investment value.
- PMDN investment value.
- Total investment value.
- PMA project count.
- PMDN project count.
- Total project count.
- Nominal total YoY.
- `is_fully_verified`.
- `is_fully_published`.

Summary tidak boleh dianggap publik hanya karena satu komponen sudah dipublikasikan. Semua komponen harus memenuhi publication rule.

---

## 12.4 `minerba_exports_annual_metrics`

View ekspor yang melakukan normalisasi.

Metric:

- `normalized_volume_metric_ton`
- `normalized_fob_value_usd`
- `average_fob_usd_per_metric_ton`
- `nominal_fob_yoy_change_percentage`

Normalisasi scale:

| Scale      |    Multiplier |
| ---------- | ------------: |
| `unit`     |             1 |
| `thousand` |         1,000 |
| `million`  |     1,000,000 |
| `billion`  | 1,000,000,000 |

View tidak melakukan konversi mata uang. Normalized FOB USD hanya valid untuk record dengan currency USD.

---

## 12.5 `smelter_facility_catalog`

Denormalized view untuk katalog smelter.

Menggabungkan:

- Facility.
- Operator.
- Province.
- Commodity.
- Input material.
- Output product.
- Process type.
- Capacity.
- Verification dan publication status.

View digunakan untuk read model, bukan penyimpanan data.

---

## 12.6 `smelter_summary_by_commodity`

Summary fasilitas berdasarkan komoditas.

Output:

- `facility_count`
- `province_count`
- `operating_facility_count`
- `known_annual_output_capacity_metric_ton`

Kapasitas hanya dijumlahkan jika unit sudah dinormalisasi sebagai `metric_ton`.

---

# 13. Index Strategy

Index digunakan terutama untuk:

- Foreign key lookup.
- Public visibility filter.
- Year-range filter.
- Commodity filter.
- Region filter.
- Status filter.
- Slug lookup.
- Sorting dan display order.

Kolom yang secara umum di-index:

- `commodity_id`
- `region_id`
- `source_id`
- `year`
- `slug`
- `verification_status`
- `publication_status`
- `record_type`
- `is_active`
- `display_order`

Composite indexes digunakan untuk:

- Natural uniqueness.
- Idempotent ingestion.
- Menolak duplicate annual record.
- Menjamin satu primary citation.

Index baru hanya ditambahkan berdasarkan pola query yang nyata. Terlalu banyak index dapat memperlambat insert dan migration.

---

# 14. Delete and Update Behavior

## 14.1 `RESTRICT`

Digunakan untuk master record yang masih direferensikan.

Contoh:

- Commodity.
- Measurement unit.
- Region.
- Source.
- Smelter operator.

Tujuannya mencegah kehilangan referential integrity.

## 14.2 `CASCADE`

Digunakan pada child yang tidak mempunyai arti tanpa parent.

Contoh:

- Production citation.
- GDP citation.
- Investment citation.
- Export citation.
- Smelter output.
- Smelter facility source.

## 14.3 `SET NULL`

Digunakan ketika child masih dapat dipertahankan tanpa parent reference tertentu.

Contoh:

- Deleted content category.
- Optional canonical source pada smelter source.

---

# 15. Row Level Security

RLS diaktifkan pada tabel public schema.

Public access tidak sama dengan unrestricted database access.

## 15.1 Strict Statistical Policy

GDP, investment, dan export menggunakan:

`verification_status = verified`

dan:

`publication_status = published`

## 15.2 Citation Inheritance

Citation hanya dapat dibaca jika parent record memenuhi public visibility rule.

## 15.3 Smelter Policy

Smelter facility RLS memerlukan:

- Facility aktif.
- Facility published.

Application data-access layer menambahkan verifikasi `verified`.

## 15.4 Application-Level Defense

Public query tetap memfilter status di application layer meskipun RLS telah diterapkan.

Tujuannya adalah defense in depth:

1. Database RLS.
2. SQL query filter.
3. Application publication policy.
4. API response mapping.

---

# 16. Public Visibility Rule

Canonical public record rule:

`verification_status = 'verified'`

dan:

`publication_status = 'published'`

Jika entity mempunyai status aktif:

`is_active = true`

Jika entity mempunyai canonical source:

- Source aktif.
- Source verified.

Record pending, rejected, draft, in-review, atau archived tidak boleh keluar melalui API publik.

---

# 17. Data Integrity Rules

## 17.1 Year

Tahun statistik harus berada pada rentang:

`1900–2100`

## 17.2 Numeric Value

Nilai berikut tidak boleh negatif:

- Production.
- Price.
- GDP.
- Investment.
- Project count.
- Export volume.
- FOB value.
- Smelter capacity.

## 17.3 Currency Code

Currency menggunakan ISO-like uppercase three-letter code:

- `IDR`
- `USD`

Pattern:

`^[A-Z]{3}$`

## 17.4 Region Coordinates

- Latitude: -90 sampai 90.
- Longitude: -180 sampai 180.

## 17.5 Missing Data

`NULL` berarti:

- Tidak tersedia.
- Tidak berlaku.
- Tidak diketahui.

Nilai `0` berarti sumber secara eksplisit menyatakan nol.

Keduanya tidak boleh dipertukarkan.

## 17.6 Record Type

- `actual`: realisasi aktual.
- `provisional`: angka sementara.
- `projection`: proyeksi.
- `revised`: angka revisi.

Record dengan jenis berbeda dapat berada pada komoditas dan tahun yang sama, tetapi kombinasi jenis yang sama harus unik.

---

# 18. Data Ingestion Requirements

Importer harus:

1. Memvalidasi struktur staging data.
2. Memeriksa reference master.
3. Menolak unit yang tidak dikenal.
4. Menolak commodity slug yang tidak dikenal.
5. Menolak source slug yang tidak dikenal.
6. Menolak region yang tidak dikenal.
7. Menjalankan dry-run.
8. Menggunakan transaction.
9. Menggunakan natural unique constraint untuk idempotency.
10. Menghasilkan audit summary.
11. Tidak otomatis mempublikasikan data.
12. Menyimpan record sebagai pending/draft kecuali ada keputusan eksplisit.

Upsert tidak boleh mengubah verified/published record secara diam-diam.

---

# 19. Current Data Publication Status

## 19.1 Production

- Public production API tersedia.
- Hanya verified dan published record yang ditampilkan.
- Record dapat mempunyai beberapa citation.

## 19.2 GDP

- Dataset publik tersedia.
- Periode publik saat ini: 2019–2025.
- Setiap record mempunyai sumber.

## 19.3 Smelters

- Fasilitas publik tersedia.
- Fasilitas non-publik terlindungi.
- Output dan sumber mengikuti visibility parent facility.

## 19.4 Investment

- Record sudah tersimpan.
- Current record masih pending/draft.
- API publik mengembalikan empty dataset sampai record dipublikasikan.

## 19.5 Exports

- Record sudah tersimpan.
- Current record masih pending/draft.
- Status `reported` atau `not_reported` tidak mengesampingkan publication policy.
- API publik tetap mengembalikan empty dataset sampai record verified dan published.

---

# 20. Authentication and Other Supporting Tables

Bagian ini membedakan tabel autentikasi yang sudah tersedia dari supporting tables yang masih direncanakan.

## 20.1 Authentication, User Profile, and Admin

Supabase Authentication menggunakan schema internal:

`auth.users`

User dan administrator menggunakan identity store yang sama. Pada MVP:

- user publik membuat akun atau login melalui email/password maupun Google OAuth;
- administrator login melalui akun email/password yang dibuat atau diundang secara internal;
- proses sign-up atau login pertama membuat identity pada `auth.users` melalui Supabase Auth;
- application profile dibuat atau dipastikan tersedia secara idempotent dengan primary key yang mereferensikan `auth.users.id`;
- user baru selalu memperoleh application role `user`;
- role administratif hanya dapat diberikan melalui trusted administrative process;
- password, access token, refresh token, dan Google provider token tidak disimpan pada application tables.

Current physical public schema:

- `user_profiles`
- `roles`
- `user_role_assignments`

Deferred untuk granular permission workflow:

- `permissions`
- `role_permissions`

Logical responsibility:

| Table                   | Responsibility                                                                 |
| ----------------------- | ------------------------------------------------------------------------------ |
| `user_profiles`         | Profil aplikasi minimum yang berelasi satu-ke-satu dengan `auth.users.id`      |
| `roles`                 | Role aplikasi, termasuk `user` dan role administratif                         |
| `permissions`           | Tindakan administratif yang dapat diberikan                                   |
| `role_permissions`      | Relasi role dengan permission                                                  |
| `user_role_assignments` | Assignment role kepada identity; tidak dapat dimutasi sendiri oleh public user |

`user_profiles` menggunakan `auth.users.id` sebagai primary key dan menyimpan `username`, display name, avatar reference, serta timestamp. Email dan provider identity tetap bersumber dari Supabase Auth. Relasi profile dan role assignment menggunakan `ON DELETE CASCADE` terhadap identity, sedangkan `assigned_by` menggunakan `ON DELETE SET NULL` agar jejak assignment tetap konsisten.

Trigger `private.handle_new_auth_user` membuat profil secara idempotent dan memberikan role `user` untuk identity baru. Function berada di schema non-public, menggunakan `SECURITY DEFINER` dengan `search_path` kosong, dan tidak menerima role dari metadata client.

RLS target:

- user hanya dapat membaca atau mengubah field profil miliknya yang secara eksplisit diizinkan;
- user tidak dapat membuat, mengubah, atau menghapus role assignment;
- application role `user` tidak memperoleh admin mutation permission;
- PostgreSQL role `authenticated` tidak diperlakukan sebagai application role administrator;
- administrator tetap memerlukan server-side authorization dan permission check;
- penghapusan identity menghapus profil dan role assignment terkait melalui foreign key cascade.

Role yang di-seed saat ini adalah `user`, `administrator`, `content_editor`, `data_editor`, `data_verifier`, dan `publisher`. Permission tables dan audit log tetap ditambahkan bersama admin mutation workflow.

## 20.2 Audit Log

Planned:

- `audit_logs`
- Actor.
- Action.
- Entity type.
- Entity ID.
- Before state.
- After state.
- Timestamp.
- Request metadata.

Login user dapat dicatat sebagai security event. Login administrator, role assignment, serta seluruh tindakan administratif sensitif harus masuk audit trail yang sesuai dengan retention policy.

## 20.3 Search

Planned berdasarkan kebutuhan implementasi:

- `search_documents`
- Search vector atau search index.
- Module.
- Entity type.
- Entity ID.
- Published content.

PostgreSQL Full-Text Search diprioritaskan sebelum external search engine.

## 20.4 MineBot and RAG

Planned:

- `knowledge_documents`
- `knowledge_chunks`
- `knowledge_embeddings`
- `ingestion_jobs`
- Optional conversation records.

Schema RAG dibuat saat pipeline MineBot mulai diimplementasikan agar struktur mengikuti kebutuhan chunking dan retrieval yang nyata.

---

# 21. Schema Change Procedure

Perubahan schema harus mengikuti urutan:

1. Identifikasi kebutuhan.
2. Perbarui Drizzle schema.
3. Tambahkan atau perbarui test.
4. Generate migration.
5. Periksa migration SQL.
6. Jalankan migration pada development database.
7. Jalankan database verification.
8. Jalankan type-check.
9. Jalankan test.
10. Jalankan lint.
11. Jalankan build.
12. Perbarui `SCHEMA.md`.

Migration yang sudah diterapkan tidak boleh diedit. Perubahan berikutnya harus menggunakan migration baru.

---

# 22. Schema Acceptance Criteria

Schema dianggap valid jika:

- Semua primary key tersedia.
- Semua relasi penting mempunyai foreign key.
- Nilai statistik menggunakan `numeric`.
- Tahun mempunyai check constraint.
- Currency mempunyai format constraint.
- Nilai tidak negatif.
- Duplicate annual record ditolak.
- Source dapat ditelusuri.
- RLS aktif.
- Record pending/draft tidak terbaca secara publik.
- Delete behavior tidak merusak referential integrity.
- Migration dapat dijalankan dari database kosong.
- Drizzle schema sesuai migration.
- Type-check, test, lint, dan build berhasil.
