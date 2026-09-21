// instrumen-ra.js — Instrumen PKKM KHUSUS KEPALA RA (Raudhatul Athfal)
// Versi adaptif regulasi terbaru 2026.
//
// Kerangka & STRUKTUR penilaian tetap mengikuti Kepdirjen Pendis 1111/2019
// (4 komponen tahunan + 1 komponen hasil kinerja untuk 4-tahunan).
// ISI indikator dimodernisasi mengacu:
//   - KMA 1503/2025 (perubahan KMA 450/2024) → Kurikulum Madrasah (KM) RA
//   - Kepdirjen Pendis 6077/2025 → Panca Cinta / Kurikulum Berbasis Cinta
//   - Permendikdasmen 21/2025 Pasal 14 → kompetensi kepala satuan pendidikan
//   - Permendikdasmen 10/2025, 12/2025, 26/2025, 1/2026 → standar PAUD terbaru
//
// Struktur: 5 komponen × 29 sub-aspek × 1 indikator per sub-aspek (total 29 indikator).
// Skala skor 1–4 (1 Kurang, 2 Cukup, 3 Baik, 4 Sangat Baik).
// ID indikator mengikuti pola existing: `${komponen}_${aspek}_1` (mis. PM_1.1_1).
// Contoh normalisasi dikembangkan/disusun untuk PKB/Pokjawas Jember.

window.PKKM_RA_VERSION = '1.0.0';

