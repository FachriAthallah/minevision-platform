# MineVision API Contracts

Dokumen ini menetapkan kontrak API MineVision antara frontend, backend, Admin Dashboard, dan layanan internal.

Struktur database berada di `DATABASE_SCHEMA.md`. Arsitektur sistem berada di `ARCHITECTURE.md`.

## 1. API Principles

MineVision API harus:

- menggunakan response yang konsisten;
- memvalidasi seluruh input;
- menggunakan HTTP status yang tepat;
- tidak membocorkan struktur internal;
- hanya mengirim data yang boleh dipublikasikan;
- membedakan data aktual dan proyeksi;
- menyertakan sumber untuk data faktual;
- menjaga compatibility dengan consumer aktif.

## 2. Base URL

Local:

```text
http://localhost:3000
```

Local API:

```text
http://localhost:3000/api
```

Production:

```text
https://PRODUCTION_DOMAIN
```

Untuk request pada aplikasi yang sama, gunakan relative URL:

```text
/api/v1/intelligence/production
```

## 3. API Versioning

Public domain API menggunakan:

```text
/api/v1/
```

Endpoint infrastruktur tidak wajib menggunakan version:

```text
/api/health
```

Versi baru digunakan jika terdapat breaking change, seperti:

- menghapus field;
- mengganti nama field;
- mengganti tipe data;
- mengubah arti field;
- mengubah response structure;
- menjadikan optional field sebagai required.

Penambahan optional field atau endpoint baru tidak selalu membutuhkan versi baru.

## 4. General Conventions

### Content Type

```http
Content-Type: application/json; charset=utf-8
```

### Field Naming

API menggunakan:

```text
camelCase
```

Database menggunakan:

```text
snake_case
```

Database row harus dipetakan sebelum dikirim sebagai response.

### Date and Time

| Data      | Format       |
| --------- | ------------ |
| Tanggal   | `YYYY-MM-DD` |
| Timestamp | ISO 8601 UTC |
| Tahun     | Integer      |

Contoh:

```json
{
  "effectiveDate": "2026-08-23",
  "timestamp": "2026-08-23T14:30:00.000Z",
  "year": 2025
}
```

### Empty Values

Gunakan `null` untuk field yang tersedia tetapi belum memiliki nilai.

Jangan menggunakan:

```text
"N/A"
"-"
"undefined"
"null"
```

sebagai string pengganti nilai kosong.

## 5. Endpoint Status

| Endpoint                                     | Method             | Status  | Access        |
| -------------------------------------------- | ------------------ | ------- | ------------- |
| `/api/health`                                | GET                | Current | Public        |
| `/api/v1/intelligence/production`            | GET                | Current | Public        |
| `/api/v1/commodities`                        | GET                | Target  | Public        |
| `/api/v1/intelligence/prices`                | GET                | Target  | Public        |
| `/api/v1/intelligence/production-locations`  | GET                | Target  | Public        |
| `/api/v1/search`                             | GET                | Target  | Public        |
| `/api/v1/minebot/query`                      | POST               | Target  | Public        |
| `/api/v1/admin/contents`                     | GET, POST          | Target  | Admin         |
| `/api/v1/admin/contents/{id}`                | GET, PATCH, DELETE | Target  | Admin         |
| `/api/v1/admin/intelligence/production`      | GET, POST          | Target  | Admin         |
| `/api/v1/admin/intelligence/production/{id}` | GET, PATCH         | Target  | Admin         |
| `/api/v1/admin/verifications/{id}`           | POST               | Target  | Data verifier |
| `/api/v1/admin/publications/{id}`            | POST               | Target  | Publisher     |

Endpoint berstatus `Target` belum boleh digunakan sebagai endpoint aktif sebelum diimplementasikan dan diuji.

## 6. Success Response

Canonical success response:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2026-08-23T14:30:00.000Z",
    "requestId": "request-id"
  }
}
```

Collection response:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "count": 0,
    "timestamp": "2026-08-23T14:30:00.000Z",
    "requestId": "request-id"
  }
}
```

Perubahan response endpoint aktif harus disertai pemeriksaan dan pembaruan consumer frontend.

## 7. Error Response

