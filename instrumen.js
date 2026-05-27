// instrumen.js - Master data PKKM
// Sumber: Aplikasi PKKM Excel v.110820 (Sarjono & Ida Syam, Pengawas Kemenag Lamongan)
// Struktur: 5 komponen × 29 sub-aspek × N indikator (skor per indikator 1-4)
// Skor: 1 = Kurang, 2 = Cukup, 3 = Baik, 4 = Amat Baik
// Bobot komponen default 20% rata, total 100. Bisa diubah di Pengaturan.
// Tiap indikator punya popup berisi:
//   - data    : "Data Yang Diharapkan" (single line, ringkas)
//   - bukti   : "BUKTI FISIK" (panduan supervisi: dokumen/observasi/wawancara)

window.PKKM_VERSION = '2.0.0';

// 5 komponen utama (kode + label + bobot default)
window.PKKM_KOMPONEN_META = [
  { no: 1, code: 'PM', label: 'Usaha Pengembangan Madrasah', bobot_default: 20 },
  { no: 2, code: 'MJ', label: 'Pelaksanaan Tugas Manajerial', bobot_default: 20 },
  { no: 3, code: 'KW', label: 'Pengembangan Kewirausahaan', bobot_default: 20 },
  { no: 4, code: 'SP', label: 'Supervisi Guru dan Tenaga Kependidikan', bobot_default: 20 },
  { no: 5, code: 'HK', label: 'Hasil Kinerja Kepala Madrasah', bobot_default: 20 },
];

