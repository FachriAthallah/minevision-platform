# MineVision — Design Specification

## 1. Document Information

- Document: `DESIGN.md`
- Product: MineVision Intelligence Platform
- Status: Draft
- Design source: Figma MVIP
- Figma: https://www.figma.com/design/PeG5PS0kEnPwUIUZgtwKjd/MVIP
- Related documents:
  - `PRD.md`
  - `ARCHITECTURE.md`
  - `SCHEMA.md`
  - `RULES.md`

Dokumen ini menjadi pedoman UI/UX, design system, struktur komponen, visualisasi data, responsive behavior, dan keputusan teknis desain MineVision.

---

## 2. Design Source of Truth

Figma MVIP menjadi referensi utama untuk:

- Arah visual dan identitas produk.
- Komposisi halaman.
- Hierarki informasi.
- Pola navigasi.
- Proporsi layout.
- Gaya kartu, tombol, filter, grafik, peta, dan footer.
- DNA visual yang digunakan pada halaman baru.

Implementasi tidak harus menyalin setiap ukuran Figma secara absolut. Nilai yang berulang dinormalisasi menjadi design token agar:

- Tampilan konsisten.
- Responsif di berbagai perangkat.
- Mudah dipelihara.
- Tidak menghasilkan banyak arbitrary value.
- Komponen dapat digunakan ulang.

Jika terdapat perbedaan antara Figma dan kebutuhan aksesibilitas atau keterbatasan teknis, implementasi yang dapat digunakan, responsif, dan mudah diakses memiliki prioritas.

---

## 3. Current Figma Coverage

Layout yang tersedia di Figma saat ini mencakup:

- Home.
- Edukasi.
- Industri.
- Career — Eksplorasi & Geologi.
- Career — Data, TI & Otomasi.
- Intelligence — Produksi.
- Intelligence — Harga.

Halaman Economy belum memiliki layout khusus. Layout Economy akan dikembangkan menggunakan DNA visual yang sama dengan halaman Intelligence dan Industry.

Variasi Home yang menampilkan hero tanpa global header tidak menjadi target implementasi. Global header tetap wajib terlihat agar pengguna dapat berpindah modul tanpa kembali melalui jalur tidak langsung.

Standarisasi nama layar yang digunakan:

- `Home`
- `Education`
- `Industry`
- `Career / Exploration and Geology`
- `Career / Data, IT and Automation`
- `Intelligence / Production`
- `Intelligence / Price`
- `Economy / Overview`
- `Economy / GDP`
- `Economy / Investment`
- `Economy / Export`

---

## 4. Design Vision

MineVision harus terasa sebagai platform informasi pertambangan yang:

- Kredibel.
- Profesional.
- Tenang.
- Modern.
- Data-driven.
- Mudah dipahami.
- Tidak terasa terlalu futuristik.
- Tidak terlihat seperti antarmuka AI generik.
- Tetap ramah bagi pengguna nonteknis.

Visual platform menggabungkan:

- Latar navy gelap.
- Aksen cyan, biru, dan teal.
- Foto pertambangan dengan overlay gelap.
- Tipografi editorial untuk heading.
- Tipografi sans-serif untuk data dan antarmuka.
- Kartu berlapis dengan border halus.
- Grafik yang bersih dan mudah dibaca.
- Penggunaan glow dan gradient secara terbatas.

---

## 5. Design Principles

### 5.1 Data Before Decoration

Visual harus membantu pengguna memahami informasi.

Dekorasi tidak boleh:

- Menutupi data.
- Mengurangi kontras.
- Mengganggu keterbacaan.
- Membuat grafik terlihat lebih dramatis dari data sebenarnya.

### 5.2 Progressive Disclosure

Informasi ditampilkan bertahap:

1. Ringkasan.
2. Tren utama.
3. Detail data.
4. Interpretasi.
5. Sumber dan metodologi.

Pengguna tidak harus membaca seluruh halaman untuk memahami temuan utama.

### 5.3 Source Visibility

Setiap informasi kuantitatif harus menyediakan:

- Sumber data.
- Periode data.
- Status data.
- Tautan referensi jika tersedia.
- Keterangan halaman atau dokumen jika tersedia.

### 5.4 Consistent Visual Language

Semua modul menggunakan pola visual yang sama:

- Header.
- Section heading.
- Cards.
- Filter.
- Buttons.
- Data states.
- Citation.
- Footer.
- MineBot entry point.

### 5.5 Honest Data Representation

MineVision harus membedakan:

- Nilai nol.
- Data tidak tersedia.
- Data belum diverifikasi.
- Data belum dipublikasikan.
- Data provisional.
- Data revisi.
- Data proyeksi.

