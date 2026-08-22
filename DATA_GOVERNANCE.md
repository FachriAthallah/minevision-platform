# MineVision Data Governance

Dokumen ini menetapkan aturan pengumpulan, validasi, verifikasi, publikasi, pemeliharaan, dan penggunaan data faktual MineVision.

Struktur tabel berada di `DATABASE_SCHEMA.md`. Proses MineBot berada di `RAG_PIPELINE.md`. Kontrak penyajian data melalui API berada di `API_CONTRACTS.md`.

## 1. Objectives

Data governance MineVision bertujuan memastikan data:

- berasal dari sumber yang dapat ditelusuri;
- memiliki nilai dan satuan yang konsisten;
- telah diverifikasi sebelum dipublikasikan;
- membedakan data aktual dan proyeksi;
- dapat diperbaiki tanpa kehilangan riwayat;
- tidak dibuat berdasarkan asumsi tanpa sumber;
- dapat digunakan kembali oleh website, dashboard, search, dan MineBot.

## 2. Data Scope

Aturan ini berlaku untuk:

- konten edukasi;
- informasi industri;
- profil komoditas;
- informasi karier;
- data intelligence;
- data ekonomi;
- sumber dan sitasi;
- data wilayah;
- data harga;
- data produksi;
- data yang digunakan MineBot.

## 3. Data Classification

| Klasifikasi | Keterangan                                    | Akses           |
| ----------- | --------------------------------------------- | --------------- |
| Public      | Sudah diverifikasi dan dipublikasikan         | Pengguna publik |
| Internal    | Masih disiapkan atau diperiksa                | Tim pengelola   |
| Restricted  | Mengandung credential atau informasi terbatas | Role tertentu   |

Status public hanya diberikan melalui proses publikasi resmi.

## 4. Source Priority

Gunakan sumber berdasarkan urutan prioritas berikut:

1. pemerintah dan regulator;
2. badan statistik resmi;
3. peraturan perundang-undangan;
4. laporan resmi perusahaan;
5. publikasi akademik;
6. organisasi industri;
7. penyedia data pasar;
8. media atau sumber sekunder terpercaya.

Sumber sekunder digunakan jika sumber utama tidak tersedia atau untuk memberikan konteks tambahan.

## 5. Source Requirements

Setiap sumber minimal memiliki:

- nama sumber;
- organisasi penerbit;
- jenis sumber;
- judul dokumen atau halaman;
- URL jika tersedia;
- tanggal publikasi jika tersedia;
- tanggal akses;
- referensi halaman untuk dokumen panjang;
- status verifikasi;
- status aktif.

Sumber harus dapat ditelusuri kembali oleh verifier.

URL pencarian, URL sementara, dan lokasi file pada komputer tidak boleh digunakan sebagai referensi publik.

## 6. Source Evaluation

Sumber diperiksa berdasarkan:

| Aspek         | Pertanyaan                                  |
| ------------- | ------------------------------------------- |
| Authority     | Siapa yang menerbitkan data?                |
| Relevance     | Apakah sumber membahas data yang digunakan? |
| Accuracy      | Apakah angka dan satuan dapat diperiksa?    |
| Period        | Tahun atau periode apa yang dicakup?        |
| Methodology   | Bagaimana data dihitung atau dikumpulkan?   |
| Consistency   | Apakah sesuai dengan sumber lain?           |
| Accessibility | Apakah sumber dapat diakses kembali?        |

Status resmi dan status terverifikasi adalah dua hal berbeda. Sumber resmi tetap harus diperiksa kesesuaiannya dengan data yang digunakan.

## 7. Data Record Types

| Record Type   | Fungsi                                        |
| ------------- | --------------------------------------------- |
| `actual`      | Data aktual yang telah diterbitkan            |
| `provisional` | Data sementara yang belum final               |
| `projection`  | Data hasil estimasi atau proyeksi             |
| `revised`     | Data aktual yang telah diperbaiki oleh sumber |