// Instrumen lengkap untuk role "pengawas" (Pengawas-1 / Pengawas-2 share instrumen sama)
window.PKKM_INSTRUMEN_PENGAWAS = [
  {
    "no": 1,
    "code": "PM",
    "label": "Usaha Pengembangan Madrasah",
    "aspek": [
      {
        "kode": "1.1",
        "no": 1,
        "unsur": "Mengembangkan madrasah sesuai dengan kebutuhan.",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mampu menggembangkan struktur organisasi yang sesuai dengan kebutuhan program.",
            "data": "Dokumen struktur madrasah",
            "bukti": "Melalui observasi dan studi dokumen: (1) bagan/struktur organisasi; (2) notulen rapat yang berisi keputusan tentang penyusunan struktur organisasi; (3) dokumen sosialisasi; dan (4) Daftar Hadir"
          },
          {
            "no": 2,
            "indikator": "Mampu menempatkan personalia yang sesuai dengan kebutuhan",
            "data": "Dokumen uraian tugas personalia di madrasah",
            "bukti": "Melalui studi dokumen: (1) dokumen penetapan/pengesahan susunan organisasi madrsaha; (2) rincian tugas setiap personil pada struktur organisasi madrasah; (3) SOP Personalia; dan (4) Sertifikat"
          },
          {
            "no": 3,
            "indikator": "Mampu mengembangkan pedoman dan prosedur kerja organisasi madrasah",
            "data": "Pedoman dan prosedur kerja organisasi madrasah",
            "bukti": "Melalui obsevasi dokumen: \r\nSOP madrasah"
          }
        ]
      },
      {
        "kode": "1.2",
        "no": 2,
        "unsur": "Mengelola perubahan dan pengembangan madrasah menuju organisasi pembelajar yang efektif.",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mampu mengembangkan program baru untuk meningkatkan pencapaian target yang lebih tinggi.",
            "data": "Program pengembangan madrasah mengandung target pencapaian pada indikator keunggulan khas satuan pendidikan, kerja sama tim, dan data realisasi target yang meningkat daripada pencapaian sebelumnya.",
            "bukti": "Melalui studi dokumen: (1) visi dan Misi madrasah; (2) data prestasi madrasah; (3) data hasil UN 3 tahun terahir; (4) Data Alumni"
          },
          {
            "no": 2,
            "indikator": "Mampu dan terampil dalam membangun tim kerja yang efektif untuk mendapatkan produk kinerja yang lebih unggul.",
            "data": "Terdapat struktur organisasi yang dilengkapi dengan distribusi dan deskripsi pembagian tugas",
            "bukti": "Melalui observasi dan studi dokumen: (1) bagan/struktur organisasi; (2) SK; (3) tugas dan fungsi; (4) Terbentuknya KKG/MGMP; (5) Program KKG/MGMP; dan (6) Laporan kegiatan KKG/MGMP"
          },
          {
            "no": 3,
            "indikator": "Mampu menerapkan berbagai teknik pembaharuan dalam pengelolaan pembelajaran.",
            "data": "Terdapat penerapan strategi pembaharuan dengan strategi yang terprogram",
            "bukti": "Melalui studi dokumen: (1) KTSP; (2) kalender pendidikan; (3) perangkat pembelajaran; (4) penilaian; DAN (5) peraturan akademik"
          },
          {
            "no": 4,
            "indikator": "Mampu mengembangkan potensi dan meningkatkan prestasi madrasah",
            "data": "Dokumen bukti perkembanganpotensi dan prestasi peserta didik, yang meningkat dari waktu ke waktu.",
            "bukti": "Melalui studi dokumen: (1) data prestasi madrasah 1 tahun terahir; (2) data hasil UN 1 tahun terahir; (3)  Dokumen Akreditasi; dan (4) Program Ekstrakurikuler"
          }
        ]
      },
      {
        "kode": "1.3",
        "no": 3,
        "unsur": "Mengelola hubungan antara madrasah dan masyarakat dalam rangka pencarian dukungan ide, sumber belajar, dan pembiayaan.",
        "indikator": [
          {
            "no": 1,
            "indikator": "Merencanakan kerjasama dengan lembaga pemerintah, swasta dan masyarakat",
            "data": "Data kerjasama dengan lembaga pemerintah, swasta, dan masyarakat",
            "bukti": "Melalui studi dokumen: (1) SK komite madasah; (2) AD/ART komite madrasah; (3) program kerja komite madrasah; (4) laporan kegiatan komite madrasah; dan (5) dokumen tertulis kerja sama (MUO)."
          },
          {
            "no": 2,
            "indikator": "Melakukan pendekatan-pendekatan dalam rangka mendapatkan dukungan dari lembaga pemerintah, swasta dan masyarakat",
            "data": "Dokumen pragram kerjasama dengan pemerintah, swasta, dan masyarakat",
            "bukti": "Melalui studi dokumen: (1) Program kegiatan kerja sama; (2) Foto kegiatan; (3) Jadwal Kegiatan; dan (4) Sk Penanggung Jawab program."
          },
          {
            "no": 3,
            "indikator": "Memanfaatkan dan memelihara hubungan kerjasama dengan lembaga pemerintah, swasta dan masyarakat",
            "data": "Data hasil kerjasama dengan lembega pemerintah, swasta, dan masyarakat",
            "bukti": "Melalui studi dokumen: Laporan kegiatan kerja sama"
          }
        ]
      },
      {
        "kode": "1.4",
        "no": 4,
        "unsur": "Mengelola proses pencapaian 8 SNP sesuai dengan arah dan tujuan Pendidikan nasional",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mengaplikasikan pengembangan kurikulum yang mengacu kepada standar isi",
            "data": "Dokumen analisis 8 SNP dalam hal standar ini",
            "bukti": "Melalui studi dokumen: (1) KTSP; (2) kalender pendidikan; (3) perangkat pembelajaran; (4) penilaian; (5) peraturan akademik; dan (6) Buku Kerja Guru."
          },
          {
            "no": 2,
            "indikator": "Mengaplikasikan pengembangan proses pembelajaran yang mengacu kepada standar proses",
            "data": "Dokumen analisis 8 SNP dalam hal standar proses",
            "bukti": "Melalui studi dokumen: (1) dokumen pengembangan silabus; (2) RPP; (2) RPE; (2) buku teks; (2) jurnal mengajar guru; dan (2) data siswa."
          },
          {
            "no": 3,
            "indikator": "Mengaplikasikan sistem penilaian pembelajaran yang mengacu kepada standar penilaian",
            "data": "Dokumen analisis 8 SNP dalam hal standar penilaian",
            "bukti": "Melalui studi dokumen: (1) instrumen penilaian; (2) kisi-kisi soal; (3) kumpulan nakah soal; (4) analisis butir soal; (5) dokumen analisis hasil belajar siswa; (6) laporan hasil belajar siswa; (7) tindak lanjut hasil penilaian; (8) dokumen pelaksanaan PAS; dan (9) dokumen pelaksanaan PAT."
          },
          {
            "no": 4,
            "indikator": "Melaksanakan penjaminan mutu pencapaian standar kompetensi lulusan",
            "data": "Dokumen analisis 8 SNP dalam hal standar kompetensi lulusan",
            "bukti": "Melalui studi dokumen: (1) dokumen program kegiatan kesiswaan; (2) laporan kegiatan kesiswaan; (3) dokumentasi kegiatan kesiswaan; (4) laporan kegiatan pembiasaan siswa; (5) dokumen kegiatan literasi; (6) data rata-rata hasil ujian 2 tahun terahir; (7) data prestasi akademik 2 tahun terahir; dan (8) data prestasi non akademik 2 tahun terahir."
          }
        ]
      },
      {
        "kode": "1.5",
        "no": 5,
        "unsur": "Mengelola unit layanan khusus madrasah dalam mendukung kegiatan pembelajaran dan kegiatan peserta didik di madrasah.",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mampu mengelola laboratorium madrasah agar dapat dimanfaatkan secara optimal untuk kepentingan pembelajaran peerta didik",
            "data": "Adanya bukti pemanfaatan laboratorium dalam pembelajaran, jadwal, kegiatan, dll (Kosongkan jika RA)",
            "bukti": "Observasi dan studi dokumen: (1) luas memenuhi sesuai standar; (2) sarana pendukung lab; (2) jurnal laboratorium; dan (2) Program Pengembangan Sarpras."
          },
          {
            "no": 2,
            "indikator": "Mampu mengelola perpustakaan madrasah dalam menyiiapkan sumber belajar yang diperlukan oleh peserta didik.",
            "data": "Adanya bukti pemanfaatan lperpustakaan dalam pembelajaran, jadwal, kegiatan, dll",
            "bukti": "Observasi dan studi dokumen: (1) luas memenuhi sesuai standar; (2) sarana pendukung; (2) daftar buku induk perpustakaan; dan (2) laporan/statistic pengelolaan perpustakaan."
          },
          {
            "no": 3,
            "indikator": "Mampu mengelola usaha madrasah untuk pembelajaran pesera didik dan pemasukan tambahan dana bagi madrasah.",
            "data": "Adanya bukti kegiatan usaha madrasah dalam pembelajaran.",
            "bukti": "Melalui studi dokumen:\r\ndata/laporan kegiatan usaha madrasah"
          },
          {
            "no": 4,
            "indikator": "Mampu mengelola koperasi madrasah baik sebagai media praktik maupun sebagai sumber belajar bagi peserta didik.",
            "data": "Adanya bukti pemanfaatan koperasi dalam pembelajaran, jadwal, kegiatan, dll",
            "bukti": "Observasi dan studi dokumen: (1) instrumen hasil praktek pembelajaran; dan (2) foto kegiatan praktik"
          }
        ]
      },
      {
        "kode": "1.6",
        "no": 6,
        "unsur": "Mengelola sistem informasi madrasah dalam mendukung penyusunan program dan pengambilan keputusan.",
        "indikator": [
          {
            "no": 1,
            "indikator": "Memanfaatkan teknologi informasi dan komunikasi dalam manajemen madrasah",
            "data": "Adanya bukti pemanfaatan teknologi indformasi dan komunikasi dalam manajemen madrasah",
            "bukti": "Observasi, studi dokumen dan wawancara: (1) fasilitas teknologi dan informasi; dan (2) sumber daya informasi"
          },
          {
            "no": 2,
            "indikator": "Memanfaatkan teknologi informasi dan komunikasi dalam pembelajaran, baik sebagai sumber belajar maupun sebagai alat/media pembelajaran.",
            "data": "Adanya bukti pemanfaatan teknologi indformasi dan komunikasi sebagai sumber belajar dan media pembelajaran",
            "bukti": "Observasi lingkungan madrasah dan wawancara: (1) ketersediaan komputer; (2) jaringan internet; (3) website madrasah; (4) alamat email madrasah; dan (5) pemanfaatn TIK untuk pembelajaran."
          },
          {
            "no": 3,
            "indikator": "Memanfaatkan teknologi teknologi informasi dan komunikasi dalam menjalin kerjasama dengan pihak lain.",
            "data": "Adanya bukti pemanfaatan teknologi informasi dan komunikasi dalam menjalin kerjasama dengan pihak lain",
            "bukti": "Observasi lingkungan madrasah, wawancara dan studi dokumen: (1) pengelolaan SIM; (2) fasilitas SIM; (3) surat tugas pengelola SIM; dan (4) pelaporan data dan informasi."
          },
          {
            "no": 4,
            "indikator": "Memanfaatkan teknologi teknologi informasi dan komunikasi dalam promosi program madrasah dan prestasi yang telah dicapai.",
            "data": "Adanya bukti pemanfaatan teknologi informasi dan komunikasi dalam promosi program madrasah dan prestasi yang dicapai",
            "bukti": "Observasi lingkungan madrasah, wawancara dan studi dokumen: (1) pengelolaan SIM; (2) fasilitas SIM; (3) surat tugas pengelola SIM; dan (4) pelaporan data dan informasi."
          }
        ]
      },
      {
        "kode": "1.7",
        "no": 7,
        "unsur": "Memanfaatkan kemajuan teknologi informasi bagi peningkatan pembelajaran dan manajemen madrasah",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mampu mengembangkan sistem administrasi pengelolaan secara efektif dengan dukungan penerapan teknologi informasi dan komunikasi.",
            "data": "Terdapat penerapan TIK (berbasis komputer, CD, jejaring intranet, internet) dalam pengelolaan administrasi administrasi persuratan, sarana prasarana, kepegawaian, kepeserta didikan, dan keuangan.",
            "bukti": "Observasi lingkungan madrasah dan wawancara: (1) jumlah komputer dan LCD yang cukup; (2) memiliki jaringan internet; (3) memiliki web sekolah; (4) memiliki e-mail madrasah; dan (5) Memanfaatkan TIK untuk adminitrasi madrasah."
          },
          {
            "no": 2,
            "indikator": "Mengelola adminsistasi pembelajaran secara efektif dengan dukungan penerapan teknologi informasi dan komunikasi.",
            "data": "Model penerapan TIK dalam pengelolaan adminsitrasi kurikulum dan pembelajaran, misalnya, pengelolaan kurikulum berbasis komputer, intranet, dan internet.",
            "bukti": "Observasi lingkungan madrasah dan wawancara: (1) jumlah kompute dan LCD yang cukup; (2) memiliki jaringan internet; dan (3) memanfaatkan TIK untuk pembelajaran."
          },
          {
            "no": 3,
            "indikator": "Mampu  mengembangkan sistem pengelolaan perpustakaan secara efektif dengan dukungan penerapan teknologi informasi dan komunikasi.",
            "data": "Model pemanfaatan TIK dalam sistem pengelolaan perpustakaan berbasis komputer, intranet, atau internet.",
            "bukti": "Observasi dan studi dokumen: (1) katalog digital; (2) BSE; (3) akses internet; (4) komputer; dan (5) dokumen aplikasi layanan perpustakaan."
          }
        ]
      }
    ]
  },
  {
    "no": 2,
    "code": "MJ",
    "label": "Pelaksanaan Tugas Manajerial",
    "aspek": [
      {
        "kode": "2.1",
        "no": 1,
        "unsur": "Menyusun perencanaan madrasah untuk berbagai tingkatan perencanaan.",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mampu mengembangkan RKJM, RKT/RKAM dengan program lainnya berdasarkan data hasil evaluasi dalam pemenuhan 8 SNP",
            "data": "Dokumen RKJM, RKT/RKAM yang  meliputi SNP",
            "bukti": "Melalui studi dokumen: (1) Dokumen Evaluasi Diri Madrasah EDM); dan (2) Dokumen RKJM dan RKT berbasis EDM"
          },
          {
            "no": 2,
            "indikator": "Mampu merumuskan visi-misi sebagai arah pengembangan program RKJM, RKT/RKAS dan program lainnya.",
            "data": "Visi-misi madrasah merupakan rumusan hasil keputusan bersama.",
            "bukti": "Melalui studi dokumen: (1) visi, misi yang telah ditetapkan oleh Kamad; dan (2) berita acara dan daftar hadir kegiatan perumusan/ peninjauan kembali dan penetapan visi dan misi."
          },
          {
            "no": 3,
            "indikator": "Mampu menentukan strategi pencapaian tujuan madrasah, dilengkapi dengan indikator pencapaian yang terukur",
            "data": "Dokumen program yang memuat strategi pencapaian tujuan madrasah",
            "bukti": "Melalui studi dokumen: (1) program kerja; dan (2) RKJM dan RKTM"
          },
          {
            "no": 4,
            "indikator": "Mampu menyusun program dengan rencana evaluasi keterlaksanaan dan pencapaian program",
            "data": "Dokumen rencana evaluasi keterlaksanaan dan pencapaian program.",
            "bukti": "Melalui studi dokumen:\r\nRKJM dan RKTM"
          }
        ]
      },
      {
        "kode": "2.2",
        "no": 2,
        "unsur": "Memimpin madrasah dalam rangka pendayagunaan sumber daya madrasah secara optimal.",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mampu memberi contoh berdisiplin; hadir tepat waktu, disiplin menggunakan waktu, dan tepat waktu mengakhiri pekerjaan.",
            "data": "Dokumen daftar hadir semua kegiatan madrasah",
            "bukti": "Observasi, wawancara dan studi dokumen: (1) finggerprint kehadiran kamad; dan (2) daftar hadir pada kegiatan di madrasah"
          },
          {
            "no": 2,
            "indikator": "Mampu melaksanakan peraturan sesuai dengan ketentuan yang berlaku",
            "data": "Menjadi contoh dan mengarahkan guru, staf administrasi, dan peserta didik melaksanakan kegiatan sesuai dengan peraturan",
            "bukti": "Wawancara dengan warga madrasah"
          },
          {
            "no": 3,
            "indikator": "Mampu menunjukkan keteladanan dalam memanfaatkan sumber daya secara efektif dan efisien.",
            "data": "Memecahkan masalah madrasah secara bersama-sama, merencankan pemanfaatan sumber belajar dan sumber informasi, memantau penggunaan sumber daya, dan menilai pemanfaatan sumber daya",
            "bukti": "Wawancara dengan warga madrasah"
          },
          {
            "no": 4,
            "indikator": "Mampu  menunjukkan kedisiplinan sebagai insan pembelajar.",
            "data": "Rajin membaca dan pendengar yang baik, mengekspresikan pikiran secara tertulis, mengkomunikasikan ilmu pengetahuan baru, dan menyediakan berbagai media untuk mengembangkan gagasan warga madrasah",
            "bukti": "Wawancara, observasi: (1) koleksi buku refrefensi/ ilmu pengetahuan; dan (2) karya tulis yang diterbitkan atau tidak"
          }
        ]
      },
      {
        "kode": "2.3",
        "no": 3,
        "unsur": "Menciptakan budaya dan iklim madrasah yang kondusif dan inovatif bagi pembelajaran peserta didik.",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mampu menjadi contoh  dan berbudaya mutu yang kompetitif dalam mendorong peningkatan prestasi akademik dan nonakademik peserta didik",
            "data": "Dokumen peningkatan KKM, target hasil ulangan, hasil UN dan target keunggulan nonakademik peserta didik yang terprogram, terlaksana, dan meningkat hasilnya",
            "bukti": "Wawancara dan studi dokumen: (1) peningkatan KKM; (2) hasil UN; (3) program keunggulan dan inovasi baik akademik maupun non akademik; dan (4) data prestasi akademik dan non akademik."
          },
          {
            "no": 2,
            "indikator": "Mampu melengkapi sarana dan prasarana untuk menciptakan suasana belajar kondusif dan inovatif bagi peserta didik",
            "data": "Suasana lingkungan madrasah yang asri, bersih, rindang, aman, dan menyenangkan peserta didik",
            "bukti": "Observasi lingkungan madrasah:  suasana lingkungan yang asri, bersih, rindang, aman, dan menyenangkan peserta didik"
          },
          {
            "no": 3,
            "indikator": "Mampu memfasilitasi kegiatan-kegiatan untuk meningkatkan budaya baca dan budaya tulis peserta didik.",
            "data": "Data kunjungan perpustakaan, peminjaman buku oleh peserta didik, pembaharuan buku dan bahan bacaan, ketersediaan sumber belajar berbasis TIK, dan sarana publikasi karya tulis, dan mengembangkan kompetisi karya tulis peserta didik tingkat madrasah.",
            "bukti": "Observasi, wawancara dan studi dokumen: (1) rencana dan laporan pelaksanaan kegiatan literasi; (2) dokumen kegiatan pengembangan budaya baca; dan (3) dokumen/ pajangan hasil karya tulis siswa."
          },
          {
            "no": 4,
            "indikator": "Mampu memfasilitasi kegiatan-kegiatan lomba di bidang akademik dan nonakademik bagi peserta didik",
            "data": "Dokumen penyelenggaran kegiatan kompetisi yang dimulai dari tingkat madrasah, perolehan piagam penghargaan, piala, trofi perlombaan bidang akademik dan nonakademik.",
            "bukti": "Observasi dan studi dokumen: (1) dokumen penyelenggaran kegiatan kompetisi yang dimulai dari tingkat madrasah; dan (2) daftar perolehan piagam, penghargaan, piala, trofi perlombaan disemua jenjang."
          }
        ]
      },
      {
        "kode": "2.4",
        "no": 4,
        "unsur": "Mengelola guru dan staf dalam rangka pendayagunaan sumber daya manusia secara optimal.",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mampu menyusun perencanaan pengembangan pendidik dan tenaga kependidikan",
            "data": "Dokumen program pembinaan pendidik dan tenaga kependidikan di madrasah",
            "bukti": "Studi dokumen dan wawancara:\r\nprogram kerja kepala madrasah"
          },
          {
            "no": 2,
            "indikator": "Mampu melakukan pembinaan berkala untuk meningkatkan mutu SDM madrasah",
            "data": "Dokumen pelaksanaan kegiatan pembinaan guru.",
            "bukti": "Studi dokumen dan wawancara: (1) buku/catatan pembinaan guru dan tendik (notulen dan daftar hadir rapat pembinaan); dan (2) laporan kinerja kepala madrasah."
          },
          {
            "no": 3,
            "indikator": "Memfasilitasi guru dan staf administrasi untuk meningkatkan kegiatan pembinaan kompetensi",
            "data": "Data dukungan Kepala Madrasah dalam memfasilitasi staf administrasi untuk meningkatkan mutu profesi.",
            "bukti": "Studi dokumen dan wawancara: (1) buku/catatan pembinaan guru dan tendik (notulen dan daftar hadir rapat pembinaan); dan (2) laporan kinerja kepala madrasah."
          },
          {
            "no": 4,
            "indikator": "Memantau dan menilai penerapan hasil pelatihan dalam pekerjaan di madrasah",
            "data": "Dokumen program evaluasi pelatihan atau pengembangan profesi pendidik dan tenaga kependidikan",
            "bukti": "Observasi dan studi dokumen: (1) program pelatihan pengembangan profesi guru dan tendik; dan (2) laporan pelaksanaan pelatihan pengembangan profesi guru dan tendik"
          }
        ]
      },
      {
        "kode": "2.5",
        "no": 5,
        "unsur": "Mengelola sarana dan prasarana madrasah dalam rangka pendayagunaan secara optimal",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mampu mengelola fasilitas prasarana, perabot dan sarana madrasah (gedung, bangunan, dan lahan meja, kursi, lemari, peralatan kantor, dan alat kebersihan)",
            "data": "Data fasilitas prasarana, perabot, dan sarana marasah dikelola dengan baik",
            "bukti": "Observasi dan studi dokumen: (1) buku inventaris; dan (2) buku pemeliharaan sarana dan prasarana."
          },
          {
            "no": 2,
            "indikator": "Mampu mengelola perpustakaan madrasah",
            "data": "Data perpustakaan dikelola dengan baik",
            "bukti": "Observasi fisik dan studi dokumen: (1) buku induk perpustakaan; dan (2) buku/data/grafik layanan perpustakaan."
          },
          {
            "no": 3,
            "indikator": "Mampu mengelola laboratirium madrasah",
            "data": "Data laboratorium dikelola dengan baik (Kosongkan jika RA)",
            "bukti": "Observasi fisik dan studi dokumen: (1) daftar infentaris laboratorium; dan (2) buku/jurnal/ data/grafik layanan baboratorium"
          },
          {
            "no": 4,
            "indikator": "Mampu mengelola fasilitas penunjang madrasah lainnya (bengkel, toko, koperasi, kebun, dsb)",
            "data": "Data fasilitas penunjang terkola dengan baik",
            "bukti": "Observasi fisik,wawancara dan studi dokumen:\r\ndata fasilitas penunjang wirausaha yang dikelola oleh madrasah"
          }
        ]
      },
      {
        "kode": "2.6",
        "no": 6,
        "unsur": "Mengelola peserta didik dalam rangka penerimaan peserta didik baru, dan penempatan dan pengembangan kapasitas peserta didik",
        "indikator": [
          {
            "no": 1,
            "indikator": "Menyusun perencanaan penerimaan, pengelolaan dan pengembangan kompetensi peserta didik.",
            "data": "Dokumen program penerimaan peserta didik baru, kriteria penerimaan peserta didik, data hasil analisis bekal ajar peserta didik awal,",
            "bukti": "Studi dokumen: (1) dokumen program penerimaan peserta didik baru; (2) brosur; dan (3) data hasil analisis kemampuan peserta didik baru"
          },
          {
            "no": 2,
            "indikator": "Memiliki program pengembangan potensi diri dan prestasi peserta didik.",
            "data": "Dokumen program pengembangan potensi diri dan prestasi peserta didik.",
            "bukti": "Observasi dan studi dokumen:\r\nprogram pengembangan diri peserta didik."
          },
          {
            "no": 3,
            "indikator": "Memfasilitasi kegiatan-kegiatan untuk meningkatkan pembiasaan melalui penanaman nilai-nilai.",
            "data": "Data program kegiatan akademik dan nonakademik melalui penanaman nilai - nilai.",
            "bukti": "Observasi lingkungan aktivitas siswa, wawancara dan studi dokumen: (1) program kegiatan akademik dan non akademik dan laporan pelaksanaannya; dan (2) dokumentasi kegiatan."
          },
          {
            "no": 4,
            "indikator": "Memfasilitasi kegiatan pengembangan diri bagi peserta didik, pendidik, dan tenaga kependidikan lainnya secara optimal",
            "data": "Data keterlaksanaan program pengembangan diri peserta didik, pendidik, dan tenaga kependidikan",
            "bukti": "Observasi lingkungan aktivitas siswa dan guru, wawancara dan studi dokumen: (1) program kegiatan pengembangan diri; (2) dokumentasi kegiatan; dan (3) data prestasi siswa, guru dan tendik."
          }
        ]
      },
      {
        "kode": "2.7",
        "no": 7,
        "unsur": "Mengelola pengembangan kurikulum dan kegiatan pembelajaran sesuai dengan arah dan tujuan pendidikan nasional",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mampu mengarahkan secara efektif dalam menerapkan prinsip-prinsip pengengembangan KTSP dalam kegiatan IHT, Workshop, Rapat Koordinasi, dan kegiatan MGMP/KKG.",
            "data": "Dokumen hasil pengembangan kurikulum yang disusun melalui rapat kerja, IHT, Workshop, Rakor, atau kegiatan MGMP/KKG",
            "bukti": "Studi dokumen: (1) dokumen kurikulum yang berlaku; (2) SK tim pengembang kurikulum; dan (3) dokumen penyusunan dokumen kurikulum (daftar hadir, berita acara, notulen)."
          },
          {
            "no": 2,
            "indikator": "Mampu mengendalikan pelaksanaan KTSP berlandaskan kalender pendidikan, menerbitkan surat keputusan pembagian tugas mengajar, dan menerapkan aturan akademik.",
            "data": "Pelaksanaan kurikulum sesuai dengan kalender pendidikan tingkat madrasah, surat keputusan pembagian tugas mengajar, dan aturan akademik.",
            "bukti": "Studi dokumen: (1) struktur kurikulum; (2) jadwal pelajaran; (3) daftar hadir guru; dan (4) peraturan akademik"
          },
          {
            "no": 3,
            "indikator": "Memfasilitasi efektivitas tim kerja guru dalam rangka meningkatkan mutu pembelajaran.",
            "data": "Bukti pelaksanaan kerja sama guru pada tingkat satuan pendidikan, antar satuan pendidikan dalam meningkatkan mutu perencanaan, proses, pembelajaran",
            "bukti": "Studi dokumen: (1) program KKG/MGMP di madrasah; dan (2) laporan pelaksanaan KKG/MGMP."
          },
          {
            "no": 4,
            "indikator": "Mampu mengembangkan pelayanan belajar yang inovatif melalui pengembangan perangkat dan sumber belajar yang terbarukan.",
            "data": "Bukti penggunaan metode hasil pelatihan paling akhir, memanfaatkan teknologi informasi dan komunikasi, penggunaan alat peraga, teknik evaluasi baru yang menghasilkan produk belajar peserta didik yang dipublikasikan di lingkungan madrasah atau media lain",
            "bukti": "Observasi kelas, studi dokumen wawancara dengan siswa dan guru:\r\nmenelaah ragam metode, media dan sumber belajar yang digunakan dalam RPP"
          },
          {
            "no": 5,
            "indikator": "Memfasilitasi peserta didik dalam mengembangkan kolaborasi dan kompetisi bidang akademik dan nonakademik",
            "data": "Data kegiatan kolaborasi dan kompetisi peserta didik tingkat madrasah, baik akademik dan non akademik.",
            "bukti": "Wawancara dan studi dokumen: (1) program, laporan dan dokumen kegiatan kesiswaan (kegiatan akademik maupun non akademik); dan (2) data prestasi akademik maupun nonakademik."
          }
        ]
      },
      {
        "kode": "2.8",
        "no": 8,
        "unsur": "Mengelola keuangan madrasah sesuai dengan prinsip pengelolaan yang akuntabel, transparan, dan efisien",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mampu merencanakan kebutuhan keuangan madrasah sesuai dengan rencana pengembangan madrasah, baik jangka pendek maupun jangka panjang",
            "data": "Dokumen RKJM dan RKTM",
            "bukti": "Studi dokumen: (1) RKJM dan RKTM; (2) laporan keuangan; dan (3) buku kas."
          },
          {
            "no": 2,
            "indikator": "Mampu mengupayaan sumber-sumber keuangan terutama dari luar madrasah dan dari unit usaha madrasah",
            "data": "Dokumen RKJM dan RKTM",
            "bukti": "Studi dokumen RKJM dan RKTM."
          },
          {
            "no": 3,
            "indikator": "Mampu mengkoordinasikan pembelajaran keuangan sesuai dengan peraturan dan perundang-undangan berdasarkan asas prioritas dan efisiensi.",
            "data": "Dokumen RKJM dan RKTM",
            "bukti": "Studi dokumen RKJM dan RKTM."
          },
          {
            "no": 4,
            "indikator": "Mampu membuat laporan dan evaluasi pengelolaan keuangan madrasah sesuai dengan prinsip efisien, tranparan, dan akuntabel.",
            "data": "Dokumen RKJM dan RKTM",
            "bukti": "Studi dokumen: (1) RKJM dan RKTM; (2) laporan keuangan; dan (3) buku kas."
          }
        ]
      },
      {
        "kode": "2.9",
        "no": 9,
        "unsur": "Mengelola ketatausahaan madrasah dalam mendukung pencapaian tujuan madrasah",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mampu mengelola administrasi surat masuk dan surat keluar sesuai dengan pedoman persuratan yang berlaku",
            "data": "Adanya bukti dokumen surat masuk dan keluar",
            "bukti": "Melalui studi dokumen:\r\nsurat masuk dan keluar"
          },
          {
            "no": 2,
            "indikator": "Mampu mengelola administrasi madrasah yang meliputi administrasi akademik, kesiswaan, sarana/prasarana, keuangan, dan hubungan madrasah dengan masyarakat",
            "data": "Adanya bukti dokumen administrasi madrasah",
            "bukti": "Melalui studi dokumen:\r\nadministrasi madrasah (akademik, kesiswaan, sarana/prasaran, keuangan, dan hubungan madrasah dengan masyarakat)"
          },
          {
            "no": 3,
            "indikator": "Mampu mengelola administrasi kearsipan madrasah baik arsip dinamis maupun arsip lainnya",
            "data": "Adanya bukti dokumen administrasi madrasah",
            "bukti": "Melalui studi Dokumen:\r\nAdministrasi madrasah"
          },
          {
            "no": 4,
            "indikator": "Mampu mengelola administrasi akreditasi madrasah sesuai dengan prinsip-prinsip tersedianya dokumen pendukung dan bukti fisik",
            "data": "Adanya bukti dokumen administrasi madrasah",
            "bukti": "Melalui studi Dokumen:\r\nAdministrasi pemenuhan 8 SNP madrasah"
          }
        ]
      },
      {
        "kode": "2.10",
        "no": 10,
        "unsur": "Melakukan monitoring, evaluasi, dan pelaporan pelaksanaan program kegiatan madrasah dengan prosedur yang tepat, serta merencanakan tindak lanjutnya.",
        "indikator": [
          {
            "no": 1,
            "indikator": "Menyusun standar kinerja program pendidikan yang dapat diukur dan dinilai",
            "data": "Dokumen SKP yang terukur",
            "bukti": "Melalui studi dokumen:\r\nSKP yang terukur"
          },
          {
            "no": 2,
            "indikator": "Melakukan monitoring dan evaluasi kinerja program pendidikan dengan menggunakan teknik yang sesuai",
            "data": "Dokumen pelaksanaan monitoring dan evaluasi  yang sesuai",
            "bukti": "Melalui studi dokumen:\r\npelaksanaan monitoring dan evaluasi  yang sesuai"
          },
          {
            "no": 3,
            "indikator": "Menyusun laporan sesuai dengan standar pelaporan monitoring dan evaluasi",
            "data": "Dokumen laporan pelaksanaan monitoring dan evaluasi",
            "bukti": "Melalui studi dokumen:\r\nLaporan pelaksanaan monitoring dan evaluasi"
          },
          {
            "no": 4,
            "indikator": "Merumuskan program tindak lanjut berdasarkan hasil evaluasi pelaksanaan program sebelumnya",
            "data": "Dokumen program tindak lanjut berdasarkan hasil  monitring dan evaluasi",
            "bukti": "Melalui studi dokumen:\r\nProgram tindak lanjut berdasarkan hasil  monitring dan evaluasi"
          }
        ]
      }
    ]
  },
  {
    "no": 3,
    "code": "KW",
    "label": "Pengembangan Kewirausahaan",
    "aspek": [
      {
        "kode": "3.1",
        "no": 1,
        "unsur": "Menciptakan inovasi yang bermanfaat dan tepat bagi pengembangan madrasah",
        "indikator": [
          {
            "no": 1,
            "indikator": "Memahami dan menghayati arti dan tujuan perubahan (inovasi) madrasah",
            "data": "Adanya bukti perubahan madrasah yang lebih baik dari tahun ke tahun",
            "bukti": "Melalui studi dokumen:\r\nprogram pengembangan kewirausahaan"
          },
          {
            "no": 2,
            "indikator": "Menggunakan metode, teknik dan proses perubahan madrasah",
            "data": "Adanya bukti strategi dalam perubahan madrasah yang lebih baik",
            "bukti": "Melalui obsevasi: (1) pemanfaatan hasil inovasi dan kreatifitas; (2) membudayakan hasil inovasi dan kreatifitas; dan (3) pengembangan pembudayaan inovasi dan kreatifitas."
          },
          {
            "no": 3,
            "indikator": "Menumbuhkan iklim yang mendorong kebebasan berfikir untuk menciptakan kreativitas dan inovasi",
            "data": "Adanya bukti iklim yang mendorong kebebasan berpikir kreatif dan inovatif",
            "bukti": "Melalui observasi dan studi dokumen: (1) data Jenis usaha produktif yang dimiki; dan (2) program pengeloaan dan pendayagunaan hasil usaha."
          },
          {
            "no": 4,
            "indikator": "Mendorong warga madrasah untuk melakukan prakarsa/keberanian moral untuk melakukan hal-hal baru",
            "data": "Adanya bukti warga madrasah yang memiliki keberanian utuk melakukan hal – hal baru",
            "bukti": "Melalui observasi dan studi dokumen: (1) data Jenis usaha produktif yang dimiki; dan (2) program pengeloaan dan pendayagunaan hasil usaha."
          }
        ]
      },
      {
        "kode": "3.2",
        "no": 2,
        "unsur": "Bekerja keras untuk mencapai keberhasilan madrasah sebagai organisasi pembelajaran yang efektif",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mampu bertindak kratif dan inovatif dalam melaksanakan pekerjaan melalui cara berfikir dan cara bertindak",
            "data": "Adanya bukti kegiatan yang kratif dan inovatif dalam melaksanakan pekerjaan melalui cara berfikir dan cara bertindak",
            "bukti": "Melalui observasi dan studi dokumen: (1) RPP yang memuat rencana pembelajaran untuk menumbuhkan keterampilan berpikir dan bertindak kreatif, produktif, kritis, mandiri, kolaboratif, dan komunikatif; (2) hasil kerja dan karya siswa; dan (3) foto foto aktifitas pembelajaran siswa siswa."
          },
          {
            "no": 2,
            "indikator": "Mampu memberdayakan potensi madrasah secara optimal kedalam berbagai kegiatan-kegiatan produktif yang menguntungkan madrasah",
            "data": "Adanya bukti kegiatan  pemberdayaanpotensi madrasah secara optimal kedalam berbagai kegiatan-kegiatan produktif yang menguntungkan madrasah",
            "bukti": "Melalui observasi, wawancara, dan studi dokumen: (1) Rencana Pengembangan Madrasah (RPM) ; (2) dokumen penanganan permasalahan/ kasus; (3) dokumen hasil kegiatan sekolah; (4) dokumen hasil kegiatan; dan (5) pengembangan madrasah."
          },
          {
            "no": 3,
            "indikator": "Mampu menumbuhkan jiwa kewirausahaan (kreatif, inovatif dan produktif) di kalangan warga madrasah",
            "data": "Adanya bukti kegiatan yang membubuhkan jiwa kewirausahaan (kreatif, inovatif dan produktif) di kalangan warga madrasah",
            "bukti": "Melalui observasi, wawancara, dan studi dokumen: (1) Rencana Pengembangan Madrasah (RPM) ; (2) dokumen penanganan permasalahan/ kasus; (3) dokumen hasil kegiatan sekolah; (4) dokumen hasil kegiatan; dan (5) pengembangan madrasah."
          },
          {
            "no": 4,
            "indikator": "Mampu mencatat ide-ide baru, kemudian mengembangkannya",
            "data": "Adanya bukti kegiatan mencatat ide-ide baru, kemudian mengembangkannya",
            "bukti": "Melalui observasi, wawancara, dan studi dokumen:\r\nRencana Pengembangan Madrasah"
          }
        ]
      },
      {
        "kode": "3.3",
        "no": 3,
        "unsur": "Memiliki motivasi yang kuat untuk sukses dalam melaksanakan tugas pokok dan fungsinya sebagai pemimpin madrasah",
        "indikator": [
          {
            "no": 1,
            "indikator": "Bersedia belajar dari orang lain",
            "data": "Adanya bukti kemauan belajar dari orang lain",
            "bukti": "Melalui observasi, wawancara, dan studi dokumen: (1) forum komunikasi dengan lembaga pendidikan lain dan  orang tua siswa per tingkat kelas/kelas/ angkatan; dan (2) foto foto kegiatan."
          },
          {
            "no": 2,
            "indikator": "Ingin selalu melakukan yang terbaik",
            "data": "Adanya bukti keinginan selalu elakukan yang terbaik",
            "bukti": "Melalui observasi, wawancara, dan studi dokumen: (1) dokumen/foto Pelaksanaan kegiatan; (2) keikut sertaan dalam lomba lomba pembelajaran/ pendidikan maupun manajmen; dan (3) prestasi dalam lomba guru, tenaga kependidikan dan kepala madrasah."
          },
          {
            "no": 3,
            "indikator": "Menciptakan perubahan yang kuat",
            "data": "Adanya bukti keinginan untuk melakkukan perubahan yang kuat",
            "bukti": "Melalui observasi, wawancara, dan studi dokumen: (1) program inovasi madrasah atau Rencana Pengenbanagan Madrasah (RPM); dan (2) laporan target yang sudah dicapai."
          }
        ]
      },
      {
        "kode": "3.4",
        "no": 4,
        "unsur": "Pantang menyerah dan selalu mencari solusi terbaik dalam menghadapi kendala yang dihadapi madrasah",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mampu melibatkan tokoh agama, masyarakat, dan pemerintah dalam memecahkan masalah kelembagaan",
            "data": "Adanya bukti kegiatan yang melibatkan tokoh agama, masyarakat dan pemerintah dalam memecahkan masalah kelembagaan",
            "bukti": "Melalui observasi, wawancara, dan studi dokumen: (1) MoU dengan pihak lain; (2) sister school; dan (3) kemitraan dengan sekolah lain"
          },
          {
            "no": 2,
            "indikator": "Mampu bersikap obyektif/tidak memihak dalam mengatasi konflik internal madrasah",
            "data": "Adanya bukti kagiatan yang menunjukkan sikap obyektif/tidak memihak dalam mengatasi konflik internal madrasah",
            "bukti": "Dokumen kegiatan dan foto"
          },
          {
            "no": 3,
            "indikator": "Mampu bersikap simpatik/tenggang rasa terhadap orang lain",
            "data": "Adanya bukti sikap simpatik/ tenggang rasa terhadap orang lain",
            "bukti": "Melalui studi dokumen kegiatan dan foto"
          }
        ]
      },
      {
        "kode": "3.5",
        "no": 5,
        "unsur": "Memiliki naluri kewirausahaan dalam mengelola kegiatan produksi/jasa madrasah sebagai sumber pembelajaran peserta didik",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mampu merencanakan kegiatan produksi /jasa sesuai dengan potensi madrasah",
            "data": "Dokumen perencanaan kegiatan produksi sesuai potensi madrasah",
            "bukti": "Melalui studi dokumen:\r\nlaporan yang memuat pelaksanaan dan hasil Program Pengembangan Unit Produksi Kewirausahaan"
          },
          {
            "no": 2,
            "indikator": "Mampu membina kegiatan produksi /jasa sesuai dengan prinsip-prinsip pengelolaan yang  rofessional dan akuntabel",
            "data": "Adanya dokumen pembinaan kegiatan produksi /jasa sesuai dengan prinsip-prinsip pengelolaan yang  professional dan akuntabel",
            "bukti": "Melalui studi dokumen:\r\nlaporan memuat pelaksanaan dan hasil Program Pengembangan Unit Produksi Kewirausahaan"
          },
          {
            "no": 3,
            "indikator": "Mampu melaksanakan pengawasan kegiatan produksi/jasa dan menyusun laporan",
            "data": "Adanya dokumen pelaksanakan pengawasan kegiatan produksi/jasa dan menyusun laporan",
            "bukti": "Melalui wawancara dan studi dokumen: (1) laporan hasil Evaluasi Program Pengembangan Kewirausahaan, yang memuat hasil evaluasi; (2) Program Pengembangan Jiwa Kewirausahaan; dan (3) Program Pengembangan Unit Produksi Kewirausahaan."
          },
          {
            "no": 4,
            "indikator": "Mampu mengembangkan kegiatan produksi/jasa dan pemasarannya",
            "data": "Adanya dokumen  pengembangan kegiatan produksi/jasa dan pemasarannya",
            "bukti": "Melalui wawancara dan studi dokumen: (1) laporan Hasil Evaluasi Program Pengembangan Kewirausahaan, yang memuat hasil evaluasi; (2) Program Pengembangan Jiwa Kewirausahaan; dan (3) Program Pengembangan Unit Produksi Kewirausahaan."
          }
        ]
      }
    ]
  },
  {
    "no": 4,
    "code": "SP",
    "label": "Supervisi Guru dan Tenaga Kependidikan",
    "aspek": [
      {
        "kode": "4.1",
        "no": 1,
        "unsur": "Menyusun program supervisi akademik dalam rangka peningkatan profesionalisme guru",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mengidentifikasi masalah yang guru hadapi dalam pelaksanaan pembelajaran.",
            "data": "Terdapat  rumusan masalah yang Kepala Madrasah peroleh dari pemantauan perencanaan, pelaksanaan, dan penilaian pembelajaran.",
            "bukti": "Melalui studi dokumen: (1) program pengawasan pembelajaran/ supervisi pembelajaran; (2) jadwal pelaksanaan supervisi; dan (3) SK tim supervisor."
          },
          {
            "no": 2,
            "indikator": "Mampu merumuskan tujuan yang dilengkapi dengan target pencapaian yang terukur.",
            "data": "Terdapat rumusan tujuan supervisi yang dilengkapi dengan target pencapaian yang terukur.",
            "bukti": "Melalui studi dokumen: (1) Program pengawasan pembelajaran/ supervisi pembelajaran; dan (2) jadwal pelaksanaan supervisi."
          },
          {
            "no": 3,
            "indikator": "Mampu mengembangkan instrumen supervisi.",
            "data": "Instrumen yang digunakan relevan dengan target indikator pecapaian tujuan madrasah.",
            "bukti": "Melalui studi dokumen:\r\ninstrumen supervisi pembelajaran"
          }
        ]
      },
      {
        "kode": "4.2",
        "no": 2,
        "unsur": "Melaksanakan supervisi akademik terhadap guru dengan menggunakan pendekatan dan teknik supervisi yang tepat.",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mengadakan pertemuan awal untuk menjaring data rencana pembelajaran dan menetapkan fokus kegiatan supervisi.",
            "data": "Terdapat data hasil pertemuan awal seperti; masalah, tujuan, fokus utama supervisi, dan instrumen yang disepakati",
            "bukti": "Melalui Wawancara dan studi dokumen:\r\nprogram pengawasan pembelajaran/ supervisi pembelajaran"
          },
          {
            "no": 2,
            "indikator": "Melaksanakan kegiatan pemantauan pembelajaran dan membuat catatan yang objektif dan selektif sebagai bahan pemecahan masalah supervisi.",
            "data": "Dokumen  hasil observasi pembelajaran, lengkap, objektif dan selektif serta relevan dengan masalah yang menjadi fokus supervisi.",
            "bukti": "Melalui Wawancara dan studi dokumen: (1) instrumen supervisi pembelajaran; dan (2) dokumen laporan hasil supervisi pembelajaran."
          },
          {
            "no": 3,
            "indikator": "Melakukan pertemuan refleksi, menganalisis catatan hasil observasi, dan menyimpulkan hasil observasi",
            "data": "Dokumen catatan pelaksanaan kegiatan, melaksanakan refleksi, himpunan data hasil superivisi, analisis data, penafsiran, penilaian  keunggulan dan kelemahan, serta rekomendasi perbaikan.",
            "bukti": "Melalui wawancara dan studi dokumen:\r\nanalisis hasil supervisi pembelajaran"
          },
          {
            "no": 4,
            "indikator": "Bersama guru menyusun rekomendasi tindaklanjut perbaikan dalam bentuk kegiatan analisis butir soal, remedial, dan pengayaan.",
            "data": "Data tindak lanjut pelaksanaan supervisi penilaian, bukti analisis butir soal, kegiatan remedial dan pengayaan.",
            "bukti": "Melalui wawancara dan studi dokumen: (1) dokumen hasil analisis dan tindak lanjut supervisi pembelajaran; dan (2) program kegiatan workshop/diklat untuk guru."
          }
        ]
      },
      {
        "kode": "4.3",
        "no": 3,
        "unsur": "Menilai dan menindaklanjuti kegiatan supervisi akademik dalam rangka peningkatan profesionalisme guru.",
        "indikator": [
          {
            "no": 1,
            "indikator": "Memfasilitasi guru dalam merencanakan tindak lanjut perbaikan sistem penilaian hasil belajar.",
            "data": "Terdapat bukti tindak lanjut perbaikan sistem penilaian hasil belajar",
            "bukti": "Melalui Wawancara dan studi dokumen: (1) dokumen hasil analisis dan tindak lanjut supervisi pembelajaran; (2) hasil kegiatan workshop/diklat untuk guru; dan (3) data dan piagam hasil pelatihan guru."
          },
          {
            "no": 2,
            "indikator": "Mengecek ulang keterlaksanaan rekomendasi oleh guru",
            "data": "dokumen rekomendasi perbaikan sistem penilaian hasil belajar secara berkala.",
            "bukti": "Melalui wawancara dan studi dokumen:\r\nrekomendasi Hasil  perbaikan sistem penilaian hasil belajar"
          },
          {
            "no": 3,
            "indikator": "Melaksanakan pembinaan dan pengembangan guru sebagai tindak lanjut kegiatan supervisi.",
            "data": "Terdapat bukti, berupa laporan tindak lanjut hasil supervisi sebagai dasar pelaksanaan pembinaan guru.",
            "bukti": "Terdapat bukti, berupa:\r\nlaporan tindak lanjut hasil supervisi sebagai dasar pelaksanaan pembinaan guru."
          },
          {
            "no": 4,
            "indikator": "Menggunakan data hasil supervisi untuk pemetaan ketercapaian program sebagai dasar perbaikan siklus berikutnya.",
            "data": "Hasil supervisi keterlaksanaan dan ketercapaian program sebagai bahan penilaian kinerja dan pemetaan profil madrasah sebagai dasar perencanaan siklus berikutnya.",
            "bukti": "Hasil supervisi keterlaksanaan dan ketercapaian program sebagai bahan penilaian kinerja dan pemetaan profil madrasah sebagai dasar perencanaan siklus berikutnya."
          }
        ]
      }
    ]
  },
  {
    "no": 5,
    "code": "HK",
    "label": "Hasil Kinerja Kepala Madrasah",
    "aspek": [
      {
        "kode": "5.1",
        "no": 1,
        "unsur": "Prestasi peserta didik",
        "indikator": [
          {
            "no": 1,
            "indikator": "Prestasi akademik peserta didik",
            "data": "Terdapat  prestai akademik peserta didik pada berbagai tingkat",
            "bukti": "Melalui studi piagam dan piala prestasi akademik"
          },
          {
            "no": 2,
            "indikator": "Prestasi non akademik peserta didik",
            "data": "Terdapat  prestai non akademik peserta didik pada berbagai tingkat",
            "bukti": "Melalui studi piagam dan piala prestasi non akademik"
          }
        ]
      },
      {
        "kode": "5.2",
        "no": 2,
        "unsur": "Prestasi Pendidik dan Tenaga Kependidikan",
        "indikator": [
          {
            "no": 1,
            "indikator": "Prestasi akademik pendidik dan tenaga kependidikan",
            "data": "Terdapat  prestai akademik pendidik dan tenaga kependidikan pada berbagai tingkat",
            "bukti": "Melalui studi piagam dan piala prestasi akademik pendidik dan tenaga kependidikan"
          },
          {
            "no": 2,
            "indikator": "Prestasi non akademik  pendidik dan tenaga kependidikan",
            "data": "Terdapat  prestai non akademik pendidik dan tenaga kependidikan pada berbagai tingkat",
            "bukti": "Melalui studi piagam dan piala prestasi non akademik pendidik dan tenaga kependidikan"
          }
        ]
      },
      {
        "kode": "5.3",
        "no": 3,
        "unsur": "Prestasi Madrasah",
        "indikator": [
          {
            "no": 1,
            "indikator": "Kelebihan prestasi akademik dari madrasah/sekolah lainnya",
            "data": "Terdapat bukti keunggulam prestasi akademik madrasah",
            "bukti": "Melalui studi piagam, piala, dan laporan kegiatan lomba akademik yang diikuti"
          },
          {
            "no": 2,
            "indikator": "Kelebihan prestasi non akademik dari madrasah/sekolah lainnya",
            "data": "Terdapat bukti keunggulam prestasi non akademik madrasah",
            "bukti": "Melalui studi piagam, piala, dan laporan kegiatan lomba non akademik yang diikuti"
          }
        ]
      },
      {
        "kode": "5.4",
        "no": 4,
        "unsur": "Prestasi Kepala Madrasah",
        "indikator": [
          {
            "no": 1,
            "indikator": "Ijazah yang dimiliki kepala madrasah",
            "data": "Terdapat bukti ijazah kepala madrasah",
            "bukti": "Bukti dokumen ijazah kepala madrasah"
          },
          {
            "no": 2,
            "indikator": "Pendidikan dan pelatihan yang pernah diikuti oleh kepala madrasah",
            "data": "Terdapat bukti keikutsertaan dalam diklat",
            "bukti": "Bukti dokumen sertifikat diklat"
          },
          {
            "no": 3,
            "indikator": "Penguasaan ICT kepala madrasah",
            "data": "Terdapat bukti penguasaan ICT",
            "bukti": "Praktik penggunaan ICT"
          },
          {
            "no": 4,
            "indikator": "Prestasi yang diraih oleh kepala madrasah",
            "data": "Terdapat bukti prestasi kepala madrasah",
            "bukti": "Bukti piagam, medali, piala"
          },
          {
            "no": 5,
            "indikator": "Kegiatan penelitian kependidikan yang telah dilakukan oleh kepala madrasah",
            "data": "Terdapat bukti karya penelitian kependidikan",
            "bukti": "Bukti karya ilmiah hasil penelitian bidang pendidikan"
          },
          {
            "no": 6,
            "indikator": "Kegiatan pelibatan komite dalam mendukung program madrasah",
            "data": "Terdapat bukti pelibatan komite madrasah dalam mendukung program madrasah",
            "bukti": "Bukti dokumen program kegiatan, laporan rapat-rapat dengan komite madrasah"
          },
          {
            "no": 7,
            "indikator": "Kegiatan kemitraan dengan stakeholder pendidikan dalam meningkatkan kompetensi guru madrasah.",
            "data": "Terdapat bukti kerjasama kemitraan untuk peningkatan kompetensi guru madrasah",
            "bukti": "Bukti dokumen program kegiatan, perjanjian kerjasama kemitraan"
          }
        ]
      }
    ]
  }
];