Ketiadaan data tidak boleh divisualisasikan sebagai angka nol.

### 5.6 Responsive by Default

Desktop Figma berukuran dasar 1440 px, tetapi implementasi harus dirancang mulai dari struktur yang tetap dapat digunakan pada mobile.

---

## 6. Information Architecture

Navigasi publik utama:

1. Home
2. Education
3. Industry
4. Career
5. Intelligence
6. Economy

Navigasi pendukung:

- Commodities
- Search
- About
- Privacy
- Authentication
- Account
- MineBot

Struktur modul data:

- Intelligence
  - Production
  - Price
  - Smelters
  - Commodity distribution
  - Commodity insights

- Economy
  - Overview
  - GDP
  - Investment
  - Export
  - Economic insight

---

## 7. Global User Flow

### 7.1 Public Exploration Flow

1. Pengguna membuka Home.
2. Pengguna melihat ringkasan platform dan data utama.
3. Pengguna memilih modul.
4. Pengguna memasuki halaman overview atau detail.
5. Pengguna menggunakan filter.
6. Data dan visualisasi diperbarui.
7. Pengguna membaca insight.
8. Pengguna memeriksa sumber data.
9. Pengguna dapat melanjutkan ke modul terkait.

### 7.2 Data Exploration Flow

1. Pengguna membuka Intelligence atau Economy.
2. Sistem menampilkan filter awal yang valid.
3. Data utama dimuat dari server.
4. Pengguna mengubah komoditas, periode, wilayah, atau kategori.
5. Filter disimpan di URL jika relevan.
6. Grafik, KPI, tabel, insight, dan sumber diperbarui.
7. Pengguna dapat membagikan URL yang sudah terfilter.

### 7.3 Search Flow

1. Pengguna memilih tombol Search pada header.
2. Search input menjadi fokus.
3. Pengguna memasukkan kata kunci.
4. Sistem menampilkan hasil berdasarkan kategori.
5. Setiap hasil menunjukkan modul dan konteks.
6. Pengguna membuka halaman tujuan.

### 7.4 MineBot Flow

1. Pengguna memilih tombol MineBot.
2. Panel percakapan terbuka tanpa meninggalkan konteks halaman.
3. MineBot menerima konteks halaman atau data aktif.
4. Jawaban menampilkan sumber yang digunakan.
5. Pengguna dapat membuka sumber atau halaman terkait.

MineBot tidak boleh menghalangi kontrol utama, grafik, atau navigasi pada layar kecil.

### 7.5 Authentication Flow

1. Pengguna memilih tombol Login pada global header.
2. Sistem membuka satu halaman Login untuk user dan administrator.
3. User memilih email/password atau Google; administrator menggunakan form email/password yang sama dengan akun internal.
4. Sistem menyelesaikan authentication callback dan memverifikasi session pada server.
5. Sistem memastikan profil aplikasi tersedia dan menentukan application role.
6. User dikembalikan ke halaman publik yang dituju atau area akun.
7. Administrator dengan role valid diarahkan ke Admin Dashboard.
8. Header user terautentikasi mengganti tombol Login dengan account menu dan logout tanpa menghilangkan navigasi modul.

Google login biasa tidak boleh menampilkan atau menghasilkan state seolah-olah user memperoleh akses administrator.

---

## 8. Visual Foundation

## 8.1 Color System

Nilai berikut dinormalisasi dari pola warna dominan pada Figma.

### Base Colors

| Token               |                       Value | Usage                         |
| ------------------- | --------------------------: | ----------------------------- |
| `background`        |                   `#020B1C` | Latar utama halaman           |
| `background-subtle` |                   `#051125` | Section alternatif            |
| `surface`           |                   `#0C1B31` | Card dan panel                |
| `surface-elevated`  |                   `#122239` | Card aktif atau elevated      |
| `surface-overlay`   |    `rgba(12, 27, 49, 0.70)` | Header dan overlay            |
| `text-primary`      |                   `#F0F6FA` | Heading dan body utama        |
| `text-secondary`    |                   `#9FACBA` | Deskripsi dan metadata        |
| `text-muted`        |                   `#708096` | Informasi sekunder            |
| `border`            |    `rgba(41, 57, 79, 0.65)` | Border default                |
| `border-strong`     | `rgba(159, 172, 186, 0.40)` | Border kontras                |
| `primary`           |                   `#00BBD5` | CTA dan highlight             |
| `primary-hover`     |                   `#00C8C0` | Hover atau accent teal        |
| `secondary`         |                   `#1D84F5` | Grafik dan informasi sekunder |
| `success`           |                   `#3CC3AB` | Status positif                |
| `warning`           |                   `#F5B84B` | Provisional atau perhatian    |
| `danger`            |                   `#EF6A72` | Error atau tren negatif       |
| `info`              |                   `#58A6FF` | Informasi kontekstual         |

