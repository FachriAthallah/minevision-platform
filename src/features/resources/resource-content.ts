import { publicRoutes } from "@/config/site";
import type { ResourceSection } from "./resource-page";

export const resourceUpdatedAt = "14 September 2026";
export const developerProfile = {
  name: "Muhammad Fachri Athallah Sofyan",
  role: "Pengembang MineVision",
  phone: {
    label: "+62 895-4039-68513",
    href: "tel:+62895403968513",
  },
  socialLinks: [
    {
      id: "github",
      label: "GitHub",
      value: "FachriAthallah",
      href: "https://github.com/FachriAthallah",
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      value: "muhammad-fachri-114a11314",
      href: "https://www.linkedin.com/in/muhammad-fachri-114a11314/",
    },
    {
      id: "instagram",
      label: "Instagram",
      value: "@fchrathallah",
      href: "https://www.instagram.com/fchrathallah?stkn=MWJibzRkcnczaTZzYQ==",
    },
  ],
} as const;
export const aboutSections: ResourceSection[] = [
  { title: "Apa itu MineVision", paragraphs: ["MineVision adalah platform informasi pertambangan Indonesia yang menghubungkan materi edukasi, profil industri dan komoditas, informasi karier, data intelligence, serta indikator ekonomi dalam pengalaman publik yang terpadu.", "Platform ini ditujukan untuk pelajar, mahasiswa, pencari kerja, profesional, peneliti, dan masyarakat. MineVision bukan situs resmi pemerintah dan tidak menggantikan publikasi instansi sumber."] },
  { title: "Modul platform", bullets: ["Education: materi dasar, metode, keselamatan, alat, dan istilah pertambangan.", "Industry: profil perusahaan, laporan publik, dan wilayah operasi terverifikasi.", "Commodity: profil komoditas, statistik, lokasi produksi, dan produsen terkait.", "Career: kategori profesi, kompetensi, pendidikan, perangkat lunak, dan pelatihan.", "Intelligence: seri produksi, harga domestik, serta coverage wilayah kanonik.", "Economy: PDB, ekspor, investasi, hilirisasi, dan regulasi terkurasi.", "Global Search: pencarian lintas modul atas informasi yang layak tampil publik.", "MineBot: entry point bantuan yang masih disiapkan dan belum memberikan jawaban AI."] },
  { title: "Prinsip sumber", paragraphs: ["Data kuantitatif dan profil publik disajikan bersama sumber yang dapat ditelusuri. Hanya record yang memenuhi status verifikasi dan publikasi masing-masing modul yang digunakan pada pengalaman publik."], links: [{ label: "Baca metodologi data", href: publicRoutes.methodology }, { label: "Jelajahi daftar sumber", href: publicRoutes.sources }] },
  { id: "minebot", title: "Tentang MineBot", paragraphs: ["MineBot dirancang sebagai pintu bantuan untuk memahami konteks halaman MineVision. Sistem AI dan pemrosesan percakapannya belum diaktifkan; tombol MineBot mengarah ke penjelasan ini agar tidak memberi kesan seolah jawaban AI sudah tersedia."] },
];
export const methodologySections: ResourceSection[] = [
  { title: "Sumber dan kurasi", paragraphs: ["MineVision memprioritaskan publikasi BPS, Kementerian ESDM, Ditjen Minerba, Badan Geologi, JDIH, kementerian terkait, laporan resmi perusahaan, serta sumber akademik relevan. Definisi, periode, satuan, cakupan, dan bentuk produk diperiksa sebelum data dipakai."] },
  { title: "Status verifikasi", bullets: ["pending: bukti atau pemeriksaan belum lengkap.", "verified: sumber dan makna record telah diperiksa.", "rejected: record ditolak karena tidak memenuhi kontrak."] },
  { title: "Status publikasi", bullets: ["draft: disiapkan tetapi belum ditampilkan kepada publik.", "in_review: sedang ditinjau.", "published: dapat ditampilkan jika syarat verifikasinya terpenuhi.", "archived: dipertahankan sebagai histori tetapi bukan data publik aktif."] },
  { title: "Jenis record", bullets: ["actual: realisasi yang dilaporkan.", "provisional: angka sementara.", "projection: proyeksi yang dinyatakan eksplisit.", "revised: revisi atas publikasi sebelumnya."] },
  { title: "HOLD, nilai kosong, dan periode", paragraphs: ["HOLD adalah keputusan pipeline untuk menahan record yang belum cukup aman dipublikasikan. Tahun data menjelaskan periode observasi, sedangkan tanggal publikasi menjelaskan kapan sumber diterbitkan.", "Nilai kosong atau tidak dilaporkan tidak diganti nol. Nol hanya digunakan jika sumber secara eksplisit melaporkannya."] },
  { title: "Legacy, canonical, dan koreksi", paragraphs: ["Dataset legacy dipertahankan untuk histori dan audit. Seri canonical mempunyai identitas, metodologi, dan public-default eksplisit agar seri berbeda tidak tercampur. Koreksi memakai expected-state dan fingerprint agar record published tidak ditimpa diam-diam."] },
  { title: "Kebijakan publik", paragraphs: ["Pengalaman publik hanya membaca data verified/published dan relasi sumber yang layak. Tautan sumber membuka publikasi asli. Metodologi ini mengurangi risiko salah tafsir, tetapi setiap publikasi eksternal tetap dapat direvisi oleh penerbitnya."] },
];
export const privacySections: ResourceSection[] = [
  { title: "Data akun dan sesi", paragraphs: ["MineVision memproses informasi akun dan sesi ketika pengguna memilih masuk. Sesi menjaga status autentikasi dan menyediakan halaman akun; fitur publik tetap dapat digunakan tanpa login."] },
  { title: "Pencarian dan penggunaan", paragraphs: ["Global Search memproses kata kunci melalui parameter URL untuk menghasilkan hasil publik. Repository saat ini tidak mendefinisikan pengumpulan analytics khusus. Infrastruktur hosting dapat menghasilkan log teknis dasar sesuai kebijakan penyedianya."] },
  { title: "Cookie dan keamanan", paragraphs: ["Cookie autentikasi dapat digunakan untuk mempertahankan sesi. MineVision tidak mengirim credential database ke client dan mengandalkan kontrol akses database untuk data terbatas."] },
  { title: "MineBot dan tautan eksternal", paragraphs: ["MineBot belum memproses percakapan pada pengalaman publik ini. Tautan eksternal membawa pengguna ke situs pihak lain dengan kebijakan privasinya sendiri."] },
  { title: "Retensi dan hak pengguna", paragraphs: ["Data akun mengikuti kebutuhan layanan autentikasi dan infrastruktur yang digunakan. Pengguna dapat keluar untuk mengakhiri sesi aktif."], links: [{ label: "Buka halaman Kontak", href: publicRoutes.contact }] },
];
export const termsSections: ResourceSection[] = [
  { title: "Tujuan informasi", paragraphs: ["MineVision menyediakan informasi edukatif dan referensi data pertambangan. Konten bukan nasihat investasi, hukum, keselamatan kerja, desain teknis, atau keputusan operasional."] },
  { title: "Penggunaan data", paragraphs: ["Pengguna bertanggung jawab memeriksa publikasi resmi, definisi, satuan, periode, dan status revisi. Data tidak tersedia tidak boleh ditafsirkan sebagai nol."] },
  { title: "Hak cipta dan sumber", paragraphs: ["Hak atas publikasi sumber tetap berada pada pemiliknya. MineVision menampilkan atribusi dan tautan penelusuran, bukan memindahkan kepemilikan publikasi."] },
  { title: "Batas tanggung jawab", paragraphs: ["Informasi dapat berubah ketika instansi sumber menerbitkan pembaruan. MineVision tidak menjamin kesesuaian data untuk keputusan tertentu."] },
  { title: "Layanan, tautan eksternal, dan MineBot", paragraphs: ["Fitur dan cakupan layanan dapat berubah. Tautan eksternal dikelola pihak ketiga. MineBot belum menyediakan jawaban AI; ketika diaktifkan kelak, jawabannya tetap harus diperiksa terhadap sumber asli."] },
];
export const contactSections: ResourceSection[] = [
  { title: "Tentang kanal kontak", paragraphs: ["Informasi kontak pengembang tersedia untuk komunikasi mengenai proyek MineVision. Halaman ini tidak memakai formulir pengiriman atau meminta data pribadi pengunjung."] },
  { title: "Pertanyaan data", paragraphs: ["Untuk memeriksa data, mulai dari katalog sumber dan buka publikasi resmi terkait. MineVision bukan kanal layanan BPS, Kementerian ESDM, maupun instansi pemerintah lain."], links: [{ label: "Lihat daftar sumber", href: publicRoutes.sources }] },
];
export const faqSections: ResourceSection[] = [
  { title: "Data apa yang tampil ke publik?", paragraphs: ["Data database hanya tampil jika verified dan published. Record draft, pending, rejected, archived, dan HOLD tidak dipakai sebagai fallback."] },
  { title: "Mengapa beberapa tahun kosong?", paragraphs: ["Tahun kosong berarti observation sebanding belum tersedia atau belum layak publik. MineVision tidak mengubah missing value menjadi nol."] },
  { title: "Apakah MineVision situs pemerintah?", paragraphs: ["Bukan. MineVision adalah platform informasi yang merujuk sumber resmi dan mendorong pengguna membuka publikasi aslinya."] },
  { title: "Apakah MineBot sudah aktif?", paragraphs: ["Belum. Entry point MineBot saat ini membuka informasi tentang cakupan fitur yang direncanakan."] },
];
