import { ConsumerDifficulty, ConsumerType, Scenario } from "./types";

export const DEFAULT_CONSUMER_TYPES: ConsumerType[] = [
  {
    id: "t1",
    name: "Kooperatif",
    description: "Gaya bicara santai, to the point, dan langsung memberikan data yang diminta. Cenderung sabar.",
    difficulty: ConsumerDifficulty.Easy
  },
  {
    id: "t2",
    name: "Ngeyel tapi Patuh",
    description: "Gaya bicara menggunakan tanda seru, merasa masalah ini sangat darurat, menuntut penyelesaian saat ini juga. Awalnya menolak prosedur standar tapi akhirnya menurut.",
    difficulty: ConsumerDifficulty.Medium
  },
  {
    id: "t3",
    name: "Gaptek (Gagap Teknologi)",
    description: "Bingung dengan istilah teknis (seperti 'cache', 'OTP', 'reinstall'). Membutuhkan panduan langkah demi langkah yang sangat pelan.",
    difficulty: ConsumerDifficulty.Hard
  },
  {
    id: "t4",
    name: "Tidak Responsif",
    description: "Konsumen tidak membalas chat agent ditengah percakapan walaupun berapa kali disapa atau membalas dengan sangat singkat/tidak nyambung.",
    difficulty: ConsumerDifficulty.Hard
  }
];

export const DEFAULT_SCENARIOS: Scenario[] = [
  {
    id: "s1",
    category: "Masalah Teknis",
    title: "Masalah Teknis Aplikasi",
    description: "Konsumen mengeluh tidak bisa login ke aplikasi mobile banking, padahal password sudah benar. Pesan error yang muncul adalah 'Koneksi Terputus'.",
    isActive: true,
    consumerTypeId: "random"
  },
  {
    id: "s2",
    category: "Masalah Transaksi",
    title: "Masalah Transaksi Gagal",
    description: "Konsumen melakukan transfer uang atau pembayaran tagihan melaui mobile banking, saldo sudah terpotong, tetapi status transaksi masih 'Menunggu' atau penerima belum menerima dana. Sudah mencoba melaporkan ke bank tapi tetap ingin membuat laporan juga kepada OJK.",
    isActive: true,
    consumerTypeId: "random"
  },
  {
    id: "s3",
    category: "Pengaduan Perilaku",
    title: "Masalah Perilaku Petugas Penagihan",
    description: "Konsumen ingin melaporkan petugas penagih yang mengancam dan menggunakan kata kata kasar serta menghubungi orang yang bukan kontak darurat.",
    isActive: true,
    consumerTypeId: "random"
  },
  {
    id: "s4",
    category: "Keringanan Kredit",
    title: "Masalah Ingin Mengajukan Restrukturisasi",
    description: "Konsumen melakukan pinjaman pada bank namun tidak bisa melunasinya sehingga ingin mengajukan keringanan/penundaan pembayaran.",
    isActive: true,
    consumerTypeId: "random"
  },
  {
    id: "s5",
    category: "Pinjaman Online",
    title: "Masalah Pinjol Ilegal",
    description: "Konsumen menerima pencairan dana dari pinjaman online yang ternyata ilegal. Sehingga ingin mengetahui cara penyelesaiannya.",
    isActive: true,
    consumerTypeId: "random"
  }
];

export const DUMMY_NAMES = [
  "Budi Santoso", "Siti Aminah", "Agus Setiawan", "Dewi Lestari", "Rina Marlina",
  "Eko Prasetyo", "Sri Wahyuni", "Indra Wijaya", "Maya Sari", "Rudi Hartono"
];

export const DUMMY_CITIES = [
  "Jakarta Selatan", "Surabaya", "Bandung", "Medan", "Semarang",
  "Makassar", "Palembang", "Denpasar", "Yogyakarta", "Balikpapan"
];

export const TEMPLATE_GREETING = `Anda telah terhubung dengan Layanan Kontak OJK 157. 
Selamat Pagi/Siang/Sore. 
Saya XXX dengan senang hati memberikan informasi yang Bapak/Ibu XXX butuhkan seputar Sektor Jasa Keuangan. Perihal apa yang dapat kami bantu?`;