### Brand Gradient

Gradient brand utama:

`#2867E4 → #00B1C4 → #3CC3AB`

Penggunaan:

- Primary CTA.
- Active indicator.
- Data highlight.
- Badge tertentu.
- Fokus visual terbatas.

Gradient tidak digunakan untuk seluruh teks panjang atau seluruh permukaan halaman.

### Background Gradient

Section dapat menggunakan kombinasi:

- Linear navy gradient.
- Radial blue glow.
- Radial cyan glow.
- Overlay gelap di atas gambar.

Glow harus memiliki opacity rendah dan tidak mengurangi kontras konten.

---

## 8.2 Typography

### Font Families

| Role                | Font                                                               |
| ------------------- | ------------------------------------------------------------------ |
| Display dan heading | Merriweather                                                       |
| Body dan interface  | Lato                                                               |
| Chart fallback      | Lato                                                               |
| System fallback     | Georgia atau serif untuk heading; Arial atau sans-serif untuk body |

### Typography Scale

| Token        |  Desktop |   Mobile |  Weight |
| ------------ | -------: | -------: | ------: |
| `display-lg` |    56 px |    38 px |    Bold |
| `display-md` |    48 px |    34 px |    Bold |
| `heading-1`  |    40 px |    30 px |    Bold |
| `heading-2`  | 30–36 px |    26 px |    Bold |
| `heading-3`  | 20–24 px |    20 px |    Bold |
| `heading-4`  |    18 px |    18 px |    Bold |
| `body-lg`    |    16 px |    16 px | Regular |
| `body`       |    14 px |    14 px | Regular |
| `body-sm`    |    12 px |    12 px | Regular |
| `label`      | 12–14 px | 12–14 px |    Bold |
| `caption`    | 11–12 px | 11–12 px | Regular |

### Typography Rules

- Merriweather digunakan untuk judul, bukan kontrol.
- Lato digunakan untuk navigation, button, label, body, metadata, tabel, dan grafik.
- Heading utama maksimal sekitar 18 kata.
- Body text idealnya memiliki lebar 55–75 karakter.
- Teks grafik tidak boleh lebih kecil dari 11 px.
- Uppercase hanya digunakan pada eyebrow, status, atau kategori pendek.

---

## 8.3 Spacing System

Sistem spacing menggunakan kelipatan 4 px.

| Token      | Value |
| ---------- | ----: |
| `space-1`  |  4 px |
| `space-2`  |  8 px |
| `space-3`  | 12 px |
| `space-4`  | 16 px |
| `space-5`  | 20 px |
| `space-6`  | 24 px |
| `space-8`  | 32 px |
| `space-10` | 40 px |
| `space-12` | 48 px |
| `space-16` | 64 px |
| `space-20` | 80 px |
| `space-24` | 96 px |

Standar utama:

- Card padding: 24 px.
- Compact card padding: 16 px.
- Section gap: 64–96 px.
- Form control gap: 12–16 px.
- Grid gap: 24 px.
- Mobile section gap: 48–64 px.

---

## 8.4 Grid and Container

Desktop Figma menggunakan canvas 1440 px.

Canonical layout:

- Maximum container width: 1320 px.
- Data dashboard container: 1272–1320 px.
- Desktop horizontal margin: minimum 60 px.
- Tablet horizontal margin: 32 px.
- Mobile horizontal margin: 20 px.
- Grid desktop: 12 columns.
- Grid tablet: 8 columns.
- Grid mobile: 4 columns.

Konten utama tidak boleh menempel pada viewport meskipun layar lebih lebar dari 1440 px.

---

## 8.5 Border Radius

| Token         |   Value | Usage                 |
| ------------- | ------: | --------------------- |
| `radius-sm`   |    6 px | Badge dan label kecil |
| `radius-md`   |   12 px | Input dan button      |
| `radius-lg`   |   14 px | Internal card         |
| `radius-xl`   |   18 px | Card dan panel utama  |
| `radius-full` | 9999 px | Pill, avatar, status  |

Radius 18 px menjadi karakter utama card MineVision.

---

## 8.6 Border and Elevation

Default card:

- Border 1 px.
- Border menggunakan `border`.
- Surface menggunakan navy transparan atau gradient tipis.
- Shadow gelap dan lembut.
- Tidak menggunakan shadow terang berlebihan.

Elevated panel dapat menggunakan:

