export type EducationSource = {
  label: string;
  description: string;
  url?: string;
};

export type EducationItem = {
  title: string;
  description: string;
  details?: Array<{
    label: string;
    value: string;
  }>;
  bullets?: string[];
};

export type EducationSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  items?: EducationItem[];
};

export type GlossaryEntry = {
  term: string;
  definition: string;
};

export type GlossaryGroup = {
  title: string;
  entries: GlossaryEntry[];
};

export type EducationArticle = {
  slug: string;
  title: string;
  shortTitle: string;
  categoryLabel: string;
  summary: string;
  readingTime: string;
  sections: EducationSection[];
  glossary?: GlossaryGroup[];
  sources: EducationSource[];
};

const inventorySource: EducationSource = {
  label: "Master Data Inventory MineVision",
  description:
    "Dokumen Edukasi Pertambangan yang menjadi bahan kurasi utama artikel ini.",
};

export const educationArticles: EducationArticle[] = [
  {
    slug: "pengertian-pertambangan",
    title: "Pengertian Pertambangan",
    shortTitle: "Pengertian Pertambangan",
    categoryLabel: "Dasar dan Konsep",
    summary:
      "Pelajari definisi, tujuan, sejarah, jenis, dan peran pertambangan dalam kehidupan modern.",
    readingTime: "5 menit",
    sections: [
      {
        id: "definisi-dan-tujuan",
        title: "Definisi dan Tujuan Pertambangan",
        paragraphs: [
          "Pertambangan adalah seluruh rangkaian kegiatan yang dilakukan untuk mencari, mengekstraksi, mengolah, hingga memasarkan sumber daya mineral dan batubara yang terdapat di dalam bumi.",
          "Menurut Undang-Undang Mineral dan Batubara, pertambangan mencakup penyelidikan umum, eksplorasi, studi kelayakan, konstruksi, penambangan, pengolahan dan pemurnian, pengangkutan, penjualan, hingga kegiatan pascatambang.",
          "Secara sederhana, pertambangan mengambil bahan galian bernilai ekonomis dari dalam bumi untuk kebutuhan pembangunan infrastruktur, energi, teknologi, dan industri manufaktur. Tujuan dari pertambangan itu sendiri adalah:",
        ],
        bullets: [
          "Memenuhi kebutuhan bahan baku industri",
          "Menyediakan sumber energi",
          "Mendukung pembangunan nasional",
          "Meningkatkan pendapatan negara",
          "Menciptakan lapangan kerja",
          "Mendukung hilirisasi dan industrialisasi",
        ],
      },
      {
        id: "sejarah-pertambangan-indonesia",
        title: "Sejarah Pertambangan Indonesia",
        items: [
          {
            title: "Masa Kolonial Belanda (1600-1945)",
            description:
              "Pertambangan berkembang untuk memenuhi kebutuhan bahan baku industri Eropa. Komoditas utamanya meliputi timah di Bangka Belitung, batubara di Ombilin, minyak bumi di Sumatera dan Kalimantan, serta emas dan perak di berbagai wilayah Indonesia.",
          },
          {
            title: "Masa Awal Kemerdekaan (1945)",
            description:
              "Pemerintah Indonesia mulai mengambil alih pengelolaan sumber daya tambang. Pada 11 September 1945 dibentuk Jawatan Tambang dan Geologi sebagai lembaga pertama yang menangani sektor pertambangan Indonesia.",
          },
          {
            title: "Masa Modern (1967-2009)",
            description:
              "Periode ini ditandai masuknya investasi asing dan berkembangnya industri pertambangan skala besar dengan komoditas utama batubara, nikel, tembaga, emas, dan bauksit.",
          },
        ],
      },
      {
        id: "jenis-pertambangan",
        title: "Jenis-Jenis Pertambangan",
        items: [
          {
            title: "Mineral Logam",
            description:
              "Menghasilkan mineral yang mengandung unsur logam, seperti emas, perak, tembaga, nikel, timah, besi, dan bauksit.",
          },
          {
            title: "Mineral Bukan Logam",
            description:
              "Menghasilkan mineral non-logam untuk industri dan konstruksi, seperti kaolin, pasir kuarsa, feldspar, gipsum, dan fosfat.",
          },
          {
            title: "Batuan",
            description:
              "Menghasilkan material konstruksi, seperti batu kapur, andesit, granit, marmer, pasir, dan kerikil.",
          },
          {
            title: "Batubara",
            description: "Menghasilkan batubara sebagai sumber energi.",
          },
          {
            title: "Mineral Radioaktif",
            description:
              "Menghasilkan mineral yang mengandung unsur radioaktif, seperti uranium, thorium, dan monasit.",
          },
        ],
      },
      {
        id: "peran-pertambangan",
        title: "Peran Pertambangan dalam Kehidupan",
        paragraphs: [
          "Pertambangan memiliki peran strategis dalam kehidupan modern dan terhubung langsung dengan aktivitas ekonomi maupun pembangunan.",
        ],
        bullets: [
          "Penyedia energi",
          "Penyedia bahan baku industri",
          "Kontributor ekonomi nasional",
          "Pencipta lapangan kerja",
          "Pendorong pembangunan daerah",
        ],
      },
    ],
    sources: [
      inventorySource,
      {
        label: "JDIH Kementerian Keuangan",
        description: "Kamus hukum pertambangan dan rujukan UU Minerba.",
        url: "https://jdih.kemenkeu.go.id/kamus-hukum/pertambangan",
      },
      {
        label: "Kementerian ESDM",
        description: "Sejarah kelembagaan sektor energi dan pertambangan.",
        url: "https://www.esdm.go.id/id/profil/sejarah",
      },
      {
        label: "Mega Chemical",
        description: "Referensi umum jenis pertambangan di Indonesia.",
        url: "https://www.megachemical.co.id/pertambangan-di-indonesia/",
      },
      {
        label: "Sertifikasi.biz",
        description: "Referensi pengantar industri pertambangan.",
        url: "https://sertifikasi.biz/industri-pertambangan",
      },
    ],
  },
  {
    slug: "tahapan-kegiatan-pertambangan",
    title: "Tahapan Kegiatan Pertambangan",
    shortTitle: "Tahapan Kegiatan",
    categoryLabel: "Dari Eksplorasi hingga Penutupan",
    summary:
      "Ikuti siklus kegiatan pertambangan dari pencarian sumber daya hingga reklamasi dan pascatambang.",
    readingTime: "3 menit",
    sections: [
      {
        id: "siklus-pertambangan",
        title: "Siklus Kegiatan Pertambangan",
        paragraphs: [
          "Tahapan kegiatan pertambangan merupakan rangkaian kegiatan dari pencarian sumber daya hingga penutupan tambang.",
        ],
        items: [
          {
            title: "1. Prospeksi",
            description:
              "Mencari indikasi adanya mineral atau batubara melalui studi literatur, pemetaan geologi, dan pengambilan sampel.",
          },
          {
            title: "2. Eksplorasi",
            description:
              "Menentukan ukuran, kualitas, dan sumber daya melalui pemboran, survei geofisika, serta analisis laboratorium.",
          },
          {
            title: "3. Studi Kelayakan",
            description:
              "Menilai apakah rencana tambang layak secara teknis, ekonomi, lingkungan, dan sosial.",
          },
          {
            title: "4. Konstruksi",
            description:
              "Membangun fasilitas tambang, seperti jalan tambang, workshop, stockpile, crusher, dan pelabuhan.",
          },
          {
            title: "5. Operasi Penambangan",
            description:
              "Melaksanakan produksi yang meliputi pengupasan tanah penutup, penggalian bijih atau batubara, dan pengangkutan material.",
          },
          {
            title: "6. Pengolahan dan Pemurnian",
            description:
              "Meningkatkan nilai ekonomi hasil tambang, misalnya melalui smelter nikel, pemurnian emas, dan pencucian batubara.",
          },
          {
            title: "7. Pengangkutan dan Penjualan",
            description: "Mendistribusikan produk ke konsumen atau industri.",
          },
          {
            title: "8. Pascatambang dan Reklamasi",
            description:
              "Memulihkan lingkungan melalui reklamasi lahan, revegetasi, monitoring lingkungan, dan penutupan tambang.",
          },
        ],
      },
    ],
    sources: [
      inventorySource,
      {
        label: "JDIH Kementerian Keuangan",
        description:
          "Rujukan ruang lingkup kegiatan pertambangan dalam ketentuan Minerba.",
        url: "https://jdih.kemenkeu.go.id/kamus-hukum/pertambangan",
      },
      {
        label: "Kementerian ESDM",
        description:
          "Portal resmi informasi sektor energi dan sumber daya mineral.",
        url: "https://www.esdm.go.id/",
      },
    ],
  },
  {
    slug: "metode-penambangan",
    title: "Metode Penambangan",
    shortTitle: "Metode Penambangan",
    categoryLabel: "Teknik dan Metode Tambang",
    summary:
      "Bandingkan metode tambang terbuka dan bawah tanah beserta karakteristik, kelebihan, dan keterbatasannya.",
    readingTime: "7 menit",
    sections: [
      {
        id: "tambang-terbuka",
        title: "Metode Tambang Terbuka",
        items: [
          {
            title: "Open-Pit Mining",
            description:
              "Metode untuk mengambil mineral atau bijih yang relatif dekat dengan permukaan dengan membentuk lubang besar berjenjang. Umum digunakan untuk tembaga, emas, nikel, besi, dan bauksit.",
            details: [
              {
                label: "Karakteristik",
                value:
                  "Sistem bench, pengupasan overburden, produktivitas tinggi, dan biaya operasi per ton relatif rendah.",
              },
              {
                label: "Kelebihan",
                value:
                  "Produksi besar, operasi relatif lebih aman daripada tambang bawah tanah, dan penggunaan alat efisien.",
              },
              {
                label: "Keterbatasan",
                value:
                  "Membutuhkan area luas, dampak permukaan terlihat, dan tidak ekonomis untuk cadangan sangat dalam.",
              },
            ],
          },
          {
            title: "Open-Cast Mining",
            description:
              "Metode tambang terbuka untuk endapan dangkal yang tersebar secara horizontal, terutama batubara dan beberapa mineral industri.",
            details: [
              {
                label: "Kelebihan",
                value: "Biaya produksi rendah dan perolehan cadangan tinggi.",
              },
              {
                label: "Keterbatasan",
                value: "Membutuhkan pengupasan tanah dalam jumlah besar.",
              },
            ],
          },
          {
            title: "Strip Mining",
            description:
              "Metode untuk endapan berbentuk lapisan mendatar, terutama batubara, dengan pengupasan lapisan penutup secara bertahap membentuk jalur panjang.",
            details: [
              {
                label: "Kelebihan",
                value:
                  "Produktivitas tinggi, biaya rendah, dan recovery besar.",
              },
              {
                label: "Keterbatasan",
                value:
                  "Mengubah bentang alam secara signifikan dan membutuhkan reklamasi yang baik.",
              },
            ],
          },
          {
            title: "Quarry Mining",
            description:
              "Metode tambang terbuka untuk batuan industri dan material konstruksi, seperti batu kapur, marmer, andesit, granit, pasir, dan kerikil.",
            details: [
              {
                label: "Kelebihan",
                value: "Operasi sederhana dan investasi relatif rendah.",
              },
              {
                label: "Keterbatasan",
                value: "Menimbulkan dampak visual terhadap lanskap.",
              },
            ],
          },
        ],
      },
      {
        id: "tambang-bawah-tanah",
        title: "Metode Tambang Bawah Tanah",
        paragraphs: [
          "Tambang bawah tanah digunakan untuk mengambil cadangan yang terlalu dalam sehingga tidak ekonomis ditambang secara terbuka. Akses dapat berupa shaft, decline, atau adit.",
        ],
        items: [
          {
            title: "Underground Mining",
            description:
              "Underground Mining adalah metode penambangan yang dilakukan di bawah permukaan bumi untuk mengambil cadangan yang terlalu dalam sehingga tidak ekonomis ditambang secara terbuka.",
            details: [
              {
                label: "Karakteristik",
                value:
                  "Kedalaman besar, Investasi tinggi, dan Sistem ventilasi wajib.",
              },
              {
                label: "Kelebihan",
                value:
                  "Dampak permukaan lebih kecil serta dapat mengakses cadangan alam.",
              },
              {
                label: "Keterbatasan",
                value: "Biaya tinggi dan risiko keselamatan lebih besar.",
              },
            ],
          },
          {
            title: "Block Caving",
            description:
              "Massa batuan diruntuhkan secara terkendali menggunakan gravitasi, lalu bijih diambil melalui drawpoint di bawahnya.",
            details: [
              {
                label: "Kelebihan",
                value:
                  "Biaya operasi per ton rendah dan kapasitas produksi tinggi.",
              },
              {
                label: "Keterbatasan",
                value:
                  "Investasi awal sangat besar dan membutuhkan perencanaan geoteknik kompleks.",
              },
            ],
          },
          {
            title: "Room and Pillar",
            description:
              "Material ditambang membentuk ruang, sementara sebagian material ditinggalkan sebagai pilar untuk menopang atap. Umum pada lapisan datar seperti batubara dan garam.",
            details: [
              {
                label: "Kelebihan",
                value: "Stabilitas baik dan sistem relatif sederhana.",
              },
              {
                label: "Keterbatasan",
                value: "Sebagian cadangan tertinggal sebagai pilar.",
              },
            ],
          },
          {
            title: "Cut and Fill",
            description:
              "Bijih ditambang bertahap, kemudian ruang kosong diisi kembali dengan material pengisi. Cocok untuk endapan curam dan bijih berkadar tinggi.",
            details: [
              {
                label: "Kelebihan",
                value:
                  "Recovery tinggi, stabilitas buatan baik, dan fleksibel untuk geometri bijih kompleks.",
              },
              {
                label: "Keterbatasan",
                value: "Biaya operasi tinggi dan produksi lebih rendah.",
              },
            ],
          },
          {
            title: "Longwall Mining",
            description:
              "Metode tambang batubara bawah tanah yang menggunakan mesin pemotong otomatis pada bidang kerja panjang dengan hydraulic shield sebagai penyangga atap.",
            details: [
              {
                label: "Kelebihan",
                value:
                  "Recovery batubara dan efisiensi produksi sangat tinggi.",
              },
              {
                label: "Keterbatasan",
                value:
                  "Investasi peralatan mahal dan membutuhkan kondisi geologi yang sesuai.",
              },
            ],
          },
        ],
      },
    ],
    sources: [
      inventorySource,
      {
        label: "Encyclopaedia Britannica - Open-pit mining",
        description: "Referensi metode open-pit mining.",
        url: "https://www.britannica.com/technology/open-pit-mining",
      },
      {
        label: "Encyclopaedia Britannica - Opencast mining",
        description: "Referensi metode opencast mining.",
        url: "https://www.britannica.com/science/opencast-mining",
      },
      {
        label: "Encyclopaedia Britannica - Strip mining",
        description: "Referensi metode strip mining.",
        url: "https://www.britannica.com/technology/strip-mining",
      },
      {
        label: "Encyclopaedia Britannica - Quarrying",
        description: "Referensi quarry mining.",
        url: "https://www.britannica.com/science/quarrying",
      },
      {
        label: "Encyclopaedia Britannica - Underground mining",
        description: "Referensi metode tambang bawah tanah.",
        url: "https://www.britannica.com/technology/underground-mining",
      },
      {
        label: "Caterpillar - Block Caving",
        description: "Referensi metode block caving.",
        url: "https://www.cat.com/en_US/by-industry/mining/mining-technology/block-caving.html",
      },
      {
        label: "Encyclopaedia Britannica - Room-and-pillar",
        description: "Referensi metode room-and-pillar.",
        url: "https://www.britannica.com/technology/room-and-pillar-mining",
      },
      {
        label: "Encyclopaedia Britannica - Longwall mining",
        description: "Referensi metode longwall mining.",
        url: "https://www.britannica.com/technology/longwall-mining",
      },
    ],
  },
  {
    slug: "alat-berat-tambang",
    title: "Alat Berat Tambang",
    shortTitle: "Alat Berat Tambang",
    categoryLabel: "Jenis dan Fungsinya",
    summary:
      "Kenali fungsi alat gali, muat, angkut, penghancur, dan pendukung yang digunakan dalam operasi tambang.",
    readingTime: "6 menit",
    sections: [
      {
        id: "alat-produksi-dan-pendukung",
        title: "Alat Produksi dan Pendukung Tambang",
        items: [
          {
            title: "Excavator",
            description:
              "Alat untuk menggali, memuat, memindahkan, dan mengangkat tanah penutup, bijih, atau batubara.",
            details: [
              {
                label: "Fungsi",
                value:
                  "Penggalian material, pemuatan ke dump truck, pembersihan area kerja, dan pengupasan overburden.",
              },
              {
                label: "Penggunaan",
                value: "Open-pit, open-cast, strip, dan quarry mining.",
              },
            ],
          },
          {
            title: "Bulldozer",
            description:
              "Alat dengan blade di bagian depan untuk mendorong, meratakan, dan membersihkan material.",
            details: [
              {
                label: "Fungsi",
                value:
                  "Land clearing, pembangunan jalan tambang, pendorongan material, dan perawatan disposal.",
              },
              {
                label: "Penggunaan",
                value: "Open Pit, Open Cast, Strip, dan Quarry Mining.",
              },
            ],
          },
          {
            title: "Dump Truck",
            description:
              "Kendaraan angkut yang digunakan untuk memindahkan material hasil tambang dari front penambangan menuju crusher, stockpile, ROM, atau waste dump.",
            details: [
              {
                label: "Fungsi",
                value:
                  "Mengangkut overburden, mengangkut Batubara, serta mengangkut bijih..",
              },
              {
                label: "Penggunaan",
                value: "Open-pit, open-cast, strip, dan quarry mining.",
              },
            ],
          },
          {
            title: "Wheel Loader",
            description:
              "Alat pemuat beroda ban yang digunakan untuk memindahkan material jarak pendek dan memuat material ke truk.",
            details: [
              {
                label: "Fungsi",
                value:
                  "Loading material, stockpile management, feeding crusher.",
              },
              {
                label: "Penggunaan",
                value:
                  "Quarry, Open Pit, Open Cast, Strip Mining, dan Stockpile Area.",
              },
            ],
          },
          {
            title: "Motor Grader",
            description:
              "Motor Grader adalah alat yang digunakan untuk meratakan dan membentuk permukaan jalan tambang.",
            details: [
              {
                label: "Fungsi",
                value:
                  "Road maintenance, membuat kemiringan jalan, dan meratakan permukaan hauling road.",
              },
              {
                label: "Penggunaan",
                value: "Open Pit, Open Cast, Strip, dan Quarry Mining.",
              },
            ],
          },
          {
            title: "Scraper",
            description:
              "Alat yang dapat menggali, mengangkut, dan menyebarkan material dalam satu siklus kerja.",
            details: [
              {
                label: "Fungsi",
                value:
                  "Earthmoving, cut and fill operation, dan land development.",
              },
              {
                label: "Penggunaan",
                value: "Open Cast, Strip Mining, dan proyek reklamasi tambang.",
              },
            ],
          },
          {
            title: "Drilling Rig",
            description:
              "Alat yang digunakan untuk melakukan pemboran pada batuan.",
            details: [
              {
                label: "Fungsi",
                value:
                  "Eksplorasi, peledakan (blasting), geoteknik, dan dewatering.",
              },
              {
                label: "Penggunaan",
                value:
                  "Open Pit, Open Cast, Quarry, Strip, Longwall dan Underground Mining.",
              },
            ],
          },
          {
            title: "Crusher",
            description:
              "Mesin yang digunakan untuk memperkecil ukuran batuan atau bijih sebelum diproses lebih lanjut. Ada 4 jenis crusher seperti Jaw Crusher, Grygatory Crusher, Cone Crusher, dan Impact Crusher.",
            details: [
              {
                label: "Fungsi",
                value:
                  "Primary crushing, secondary crushing, dan ore preparation.",
              },
              {
                label: "Penggunaan",
                value:
                  "Open Pit, Open Cast, Strip, Quarry, Underground dan Longwall Mining.",
              },
            ],
          },
          {
            title: "Conveyor",
            description:
              "Sistem transportasi material kontinu menggunakan sabuk berjalan (belt)..",
            details: [
              {
                label: "Fungsi",
                value:
                  "Sebagai transportasi batubara, transportasi ore, serta feeding processing plant.",
              },
              {
                label: "Penggunaan",
                value:
                  "Open Pit, Open Cast, Strip, Quarry, Undergroung Mining, dan Longwall Mining.",
              },
            ],
          },
          {
            title: "Dragline",
            description:
              "Dragline adalah excavator berukuran sangat besar yang menggunakan bucket yang digantung dengan kabel baja.",
            details: [
              {
                label: "Fungsi",
                value: "Pengupasan overburden dalam volume besar.",
              },
              {
                label: "Penggunaan",
                value: "Strip Mining dan Open Cast Mining.",
              },
            ],
          },
          {
            title: "Electric Rope Shovel",
            description:
              "Alat gali-muat berkapasitas besar yang dirancang untuk operasi tambang skala besar..",
            details: [
              {
                label: "Fungsi",
                value: "Loading dump truck besar serta produksi masal.",
              },
              {
                label: "Penggunaan",
                value: "Open Pit Mining dan Open Cast Mining.",
              },
            ],
          },
          {
            title: "Compactor",
            description:
              "Alat berat yang digunakan untuk memadatkan tanah atau material agar memiliki daya dukung yang baik..",
            details: [
              {
                label: "Fungsi",
                value:
                  "Pemadatan jalan tambang, pemadatan disposal area, serta reklamasi tambang.",
              },
              {
                label: "Penggunaan",
                value:
                  "Open Pit, Open Cast, Strip Mining, serta pascatambang dan reklamasi.",
              },
            ],
          },
        ],
      },
    ],
    sources: [
      inventorySource,
      {
        label: "Caterpillar Safety",
        description:
          "Referensi keselamatan dan penggunaan peralatan industri pertambangan.",
        url: "https://www.cat.com/en_US/support/safety.html",
      },
    ],
  },
  {
    slug: "keselamatan-dan-kesehatan-kerja",
    title: "Keselamatan dan Kesehatan Kerja Pertambangan",
    shortTitle: "Keselamatan dan Kesehatan Kerja",
    categoryLabel: "K3 di Industri Pertambangan",
    summary:
      "Pahami prinsip K3, alat pelindung diri, identifikasi bahaya, manajemen risiko, dan tanggap darurat tambang.",
    readingTime: "8 menit",
    sections: [
      {
        id: "pengertian-k3",
        title: "Pengertian dan Tujuan K3 Tambang",
        paragraphs: [
          "Keselamatan dan Kesehatan Kerja pertambangan adalah upaya sistematis untuk melindungi tenaga kerja, peralatan, lingkungan, dan aset dari kecelakaan kerja, penyakit akibat kerja, serta kerugian operasional.",
          "K3 menjadi prioritas karena kegiatan tambang memiliki risiko seperti longsor, peledakan, kecelakaan alat berat, kebakaran, paparan debu dan gas, serta insiden tambang bawah tanah. Tujuan K3 Tambang sendiri yaitu:",
        ],
        bullets: [
          "Mencegah kecelakaan kerja",
          "Mencegah penyakit akibat kerja",
          "Menjamin keselamatan pekerja",
          "Menjaga produktivitas operasional",
          "Memenuhi regulasi pemerintah",
        ],
      },
      {
        id: "prinsip-dasar-k3",
        title: "Prinsip Dasar K3",
        bullets: [
          "Safe People",
          "Safe Equipment",
          "Safe Process",
          "Safe Environment",
        ],
      },
      {
        id: "alat-pelindung-diri",
        title: "Alat Pelindung Diri",
        paragraphs: [
          "Alat Pelindung Diri digunakan untuk melindungi pekerja dari bahaya yang belum dapat dihilangkan melalui rekayasa teknis atau prosedur kerja.",
        ],
        items: [
          {
            title: "Safety Helmet",
            description: "Melindungi kepala dari benturan dan benda jatuh.",
          },
          {
            title: "Safety Glasses",
            description: "Melindungi mata dari debu dan serpihan batu.",
          },
          {
            title: "Ear Plug",
            description:
              "Mengurangi paparan kebisingan alat berat dan peledakan.",
          },
          {
            title: "Respirator atau Masker",
            description:
              "Melindungi dari debu silika, batubara, dan partikel berbahaya.",
          },
          {
            title: "Safety Gloves",
            description: "Melindungi tangan dari gesekan dan benda tajam.",
          },
          {
            title: "Safety Boots",
            description: "Melindungi kaki dari benturan dan material.",
          },
          {
            title: "Reflective Vest",
            description: "Meningkatkan visibilitas pekerja di area operasi.",
          },
        ],
        bullets: [
          "APD harus sesuai dengan risiko pekerjaan",
          "APD harus diperiksa sebelum digunakan",
          "APD tidak menggantikan pengendalian bahaya",
        ],
      },
      {
        id: "identifikasi-bahaya",
        title: "Identifikasi Bahaya",
        paragraphs: [
          "Identifikasi bahaya adalah proses mengenali sumber bahaya yang berpotensi menyebabkan cedera, kerusakan peralatan, atau gangguan lingkungan. Metodenya antara lain HIRA, JSA, dan safety inspection. Contoh bahaya di tambang seperti:",
        ],
        bullets: [
          "Bahaya fisik: kebisingan, getaran, dan suhu tinggi",
          "Bahaya mekanis: alat berat bergerak, conveyor, dan crusher",
          "Bahaya geoteknik: longsor lereng dan runtuhan batuan",
          "Bahaya kimia: debu silika dan gas beracun",
          "Bahaya ergonomi: posisi kerja yang tidak ergonomis",
        ],
      },
      {
        id: "manajemen-risiko",
        title: "Manajemen Risiko",
        paragraphs: [
          "Manajemen risiko merupakan proses sistematis untuk mengidentifikasi, menganalisis, mengevaluasi, dan mengendalikan risiko.",
        ],
        bullets: [
          "Identifikasi risiko",
          "Analisis risiko",
          "Evaluasi risiko",
          "Pengendalian risiko",
        ],
      },
      {
        id: "investigasi-dan-tanggap-darurat",
        title: "Investigasi dan Tanggap Darurat",
        items: [
          {
            title: "Investigasi Kecelakaan",
            description:
              "Proses mencari akar penyebab insiden agar kejadian serupa tidak terulang, bukan untuk mencari siapa yang salah.",
            bullets: [
              "Mengamankan lokasi",
              "Mengumpulkan foto, video, dan dokumen",
              "Menganalisis penyebab",
              "Menetapkan tindakan perbaikan",
            ],
          },
          {
            title: "Emergency Response Plan",
            description:
              "Rencana untuk menghadapi kondisi darurat secara cepat, terorganisir, dan efektif demi menyelamatkan jiwa, mengurangi kerusakan aset, serta meminimalkan dampak lingkungan.",
          },
        ],
      },
      {
        id: "keselamatan-operasional",
        title: "Keselamatan Operasional",
        items: [
          {
            title: "Keselamatan Peledakan",
            description:
              "Prosedur untuk mengendalikan potensi flyrock, getaran tanah, air blast, dan misfire selama kegiatan peledakan.",
          },
          {
            title: "Keselamatan Alat Berat",
            description:
              "Pengendalian terhadap risiko collision, roll over, blind spot, dan mechanical failure melalui pre-start inspection, traffic management plan, teknologi, serta aturan keselamatan.",
          },
        ],
      },
    ],
    sources: [
      inventorySource,
      {
        label: "International Labour Organization",
        description: "Rujukan keselamatan dan kesehatan kerja.",
        url: "https://www.ilo.org/global/topics/safety-and-health-at-work/lang--en/index.htm",
      },
      {
        label: "OSHA - Personal Protective Equipment",
        description: "Rujukan alat pelindung diri.",
        url: "https://www.osha.gov/personal-protective-equipment",
      },
      {
        label: "ISO 45001",
        description:
          "Rujukan sistem manajemen keselamatan dan kesehatan kerja.",
        url: "https://www.iso.org/iso-45001-occupational-health-and-safety.html",
      },
      {
        label: "ISO 31000",
        description: "Rujukan prinsip manajemen risiko.",
        url: "https://www.iso.org/iso-31000-risk-management.html",
      },
      {
        label: "OSHA - Incident Investigation",
        description: "Rujukan investigasi insiden.",
        url: "https://www.osha.gov/incident-investigation",
      },
      {
        label: "Mine Safety and Health Administration",
        description: "Rujukan keselamatan dan tanggap darurat pertambangan.",
        url: "https://www.msha.gov/",
      },
      {
        label: "International Society of Explosives Engineers",
        description: "Rujukan keselamatan peledakan.",
        url: "https://www.isee.org/",
      },
      {
        label: "Caterpillar Safety",
        description: "Rujukan keselamatan alat berat.",
        url: "https://www.cat.com/en_US/support/safety.html",
      },
    ],
  },
  {
    slug: "istilah-pertambangan",
    title: "Istilah Pertambangan",
    shortTitle: "Istilah Pertambangan",
    categoryLabel: "110 Istilah dan Definisi",
    summary:
      "Gunakan glosarium untuk memahami terminologi eksplorasi, operasi, pengolahan, K3, dan pascatambang.",
    readingTime: "15 menit",
    sections: [
      {
        id: "pengantar-glosarium",
        title: "Glosarium Pertambangan",
        paragraphs: [
          "Istilah pertambangan mencakup terminologi, singkatan, dan konsep teknis yang digunakan sejak eksplorasi, perencanaan, operasi, pengolahan mineral, keselamatan kerja, hingga reklamasi dan penutupan tambang.",
        ],
      },
    ],
    glossary: [
      {
        title: "Geologi dan Eksplorasi",
        entries: [
          {
            term: "Mineral",
            definition: "Senyawa alami yang terbentuk secara geologis.",
          },
          {
            term: "Ore",
            definition: "Batuan yang mengandung mineral bernilai ekonomis.",
          },
          {
            term: "Exploration",
            definition: "Kegiatan pencarian sumber daya tambang.",
          },
          { term: "Prospecting", definition: "Tahap awal pencarian mineral." },
          {
            term: "Resource",
            definition: "Sumber daya mineral yang teridentifikasi.",
          },
          { term: "Reserve", definition: "Cadangan yang layak ditambang." },
          {
            term: "Deposit",
            definition: "Akumulasi mineral dalam jumlah tertentu.",
          },
          {
            term: "Orebody",
            definition: "Tubuh bijih yang mengandung mineral.",
          },
          { term: "Assay", definition: "Pengujian kadar mineral." },
          { term: "Core sample", definition: "Sampel inti hasil pemboran." },
          { term: "Drill hole", definition: "Lubang hasil pemboran." },
          {
            term: "Geology",
            definition: "Ilmu yang mempelajari bumi dan batuan.",
          },
          { term: "Geologist", definition: "Ahli geologi." },
          {
            term: "Geotechnical",
            definition: "Bidang yang mempelajari kestabilan batuan.",
          },
          {
            term: "Geophysics",
            definition: "Studi sifat fisik bawah permukaan bumi.",
          },
          { term: "Topography", definition: "Bentuk permukaan suatu wilayah." },
        ],
      },
      {
        title: "Tambang Terbuka",
        entries: [
          {
            term: "Overburden",
            definition: "Lapisan penutup di atas endapan tambang.",
          },
          {
            term: "Waste rock",
            definition: "Batuan yang tidak bernilai ekonomis.",
          },
          { term: "Bench", definition: "Jenjang pada tambang terbuka." },
          { term: "Pit", definition: "Area lubang tambang terbuka." },
          { term: "Highwall", definition: "Dinding tambang utama." },
          {
            term: "Lowwall",
            definition: "Dinding tambang yang berlawanan dengan highwall.",
          },
          { term: "Crest", definition: "Puncak lereng tambang." },
          { term: "Toe", definition: "Kaki lereng tambang." },
          {
            term: "Open pit",
            definition: "Metode tambang terbuka berbentuk pit.",
          },
          {
            term: "Open cast",
            definition: "Metode tambang terbuka untuk endapan dangkal.",
          },
          {
            term: "Strip mining",
            definition: "Metode tambang untuk lapisan horizontal.",
          },
          { term: "Quarry", definition: "Penambangan batuan konstruksi." },
          { term: "Hauling", definition: "Kegiatan pengangkutan material." },
          {
            term: "Haul road",
            definition: "Jalan khusus alat angkut tambang.",
          },
          { term: "Blasting", definition: "Kegiatan peledakan batuan." },
          { term: "Drilling", definition: "Kegiatan pemboran batuan." },
          {
            term: "Stripping ratio",
            definition: "Rasio overburden terhadap ore.",
          },
          { term: "ROM", definition: "Material tambang yang belum diolah." },
        ],
      },
      {
        title: "Tambang Bawah Tanah",
        entries: [
          {
            term: "Underground mining",
            definition: "Metode tambang bawah tanah.",
          },
          { term: "Shaft", definition: "Lubang vertikal tambang bawah tanah." },
          {
            term: "Decline",
            definition: "Terowongan miring menuju area tambang.",
          },
          { term: "Adit", definition: "Terowongan horizontal menuju tambang." },
          {
            term: "Drift",
            definition: "Terowongan yang mengikuti arah bijih.",
          },
          { term: "Stope", definition: "Area produksi tambang bawah tanah." },
          { term: "Backfill", definition: "Material pengisi rongga tambang." },
          { term: "Block caving", definition: "Metode runtuhan terkendali." },
          { term: "Room and pillar", definition: "Metode ruang dan pilar." },
          {
            term: "Longwall",
            definition: "Metode tambang batubara bawah tanah.",
          },
          { term: "Cut and fill", definition: "Metode gali dan isi kembali." },
          {
            term: "Ground control",
            definition: "Pengendalian kestabilan batuan.",
          },
          {
            term: "Ventilation",
            definition: "Sistem sirkulasi udara tambang.",
          },
        ],
      },
      {
        title: "Alat Berat Tambang",
        entries: [
          { term: "Excavator", definition: "Alat gali dan muat." },
          { term: "Shovel", definition: "Alat gali-muat berkapasitas besar." },
          { term: "Dragline", definition: "Excavator kabel berukuran besar." },
          { term: "Bulldozer", definition: "Alat pendorong material." },
          { term: "Wheel loader", definition: "Alat muat beroda." },
          { term: "Dump truck", definition: "Kendaraan angkut material." },
          { term: "Motor grader", definition: "Alat perata jalan." },
          { term: "Compactor", definition: "Alat pemadat tanah." },
          { term: "Crusher", definition: "Mesin penghancur batuan." },
          { term: "Conveyor", definition: "Sistem angkut material kontinu." },
          { term: "Feeder", definition: "Pengumpan material." },
          { term: "Hopper", definition: "Penampung material sementara." },
          { term: "Fleet", definition: "Kumpulan alat operasional tambang." },
          {
            term: "Fleet management system",
            definition: "Sistem manajemen armada tambang.",
          },
        ],
      },
      {
        title: "Pengolahan Mineral dan Metalurgi",
        entries: [
          { term: "Grade", definition: "Kadar mineral dalam bijih." },
          {
            term: "Cut-off grade",
            definition: "Kadar minimum yang layak ditambang.",
          },
          {
            term: "Recovery",
            definition: "Persentase mineral yang berhasil diambil.",
          },
          { term: "Screening", definition: "Pemisahan berdasarkan ukuran." },
          { term: "Crushing", definition: "Penghancuran batuan." },
          { term: "Grinding", definition: "Penghalusan material." },
          {
            term: "Flotation",
            definition: "Pemisahan mineral menggunakan gelembung udara.",
          },
          {
            term: "Leaching",
            definition: "Ekstraksi mineral menggunakan larutan.",
          },
          {
            term: "Beneficiation",
            definition: "Peningkatan kualitas mineral.",
          },
          {
            term: "Concentrate",
            definition: "Produk hasil pengayaan mineral.",
          },
          { term: "Refining", definition: "Proses pemurnian mineral." },
          { term: "Smelter", definition: "Fasilitas peleburan dan pemurnian." },
          { term: "Tailings", definition: "Sisa hasil pengolahan mineral." },
          { term: "Stockpile", definition: "Tempat penyimpanan material." },
          {
            term: "Dewatering",
            definition: "Pengeluaran air dari area tambang.",
          },
        ],
      },
      {
        title: "Operasional dan Perencanaan Tambang",
        entries: [
          { term: "Mine life", definition: "Umur operasional tambang." },
          { term: "Mine plan", definition: "Rencana penambangan." },
          {
            term: "Production",
            definition: "Kegiatan menghasilkan material tambang.",
          },
          { term: "Productivity", definition: "Tingkat produktivitas kerja." },
          { term: "Dispatch system", definition: "Sistem pengaturan armada." },
          { term: "Utilization", definition: "Tingkat penggunaan alat." },
          { term: "Availability", definition: "Tingkat kesiapan alat." },
          { term: "Downtime", definition: "Waktu alat tidak beroperasi." },
          { term: "Breakdown", definition: "Kerusakan alat." },
          {
            term: "Preventive maintenance",
            definition: "Perawatan pencegahan.",
          },
          {
            term: "Corrective maintenance",
            definition: "Perawatan setelah kerusakan.",
          },
          { term: "Pump station", definition: "Stasiun pompa tambang." },
          { term: "Sump", definition: "Kolam penampungan air tambang." },
        ],
      },
      {
        title: "Keselamatan dan Kesehatan Kerja Pertambangan",
        entries: [
          { term: "PPE", definition: "Alat Pelindung Diri." },
          {
            term: "HIRA",
            definition: "Identifikasi bahaya dan penilaian risiko.",
          },
          { term: "JSA", definition: "Analisis keselamatan pekerjaan." },
          { term: "ERP", definition: "Rencana tanggap darurat." },
          { term: "Near miss", definition: "Kejadian nyaris celaka." },
          { term: "Incident", definition: "Kejadian yang mengganggu operasi." },
          { term: "Accident", definition: "Kecelakaan kerja." },
          {
            term: "Fatality",
            definition: "Kecelakaan yang menyebabkan kematian.",
          },
          { term: "Flyrock", definition: "Batu terlempar akibat peledakan." },
          { term: "Misfire", definition: "Kegagalan peledakan." },
          {
            term: "Collision avoidance system",
            definition: "Sistem pencegah tabrakan.",
          },
          { term: "Dust suppression", definition: "Sistem pengendalian debu." },
        ],
      },
      {
        title: "Lingkungan dan Pascatambang",
        entries: [
          { term: "Sediment pond", definition: "Kolam pengendapan lumpur." },
          { term: "Reclamation", definition: "Pemulihan lahan bekas tambang." },
          { term: "Revegetation", definition: "Penanaman kembali vegetasi." },
          { term: "Closure plan", definition: "Rencana penutupan tambang." },
          { term: "Subsidence", definition: "Penurunan permukaan tanah." },
          { term: "Slope stability", definition: "Kondisi kestabilan lereng." },
          { term: "Mapping", definition: "Kegiatan pemetaan wilayah." },
          { term: "Surveying", definition: "Pengukuran dan pemetaan lahan." },
          {
            term: "Good mining practice",
            definition: "Praktik pertambangan yang baik dan berkelanjutan.",
          },
        ],
      },
    ],
    sources: [
      inventorySource,
      {
        label: "Kementerian ESDM",
        description: "Portal resmi sektor energi dan sumber daya mineral.",
        url: "https://www.esdm.go.id/",
      },
      {
        label: "Direktorat Jenderal Mineral dan Batubara",
        description: "Portal resmi Minerba.",
        url: "https://www.minerba.esdm.go.id/",
      },
      {
        label: "Society for Mining, Metallurgy & Exploration",
        description: "Referensi terminologi teknis pertambangan.",
        url: "https://www.smenet.org/",
      },
      {
        label: "International Labour Organization",
        description: "Referensi istilah keselamatan dan kesehatan kerja.",
        url: "https://www.ilo.org/global/topics/safety-and-health-at-work/lang--en/index.htm",
      },
    ],
  },
];

export const educationArticleSlugs = educationArticles.map(
  (article) => article.slug,
);

export function getEducationArticle(slug: string) {
  return educationArticles.find((article) => article.slug === slug);
}

export function getEducationArticleHref(article: EducationArticle) {
  return article.slug === educationArticles[0].slug
    ? "/education"
    : `/education/${article.slug}`;
}

export function getAdjacentEducationArticles(slug: string) {
  const index = educationArticles.findIndex((article) => article.slug === slug);

  if (index === -1) {
    return { previous: undefined, next: undefined };
  }

  return {
    previous: educationArticles[index - 1],
    next: educationArticles[index + 1],
  };
}
