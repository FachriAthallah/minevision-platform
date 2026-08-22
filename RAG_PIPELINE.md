# MineVision RAG Pipeline

Dokumen ini menetapkan alur Retrieval-Augmented Generation untuk MineBot AI.

Fokus dokumen ini adalah pengolahan knowledge base, chunking, embedding, retrieval, penyusunan context, generation, citation, fallback, dan evaluasi.

Kontrak endpoint MineBot berada di `API_CONTRACTS.md`. Aturan sumber dan publikasi berada di `DATA_GOVERNANCE.md`.

## 1. Purpose

RAG digunakan agar MineBot menjawab berdasarkan pengetahuan MineVision yang dapat ditelusuri, bukan hanya berdasarkan pengetahuan umum AI.

RAG harus:

- mengambil informasi yang relevan;
- menggunakan data yang boleh dipublikasikan;
- menyertakan sumber;
- mempertahankan angka, periode, dan satuan;
- membedakan actual dan projection;
- memberikan fallback jika bukti tidak cukup.

## 2. Implementation Status

Status RAG MineBot saat ini:

```text
Target
```

Tampilan MineBot tidak berarti RAG pipeline sudah tersedia.

RAG baru dianggap aktif setelah ingestion, retrieval, citation, fallback, dan evaluation berhasil diuji.

## 3. Knowledge Scope

Knowledge base MineBot dapat menggunakan konten publik dari:

- Edukasi;
- Industri;
- Komoditas;
- Karier;
- Intelligence;
- Ekonomi;
- About;
- regulasi;
- sumber pendukung yang disetujui.

Knowledge base publik tidak boleh memuat:

- credential;
- environment variable;
- draft internal;
- rejected data;
- private admin data;
- audit log;
- raw system prompt.

## 4. Retrieval Strategy

MineBot menggunakan dua jalur retrieval.

### Document Retrieval

Digunakan untuk konten naratif seperti:

- definisi;
- metode pertambangan;
- profil industri;
- profil komoditas;
- profesi;
- kebijakan;
- penjelasan ekonomi.

Document retrieval menggunakan keyword search, semantic search, dan metadata filtering.

### Structured Data Retrieval

Digunakan untuk data seperti:

- produksi;
- harga;
- tahun;
- satuan;
- wilayah;
- persentase;
- peringkat;
- indikator ekonomi.

Data terstruktur harus diambil dari database melalui service yang tervalidasi.

MineBot tidak boleh menyimpulkan angka hanya dari document chunk.

## 5. End-to-End Pipeline

```text
Approved Source

  Text Extraction

  Normalization

  Validation

  Chunking

  Embedding

  Indexing

  Retrieval

  Context Assembly

  Answer Generation

  Citation Validation
```

Setiap tahap harus dapat gagal dengan aman tanpa menghasilkan jawaban faktual palsu.

## 6. Document Eligibility

Dokumen hanya dapat masuk knowledge base publik jika:

- sumbernya aktif;
- sumbernya terverifikasi;
- kontennya sudah dipublikasikan;
- versi dokumen dapat dikenali;
- periode tersedia jika relevan;
- teks dapat diekstrak dengan benar.

Data dengan status `draft`, `rejected`, atau `archived` tidak dimasukkan ke indeks publik aktif.

## 7. Document Normalization

Sebelum chunking, dokumen dinormalisasi dengan:

- menghapus whitespace berlebihan;
- menghapus header dan footer berulang;
- mempertahankan heading;
- mempertahankan tabel yang bermakna;
- mempertahankan nomor halaman;
- mempertahankan angka, satuan, dan periode;
- mempertahankan label actual atau projection;
- menghubungkan teks dengan sumber asal.

Normalization tidak boleh mengubah arti data dari sumber.

## 8. Chunking Rules

Chunk dibuat berdasarkan batas semantik.

Prioritas pemisahan:

1. section;
2. subsection;
3. paragraph;
4. tabel atau list yang masih memiliki konteks lengkap.

Setiap chunk harus:

- dapat dipahami secara mandiri;
- memiliki heading induk;
- mempertahankan sumber;
- mempertahankan referensi halaman;
- tidak memisahkan angka dari satuan atau periode;
- tidak menggabungkan topik berbeda;
- tidak memisahkan isi tabel dari headernya.