- Shadow vertikal 12–18 px.
- Blur 24–40 px.
- Cyan glow dengan opacity rendah untuk CTA atau active state.

Hover tidak boleh menggeser card secara ekstrem. Maksimum translasi visual sekitar 2–4 px.

---

## 9. Global Layout

## 9.1 Header

Karakter header dari Figma:

- Floating navigation.
- Posisi dekat bagian atas viewport.
- Latar glass-like navy.
- Border tipis.
- Radius besar.
- Logo di kiri.
- Navigasi di tengah.
- Search dan authentication action di kanan.
- Active page menggunakan underline cyan.

Coverage:

- Global header wajib terlihat pada Home dan seluruh halaman publik.
- Area akun/user yang terautentikasi tetap menggunakan global header agar modul lain selalu dapat ditemukan.
- Header tidak boleh dihilangkan dari hero fullscreen; header dapat menggunakan overlay atau floating positioning selama kontras dan keterbacaannya memenuhi accessibility baseline.
- Anonymous state menampilkan tombol Login.
- Authenticated user state menampilkan avatar atau account menu, tetapi mempertahankan Search dan navigasi utama.
- Admin Dashboard menggunakan admin topbar/sidebar tersendiri serta menyediakan tautan yang jelas untuk kembali ke website publik.

Desktop:

- Tinggi visual sekitar 68 px.
- Berada di dalam container 1320 px.
- Margin atas sekitar 20 px.

Mobile:

- Logo tetap terlihat.
- Navigasi dipindahkan ke menu drawer.
- Search tersedia sebagai icon button.
- CTA authentication dapat dipindahkan ke drawer.
- Minimum touch target 44 × 44 px.

Header dapat menjadi sticky, tetapi harus mempertahankan keterbacaan dan tidak menutupi anchor target.

Pada layar kecil, account action dan logout dapat berada di dalam drawer, tetapi akses menuju modul utama tidak boleh hilang.

---

## 9.2 Hero

Pola hero Home:

- Background image pertambangan.
- Overlay navy gelap.
- Eyebrow badge.
- Heading besar dan terpusat.
- Deskripsi singkat.
- Primary dan secondary CTA.

Pola hero halaman modul:

- Heading dan deskripsi di sisi kiri.
- Visual atau background image di sisi kanan.
- Ringkasan metrik berada dekat konten utama.
- Tinggi lebih pendek daripada Home.

Hero tidak boleh menggunakan gambar tanpa overlay apabila teks berada di atasnya.

---

## 9.3 Footer

Footer terdiri dari:

- Brand summary.
- Social links.
- Platform navigation.
- Explore links.
- Resources.
- Data sources.
- Copyright.

Pada mobile, kolom footer menjadi accordion atau stack vertikal.

Sumber resmi seperti ESDM dan BPS harus mudah ditemukan tetapi tidak dianggap sebagai endorsement formal.

---

## 9.4 MineBot Entry Point

MineBot menggunakan floating action button:

- Berada di sisi kanan bawah.
- Ikon berukuran jelas.
- Memiliki label MineBot.
- Dapat menampilkan status online.

Pada mobile:

- Tidak boleh menutupi CTA, pagination, atau filter.
- Memperhitungkan safe area.
- Panel terbuka sebagai bottom sheet atau full-screen dialog.

---

## 10. Component System

## 10.1 Component Categories

### Primitives

- Button
- IconButton
- Input
- Select
- Checkbox
- Radio
- Switch
- Badge
- Tooltip
- Divider
- Skeleton
- Spinner

### Navigation

- Header
- DesktopNav
- MobileNav
- Breadcrumb
- Tabs
- Pagination
- Footer

### Content

- SectionHeading
- Hero
- ContentCard
- FeatureCard
- CommodityCard
- CompanyCard
- CareerCard
- SourceCard
- InsightCard
- ResourceStrip

### Data Display

- MetricCard
- TrendCard
- ChartCard
- DataTable
- StatusBadge
- CitationList
- DataAvailability
- MapPanel
- RegionList
- YearComparison

### Feedback

- EmptyState
- ErrorState
- LoadingState
- NoPublishedDataState
- VerificationPendingState
- Toast
- InlineAlert

### AI

- MineBotButton
- MineBotPanel
- ChatMessage
- SourceReference
- SuggestedQuestion

---

## 10.2 Button Variants

### Primary

- Brand gradient atau primary cyan.
- Digunakan untuk aksi utama.
- Maksimum satu primary CTA dalam satu kelompok aksi.

### Secondary

- Surface transparan.
- Border tipis.
- Digunakan untuk aksi alternatif.

### Ghost

- Tanpa surface permanen.
- Digunakan untuk navigasi atau aksi ringan.