// Instrumen lengkap untuk role "gtk" (Guru/Tendik & Komite/KKM share instrumen sama)
window.PKKM_INSTRUMEN_GTK = [
  {
    "no": 1,
    "code": "PM",
    "label": "Usaha Pengembangan Madrasah",
    "aspek": [
      {
        "kode": "1.1",
        "no": 1,
        "unsur": "Mengembangkan madrasah sesuai dengan kebutuhan.",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mampu menggembangkan struktur organisasi yang sesuai dengan kebutuhan program.",
            "data": "Dokumen struktur madrasah",
            "bukti": "Melalui observasi dan studi dokumen: (1) bagan/struktur organisasi; (2) notulen rapat yang berisi keputusan tentang penyusunan struktur organisasi; (3) dokumen sosialisasi; dan (4) Daftar Hadir"
          },
          {
            "no": 2,
            "indikator": "Mampu menempatkan personalia yang sesuai dengan kebutuhan",
            "data": "Dokumen uraian tugas personalia di madrasah",
            "bukti": "Melalui studi dokumen: (1) dokumen penetapan/pengesahan susunan organisasi madrsaha; (2) rincian tugas setiap personil pada struktur organisasi madrasah; (3) SOP Personalia; dan (4) Sertifikat"
          },
          {
            "no": 3,
            "indikator": "Mampu mengembangkan pedoman dan prosedur kerja organisasi madrasah",
            "data": "Pedoman dan prosedur kerja organisasi madrasah",
            "bukti": "Melalui obsevasi dokumen: \r\nSOP madrasah"
          }
        ]
      },
      {
        "kode": "1.2",
        "no": 2,
        "unsur": "Mengelola perubahan dan pengembangan madrasah menuju organisasi pembelajar yang efektif.",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mampu mengembangkan program baru untuk meningkatkan pencapaian target yang lebih tinggi.",
            "data": "Program pengembangan madrasah mengandung target pencapaian pada indikator keunggulan khas satuan pendidikan, kerja sama tim, dan data realisasi target yang meningkat daripada pencapaian sebelumnya.",
            "bukti": "Melalui studi dokumen: (1) visi dan Misi madrasah; (2) data prestasi madrasah; (3) data hasil UN 3 tahun terahir; (4) Data Alumni"
          },
          {
            "no": 2,
            "indikator": "Mampu dan terampil dalam membangun tim kerja yang efektif untuk mendapatkan produk kinerja yang lebih unggul.",
            "data": "Terdapat struktur organisasi yang dilengkapi dengan distribusi dan deskripsi pembagian tugas",
            "bukti": "Melalui observasi dan studi dokumen: (1) bagan/struktur organisasi; (2) SK; (3) tugas dan fungsi; (4) Terbentuknya KKG/MGMP; (5) Program KKG/MGMP; dan (6) Laporan kegiatan KKG/MGMP"
          },
          {
            "no": 3,
            "indikator": "Mampu menerapkan berbagai teknik pembaharuan dalam pengelolaan pembelajaran.",
            "data": "Terdapat penerapan strategi pembaharuan dengan strategi yang terprogram",
            "bukti": "Melalui studi dokumen: (1) KTSP; (2) kalender pendidikan; (3) perangkat pembelajaran; (4) penilaian; DAN (5) peraturan akademik"
          },
          {
            "no": 4,
            "indikator": "Mampu mengembangkan potensi dan meningkatkan prestasi madrasah",
            "data": "Dokumen bukti perkembanganpotensi dan prestasi peserta didik, yang meningkat dari waktu ke waktu.",
            "bukti": "Melalui studi dokumen: (1) data prestasi madrasah 1 tahun terahir; (2) data hasil UN 1 tahun terahir; (3)  Dokumen Akreditasi; dan (4) Program Ekstrakurikuler"
          }
        ]
      },
      {
        "kode": "1.3",
        "no": 3,
        "unsur": "Mengelola hubungan antara madrasah dan masyarakat dalam rangka pencarian dukungan ide, sumber belajar, dan pembiayaan.",
        "indikator": [
          {
            "no": 1,
            "indikator": "Merencanakan kerjasama dengan lembaga pemerintah, swasta dan masyarakat",
            "data": "Data kerjasama dengan lembaga pemerintah, swasta, dan masyarakat",
            "bukti": "Melalui studi dokumen: (1) SK komite madasah; (2) AD/ART komite madrasah; (3) program kerja komite madrasah; (4) laporan kegiatan komite madrasah; dan (5) dokumen tertulis kerja sama (MUO)."
          },
          {
            "no": 2,
            "indikator": "Melakukan pendekatan-pendekatan dalam rangka mendapatkan dukungan dari lembaga pemerintah, swasta dan masyarakat",
            "data": "Dokumen pragram kerjasama dengan pemerintah, swasta, dan masyarakat",
            "bukti": "Melalui studi dokumen: (1) Program kegiatan kerja sama; (2) Foto kegiatan; (3) Jadwal Kegiatan; dan (4) Sk Penanggung Jawab program."
          },
          {
            "no": 3,
            "indikator": "Memanfaatkan dan memelihara hubungan kerjasama dengan lembaga pemerintah, swasta dan masyarakat",
            "data": "Data hasil kerjasama dengan lembega pemerintah, swasta, dan masyarakat",
            "bukti": "Melalui studi dokumen: Laporan kegiatan kerja sama"
          }
        ]
      },
      {
        "kode": "1.4",
        "no": 4,
        "unsur": "Mengelola proses pencapaian 8 SNP sesuai dengan arah dan tujuan Pendidikan nasional",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mengaplikasikan pengembangan kurikulum yang mengacu kepada standar isi",
            "data": "Dokumen analisis 8 SNP dalam hal standar ini",
            "bukti": "Melalui studi dokumen: (1) KTSP; (2) kalender pendidikan; (3) perangkat pembelajaran; (4) penilaian; (5) peraturan akademik; dan (6) Buku Kerja Guru."
          },
          {
            "no": 2,
            "indikator": "Mengaplikasikan pengembangan proses pembelajaran yang mengacu kepada standar proses",
            "data": "Dokumen analisis 8 SNP dalam hal standar proses",
            "bukti": "Melalui studi dokumen: (1) dokumen pengembangan silabus; (2) RPP; (2) RPE; (2) buku teks; (2) jurnal mengajar guru; dan (2) data siswa."
          },
          {
            "no": 3,
            "indikator": "Mengaplikasikan sistem penilaian pembelajaran yang mengacu kepada standar penilaian",
            "data": "Dokumen analisis 8 SNP dalam hal standar penilaian",
            "bukti": "Melalui studi dokumen: (1) instrumen penilaian; (2) kisi-kisi soal; (3) kumpulan nakah soal; (4) analisis butir soal; (5) dokumen analisis hasil belajar siswa; (6) laporan hasil belajar siswa; (7) tindak lanjut hasil penilaian; (8) dokumen pelaksanaan PAS; dan (9) dokumen pelaksanaan PAT."
          },
          {
            "no": 4,
            "indikator": "Melaksanakan penjaminan mutu pencapaian standar kompetensi lulusan",
            "data": "Dokumen analisis 8 SNP dalam hal standar kompetensi lulusan",
            "bukti": "Melalui studi dokumen: (1) dokumen program kegiatan kesiswaan; (2) laporan kegiatan kesiswaan; (3) dokumentasi kegiatan kesiswaan; (4) laporan kegiatan pembiasaan siswa; (5) dokumen kegiatan literasi; (6) data rata-rata hasil ujian 2 tahun terahir; (7) data prestasi akademik 2 tahun terahir; dan (8) data prestasi non akademik 2 tahun terahir."
          }
        ]
      },
      {
        "kode": "1.5",
        "no": 5,
        "unsur": "Mengelola unit layanan khusus madrasah dalam mendukung kegiatan pembelajaran dan kegiatan peserta didik di madrasah.",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mampu mengelola laboratorium madrasah agar dapat dimanfaatkan secara optimal untuk kepentingan pembelajaran peerta didik",
            "data": "Adanya bukti pemanfaatan laboratorium dalam pembelajaran, jadwal, kegiatan, dll (Kosongkan jika RA)",
            "bukti": "Observasi dan studi dokumen: (1) luas memenuhi sesuai standar; (2) sarana pendukung lab; (2) jurnal laboratorium; dan (2) Program Pengembangan Sarpras."
          },
          {
            "no": 2,
            "indikator": "Mampu mengelola perpustakaan madrasah dalam menyiiapkan sumber belajar yang diperlukan oleh peserta didik.",
            "data": "Adanya bukti pemanfaatan lperpustakaan dalam pembelajaran, jadwal, kegiatan, dll",
            "bukti": "Observasi dan studi dokumen: (1) luas memenuhi sesuai standar; (2) sarana pendukung; (2) daftar buku induk perpustakaan; dan (2) laporan/statistic pengelolaan perpustakaan."
          },
          {
            "no": 3,
            "indikator": "Mampu mengelola usaha madrasah untuk pembelajaran pesera didik dan pemasukan tambahan dana bagi madrasah.",
            "data": "Adanya bukti kegiatan usaha madrasah dalam pembelajaran.",
            "bukti": "Melalui studi dokumen:\r\ndata/laporan kegiatan usaha madrasah"
          },
          {
            "no": 4,
            "indikator": "Mampu mengelola koperasi madrasah baik sebagai media praktik maupun sebagai sumber belajar bagi peserta didik.",
            "data": "Adanya bukti pemanfaatan koperasi dalam pembelajaran, jadwal, kegiatan, dll",
            "bukti": "Observasi dan studi dokumen: (1) instrumen hasil praktek pembelajaran; dan (2) foto kegiatan praktik"
          }
        ]
      },
      {
        "kode": "1.6",
        "no": 6,
        "unsur": "Mengelola sistem informasi madrasah dalam mendukung penyusunan program dan pengambilan keputusan.",
        "indikator": [
          {
            "no": 1,
            "indikator": "Memanfaatkan teknologi informasi dan komunikasi dalam manajemen madrasah",
            "data": "Adanya bukti pemanfaatan teknologi indformasi dan komunikasi dalam manajemen madrasah",
            "bukti": "Observasi, studi dokumen dan wawancara: (1) fasilitas teknologi dan informasi; dan (2) sumber daya informasi"
          },
          {
            "no": 2,
            "indikator": "Memanfaatkan teknologi informasi dan komunikasi dalam pembelajaran, baik sebagai sumber belajar maupun sebagai alat/media pembelajaran.",
            "data": "Adanya bukti pemanfaatan teknologi indformasi dan komunikasi sebagai sumber belajar dan media pembelajaran",
            "bukti": "Observasi lingkungan madrasah dan wawancara: (1) ketersediaan komputer; (2) jaringan internet; (3) website madrasah; (4) alamat email madrasah; dan (5) pemanfaatn TIK untuk pembelajaran."
          },
          {
            "no": 3,
            "indikator": "Memanfaatkan teknologi teknologi informasi dan komunikasi dalam menjalin kerjasama dengan pihak lain.",
            "data": "Adanya bukti pemanfaatan teknologi informasi dan komunikasi dalam menjalin kerjasama dengan pihak lain",
            "bukti": "Observasi lingkungan madrasah, wawancara dan studi dokumen: (1) pengelolaan SIM; (2) fasilitas SIM; (3) surat tugas pengelola SIM; dan (4) pelaporan data dan informasi."
          },
          {
            "no": 4,
            "indikator": "Memanfaatkan teknologi teknologi informasi dan komunikasi dalam promosi program madrasah dan prestasi yang telah dicapai.",
            "data": "Adanya bukti pemanfaatan teknologi informasi dan komunikasi dalam promosi program madrasah dan prestasi yang dicapai",
            "bukti": "Observasi lingkungan madrasah, wawancara dan studi dokumen: (1) pengelolaan SIM; (2) fasilitas SIM; (3) surat tugas pengelola SIM; dan (4) pelaporan data dan informasi."
          }
        ]
      },
      {
        "kode": "1.7",
        "no": 7,
        "unsur": "Memanfaatkan kemajuan teknologi informasi bagi peningkatan pembelajaran dan manajemen madrasah",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mampu mengembangkan sistem administrasi pengelolaan secara efektif dengan dukungan penerapan teknologi informasi dan komunikasi.",
            "data": "Terdapat penerapan TIK (berbasis komputer, CD, jejaring intranet, internet) dalam pengelolaan administrasi administrasi persuratan, sarana prasarana, kepegawaian, kepeserta didikan, dan keuangan.",
            "bukti": "Observasi lingkungan madrasah dan wawancara: (1) jumlah komputer dan LCD yang cukup; (2) memiliki jaringan internet; (3) memiliki web sekolah; (4) memiliki e-mail madrasah; dan (5) Memanfaatkan TIK untuk adminitrasi madrasah."
          },
          {
            "no": 2,
            "indikator": "Mengelola adminsistasi pembelajaran secara efektif dengan dukungan penerapan teknologi informasi dan komunikasi.",
            "data": "Model penerapan TIK dalam pengelolaan adminsitrasi kurikulum dan pembelajaran, misalnya, pengelolaan kurikulum berbasis komputer, intranet, dan internet.",
            "bukti": "Observasi lingkungan madrasah dan wawancara: (1) jumlah kompute dan LCD yang cukup; (2) memiliki jaringan internet; dan (3) memanfaatkan TIK untuk pembelajaran."
          },
          {
            "no": 3,
            "indikator": "Mampu  mengembangkan sistem pengelolaan perpustakaan secara efektif dengan dukungan penerapan teknologi informasi dan komunikasi.",
            "data": "Model pemanfaatan TIK dalam sistem pengelolaan perpustakaan berbasis komputer, intranet, atau internet.",
            "bukti": "Observasi dan studi dokumen: (1) katalog digital; (2) BSE; (3) akses internet; (4) komputer; dan (5) dokumen aplikasi layanan perpustakaan."
          }
        ]
      }
    ]
  },
  {
    "no": 2,
    "code": "MJ",
    "label": "Pelaksanaan Tugas Manajerial",
    "aspek": [
      {
        "kode": "2.1",
        "no": 1,
        "unsur": "Menyusun perencanaan madrasah untuk berbagai tingkatan perencanaan.",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mampu mengembangkan RKJM, RKT/RKAM dengan program lainnya berdasarkan data hasil evaluasi dalam pemenuhan 8 SNP",
            "data": "Dokumen RKJM, RKT/RKAM yang  meliputi SNP",
            "bukti": "Melalui studi dokumen: (1) Dokumen Evaluasi Diri Madrasah EDM); dan (2) Dokumen RKJM dan RKT berbasis EDM"
          },
          {
            "no": 2,
            "indikator": "Mampu merumuskan visi-misi sebagai arah pengembangan program RKJM, RKT/RKAS dan program lainnya.",
            "data": "Visi-misi madrasah merupakan rumusan hasil keputusan bersama.",
            "bukti": "Melalui studi dokumen: (1) visi, misi yang telah ditetapkan oleh Kamad; dan (2) berita acara dan daftar hadir kegiatan perumusan/ peninjauan kembali dan penetapan visi dan misi."
          },
          {
            "no": 3,
            "indikator": "Mampu menentukan strategi pencapaian tujuan madrasah, dilengkapi dengan indikator pencapaian yang terukur",
            "data": "Dokumen program yang memuat strategi pencapaian tujuan madrasah",
            "bukti": "Melalui studi dokumen: (1) program kerja; dan (2) RKJM dan RKTM"
          },
          {
            "no": 4,
            "indikator": "Mampu menyusun program dengan rencana evaluasi keterlaksanaan dan pencapaian program",
            "data": "Dokumen rencana evaluasi keterlaksanaan dan pencapaian program.",
            "bukti": "Melalui studi dokumen:\r\nRKJM dan RKTM"
          }
        ]
      },
      {
        "kode": "2.2",
        "no": 2,
        "unsur": "Memimpin madrasah dalam rangka pendayagunaan sumber daya madrasah secara optimal.",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mampu memberi contoh berdisiplin; hadir tepat waktu, disiplin menggunakan waktu, dan tepat waktu mengakhiri pekerjaan.",
            "data": "Dokumen daftar hadir semua kegiatan madrasah",
            "bukti": "Observasi, wawancara dan studi dokumen: (1) finggerprint kehadiran kamad; dan (2) daftar hadir pada kegiatan di madrasah"
          },
          {
            "no": 2,
            "indikator": "Mampu melaksanakan peraturan sesuai dengan ketentuan yang berlaku",
            "data": "Menjadi contoh dan mengarahkan guru, staf administrasi, dan peserta didik melaksanakan kegiatan sesuai dengan peraturan",
            "bukti": "Wawancara dengan warga madrasah"
          },
          {
            "no": 3,
            "indikator": "Mampu menunjukkan keteladanan dalam memanfaatkan sumber daya secara efektif dan efisien.",
            "data": "Memecahkan masalah madrasah secara bersama-sama, merencankan pemanfaatan sumber belajar dan sumber informasi, memantau penggunaan sumber daya, dan menilai pemanfaatan sumber daya",
            "bukti": "Wawancara dengan warga madrasah"
          },
          {
            "no": 4,
            "indikator": "Mampu  menunjukkan kedisiplinan sebagai insan pembelajar.",
            "data": "Rajin membaca dan pendengar yang baik, mengekspresikan pikiran secara tertulis, mengkomunikasikan ilmu pengetahuan baru, dan menyediakan berbagai media untuk mengembangkan gagasan warga madrasah",
            "bukti": "Wawancara, observasi: (1) koleksi buku refrefensi/ ilmu pengetahuan; dan (2) karya tulis yang diterbitkan atau tidak"
          }
        ]
      },
      {
        "kode": "2.3",
        "no": 3,
        "unsur": "Menciptakan budaya dan iklim madrasah yang kondusif dan inovatif bagi pembelajaran peserta didik.",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mampu menjadi contoh  dan berbudaya mutu yang kompetitif dalam mendorong peningkatan prestasi akademik dan nonakademik peserta didik",
            "data": "Dokumen peningkatan KKM, target hasil ulangan, hasil UN dan target keunggulan nonakademik peserta didik yang terprogram, terlaksana, dan meningkat hasilnya",
            "bukti": "Wawancara dan studi dokumen: (1) peningkatan KKM; (2) hasil UN; (3) program keunggulan dan inovasi baik akademik maupun non akademik; dan (4) data prestasi akademik dan non akademik."
          },
          {
            "no": 2,
            "indikator": "Mampu melengkapi sarana dan prasarana untuk menciptakan suasana belajar kondusif dan inovatif bagi peserta didik",
            "data": "Suasana lingkungan madrasah yang asri, bersih, rindang, aman, dan menyenangkan peserta didik",
            "bukti": "Observasi lingkungan madrasah:  suasana lingkungan yang asri, bersih, rindang, aman, dan menyenangkan peserta didik"
          },
          {
            "no": 3,
            "indikator": "Mampu memfasilitasi kegiatan-kegiatan untuk meningkatkan budaya baca dan budaya tulis peserta didik.",
            "data": "Data kunjungan perpustakaan, peminjaman buku oleh peserta didik, pembaharuan buku dan bahan bacaan, ketersediaan sumber belajar berbasis TIK, dan sarana publikasi karya tulis, dan mengembangkan kompetisi karya tulis peserta didik tingkat madrasah.",
            "bukti": "Observasi, wawancara dan studi dokumen: (1) rencana dan laporan pelaksanaan kegiatan literasi; (2) dokumen kegiatan pengembangan budaya baca; dan (3) dokumen/ pajangan hasil karya tulis siswa."
          },
          {
            "no": 4,
            "indikator": "Mampu memfasilitasi kegiatan-kegiatan lomba di bidang akademik dan nonakademik bagi peserta didik",
            "data": "Dokumen penyelenggaran kegiatan kompetisi yang dimulai dari tingkat madrasah, perolehan piagam penghargaan, piala, trofi perlombaan bidang akademik dan nonakademik.",
            "bukti": "Observasi dan studi dokumen: (1) dokumen penyelenggaran kegiatan kompetisi yang dimulai dari tingkat madrasah; dan (2) daftar perolehan piagam, penghargaan, piala, trofi perlombaan disemua jenjang."
          }
        ]
      },
      {
        "kode": "2.4",
        "no": 4,
        "unsur": "Mengelola guru dan staf dalam rangka pendayagunaan sumber daya manusia secara optimal.",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mampu menyusun perencanaan pengembangan pendidik dan tenaga kependidikan",
            "data": "Dokumen program pembinaan pendidik dan tenaga kependidikan di madrasah",
            "bukti": "Studi dokumen dan wawancara:\r\nprogram kerja kepala madrasah"
          },
          {
            "no": 2,
            "indikator": "Mampu melakukan pembinaan berkala untuk meningkatkan mutu SDM madrasah",
            "data": "Dokumen pelaksanaan kegiatan pembinaan guru.",
            "bukti": "Studi dokumen dan wawancara: (1) buku/catatan pembinaan guru dan tendik (notulen dan daftar hadir rapat pembinaan); dan (2) laporan kinerja kepala madrasah."
          },
          {
            "no": 3,
            "indikator": "Memfasilitasi guru dan staf administrasi untuk meningkatkan kegiatan pembinaan kompetensi",
            "data": "Data dukungan Kepala Madrasah dalam memfasilitasi staf administrasi untuk meningkatkan mutu profesi.",
            "bukti": "Studi dokumen dan wawancara: (1) buku/catatan pembinaan guru dan tendik (notulen dan daftar hadir rapat pembinaan); dan (2) laporan kinerja kepala madrasah."
          },
          {
            "no": 4,
            "indikator": "Memantau dan menilai penerapan hasil pelatihan dalam pekerjaan di madrasah",
            "data": "Dokumen program evaluasi pelatihan atau pengembangan profesi pendidik dan tenaga kependidikan",
            "bukti": "Observasi dan studi dokumen: (1) program pelatihan pengembangan profesi guru dan tendik; dan (2) laporan pelaksanaan pelatihan pengembangan profesi guru dan tendik"
          }
        ]
      },
      {
        "kode": "2.5",
        "no": 5,
        "unsur": "Mengelola sarana dan prasarana madrasah dalam rangka pendayagunaan secara optimal",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mampu mengelola fasilitas prasarana, perabot dan sarana madrasah (gedung, bangunan, dan lahan meja, kursi, lemari, peralatan kantor, dan alat kebersihan)",
            "data": "Data fasilitas prasarana, perabot, dan sarana marasah dikelola dengan baik",
            "bukti": "Observasi dan studi dokumen: (1) buku inventaris; dan (2) buku pemeliharaan sarana dan prasarana."
          },
          {
            "no": 2,
            "indikator": "Mampu mengelola perpustakaan madrasah",
            "data": "Data perpustakaan dikelola dengan baik",
            "bukti": "Observasi fisik dan studi dokumen: (1) buku induk perpustakaan; dan (2) buku/data/grafik layanan perpustakaan."
          },
          {
            "no": 3,
            "indikator": "Mampu mengelola laboratirium madrasah",
            "data": "Data laboratorium dikelola dengan baik (Kosongkan jika RA)",
            "bukti": "Observasi fisik dan studi dokumen: (1) daftar infentaris laboratorium; dan (2) buku/jurnal/ data/grafik layanan baboratorium"
          },
          {
            "no": 4,
            "indikator": "Mampu mengelola fasilitas penunjang madrasah lainnya (bengkel, toko, koperasi, kebun, dsb)",
            "data": "Data fasilitas penunjang terkola dengan baik",
            "bukti": "Observasi fisik,wawancara dan studi dokumen:\r\ndata fasilitas penunjang wirausaha yang dikelola oleh madrasah"
          }
        ]
      },
      {
        "kode": "2.6",
        "no": 6,
        "unsur": "Mengelola peserta didik dalam rangka penerimaan peserta didik baru, dan penempatan dan pengembangan kapasitas peserta didik",
        "indikator": [
          {
            "no": 1,
            "indikator": "Menyusun perencanaan penerimaan, pengelolaan dan pengembangan kompetensi peserta didik.",
            "data": "Dokumen program penerimaan peserta didik baru, kriteria penerimaan peserta didik, data hasil analisis bekal ajar peserta didik awal,",
            "bukti": "Studi dokumen: (1) dokumen program penerimaan peserta didik baru; (2) brosur; dan (3) data hasil analisis kemampuan peserta didik baru"
          },
          {
            "no": 2,
            "indikator": "Memiliki program pengembangan potensi diri dan prestasi peserta didik.",
            "data": "Dokumen program pengembangan potensi diri dan prestasi peserta didik.",
            "bukti": "Observasi dan studi dokumen:\r\nprogram pengembangan diri peserta didik."
          },
          {
            "no": 3,
            "indikator": "Memfasilitasi kegiatan-kegiatan untuk meningkatkan pembiasaan melalui penanaman nilai-nilai.",
            "data": "Data program kegiatan akademik dan nonakademik melalui penanaman nilai - nilai.",
            "bukti": "Observasi lingkungan aktivitas siswa, wawancara dan studi dokumen: (1) program kegiatan akademik dan non akademik dan laporan pelaksanaannya; dan (2) dokumentasi kegiatan."
          },
          {
            "no": 4,
            "indikator": "Memfasilitasi kegiatan pengembangan diri bagi peserta didik, pendidik, dan tenaga kependidikan lainnya secara optimal",
            "data": "Data keterlaksanaan program pengembangan diri peserta didik, pendidik, dan tenaga kependidikan",
            "bukti": "Observasi lingkungan aktivitas siswa dan guru, wawancara dan studi dokumen: (1) program kegiatan pengembangan diri; (2) dokumentasi kegiatan; dan (3) data prestasi siswa, guru dan tendik."
          }
        ]
      },
      {
        "kode": "2.7",
        "no": 7,
        "unsur": "Mengelola pengembangan kurikulum dan kegiatan pembelajaran sesuai dengan arah dan tujuan pendidikan nasional",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mampu mengarahkan secara efektif dalam menerapkan prinsip-prinsip pengengembangan KTSP dalam kegiatan IHT, Workshop, Rapat Koordinasi, dan kegiatan MGMP/KKG.",
            "data": "Dokumen hasil pengembangan kurikulum yang disusun melalui rapat kerja, IHT, Workshop, Rakor, atau kegiatan MGMP/KKG",
            "bukti": "Studi dokumen: (1) dokumen kurikulum yang berlaku; (2) SK tim pengembang kurikulum; dan (3) dokumen penyusunan dokumen kurikulum (daftar hadir, berita acara, notulen)."
          },
          {
            "no": 2,
            "indikator": "Mampu mengendalikan pelaksanaan KTSP berlandaskan kalender pendidikan, menerbitkan surat keputusan pembagian tugas mengajar, dan menerapkan aturan akademik.",
            "data": "Pelaksanaan kurikulum sesuai dengan kalender pendidikan tingkat madrasah, surat keputusan pembagian tugas mengajar, dan aturan akademik.",
            "bukti": "Studi dokumen: (1) struktur kurikulum; (2) jadwal pelajaran; (3) daftar hadir guru; dan (4) peraturan akademik"
          },
          {
            "no": 3,
            "indikator": "Memfasilitasi efektivitas tim kerja guru dalam rangka meningkatkan mutu pembelajaran.",
            "data": "Bukti pelaksanaan kerja sama guru pada tingkat satuan pendidikan, antar satuan pendidikan dalam meningkatkan mutu perencanaan, proses, pembelajaran",
            "bukti": "Studi dokumen: (1) program KKG/MGMP di madrasah; dan (2) laporan pelaksanaan KKG/MGMP."
          },
          {
            "no": 4,
            "indikator": "Mampu mengembangkan pelayanan belajar yang inovatif melalui pengembangan perangkat dan sumber belajar yang terbarukan.",
            "data": "Bukti penggunaan metode hasil pelatihan paling akhir, memanfaatkan teknologi informasi dan komunikasi, penggunaan alat peraga, teknik evaluasi baru yang menghasilkan produk belajar peserta didik yang dipublikasikan di lingkungan madrasah atau media lain",
            "bukti": "Observasi kelas, studi dokumen wawancara dengan siswa dan guru:\r\nmenelaah ragam metode, media dan sumber belajar yang digunakan dalam RPP"
          },
          {
            "no": 5,
            "indikator": "Memfasilitasi peserta didik dalam mengembangkan kolaborasi dan kompetisi bidang akademik dan nonakademik",
            "data": "Data kegiatan kolaborasi dan kompetisi peserta didik tingkat madrasah, baik akademik dan non akademik.",
            "bukti": "Wawancara dan studi dokumen: (1) program, laporan dan dokumen kegiatan kesiswaan (kegiatan akademik maupun non akademik); dan (2) data prestasi akademik maupun nonakademik."
          }
        ]
      },
      {
        "kode": "2.8",
        "no": 8,
        "unsur": "Mengelola keuangan madrasah sesuai dengan prinsip pengelolaan yang akuntabel, transparan, dan efisien",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mampu merencanakan kebutuhan keuangan madrasah sesuai dengan rencana pengembangan madrasah, baik jangka pendek maupun jangka panjang",
            "data": "Dokumen RKJM dan RKTM",
            "bukti": "Studi dokumen: (1) RKJM dan RKTM; (2) laporan keuangan; dan (3) buku kas."
          },
          {
            "no": 2,
            "indikator": "Mampu mengupayaan sumber-sumber keuangan terutama dari luar madrasah dan dari unit usaha madrasah",
            "data": "Dokumen RKJM dan RKTM",
            "bukti": "Studi dokumen RKJM dan RKTM."
          },
          {
            "no": 3,
            "indikator": "Mampu mengkoordinasikan pembelajaran keuangan sesuai dengan peraturan dan perundang-undangan berdasarkan asas prioritas dan efisiensi.",
            "data": "Dokumen RKJM dan RKTM",
            "bukti": "Studi dokumen RKJM dan RKTM."
          },
          {
            "no": 4,
            "indikator": "Mampu membuat laporan dan evaluasi pengelolaan keuangan madrasah sesuai dengan prinsip efisien, tranparan, dan akuntabel.",
            "data": "Dokumen RKJM dan RKTM",
            "bukti": "Studi dokumen: (1) RKJM dan RKTM; (2) laporan keuangan; dan (3) buku kas."
          }
        ]
      },
      {
        "kode": "2.9",
        "no": 9,
        "unsur": "Mengelola ketatausahaan madrasah dalam mendukung pencapaian tujuan madrasah",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mampu mengelola administrasi surat masuk dan surat keluar sesuai dengan pedoman persuratan yang berlaku",
            "data": "Adanya bukti dokumen surat masuk dan keluar",
            "bukti": "Melalui studi dokumen:\r\nsurat masuk dan keluar"
          },
          {
            "no": 2,
            "indikator": "Mampu mengelola administrasi madrasah yang meliputi administrasi akademik, kesiswaan, sarana/prasarana, keuangan, dan hubungan madrasah dengan masyarakat",
            "data": "Adanya bukti dokumen administrasi madrasah",
            "bukti": "Melalui studi dokumen:\r\nadministrasi madrasah (akademik, kesiswaan, sarana/prasaran, keuangan, dan hubungan madrasah dengan masyarakat)"
          },
          {
            "no": 3,
            "indikator": "Mampu mengelola administrasi kearsipan madrasah baik arsip dinamis maupun arsip lainnya",
            "data": "Adanya bukti dokumen administrasi madrasah",
            "bukti": "Melalui studi Dokumen:\r\nAdministrasi madrasah"
          },
          {
            "no": 4,
            "indikator": "Mampu mengelola administrasi akreditasi madrasah sesuai dengan prinsip-prinsip tersedianya dokumen pendukung dan bukti fisik",
            "data": "Adanya bukti dokumen administrasi madrasah",
            "bukti": "Melalui studi Dokumen:\r\nAdministrasi pemenuhan 8 SNP madrasah"
          }
        ]
      },
      {
        "kode": "2.10",
        "no": 10,
        "unsur": "Melakukan monitoring, evaluasi, dan pelaporan pelaksanaan program kegiatan madrasah dengan prosedur yang tepat, serta merencanakan tindak lanjutnya.",
        "indikator": [
          {
            "no": 1,
            "indikator": "Menyusun standar kinerja program pendidikan yang dapat diukur dan dinilai",
            "data": "Dokumen SKP yang terukur",
            "bukti": "Melalui studi dokumen:\r\nSKP yang terukur"
          },
          {
            "no": 2,
            "indikator": "Melakukan monitoring dan evaluasi kinerja program pendidikan dengan menggunakan teknik yang sesuai",
            "data": "Dokumen pelaksanaan monitoring dan evaluasi  yang sesuai",
            "bukti": "Melalui studi dokumen:\r\npelaksanaan monitoring dan evaluasi  yang sesuai"
          },
          {
            "no": 3,
            "indikator": "Menyusun laporan sesuai dengan standar pelaporan monitoring dan evaluasi",
            "data": "Dokumen laporan pelaksanaan monitoring dan evaluasi",
            "bukti": "Melalui studi dokumen:\r\nLaporan pelaksanaan monitoring dan evaluasi"
          },
          {
            "no": 4,
            "indikator": "Merumuskan program tindak lanjut berdasarkan hasil evaluasi pelaksanaan program sebelumnya",
            "data": "Dokumen program tindak lanjut berdasarkan hasil  monitring dan evaluasi",
            "bukti": "Melalui studi dokumen:\r\nProgram tindak lanjut berdasarkan hasil  monitring dan evaluasi"
          }
        ]
      }
    ]
  },
  {
    "no": 3,
    "code": "KW",
    "label": "Pengembangan Kewirausahaan",
    "aspek": [
      {
        "kode": "3.1",
        "no": 1,
        "unsur": "Menciptakan inovasi yang bermanfaat dan tepat bagi pengembangan madrasah",
        "indikator": [
          {
            "no": 1,
            "indikator": "Memahami dan menghayati arti dan tujuan perubahan (inovasi) madrasah",
            "data": "Adanya bukti perubahan madrasah yang lebih baik dari tahun ke tahun",
            "bukti": "Melalui studi dokumen:\r\nprogram pengembangan kewirausahaan"
          },
          {
            "no": 2,
            "indikator": "Menggunakan metode, teknik dan proses perubahan madrasah",
            "data": "Adanya bukti strategi dalam perubahan madrasah yang lebih baik",
            "bukti": "Melalui obsevasi: (1) pemanfaatan hasil inovasi dan kreatifitas; (2) membudayakan hasil inovasi dan kreatifitas; dan (3) pengembangan pembudayaan inovasi dan kreatifitas."
          },
          {
            "no": 3,
            "indikator": "Menumbuhkan iklim yang mendorong kebebasan berfikir untuk menciptakan kreativitas dan inovasi",
            "data": "Adanya bukti iklim yang mendorong kebebasan berpikir kreatif dan inovatif",
            "bukti": "Melalui observasi dan studi dokumen: (1) data Jenis usaha produktif yang dimiki; dan (2) program pengeloaan dan pendayagunaan hasil usaha."
          },
          {
            "no": 4,
            "indikator": "Mendorong warga madrasah untuk melakukan prakarsa/keberanian moral untuk melakukan hal-hal baru",
            "data": "Adanya bukti warga madrasah yang memiliki keberanian utuk melakukan hal – hal baru",
            "bukti": "Melalui observasi dan studi dokumen: (1) data Jenis usaha produktif yang dimiki; dan (2) program pengeloaan dan pendayagunaan hasil usaha."
          }
        ]
      },
      {
        "kode": "3.2",
        "no": 2,
        "unsur": "Bekerja keras untuk mencapai keberhasilan madrasah sebagai organisasi pembelajaran yang efektif",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mampu bertindak kratif dan inovatif dalam melaksanakan pekerjaan melalui cara berfikir dan cara bertindak",
            "data": "Adanya bukti kegiatan yang kratif dan inovatif dalam melaksanakan pekerjaan melalui cara berfikir dan cara bertindak",
            "bukti": "Melalui observasi dan studi dokumen: (1) RPP yang memuat rencana pembelajaran untuk menumbuhkan keterampilan berpikir dan bertindak kreatif, produktif, kritis, mandiri, kolaboratif, dan komunikatif; (2) hasil kerja dan karya siswa; dan (3) foto foto aktifitas pembelajaran siswa siswa."
          },
          {
            "no": 2,
            "indikator": "Mampu memberdayakan potensi madrasah secara optimal kedalam berbagai kegiatan-kegiatan produktif yang menguntungkan madrasah",
            "data": "Adanya bukti kegiatan  pemberdayaanpotensi madrasah secara optimal kedalam berbagai kegiatan-kegiatan produktif yang menguntungkan madrasah",
            "bukti": "Melalui observasi, wawancara, dan studi dokumen: (1) Rencana Pengembangan Madrasah (RPM) ; (2) dokumen penanganan permasalahan/ kasus; (3) dokumen hasil kegiatan sekolah; (4) dokumen hasil kegiatan; dan (5) pengembangan madrasah."
          },
          {
            "no": 3,
            "indikator": "Mampu menumbuhkan jiwa kewirausahaan (kreatif, inovatif dan produktif) di kalangan warga madrasah",
            "data": "Adanya bukti kegiatan yang membubuhkan jiwa kewirausahaan (kreatif, inovatif dan produktif) di kalangan warga madrasah",
            "bukti": "Melalui observasi, wawancara, dan studi dokumen: (1) Rencana Pengembangan Madrasah (RPM) ; (2) dokumen penanganan permasalahan/ kasus; (3) dokumen hasil kegiatan sekolah; (4) dokumen hasil kegiatan; dan (5) pengembangan madrasah."
          },
          {
            "no": 4,
            "indikator": "Mampu mencatat ide-ide baru, kemudian mengembangkannya",
            "data": "Adanya bukti kegiatan mencatat ide-ide baru, kemudian mengembangkannya",
            "bukti": "Melalui observasi, wawancara, dan studi dokumen:\r\nRencana Pengembangan Madrasah"
          }
        ]
      },
      {
        "kode": "3.3",
        "no": 3,
        "unsur": "Memiliki motivasi yang kuat untuk sukses dalam melaksanakan tugas pokok dan fungsinya sebagai pemimpin madrasah",
        "indikator": [
          {
            "no": 1,
            "indikator": "Bersedia belajar dari orang lain",
            "data": "Adanya bukti kemauan belajar dari orang lain",
            "bukti": "Melalui observasi, wawancara, dan studi dokumen: (1) forum komunikasi dengan lembaga pendidikan lain dan  orang tua siswa per tingkat kelas/kelas/ angkatan; dan (2) foto foto kegiatan."
          },
          {
            "no": 2,
            "indikator": "Ingin selalu melakukan yang terbaik",
            "data": "Adanya bukti keinginan selalu elakukan yang terbaik",
            "bukti": "Melalui observasi, wawancara, dan studi dokumen: (1) dokumen/foto Pelaksanaan kegiatan; (2) keikut sertaan dalam lomba lomba pembelajaran/ pendidikan maupun manajmen; dan (3) prestasi dalam lomba guru, tenaga kependidikan dan kepala madrasah."
          },
          {
            "no": 3,
            "indikator": "Menciptakan perubahan yang kuat",
            "data": "Adanya bukti keinginan untuk melakkukan perubahan yang kuat",
            "bukti": "Melalui observasi, wawancara, dan studi dokumen: (1) program inovasi madrasah atau Rencana Pengenbanagan Madrasah (RPM); dan (2) laporan target yang sudah dicapai."
          }
        ]
      },
      {
        "kode": "3.4",
        "no": 4,
        "unsur": "Pantang menyerah dan selalu mencari solusi terbaik dalam menghadapi kendala yang dihadapi madrasah",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mampu melibatkan tokoh agama, masyarakat, dan pemerintah dalam memecahkan masalah kelembagaan",
            "data": "Adanya bukti kegiatan yang melibatkan tokoh agama, masyarakat dan pemerintah dalam memecahkan masalah kelembagaan",
            "bukti": "Melalui observasi, wawancara, dan studi dokumen: (1) MoU dengan pihak lain; (2) sister school; dan (3) kemitraan dengan sekolah lain"
          },
          {
            "no": 2,
            "indikator": "Mampu bersikap obyektif/tidak memihak dalam mengatasi konflik internal madrasah",
            "data": "Adanya bukti kagiatan yang menunjukkan sikap obyektif/tidak memihak dalam mengatasi konflik internal madrasah",
            "bukti": "Dokumen kegiatan dan foto"
          },
          {
            "no": 3,
            "indikator": "Mampu bersikap simpatik/tenggang rasa terhadap orang lain",
            "data": "Adanya bukti sikap simpatik/ tenggang rasa terhadap orang lain",
            "bukti": "Melalui studi dokumen kegiatan dan foto"
          }
        ]
      },
      {
        "kode": "3.5",
        "no": 5,
        "unsur": "Memiliki naluri kewirausahaan dalam mengelola kegiatan produksi/jasa madrasah sebagai sumber pembelajaran peserta didik",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mampu merencanakan kegiatan produksi /jasa sesuai dengan potensi madrasah",
            "data": "Dokumen perencanaan kegiatan produksi sesuai potensi madrasah",
            "bukti": "Melalui studi dokumen:\r\nlaporan yang memuat pelaksanaan dan hasil Program Pengembangan Unit Produksi Kewirausahaan"
          },
          {
            "no": 2,
            "indikator": "Mampu membina kegiatan produksi /jasa sesuai dengan prinsip-prinsip pengelolaan yang  rofessional dan akuntabel",
            "data": "Adanya dokumen pembinaan kegiatan produksi /jasa sesuai dengan prinsip-prinsip pengelolaan yang  professional dan akuntabel",
            "bukti": "Melalui studi dokumen:\r\nlaporan memuat pelaksanaan dan hasil Program Pengembangan Unit Produksi Kewirausahaan"
          },
          {
            "no": 3,
            "indikator": "Mampu melaksanakan pengawasan kegiatan produksi/jasa dan menyusun laporan",
            "data": "Adanya dokumen pelaksanakan pengawasan kegiatan produksi/jasa dan menyusun laporan",
            "bukti": "Melalui wawancara dan studi dokumen: (1) laporan hasil Evaluasi Program Pengembangan Kewirausahaan, yang memuat hasil evaluasi; (2) Program Pengembangan Jiwa Kewirausahaan; dan (3) Program Pengembangan Unit Produksi Kewirausahaan."
          },
          {
            "no": 4,
            "indikator": "Mampu mengembangkan kegiatan produksi/jasa dan pemasarannya",
            "data": "Adanya dokumen  pengembangan kegiatan produksi/jasa dan pemasarannya",
            "bukti": "Melalui wawancara dan studi dokumen: (1) laporan Hasil Evaluasi Program Pengembangan Kewirausahaan, yang memuat hasil evaluasi; (2) Program Pengembangan Jiwa Kewirausahaan; dan (3) Program Pengembangan Unit Produksi Kewirausahaan."
          }
        ]
      }
    ]
  },
  {
    "no": 4,
    "code": "SP",
    "label": "Supervisi Guru dan Tenaga Kependidikan",
    "aspek": [
      {
        "kode": "4.1",
        "no": 1,
        "unsur": "Menyusun program supervisi akademik dalam rangka peningkatan profesionalisme guru",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mengidentifikasi masalah yang guru hadapi dalam pelaksanaan pembelajaran.",
            "data": "Terdapat  rumusan masalah yang Kepala Madrasah peroleh dari pemantauan perencanaan, pelaksanaan, dan penilaian pembelajaran.",
            "bukti": "Melalui studi dokumen: (1) program pengawasan pembelajaran/ supervisi pembelajaran; (2) jadwal pelaksanaan supervisi; dan (3) SK tim supervisor."
          },
          {
            "no": 2,
            "indikator": "Mampu merumuskan tujuan yang dilengkapi dengan target pencapaian yang terukur.",
            "data": "Terdapat rumusan tujuan supervisi yang dilengkapi dengan target pencapaian yang terukur.",
            "bukti": "Melalui studi dokumen: (1) Program pengawasan pembelajaran/ supervisi pembelajaran; dan (2) jadwal pelaksanaan supervisi."
          },
          {
            "no": 3,
            "indikator": "Mampu mengembangkan instrumen supervisi.",
            "data": "Instrumen yang digunakan relevan dengan target indikator pecapaian tujuan madrasah.",
            "bukti": "Melalui studi dokumen:\r\ninstrumen supervisi pembelajaran"
          }
        ]
      },
      {
        "kode": "4.2",
        "no": 2,
        "unsur": "Melaksanakan supervisi akademik terhadap guru dengan menggunakan pendekatan dan teknik supervisi yang tepat.",
        "indikator": [
          {
            "no": 1,
            "indikator": "Mengadakan pertemuan awal untuk menjaring data rencana pembelajaran dan menetapkan fokus kegiatan supervisi.",
            "data": "Terdapat data hasil pertemuan awal seperti; masalah, tujuan, fokus utama supervisi, dan instrumen yang disepakati",
            "bukti": "Melalui Wawancara dan studi dokumen:\r\nprogram pengawasan pembelajaran/ supervisi pembelajaran"
          },
          {
            "no": 2,
            "indikator": "Melaksanakan kegiatan pemantauan pembelajaran dan membuat catatan yang objektif dan selektif sebagai bahan pemecahan masalah supervisi.",
            "data": "Dokumen  hasil observasi pembelajaran, lengkap, objektif dan selektif serta relevan dengan masalah yang menjadi fokus supervisi.",
            "bukti": "Melalui Wawancara dan studi dokumen: (1) instrumen supervisi pembelajaran; dan (2) dokumen laporan hasil supervisi pembelajaran."
          },
          {
            "no": 3,
            "indikator": "Melakukan pertemuan refleksi, menganalisis catatan hasil observasi, dan menyimpulkan hasil observasi",
            "data": "Dokumen catatan pelaksanaan kegiatan, melaksanakan refleksi, himpunan data hasil superivisi, analisis data, penafsiran, penilaian  keunggulan dan kelemahan, serta rekomendasi perbaikan.",
            "bukti": "Melalui wawancara dan studi dokumen:\r\nanalisis hasil supervisi pembelajaran"
          },
          {
            "no": 4,
            "indikator": "Bersama guru menyusun rekomendasi tindaklanjut perbaikan dalam bentuk kegiatan analisis butir soal, remedial, dan pengayaan.",
            "data": "Data tindak lanjut pelaksanaan supervisi penilaian, bukti analisis butir soal, kegiatan remedial dan pengayaan.",
            "bukti": "Melalui wawancara dan studi dokumen: (1) dokumen hasil analisis dan tindak lanjut supervisi pembelajaran; dan (2) program kegiatan workshop/diklat untuk guru."
          }
        ]
      },
      {
        "kode": "4.3",
        "no": 3,
        "unsur": "Menilai dan menindaklanjuti kegiatan supervisi akademik dalam rangka peningkatan profesionalisme guru.",
        "indikator": [
          {
            "no": 1,
            "indikator": "Memfasilitasi guru dalam merencanakan tindak lanjut perbaikan sistem penilaian hasil belajar.",
            "data": "Terdapat bukti tindak lanjut perbaikan sistem penilaian hasil belajar",
            "bukti": "Melalui Wawancara dan studi dokumen: (1) dokumen hasil analisis dan tindak lanjut supervisi pembelajaran; (2) hasil kegiatan workshop/diklat untuk guru; dan (3) data dan piagam hasil pelatihan guru."
          },
          {
            "no": 2,
            "indikator": "Mengecek ulang keterlaksanaan rekomendasi oleh guru",
            "data": "dokumen rekomendasi perbaikan sistem penilaian hasil belajar secara berkala.",
            "bukti": "Melalui wawancara dan studi dokumen:\r\nrekomendasi Hasil  perbaikan sistem penilaian hasil belajar"
          },
          {
            "no": 3,
            "indikator": "Melaksanakan pembinaan dan pengembangan guru sebagai tindak lanjut kegiatan supervisi.",
            "data": "Terdapat bukti, berupa laporan tindak lanjut hasil supervisi sebagai dasar pelaksanaan pembinaan guru.",
            "bukti": "Terdapat bukti, berupa:\r\nlaporan tindak lanjut hasil supervisi sebagai dasar pelaksanaan pembinaan guru."
          },
          {
            "no": 4,
            "indikator": "Menggunakan data hasil supervisi untuk pemetaan ketercapaian program sebagai dasar perbaikan siklus berikutnya.",
            "data": "Hasil supervisi keterlaksanaan dan ketercapaian program sebagai bahan penilaian kinerja dan pemetaan profil madrasah sebagai dasar perencanaan siklus berikutnya.",
            "bukti": "Hasil supervisi keterlaksanaan dan ketercapaian program sebagai bahan penilaian kinerja dan pemetaan profil madrasah sebagai dasar perencanaan siklus berikutnya."
          }
        ]
      }
    ]
  },
  {
    "no": 5,
    "code": "HK",
    "label": "Hasil Kinerja Kepala Madrasah",
    "aspek": [
      {
        "kode": "5.1",
        "no": 1,
        "unsur": "Prestasi peserta didik",
        "indikator": [
          {
            "no": 1,
            "indikator": "Prestasi akademik peserta didik",
            "data": "Terdapat  prestai akademik peserta didik pada berbagai tingkat",
            "bukti": "Melalui studi piagam dan piala prestasi akademik"
          },
          {
            "no": 2,
            "indikator": "Prestasi non akademik peserta didik",
            "data": "Terdapat  prestai non akademik peserta didik pada berbagai tingkat",
            "bukti": "Melalui studi piagam dan piala prestasi non akademik"
          }
        ]
      },
      {
        "kode": "5.2",
        "no": 2,
        "unsur": "Prestasi Pendidik dan Tenaga Kependidikan",
        "indikator": [
          {
            "no": 1,
            "indikator": "Prestasi akademik pendidik dan tenaga kependidikan",
            "data": "Terdapat  prestai akademik pendidik dan tenaga kependidikan pada berbagai tingkat",
            "bukti": "Melalui studi piagam dan piala prestasi akademik pendidik dan tenaga kependidikan"
          },
          {
            "no": 2,
            "indikator": "Prestasi non akademik  pendidik dan tenaga kependidikan",
            "data": "Terdapat  prestai non akademik pendidik dan tenaga kependidikan pada berbagai tingkat",
            "bukti": "Melalui studi piagam dan piala prestasi non akademik pendidik dan tenaga kependidikan"
          }
        ]
      },
      {
        "kode": "5.3",
        "no": 3,
        "unsur": "Prestasi Madrasah",
        "indikator": [
          {
            "no": 1,
            "indikator": "Kelebihan prestasi akademik dari madrasah/sekolah lainnya",
            "data": "Terdapat bukti keunggulam prestasi akademik madrasah",
            "bukti": "Melalui studi piagam, piala, dan laporan kegiatan lomba akademik yang diikuti"
          },
          {
            "no": 2,
            "indikator": "Kelebihan prestasi non akademik dari madrasah/sekolah lainnya",
            "data": "Terdapat bukti keunggulam prestasi non akademik madrasah",
            "bukti": "Melalui studi piagam, piala, dan laporan kegiatan lomba non akademik yang diikuti"
          }
        ]
      },
      {
        "kode": "5.4",
        "no": 4,
        "unsur": "Prestasi Kepala Madrasah",
        "indikator": [
          {
            "no": 1,
            "indikator": "Ijazah yang dimiliki kepala madrasah",
            "data": "Terdapat bukti ijazah kepala madrasah",
            "bukti": "Bukti dokumen ijazah kepala madrasah"
          },
          {
            "no": 2,
            "indikator": "Pendidikan dan pelatihan yang pernah diikuti oleh kepala madrasah",
            "data": "Terdapat bukti keikutsertaan dalam diklat",
            "bukti": "Bukti dokumen sertifikat diklat"
          },
          {
            "no": 3,
            "indikator": "Penguasaan ICT kepala madrasah",
            "data": "Terdapat bukti penguasaan ICT",
            "bukti": "Praktik penggunaan ICT"
          },
          {
            "no": 4,
            "indikator": "Prestasi yang diraih oleh kepala madrasah",
            "data": "Terdapat bukti prestasi kepala madrasah",
            "bukti": "Bukti piagam, medali, piala"
          },
          {
            "no": 5,
            "indikator": "Kegiatan penelitian kependidikan yang telah dilakukan oleh kepala madrasah",
            "data": "Terdapat bukti karya penelitian kependidikan",
            "bukti": "Bukti karya ilmiah hasil penelitian bidang pendidikan"
          },
          {
            "no": 6,
            "indikator": "Kegiatan pelibatan komite dalam mendukung program madrasah",
            "data": "Terdapat bukti pelibatan komite madrasah dalam mendukung program madrasah",
            "bukti": "Bukti dokumen program kegiatan, laporan rapat-rapat dengan komite madrasah"
          },
          {
            "no": 7,
            "indikator": "Kegiatan kemitraan dengan stakeholder pendidikan dalam meningkatkan kompetensi guru madrasah.",
            "data": "Terdapat bukti kerjasama kemitraan untuk peningkatan kompetensi guru madrasah",
            "bukti": "Bukti dokumen program kegiatan, perjanjian kerjasama kemitraan"
          }
        ]
      }
    ]
  }
];

