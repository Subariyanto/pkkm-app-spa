// instrumen.js - Master data PKKM (Penilaian Kinerja Kepala Madrasah)
// Sumber referensi: KMA & juknis PKKM Pokjawas (default; override via menu Instrumen)
// Struktur: 5 komponen utama, masing-masing punya aspek (skor 1-4)
// Skor: 1 = Kurang, 2 = Cukup, 3 = Baik, 4 = Amat Baik
// Bobot komponen default: 20% × 5 (rata, total 100). Bobot dapat di-edit di menu Pengaturan.

window.PKKM_VERSION = '1.0.0';

window.PKKM_KOMPONEN = [
  {
    no: 1,
    code: 'PM',
    label: 'Pengembangan Madrasah',
    bobot_default: 20,
    deskripsi: 'Visi-misi, RKM/RKAM, program kerja, evaluasi & tindak lanjut.',
    aspek: [
      { no: 1, judul: 'Visi, Misi, dan Tujuan Madrasah', deskripsi: 'Kepala madrasah memiliki dan mensosialisasikan visi, misi, dan tujuan madrasah yang jelas, terukur, dan berorientasi mutu.' },
      { no: 2, judul: 'Rencana Kerja Madrasah (RKM/RKJM)', deskripsi: 'Menyusun RKJM 4 tahunan & RKT/RKAM 1 tahunan berbasis EDM/Rapor Pendidikan.' },
      { no: 3, judul: 'Program Kerja Tahunan', deskripsi: 'Menyusun program kerja tahunan yang relevan dengan RKM dan dapat dilaksanakan.' },
      { no: 4, judul: 'Evaluasi Diri Madrasah (EDM)', deskripsi: 'Melakukan EDM secara berkala dan menggunakannya sebagai dasar perbaikan.' },
      { no: 5, judul: 'Tindak Lanjut Hasil Evaluasi', deskripsi: 'Menindaklanjuti hasil evaluasi (EDM, akreditasi, audit) menjadi program perbaikan.' },
      { no: 6, judul: 'Pengembangan Budaya Madrasah', deskripsi: 'Membangun budaya religius, disiplin, kolaboratif, dan berbasis cinta.' },
    ],
  },
  {
    no: 2,
    code: 'MJ',
    label: 'Pelaksanaan Tugas Manajerial',
    bobot_default: 20,
    deskripsi: 'Kepemimpinan, kelola SDM, kurikulum, sarpras, keuangan, humas, sistem informasi.',
    aspek: [
      { no: 1, judul: 'Kepemimpinan Pembelajaran', deskripsi: 'Mengarahkan dan menggerakkan guru untuk meningkatkan mutu pembelajaran.' },
      { no: 2, judul: 'Pengelolaan Kurikulum', deskripsi: 'Mengelola implementasi kurikulum (Kurikulum Merdeka/K13) sesuai jenjang.' },
      { no: 3, judul: 'Pengelolaan Tenaga Pendidik & Kependidikan', deskripsi: 'Pembagian tugas, pembinaan, pengembangan profesi guru/tendik.' },
      { no: 4, judul: 'Pengelolaan Peserta Didik', deskripsi: 'PPDB, pembinaan kesiswaan, layanan BK, ekstrakurikuler.' },
      { no: 5, judul: 'Pengelolaan Sarana & Prasarana', deskripsi: 'Pemenuhan, pemeliharaan, pemanfaatan sarpras pembelajaran.' },
      { no: 6, judul: 'Pengelolaan Keuangan & Pembiayaan', deskripsi: 'Penyusunan RKAM/RAPBM, pelaksanaan, pelaporan, transparansi.' },
      { no: 7, judul: 'Pengelolaan Hubungan Masyarakat', deskripsi: 'Kerja sama dengan komite, orang tua, pemangku kepentingan.' },
      { no: 8, judul: 'Pengelolaan Sistem Informasi Manajemen', deskripsi: 'Pemanfaatan EMIS, RDM, SIM madrasah, dan teknologi pendukung.' },
    ],
  },
  {
    no: 3,
    code: 'KW',
    label: 'Pengembangan Kewirausahaan',
    bobot_default: 20,
    deskripsi: 'Inovasi, kerja sama, unit usaha, kemandirian madrasah.',
    aspek: [
      { no: 1, judul: 'Inovasi Layanan Madrasah', deskripsi: 'Memunculkan inovasi pembelajaran, layanan, atau produk khas madrasah.' },
      { no: 2, judul: 'Kerja Sama dengan Pihak Lain', deskripsi: 'Membangun kemitraan dengan dunia usaha, kampus, lembaga sosial.' },
      { no: 3, judul: 'Pengembangan Unit Usaha / Income Generating', deskripsi: 'Mengembangkan unit usaha (koperasi, BLUD, kantin sehat, dsb).' },
      { no: 4, judul: 'Etos Kerja & Pantang Menyerah', deskripsi: 'Menunjukkan etos kerja tinggi dan menularkannya kepada warga madrasah.' },
      { no: 5, judul: 'Kepekaan terhadap Peluang', deskripsi: 'Memanfaatkan peluang (program pemerintah, hibah, beasiswa, lomba).' },
    ],
  },
  {
    no: 4,
    code: 'SP',
    label: 'Supervisi Guru & Tenaga Kependidikan',
    bobot_default: 20,
    deskripsi: 'Perencanaan, pelaksanaan, evaluasi, dan tindak lanjut supervisi.',
    aspek: [
      { no: 1, judul: 'Perencanaan Supervisi', deskripsi: 'Menyusun program/jadwal supervisi guru & tendik.' },
      { no: 2, judul: 'Pelaksanaan Supervisi Akademik', deskripsi: 'Melaksanakan supervisi pembelajaran (kunjungan kelas, observasi, klinis).' },
      { no: 3, judul: 'Pelaksanaan Supervisi Manajerial Tendik', deskripsi: 'Supervisi terhadap TU, pustakawan, laboran, dan tendik lain.' },
      { no: 4, judul: 'Evaluasi Hasil Supervisi', deskripsi: 'Menganalisis hasil supervisi dan menyusun rekomendasi.' },
      { no: 5, judul: 'Tindak Lanjut Supervisi', deskripsi: 'Pembinaan, mentoring, pelatihan, atau pengembangan profesi berkelanjutan.' },
    ],
  },
  {
    no: 5,
    code: 'HK',
    label: 'Hasil Kinerja Kepala Madrasah',
    bobot_default: 20,
    deskripsi: 'Capaian akreditasi, prestasi, kepuasan stakeholder, peningkatan mutu.',
    aspek: [
      { no: 1, judul: 'Status Akreditasi Madrasah', deskripsi: 'Status akreditasi terkini (A/B/C/Belum) dan upaya peningkatan.' },
      { no: 2, judul: 'Capaian Mutu Pembelajaran', deskripsi: 'Rata-rata nilai PKG guru, hasil AKMI/AM, peringkat madrasah.' },
      { no: 3, judul: 'Prestasi Akademik & Non-akademik', deskripsi: 'Prestasi siswa/guru tingkat kabupaten/provinsi/nasional dalam 1 periode.' },
      { no: 4, judul: 'Kepuasan Stakeholder', deskripsi: 'Indeks kepuasan guru, siswa, orang tua, komite madrasah.' },
      { no: 5, judul: 'Peningkatan Jumlah Peserta Didik', deskripsi: 'Tren PPDB, retensi, dan minat masyarakat terhadap madrasah.' },
      { no: 6, judul: 'Tugas Tambahan (Ketua KKM, dll)', deskripsi: 'Pelaksanaan tugas tambahan di luar kepala madrasah, jika ada.' },
    ],
  },
];