### Destructive

- Digunakan hanya untuk aksi berisiko.
- Membutuhkan konfirmasi jika data akan hilang.

### Button States

Setiap variant harus memiliki:

- Default.
- Hover.
- Focus-visible.
- Active.
- Disabled.
- Loading.

Focus ring tidak boleh dihilangkan.

---

## 10.3 Card Variants

### Standard Card

Untuk konten umum dan navigation module.

### Metric Card

Berisi:

- Label.
- Nilai.
- Unit.
- Perubahan.
- Periode.
- Status data.

### Chart Card

Berisi:

- Judul.
- Unit.
- Tooltip bantuan.
- Filter lokal jika diperlukan.
- Chart.
- Legend.
- Sumber.
- Status data.

### Insight Card

Berisi interpretasi singkat dari data. Insight tidak boleh menyatakan hubungan sebab-akibat tanpa sumber.

### Source Card

Berisi:

- Nama sumber.
- Organisasi.
- Tahun.
- Referensi halaman.
- URL.
- Status sumber.

---

## 10.4 Filter Components

Filter dapat meliputi:

- Commodity.
- Period.
- Region.
- Facility type.
- Investment origin.
- Availability.
- Data status.

Aturan:

- Label harus selalu terlihat.
- Placeholder bukan pengganti label.
- Filter aktif dapat direpresentasikan di URL.
- Harus tersedia aksi reset.
- Perubahan filter harus memberikan feedback loading.
- Filter mobile menggunakan drawer atau bottom sheet.
- Pilihan yang tidak tersedia harus disabled atau tidak ditampilkan.

---

## 11. Page Composition

## 11.1 Home

Urutan utama:

1. Global header.
2. Mining hero.
3. Indonesia Mining at a Glance.
4. Explore MineVision.
5. Mining Intelligence preview.
6. Featured commodities.
7. Search entry point.
8. MineBot CTA.
9. Data source strip.
10. Footer.

Home berfungsi sebagai pengenalan platform dan jalur navigasi, bukan dashboard penuh.

Global header pada urutan pertama bersifat wajib. Desain hero tanpa header visible dianggap belum memenuhi navigation acceptance criteria.

---

## 11.2 Education

Pola halaman:

1. Module hero.
2. Category navigation.
3. Featured learning material.
4. Content grid.
5. Learning path atau level.
6. Related resources.
7. Sources.
8. Footer.

Kategori harus mudah dipahami pengguna baru dan tidak bergantung pada istilah pertambangan yang terlalu teknis.

---

## 11.3 Industry

Pola berdasarkan Figma:

1. Split hero dengan statistik ringkas.
2. Category sidebar.
3. Company grid.
4. Industry structure.
5. Technology and operation cards.
6. Operation map.
7. Regional insight.
8. Sources and references.
9. Footer.

Sidebar menjadi horizontal tabs atau dropdown pada layar kecil.

---

## 11.4 Career

Career mendukung beberapa jalur profesi, misalnya:

- Eksplorasi dan geologi.
- Operasi tambang.
- Processing dan metallurgy.
- Environment dan sustainability.
- Data, IT, dan automation.

Setiap career detail dapat mencakup:

- Ringkasan profesi.
- Tanggung jawab.
- Kompetensi.
- Tools.
- Pendidikan.
- Career progression.
- Work environment.
- Related roles.
- Learning resources.

---

## 11.5 Intelligence

Pola detail Intelligence:

1. Breadcrumb atau module label.
2. Page heading.
3. Deskripsi data.
4. Filter bar.
5. Primary chart.
6. KPI summary.
7. Insight.
8. Supporting visualization.
9. Map atau regional distribution.
10. Data table.
11. Source and methodology.

Status record harus dibedakan secara visual:

| Status      | Representation                   |
| ----------- | -------------------------------- |
| Actual      | Neutral atau primary             |
| Provisional | Warning badge                    |
| Revised     | Info badge                       |
| Projection  | Dashed line atau secondary style |

Projection tidak boleh menggunakan gaya yang identik dengan actual.

---

## 11.6 Login and Authenticated User Area

Login menggunakan satu page composition dengan:

1. MineVision identity pada sisi kiri atas card.
2. Heading dan tautan menuju create account yang terpusat.
3. Field berlabel `Email` dan `Password` dengan sudut lengkung.
4. Primary action `Sign in` untuk user maupun administrator.
5. Pemisah visual dan secondary action `Continue with Google`.
6. Loading, callback, invalid-session, dan provider-error states.
7. Logo menjadi tautan kembali ke halaman publik.