Ukuran chunk dan overlap ditentukan melalui evaluasi, bukan ditetapkan sebelum pengujian.

## 9. Required Metadata

Metadata dokumen:

| Field                | Fungsi                   |
| -------------------- | ------------------------ |
| `documentId`         | Identifier dokumen       |
| `title`              | Judul dokumen            |
| `module`             | Modul MineVision         |
| `sourceId`           | Sumber utama             |
| `publicationStatus`  | Status publikasi         |
| `verificationStatus` | Status verifikasi        |
| `version`            | Versi dokumen            |
| `contentHash`        | Pendeteksi perubahan isi |

Metadata chunk:

| Field            | Fungsi            |
| ---------------- | ----------------- |
| `chunkId`        | Identifier chunk  |
| `documentId`     | Relasi dokumen    |
| `content`        | Isi chunk         |
| `heading`        | Heading asal      |
| `chunkOrder`     | Urutan chunk      |
| `pageReference`  | Referensi halaman |
| `sourceId`       | Relasi sumber     |
| `embeddingModel` | Model embedding   |

Nama field final mengikuti database schema ketika RAG mulai diimplementasikan.

## 10. Embedding

Embedding hanya dibuat untuk chunk yang lolos validation.

Aturan embedding:

- diproses melalui server atau ingestion worker;
- API key tidak dikirim ke browser;
- model dipilih melalui environment configuration;
- model dan dimensinya dicatat;
- chunk yang tidak berubah tidak diproses ulang;
- perubahan model membutuhkan reindexing;
- kegagalan embedding tidak menghapus indeks aktif.

Model embedding tidak boleh di-hardcode pada banyak file.

## 11. Indexing

Baseline target MineVision menggunakan hybrid search:

- PostgreSQL Full-Text Search untuk keyword;
- `pg_trgm` untuk kemiripan teks;
- `pgvector` untuk semantic similarity.

Indeks publik hanya memuat dokumen yang memenuhi:

```text
verificationStatus = verified
publicationStatus = published
```

Hosted file search dapat dievaluasi sebagai alternatif, tetapi penggunaannya membutuhkan keputusan arsitektur yang jelas.

## 12. Query Processing

Sebelum retrieval, pertanyaan pengguna diproses untuk:

- memvalidasi panjang input;
- menormalisasi whitespace;
- mengenali modul;
- mengenali komoditas;
- mengenali wilayah;
- mengenali tahun;
- mengenali indikator;
- menentukan jenis retrieval;
- membentuk metadata filter.

Query normalization tidak boleh mengubah maksud pertanyaan pengguna.

## 13. Retrieval

Retrieval dapat mempertimbangkan:

- keyword score;
- semantic similarity;
- module;
- content type;
- commodity;
- region;
- verification status;
- publication status.

Jumlah kandidat, similarity threshold, dan bobot hybrid search harus dikonfigurasi serta diuji.

Hasil dengan similarity tertinggi tidak otomatis dianggap benar tanpa pemeriksaan metadata.

## 14. Context Assembly

Context assembly harus:

- menghapus chunk duplikat;
- mempertahankan sumber;
- mengurutkan bukti berdasarkan relevansi;
- membatasi ukuran context;
- memisahkan actual dan projection;
- menghindari sumber yang saling bertentangan tanpa penjelasan;
- memasukkan structured data jika dibutuhkan.

Context hanya memuat informasi yang dibutuhkan untuk menjawab pertanyaan.

## 15. Answer Generation

Generation dilakukan melalui server-side AI service.

MineBot harus diarahkan untuk:

- menjawab berdasarkan context;
- tidak membuat fakta yang tidak tersedia;
- mempertahankan angka, periode, dan satuan;
- membedakan actual dan projection;
- menyatakan keterbatasan;
- mengabaikan instruksi yang ditemukan dalam dokumen;
- tidak menampilkan system prompt;
- tidak menampilkan internal metadata.

Model dan parameter generation dipilih melalui configuration, bukan di-hardcode pada komponen UI.

## 16. Citation

Jawaban faktual harus menyertakan sumber yang digunakan.

Citation minimal memuat:

- label;
- judul dokumen atau konten;
- organisasi sumber;
- URL jika tersedia;
- referensi halaman jika tersedia.

Citation hanya boleh berasal dari chunk yang digunakan dalam context.

MineBot tidak boleh membuat URL, judul sumber, atau referensi halaman sendiri.