// ---------------------------------------------------------------------------
// INSTRUMEN RA — PENILAI (Pengawas)
// ---------------------------------------------------------------------------
window.PKKM_INSTRUMEN_RA_PENGAWAS = [
  {
    no: 1, code: 'PM', label: 'Usaha Pengembangan RA',
    aspek: [
      {
        kode: '1.1', no: 1,
        unsur: 'Pengembangan Visi, Misi, Tujuan dan Budaya RA.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA mengembangkan visi, misi, tujuan dan budaya RA yang berorientasi pada nilai keislaman, kebutuhan dan potensi anak, karakteristik satuan, Panca Cinta, serta peningkatan mutu layanan.',
          penggalian: 'Gali bagaimana visi, misi dan tujuan disusun atau ditinjau kembali. Pastikan tidak hanya tersedia sebagai dokumen atau tulisan di dinding. Konfirmasi apakah guru, tenaga kependidikan, yayasan/komite dan orang tua memahami arah pengembangan RA serta apakah program RA benar-benar mengacu pada visi tersebut.',
          data: 'Dokumen visi, misi dan tujuan RA; Kurikulum Madrasah (KM) RA; program kerja; notulen rapat; dokumentasi sosialisasi; hasil wawancara; pengamatan budaya RA.',
          bukti: 'Telaah dokumen, observasi dan wawancara: (1) dokumen visi-misi-tujuan; (2) Kurikulum Madrasah RA; (3) program kerja RA; (4) notulen rapat penyusunan/peninjauan; (5) dokumentasi sosialisasi; (6) wawancara guru/orang tua; dan (7) pengamatan budaya RA.',
          rubrik: {
            4: 'Visi, misi dan tujuan relevan dengan karakteristik RA, disusun/ditinjau secara partisipatif, dipahami warga RA dan nyata tercermin dalam program serta budaya satuan.',
            3: 'Visi, misi dan tujuan sudah relevan dan sebagian besar diterapkan dalam program, tetapi keterlibatan atau pemahaman seluruh warga belum merata.',
            2: 'Visi, misi dan tujuan tersedia tetapi masih dominan administratif dan belum kuat menjadi dasar program.',
            1: 'Visi, misi dan tujuan tidak relevan/tidak mutakhir atau tidak terlihat implementasinya.'
          }
        }]
      },
      {
        kode: '1.2', no: 2,
        unsur: 'RA sebagai Organisasi Pembelajar.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA mengembangkan RA sebagai organisasi pembelajar yang reflektif, adaptif, kolaboratif dan berorientasi pada perbaikan berkelanjutan.',
          penggalian: 'Gali apakah hasil evaluasi, supervisi, refleksi guru, masukan orang tua dan data perkembangan anak digunakan untuk melakukan perbaikan.',
          data: 'Program peningkatan mutu; hasil evaluasi/refleksi; dokumentasi komunitas belajar; notulen rapat; RTL; dokumentasi perubahan program.',
          bukti: 'Telaah dokumen dan wawancara: (1) program peningkatan mutu; (2) hasil evaluasi/refleksi; (3) catatan komunitas belajar; (4) notulen rapat; (5) RTL; dan (6) dokumentasi perubahan program.',
          rubrik: {
            4: 'Refleksi dan data digunakan secara konsisten untuk menghasilkan perbaikan nyata dan dapat ditunjukkan dampaknya.',
            3: 'Refleksi dan evaluasi rutin dilakukan serta menghasilkan tindak lanjut, tetapi dampaknya belum terdokumentasi optimal.',
            2: 'Kegiatan evaluasi ada tetapi tindak lanjut masih terbatas atau insidental.',
            1: 'Tidak terdapat budaya refleksi dan perbaikan yang sistematis.'
          }
        }]
      },
      {
        kode: '1.3', no: 3,
        unsur: 'Lingkungan RA Aman, Nyaman dan Inklusif.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA mengembangkan lingkungan pendidikan yang aman, sehat, nyaman, ramah anak, inklusif, menyenangkan dan menghargai keragaman.',
          penggalian: 'Observasi langsung lingkungan RA. Perhatikan keamanan ruang, toilet, halaman, APE, aksesibilitas, interaksi warga RA, pencegahan kekerasan dan perlakuan terhadap anak dengan kebutuhan yang beragam.',
          data: 'Hasil observasi lingkungan; SOP keselamatan; tata tertib; laporan insiden; program perlindungan anak; hasil wawancara guru dan orang tua.',
          bukti: 'Observasi dan telaah dokumen: (1) observasi lingkungan RA; (2) SOP keselamatan; (3) dokumentasi; (4) tata tertib; (5) laporan insiden; (6) program perlindungan anak; dan (7) wawancara guru dan orang tua.',
          rubrik: {
            4: 'Lingkungan fisik dan sosial memenuhi prinsip aman, inklusif dan ramah anak secara konsisten serta ada mekanisme pencegahan dan penanganan risiko.',
            3: 'Sebagian besar kondisi sudah baik, dengan beberapa aspek yang masih perlu ditingkatkan.',
            2: 'Upaya sudah dilakukan tetapi belum konsisten dan masih terdapat risiko atau praktik yang perlu diperbaiki.',
            1: 'Lingkungan belum memenuhi prinsip keselamatan, kenyamanan atau perlindungan anak secara memadai.'
          }
        }]
      },
      {
        kode: '1.4', no: 4,
        unsur: 'Pengembangan Budaya Religius dan Kurikulum Berbasis Cinta.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA memimpin pengembangan budaya religius serta internalisasi nilai Panca Cinta melalui pembiasaan, keteladanan, interaksi dan pengalaman belajar anak.',
          penggalian: 'Jangan hanya mencari dokumen KBC. Amati apakah nilai cinta kepada Allah dan Rasul-Nya, ilmu, lingkungan, diri dan sesama manusia, serta tanah air hadir secara alami dalam kehidupan RA.',
          data: 'Hasil observasi pembelajaran; catatan pembiasaan; program RA; perencanaan guru; dokumentasi kegiatan; wawancara guru/orang tua/anak secara proporsional.',
          bukti: 'Observasi dan wawancara: (1) observasi pembelajaran; (2) catatan pembiasaan; (3) program RA; (4) perencanaan guru; (5) dokumentasi; dan (6) wawancara guru/orang tua/anak secara proporsional.',
          rubrik: {
            4: 'Nilai religius dan Panca Cinta terintegrasi alami dan konsisten dalam budaya, pembelajaran serta interaksi warga RA.',
            3: 'Implementasi sudah tampak pada sebagian besar kegiatan tetapi belum merata.',
            2: 'Implementasi lebih banyak berupa kegiatan seremonial atau administratif.',
            1: 'Belum tampak integrasi nyata dalam budaya dan pengalaman anak.'
          }
        }]
      },
      {
        kode: '1.5', no: 5,
        unsur: 'Kemitraan dengan Orang Tua.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA membangun kemitraan aktif dan setara dengan orang tua/wali untuk mendukung perkembangan, pembiasaan positif dan pendidikan anak.',
          penggalian: 'Gali apakah hubungan dengan orang tua hanya berupa penyampaian informasi atau sudah menjadi kemitraan dua arah.',
          data: 'Program parenting; catatan komunikasi perkembangan anak; dokumentasi pertemuan orang tua; dokumentasi kegiatan bersama; hasil survei kepuasan; bukti tindak lanjut.',
          bukti: 'Telaah dokumen dan wawancara: (1) program parenting; (2) komunikasi perkembangan anak; (3) pertemuan orang tua; (4) kegiatan bersama; (5) survei kepuasan; dan (6) dokumentasi tindak lanjut.',
          rubrik: {
            4: 'Kemitraan berlangsung dua arah, rutin dan berdampak nyata terhadap kesinambungan pendidikan anak di RA dan keluarga.',
            3: 'Komunikasi dan keterlibatan orang tua berjalan baik tetapi belum sepenuhnya menjadi kemitraan strategis.',
            2: 'Hubungan dengan orang tua masih dominan administratif/informatif.',
            1: 'Komunikasi dan keterlibatan orang tua sangat terbatas.'
          }
        }]
      },
      {
        kode: '1.6', no: 6,
        unsur: 'Kemitraan dengan Masyarakat dan Lembaga Lain.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA mengembangkan jejaring dengan masyarakat, komite, layanan kesehatan, pemerintah, organisasi profesi dan pemangku kepentingan lain untuk meningkatkan kualitas layanan anak.',
          penggalian: 'Nilai kualitas dan manfaat kerja sama, bukan banyaknya MoU.',
          data: 'Program bersama; bukti kemitraan; dokumentasi; layanan kesehatan/gizi; kegiatan masyarakat; hasil kerja sama.',
          bukti: 'Telaah dokumen dan observasi: (1) program bersama; (2) bukti kemitraan; (3) dokumentasi; (4) layanan kesehatan/gizi; (5) kegiatan masyarakat; dan (6) hasil kerja sama.',
          rubrik: {
            4: 'Kemitraan aktif, relevan, berkelanjutan dan memberikan manfaat yang dapat ditunjukkan bagi layanan RA.',
            3: 'Kemitraan aktif dan bermanfaat tetapi belum dikembangkan secara optimal.',
            2: 'Kerja sama tersedia tetapi bersifat insidental atau administratif.',
            1: 'Hampir tidak ada kemitraan yang mendukung pengembangan RA.'
          }
        }]
      },
      {
        kode: '1.7', no: 7,
        unsur: 'Pemanfaatan Teknologi secara Tepat dan Etis.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA memimpin pemanfaatan teknologi dan sumber belajar digital secara efektif, aman, etis dan proporsional sesuai karakteristik anak usia dini.',
          penggalian: 'Jangan menilai dari banyaknya perangkat. Gali bagaimana teknologi membantu administrasi, komunikasi, peningkatan kompetensi guru dan pembelajaran tanpa menggantikan kebutuhan anak untuk bermain, bergerak dan berinteraksi langsung.',
          data: 'Dokumentasi sistem administrasi; catatan komunikasi digital; media pembelajaran; kebijakan penggunaan teknologi; contoh pemanfaatan oleh guru.',
          bukti: 'Observasi dan telaah dokumen: (1) sistem administrasi; (2) komunikasi digital; (3) media pembelajaran; (4) kebijakan penggunaan teknologi; dan (5) contoh pemanfaatan oleh guru.',
          rubrik: {
            4: 'Teknologi digunakan secara efektif dan aman serta jelas memberi nilai tambah tanpa mengurangi pengalaman bermain dan interaksi anak.',
            3: 'Pemanfaatan sudah tepat namun belum merata atau belum dievaluasi secara sistematis.',
            2: 'Teknologi digunakan tetapi lebih bersifat administratif atau belum mempertimbangkan aspek keamanan dan kesesuaian perkembangan.',
            1: 'Pemanfaatan tidak efektif/tidak aman atau hampir tidak dikembangkan.'
          }
        }]
      }
    ]
  },
  {
    no: 2, code: 'MJ', label: 'Pelaksanaan Tugas Manajerial Kepala RA',
    aspek: [
      {
        kode: '2.1', no: 1,
        unsur: 'Perencanaan Pengembangan RA Berbasis Data.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA menyusun perencanaan pengembangan satuan berdasarkan evaluasi diri, data perkembangan dan kebutuhan anak, kondisi satuan, aspirasi pemangku kepentingan dan prioritas peningkatan mutu.',
          penggalian: 'Bandingkan antara masalah nyata RA dengan program dan anggaran. Pastikan perencanaan tidak hanya menyalin tahun sebelumnya.',
          data: 'Dokumen evaluasi diri; program tahunan; RKM/RKTM/RKAM atau dokumen ekuivalen; data anak; notulen; laporan evaluasi program.',
          bukti: 'Telaah dokumen: (1) evaluasi diri; (2) program tahunan; (3) RKM/RKTM/RKAM atau dokumen ekuivalen; (4) data anak; (5) notulen; dan (6) evaluasi program.',
          rubrik: {
            4: 'Perencanaan berbasis data, prioritasnya jelas, terintegrasi dengan sumber daya dan dievaluasi pencapaiannya.',
            3: 'Perencanaan sudah berdasarkan kebutuhan tetapi analisis data atau evaluasi hasilnya belum optimal.',
            2: 'Program tersedia tetapi hubungan dengan kebutuhan/data belum jelas.',
            1: 'Perencanaan dominan administratif atau tidak berdasarkan kebutuhan nyata.'
          }
        }]
      },
      {
        kode: '2.2', no: 2,
        unsur: 'Pengembangan Kurikulum Madrasah RA.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA memimpin penyusunan, implementasi, evaluasi dan pengembangan Kurikulum Madrasah (KM) RA sesuai regulasi, karakteristik anak, karakteristik satuan dan konteks lingkungan.',
          penggalian: 'Pastikan tidak menggunakan terminologi lama KTSP sebagai nomenklatur utama. Periksa keselarasan antara dokumen KM dengan praktik pembelajaran.',
          data: 'Kurikulum Madrasah RA; dokumen analisis karakteristik satuan; tujuan satuan; pengorganisasian pembelajaran; perencanaan guru; evaluasi kurikulum.',
          bukti: 'Telaah dokumen: (1) Kurikulum Madrasah RA; (2) analisis karakteristik satuan; (3) tujuan satuan; (4) pengorganisasian pembelajaran; (5) perencanaan guru; dan (6) evaluasi kurikulum.',
          rubrik: {
            4: 'KM disusun kontekstual dan partisipatif, diterapkan konsisten, dievaluasi serta diperbaiki berdasarkan data dan refleksi.',
            3: 'KM sudah sesuai karakteristik RA dan diterapkan, tetapi evaluasi atau pengembangannya belum optimal.',
            2: 'Dokumen tersedia namun implementasinya belum konsisten.',
            1: 'Dokumen tidak mutakhir, tidak sesuai karakteristik satuan atau tidak menjadi pedoman pembelajaran.'
          }
        }]
      },
      {
        kode: '2.3', no: 3,
        unsur: 'Pembelajaran Berbasis Bermain.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA memastikan pembelajaran berpusat pada anak melalui pengalaman bermain-belajar yang aktif, eksploratif, kontekstual, bermakna dan sesuai kebutuhan serta karakteristik perkembangan.',
          penggalian: 'Observasi apakah anak dominan aktif atau justru guru yang dominan. Hindari praktik menyeragamkan hasil karya, lembar kerja berlebihan dan akademisasi yang tidak sesuai karakteristik PAUD.',
          data: 'Catatan observasi kelas; perencanaan pembelajaran; hasil karya anak; dokumentasi kegiatan; hasil wawancara guru.',
          bukti: 'Observasi dan telaah dokumen: (1) observasi kelas; (2) perencanaan pembelajaran; (3) hasil karya anak; (4) dokumentasi kegiatan; dan (5) wawancara guru.',
          rubrik: {
            4: 'Pembelajaran secara konsisten memberi anak ruang memilih, mengeksplorasi, berkreasi, berkomunikasi dan belajar melalui pengalaman nyata.',
            3: 'Pembelajaran sudah berpusat pada anak tetapi beberapa kegiatan masih cukup terstruktur oleh guru.',
            2: 'Pembelajaran masih sering didominasi guru atau aktivitas seragam.',
            1: 'Pembelajaran dominan instruksi/lembar kerja dan tidak mencerminkan karakteristik belajar anak usia dini.'
          }
        }]
      },
      {
        kode: '2.4', no: 4,
        unsur: 'Pembelajaran Mendalam dan Panca Cinta.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA memastikan prinsip pembelajaran berkesadaran, bermakna dan menggembirakan serta nilai Panca Cinta terintegrasi secara kontekstual dalam pengalaman belajar anak.',
          penggalian: 'Jangan mencari label "Deep Learning" pada dokumen saja. Gali pengalaman nyata anak: apakah anak merasa aman, terlibat, memahami pengalaman melalui kegiatan konkret dan menikmati proses belajar.',
          data: 'Catatan observasi; perencanaan guru; dokumentasi kegiatan; refleksi guru; karya/cerita anak.',
          bukti: 'Observasi dan telaah dokumen: (1) observasi; (2) perencanaan guru; (3) dokumentasi kegiatan; (4) refleksi guru; dan (5) karya/cerita anak.',
          rubrik: {
            4: 'Ketiga prinsip dan nilai cinta terlihat konsisten dalam desain serta praktik pembelajaran.',
            3: 'Sebagian besar prinsip sudah terimplementasi dengan baik.',
            2: 'Istilah sudah digunakan tetapi implementasi belum konsisten.',
            1: 'Pembelajaran belum mencerminkan prinsip tersebut secara nyata.'
          }
        }]
      },
      {
        kode: '2.5', no: 5,
        unsur: 'Asesmen Perkembangan dan Pembelajaran Anak.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA memastikan guru melakukan asesmen autentik dan berkelanjutan untuk memahami proses belajar anak dan menggunakan hasilnya untuk merancang pembelajaran selanjutnya.',
          penggalian: 'Jangan menggunakan KKM, UH, PTS, PAS atau PAT sebagai tolok ukur RA. Gali bagaimana guru mengamati anak secara alami, mendokumentasikan proses dan menggunakan temuannya untuk menentukan dukungan berikutnya.',
          data: 'Catatan observasi; catatan anekdot; hasil karya; dokumentasi; portofolio; laporan perkembangan anak; perencanaan tindak lanjut.',
          bukti: 'Telaah dokumen dan wawancara: (1) catatan observasi; (2) catatan anekdot; (3) hasil karya; (4) dokumentasi; (5) portofolio; (6) laporan perkembangan; dan (7) perencanaan tindak lanjut.',
          rubrik: {
            4: 'Asesmen autentik dilakukan secara konsisten, dianalisis dan jelas digunakan untuk menyesuaikan pembelajaran serta dukungan kepada anak.',
            3: 'Asesmen autentik terlaksana dengan baik tetapi pemanfaatan hasilnya belum selalu terdokumentasi.',
            2: 'Asesmen tersedia namun masih dominan sebagai pelaporan dan kurang digunakan untuk perbaikan pembelajaran.',
            1: 'Asesmen tidak sesuai karakteristik PAUD atau tidak memberikan gambaran perkembangan belajar anak.'
          }
        }]
      },
      {
        kode: '2.6', no: 6,
        unsur: 'Pengelolaan Lingkungan, Sarana dan APE.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA mengelola lingkungan, sarana, prasarana, APE dan sumber belajar agar aman, sehat, inklusif, menarik serta mendorong eksplorasi dan kemandirian anak.',
          penggalian: 'Observasi kondisi nyata. Tidak harus mahal. Nilai dari keamanan, relevansi, akses anak dan kreativitas pemanfaatannya.',
          data: 'Hasil observasi; inventaris; SOP keamanan; jadwal pemeliharaan; APE buatan/pabrikan; sumber belajar lingkungan.',
          bukti: 'Observasi dan telaah dokumen: (1) observasi; (2) inventaris; (3) SOP keamanan; (4) jadwal pemeliharaan; (5) APE buatan/pabrikan; dan (6) sumber belajar lingkungan.',
          rubrik: {
            4: 'Sarana dan lingkungan aman, terawat, mudah diakses anak dan secara aktif mendukung beragam pengalaman belajar.',
            3: 'Kondisi umumnya baik dengan beberapa aspek yang masih perlu ditingkatkan.',
            2: 'Sarana tersedia tetapi pemanfaatan, pemeliharaan atau aspek keselamatan belum optimal.',
            1: 'Sarana/lingkungan tidak memadai atau terdapat risiko keselamatan yang signifikan.'
          }
        }]
      },
      {
        kode: '2.7', no: 7,
        unsur: 'Perlindungan, Kesehatan dan Kesejahteraan Anak.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA memastikan terpenuhinya perlindungan, keselamatan, kesehatan, kebersihan, kesejahteraan dan pemenuhan hak anak dalam seluruh layanan RA.',
          penggalian: 'Gali mekanisme pencegahan dan penanganan kekerasan, perundungan, diskriminasi, kondisi darurat, kesehatan dan kebersihan.',
          data: 'SOP; hasil observasi; fasilitas sanitasi; program kesehatan/gizi; kemitraan layanan kesehatan; dokumentasi simulasi/edukasi; catatan penanganan insiden.',
          bukti: 'Observasi dan telaah dokumen: (1) SOP; (2) observasi; (3) fasilitas sanitasi; (4) program kesehatan/gizi; (5) kemitraan layanan kesehatan; (6) dokumentasi simulasi/edukasi; dan (7) penanganan insiden.',
          rubrik: {
            4: 'Sistem perlindungan dan kesehatan berjalan komprehensif, preventif dan responsif serta dipahami warga RA.',
            3: 'Sistem dan praktik sudah berjalan baik tetapi beberapa aspek belum optimal.',
            2: 'Dokumen/program tersedia tetapi implementasi belum konsisten.',
            1: 'Perlindungan dan kesehatan anak belum dikelola secara memadai.'
          }
        }]
      },
      {
        kode: '2.8', no: 8,
        unsur: 'Pengelolaan dan Pengembangan Guru/Tenaga Kependidikan.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA mengelola dan mengembangkan kompetensi guru serta tenaga kependidikan berdasarkan kebutuhan peningkatan mutu layanan dan pembelajaran.',
          penggalian: 'Jangan menghitung sertifikat saja. Periksa apakah pelatihan, komunitas belajar dan pendampingan menghasilkan perubahan praktik.',
          data: 'Dokumen pemetaan kebutuhan kompetensi; program PKB; catatan komunitas belajar; hasil supervisi; refleksi; contoh perubahan praktik.',
          bukti: 'Telaah dokumen dan wawancara: (1) pemetaan kebutuhan kompetensi; (2) program PKB; (3) komunitas belajar; (4) hasil supervisi; (5) refleksi; dan (6) contoh perubahan praktik.',
          rubrik: {
            4: 'Pengembangan kompetensi berbasis kebutuhan, berkelanjutan dan menunjukkan dampak nyata terhadap praktik.',
            3: 'Program pengembangan berjalan dan relevan tetapi dampaknya belum dipantau secara sistematis.',
            2: 'Pengembangan lebih banyak berdasarkan kesempatan pelatihan, bukan kebutuhan.',
            1: 'Tidak terdapat pengembangan kompetensi yang terencana.'
          }
        }]
      },
      {
        kode: '2.9', no: 9,
        unsur: 'Tata Kelola Administrasi, Data dan Keuangan RA.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA mengelola administrasi, data, keuangan dan sumber daya secara tertib, transparan, efektif, efisien dan akuntabel.',
          penggalian: 'Periksa ketertiban dan pemanfaatan data, bukan banyaknya map administrasi.',
          data: 'Dokumen administrasi; data peserta didik/PTK; program dan anggaran; laporan keuangan; inventaris; publikasi pertanggungjawaban sesuai ketentuan.',
          bukti: 'Telaah dokumen: (1) dokumen administrasi; (2) data peserta didik/PTK; (3) program dan anggaran; (4) laporan keuangan; (5) inventaris; dan (6) publikasi pertanggungjawaban sesuai ketentuan.',
          rubrik: {
            4: 'Tata kelola tertib, akurat, transparan, berbasis data dan mendukung pengambilan keputusan.',
            3: 'Pengelolaan berjalan baik dengan kekurangan kecil.',
            2: 'Administrasi tersedia namun belum konsisten/terintegrasi.',
            1: 'Tata kelola tidak tertib atau terdapat kelemahan serius dalam akuntabilitas.'
          }
        }]
      },
      {
        kode: '2.10', no: 10,
        unsur: 'Monitoring, Evaluasi, Refleksi dan Tindak Lanjut.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA melakukan monitoring, evaluasi dan refleksi atas program, pembelajaran dan layanan serta menggunakan hasilnya untuk perbaikan berkelanjutan.',
          penggalian: 'Cari contoh konkret: "Apa yang ditemukan? Apa yang berubah setelah dievaluasi?"',
          data: 'Instrumen monitoring; laporan evaluasi; notulen refleksi; RTL; dokumentasi perubahan program; data sebelum-sesudah.',
          bukti: 'Telaah dokumen: (1) instrumen monitoring; (2) laporan evaluasi; (3) notulen refleksi; (4) RTL; (5) perubahan program; dan (6) data sebelum-sesudah.',
          rubrik: {
            4: 'Monitoring dilakukan sistematis, menghasilkan analisis dan tindak lanjut yang berdampak.',
            3: 'Monitoring dan tindak lanjut berjalan tetapi evaluasi dampaknya belum optimal.',
            2: 'Monitoring ada tetapi lebih administratif dan tindak lanjut terbatas.',
            1: 'Tidak ada monitoring/evaluasi yang bermakna.'
          }
        }]
      }
    ]
  },
  {
    no: 3, code: 'KW', label: 'Pengembangan Kewirausahaan dan Inovasi',
    aspek: [
      {
        kode: '3.1', no: 1,
        unsur: 'Inovasi Peningkatan Mutu Layanan.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA mengembangkan inovasi yang relevan untuk meningkatkan kualitas pembelajaran, pengelolaan atau layanan kepada anak dan keluarga.',
          penggalian: 'Inovasi tidak harus aplikasi atau teknologi. Yang dinilai adalah kebaruan dalam konteks RA, kebermanfaatan dan dampaknya.',
          data: 'Program inovasi; dokumentasi; hasil evaluasi; testimoni; bukti perubahan layanan.',
          bukti: 'Telaah dokumen, observasi dan wawancara: (1) program inovasi; (2) dokumentasi; (3) hasil evaluasi; (4) testimoni; dan (5) perubahan layanan.',
          rubrik: {
            4: 'Inovasi berdasarkan kebutuhan, diterapkan, dievaluasi dan menunjukkan manfaat nyata.',
            3: 'Inovasi sudah diterapkan dan bermanfaat tetapi evaluasi dampaknya belum kuat.',
            2: 'Inovasi ada tetapi masih terbatas atau belum konsisten.',
            1: 'Tidak ada upaya inovasi yang relevan.'
          }
        }]
      },
      {
        kode: '3.2', no: 2,
        unsur: 'Pemanfaatan Potensi Lingkungan dan Kearifan Lokal.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA mendorong kreativitas dalam memanfaatkan lingkungan, budaya dan sumber daya lokal sebagai sumber belajar dan pengembangan RA.',
          penggalian: 'Gali apakah lingkungan sekitar benar-benar digunakan untuk memberi pengalaman belajar anak.',
          data: 'Perencanaan; dokumentasi kegiatan anak; media lokal; dokumentasi; bukti kemitraan masyarakat.',
          bukti: 'Telaah dokumen dan observasi: (1) perencanaan; (2) kegiatan anak; (3) media lokal; (4) dokumentasi; dan (5) kemitraan masyarakat.',
          rubrik: {
            4: 'Potensi lokal dimanfaatkan secara kreatif, berkelanjutan dan memperkaya pengalaman anak.',
            3: 'Pemanfaatan sudah berjalan tetapi belum maksimal.',
            2: 'Dilakukan sesekali tanpa perencanaan kuat.',
            1: 'Hampir tidak dimanfaatkan.'
          }
        }]
      },
      {
        kode: '3.3', no: 3,
        unsur: 'Pengembangan Jejaring yang Memberi Nilai Tambah.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA mengembangkan jejaring dan kemitraan untuk memperoleh dukungan pengetahuan, layanan, sumber daya atau peluang pengembangan RA.',
          penggalian: 'Nilai relevansi dan manfaat jejaring bagi layanan anak, bukan banyaknya lembaga yang tercatat.',
          data: 'Dokumentasi kemitraan; program bersama; bukti dukungan sumber daya; hasil kerja sama.',
          bukti: 'Telaah dokumen dan wawancara: (1) dokumentasi kemitraan; (2) program bersama; (3) bukti dukungan sumber daya; dan (4) hasil kerja sama.',
          rubrik: {
            4: 'Jejaring luas, relevan, aktif dan menghasilkan manfaat yang terukur.',
            3: 'Jejaring aktif serta memberikan manfaat.',
            2: 'Jejaring terbatas atau bersifat seremonial.',
            1: 'Tidak ada pengembangan jejaring yang berarti.'
          }
        }]
      },
      {
        kode: '3.4', no: 4,
        unsur: 'Inisiatif, Ketangguhan dan Pemecahan Masalah.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA menunjukkan inisiatif, ketangguhan, kreativitas dan kemampuan mengambil solusi terhadap permasalahan pengembangan RA.',
          penggalian: 'Gunakan kasus nyata yang pernah dihadapi RA. Hindari menilai dari pernyataan umum.',
          data: 'Studi kasus; hasil wawancara; dokumentasi perubahan kebijakan/program; hasil pemecahan masalah.',
          bukti: 'Wawancara dan telaah dokumen: (1) studi kasus; (2) wawancara; (3) perubahan kebijakan/program; dan (4) hasil pemecahan masalah.',
          rubrik: {
            4: 'Masalah dianalisis dengan baik, solusi inovatif diterapkan dan menghasilkan perubahan positif.',
            3: 'Kepala RA mampu menyelesaikan masalah secara efektif.',
            2: 'Penyelesaian lebih bersifat reaktif dan belum menyentuh akar masalah.',
            1: 'Masalah berulang tanpa penyelesaian memadai.'
          }
        }]
      },
      {
        kode: '3.5', no: 5,
        unsur: 'Kewirausahaan Sosial-Edukatif dan Kemandirian RA.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA mengembangkan kegiatan inovatif dan/atau kewirausahaan sosial-edukatif yang memberi nilai tambah dan mendukung keberlanjutan lembaga tanpa mengabaikan kepentingan terbaik anak.',
          penggalian: 'Jangan menyamakan kewirausahaan dengan kewajiban memiliki kantin, koperasi atau usaha jual beli.',
          data: 'Dokumen program; hasil kegiatan; bukti pemanfaatan sumber daya; kerja sama; inovasi layanan.',
          bukti: 'Telaah dokumen dan wawancara: (1) program; (2) hasil kegiatan; (3) pemanfaatan sumber daya; (4) kerja sama; dan (5) inovasi layanan.',
          rubrik: {
            4: 'Program relevan, kreatif, edukatif, berkelanjutan dan memberi nilai tambah nyata.',
            3: 'Program berjalan baik dan memberi manfaat.',
            2: 'Program ada tetapi dampak/keberlanjutannya terbatas.',
            1: 'Tidak ada program relevan atau program justru tidak sesuai prinsip pendidikan anak.'
          }
        }]
      }
    ]
  },
  {
    no: 4, code: 'SP', label: 'Supervisi Pembelajaran RA',
    aspek: [
      {
        kode: '4.1', no: 1,
        unsur: 'Perencanaan Supervisi Pembelajaran.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA menyusun program supervisi berdasarkan kebutuhan guru, karakteristik pembelajaran RA dan hasil evaluasi mutu layanan.',
          penggalian: 'Jangan hanya memeriksa jadwal supervisi. Gali dasar penentuan fokus supervisi.',
          data: 'Program supervisi; dokumen pemetaan kebutuhan; jadwal; instrumen supervisi; hasil supervisi sebelumnya.',
          bukti: 'Telaah dokumen: (1) program supervisi; (2) pemetaan kebutuhan; (3) jadwal; (4) instrumen; dan (5) hasil supervisi sebelumnya.',
          rubrik: {
            4: 'Supervisi dirancang berbasis data/kebutuhan dengan fokus dan tindak lanjut yang jelas.',
            3: 'Program relevan dan terlaksana tetapi belum seluruhnya berbasis analisis kebutuhan.',
            2: 'Program dan jadwal tersedia tetapi lebih administratif.',
            1: 'Tidak ada perencanaan supervisi yang memadai.'
          }
        }]
      },
      {
        kode: '4.2', no: 2,
        unsur: 'Pelaksanaan Supervisi Pembelajaran RA.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA melakukan supervisi yang menilai kualitas pengalaman belajar anak, interaksi guru-anak, pembelajaran berbasis bermain, lingkungan belajar dan asesmen autentik.',
          penggalian: 'Fokus pengamatan antara lain: interaksi positif dan responsif; keterlibatan anak; kesempatan bereksplorasi; bermain; berkomunikasi; berkreasi; memecahkan masalah; kesesuaian aktivitas dengan kebutuhan anak; penggunaan asesmen autentik; serta minimnya praktik akademisasi yang tidak sesuai karakteristik PAUD.',
          data: 'Instrumen supervisi; catatan observasi; hasil wawancara guru; dokumentasi; catatan refleksi.',
          bukti: 'Observasi dan telaah dokumen: (1) instrumen supervisi; (2) catatan observasi; (3) wawancara guru; (4) dokumentasi; dan (5) refleksi.',
          rubrik: {
            4: 'Supervisi terlaksana secara objektif dan dialogis serta memberi gambaran mendalam tentang kualitas pembelajaran.',
            3: 'Supervisi terlaksana dengan baik tetapi analisis belum sepenuhnya mendalam.',
            2: 'Supervisi dominan memeriksa administrasi guru.',
            1: 'Supervisi tidak terlaksana secara memadai.'
          }
        }]
      },
      {
        kode: '4.3', no: 3,
        unsur: 'Tindak Lanjut Supervisi.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA menindaklanjuti hasil supervisi melalui refleksi, coaching, pendampingan, komunitas belajar dan/atau pengembangan kompetensi serta memantau perubahan praktik guru.',
          penggalian: 'Tanyakan bukan hanya "sudah ditindaklanjuti?", tetapi "apa yang berubah setelah supervisi?"',
          data: 'Catatan umpan balik; RTL; catatan coaching; dokumentasi komunitas belajar; catatan observasi ulang; contoh perubahan praktik.',
          bukti: 'Telaah dokumen dan observasi: (1) catatan umpan balik; (2) RTL; (3) coaching; (4) komunitas belajar; (5) observasi ulang; dan (6) contoh perubahan praktik.',
          rubrik: {
            4: 'Tindak lanjut spesifik, berkelanjutan dan terdapat bukti perubahan praktik guru.',
            3: 'Tindak lanjut berjalan baik tetapi pemantauan dampaknya belum optimal.',
            2: 'Umpan balik diberikan tetapi tidak ada pendampingan yang jelas.',
            1: 'Tidak ada tindak lanjut bermakna.'
          }
        }]
      }
    ]
  },
  {
    no: 5, code: 'HK', label: 'Hasil Kinerja Kepala RA',
    aspek: [
      {
        kode: '5.1', no: 1,
        unsur: 'Dampak terhadap Kualitas Layanan dan Perkembangan Anak.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA menunjukkan dampak kepemimpinannya terhadap peningkatan kualitas pengalaman belajar, kesejahteraan dan layanan perkembangan anak selama periode penilaian. (Khusus penilaian 4 tahunan.)',
          penggalian: 'Jangan membandingkan anak berdasarkan ranking. Bandingkan kualitas layanan dan kecenderungan perkembangan satuan dari kondisi awal.',
          data: 'Data mutu; laporan perkembangan agregat; laporan evaluasi program; hasil survei orang tua; dokumentasi perubahan layanan.',
          bukti: 'Telaah dokumen: (1) data mutu; (2) laporan perkembangan agregat; (3) evaluasi program; (4) survei orang tua; dan (5) dokumentasi perubahan layanan.',
          rubrik: {
            4: 'Terdapat peningkatan yang jelas, konsisten dan didukung berbagai sumber data.',
            3: 'Peningkatan nyata terlihat tetapi bukti dampaknya belum sepenuhnya komprehensif.',
            2: 'Ada beberapa perubahan tetapi belum menunjukkan pola peningkatan yang kuat.',
            1: 'Tidak ditemukan bukti peningkatan yang berarti.'
          }
        }]
      },
      {
        kode: '5.2', no: 2,
        unsur: 'Dampak terhadap Guru dan Kualitas Pembelajaran.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA menunjukkan dampak kepemimpinannya terhadap peningkatan kompetensi guru dan kualitas praktik pembelajaran. (Khusus penilaian 4 tahunan.)',
          penggalian: 'Bandingkan perubahan praktik guru, bukan jumlah sertifikat pelatihan.',
          data: 'Hasil supervisi beberapa periode; portofolio guru; catatan refleksi; praktik baik; dokumentasi komunitas belajar; data sebelum-sesudah.',
          bukti: 'Telaah dokumen dan observasi: (1) hasil supervisi beberapa periode; (2) portofolio guru; (3) refleksi; (4) praktik baik; (5) komunitas belajar; dan (6) dokumentasi sebelum-sesudah.',
          rubrik: {
            4: 'Mayoritas guru menunjukkan perkembangan praktik yang nyata dan berkelanjutan.',
            3: 'Perkembangan terlihat pada sebagian besar guru tetapi belum merata.',
            2: 'Pengembangan dilakukan tetapi perubahan praktik masih terbatas.',
            1: 'Tidak terlihat dampak yang berarti.'
          }
        }]
      },
      {
        kode: '5.3', no: 3,
        unsur: 'Dampak terhadap Mutu Kelembagaan RA.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA menunjukkan peningkatan mutu kelembagaan dalam tata kelola, lingkungan belajar, kemitraan, inovasi, kepercayaan masyarakat dan keberlanjutan program. (Khusus penilaian 4 tahunan.)',
          penggalian: 'Nilai tren perubahan selama periode kepemimpinan, bukan hanya kondisi pada hari penilaian.',
          data: 'Data kelembagaan beberapa tahun; evaluasi diri; data layanan; kemitraan; inovasi; akreditasi bila relevan; survei kepuasan; data perkembangan program.',
          bukti: 'Telaah dokumen: (1) data kelembagaan beberapa tahun; (2) evaluasi diri; (3) data layanan; (4) kemitraan; (5) inovasi; (6) akreditasi bila relevan; (7) survei kepuasan; dan (8) perkembangan program.',
          rubrik: {
            4: 'Terjadi peningkatan kelembagaan yang konsisten pada beberapa dimensi dan didukung bukti kuat.',
            3: 'Terjadi peningkatan yang nyata tetapi belum merata pada seluruh dimensi.',
            2: 'Perubahan masih terbatas atau tidak konsisten.',
            1: 'Tidak ditemukan perkembangan kelembagaan yang berarti.'
          }
        }]
      },
      {
        kode: '5.4', no: 4,
        unsur: 'Dampak Kepemimpinan dan Pengembangan Profesional Kepala RA.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA menunjukkan perkembangan kompetensi kepribadian, sosial dan profesional serta mampu menerapkannya untuk menghasilkan perubahan positif pada RA. (Khusus penilaian 4 tahunan.)',
          penggalian: 'Sertifikat, diklat, gelar, seminar dan kegiatan pengembangan diri hanyalah sumber bukti pendukung. Fokus penilaian adalah apa yang dipelajari, bagaimana diterapkan, dan apa dampaknya.',
          data: 'Refleksi pengembangan diri; hasil evaluasi kinerja; praktik kepemimpinan; dokumentasi inovasi; kontribusi organisasi profesi; karya/praktik baik; data dampak.',
          bukti: 'Telaah dokumen dan wawancara: (1) refleksi pengembangan diri; (2) hasil evaluasi kinerja; (3) praktik kepemimpinan; (4) inovasi; (5) kontribusi organisasi profesi; (6) karya/praktik baik; dan (7) data dampak.',
          rubrik: {
            4: 'Pengembangan diri berlangsung terencana dan reflektif serta menghasilkan perubahan kepemimpinan dan dampak yang nyata bagi RA.',
            3: 'Pengembangan kompetensi aktif dan telah diterapkan, tetapi bukti dampaknya belum sepenuhnya kuat.',
            2: 'Mengikuti berbagai kegiatan pengembangan diri tetapi penerapan/dampaknya masih terbatas.',
            1: 'Pengembangan kompetensi sangat terbatas atau tidak terlihat penerapannya.'
          }
        }]
      }
    ]
  }
];