Create Account menggunakan page composition yang konsisten dengan field `Username`, `Your E-mail`, `Create Password`, dan `Repeat Password`, primary action `Get Started`, serta Google login di bawahnya. Public sign-up selalu menghasilkan role `user`. Administrator tidak memiliki public sign-up; akun administrator dibuat atau diundang melalui trusted internal process.

Area akun minimum mencakup:

- identitas dasar dari akun email/password atau Google;
- status session;
- logout;
- global header dan navigation;
- placeholder yang jujur untuk fitur akun lanjutan yang belum tersedia, tanpa menjanjikan Quiz, bookmark, atau personalisasi sebagai fitur MVP.

---

## 12. Economy Design

## 12.1 Economy Visual Direction

Economy menggunakan DNA visual Intelligence:

- Dark navy background.
- Data-first layout.
- Metric cards.
- Cyan dan blue charts.
- Source visibility.
- Filter panel.
- Insight cards.
- Status data eksplisit.

Economy tidak memerlukan identitas visual yang terpisah karena tetap bagian dari MineVision.

---

## 12.2 Economy Information Structure

Tab atau section navigation:

1. Overview
2. GDP
3. Investment
4. Export

Tab harus:

- Mendukung keyboard.
- Memiliki active state jelas.
- Tetap terbaca di mobile.
- Dapat berubah menjadi horizontal scroll atau select pada layar sempit.

---

## 12.3 Economy Overview Layout

Urutan halaman:

1. Header.
2. Economy hero.
3. Section navigation.
4. Latest economic indicators.
5. GDP trend.
6. Investment status.
7. Export status.
8. Economic insight.
9. Source and methodology.
10. Footer.

### Latest Economic Indicators

Metric cards dapat menampilkan:

- Nilai PDB pertambangan terbaru.
- Pertumbuhan tahunan.
- Tahun data terakhir.
- Jumlah periode tersedia.
- Status publikasi.

Metric tidak ditampilkan jika tidak mempunyai data publik yang valid.

---

## 12.4 GDP Section

GDP merupakan dataset Economy yang telah dapat ditampilkan secara publik.

Komposisi:

1. Page heading.
2. Period filter.
3. Latest GDP metric.
4. Growth metric.
5. GDP trend chart 2019–2025.
6. Year comparison.
7. Data table.
8. Insight.
9. Citation list.

Setiap record harus menampilkan:

- Tahun.
- Nilai PDB.
- Currency.
- Scale.
- Harga berlaku atau harga konstan jika relevan.
- Verification status.
- Publication status.
- Source.

---

## 12.5 Investment Section

Data investasi saat ini belum mempunyai record publik yang lolos kebijakan publikasi.

UI harus menampilkan `VerificationPendingState`, bukan angka nol.

Contoh pesan:

> Data investasi sedang melalui proses verifikasi dan belum tersedia untuk publik.

State tersebut dapat berisi:

- Penjelasan singkat.
- Dataset yang direncanakan.
- Filter yang akan tersedia.
- Sumber data yang sedang ditinjau.
- Link menuju Economy Overview.

Filter PMA dan PMDN tidak perlu diaktifkan sampai terdapat record publik yang valid.

---

## 12.6 Export Section

Data ekspor saat ini belum mempunyai record publik yang lolos kebijakan publikasi.

UI harus menampilkan:

- Status belum dipublikasikan.
- Penjelasan availability.
- Perbedaan antara `reported`, `not_reported`, dan belum dipublikasikan.
- Informasi bahwa ketiadaan record tidak berarti nilai ekspor nol.

Ketika data sudah dipublikasikan, halaman dapat mencakup:

- Commodity filter.
- Period filter.
- Availability filter.
- Export volume.
- Export value.
- Trend chart.
- Availability matrix.
- Source list.

---

## 13. Data Visualization

## 13.1 Chart Selection

| Data                  | Preferred visualization         |
| --------------------- | ------------------------------- |
| Tren tahunan          | Line chart                      |
| Perbandingan kategori | Bar chart                       |
| Kontribusi            | Horizontal bar atau stacked bar |
| Distribusi wilayah    | Map dan ranked list             |
| Availability          | Table atau status matrix        |
| Nilai tunggal         | Metric card                     |
| Perubahan dua periode | Comparison card                 |

Pie atau donut chart hanya digunakan jika jumlah kategori sedikit dan totalnya benar-benar bermakna.

---

## 13.2 Chart Color Rules

- Primary series: cyan.
- Secondary series: blue.
- Comparative series: teal.
- Projection: garis putus-putus.
- Negative value atau decline: danger.
- Missing data: gap, bukan titik nol.
- Grid line: border dengan opacity rendah.
- Axis label: text secondary.
- Tooltip: elevated surface.