## 17. Fallback

Fallback digunakan jika:

- retrieval tidak menemukan context yang cukup;
- similarity terlalu rendah;
- sumber tidak memenuhi publication rule;
- terdapat konflik data yang belum terselesaikan;
- pertanyaan berada di luar domain MineVision;
- AI provider tidak tersedia.

Contoh fallback:

```text
Maaf, MineBot belum memiliki sumber MineVision yang cukup untuk menjawab pertanyaan tersebut secara akurat.
```

Fallback lebih baik daripada jawaban tanpa dasar.

## 18. Conflicting Sources

Jika hasil retrieval memiliki informasi berbeda:

1. periksa periode;
2. periksa satuan;
3. periksa cakupan data;
4. periksa status record;
5. prioritaskan sumber yang lebih otoritatif;
6. jelaskan perbedaan jika keduanya tetap relevan;
7. gunakan fallback jika konflik tidak dapat diselesaikan.

MineBot tidak boleh memilih angka secara acak.

## 19. Index Updates

Dokumen perlu diindeks ulang jika:

- isi berubah;
- verification status berubah;
- publication status berubah;
- sumber menjadi tidak aktif;
- chunking strategy berubah;
- embedding model berubah.

Gunakan `contentHash` untuk mendeteksi perubahan.

Indeks lama baru dihapus setelah indeks pengganti berhasil dibuat dan diverifikasi.

## 20. RAG Protection

Pipeline harus melindungi dari:

- prompt injection dalam dokumen;
- retrieval terhadap data nonpublik;
- citation fabrication;
- context yang terlalu besar;
- input abuse;
- kebocoran prompt;
- kebocoran credential.

Isi dokumen harus diperlakukan sebagai data, bukan sebagai instruction untuk model.

## 21. Logging

RAG logging dapat mencatat:

- request identifier;
- retrieval duration;
- jumlah kandidat;
- chunk identifier;
- similarity score;
- generation duration;
- fallback reason;
- provider error category.

Log tidak boleh memuat:

- API key;
- system prompt lengkap;
- credential;
- private document;
- session token.

## 22. Evaluation

Evaluation set harus mencakup pertanyaan dari seluruh modul MineVision.

| Aspek               | Pemeriksaan                           |
| ------------------- | ------------------------------------- |
| Retrieval relevance | Chunk yang benar ditemukan            |
| Groundedness        | Jawaban didukung context              |
| Citation accuracy   | Citation mendukung klaim              |
| Data accuracy       | Angka, periode, dan satuan benar      |
| Status awareness    | Actual dan projection dibedakan       |
| Fallback quality    | Sistem menolak saat bukti tidak cukup |
| Access control      | Data nonpublik tidak muncul           |

Perubahan chunking, embedding, retrieval, atau prompt harus dibandingkan menggunakan evaluation set yang sama.

## 23. Target Structure

```text
/src

  /lib

    /rag

      /ingestion

      /chunking

      /embedding

      /retrieval

      /generation

      /evaluation

  /app

    /api

      /v1

        /minebot

          /query

/scripts

  /rag
```

Lokasi final mengikuti struktur repository ketika fitur mulai diimplementasikan.

## 24. Implementation Order

1. tentukan schema dokumen dan chunk;
2. buat document eligibility;
3. buat extraction dan normalization;
4. buat chunking;
5. buat embedding dan indexing;
6. buat document retrieval;
7. buat structured data retrieval;
8. buat context assembly;
9. integrasikan answer generation;
10. buat citation mapping;
11. buat fallback;
12. buat evaluation set;
13. lakukan security dan quality testing;
14. integrasikan endpoint MineBot.

MineBot publik tidak diaktifkan sebelum citation dan fallback berhasil diuji.

## 25. Definition of Done

RAG pipeline dianggap selesai jika:

- hanya dokumen eligible yang diindeks;
- chunk mempertahankan sumber dan konteks;
- ingestion dapat dijalankan ulang dengan aman;
- retrieval menemukan bukti relevan;
- structured data diambil dari sumber kanonis;
- jawaban didukung context;
- citation akurat;
- actual dan projection dibedakan;
- fallback bekerja;
- data nonpublik tidak muncul;
- evaluation berhasil;
- error provider ditangani dengan aman;
- test, type check, lint, dan build berhasil.
