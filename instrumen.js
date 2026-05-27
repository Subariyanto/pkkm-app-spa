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

// =================================================================
// Catatan Penggalian Data per indikator (aspek)
// =================================================================
// Panduan praktis untuk pengawas saat menilai tiap aspek:
//   - dokumen   : bukti tertulis yang diminta
//   - observasi : hal yang diamati langsung di lapangan
//   - wawancara : narasumber & pertanyaan kunci
// Bisa di-edit operator/pokjawas; kalau aspek belum punya entri,
// modal popup akan menampilkan pesan default.
// -----------------------------------------------------------------
window.PKKM_PENGGALIAN = {
  // ----- PM: Pengembangan Madrasah -----
  'PM_1': {
    dokumen: [
      'Dokumen Visi, Misi, Tujuan Madrasah (cetakan, banner, papan)',
      'SK Tim Perumusan Visi-Misi & notulen penyusunannya',
      'Bukti sosialisasi: notulen rapat, foto, postingan website/medsos',
      'Konsistensi visi-misi pada KOSP/KTSP, RKM, dan profil madrasah',
    ],
    observasi: [
      'Banner/papan visi-misi terpasang di lokasi strategis (lobby, kantor, kelas)',
      'Konsistensi tagline & branding madrasah dengan visi-misi',
    ],
    wawancara: [
      'Kepala madrasah: proses penyusunan, pelibatan stakeholder, mekanisme review',
      'Guru/tendik: pemahaman & penghayatan visi-misi',
      'Komite/wali (sampling): tahu visi-misi dan arah madrasah',
    ],
  },
  'PM_2': {
    dokumen: [
      'RKJM 4 tahunan yang masih berlaku (dijilid, disahkan)',
      'RKT/RKAM tahun berjalan',
      'Hasil EDM / Rapor Pendidikan sebagai dasar penyusunan',
      'Notulen rapat penyusunan & berita acara komite',
      'SK Tim Penyusun RKM',
    ],
    observasi: [
      'Periode RKJM masih aktif (tidak kedaluwarsa)',
      'Tanda tangan kepala, ketua komite, dan pengawas pada dokumen',
    ],
    wawancara: [
      'Kepala/wakil: tahapan penyusunan & sumber data yang digunakan',
      'Komite: keterlibatan dalam pembahasan & persetujuan',
    ],
  },
  'PM_3': {
    dokumen: [
      'Dokumen program kerja tahunan',
      'Time-schedule / kalender kegiatan (bulanan/triwulanan)',
      'Laporan pelaksanaan program (triwulan / semester)',
    ],
    observasi: [
      'Relevansi program tahunan dengan RKM',
      'Bukti pelaksanaan kegiatan (foto, daftar hadir, laporan)',
    ],
    wawancara: [
      'Wakil kepala: progres pelaksanaan & kendala',
      'Bendahara: dukungan anggaran untuk program',
    ],
  },
  'PM_4': {
    dokumen: [
      'Instrumen EDM yang sudah diisi (mengacu 8 SNP)',
      'Laporan EDM tahunan + lampiran bukti',
      'SK Tim EDM',
      'Rapor Pendidikan terbaru dari Kemendikbud/Kemenag',
    ],
    observasi: [
      'Periodisitas pengisian (minimal 1x setahun)',
      'Kelengkapan bukti dukung tiap indikator EDM',
    ],
    wawancara: [
      'Tim EDM: metode pengumpulan data & validasi',
      'Kepala: pemanfaatan hasil EDM dalam perencanaan',
    ],
  },
  'PM_5': {
    dokumen: [
      'Matriks rekomendasi → tindakan (action plan)',
      'Laporan akreditasi terakhir + tindak lanjutnya',
      'Hasil audit BOS/internal beserta respons',
      'Bukti perbaikan: foto, dokumen, laporan kegiatan',
    ],
    observasi: [
      'Konsistensi tindak lanjut dengan rekomendasi tertulis',
      'Prioritas tindak lanjut tercermin di program kerja',
    ],
    wawancara: [
      'Kepala: prioritas tindak lanjut & dasar pemilihannya',
      'Wakil/guru: rekomendasi yang ditindaklanjuti & dampaknya',
    ],
  },
  'PM_6': {
    dokumen: [
      'Tata tertib madrasah (siswa, guru, tendik)',
      'Jadwal kegiatan religius (sholat dhuha, tadarus, kultum)',
      'Program 5S / budaya disiplin',
      'Dokumentasi PHBI, peringatan hari besar, kegiatan kebersamaan',
    ],
    observasi: [
      'Pelaksanaan sholat berjamaah / tadarus harian',
      'Kerapian, kebersihan, dan disiplin warga madrasah',
      'Interaksi guru-siswa berbasis cinta (tidak otoriter, ramah anak)',
    ],
    wawancara: [
      'Siswa: budaya yang paling terasa di madrasah',
      'Guru: contoh / keteladanan kepala dalam membentuk budaya',
    ],
  },

  // ----- MJ: Pelaksanaan Tugas Manajerial -----
  'MJ_1': {
    dokumen: [
      'Notulen rapat KKG/MGMP/KKMI yang dipimpin/diinisiasi kepala',
      'Jurnal coaching/pendampingan guru',
      'Program peningkatan mutu pembelajaran',
      'Hasil supervisi pembelajaran sebagai dasar pembinaan',
    ],
    observasi: [
      'Keterlibatan kepala dalam kegiatan akademik (rapat, lesson study)',
      'Suasana akademik (diskusi pedagogis, budaya riset)',
    ],
    wawancara: [
      'Guru: bentuk dukungan kepala dalam pembelajaran',
      'Wakil kurikulum: arah pengembangan mutu pembelajaran',
    ],
  },
  'MJ_2': {
    dokumen: [
      'KOSP/KTSP yang berlaku & disahkan',
      'SK Tim Pengembang Kurikulum (TPK)',
      'Analisis CP/KD/ATP per mapel',
      'Modul ajar / RPP guru',
      'Kalender akademik tahun berjalan',
    ],
    observasi: [
      'Implementasi Kurikulum Merdeka (atau K13) sesuai jenjang',
      'Penyesuaian kurikulum dengan konteks madrasah (muatan keagamaan)',
    ],
    wawancara: [
      'Wakil kurikulum: tantangan implementasi & strategi',
      'Guru: dukungan pengembangan modul ajar & asesmen',
    ],
  },
  'MJ_3': {
    dokumen: [
      'SK pembagian tugas mengajar / tugas tendik',
      'Daftar PKB guru tahunan',
      'Buku pembinaan guru/tendik',
      'Daftar guru bersertifikat & non-sertifikasi',
      'Program pengembangan kompetensi (workshop, MGMP, diklat)',
    ],
    observasi: [
      'Rasio guru-siswa & linieritas mapel',
      'Kehadiran & disiplin guru/tendik',
    ],
    wawancara: [
      'Guru: kesempatan pengembangan profesi yang difasilitasi kepala',
      'TU: pembinaan & pengembangan tendik dari kepala',
    ],
  },
  'MJ_4': {
    dokumen: [
      'Laporan PPDB tahunan',
      'Program pembinaan kesiswaan (OSIS/IPNU-IPPNU)',
      'Jadwal & laporan ekstrakurikuler',
      'Layanan BK (catatan kasus, konseling, home visit)',
      'Buku tata tertib siswa & buku poin',
    ],
    observasi: [
      'Kegiatan ekstrakurikuler aktif berjalan',
      'Suasana kelas & lingkungan ramah anak',
    ],
    wawancara: [
      'Wakil kesiswaan: program unggulan kesiswaan',
      'Siswa: layanan BK & pembinaan minat-bakat',
    ],
  },
  'MJ_5': {
    dokumen: [
      'Inventaris/aset BMN atau aset yayasan',
      'SOP pemeliharaan sarpras',
      'Laporan kerusakan & perbaikan',
      'Rencana pengadaan tahunan',
      'Sertifikat tanah / IMB (untuk swasta)',
    ],
    observasi: [
      'Kondisi ruang kelas, lab, perpustakaan, MCK, mushola',
      'Kelayakan & kebersihan sarpras',
      'Pemanfaatan sarpras sesuai fungsi',
    ],
    wawancara: [
      'Wakil sarpras: skala prioritas pemenuhan',
      'Guru: kelayakan sarpras pendukung pembelajaran',
    ],
  },
  'MJ_6': {
    dokumen: [
      'RKAM/RAPBM tahun berjalan',
      'Laporan BOS triwulanan',
      'Buku kas umum & buku bantu',
      'Bukti transparansi: papan informasi, notulen rapat komite',
      'Laporan audit internal/eksternal',
    ],
    observasi: [
      'Papan transparansi keuangan terpasang & terkini',
      'Pemisahan rekening BOS dan non-BOS',
    ],
    wawancara: [
      'Bendahara: alur pencairan & pelaporan',
      'Komite: keterlibatan dalam pengawasan keuangan',
    ],
  },
  'MJ_7': {
    dokumen: [
      'Notulen rapat komite & wali murid',
      'MoU dengan mitra (DUDI, kampus, instansi)',
      'Buku tamu kunjungan stakeholder',
      'Konten media sosial / website madrasah',
      'Program parenting / edukasi orang tua',
    ],
    observasi: [
      'Aktivitas humas (papan pengumuman, banner, medsos aktif)',
      'Hubungan dengan komite (rapat reguler & responsif)',
    ],
    wawancara: [
      'Komite: keterbukaan komunikasi kepala',
      'Mitra eksternal: kontinuitas kerja sama',
    ],
  },
  'MJ_8': {
    dokumen: [
      'Status sinkronisasi EMIS (cek tanggal terakhir)',
      'Penggunaan RDM / Rapor Digital',
      'Aplikasi internal: presensi, penilaian, keuangan',
      'SOP pengelolaan data madrasah',
    ],
    observasi: [
      'Operator EMIS aktif & terlatih',
      'Pemanfaatan teknologi dalam KBM (LMS, papan digital, proyektor)',
    ],
    wawancara: [
      'Operator: kendala sinkronisasi data',
      'Guru: literasi digital & dukungan kepala',
    ],
  },

  // ----- KW: Pengembangan Kewirausahaan -----
  'KW_1': {
    dokumen: [
      'Daftar program/layanan inovatif (kelas riset, tahfidz, kelas digital, dsb)',
      'SK program inovasi',
      'Dokumentasi pelaksanaan inovasi',
      'Liputan media (jika ada)',
    ],
    observasi: [
      'Program inovasi berjalan rutin (tidak hanya di atas kertas)',
      'Daya tarik inovasi bagi calon peserta didik',
    ],
    wawancara: [
      'Kepala: latar belakang & target inovasi',
      'Guru/siswa: dampak inovasi terhadap pembelajaran',
    ],
  },
  'KW_2': {
    dokumen: [
      'MoU/PKS dengan mitra (DUDI, kampus, lembaga sosial)',
      'Laporan kegiatan kerja sama',
      'Daftar narasumber eksternal',
      'Bukti penyaluran lulusan / kerja sama dunia kerja (untuk MA)',
    ],
    observasi: [
      'Frekuensi kegiatan bersama mitra',
      'Variasi mitra (pendidikan, sosial, ekonomi, pemerintah)',
    ],
    wawancara: [
      'Kepala/humas: strategi membangun jejaring',
      'Mitra: pengalaman & kontinuitas kerja sama',
    ],
  },
  'KW_3': {
    dokumen: [
      'Profil unit usaha (koperasi, kantin sehat, BLUD, agrobisnis, dsb)',
      'Laporan keuangan unit usaha',
      'SK pengelola unit usaha',
      'Bukti kontribusi unit usaha terhadap pembiayaan madrasah',
    ],
    observasi: [
      'Operasional unit usaha berjalan',
      'Kebersihan & kelayakan kantin/koperasi',
    ],
    wawancara: [
      'Pengelola: omset, kendala, & rencana pengembangan',
      'Kepala: arah strategis unit usaha',
    ],
  },
  'KW_4': {
    dokumen: [
      'Daftar hadir / absensi kepala madrasah',
      'Capaian target program tahunan',
      'Penghargaan / apresiasi kepala (jika ada)',
    ],
    observasi: [
      'Kehadiran kepala di madrasah',
      'Konsistensi waktu kerja & kepemimpinan teladan',
      'Respon kepala terhadap masalah / krisis',
    ],
    wawancara: [
      'Guru/tendik: konsistensi & teladan kepala',
      'Komite: persepsi etos kerja kepala',
    ],
  },
  'KW_5': {
    dokumen: [
      'Bukti partisipasi program pemerintah (BOS Afirmasi, MEQR, hibah)',
      'Daftar lomba diikuti (madrasah & siswa)',
      'Bukti pengajuan / penerimaan beasiswa',
      'Inisiatif kemitraan baru',
    ],
    observasi: [
      'Diversifikasi sumber pembiayaan & peluang',
      'Update kepala terhadap info Kemenag/Kemendikbud',
    ],
    wawancara: [
      'Kepala: cara memantau peluang',
      'Wakil/operator: dukungan administrasi pengajuan peluang',
    ],
  },

  // ----- SP: Supervisi Guru & Tendik -----
  'SP_1': {
    dokumen: [
      'Program supervisi tahunan',
      'Jadwal supervisi guru & tendik',
      'Instrumen supervisi (akademik & manajerial)',
      'SK Tim Supervisi (jika dibantu wakil/senior)',
    ],
    observasi: [
      'Sosialisasi jadwal supervisi kepada guru',
      'Cakupan supervisi (semua guru tersupervisi minimal 1x setahun)',
    ],
    wawancara: [
      'Wakil kurikulum: keterlibatan dalam perencanaan',
      'Guru: tahu jadwal & kriteria supervisi',
    ],
  },
  'SP_2': {
    dokumen: [
      'Jurnal/buku supervisi kunjungan kelas',
      'Lembar observasi terisi',
      'Catatan supervisi klinis (pra-observasi, observasi, pasca)',
      'Foto/video supervisi (opsional)',
    ],
    observasi: [
      'Konsistensi pelaksanaan supervisi sesuai jadwal',
      'Kualitas catatan: deskriptif dan reflektif, bukan formalitas',
    ],
    wawancara: [
      'Guru yang disupervisi: pengalaman & manfaat',
      'Kepala: pendekatan supervisi yang digunakan (klinis/akademik/artistik)',
    ],
  },
  'SP_3': {
    dokumen: [
      'Jurnal supervisi TU, Pustakawan, Laboran, dan tendik lain',
      'Lembar observasi tendik',
      'Rekomendasi pembinaan tendik',
    ],
    observasi: [
      'Tertib administrasi TU',
      'Aktivitas perpustakaan & laboratorium',
    ],
    wawancara: [
      'Tendik: bentuk supervisi yang diterima',
      'Kepala: indikator mutu layanan tendik',
    ],
  },
  'SP_4': {
    dokumen: [
      'Rekap hasil supervisi per guru / tendik',
      'Analisis kebutuhan pengembangan',
      'Laporan supervisi tahunan',
      'Kategorisasi guru berdasarkan hasil supervisi',
    ],
    observasi: [
      'Pemanfaatan hasil supervisi dalam rapat dewan guru',
    ],
    wawancara: [
      'Kepala: temuan utama dari hasil supervisi',
      'Guru: feedback yang diterima pasca supervisi',
    ],
  },
  'SP_5': {
    dokumen: [
      'Program pembinaan / pelatihan pasca supervisi',
      'Bukti mentoring / coaching',
      'Bukti partisipasi guru di workshop / diklat',
      'Catatan perubahan kinerja guru pasca pembinaan',
    ],
    observasi: [
      'Perubahan praktik mengajar guru sasaran',
      'Kontinuitas pendampingan (bukan one-shot)',
    ],
    wawancara: [
      'Guru sasaran: bentuk pembinaan yang diterima',
      'Kepala: rencana pengembangan profesi berkelanjutan',
    ],
  },

  // ----- HK: Hasil Kinerja Kepala Madrasah -----
  'HK_1': {
    dokumen: [
      'SK akreditasi terbaru dari BAN-S/M',
      'Sertifikat akreditasi',
      'Rencana persiapan reakreditasi',
      'Tindak lanjut rekomendasi akreditasi',
    ],
    observasi: [
      'Kelengkapan & kerapian dokumen akreditasi',
      'Komitmen tim akreditasi internal',
    ],
    wawancara: [
      'Kepala: strategi peningkatan peringkat akreditasi',
      'Wakil/tim: progres persiapan reakreditasi',
    ],
  },
  'HK_2': {
    dokumen: [
      'Rekap nilai PKG guru terbaru (lihat saran skor di samping)',
      'Hasil AKMI / Asesmen Madrasah siswa',
      'Rapor Pendidikan / Rapor Mutu Madrasah',
      'Tren capaian 3 tahun terakhir',
    ],
    observasi: [
      'Konsistensi mutu pembelajaran lintas kelas/mapel',
      'Pemanfaatan hasil PKG/AKMI untuk perbaikan pembelajaran',
    ],
    wawancara: [
      'Wakil kurikulum: analisis capaian',
      'Guru: rencana tindak lanjut hasil AKMI',
    ],
  },
  'HK_3': {
    dokumen: [
      'Daftar prestasi siswa & guru (3 tahun terakhir)',
      'Piagam, piala, sertifikat',
      'Dokumentasi lomba (foto, surat tugas, undangan)',
      'Bukti publikasi atau karya inovatif guru',
    ],
    observasi: [
      'Display prestasi (etalase, papan)',
      'Aktivitas pembinaan menuju lomba',
    ],
    wawancara: [
      'Pembina ekstrakurikuler: jadwal & target lomba',
      'Siswa berprestasi: dukungan dari madrasah',
    ],
  },
  'HK_4': {
    dokumen: [
      'Hasil survei kepuasan (guru, siswa, ortu, komite)',
      'Kuesioner & instrumen survei yang digunakan',
      'Notulen rapat komite & wali murid',
      'Buku saran / kotak keluhan',
    ],
    observasi: [
      'Mekanisme pengumpulan suara stakeholder berjalan',
      'Tindak lanjut atas saran/keluhan stakeholder',
    ],
    wawancara: [
      'Komite: persepsi terhadap kepala madrasah',
      'Wali murid: kepuasan layanan madrasah',
      'Siswa: keterbukaan & responsivitas kepala',
    ],
  },
  'HK_5': {
    dokumen: [
      'Data PPDB 3 tahun terakhir',
      'Tren retensi & angka putus sekolah',
      'Strategi promosi madrasah (brosur, medsos, kunjungan SD/MI)',
      'Data siswa pindahan masuk-keluar',
    ],
    observasi: [
      'Aktivitas promosi/PPDB',
      'Daya tarik madrasah (program unggulan, fasilitas, prestasi)',
    ],
    wawancara: [
      'Wakil kesiswaan/humas: strategi PPDB',
      'Komite: dukungan promosi & rekrutmen',
    ],
  },
  'HK_6': {
    dokumen: [
      'SK tugas tambahan (Ketua KKM, Fasprov, Pengurus Pokja, dsb)',
      'Laporan pelaksanaan tugas tambahan',
      'Bukti kontribusi (notulen rapat KKM, laporan diklat, narasumber)',
      'Surat tugas / undangan dari instansi terkait',
    ],
    observasi: [
      'Tugas tambahan tidak mengganggu tupoksi utama',
      'Kepala tetap hadir & memimpin di madrasah',
    ],
    wawancara: [
      'Kepala: pembagian waktu & prioritas',
      'Tim madrasah: dampak tugas tambahan terhadap kinerja',
    ],
  },
};

// Cari aspek + komponen + penggalian dari aspek_id (mis. "PM_3").
window.getAspekById = function(id) {
  if (!id) return null;
  const parts = String(id).split('_');
  if (parts.length < 2) return null;
  const code = parts[0];
  const no = parts[1];
  const k = window.PKKM_KOMPONEN.find(x => x.code === code);
  if (!k) return null;
  const a = k.aspek.find(x => String(x.no) === String(no));
  if (!a) return null;
  return {
    komponen: k,
    aspek: a,
    penggalian: (window.PKKM_PENGGALIAN && window.PKKM_PENGGALIAN[id]) || null,
  };
};
