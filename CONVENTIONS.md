# MineVision Coding Conventions

Dokumen ini menetapkan konvensi penulisan kode MineVision agar konsisten dan mudah dipelihara.

Aturan arsitektur berada di `ARCHITECTURE.md`. Struktur database berada di `DATABASE_SCHEMA.md`.

## 1. General Principles

Kode MineVision harus:

- mudah dibaca;
- memiliki tanggung jawab yang jelas;
- menggunakan TypeScript secara ketat;
- mengikuti pola yang sudah digunakan;
- menghindari duplikasi;
- tidak membuat abstraksi sebelum diperlukan;
- tidak mengubah bagian di luar ruang lingkup tugas.

Utamakan kode sederhana yang dapat dipahami dibandingkan kode singkat tetapi sulit dibaca.

## 2. Language

Gunakan bahasa Inggris untuk:

- nama file;
- nama folder;
- variable;
- function;
- type;
- interface;
- database field;
- API field;
- komentar teknis.

Gunakan bahasa Indonesia untuk teks yang ditampilkan kepada pengguna MineVision.

Contoh:

```ts
const commodityName = "Batubara";

const validationMessage = "Nama komoditas wajib diisi.";
```

## 3. Naming Conventions

| Elemen               | Format             | Contoh                |
| -------------------- | ------------------ | --------------------- |
| Variable             | `camelCase`        | `productionValue`     |
| Function             | `camelCase`        | `getCommodityData`    |
| React component      | `PascalCase`       | `ProductionChart`     |
| Type                 | `PascalCase`       | `CommodityRecord`     |
| Interface            | `PascalCase`       | `CommodityRepository` |
| Constant             | `UPPER_SNAKE_CASE` | `MAX_PAGE_SIZE`       |
| JSON field           | `camelCase`        | `publicationStatus`   |
| Database field       | `snake_case`       | `publication_status`  |
| Route segment        | `kebab-case`       | `data-intelligence`   |
| Environment variable | `UPPER_SNAKE_CASE` | `DATABASE_URL`        |

Gunakan nama yang menjelaskan tujuan.

Hindari nama umum seperti:

```text
data
item
temp
value
result
handler
```

Nama tersebut hanya boleh digunakan jika konteksnya sudah jelas dan terbatas.

## 4. File Naming

React component menggunakan `PascalCase`:

```text
ProductionChart.tsx
CommodityCard.tsx
PublicHeader.tsx
```

Utility, service, schema, dan type menggunakan `kebab-case`:

```text
format-number.ts
commodity-service.ts
production-schema.ts
api-response.ts
```

File khusus Next.js mengikuti nama bawaan framework:

```text
page.tsx
layout.tsx
loading.tsx
error.tsx
not-found.tsx
route.ts
```

## 5. Directory Naming

Folder route menggunakan lowercase dan `kebab-case`.

Contoh:

```text
/app

  /(public)

    /edukasi

    /data-intelligence

    /profil-perusahaan
```

Jangan membuat dua folder berbeda dengan tanggung jawab yang sama.

## 6. TypeScript

Gunakan TypeScript untuk seluruh application code.

Hindari:

```ts
any;
```

Jika tipe data belum diketahui, gunakan:

```ts
unknown;
```

Kemudian lakukan pemeriksaan sebelum menggunakannya.

Contoh:

```ts
function parseValue(value: unknown): number {
  if (typeof value !== "number") {
    throw new Error("Nilai harus berupa angka.");
  }

  return value;
}
```

Gunakan explicit return type untuk:

- exported function;
- service;
- mapper;
- database helper;
- reusable utility.

Contoh:

```ts
export function formatYear(year: number): string {
  return year.toString();
}
```

## 7. Type and Interface

Gunakan `type` untuk:

- union;
- response shape;
- mapped type;
- component props;
- data transformation.

Contoh:

```ts
type RecordType = "actual" | "provisional" | "projection" | "revised";
```

Gunakan `interface` jika membutuhkan kontrak object yang akan diperluas atau diimplementasikan.

Jangan membuat type yang sama pada banyak file. Tempatkan shared type pada lokasi bersama yang sesuai.