// Default role aktif untuk SPA (pengawas)
window.PKKM_KOMPONEN = window.PKKM_INSTRUMEN_PENGAWAS;

// Helper: switch role
window.setInstrumenRole = function(role) {
  if (role === 'gtk') window.PKKM_KOMPONEN = window.PKKM_INSTRUMEN_GTK;
  else window.PKKM_KOMPONEN = window.PKKM_INSTRUMEN_PENGAWAS;
  window.PKKM_TOTAL_INDIKATOR = window.PKKM_KOMPONEN.reduce(
    (s,k) => s + k.aspek.reduce((s2,a) => s2 + a.indikator.length, 0), 0
  );
};

// Sebutan / kategori berdasarkan nilai akhir 0-100
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

// Build flat list of all indikator with composite id "PM_1.1_1" (komponen.aspek.indikator)
window.flattenIndikator = function() {
  const out = [];
  for (const k of window.PKKM_KOMPONEN) {
    for (const a of k.aspek) {
      for (const ind of a.indikator) {
        out.push({
          id: `${k.code}_${a.kode}_${ind.no}`,
          komponen_code: k.code, komponen_no: k.no, komponen_label: k.label,
          aspek_kode: a.kode, aspek_no: a.no, aspek_unsur: a.unsur,
          ind_no: ind.no, indikator: ind.indikator, data: ind.data, bukti: ind.bukti,
        });
      }
    }
  }
  return out;
};