Setiap record wajib memiliki satu `recordType`.

Data provisional, projection, dan revised tidak boleh ditampilkan seolah-olah merupakan data actual biasa.

## 8. Projection Rules

Data proyeksi harus memiliki:

- label `projection`;
- periode proyeksi;
- dasar perhitungan;
- data aktual yang digunakan sebagai dasar;
- metode atau asumsi;
- pihak yang membuat proyeksi;
- sumber pendukung;
- catatan keterbatasan.

Proyeksi internal MineVision harus dibedakan dari proyeksi yang diterbitkan lembaga lain.

Proyeksi tidak boleh dibuat hanya untuk mengisi tahun yang belum memiliki data.

Pada chart, proyeksi harus memiliki tampilan yang berbeda dari data aktual.

## 9. Verification Status

| Status     | Fungsi                           |
| ---------- | -------------------------------- |
| `pending`  | Belum diperiksa                  |
| `verified` | Nilai dan sumber telah diperiksa |
| `rejected` | Tidak memenuhi persyaratan       |

Record hanya dapat menjadi `verified` setelah pemeriksa memastikan:

- sumber sesuai;
- angka sesuai sumber;
- satuan benar;
- periode benar;
- klasifikasi record benar;
- tidak terdapat konflik data yang belum dijelaskan.

Pembuat atau pengimpor data sebaiknya tidak menjadi satu-satunya pihak yang memverifikasi data tersebut.

## 10. Publication Status

| Status      | Fungsi                               |
| ----------- | ------------------------------------ |
| `draft`     | Data masih disiapkan                 |
| `in_review` | Data sedang diperiksa                |
| `published` | Data boleh ditampilkan kepada publik |
| `archived`  | Data tidak lagi aktif                |

Data faktual hanya dapat dipublikasikan jika:

```text
verificationStatus = verified
publicationStatus = published
```

Record `pending`, `rejected`, `draft`, `in_review`, atau `archived` tidak boleh ditampilkan sebagai data publik aktif.

## 11. Data Lifecycle

Data MineVision mengikuti urutan:

1. sumber ditemukan;
2. sumber dicatat;
3. data diekstrak;
4. data ditempatkan pada staging;
5. struktur divalidasi;
6. referensi database diperiksa;
7. dry run dilakukan;
8. data diimpor;
9. hasil import diverifikasi;
10. isi data diverifikasi;
11. data dipublikasikan;
12. data ditinjau ulang;
13. data direvisi atau diarsipkan jika diperlukan.

Tahap tidak boleh dilewati hanya agar data lebih cepat muncul pada website.

## 12. Staging Data

Data baru ditempatkan pada:

```text
/data

  /staging
```

Staging file bukan sumber utama. Staging file adalah representasi terstruktur dari sumber yang sudah dikumpulkan.

Setiap staging file harus:

- mengikuti schema yang ditentukan;
- menggunakan identifier yang konsisten;
- memuat sumber;
- memuat satuan;
- memuat record type;
- tidak mengandung credential;
- tidak menggunakan nilai contoh sebagai fakta;
- dapat divalidasi sebelum import.

## 13. Data Validation

Validation dilakukan pada beberapa tingkat.

### Structure Validation

Memeriksa:

- format file;
- required field;
- tipe data;
- enum;
- format tanggal;
- format slug;
- nilai kosong;
- duplikasi dalam file.

### Reference Validation

Memeriksa apakah:

- komoditas tersedia;
- satuan tersedia;
- sumber tersedia;
- wilayah tersedia;
- relasi antardata valid.

### Business Validation

Memeriksa:

- tahun berada dalam rentang yang diperbolehkan;
- nilai numerik tidak negatif;
- persentase berada pada rentang `0–100`;
- actual dan projection tidak tertukar;
- source period sesuai dengan record period;
- publication rule tidak dilanggar.