## 8. Import Convention

Urutkan import berdasarkan kelompok:

1. framework dan external package;
2. internal module;
3. type;
4. style atau asset.

Contoh:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { getCommodity } from "@/services/commodity-service";

import type { CommodityRecord } from "@/types/commodity";
```

Gunakan alias internal jika sudah dikonfigurasi:

```text
@/
```

Hindari relative import yang terlalu panjang:

```ts
import { db } from "../../../../db";
```

## 9. Function Convention

Satu function harus memiliki satu tujuan utama.

Gunakan kata kerja pada nama function:

```text
getCommodity
createContent
validateProduction
formatCurrency
mapProductionRecord
```

Boolean function menggunakan bentuk pertanyaan:

```text
isPublished
isVerified
hasPermission
canEditContent
```

Hindari function yang:

- terlalu panjang;
- memiliki terlalu banyak parameter;
- melakukan query, validation, mapping, dan rendering sekaligus;
- mengubah state tersembunyi.

Gunakan object parameter jika function memiliki banyak input.

```ts
type ProductionFilter = {
  commodity: string;
  fromYear?: number;
  toYear?: number;
};

function getProduction(filter: ProductionFilter) {
  // Implementation
}
```

## 10. React Components

Component harus fokus pada satu fungsi tampilan.

Pisahkan component jika:

- digunakan kembali;
- memiliki logic sendiri;
- memiliki state sendiri;
- membuat parent component sulit dibaca.

Props harus memiliki type yang jelas.

```tsx
type CommodityCardProps = {
  name: string;
  category: string;
  imageUrl?: string | null;
};

export function CommodityCard({
  name,
  category,
  imageUrl,
}: CommodityCardProps) {
  return (
    <article>
      <h2>{name}</h2>
      <p>{category}</p>
    </article>
  );
}
```

Jangan mendefinisikan data faktual dalam component jika data tersebut seharusnya berasal dari database atau service.

## 11. Server and Client Components

Gunakan Server Component sebagai default.

Tambahkan:

```ts
"use client";
```

hanya jika component membutuhkan:

- React state;
- event handler;
- browser API;
- interactive chart;
- interactive map;
- client-side form behavior.

Letakkan Client Component sedekat mungkin dengan bagian yang membutuhkan interaksi.

Jangan mengubah seluruh halaman menjadi Client Component hanya karena satu bagian bersifat interaktif.

## 12. Data Fetching

Tempatkan query dan external request pada server-side service.

Contoh alur:

```text
Page atau Route Handler

  Service

    Database Query atau External Adapter

      Mapper

        Response