// Lookup by composite id
window.getIndikatorById = function(id) {
  if (!id) return null;
  // id format: "PM_1.1_1"
  const parts = String(id).split('_');
  if (parts.length < 3) return null;
  const code = parts[0], aspek_kode = parts[1], ind_no = parseInt(parts[2], 10);
  const k = window.PKKM_KOMPONEN.find(x => x.code === code);
  if (!k) return null;
  const a = k.aspek.find(x => x.kode === aspek_kode);
  if (!a) return null;
  const ind = a.indikator.find(x => x.no === ind_no);
  if (!ind) return null;
  return { komponen: k, aspek: a, indikator: ind };
};

// Initialize total
window.PKKM_TOTAL_INDIKATOR = window.PKKM_KOMPONEN.reduce(
  (s,k) => s + k.aspek.reduce((s2,a) => s2 + a.indikator.length, 0), 0
);

window.PKKM_JENJANG = ['MI', 'MTs', 'MA', 'RA'];

window.PKKM_PERIODE_TYPES = [
  { code: 'tahun_1', label: 'Tahun Pertama' },
  { code: 'tahun_2', label: 'Tahun Kedua' },
  { code: 'tahun_3', label: 'Tahun Ketiga' },
  { code: 'tahun_4', label: 'Tahun Keempat' },
  { code: 'formatif', label: 'Formatif (Awal Tahun)' },
  { code: 'sumatif',  label: 'Sumatif (Akhir Tahun)' },
];

// Role assessor
window.PKKM_ROLES = [
  { code: 'pengawas_1', label: 'Pengawas Madrasah I',  instrumen: 'pengawas' },
  { code: 'pengawas_2', label: 'Pengawas Madrasah II', instrumen: 'pengawas' },
  { code: 'guru_1',     label: 'Guru/Tendik I',        instrumen: 'gtk' },
  { code: 'guru_2',     label: 'Guru/Tendik II',       instrumen: 'gtk' },
  { code: 'komite',     label: 'Komite/KKM',           instrumen: 'gtk' },
];