Canonical error response:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Parameter permintaan tidak valid.",
    "details": []
  },
  "meta": {
    "timestamp": "2026-08-23T14:30:00.000Z",
    "requestId": "request-id"
  }
}
```

Response error tidak boleh memuat:

- stack trace;
- SQL query;
- database URL;
- environment variable;
- API key;
- absolute file path;
- internal exception object.

## 8. Error Codes

| Code                           | HTTP Status | Fungsi                    |
| ------------------------------ | ----------: | ------------------------- |
| `VALIDATION_ERROR`             |         400 | Input tidak valid         |
| `UNAUTHENTICATED`              |         401 | Authentication diperlukan |
| `FORBIDDEN`                    |         403 | Permission tidak tersedia |
| `RESOURCE_NOT_FOUND`           |         404 | Resource tidak ditemukan  |
| `METHOD_NOT_ALLOWED`           |         405 | Method tidak didukung     |
| `RESOURCE_CONFLICT`            |         409 | Konflik data              |
| `BUSINESS_RULE_VIOLATION`      |         422 | Melanggar aturan bisnis   |
| `RATE_LIMIT_EXCEEDED`          |         429 | Request terlalu banyak    |
| `INTERNAL_SERVER_ERROR`        |         500 | Kesalahan internal        |
| `DATABASE_UNAVAILABLE`         |         503 | Database tidak tersedia   |
| `EXTERNAL_SERVICE_UNAVAILABLE` |         503 | Layanan eksternal gagal   |
| `AI_SERVICE_UNAVAILABLE`       |         503 | Provider MineBot gagal    |

Error code menggunakan `UPPER_SNAKE_CASE`.

## 9. Health Check

Endpoint:

```http
GET /api/health
```

Access:

```text
Public
```

Cache:

```http
Cache-Control: no-store
```

Response:

```json
{
  "status": "ok",
  "service": "minevision-platform",
  "environment": "development",
  "timestamp": "2026-08-23T14:30:00.000Z"
}
```

Health endpoint hanya menunjukkan bahwa application process dapat merespons. Endpoint ini tidak membuktikan database dan external service dalam kondisi sehat.

Health response tidak boleh menampilkan credential atau detail koneksi.

## 10. Production Intelligence API

Endpoint:

```http
GET /api/v1/intelligence/production
```

Access:

```text
Public
```

### Query Parameters

| Parameter   | Type    | Required | Aturan         |
| ----------- | ------- | -------: | -------------- |
| `commodity` | string  |       Ya | Slug komoditas |
| `fromYear`  | integer |    Tidak | `1900–2100`    |
| `toYear`    | integer |    Tidak | `1900–2100`    |

Business rule:

```text
fromYear <= toYear
```

Contoh request:

```http
GET /api/v1/intelligence/production?commodity=batubara&fromYear=2019&toYear=2025
```

### Production Record

```json
{
  "commodity": {
    "name": "Batubara",
    "slug": "batubara",
    "symbol": null
  },
  "year": 2023,
  "value": 775.2,
  "unit": {
    "code": "million_ton",
    "name": "Juta Ton",
    "symbol": "juta ton"
  },
  "recordType": "actual",
  "sources": [
    {
      "label": "Produksi Batubara Indonesia 2023",
      "pageReference": "Halaman 25",
      "url": "https://example.go.id/document",
      "isPrimary": true,
      "source": {
        "name": "Kementerian ESDM",
        "organization": "Kementerian Energi dan Sumber Daya Mineral"
      }
    }
  ]
}
```

Allowed `recordType`:

```text
actual
provisional
projection
revised
```

Frontend harus membedakan data aktual dan proyeksi.

### Publication Filter

Server query wajib memeriksa:

```text
commodities.is_active = true
commodities.is_intelligence_tracked = true
commodity_production.verification_status = verified
commodity_production.publication_status = published
measurement_units.is_active = true
```

Citation hanya menggunakan sumber yang aktif dan terverifikasi.

### Empty and Not Found

Commodity tersedia tetapi tidak memiliki data publik:

```text
200 OK
data = []
```

Commodity slug tidak ditemukan:

```text
404 RESOURCE_NOT_FOUND
```

Frontend harus menampilkan empty state untuk collection kosong, bukan generic error.

## 11. Commodities API

Target endpoint:

```http
GET /api/v1/commodities
```

Target filter:

```text
category
intelligenceTracked
page
pageSize
```

Public response hanya mengembalikan komoditas aktif.

Target record:

```json
{
  "id": "uuid",
  "name": "Batubara",
  "slug": "batubara",
  "symbol": null,
  "category": "energy",
  "description": "Komoditas energi pertambangan.",
  "imageUrl": "/images/commodity/batubara.jpg",
  "isIntelligenceTracked": true
}
```

## 12. Domestic Prices API

Target endpoint:

```http
GET /api/v1/intelligence/prices
```

Target parameters:

| Parameter   | Required | Fungsi             |
| ----------- | -------: | ------------------ |
| `commodity` |       Ya | Slug komoditas     |
| `standard`  |    Tidak | Kode standar harga |
| `fromDate`  |    Tidak | Tanggal awal       |
| `toDate`    |    Tidak | Tanggal akhir      |
| `period`    |    Tidak | Periode harga      |

Target record memuat:

- komoditas;
- standar harga;
- tanggal berlaku;
- periode;
- nilai;
- mata uang;
- satuan;
- record type;
- sumber.

## 13. Production Locations API

Target endpoint:

```http
GET /api/v1/intelligence/production-locations
```

Target parameters:

```text
commodity
year
regionLevel
recordType
```

Target record memuat:

- komoditas;
- wilayah;
- tahun;
- nilai produksi;
- satuan;
- kontribusi;
- peringkat;
- record type;
- sumber.

Setiap record harus memiliki minimal salah satu dari:

```text
productionValue
sharePercentage
producerRank
```

## 14. Global Search API

Target endpoint:

```http
GET /api/v1/search
```

Parameters:

| Parameter  | Required | Default            |
| ---------- | -------: | ------------------ |
| `q`        |       Ya | Tidak ada          |
| `module`   |    Tidak | Semua modul publik |
| `type`     |    Tidak | Semua tipe publik  |
| `page`     |    Tidak | `1`                |
| `pageSize` |    Tidak | `20`               |

Query rules:

```text
minimum length = 2
maximum length = 200
```

Search hanya mengembalikan konten yang sudah dipublikasikan.

Target record:

```json
{
  "id": "uuid",
  "module": "education",
  "type": "article",
  "title": "Pengertian Pertambangan",
  "slug": "pengertian-pertambangan",
  "excerpt": "Pertambangan merupakan...",
  "url": "/edukasi/pengertian-pertambangan",
  "publishedAt": "2026-08-23T14:30:00.000Z",
  "score": 0.92
}
```

## 15. MineBot API

Target endpoint:

```http
POST /api/v1/minebot/query
```

Access:

```text
Public dengan rate limit
```

Target request:

```json
{
  "question": "Apa perbedaan tambang terbuka dan tambang bawah tanah?",
  "conversationId": null,
  "context": {
    "module": "education",
    "pageUrl": "/edukasi/metode-penambangan"
  }
}
```

Target response:

```json
{
  "success": true,
  "data": {
    "answer": "Tambang terbuka dilakukan dari permukaan...",
    "conversationId": "uuid",
    "citations": [],
    "limitations": [],
    "generatedAt": "2026-08-23T14:30:00.000Z"
  },
  "meta": {
    "requestId": "request-id",
    "timestamp": "2026-08-23T14:30:00.000Z"
  }
}
```

MineBot harus memiliki:

- input limit;
- output limit;
- rate limiting;
- abuse protection;
- safety validation;
- citation filtering.

MineBot tidak boleh mengembalikan internal prompt, secret, atau raw retrieval context.

## 16. Admin API

Admin endpoint menggunakan namespace:

```text
/api/v1/admin/
```

Seluruh Admin API membutuhkan:

- authentication;
- authorization;
- runtime validation;
- audit log;
- secure session;
- rate limiting.

### Content Management

```http
GET /api/v1/admin/contents
POST /api/v1/admin/contents
GET /api/v1/admin/contents/{id}
PATCH /api/v1/admin/contents/{id}
DELETE /api/v1/admin/contents/{id}
```

### Production Management

```http
GET /api/v1/admin/intelligence/production
POST /api/v1/admin/intelligence/production
GET /api/v1/admin/intelligence/production/{id}
PATCH /api/v1/admin/intelligence/production/{id}
```

Client tidak boleh menentukan verification atau publication status tanpa pemeriksaan role pada server.

## 17. Verification and Publication

Verification endpoint:

```http
POST /api/v1/admin/verifications/{id}
```

Allowed decision:

```text
verified
rejected
```

Required permission:

```text
data_verifier
```

Publication endpoint:

```http
POST /api/v1/admin/publications/{id}
```

Required permission:

```text
publisher
```

Business rule:

```text
Record hanya dapat dipublikasikan setelah berstatus verified.
```

Jika belum verified:

```text
422 BUSINESS_RULE_VIOLATION
```

Seluruh tindakan verification dan publication harus dicatat pada audit log.

## 18. Pagination

Gunakan:

```text
page
pageSize
```

Default:

```text
page = 1
pageSize = 20
```

Maximum:

```text
pageSize = 100
```

Pagination metadata:

```json
{
  "page": 1,
  "pageSize": 20,
  "totalItems": 120,
  "totalPages": 6,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

## 19. Sorting and Filtering

Sorting menggunakan:

```text
sortBy
sortOrder
```

Allowed order:

```text
asc
desc
```

`sortBy` harus menggunakan allowlist.

Filter menggunakan query parameter yang eksplisit.

Contoh:

```http
GET /api/v1/intelligence/production?commodity=batubara&fromYear=2019&toYear=2025
```

Input tidak boleh digunakan sebagai raw SQL.

## 20. Cache Policy

| Endpoint           | Target Cache                     |
| ------------------ | -------------------------------- |
| Health             | `no-store`                       |
| Public master data | Public cache                     |
| Intelligence data  | Cache sesuai frekuensi publikasi |
| Admin API          | `no-store`                       |
| MineBot            | `no-store`                       |

Draft atau unverified data tidak boleh masuk public cache.

## 21. Rate Limiting

Rate limiting wajib diprioritaskan untuk:

```text
/api/v1/search
/api/v1/minebot/query
/api/v1/admin/*
authentication endpoint
file upload
```

Jika limit terlampaui:

```text
429 RATE_LIMIT_EXCEEDED
```

Nilai limit ditentukan setelah mekanisme rate limiting dipilih dan diuji.

## 22. API Validation

Setiap endpoint harus memvalidasi:

- required field;
- tipe data;
- panjang teks;
- rentang angka;
- format tanggal;
- kombinasi parameter;
- allowed value;
- business rule.

Validation error harus dipetakan ke response standar. Jangan mengirim object error Zod mentah.

## 23. Backward Compatibility

Sebelum mengubah endpoint aktif:

1. cari seluruh consumer;
2. periksa frontend mapping;
3. periksa TypeScript type;
4. perbarui implementation;
5. perbarui automated test;
6. perbarui dokumen ini;
7. gunakan versi baru jika perubahan bersifat breaking.

Endpoint aktif tidak boleh diubah hanya untuk merapikan response tanpa memeriksa consumer.

## 24. API Verification

Jalankan development server:

```powershell
npm run dev
```

Health check:

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3000/api/health"
```

Production endpoint:

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3000/api/v1/intelligence/production?commodity=batubara&fromYear=2019&toYear=2025"
```

Setelah perubahan API, jalankan:

```powershell
npx tsc --noEmit
npm run lint
npm run build
```

## 25. API Rules

- Jangan menerima input tanpa validation.
- Jangan mengirim database row mentah.
- Jangan menggunakan raw SQL dari user input.
- Jangan mengembalikan draft data kepada publik.
- Jangan menggunakan `200` untuk seluruh error.
- Jangan mengembalikan stack trace.
- Jangan membuat public mutation tanpa authorization.
- Jangan menggunakan endpoint target seolah-olah sudah aktif.
- Jangan mengubah contract aktif tanpa memeriksa consumer.
- Dokumentasikan endpoint baru pada file ini.

## 26. Definition of Done

Endpoint dianggap selesai jika:

- method dan path terdokumentasi;
- input memiliki runtime validation;
- business rule diterapkan;
- database query aman;
- authentication dan authorization diterapkan jika diperlukan;
- response sesuai contract;
- error menggunakan status yang tepat;
- public response tidak membocorkan internal data;
- data faktual memiliki sumber;
- empty state terdefinisi;
- cache policy ditentukan;
- type check berhasil;
- lint berhasil;
- build berhasil;
- endpoint telah diuji;
- frontend consumer telah diperiksa.