// ---------------------------------------------------------------------------
// INSTRUMEN RA — GTK/KOMITE (Guru, Tenaga Kependidikan, Komite, Kasi/Yayasan, Kabid)
// Sudut pandang: pengalaman warga RA terhadap kepemimpinan Kepala RA.
// Struktur & jumlah sub-aspek sama dengan instrumen pengawas (29 sub-aspek).
// ---------------------------------------------------------------------------
window.PKKM_INSTRUMEN_RA_GTK = [
  {
    no: 1, code: 'PM', label: 'Usaha Pengembangan RA',
    aspek: [
      {
        kode: '1.1', no: 1,
        unsur: 'Pengembangan Visi, Misi, Tujuan dan Budaya RA.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA melibatkan guru, tenaga kependidikan dan orang tua dalam menyusun serta meninjau visi, misi dan tujuan RA, dan arah tersebut terasa nyata dalam kegiatan sehari-hari di RA.',
          penggalian: 'Gali apakah Bapak/Ibu pernah dilibatkan dan memahami visi-misi RA, serta apakah program harian RA benar-benar mencerminkan arah tersebut.',
          data: 'Dokumen visi-misi-tujuan; undangan/notulen rapat; dokumentasi sosialisasi; pengalaman guru/tendik/orang tua.',
          bukti: 'Wawancara dan telaah dokumen: (1) pemahaman warga RA terhadap visi-misi; (2) keterlibatan dalam penyusunan/peninjauan; (3) notulen rapat; dan (4) kesesuaian program harian dengan visi-misi.',
          rubrik: {
            4: 'Warga RA dilibatkan, memahami dan merasakan visi-misi terwujud dalam budaya serta kegiatan harian.',
            3: 'Warga RA sebagian besar memahami dan terlibat, tetapi belum merata.',
            2: 'Visi-misi diketahui secara administratif tanpa keterlibatan dan penerapan yang jelas.',
            1: 'Visi-misi tidak dipahami warga RA dan tidak terasa dalam kegiatan.'
          }
        }]
      },
      {
        kode: '1.2', no: 2,
        unsur: 'RA sebagai Organisasi Pembelajar.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA membangun budaya belajar bersama: refleksi rutin, berbagi praktik baik dan perbaikan berkelanjutan yang dirasakan oleh guru dan tenaga kependidikan.',
          penggalian: 'Gali apakah guru/tendik merasa hasil refleksi dan evaluasi benar-benar ditindaklanjuti menjadi perbaikan nyata.',
          data: 'Dokumentasi komunitas belajar; catatan refleksi; notulen rapat; RTL; contoh perubahan praktik.',
          bukti: 'Wawancara dan telaah dokumen: (1) kegiatan refleksi/komunitas belajar; (2) keterlibatan guru; (3) RTL; dan (4) contoh perbaikan nyata.',
          rubrik: {
            4: 'Refleksi dan berbagi praktik berjalan rutin serta menghasilkan perbaikan nyata yang dirasakan warga RA.',
            3: 'Kegiatan refleksi berjalan dan ada tindak lanjut, tetapi dampaknya belum konsisten.',
            2: 'Refleksi dilakukan sesekali dan tindak lanjutnya terbatas.',
            1: 'Tidak ada budaya refleksi dan perbaikan yang dirasakan.'
          }
        }]
      },
      {
        kode: '1.3', no: 3,
        unsur: 'Lingkungan RA Aman, Nyaman dan Inklusif.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA memastikan lingkungan RA aman, bersih, nyaman, ramah anak dan inklusif bagi seluruh anak serta warga RA.',
          penggalian: 'Gali pengalaman guru/tendik/orang tua tentang keamanan, kebersihan dan perlakuan adil terhadap semua anak.',
          data: 'Kondisi lingkungan; SOP keselamatan; laporan insiden; pengalaman warga RA.',
          bukti: 'Wawancara, observasi dan telaah dokumen: (1) keamanan ruang/toilet/halaman; (2) kebersihan; (3) penanganan insiden; dan (4) perlakuan adil terhadap semua anak.',
          rubrik: {
            4: 'Lingkungan konsisten aman, nyaman dan inklusif serta ada upaya pencegahan risiko yang dirasakan warga RA.',
            3: 'Sebagian besar nyaman dengan beberapa aspek yang perlu diperbaiki.',
            2: 'Ada upaya tetapi belum konsisten dan masih dijumpai risiko.',
            1: 'Lingkungan belum aman/nyaman/inklusif.'
          }
        }]
      },
      {
        kode: '1.4', no: 4,
        unsur: 'Pengembangan Budaya Religius dan Kurikulum Berbasis Cinta.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA menumbuhkan budaya religius dan nilai Panca Cinta melalui keteladanan dan pembiasaan yang terasa dalam kehidupan sehari-hari RA.',
          penggalian: 'Gali apakah nilai cinta (kepada Allah dan Rasul, ilmu, lingkungan, diri, sesama, tanah air) hadir alami, bukan sekadar kegiatan seremonial.',
          data: 'Program pembiasaan; keteladanan kepala RA; dokumentasi kegiatan; pengalaman guru/orang tua.',
          bukti: 'Wawancara dan observasi: (1) pembiasaan harian; (2) keteladanan; (3) keterlibatan anak; dan (4) pengalaman warga RA.',
          rubrik: {
            4: 'Nilai religius dan Panca Cinta terasa alami dan konsisten dalam keseharian RA.',
            3: 'Terlihat pada sebagian besar kegiatan tetapi belum merata.',
            2: 'Masih dominan seremonial/administratif.',
            1: 'Belum tampak dalam kehidupan RA.'
          }
        }]
      },
      {
        kode: '1.5', no: 5,
        unsur: 'Kemitraan dengan Orang Tua.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA membangun kemitraan yang terbuka, rutin dan setara dengan orang tua/wali untuk mendukung perkembangan anak.',
          penggalian: 'Gali pengalaman orang tua: apakah komunikasi bersifat dua arah dan membantu pendampingan anak di rumah.',
          data: 'Program parenting; komunikasi perkembangan anak; dokumentasi pertemuan; survei kepuasan.',
          bukti: 'Wawancara dan telaah dokumen: (1) kegiatan parenting; (2) komunikasi perkembangan anak; (3) pertemuan orang tua; dan (4) tindak lanjut.',
          rubrik: {
            4: 'Kemitraan rutin dan dua arah serta membantu kesinambungan pendidikan anak di rumah.',
            3: 'Komunikasi baik tetapi belum sepenuhnya menjadi kemitraan.',
            2: 'Hubungan masih dominan informatif/administratif.',
            1: 'Keterlibatan orang tua sangat terbatas.'
          }
        }]
      },
      {
        kode: '1.6', no: 6,
        unsur: 'Kemitraan dengan Masyarakat dan Lembaga Lain.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA mengembangkan kerja sama dengan masyarakat, komite, layanan kesehatan dan pihak lain yang bermanfaat bagi layanan anak.',
          penggalian: 'Nilai manfaat nyata kerja sama bagi anak dan RA, bukan banyaknya lembaga.',
          data: 'Program bersama; bukti kemitraan; layanan kesehatan/gizi; kegiatan masyarakat.',
          bukti: 'Wawancara dan telaah dokumen: (1) program bersama; (2) bukti kerja sama; dan (3) manfaat bagi layanan anak.',
          rubrik: {
            4: 'Kemitraan aktif, relevan dan bermanfaat nyata bagi layanan anak.',
            3: 'Aktif dan bermanfaat tetapi belum optimal.',
            2: 'Insidental/administratif.',
            1: 'Hampir tidak ada kemitraan.'
          }
        }]
      },
      {
        kode: '1.7', no: 7,
        unsur: 'Pemanfaatan Teknologi secara Tepat dan Etis.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA mendukung pemanfaatan teknologi secara tepat, aman dan etis untuk membantu tugas warga RA tanpa mengganggu pengalaman bermain anak.',
          penggalian: 'Gali bagaimana teknologi membantu pekerjaan guru/administrasi dan komunikasi, tanpa menilai dari jumlah perangkat.',
          data: 'Sistem administrasi; media pembelajaran; kebijakan penggunaan teknologi; contoh pemanfaatan oleh guru.',
          bukti: 'Wawancara dan telaah dokumen: (1) pemanfaatan teknologi oleh guru; (2) kebijakan penggunaan; dan (3) dampak pada layanan.',
          rubrik: {
            4: 'Teknologi dimanfaatkan tepat, aman dan memberi nilai tambah bagi tugas warga RA.',
            3: 'Tepat tetapi belum merata.',
            2: 'Terbatas pada administrasi/aspek keamanan belum diperhatikan.',
            1: 'Tidak efektif/tidak sesuai kebutuhan.'
          }
        }]
      }
    ]
  },
  {
    no: 2, code: 'MJ', label: 'Pelaksanaan Tugas Manajerial Kepala RA',
    aspek: [
      {
        kode: '2.1', no: 1,
        unsur: 'Perencanaan Pengembangan RA Berbasis Data.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA menyusun perencanaan pengembangan RA berdasarkan kebutuhan nyata dan data, serta mengomunikasikannya dengan jelas kepada warga RA.',
          penggalian: 'Gali apakah guru/tendik mengetahui dan terlibat dalam program yang disusun serta merasakan relevansinya dengan kebutuhan RA.',
          data: 'Program tahunan; RKM/RKTM/RKAM; data anak; notulen rapat.',
          bukti: 'Wawancara dan telaah dokumen: (1) keterlibatan dalam penyusunan program; (2) relevansi program dengan kebutuhan; dan (3) notulen/evaluasi.',
          rubrik: {
            4: 'Perencanaan berbasis data, melibatkan warga RA dan dievaluasi pencapaiannya.',
            3: 'Sudah berdasarkan kebutuhan tetapi evaluasi belum optimal.',
            2: 'Program ada tetapi relevansinya belum jelas.',
            1: 'Dominan administratif.'
          }
        }]
      },
      {
        kode: '2.2', no: 2,
        unsur: 'Pengembangan Kurikulum Madrasah RA.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA memimpin penyusunan dan penerapan Kurikulum Madrasah (KM) RA yang kontekstual serta dikenal dan digunakan oleh guru dalam pembelajaran.',
          penggalian: 'Gali apakah guru memahami dan menggunakan KM RA (bukan KTSP) dalam perencanaan dan praktik pembelajaran.',
          data: 'Kurikulum Madrasah RA; perencanaan guru; pengalaman guru.',
          bukti: 'Wawancara dan telaah dokumen: (1) pemahaman guru terhadap KM RA; (2) penggunaan dalam perencanaan; dan (3) evaluasi kurikulum.',
          rubrik: {
            4: 'KM RA kontekstual, dipahami dan digunakan konsisten serta diperbaiki berdasarkan refleksi.',
            3: 'Sesuai dan diterapkan tetapi evaluasi belum optimal.',
            2: 'Dokumen ada tetapi implementasi belum konsisten.',
            1: 'Tidak mutakhir/tidak menjadi pedoman.'
          }
        }]
      },
      {
        kode: '2.3', no: 3,
        unsur: 'Pembelajaran Berbasis Bermain.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA mendukung pembelajaran yang berpusat pada anak dan berbasis bermain, tanpa menyeragamkan hasil karya atau menekan anak dengan akademisasi.',
          penggalian: 'Gali pengalaman guru: apakah mereka merasa didukung untuk merancang pembelajaran bermain-belajar yang bermakna.',
          data: 'Perencanaan pembelajaran; hasil karya anak; dokumentasi kegiatan; pengalaman guru.',
          bukti: 'Wawancara dan observasi: (1) dukungan kepala RA; (2) praktik bermain-belajar; dan (3) keterlibatan anak.',
          rubrik: {
            4: 'Anak konsisten mendapat ruang memilih, bereksplorasi dan berkreasi melalui bermain.',
            3: 'Sudah berpusat pada anak tetapi beberapa kegiatan masih terstruktur.',
            2: 'Masih sering didominasi guru.',
            1: 'Dominan instruksi/lembar kerja.'
          }
        }]
      },
      {
        kode: '2.4', no: 4,
        unsur: 'Pembelajaran Mendalam dan Panca Cinta.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA mendorong pembelajaran yang berkesadaran, bermakna dan menggembirakan serta menanamkan nilai Panca Cinta dalam pengalaman belajar anak.',
          penggalian: 'Gali pengalaman nyata anak: apakah anak merasa aman, terlibat dan menikmati proses belajar.',
          data: 'Perencanaan guru; dokumentasi kegiatan; refleksi guru; karya/cerita anak.',
          bukti: 'Wawancara dan observasi: (1) perencanaan; (2) praktik; dan (3) refleksi guru.',
          rubrik: {
            4: 'Prinsip berkesadaran, bermakna, menggembirakan dan nilai cinta tampak konsisten.',
            3: 'Sebagian besar sudah diterapkan.',
            2: 'Istilah ada, implementasi lemah.',
            1: 'Belum tampak.'
          }
        }]
      },
      {
        kode: '2.5', no: 5,
        unsur: 'Asesmen Perkembangan dan Pembelajaran Anak.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA memastikan guru melaksanakan asesmen autentik dan menggunakannya untuk memahami serta mendukung perkembangan anak.',
          penggalian: 'Gali bagaimana guru mengamati anak secara alami dan menggunakan temuannya untuk menentukan dukungan berikutnya (bukan KKM/UH/PTS/PAS/PAT).',
          data: 'Catatan observasi; catatan anekdot; hasil karya; portofolio; laporan perkembangan; tindak lanjut.',
          bukti: 'Wawancara dan telaah dokumen: (1) praktik asesmen autentik; (2) dokumentasi; dan (3) pemanfaatan hasil.',
          rubrik: {
            4: 'Asesmen autentik konsisten, dianalisis dan digunakan memperbaiki pembelajaran.',
            3: 'Berjalan baik tetapi pemanfaatan hasil belum selalu terdokumentasi.',
            2: 'Dominan untuk pelaporan.',
            1: 'Tidak sesuai karakteristik PAUD.'
          }
        }]
      },
      {
        kode: '2.6', no: 6,
        unsur: 'Pengelolaan Lingkungan, Sarana dan APE.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA mengelola sarana, lingkungan dan APE agar aman, terawat dan mendukung eksplorasi serta kemandirian anak.',
          penggalian: 'Gali apakah guru merasa sarana dan APE cukup, aman dan dapat dipakai untuk pembelajaran.',
          data: 'Inventaris; SOP keamanan; jadwal pemeliharaan; APE; sumber belajar lingkungan.',
          bukti: 'Wawancara dan observasi: (1) ketersediaan & keamanan APE; (2) pemeliharaan; dan (3) pemanfaatan.',
          rubrik: {
            4: 'Aman, terawat, mudah diakses dan aktif mendukung belajar.',
            3: 'Umumnya baik.',
            2: 'Tersedia tetapi penggunaan/pemeliharaan belum optimal.',
            1: 'Tidak memadai atau berisiko.'
          }
        }]
      },
      {
        kode: '2.7', no: 7,
        unsur: 'Perlindungan, Kesehatan dan Kesejahteraan Anak.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA memastikan perlindungan, kesehatan, kebersihan dan pemenuhan hak anak dalam seluruh layanan RA.',
          penggalian: 'Gali pengalaman warga RA tentang pencegahan dan penanganan kekerasan, perundungan, diskriminasi dan kondisi darurat.',
          data: 'SOP; fasilitas sanitasi; program kesehatan/gizi; penanganan insiden.',
          bukti: 'Wawancara, observasi dan telaah dokumen: (1) SOP perlindungan; (2) sanitasi; (3) program kesehatan; dan (4) penanganan insiden.',
          rubrik: {
            4: 'Sistem komprehensif, preventif dan responsif serta dipahami warga RA.',
            3: 'Sudah berjalan baik.',
            2: 'Program ada tetapi implementasi belum konsisten.',
            1: 'Belum dikelola memadai.'
          }
        }]
      },
      {
        kode: '2.8', no: 8,
        unsur: 'Pengelolaan dan Pengembangan Guru/Tenaga Kependidikan.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA mengembangkan kompetensi guru dan tenaga kependidikan berdasarkan kebutuhan, bukan sekadar kesempatan pelatihan.',
          penggalian: 'Gali apakah pengembangan yang diterima benar-benar mengubah praktik, bukan sekadar menambah sertifikat.',
          data: 'Pemetaan kebutuhan; program PKB; komunitas belajar; hasil supervisi; contoh perubahan praktik.',
          bukti: 'Wawancara dan telaah dokumen: (1) pemetaan kebutuhan; (2) program pengembangan; dan (3) perubahan praktik.',
          rubrik: {
            4: 'Berbasis kebutuhan, berkelanjutan dan berdampak nyata pada praktik.',
            3: 'Relevan tetapi dampak belum dipantau kuat.',
            2: 'Dominan mengikuti pelatihan yang tersedia.',
            1: 'Tidak terencana.'
          }
        }]
      },
      {
        kode: '2.9', no: 9,
        unsur: 'Tata Kelola Administrasi, Data dan Keuangan RA.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA mengelola administrasi, data dan keuangan secara tertib, transparan dan akuntabel serta mendukung kelancaran tugas warga RA.',
          penggalian: 'Nilai ketertiban dan keterbukaan pengelolaan, bukan jumlah map administrasi.',
          data: 'Dokumen administrasi; data peserta didik/PTK; program dan anggaran; laporan keuangan; inventaris.',
          bukti: 'Wawancara dan telaah dokumen: (1) ketertiban administrasi; (2) transparansi; dan (3) pemanfaatan data.',
          rubrik: {
            4: 'Tertib, akurat, transparan dan berbasis data.',
            3: 'Baik dengan kekurangan kecil.',
            2: 'Belum konsisten/terintegrasi.',
            1: 'Tidak tertib/kelemahan serius.'
          }
        }]
      },
      {
        kode: '2.10', no: 10,
        unsur: 'Monitoring, Evaluasi, Refleksi dan Tindak Lanjut.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA melaksanakan monitoring, evaluasi dan refleksi serta menindaklanjutinya untuk perbaikan layanan RA.',
          penggalian: 'Gali contoh konkret: apa yang ditemukan dan apa yang berubah setelah evaluasi?',
          data: 'Instrumen monitoring; laporan evaluasi; notulen refleksi; RTL; data sebelum-sesudah.',
          bukti: 'Wawancara dan telaah dokumen: (1) praktik monitoring; (2) tindak lanjut; dan (3) perubahan nyata.',
          rubrik: {
            4: 'Sistematis dan menghasilkan perubahan/dampak.',
            3: 'Berjalan tetapi evaluasi dampak belum optimal.',
            2: 'Lebih administratif.',
            1: 'Tidak ada evaluasi bermakna.'
          }
        }]
      }
    ]
  },
  {
    no: 3, code: 'KW', label: 'Pengembangan Kewirausahaan dan Inovasi',
    aspek: [
      {
        kode: '3.1', no: 1,
        unsur: 'Inovasi Peningkatan Mutu Layanan.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA mengembangkan inovasi yang terasa manfaatnya bagi pembelajaran, pengelolaan atau layanan anak dan keluarga.',
          penggalian: 'Inovasi tidak harus teknologi; nilai kebaruan, kebermanfaatan dan dampaknya bagi warga RA.',
          data: 'Program inovasi; dokumentasi; testimoni; perubahan layanan.',
          bukti: 'Wawancara dan telaah dokumen: (1) program inovasi; (2) penerapan; dan (3) manfaat yang dirasakan.',
          rubrik: {
            4: 'Berdasarkan kebutuhan, diterapkan, dievaluasi dan bermanfaat nyata.',
            3: 'Diterapkan dan bermanfaat.',
            2: 'Masih terbatas.',
            1: 'Tidak ada inovasi relevan.'
          }
        }]
      },
      {
        kode: '3.2', no: 2,
        unsur: 'Pemanfaatan Potensi Lingkungan dan Kearifan Lokal.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA mendorong pemanfaatan lingkungan dan kearifan lokal sebagai sumber belajar anak.',
          penggalian: 'Gali apakah lingkungan sekitar benar-benar dipakai dalam pengalaman belajar anak.',
          data: 'Perencanaan; kegiatan anak; media lokal; kemitraan masyarakat.',
          bukti: 'Wawancara dan observasi: (1) perencanaan; (2) kegiatan anak; dan (3) pemanfaatan media lokal.',
          rubrik: {
            4: 'Kreatif, konsisten dan memperkaya pengalaman anak.',
            3: 'Berjalan dengan baik.',
            2: 'Dilakukan sesekali.',
            1: 'Hampir tidak dimanfaatkan.'
          }
        }]
      },
      {
        kode: '3.3', no: 3,
        unsur: 'Pengembangan Jejaring yang Memberi Nilai Tambah.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA membangun jejaring dan kemitraan yang memberi nilai tambah bagi pengembangan RA.',
          penggalian: 'Nilai manfaat jejaring bagi warga RA, bukan banyaknya lembaga.',
          data: 'Dokumentasi kemitraan; program bersama; hasil kerja sama.',
          bukti: 'Wawancara dan telaah dokumen: (1) kemitraan; (2) program bersama; dan (3) manfaat.',
          rubrik: {
            4: 'Aktif, relevan dan menghasilkan manfaat nyata.',
            3: 'Aktif dan bermanfaat.',
            2: 'Terbatas/seremonial.',
            1: 'Tidak berkembang.'
          }
        }]
      },
      {
        kode: '3.4', no: 4,
        unsur: 'Inisiatif, Ketangguhan dan Pemecahan Masalah.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA menunjukkan inisiatif, ketangguhan dan kemampuan memecahkan masalah pengembangan RA secara nyata.',
          penggalian: 'Gunakan kasus nyata yang pernah dihadapi RA.',
          data: 'Studi kasus; wawancara; perubahan kebijakan/program; hasil pemecahan masalah.',
          bukti: 'Wawancara: (1) kasus nyata; (2) solusi yang diambil; dan (3) perubahan yang terjadi.',
          rubrik: {
            4: 'Masalah dianalisis dan solusi menghasilkan perubahan positif.',
            3: 'Masalah diselesaikan efektif.',
            2: 'Penyelesaian masih reaktif.',
            1: 'Masalah berulang tanpa penyelesaian.'
          }
        }]
      },
      {
        kode: '3.5', no: 5,
        unsur: 'Kewirausahaan Sosial-Edukatif dan Kemandirian RA.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA mengembangkan program inovatif dan/atau kewirausahaan sosial-edukatif yang mendukung keberlanjutan RA tanpa mengabaikan kepentingan terbaik anak.',
          penggalian: 'Kewirausahaan bukan kewajiban memiliki kantin, koperasi atau usaha jual beli.',
          data: 'Program; hasil kegiatan; pemanfaatan sumber daya; kerja sama; inovasi layanan.',
          bukti: 'Wawancara dan telaah dokumen: (1) program; (2) hasil; dan (3) keberlanjutan.',
          rubrik: {
            4: 'Relevan, kreatif, edukatif dan berkelanjutan.',
            3: 'Berjalan dan bermanfaat.',
            2: 'Dampaknya terbatas.',
            1: 'Tidak relevan/tidak sesuai prinsip pendidikan anak.'
          }
        }]
      }
    ]
  },
  {
    no: 4, code: 'SP', label: 'Supervisi Pembelajaran RA',
    aspek: [
      {
        kode: '4.1', no: 1,
        unsur: 'Perencanaan Supervisi Pembelajaran.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA menyusun program supervisi berdasarkan kebutuhan guru dan karakteristik pembelajaran RA.',
          penggalian: 'Gali apakah guru merasa supervisi direncanakan dengan jelas dan sesuai kebutuhan mereka.',
          data: 'Program supervisi; pemetaan kebutuhan; jadwal; instrumen; hasil supervisi sebelumnya.',
          bukti: 'Wawancara dan telaah dokumen: (1) program supervisi; (2) pemetaan kebutuhan; dan (3) jadwal.',
          rubrik: {
            4: 'Berbasis kebutuhan/data dengan fokus dan RTL jelas.',
            3: 'Relevan tetapi analisis kebutuhan belum optimal.',
            2: 'Dominan administratif.',
            1: 'Tidak memadai.'
          }
        }]
      },
      {
        kode: '4.2', no: 2,
        unsur: 'Pelaksanaan Supervisi Pembelajaran RA.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA melaksanakan supervisi yang berfokus pada kualitas pengalaman belajar anak, interaksi guru-anak, pembelajaran berbasis bermain dan asesmen autentik.',
          penggalian: 'Fokus: interaksi positif, keterlibatan anak, eksplorasi, bermain, komunikasi, kreativitas, pemecahan masalah, kesesuaian aktivitas dengan perkembangan, dan minimnya akademisasi berlebihan.',
          data: 'Instrumen supervisi; catatan observasi; wawancara guru; dokumentasi; refleksi.',
          bukti: 'Observasi dan wawancara: (1) pelaksanaan supervisi; (2) fokus pengamatan; dan (3) umpan balik.',
          rubrik: {
            4: 'Objektif, dialogis dan memberi gambaran mendalam tentang kualitas pembelajaran.',
            3: 'Terlaksana baik tetapi analisis belum mendalam.',
            2: 'Dominan memeriksa administrasi.',
            1: 'Tidak terlaksana memadai.'
          }
        }]
      },
      {
        kode: '4.3', no: 3,
        unsur: 'Tindak Lanjut Supervisi.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA menindaklanjuti supervisi melalui refleksi, coaching, pendampingan dan pengembangan kompetensi serta memantau perubahan praktik guru.',
          penggalian: 'Pertanyaan utama: apa yang berubah setelah supervisi?',
          data: 'Catatan umpan balik; RTL; coaching; komunitas belajar; observasi ulang; contoh perubahan praktik.',
          bukti: 'Wawancara dan telaah dokumen: (1) umpan balik; (2) pendampingan; dan (3) perubahan praktik.',
          rubrik: {
            4: 'Tindak lanjut spesifik, berkelanjutan dan terbukti mengubah praktik.',
            3: 'Berjalan tetapi monitoring dampak belum optimal.',
            2: 'Hanya pemberian umpan balik.',
            1: 'Tidak ada tindak lanjut bermakna.'
          }
        }]
      }
    ]
  },
  {
    no: 5, code: 'HK', label: 'Hasil Kinerja Kepala RA',
    aspek: [
      {
        kode: '5.1', no: 1,
        unsur: 'Dampak terhadap Kualitas Layanan dan Perkembangan Anak.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA menunjukkan dampak kepemimpinan terhadap peningkatan kualitas pengalaman belajar, kesejahteraan dan layanan perkembangan anak. (Khusus penilaian 4 tahunan.)',
          penggalian: 'Jangan membandingkan anak berdasarkan ranking; bandingkan kualitas layanan dari kondisi awal.',
          data: 'Data mutu; laporan perkembangan agregat; evaluasi program; survei orang tua.',
          bukti: 'Telaah dokumen: (1) data mutu; (2) laporan perkembangan; dan (3) survei orang tua.',
          rubrik: {
            4: 'Peningkatan jelas, konsisten dan didukung berbagai data.',
            3: 'Peningkatan nyata tetapi bukti belum komprehensif.',
            2: 'Perubahan masih terbatas.',
            1: 'Tidak ada bukti peningkatan berarti.'
          }
        }]
      },
      {
        kode: '5.2', no: 2,
        unsur: 'Dampak terhadap Guru dan Kualitas Pembelajaran.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA menunjukkan dampak kepemimpinan terhadap peningkatan kompetensi guru dan kualitas praktik pembelajaran. (Khusus penilaian 4 tahunan.)',
          penggalian: 'Bandingkan perubahan praktik guru, bukan jumlah sertifikat.',
          data: 'Hasil supervisi beberapa periode; portofolio guru; refleksi; praktik baik; komunitas belajar.',
          bukti: 'Wawancara dan telaah dokumen: (1) hasil supervisi; (2) praktik baik; dan (3) bukti perubahan.',
          rubrik: {
            4: 'Mayoritas guru menunjukkan perubahan nyata dan berkelanjutan.',
            3: 'Perubahan terlihat tetapi belum merata.',
            2: 'Pengembangan ada tetapi perubahan praktik terbatas.',
            1: 'Tidak terlihat dampak.'
          }
        }]
      },
      {
        kode: '5.3', no: 3,
        unsur: 'Dampak terhadap Mutu Kelembagaan RA.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA menunjukkan peningkatan mutu kelembagaan dalam tata kelola, lingkungan belajar, kemitraan, inovasi dan keberlanjutan program. (Khusus penilaian 4 tahunan.)',
          penggalian: 'Nilai tren perubahan selama periode kepemimpinan, bukan hanya kondisi hari penilaian.',
          data: 'Data kelembagaan beberapa tahun; evaluasi diri; data layanan; kemitraan; inovasi; akreditasi bila relevan.',
          bukti: 'Telaah dokumen: (1) data kelembagaan; (2) evaluasi diri; dan (3) bukti peningkatan.',
          rubrik: {
            4: 'Peningkatan konsisten pada berbagai dimensi.',
            3: 'Peningkatan nyata tetapi belum merata.',
            2: 'Perubahan terbatas/tidak konsisten.',
            1: 'Tidak ada perkembangan berarti.'
          }
        }]
      },
      {
        kode: '5.4', no: 4,
        unsur: 'Dampak Kepemimpinan dan Pengembangan Profesional Kepala RA.',
        indikator: [{
          no: 1,
          indikator: 'Kepala RA menunjukkan perkembangan kompetensi kepribadian, sosial dan profesional serta penerapannya untuk menghasilkan perubahan positif bagi RA. (Khusus penilaian 4 tahunan.)',
          penggalian: 'Diklat, gelar, seminar dan sertifikat hanya bukti pendukung, bukan alasan otomatis memberi nilai tinggi.',
          data: 'Refleksi pengembangan diri; hasil evaluasi kinerja; praktik kepemimpinan; inovasi; kontribusi organisasi profesi; karya/praktik baik.',
          bukti: 'Telaah dokumen dan wawancara: (1) refleksi pengembangan diri; (2) praktik kepemimpinan; dan (3) dampak nyata.',
          rubrik: {
            4: 'Pengembangan diri terencana, reflektif dan berdampak nyata.',
            3: 'Aktif dan diterapkan tetapi bukti dampak belum optimal.',
            2: 'Kegiatan banyak tetapi penerapan/dampak terbatas.',
            1: 'Pengembangan sangat terbatas.'
          }
        }]
      }
    ]
  }
];
