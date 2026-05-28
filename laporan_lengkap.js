// laporan_lengkap.js — Generator Laporan Lengkap PKKM
// Struktur:
//   Cover → Lembar Pengesahan → Kata Pengantar → Daftar Isi
//   BAB I  Pendahuluan
//   BAB II Landasan Teori & Regulasi
//   BAB III Pelaksanaan Penilaian
//   BAB IV Hasil dan Pembahasan
//   BAB V Penutup
//   Lampiran (rekap skor per indikator)
//   TTD
//
// Penggunaan: window.renderLaporanLengkap(penilaian_id) → return HTML string
// Atau via route #/laporan-lengkap/:id

(function () {
  'use strict';

  function fmtTanggalLengkap(iso) {
    if (!iso) return '...';
    try {
      const d = new Date(iso);
      const bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
      return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
    } catch (e) { return iso; }
  }

  function escapeHTML(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function fmtNilai(n) {
    if (n == null || isNaN(n)) return '-';
    return Number(n).toFixed(2);
  }

  // ===== Section builders =====

  function buildCover(ctx) {
    const { kamad, periode, pengawas, pokjawas, tempat, judulPeriode } = ctx;
    return `
      <section class="ll-page ll-cover">
        <div class="ll-cover-inner">
          <div class="ll-cover-top">
            <div class="ll-cover-instansi">KEMENTERIAN AGAMA REPUBLIK INDONESIA<br>KANTOR KEMENTERIAN AGAMA KABUPATEN JEMBER<br>POKJAWAS MADRASAH</div>
          </div>
          <div class="ll-cover-mid">
            <h1 class="ll-cover-title">LAPORAN<br>PENILAIAN KINERJA<br>KEPALA MADRASAH<br>(PKKM)</h1>
            <div class="ll-cover-sub">${escapeHTML(judulPeriode)}</div>
            <div class="ll-cover-identitas">
              <div>Nama Kepala Madrasah</div>
              <div class="ll-cover-nama">${escapeHTML(kamad.nama || '')}</div>
              <div>NIP. ${escapeHTML(kamad.nip || '-')}</div>
              <div class="mt-3">${escapeHTML(kamad.nama_madrasah || '-')}</div>
              <div>${escapeHTML(kamad.alamat || '')}</div>
            </div>
          </div>
          <div class="ll-cover-bot">
            <div>Disusun oleh:</div>
            <div class="ll-cover-pengawas"><strong>${escapeHTML(pengawas.nama || '..............................')}</strong></div>
            <div>NIP. ${escapeHTML(pengawas.nip || '-')}</div>
            <div class="mt-2"><strong>POKJAWAS MADRASAH KAB. JEMBER</strong></div>
            <div>TAHUN ${new Date().getFullYear()}</div>
          </div>
        </div>
      </section>`;
  }

  function buildPengesahan(ctx) {
    const { kamad, periode, pengawas, pokjawas, tempat, judulPeriode } = ctx;
    const tglStr = fmtTanggalLengkap(periode.tanggal_penilaian || new Date().toISOString());
    return `
      <section class="ll-page">
        <h2 class="ll-h">LEMBAR PENGESAHAN</h2>
        <p>Laporan Penilaian Kinerja Kepala Madrasah (PKKM) ${escapeHTML(judulPeriode)} atas:</p>
        <table class="ll-id-table">
          <tr><td width="180">Nama</td><td>: ${escapeHTML(kamad.nama || '-')}</td></tr>
          <tr><td>NIP</td><td>: ${escapeHTML(kamad.nip || '-')}</td></tr>
          <tr><td>Pangkat / Golongan</td><td>: ${escapeHTML(kamad.pangkat || '-')}</td></tr>
          <tr><td>Jabatan</td><td>: Kepala Madrasah</td></tr>
          <tr><td>Unit Kerja</td><td>: ${escapeHTML(kamad.nama_madrasah || '-')}</td></tr>
        </table>
        <p>Telah dilaksanakan oleh Pengawas Madrasah dan dinyatakan sah sebagai laporan resmi PKKM untuk diteruskan kepada Kepala Kantor Kementerian Agama Kabupaten Jember melalui Pokjawas Madrasah.</p>

        <div class="ll-ttd-grid mt-5">
          <div class="ll-ttd-box">
            <div>Mengetahui,</div>
            <div>Ketua Pokjawas Madrasah Kab. Jember</div>
            <div class="ll-ttd-spacer"></div>
            <div class="ll-ttd-name">${escapeHTML(pokjawas.nama || '..............................')}</div>
            <div>NIP. ${escapeHTML(pokjawas.nip || '-')}</div>
          </div>
          <div class="ll-ttd-box">
            <div>${escapeHTML(tempat)}, ${escapeHTML(tglStr)}</div>
            <div>Pengawas Madrasah,</div>
            <div class="ll-ttd-spacer"></div>
            <div class="ll-ttd-name">${escapeHTML(pengawas.nama || '..............................')}</div>
            <div>NIP. ${escapeHTML(pengawas.nip || '-')}</div>
          </div>
        </div>
      </section>`;
  }

  function buildKataPengantar(ctx) {
    const { kamad, periode, pengawas, tempat } = ctx;
    const tglStr = fmtTanggalLengkap(periode.tanggal_penilaian || new Date().toISOString());
    return `
      <section class="ll-page">
        <h2 class="ll-h">KATA PENGANTAR</h2>
        <p style="text-indent:2em;">Puji syukur ke hadirat Allah SWT yang telah melimpahkan rahmat, taufik, dan hidayah-Nya sehingga laporan Penilaian Kinerja Kepala Madrasah (PKKM) ini dapat tersusun dengan baik. Shalawat serta salam senantiasa tercurah kepada Nabi Muhammad SAW, keluarga, sahabat, dan para pengikutnya hingga akhir zaman.</p>
        <p style="text-indent:2em;">Penilaian Kinerja Kepala Madrasah merupakan amanat regulasi yang bertujuan untuk menjamin mutu kepemimpinan madrasah, meningkatkan akuntabilitas pengelolaan pendidikan, serta menjadi dasar pembinaan dan pengembangan keprofesian Kepala Madrasah secara berkelanjutan. PKKM dilaksanakan dengan instrumen yang mengukur lima komponen utama: Pengembangan Madrasah, Pelaksanaan Tugas Manajerial, Pengembangan Kewirausahaan, Supervisi terhadap Guru dan Tenaga Kependidikan, serta Hasil Kinerja Kepala Madrasah.</p>
        <p style="text-indent:2em;">Laporan ini disusun sebagai dokumentasi resmi pelaksanaan PKKM atas Saudara <strong>${escapeHTML(kamad.nama || '-')}</strong> selaku Kepala <strong>${escapeHTML(kamad.nama_madrasah || '-')}</strong> pada periode penilaian <strong>${escapeHTML(periode.label || '-')}</strong>. Penyusunan laporan ini berpedoman pada regulasi terbaru yang mengatur penilaian kinerja kepala madrasah, terutama KMA Nomor 624 Tahun 2021 tentang Pedoman Penilaian Kinerja Kepala Madrasah serta Peraturan Menteri PAN dan RB Nomor 6 Tahun 2022 tentang Pengelolaan Kinerja Pegawai ASN.</p>
        <p style="text-indent:2em;">Penyusun menyampaikan terima kasih kepada Kepala Kantor Kementerian Agama Kabupaten Jember, Ketua Pokjawas Madrasah, rekan-rekan pengawas, kepala madrasah, dewan guru, tenaga kependidikan, komite, serta seluruh pihak yang telah mendukung kelancaran proses penilaian ini. Saran dan masukan untuk perbaikan laporan sangat penyusun harapkan demi peningkatan kualitas penilaian di masa mendatang.</p>
        <p style="text-indent:2em;">Semoga laporan ini bermanfaat sebagai bahan refleksi dan acuan pembinaan kepala madrasah di lingkungan Kementerian Agama Kabupaten Jember.</p>
        <div class="text-end mt-4">
          <div>${escapeHTML(tempat)}, ${escapeHTML(tglStr)}</div>
          <div>Penyusun,</div>
          <div class="mt-5"><strong><u>${escapeHTML(pengawas.nama || '..............................')}</u></strong></div>
          <div>NIP. ${escapeHTML(pengawas.nip || '-')}</div>
        </div>
      </section>`;
  }

  function buildDaftarIsi() {
    return `
      <section class="ll-page">
        <h2 class="ll-h">DAFTAR ISI</h2>
        <table class="ll-toc">
          <tr><td>HALAMAN JUDUL</td><td class="text-end">i</td></tr>
          <tr><td>LEMBAR PENGESAHAN</td><td class="text-end">ii</td></tr>
          <tr><td>KATA PENGANTAR</td><td class="text-end">iii</td></tr>
          <tr><td>DAFTAR ISI</td><td class="text-end">iv</td></tr>
          <tr><td><strong>BAB I PENDAHULUAN</strong></td><td class="text-end">1</td></tr>
          <tr><td class="ps-4">A. Latar Belakang</td><td class="text-end">1</td></tr>
          <tr><td class="ps-4">B. Dasar Hukum</td><td class="text-end">2</td></tr>
          <tr><td class="ps-4">C. Tujuan</td><td class="text-end">2</td></tr>
          <tr><td class="ps-4">D. Sasaran dan Ruang Lingkup</td><td class="text-end">3</td></tr>
          <tr><td><strong>BAB II LANDASAN TEORI DAN REGULASI</strong></td><td class="text-end">4</td></tr>
          <tr><td class="ps-4">A. Konsep Penilaian Kinerja Kepala Madrasah</td><td class="text-end">4</td></tr>
          <tr><td class="ps-4">B. Komponen dan Indikator PKKM</td><td class="text-end">4</td></tr>
          <tr><td class="ps-4">C. Regulasi Terkait</td><td class="text-end">5</td></tr>
          <tr><td><strong>BAB III PELAKSANAAN PENILAIAN</strong></td><td class="text-end">6</td></tr>
          <tr><td class="ps-4">A. Waktu dan Tempat</td><td class="text-end">6</td></tr>
          <tr><td class="ps-4">B. Tim Penilai</td><td class="text-end">6</td></tr>
          <tr><td class="ps-4">C. Instrumen dan Prosedur</td><td class="text-end">6</td></tr>
          <tr><td><strong>BAB IV HASIL DAN PEMBAHASAN</strong></td><td class="text-end">7</td></tr>
          <tr><td class="ps-4">A. Identitas Kepala Madrasah</td><td class="text-end">7</td></tr>
          <tr><td class="ps-4">B. Rekapitulasi Nilai per Komponen</td><td class="text-end">7</td></tr>
          <tr><td class="ps-4">C. Pembahasan</td><td class="text-end">8</td></tr>
          <tr><td><strong>BAB V PENUTUP</strong></td><td class="text-end">9</td></tr>
          <tr><td class="ps-4">A. Simpulan</td><td class="text-end">9</td></tr>
          <tr><td class="ps-4">B. Rekomendasi Pembinaan</td><td class="text-end">9</td></tr>
          <tr><td><strong>LAMPIRAN: Hasil Skor per Indikator</strong></td><td class="text-end">10</td></tr>
        </table>
      </section>`;
  }

  function buildBabI(ctx) {
    const { kamad, periode, judulPeriode } = ctx;
    return `
      <section class="ll-page">
        <h2 class="ll-h">BAB I<br>PENDAHULUAN</h2>

        <h3 class="ll-h3">A. Latar Belakang</h3>
        <p style="text-indent:2em;">Kepala Madrasah memegang peran strategis dalam mewujudkan madrasah yang bermutu, berdaya saing, dan berkarakter. Kualitas kepemimpinan kepala madrasah berbanding lurus dengan mutu proses pendidikan dan capaian peserta didik. Untuk menjamin mutu kepemimpinan tersebut, diperlukan mekanisme penilaian kinerja yang sistematis, terukur, akuntabel, dan dilaksanakan secara berkelanjutan.</p>
        <p style="text-indent:2em;">Penilaian Kinerja Kepala Madrasah (PKKM) merupakan instrumen evaluasi yang dilakukan oleh Pengawas Madrasah, dengan melibatkan unsur guru, tenaga kependidikan, komite, dan stakeholder lainnya pada penilaian empat tahunan. PKKM menjadi dasar pembinaan, pengembangan keprofesian, kenaikan jenjang, perpanjangan masa tugas, serta penilaian akuntabilitas kinerja kepala madrasah.</p>
        <p style="text-indent:2em;">Berdasarkan KMA Nomor 624 Tahun 2021 dan regulasi pendukung, PKKM dilaksanakan setiap tahun (penilaian tahunan) dan diakhiri dengan penilaian empat tahunan yang melibatkan tim penilai lebih lengkap. Hasil PKKM diolah untuk menghasilkan nilai akhir dan sebutan yang menggambarkan kinerja kepala madrasah pada periode tertentu.</p>

        <h3 class="ll-h3">B. Dasar Hukum</h3>
        <ol class="ll-ol">
          <li>Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;</li>
          <li>Undang-Undang Nomor 14 Tahun 2005 tentang Guru dan Dosen;</li>
          <li>Peraturan Pemerintah Nomor 19 Tahun 2017 tentang Perubahan atas PP Nomor 74 Tahun 2008 tentang Guru;</li>
          <li>Peraturan Menteri Agama Nomor 58 Tahun 2017 tentang Kepala Madrasah, sebagaimana diubah dengan PMA Nomor 24 Tahun 2018;</li>
          <li>Peraturan Menteri Pendayagunaan Aparatur Negara dan Reformasi Birokrasi Nomor 6 Tahun 2022 tentang Pengelolaan Kinerja Pegawai Aparatur Sipil Negara;</li>
          <li>Keputusan Menteri Agama Nomor 624 Tahun 2021 tentang Pedoman Penilaian Kinerja Kepala Madrasah;</li>
          <li>Peraturan Menteri Agama Nomor 31 Tahun 2013 tentang Pengawas Madrasah;</li>
          <li>Surat Edaran Direktur Jenderal Pendidikan Islam terkait pelaksanaan PKKM tahun berjalan.</li>
        </ol>

        <h3 class="ll-h3">C. Tujuan</h3>
        <p>Penilaian Kinerja Kepala Madrasah ini bertujuan untuk:</p>
        <ol class="ll-ol">
          <li>Mengukur capaian kinerja kepala madrasah pada lima komponen utama PKKM;</li>
          <li>Memberikan umpan balik objektif kepada kepala madrasah sebagai bahan refleksi dan perbaikan;</li>
          <li>Menyediakan data dasar pembinaan dan pengembangan keprofesian berkelanjutan (PKB);</li>
          <li>Menjadi bahan pertimbangan kebijakan kepegawaian, termasuk perpanjangan masa tugas dan promosi;</li>
          <li>Mendorong peningkatan mutu pengelolaan madrasah secara berkelanjutan.</li>
        </ol>

        <h3 class="ll-h3">D. Sasaran dan Ruang Lingkup</h3>
        <p style="text-indent:2em;">Sasaran penilaian ini adalah Saudara <strong>${escapeHTML(kamad.nama || '-')}</strong>, Kepala <strong>${escapeHTML(kamad.nama_madrasah || '-')}</strong>, pada periode <strong>${escapeHTML(judulPeriode)}</strong>. Ruang lingkup penilaian mencakup lima komponen PKKM (Pengembangan Madrasah, Manajerial, Kewirausahaan, Supervisi GTK, dan Hasil Kinerja Kepala Madrasah) dengan instrumen yang berpedoman pada KMA 624 Tahun 2021. Penilaian terhadap komponen Hasil Kinerja Kepala Madrasah dilaksanakan secara khusus pada penilaian empat tahunan.</p>
      </section>`;
  }

  function buildBabII() {
    return `
      <section class="ll-page">
        <h2 class="ll-h">BAB II<br>LANDASAN TEORI DAN REGULASI</h2>

        <h3 class="ll-h3">A. Konsep Penilaian Kinerja Kepala Madrasah</h3>
        <p style="text-indent:2em;">Penilaian Kinerja Kepala Madrasah merupakan proses pengumpulan, pengolahan, dan analisis data terhadap pelaksanaan tugas pokok dan fungsi kepala madrasah dalam mengelola lembaga pendidikan. PKKM bersifat formatif (untuk pembinaan) dan sumatif (untuk pengambilan keputusan), serta dilaksanakan secara berkala oleh pengawas madrasah dengan melibatkan stakeholder pendidikan.</p>
        <p style="text-indent:2em;">Hasil PKKM diharapkan dapat memberi gambaran utuh tentang capaian kepemimpinan kepala madrasah, baik pada aspek manajerial maupun supervisi akademik, sekaligus mengidentifikasi area pengembangan profesional yang masih perlu ditingkatkan.</p>

        <h3 class="ll-h3">B. Komponen dan Indikator PKKM</h3>
        <p>Sesuai instrumen resmi yang berlaku, PKKM terdiri atas <strong>5 komponen</strong> dan <strong>29 sub-aspek (108 indikator)</strong>:</p>
        <ol class="ll-ol">
          <li><strong>Pengembangan Madrasah (PM)</strong> — meliputi visi-misi, RKM/RKAM, supervisi, kepemimpinan, kompetensi sosial, dan budaya madrasah.</li>
          <li><strong>Pelaksanaan Tugas Manajerial (MJ)</strong> — meliputi perencanaan, pengorganisasian, pelaksanaan, pengawasan, kepegawaian, sarpras, keuangan, dan SIM.</li>
          <li><strong>Pengembangan Kewirausahaan (KW)</strong> — meliputi inovasi, kerja keras, motivasi, pantang menyerah, dan kerja sama lintas pihak.</li>
          <li><strong>Supervisi kepada Guru dan Tenaga Kependidikan (SP)</strong> — meliputi perencanaan supervisi, pelaksanaan supervisi, dan tindak lanjut hasil supervisi.</li>
          <li><strong>Hasil Kinerja Kepala Madrasah (HK)</strong> — capaian mutu pembelajaran, prestasi akademik dan non-akademik, akreditasi, kemitraan, serta kepuasan stakeholder. Komponen ini dinilai pada penilaian <em>empat tahunan</em>.</li>
        </ol>
        <p>Skor diberikan pada skala 1-4 (1 = Kurang, 2 = Cukup, 3 = Baik, 4 = Amat Baik). Nilai komponen dihitung dari rata-rata sub-aspek, dan nilai akhir adalah rata-rata terbobot dari komponen.</p>

        <h3 class="ll-h3">C. Regulasi Terkait</h3>
        <ol class="ll-ol">
          <li><strong>KMA Nomor 624 Tahun 2021</strong> — Pedoman Penilaian Kinerja Kepala Madrasah; menetapkan instrumen, prosedur, dan pengolahan nilai PKKM.</li>
          <li><strong>PMA Nomor 58 Tahun 2017 jo. PMA 24/2018</strong> — Kepala Madrasah; mengatur tugas, kompetensi, dan masa tugas kepala madrasah.</li>
          <li><strong>Permenpan RB Nomor 6 Tahun 2022</strong> — Pengelolaan Kinerja Pegawai ASN; mengatur siklus kinerja pegawai termasuk penyusunan SKP dan evaluasi.</li>
          <li><strong>PMA Nomor 31 Tahun 2013</strong> — Pengawas Madrasah; menetapkan kewenangan pengawas dalam pelaksanaan PKKM.</li>
          <li>Pedoman teknis tahunan yang diterbitkan oleh Direktorat KSKK Madrasah dan/atau Pokjawas Madrasah Provinsi/Kabupaten.</li>
        </ol>
      </section>`;
  }

  function buildBabIII(ctx) {
    const { kamad, periode, pengawas, pokjawas, tempat, sessions, isFourYear } = ctx;
    const ROLES = window.PKKM_ROLES || [];
    const sessRoleLabels = sessions.map(s => {
      const r = ROLES.find(x => x.code === (s.role || 'pengawas_1'));
      return r ? r.label : (s.role || '-');
    });
    return `
      <section class="ll-page">
        <h2 class="ll-h">BAB III<br>PELAKSANAAN PENILAIAN</h2>

        <h3 class="ll-h3">A. Waktu dan Tempat</h3>
        <p style="text-indent:2em;">Penilaian Kinerja Kepala Madrasah dilaksanakan pada periode <strong>${escapeHTML(periode.label || '-')}</strong> dengan tanggal pelaksanaan <strong>${escapeHTML(fmtTanggalLengkap(periode.tanggal_penilaian || ''))}</strong>, bertempat di <strong>${escapeHTML(kamad.nama_madrasah || '-')}</strong>, ${escapeHTML(kamad.alamat || tempat || '')}.</p>

        <h3 class="ll-h3">B. Tim Penilai</h3>
        <p>${isFourYear
          ? 'Penilaian empat tahunan ini dilaksanakan oleh tim penilai lengkap yang melibatkan unsur Pengawas, Guru, Tenaga Kependidikan, Komite, Kepala Seksi/Ketua Yayasan, dan Kepala Bidang.'
          : 'Penilaian tahunan ini dilaksanakan oleh Pengawas Madrasah I dan II.'}</p>
        <p>Daftar tim penilai pada periode ini:</p>
        <ol class="ll-ol">
          ${sessRoleLabels.length
            ? sessRoleLabels.map(l => `<li>${escapeHTML(l)}</li>`).join('')
            : `<li>${escapeHTML(pengawas.nama || '-')} — Pengawas Madrasah</li>`}
        </ol>

        <h3 class="ll-h3">C. Instrumen dan Prosedur</h3>
        <p style="text-indent:2em;">Instrumen yang digunakan adalah instrumen baku PKKM yang merujuk pada KMA 624 Tahun 2021, terdiri atas <strong>5 komponen, 29 sub-aspek, dan 108 indikator</strong>. Setiap indikator dinilai dengan skala 1-4 (Kurang, Cukup, Baik, Amat Baik) berdasarkan bukti dokumen, hasil observasi langsung, serta wawancara dengan kepala madrasah dan stakeholder terkait.</p>
        <p>Prosedur penilaian meliputi:</p>
        <ol class="ll-ol">
          <li><strong>Pra-penilaian</strong> — koordinasi jadwal, penyiapan instrumen, sosialisasi kepada kepala madrasah.</li>
          <li><strong>Pelaksanaan</strong> — pengumpulan data melalui telaah dokumen, observasi, dan wawancara terstruktur.</li>
          <li><strong>Pengolahan</strong> — pemberian skor per indikator, perhitungan nilai sub-aspek, nilai komponen, dan nilai akhir terbobot.</li>
          <li><strong>Pelaporan</strong> — penyusunan laporan, klarifikasi hasil, serta penyampaian rekomendasi pembinaan dan PKB.</li>
        </ol>
      </section>`;
  }

  function buildBabIV(ctx) {
    const { kamad, periode, akhir, sebutan, isFourYear } = ctx;
    const KOMP = window.PKKM_KOMPONEN_META || window.PKKM_KOMPONEN || [];

    // Build tabel rekap komponen
    const detailMap = {};
    for (const d of (akhir.detail || [])) detailMap[d.code] = d;
    const rowsKomp = KOMP.map(km => {
      const d = detailMap[km.code];
      if (!d) return `<tr><td>${km.no}.</td><td>${escapeHTML(km.label)}</td><td class="text-end">-</td><td class="text-end">${km.bobot_default || 20}%</td><td class="text-center">-</td></tr>`;
      const seb = window.getPKKMSebutan ? window.getPKKMSebutan(d.nilai) : null;
      return `<tr><td>${km.no}.</td><td>${escapeHTML(km.label)}</td><td class="text-end">${fmtNilai(d.nilai)}</td><td class="text-end">${d.bobot}%</td><td class="text-center">${seb ? seb.label : '-'}</td></tr>`;
    }).join('');

    // Identifikasi tertinggi/terendah
    const sortedDetail = [...(akhir.detail || [])].sort((a,b) => b.nilai - a.nilai);
    const tertinggi = sortedDetail[0];
    const terendah = sortedDetail[sortedDetail.length - 1];

    // Sub-aspek terendah top 3
    const subRows = [];
    for (const k of (window.PKKM_INSTRUMEN_PENGAWAS || window.PKKM_KOMPONEN || [])) {
      if (!isFourYear && k.code === 'HK') continue;
      for (const a of k.aspek) {
        const ha = window.hitungNilaiAspek(akhir.penilaian_id || ctx.penilaian_id, k.code, a.kode);
        if (ha.terisi > 0) {
          subRows.push({ komponen: k.label, kode: a.kode, unsur: a.unsur, nilai: ha.nilai });
        }
      }
    }
    subRows.sort((a,b) => a.nilai - b.nilai);
    const top3 = subRows.slice(0, 3);

    return `
      <section class="ll-page">
        <h2 class="ll-h">BAB IV<br>HASIL DAN PEMBAHASAN</h2>

        <h3 class="ll-h3">A. Identitas Kepala Madrasah</h3>
        <table class="ll-id-table">
          <tr><td width="200">Nama</td><td>: ${escapeHTML(kamad.nama || '-')}</td></tr>
          <tr><td>NIP</td><td>: ${escapeHTML(kamad.nip || '-')}</td></tr>
          <tr><td>Pangkat / Golongan</td><td>: ${escapeHTML(kamad.pangkat || '-')}</td></tr>
          <tr><td>Jabatan</td><td>: Kepala Madrasah</td></tr>
          <tr><td>Unit Kerja</td><td>: ${escapeHTML(kamad.nama_madrasah || '-')}</td></tr>
          <tr><td>Alamat</td><td>: ${escapeHTML(kamad.alamat || '-')}</td></tr>
          <tr><td>NSM</td><td>: ${escapeHTML(kamad.nsm || '-')}</td></tr>
          <tr><td>Periode Penilaian</td><td>: ${escapeHTML(periode.label || '-')}</td></tr>
        </table>

        <h3 class="ll-h3">B. Rekapitulasi Nilai per Komponen</h3>
        <table class="ll-table">
          <thead>
            <tr><th width="40">No</th><th>Komponen</th><th class="text-end" width="80">Nilai</th><th class="text-end" width="70">Bobot</th><th class="text-center" width="120">Sebutan</th></tr>
          </thead>
          <tbody>${rowsKomp}</tbody>
          <tfoot>
            <tr class="ll-row-total">
              <th colspan="2" class="text-end">NILAI AKHIR PKKM</th>
              <th class="text-end">${fmtNilai(akhir.nilaiAkhir)}</th>
              <th class="text-end">100%</th>
              <th class="text-center"><strong>${sebutan ? sebutan.label : '-'}</strong></th>
            </tr>
          </tfoot>
        </table>

        <h3 class="ll-h3">C. Pembahasan</h3>
        <p style="text-indent:2em;">Berdasarkan rekapitulasi di atas, Saudara <strong>${escapeHTML(kamad.nama || '-')}</strong> memperoleh nilai akhir <strong>${fmtNilai(akhir.nilaiAkhir)}</strong> dengan sebutan <strong>${sebutan ? sebutan.label : '-'}</strong>. ${tertinggi ? `Komponen dengan capaian tertinggi adalah <strong>${escapeHTML(tertinggi.label)}</strong> (${fmtNilai(tertinggi.nilai)}), menunjukkan kekuatan yang perlu dipertahankan dan dikembangkan menjadi praktik baik.` : ''} ${terendah && tertinggi && terendah.code !== tertinggi.code ? `Sebaliknya, komponen <strong>${escapeHTML(terendah.label)}</strong> (${fmtNilai(terendah.nilai)}) menjadi area prioritas pengembangan.` : ''}</p>
        ${top3.length ? `
          <p>Tiga sub-aspek dengan nilai terendah dan menjadi prioritas pembinaan adalah:</p>
          <ol class="ll-ol">
            ${top3.map(sa => `<li><strong>${escapeHTML(sa.kode)}</strong> ${escapeHTML(sa.unsur)} (${escapeHTML(sa.komponen)}) — nilai ${fmtNilai(sa.nilai)}.</li>`).join('')}
          </ol>` : ''}
        <p style="text-indent:2em;">Pembinaan terhadap sub-aspek tersebut diharapkan dilakukan secara terstruktur melalui kegiatan Pengembangan Keprofesian Berkelanjutan (PKB), baik berupa diklat, bimbingan teknis, kegiatan kolektif, maupun pendampingan oleh pengawas.</p>
      </section>`;
  }

  function buildBabV(ctx) {
    const { kamad, akhir, sebutan, pkbItems } = ctx;
    return `
      <section class="ll-page">
        <h2 class="ll-h">BAB V<br>PENUTUP</h2>

        <h3 class="ll-h3">A. Simpulan</h3>
        <ol class="ll-ol">
          <li>Penilaian Kinerja Kepala Madrasah atas Saudara <strong>${escapeHTML(kamad.nama || '-')}</strong> telah dilaksanakan sesuai pedoman dan instrumen yang berlaku.</li>
          <li>Hasil penilaian menunjukkan nilai akhir sebesar <strong>${fmtNilai(akhir.nilaiAkhir)}</strong> dengan sebutan <strong>${sebutan ? sebutan.label : '-'}</strong>.</li>
          <li>Capaian tersebut mencerminkan dedikasi dan komitmen yang bersangkutan dalam menjalankan tugas sebagai Kepala Madrasah.</li>
        </ol>

        <h3 class="ll-h3">B. Rekomendasi Pembinaan</h3>
        <p>Berdasarkan analisis terhadap sub-aspek dengan capaian terendah, prioritas pembinaan diarahkan pada hal-hal berikut:</p>
        ${(pkbItems && pkbItems.length) ? `
          <ol class="ll-ol">
            ${pkbItems.map(p => `<li><strong>${escapeHTML(p.sub_aspek_kode)}</strong> ${escapeHTML(p.sub_aspek_unsur || '-')} — direkomendasikan kegiatan <em>${escapeHTML(p.kegiatan_pkb || '-')}</em> (${escapeHTML(p.jenis_pkb || '-')}, unsur ${escapeHTML(p.unsur_pkb || '-')}). ${p.catatan ? `Catatan: ${escapeHTML(p.catatan)}` : ''}</li>`).join('')}
          </ol>` : `
          <ol class="ll-ol">
            <li>Mengikuti diklat penguatan kompetensi kepala madrasah yang relevan.</li>
            <li>Aktif dalam forum KKMA, MGMP, dan komunitas belajar untuk pertukaran praktik baik.</li>
            <li>Menyusun dan menjalankan rencana PKB tahunan.</li>
          </ol>`}
        <p style="text-indent:2em;">Demikian laporan ini disusun untuk dapat dipergunakan sebagaimana mestinya. Semoga laporan ini dapat menjadi bahan refleksi dan dasar pembinaan kepala madrasah dalam meningkatkan kualitas pengelolaan madrasah secara berkelanjutan.</p>
      </section>`;
  }

  function buildLampiran(ctx) {
    const { penilaian_id, isFourYear } = ctx;
    const KOMP_LIST = (window.PKKM_INSTRUMEN_PENGAWAS || window.PKKM_KOMPONEN || []);
    const skorRows = window.Skor.forPenilaian(penilaian_id);
    const skorMap = {};
    for (const s of skorRows) if (s.indikator_id) skorMap[s.indikator_id] = s;

    const blocks = KOMP_LIST.filter(k => isFourYear || k.code !== 'HK').map(k => {
      const aspekHtml = k.aspek.map(a => {
        const indikatorHtml = a.indikator.map(ind => {
          const id = `${k.code}_${a.kode}_${ind.no}`;
          const cur = skorMap[id] || {};
          const skor = cur.skor != null ? cur.skor : '-';
          return `<tr>
            <td width="50" class="text-center">${ind.no}</td>
            <td>${escapeHTML(ind.indikator || '')}</td>
            <td width="60" class="text-center"><strong>${skor}</strong></td>
          </tr>`;
        }).join('');
        return `
          <tr class="ll-sub-aspek-row"><td colspan="3"><strong>${escapeHTML(a.kode)} · ${escapeHTML(a.unsur || '')}</strong></td></tr>
          ${indikatorHtml}`;
      }).join('');
      return `
        <h3 class="ll-h3">Komponen ${k.no}. ${escapeHTML(k.label)}</h3>
        <table class="ll-table">
          <thead>
            <tr><th>No</th><th>Indikator</th><th class="text-center">Skor</th></tr>
          </thead>
          <tbody>${aspekHtml}</tbody>
        </table>`;
    }).join('');

    return `
      <section class="ll-page">
        <h2 class="ll-h">LAMPIRAN<br>HASIL SKOR PER INDIKATOR</h2>
        <p>Berikut rincian skor per indikator pada lima komponen penilaian. Skala penilaian: 1 (Kurang), 2 (Cukup), 3 (Baik), 4 (Amat Baik).</p>
        ${blocks}
      </section>`;
  }

  function buildTTD(ctx) {
    const { pengawas, pokjawas, tempat, periode } = ctx;
    const tglStr = fmtTanggalLengkap(periode.tanggal_penilaian || new Date().toISOString());
    return `
      <section class="ll-page ll-ttd-page">
        <div class="ll-ttd-grid mt-5">
          <div class="ll-ttd-box">
            <div>Mengetahui,</div>
            <div>Ketua Pokjawas Madrasah Kab. Jember</div>
            <div class="ll-ttd-spacer"></div>
            <div class="ll-ttd-name">${escapeHTML(pokjawas.nama || '..............................')}</div>
            <div>NIP. ${escapeHTML(pokjawas.nip || '-')}</div>
          </div>
          <div class="ll-ttd-box">
            <div>${escapeHTML(tempat)}, ${escapeHTML(tglStr)}</div>
            <div>Pengawas Madrasah,</div>
            <div class="ll-ttd-spacer"></div>
            <div class="ll-ttd-name">${escapeHTML(pengawas.nama || '..............................')}</div>
            <div>NIP. ${escapeHTML(pengawas.nip || '-')}</div>
          </div>
        </div>
      </section>`;
  }

  // ===== Public entry =====

  function renderLaporanLengkap(penilaian_id) {
    const pen = window.Penilaian.get(penilaian_id);
    if (!pen) return `<div class="alert alert-warning">Penilaian tidak ditemukan.</div>`;
    const kamad = window.Kamad.get(pen.kamad_id) || {};
    const periode = window.Periode.get(pen.periode_id) || {};
    const sessions = window.Penilaian.forKamadPeriode(pen.kamad_id, pen.periode_id) || [];
    const akhir = window.hitungNilaiAkhir(penilaian_id);
    const sebutan = window.getPKKMSebutan ? window.getPKKMSebutan(akhir.nilaiAkhir) : null;
    const pengawas = window.Meta.get('identitas_pengawas', { nama: '', nip: '' });
    const pokjawas = window.Meta.get('identitas_ketua_pokjawas', { nama: 'SUBARIYANTO, S.Pd, M.Pd.I', nip: '197002122005011004' });
    const tempat = window.Meta.get('lokasi_ttd', 'Jember');
    const isFourYear = periode.type === 'tahun_4';
    const judulPeriode = periode.label || '-';
    const pkbItems = (window.PKB && window.PKB.forKamadPeriode) ? window.PKB.forKamadPeriode(pen.kamad_id, pen.periode_id) : [];

    const ctx = {
      penilaian_id, pen, kamad, periode, sessions, akhir, sebutan,
      pengawas, pokjawas, tempat, isFourYear, judulPeriode, pkbItems,
    };

    return `
      <div class="ll-doc">
        ${buildCover(ctx)}
        ${buildPengesahan(ctx)}
        ${buildKataPengantar(ctx)}
        ${buildDaftarIsi()}
        ${buildBabI(ctx)}
        ${buildBabII()}
        ${buildBabIII(ctx)}
        ${buildBabIV(ctx)}
        ${buildBabV(ctx)}
        ${buildLampiran(ctx)}
        ${buildTTD(ctx)}
      </div>`;
  }

  window.renderLaporanLengkap = renderLaporanLengkap;
})();
