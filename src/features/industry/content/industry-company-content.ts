export type IndustryTimelineEntry = {
  year: string;
  event: string;
};

export type IndustryCompanyPresentation = {
  mainOperation: string;
  primaryCommodity: string;
  operationAreaSize: string;
  primaryMetricCodes: readonly string[];
  markerColor: string;
  timeline: readonly IndustryTimelineEntry[];
};

export const industryCompanyPresentation = {
  "alamtri-resources": {
    mainOperation: "Lampunut Mine, Kalimantan Tengah",
    primaryCommodity: "Batubara metalurgi",
    operationAreaSize:
      "146.579 ha melalui lima PKP2B anak usaha PT Alamtri Minerals Indonesia Tbk di Kalimantan Tengah dan Kalimantan Timur",
    primaryMetricCodes: ["metallurgical_coal_production"],
    markerColor: "#2563eb",
    timeline: [
      {
        year: "1991",
        event:
          "Jejak operasional grup dimulai melalui pengiriman perdana Envirocoal dari tambang PT Adaro Indonesia di Kalimantan Selatan.",
      },
      { year: "2004", event: "Perusahaan didirikan sebagai PT Padang Karunia." },
      { year: "2008", event: "Saham perusahaan tercatat di Bursa Efek Indonesia dengan kode ADRO." },
      { year: "2022", event: "PT Adaro Minerals Indonesia Tbk mencatatkan sahamnya di Bursa Efek Indonesia." },
      {
        year: "2024",
        event:
          "Perusahaan menjual kepemilikan pada PT Adaro Andalan Indonesia Tbk dan berganti nama menjadi PT Alamtri Resources Indonesia Tbk, dengan fokus pada mineral, batubara metalurgi, pengolahan mineral, dan energi terbarukan.",
      },
    ],
  },
  "amman-mineral": {
    mainOperation: "Tambang Batu Hijau, Sumbawa Barat",
    primaryCommodity: "Tembaga dan emas",
    operationAreaSize:
      "Area eksplorasi 2.046 ha di Batu Hijau dan 5.972 ha di Elang hingga 2025",
    primaryMetricCodes: ["copper_production", "gold_production"],
    markerColor: "#0891b2",
    timeline: [
      { year: "1990", event: "Mineralisasi tembaga dan emas ditemukan di Pulau Sumbawa. Penemuan ini berkembang menjadi Tambang Batu Hijau dan Proyek Elang." },
      { year: "2000", event: "Batu Hijau memulai produksi komersial di bawah PT Newmont Nusa Tenggara." },
      { year: "2016", event: "Konsorsium AMMAN mengakuisisi operator dan mengubah namanya menjadi PT Amman Mineral Nusa Tenggara." },
      { year: "2023", event: "PT Amman Mineral Internasional Tbk mencatatkan saham di Bursa Efek Indonesia." },
      { year: "2024", event: "Smelter tembaga dan fasilitas logam mulia di Sumbawa diresmikan." },
      { year: "2025", event: "Smelter menghasilkan katoda tembaga pertama dan fasilitas pemurnian logam mulia menghasilkan emas murni pertama." },
    ],
  },
  antam: {
    mainOperation: "UBP Nikel Kolaka, Sulawesi Tenggara",
    primaryCommodity: "Nikel, emas, dan bauksit",
    operationAreaSize:
      "Luas wilayah dicatat per unit dan izin karena portofolio serta status izin berbeda",
    primaryMetricCodes: [
      "nickel_ore_production",
      "ferronickel_contained_nickel_production",
      "mined_gold_production",
      "bauxite_ore_production",
    ],
    markerColor: "#16a34a",
    timeline: [
      { year: "1968", event: "ANTAM dibentuk dari penggabungan beberapa perusahaan pertambangan negara." },
      { year: "1997", event: "ANTAM melaksanakan penawaran umum perdana untuk mendukung ekspansi, termasuk fasilitas feronikel." },
      { year: "2016", event: "Proyek Perluasan Pabrik Feronikel Pomalaa diselesaikan." },
      { year: "2017", event: "ANTAM menjadi bagian dari holding industri pertambangan negara." },
      { year: "2021–2025", event: "ANTAM memperkuat hilirisasi nikel, emas, dan bauksit serta berpartisipasi dalam pengembangan ekosistem baterai kendaraan listrik Indonesia." },
    ],
  },
  "bayan-resources": {
    mainOperation: "Tabang/Pakar, Kalimantan Timur",
    primaryCommodity: "Batubara termal",
    operationAreaSize:
      "107.087 ha melalui 13 IUP anak usaha di Kalimantan Timur dan Kalimantan Selatan per 31 Desember 2025",
    primaryMetricCodes: ["thermal_coal_production"],
    markerColor: "#f59e0b",
    timeline: [
      { year: "1973", event: "PT Jaya Sumpiles Indonesia didirikan dan menjadi cikal bakal kekuatan operasional grup." },
      { year: "1997", event: "Grup memasuki sektor batubara melalui akuisisi PT Gunungbayan Pratamacoal." },
      { year: "2004", event: "PT Bayan Resources didirikan untuk mengonsolidasikan pertambangan, pengolahan, penjualan, dan logistik batubara." },
      { year: "2008", event: "Saham Bayan tercatat di Bursa Efek Indonesia dengan kode BYAN." },
      { year: "2023", event: "Bayan dan PT Bayan Energy mengakuisisi PT Kariangau Power untuk memperkuat energi serta infrastruktur operasional." },
      { year: "2024", event: "Pengembangan infrastruktur Tabang dan konektivitas Muara Pahu dilanjutkan untuk meningkatkan kapasitas angkut serta efisiensi rantai pasok." },
    ],
  },
  "bukit-asam": {
    mainOperation: "Tanjung Enim, Sumatera Selatan",
    primaryCommodity: "Batubara termal",
    operationAreaSize: "43.282 ha menurut profil resmi perusahaan",
    primaryMetricCodes: ["coal_production"],
    markerColor: "#f97316",
    timeline: [
      { year: "1919", event: "Pertambangan batubara dimulai di Tambang Air Laya, Tanjung Enim, menggunakan metode tambang terbuka." },
      { year: "1950", event: "Kegiatan pertambangan dinasionalisasi dan dikelola sebagai Perusahaan Negara Tambang Arang Bukit Asam." },
      { year: "1981", event: "PT Tambang Batubara Bukit Asam (Persero) dibentuk." },
      { year: "2002", event: "PTBA melaksanakan penawaran umum perdana dan mencatatkan sahamnya di Bursa Efek Jakarta." },
      { year: "2017", event: "PTBA menjadi anggota holding pertambangan negara." },
      { year: "2022", event: "MIND ID menjadi induk langsung PTBA." },
      { year: "2024", event: "PTBA melanjutkan diversifikasi energi, energi baru terbarukan, dan penjajakan hilirisasi batubara." },
    ],
  },
  "bumi-resources": {
    mainOperation: "Sangatta dan Bengalon, Kalimantan Timur",
    primaryCommodity: "Batubara termal",
    operationAreaSize:
      "KPC sekitar 84.938 ha dan Arutmin 34.207 ha; luas dipertahankan per operator dan izin",
    primaryMetricCodes: ["kpc_arutmin_coal_production"],
    markerColor: "#dc2626",
    timeline: [
      { year: "1973", event: "Perusahaan didirikan sebagai PT Bumi Modern dan awalnya bergerak di bidang perhotelan serta pariwisata." },
      { year: "1990", event: "Perusahaan melaksanakan penawaran umum perdana di Bursa Efek Jakarta dan Bursa Efek Surabaya." },
      { year: "2000", event: "Perusahaan mengakuisisi Gallo Oil (Jersey) Ltd. dan kemudian berubah nama menjadi PT Bumi Resources Tbk." },
      { year: "2001–2003", event: "Perusahaan mengakuisisi kepentingan pada PT Kaltim Prima Coal dan PT Arutmin Indonesia." },
      { year: "2024", event: "Konversi Obligasi Wajib Konversi diselesaikan sebagai salah satu tahap terakhir restrukturisasi modal." },
    ],
  },
  "freeport-indonesia": {
    mainOperation: "Kawasan Grasberg, Papua Tengah",
    primaryCommodity: "Tembaga dan emas",
    operationAreaSize:
      "Mengikuti luas IUPK/area kerja pada sumber resmi terbaru; angka historis tidak dipakai tanpa tanggal dan jenis izin",
    primaryMetricCodes: [
      "indonesia_copper_production_100pct",
      "indonesia_gold_production_100pct",
    ],
    markerColor: "#1d4ed8",
    timeline: [
      { year: "1936", event: "Jean Jacques Dozy mencatat singkapan batuan kaya mineral di Pegunungan Papua yang kemudian dikenal sebagai Ertsberg." },
      { year: "1967", event: "PT Freeport Indonesia didirikan dan Kontrak Karya pertama ditandatangani untuk mengembangkan Ertsberg." },
      { year: "1973", event: "Proyek Ertsberg mulai beroperasi secara komersial." },
      { year: "1988", event: "Endapan tembaga-emas Grasberg ditemukan." },
      { year: "1996", event: "PT Smelting dibentuk untuk membangun fasilitas peleburan dan pemurnian tembaga di Gresik." },
      { year: "2018", event: "Divestasi menjadikan kepemilikan pihak Indonesia sebesar 51,2%." },
      { year: "2019", event: "Operasi Grasberg memasuki transisi utama dari tambang terbuka menuju tambang bawah tanah." },
      { year: "2024–2025", event: "Smelter Manyar dan fasilitas pemurnian logam mulia memasuki produksi, commissioning, dan peningkatan kapasitas menuju operasi penuh." },
    ],
  },
  "harum-energy": {
    mainOperation: "Kalimantan Timur dan IWIP, Maluku Utara",
    primaryCommodity: "Batubara termal dan nikel",
    operationAreaSize:
      "Luas wilayah dipertahankan per anak usaha dan izin; tidak menggunakan angka agregat yang belum direkonsiliasi",
    primaryMetricCodes: ["coal_production", "contained_nickel_metal_production"],
    markerColor: "#7c3aed",
    timeline: [
      { year: "1995", event: "Perusahaan didirikan dengan nama PT Asia Antrasit." },
      { year: "2007", event: "Nama perusahaan diubah menjadi PT Harum Energy." },
      { year: "2009", event: "Santan Batubara memulai operasi komersial dan perusahaan logistik PT Layar Lintas Jaya diakuisisi." },
      { year: "2010", event: "Saham Harum Energy tercatat di Bursa Efek Indonesia." },
      { year: "2020", event: "Harum memulai transformasi ke sektor nikel melalui PT Tanito Harum Nickel dan investasi pada Nickel Industries Limited." },
      { year: "2025", event: "Investasi pada tambang, smelter RKEF, dan proyek HPAL ditingkatkan sehingga portofolio batubara dan nikel semakin terintegrasi." },
    ],
  },
  "merdeka-copper-gold": {
    mainOperation: "Tujuh Bukit, Banyuwangi",
    primaryCommodity: "Emas, tembaga, dan nikel",
    operationAreaSize: "Luas wilayah dipertahankan per izin aset atau proyek",
    primaryMetricCodes: [
      "gold_production",
      "copper_production",
      "npi_contained_nickel_production",
      "matte_contained_nickel_production",
    ],
    markerColor: "#d97706",
    timeline: [
      { year: "2012", event: "Perusahaan didirikan sebagai PT Merdeka Serasi Jaya; PT Bumi Suksesindo memperoleh IUP Operasi Produksi Tujuh Bukit." },
      { year: "2014", event: "Pembangunan Tambang Emas Tujuh Bukit dimulai dan nama perusahaan berubah menjadi PT Merdeka Copper Gold." },
      { year: "2015", event: "Merdeka menjadi perusahaan terbuka dan mencatatkan saham di Bursa Efek Indonesia dengan kode MDKA." },
      { year: "2017", event: "Tujuh Bukit menghasilkan emas pertama dan kajian proyek tembaga bawah tanah dilanjutkan." },
      { year: "2019", event: "Kepemilikan Merdeka di Tambang Tembaga Wetar ditingkatkan menjadi 78%." },
      { year: "2022", event: "Bisnis diperluas ke industri nikel terintegrasi melalui portofolio pertambangan dan pengolahan nikel." },
      { year: "2025", event: "Proyek Emas Pani memulai kegiatan penambangan pertama menuju tahap operasional awal." },
    ],
  },
  timah: {
    mainOperation: "Kepulauan Bangka Belitung",
    primaryCommodity: "Timah",
    operationAreaSize:
      "Luas wilayah mengikuti IUP darat dan laut terkini per provinsi; angka agregat historis tidak digunakan tanpa tanggal acuan",
    primaryMetricCodes: [
      "tin_ore_contained_tin_production",
      "refined_tin_production",
    ],
    markerColor: "#64748b",
    timeline: [
      { year: "1953", event: "Pemerintah Indonesia menasionalisasi perusahaan-perusahaan timah Belanda." },
      { year: "1961", event: "Aset nasionalisasi dikelola melalui perusahaan negara untuk wilayah Bangka, Belitung, dan Singkep." },
      { year: "1968", event: "Perusahaan negara dan Proyek Peleburan Timah Muntok digabungkan menjadi PN Tambang Timah." },
      { year: "1976", event: "Badan usaha berubah menjadi PT Tambang Timah (Persero)." },
      { year: "1995", event: "Saham perusahaan tercatat di bursa." },
      { year: "2017", event: "TIMAH menjadi anggota holding pertambangan negara." },
      { year: "2022", event: "Top Submerged Lance Ausmelt Furnace di Muntok diresmikan untuk modernisasi peleburan." },
      { year: "2023", event: "TIMAH melanjutkan optimalisasi Ausmelt, penguatan tata kelola penambangan, dan integrasi eksplorasi hingga pemasaran." },
    ],
  },
  "trimegah-bangun-persada": {
    mainOperation: "Pulau Obi, Maluku Utara",
    primaryCommodity: "Nikel",
    operationAreaSize:
      "Pulau Obi, Halmahera Selatan; luas wilayah dipertahankan per IUP dan anak usaha",
    primaryMetricCodes: [
      "saprolite_ore_production",
      "limonite_ore_production",
      "ferronickel_contained_nickel_production",
    ],
    markerColor: "#059669",
    timeline: [
      { year: "2004", event: "PT Trimegah Bangun Persada didirikan pada 6 September 2004." },
      { year: "2007", event: "Perusahaan menjadi bagian dari pengembangan bisnis pertambangan Harita Group." },
      { year: "2010", event: "Produksi bijih nikel dimulai di Pulau Obi." },
      { year: "2016", event: "Fasilitas RKEF mulai beroperasi." },
      { year: "2021", event: "Fasilitas HPAL mulai berproduksi komersial." },
      { year: "2023", event: "Saham perusahaan tercatat di Bursa Efek Indonesia dengan kode NCKL dan produk hilir dikembangkan hingga nikel sulfat serta kobalt sulfat." },
      { year: "2024", event: "Kapasitas RKEF dan HPAL ditingkatkan serta rantai industri dari bijih hingga produk olahan diperluas." },
    ],
  },
  "vale-indonesia": {
    mainOperation: "Sorowako, Sulawesi Selatan",
    primaryCommodity: "Nikel",
    operationAreaSize:
      "Mengikuti luas IUPK Blok Sorowako, Pomalaa, dan Bahodopi pada laporan terbaru",
    primaryMetricCodes: ["nickel_matte_contained_nickel_production"],
    markerColor: "#0f766e",
    timeline: [
      { year: "1968", event: "PT International Nickel Indonesia didirikan dan menandatangani Kontrak Karya dengan Pemerintah Indonesia." },
      { year: "1978", event: "Produksi komersial nikel dalam matte dimulai." },
      { year: "1990", event: "Sebanyak 20% saham perusahaan dilepas kepada publik dan tercatat di Bursa Efek Jakarta." },
      { year: "2011", event: "PLTA Karebbe mulai beroperasi, melengkapi sistem pembangkit listrik tenaga air perusahaan." },
      { year: "2012", event: "Nama perusahaan diubah menjadi PT Vale Indonesia Tbk." },
      { year: "2023", event: "Pengembangan proyek Bahodopi dan Pomalaa dilanjutkan melalui kemitraan strategis." },
      { year: "2024", event: "MIND ID menyelesaikan akuisisi dan menjadi pemegang saham terbesar dengan kepemilikan 34%." },
      { year: "2025", event: "Portofolio diperluas dari nikel matte menuju bijih saprolit, limonit, dan pengembangan Mixed Hydroxide Precipitate." },
    ],
  },
} as const satisfies Record<string, IndustryCompanyPresentation>;

export type IndustryConfiguredCompanySlug =
  keyof typeof industryCompanyPresentation;

export function getIndustryCompanyPresentation(
  slug: string,
): IndustryCompanyPresentation | null {
  return slug in industryCompanyPresentation
    ? industryCompanyPresentation[slug as IndustryConfiguredCompanySlug]
    : null;
}

export const industryCompanySlugs = Object.keys(
  industryCompanyPresentation,
) as IndustryConfiguredCompanySlug[];