Warna bukan satu-satunya pembeda. Gunakan label, icon, pattern, atau jenis garis.

---

## 13.3 Chart Requirements

Setiap chart harus mempunyai:

- Judul.
- Unit.
- Periode.
- Legend jika lebih dari satu series.
- Tooltip.
- Source label.
- Status data.
- Table atau textual summary sebagai fallback.
- Empty state.
- Loading state.
- Error state.

Sumbu tidak boleh dipotong dengan cara yang menyesatkan.

---

## 14. Interaction States

Setiap komponen interaktif harus memiliki:

- Default.
- Hover.
- Focus-visible.
- Active.
- Selected.
- Disabled.
- Loading.
- Error.

Setiap data surface harus mendukung:

- Loading.
- Success.
- Empty.
- No published data.
- Error.
- Stale atau revalidating jika diperlukan.

Skeleton harus mengikuti bentuk komponen akhir dan tidak menggunakan animasi berlebihan.

---

## 15. Motion

Motion digunakan secara ringan untuk:

- Fade-in section.
- Hover elevation.
- Tab transition.
- Chart update.
- Drawer.
- Modal.
- MineBot panel.

Standar durasi:

- Micro-interaction: 120–180 ms.
- Component transition: 180–240 ms.
- Panel transition: 240–320 ms.

Gunakan easing yang natural.

Jika `prefers-reduced-motion` aktif:

- Hilangkan parallax.
- Hilangkan transform besar.
- Kurangi animated chart.
- Gunakan perubahan opacity sederhana.

---

## 16. Responsive Behavior

### Desktop — 1280 px ke atas

- Full navigation.
- 12-column grid.
- Sidebar dan main content dapat berdampingan.
- Chart dan KPI dapat ditampilkan dalam dua kolom.

### Tablet — 768–1279 px

- Navigation dapat disederhanakan.
- Grid berubah menjadi 8 kolom.
- Sidebar berubah menjadi tabs atau compact filter panel.
- Chart menggunakan lebar penuh.

### Mobile — di bawah 768 px

- 4-column grid.
- Content satu kolom.
- Metric cards dapat menjadi horizontal scroll jika diperlukan.
- Filter berada dalam drawer.
- Table menggunakan horizontal scroll atau card representation.
- Chart memiliki tinggi minimum yang tetap terbaca.
- MineBot menjadi bottom sheet.
- CTA tidak boleh memenuhi seluruh layar tanpa alasan.

Target interaktif minimum adalah 44 × 44 px.

---

## 17. Accessibility

Target minimum: WCAG 2.2 Level AA.

Persyaratan:

- Kontras teks normal minimum 4.5:1.
- Kontras teks besar minimum 3:1.
- Semua fitur dapat digunakan dengan keyboard.
- Focus indicator selalu terlihat.
- Heading mengikuti urutan semantik.
- Form control mempunyai label.
- Icon-only button mempunyai accessible name.
- Chart mempunyai ringkasan tekstual atau tabel.
- Status tidak hanya dibedakan dengan warna.
- Modal dan drawer mengelola focus.
- Error message terhubung dengan field.
- Gambar informatif mempunyai alternative text.
- Gambar dekoratif menggunakan empty alternative text.

---

## 18. Technical Design Decisions

## 18.1 Semantic Design Tokens

Warna dan spacing disimpan sebagai semantic token melalui CSS variables.

Komponen menggunakan token seperti:

- `background`
- `foreground`
- `card`
- `muted`
- `primary`
- `border`
- `success`
- `warning`
- `danger`

Komponen tidak boleh menggunakan warna hex secara acak apabila token yang sesuai sudah tersedia.

---

## 18.2 Tailwind CSS

Tailwind digunakan untuk:

- Layout.
- Responsive behavior.
- Spacing.
- Typography.
- State styling.
- Design token integration.

Arbitrary value hanya digunakan ketika:

- Nilai benar-benar unik.
- Tidak layak menjadi token.
- Mempunyai alasan desain yang jelas.

---

## 18.3 Server-First Rendering

Server Components digunakan untuk:

- Initial page composition.
- Initial data loading.
- Metadata.
- Content statis.
- Source information.

Client Components digunakan untuk:

- Filters.
- Tabs interaktif.
- Chart.
- Map.
- Drawer.
- MineBot.
- URL synchronization.

Tujuannya adalah mengurangi JavaScript client tanpa mengorbankan interaksi.

---

## 18.4 URL-Backed Filters

Filter utama disimpan di query parameter jika halaman perlu:

- Dibagikan.
- Di-bookmark.
- Dimuat ulang.
- Diakses langsung.

Contoh:

`/economy?tab=gdp&fromYear=2019&toYear=2025`

State sementara seperti tooltip atau expanded card tidak perlu masuk URL.

---

## 18.5 Reusable Components

Komponen tidak dibuat berdasarkan satu halaman saja.

Contoh:

- `MetricCard` digunakan di Intelligence dan Economy.
- `ChartCard` digunakan untuk Production, Price, GDP, Investment, dan Export.
- `CitationList` digunakan di semua modul data.
- `VerificationPendingState` digunakan untuk dataset yang belum dipublikasikan.
- `FilterPanel` menerima konfigurasi sesuai domain.

---

## 18.6 Charts and Maps

Chart library harus dibungkus oleh komponen internal agar:

- Warna konsisten.
- Tooltip konsisten.
- Accessibility konsisten.
- Source footer konsisten.
- Responsive behavior konsisten.

Map juga harus dibungkus dengan komponen MineVision dan menyediakan list atau table fallback.

---

## 18.7 Image Treatment

Foto pertambangan menggunakan:

- Aspect ratio yang konsisten.
- Overlay navy.
- Gradient untuk menjaga keterbacaan.
- Focal point yang aman untuk responsive crop.
- Optimized image loading.

Foto tidak boleh digunakan hanya sebagai ornamen jika memperlambat first render tanpa memberi konteks.

---

## 19. Figma-to-Code Governance

Sebelum implementasi sebuah halaman:

1. Periksa layout Figma.
2. Identifikasi komponen yang sudah tersedia.
3. Petakan nilai visual ke semantic token.
4. Hindari membuat komponen baru jika pola yang sama sudah tersedia.
5. Implementasikan responsive behavior yang mungkin belum tergambar di Figma.
6. Tambahkan loading, empty, error, dan accessibility states.
7. Bandingkan hasil implementasi dengan Figma.
8. Jalankan visual dan functional verification.

Figma menjadi sumber visual, sedangkan codebase menjadi sumber perilaku dan state aplikasi.

---

## 20. Design Acceptance Criteria

Sebuah halaman dianggap selesai jika:

- Mengikuti visual identity MineVision.
- Responsif pada mobile, tablet, dan desktop.
- Home dan area user menyediakan global navigation yang terlihat dan dapat digunakan.
- Authenticated state mempertahankan navigasi modul dan menyediakan account menu serta logout.
- Admin Dashboard menyediakan navigation shell dan jalur kembali ke website publik.
- Semua kontrol dapat digunakan dengan keyboard.
- Loading, empty, dan error state tersedia.
- Data tidak menampilkan record non-publik.
- Sumber data terlihat.
- Status data dapat dipahami.
- Tidak menggunakan angka nol untuk data yang tidak tersedia.
- Filter bekerja dan dapat dibagikan jika URL-backed.
- Tidak terdapat layout overflow yang tidak disengaja.
- Tidak terdapat kontras teks yang gagal.
- Tidak terdapat komponen duplikat dengan fungsi identik.
- Implementasi lulus type-check, test, lint, dan build.

---

## 21. Current and Planned Design Status

| Area                                 | Status               |
| ------------------------------------ | -------------------- |
| Global public shell                  | Implemented          |
| Home foundation                      | Implemented          |
| Intelligence production experience   | Implemented          |
| Public production API                | Implemented          |
| Public smelter API                   | Implemented          |
| Public GDP API                       | Implemented          |
| Public investment API                | Implemented          |
| Public export API                    | Implemented          |
| Economy UI                           | Planned              |
| Investment public data state         | Verification pending |
| Export public data state             | Verification pending |
| Shared data visualization components | Planned              |
| Complete responsive audit            | Planned              |
| Accessibility audit                  | Planned              |
| MineBot experience                   | Planned              |
| Unified Login design                 | Planned for MVP      |
| Authenticated header and account UI  | Planned for MVP      |
| Admin design system                  | Planned              |

---

## 22. Immediate Design Priorities

Urutan pekerjaan desain berikutnya:

1. Normalisasi design token dari Figma ke codebase.
2. Audit komponen UI yang sudah ada.
3. Membuat shared data components.
4. Mendesain Economy Overview.
5. Mendesain GDP detail experience.
6. Mendesain verification-pending state untuk Investment.
7. Mendesain verification-pending state untuk Export.
8. Menentukan responsive behavior Economy.
9. Melakukan accessibility review.
10. Melakukan visual comparison antara Figma dan implementasi.
11. Memperbaiki Home composition agar global header selalu terlihat.
12. Mendesain unified Login, authentication callback states, dan authenticated header.
13. Mendesain area akun minimum dan Admin Dashboard navigation shell.