Schema validation tidak membuktikan bahwa angka tersebut benar. Kebenaran angka tetap harus diperiksa terhadap sumber.

## 14. Numeric Data Rules

Nilai numerik harus disimpan sebagai angka tanpa teks satuan.

Benar:

```json
{
  "value": 775.2,
  "unit": "million_ton"
}
```

Tidak benar:

```json
{
  "value": "775,2 juta ton"
}
```

Aturan numerik:

- gunakan titik sebagai pemisah decimal dalam JSON;
- simpan satuan secara terpisah;
- jangan mengubah skala tanpa mencatat konversi;
- jangan melakukan pembulatan prematur;
- pertahankan nilai asli dari sumber;
- dokumentasikan hasil konversi.

## 15. Measurement Units

Satuan harus menggunakan master unit yang tersedia.

Contoh:

```text
ton
million_ton
kg
gram
usd_per_ton
idr_per_gram
percentage
```

Jika nilai dikonversi, catat:

- nilai asli;
- satuan asli;
- nilai hasil konversi;
- satuan tujuan;
- rumus atau faktor konversi.

Data dengan unit berbeda tidak boleh digabungkan sebelum dinormalisasi.

## 16. Missing Values

Gunakan `null` jika nilai belum tersedia atau tidak dilaporkan.

Jangan mengganti data yang hilang dengan:

```text
0
"N/A"
"-"
"tidak ada"
"belum diketahui"
```

Nilai `0` hanya digunakan jika sumber secara jelas menyatakan bahwa nilainya nol.

Data yang tidak tersedia tidak boleh diperkirakan tanpa diklasifikasikan sebagai projection.

## 17. Citation Rules

Data faktual harus dapat dihubungkan dengan sumbernya.

Sitasi minimal memuat:

- label;
- sumber;
- URL jika tersedia;
- referensi halaman jika relevan;
- status sumber utama atau pendukung.

Satu record dapat memiliki:

- satu sumber utama;
- satu atau beberapa sumber pendukung.

Jika beberapa sumber memiliki angka berbeda, perbedaannya harus diperiksa dan dijelaskan. Jangan memilih angka hanya karena terlihat paling lengkap.

## 18. Duplicate and Idempotency Rules

Record dianggap berpotensi duplikat jika memiliki kombinasi identifier bisnis yang sama.

Contoh produksi:

```text
commodity
year
recordType
```

Importer harus idempotent. Menjalankan file yang sama kembali tidak boleh menghasilkan record duplikat.

Jika data sudah tersedia, importer harus:

- melewati record yang identik;
- memperbarui hanya jika workflow mengizinkan;
- menghentikan proses jika terdapat konflik yang tidak aman;
- melaporkan hasil insert, update, skip, dan failure.

## 19. Data Conflict Resolution

Jika dua sumber memberikan angka berbeda:

1. periksa definisi indikator;
2. periksa periode;
3. periksa satuan;
4. periksa cakupan wilayah;
5. periksa status provisional atau revised;
6. periksa tanggal publikasi;
7. prioritaskan sumber paling otoritatif;
8. dokumentasikan alasan pemilihan.

Data yang masih berkonflik tetap berstatus `pending` sampai keputusan dapat dipertanggungjawabkan.

## 20. Data Revision

Data yang sudah dipublikasikan dapat direvisi jika:

- sumber menerbitkan angka revisi;
- terjadi kesalahan ekstraksi;
- terjadi kesalahan satuan;
- terjadi kesalahan klasifikasi;
- ditemukan sumber yang lebih otoritatif.

Revision harus mencatat:

- record yang berubah;
- nilai sebelumnya;
- nilai baru;
- alasan perubahan;
- sumber revisi;
- waktu perubahan;
- pihak yang melakukan perubahan.

Jangan menghapus jejak data lama jika perubahan tersebut perlu diaudit.

## 21. Archiving

Gunakan status `archived` jika:

- data sudah tidak berlaku;
- sumber ditarik;
- data digantikan oleh revisi;
- data tidak lagi digunakan pada public display.

Archived record tidak ditampilkan sebagai data publik aktif, tetapi tetap dipertahankan jika diperlukan untuk riwayat dan audit.

## 22. Review Frequency

Frekuensi peninjauan mengikuti karakter data.

| Jenis Data        | Peninjauan                                      |
| ----------------- | ----------------------------------------------- |
| Harga             | Sesuai periode penerbitan                       |
| Produksi tahunan  | Setelah publikasi resmi atau revisi             |
| Regulasi          | Ketika terdapat perubahan aturan                |
| Profil perusahaan | Secara berkala atau saat ada perubahan material |
| Konten edukasi    | Ketika referensi atau konsep berubah            |
| Data proyeksi     | Ketika data aktual baru tersedia                |

Projection harus ditinjau ketika periode yang diproyeksikan telah memiliki data aktual.

## 23. Data Roles

| Role             | Tanggung Jawab                              |
| ---------------- | ------------------------------------------- |
| Data contributor | Mengumpulkan dan menyiapkan data            |
| Data importer    | Menjalankan ingestion                       |
| Data verifier    | Memeriksa nilai, satuan, dan sumber         |
| Publisher        | Menyetujui publikasi                        |
| Administrator    | Mengelola akses dan workflow                |
| Data owner       | Bertanggung jawab atas kualitas domain data |

Satu role tidak otomatis memiliki seluruh permission.

## 24. Intelligence Import Commands

Structure validation:

```powershell
npm run data:validate:intelligence -- data/staging/intelligence/FILE.json
```

Database reference preflight:

```powershell
npm run data:preflight:intelligence -- data/staging/intelligence/FILE.json
```

Dry run:

```powershell
npm run data:dry-run:intelligence -- data/staging/intelligence/FILE.json
```

Import:

```powershell
npm run data:import:intelligence -- data/staging/intelligence/FILE.json
```

Import verification:

```powershell
npm run data:verify:intelligence -- data/staging/intelligence/FILE.json
```

Importer hanya dijalankan ketika data memang perlu dimasukkan atau diperbarui.

## 25. Data Quality Checklist

Sebelum data diverifikasi, pastikan:

- [ ] sumber dapat ditelusuri;
- [ ] organisasi penerbit jelas;
- [ ] periode data benar;
- [ ] angka sesuai dengan sumber;
- [ ] satuan sesuai;
- [ ] record type benar;
- [ ] actual dan projection terpisah;
- [ ] nilai kosong tidak diganti dengan nol;
- [ ] tidak terdapat duplikasi;
- [ ] referensi database tersedia;
- [ ] citation tersedia;
- [ ] staging validation berhasil;
- [ ] dry run berhasil;
- [ ] import verification berhasil.

## 26. Prohibited Practices

Dilarang:

- membuat angka faktual tanpa sumber;
- menggunakan data contoh sebagai data nyata;
- mengubah projection menjadi actual;
- menampilkan data pending atau rejected;
- memublikasikan data sebelum diverifikasi;
- menghapus sumber dari record faktual;
- mengganti missing value dengan nol;
- menggabungkan nilai dengan satuan berbeda;
- mengubah data tanpa mencatat alasan;
- memasukkan record duplikat;
- menggunakan URL pencarian sebagai sumber;
- menyembunyikan konflik data yang diketahui.

## 27. Definition of Done

Dataset dianggap selesai jika:

- sumber telah dicatat;
- struktur staging valid;
- seluruh referensi database tersedia;
- nilai dan satuan sesuai sumber;
- actual dan projection dibedakan;
- data dapat diimpor secara idempotent;
- hasil import telah diverifikasi;
- citation dapat ditelusuri;
- verification status ditentukan;
- publication status ditentukan;
- data publik hanya berasal dari record verified dan published.