```

Jangan menulis database query langsung di dalam komponen presentasi yang kompleks.

Hindari mengambil data yang sama berulang kali dalam satu request.

## 13. Validation

Gunakan Zod pada batas masuk sistem, seperti:

- query parameter;
- route parameter;
- request body;
- form input;
- environment variable;
- staging data;
- external response.

Contoh:

```ts
const yearSchema = z.coerce.number().int().min(1900).max(2100);
```

TypeScript type tidak menggantikan runtime validation.

## 14. Database Mapping

Database menggunakan `snake_case`, sedangkan application object dan API menggunakan `camelCase`.

Contoh:

```ts
const productionRecord = {
  productionValue: Number(row.productionValue),
  publicationStatus: row.publicationStatus,
};
```

Jangan mengembalikan database row mentah apabila bentuknya berbeda dari contract aplikasi.

## 15. Null and Optional Values

Gunakan `null` jika field tersedia tetapi nilainya belum ada.

Gunakan optional field jika field tersebut memang tidak selalu menjadi bagian object.

Contoh:

```ts
type SourceReference = {
  label: string;
  url: string | null;
  pageReference?: string;
};
```

Jangan menggunakan string berikut sebagai nilai kosong:

```text
"N/A"
"-"
"undefined"
"null"
```

## 16. Numeric Values

Jangan menggunakan string berformat sebagai data perhitungan.

Benar:

```ts
const productionValue = 775.2;
```

Tidak benar:

```ts
const productionValue = "775,2 juta ton";
```

Satuan disimpan terpisah dari nilai.

```ts
const production = {
  value: 775.2,
  unit: "million_ton",
};
```

Konversi PostgreSQL `numeric` ke JavaScript `number` harus dilakukan secara eksplisit dan aman.

## 17. Date and Time

Tanggal tanpa waktu menggunakan:

```text
YYYY-MM-DD
```

Timestamp menggunakan ISO 8601 UTC:

```text
2026-08-23T14:30:00.000Z
```

Tahun disimpan sebagai number:

```ts
const year = 2025;
```

Jangan menggunakan format tanggal ambigu.

## 18. Error Handling

Gunakan error yang dapat dikenali oleh lapisan pemanggil.

Jangan mengabaikan error dengan block kosong:

```ts
try {
  await executeTask();
} catch {
  // Dilarang
}
```

Log internal harus memiliki konteks yang cukup, tetapi tidak boleh memuat credential atau data sensitif.

Pesan untuk pengguna harus:

- singkat;
- dapat dipahami;
- tidak menampilkan detail internal.

## 19. Styling

Gunakan sistem styling yang sudah tersedia dalam repository.

Hindari:

- inline style yang berulang;
- warna hardcoded pada banyak component;
- ukuran spacing yang tidak konsisten;
- membuat komponen UI baru jika komponen setara sudah tersedia.

Pertahankan font dan identitas visual MineVision yang sudah ditetapkan.

## 20. Accessibility

Komponen interaktif harus:

- dapat digunakan dengan keyboard;
- memiliki label yang jelas;
- menggunakan elemen HTML semantik;
- memiliki alternative text untuk gambar informatif;
- memiliki focus state;
- tidak hanya mengandalkan warna untuk menyampaikan informasi.

Gunakan `button` untuk tindakan dan `a` atau `Link` untuk navigasi.

## 21. Comments

Komentar digunakan untuk menjelaskan alasan, batasan, atau keputusan yang tidak terlihat dari kode.

Contoh:

```ts
// Projection dipisahkan agar tidak dianggap sebagai data aktual.
```

Hindari komentar yang hanya mengulang isi kode.

Tidak perlu:

```ts
// Mengubah status menjadi published
status = "published";
```

## 22. Logging

Log harus memiliki konteks yang relevan.

Contoh informasi yang boleh dicatat:

```text
operation
route
status
duration
record identifier
```

Jangan mencatat:

```text
password
database URL
API key
session token
authorization header
```

## 23. Dependency Rules

Sebelum menambahkan dependency:

1. periksa apakah kebutuhan dapat diselesaikan dengan dependency yang tersedia;
2. periksa maintenance dan compatibility;
3. pastikan dependency benar-benar diperlukan;
4. jelaskan alasan penambahannya.

Jangan menambahkan dua library dengan fungsi yang sama tanpa alasan yang jelas.

## 24. Formatting and Quality Checks

Gunakan formatter dan ESLint configuration yang tersedia dalam repository.

Sebelum perubahan dianggap selesai, jalankan:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Jangan memperbaiki seluruh file yang tidak berkaitan hanya untuk mengubah format.

## 25. Prohibited Practices

Dilarang:

- menggunakan `any` tanpa alasan kuat;
- menonaktifkan TypeScript error tanpa penjelasan;
- menonaktifkan ESLint rule secara global untuk satu kasus;
- menduplikasi logic pada banyak file;
- mencampurkan UI dan database access;
- menaruh credential pada source code;
- membuat Client Component tanpa kebutuhan;
- mengubah public contract secara diam-diam;
- menambahkan dependency tanpa kebutuhan;
- meninggalkan dead code;
- meninggalkan debugging log pada production code.

## 26. Definition of Done

Perubahan kode selesai jika:

- penamaan mengikuti konvensi;
- TypeScript type jelas;
- input eksternal telah divalidasi;
- Server dan Client Component digunakan dengan tepat;
- tidak ada duplikasi yang tidak perlu;
- tidak ada credential atau debugging log;
- `npx tsc --noEmit` berhasil;
- `npm run lint` berhasil;
- `npm run build` berhasil.