// Sebutan / kategori berdasarkan nilai akhir (skala 0-100)
window.PKKM_SEBUTAN = [
  { min: 90.01, max: 100,   label: 'Amat Baik', cssClass: 'sebutan-amat-baik' },
  { min: 75.01, max: 90,    label: 'Baik',      cssClass: 'sebutan-baik' },
  { min: 60.01, max: 75,    label: 'Cukup',     cssClass: 'sebutan-cukup' },
  { min: 50.01, max: 60,    label: 'Sedang',    cssClass: 'sebutan-sedang' },
  { min: 0,     max: 50,    label: 'Kurang',    cssClass: 'sebutan-kurang' },
];

window.getPKKMSebutan = function(nilai) {
  if (nilai == null || isNaN(nilai)) return null;
  for (const s of window.PKKM_SEBUTAN) {
    if (nilai > s.min - 0.001 && nilai <= s.max + 0.001) return s;
  }
  return null;
};

// Helper: total aspek di seluruh komponen (untuk hitung progress)
window.PKKM_TOTAL_ASPEK = window.PKKM_KOMPONEN.reduce((a, k) => a + k.aspek.length, 0);

// Helper: build flat list of all aspek with composite id
window.flattenAspek = function() {
  const out = [];
  for (const k of window.PKKM_KOMPONEN) {
    for (const a of k.aspek) {
      out.push({
        id: `${k.code}_${a.no}`,
        komponen_code: k.code,
        komponen_no: k.no,
        komponen_label: k.label,
        aspek_no: a.no,
        aspek_judul: a.judul,
        aspek_deskripsi: a.deskripsi,
      });
    }
  }
  return out;
};

window.PKKM_JENJANG = ['MI', 'MTs', 'MA', 'RA'];

window.PKKM_PERIODE_TYPES = [
  { code: 'formatif', label: 'Formatif (Awal Tahun)' },
  { code: 'sumatif',  label: 'Sumatif (Akhir Tahun)' },
];
