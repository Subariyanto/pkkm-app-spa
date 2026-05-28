// laporan_lengkap.js — Generator Laporan Lengkap PKKM per KKMA
// Cakupan: SATU KKMA (wilayah binaan Pengawas), berisi rekap penilaian semua
// Kepala Madrasah dalam KKMA tersebut pada periode tertentu.
//
// Struktur:
//   Cover → Lembar Pengesahan → Kata Pengantar → Daftar Isi
//   BAB I  Pendahuluan
//   BAB II Landasan Teori & Regulasi
//   BAB III Pelaksanaan Penilaian
//   BAB IV Hasil dan Pembahasan
//   BAB V Penutup
//   Lampiran A: Daftar Kepala Madrasah Binaan
//   Lampiran B: Rincian Skor per Kamad (ringkas per komponen)
//   TTD
//
// Penggunaan: window.renderLaporanLengkapKKMA(kkma, periode_id) → return HTML string

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

  function safeSebutan(nilai) {
    if (nilai == null || isNaN(nilai)) return null;
    return window.getPKKMSebutan ? window.getPKKMSebutan(nilai) : null;
  }

  // ===== Data builder =====

  function buildContext(kkma, periode_id) {
    const periode = window.Periode.get(periode_id);
    if (!periode) return null;

    const allKamad = window.Kamad.list();
    const kamadList = allKamad.filter(k => (k.kkma || '').trim() === (kkma || '').trim());

    const isFourYear = periode.type === 'tahun_4';

    // Untuk tiap kamad, ambil agregat (kalau multi-assessor) atau penilaian utama
    const rows = kamadList.map(k => {
      // Coba pakai agregat dulu (multi-assessor); fallback ke penilaian tunggal
      let nilaiAkhir = null, detail = null, sebutan = null, penilaian = null, sumberNilai = null;
      if (window.hitungNilaiAgregat) {
        try {
          const agg = window.hitungNilaiAgregat(k.id, periode.id);
          if (agg && agg.nilaiAgregat != null && !isNaN(agg.nilaiAgregat) && agg.jumlahPenilai > 0) {
            nilaiAkhir = agg.nilaiAgregat;
            detail = agg.detailPerKomponen || agg.detail || [];
            sumberNilai = `agregat (${agg.jumlahPenilai} penilai)`;
          }
        } catch (e) { /* lanjut fallback */ }
      }
      if (nilaiAkhir == null) {
        const pen = window.Penilaian.byKamadPeriode
          ? window.Penilaian.byKamadPeriode(k.id, periode.id)
          : (window.Penilaian.forKamadPeriode(k.id, periode.id) || [])[0];
        if (pen) {
          penilaian = pen;
          const a = window.hitungNilaiAkhir(pen.id);
          nilaiAkhir = a.nilaiAkhir;
          detail = a.detail;
          sumberNilai = 'penilaian tunggal';
        }
      }
      sebutan = safeSebutan(nilaiAkhir);
      return { k, penilaian, nilaiAkhir, detail, sebutan, sumberNilai };
    }).sort((a, b) => (a.k.nama_madrasah || '').localeCompare(b.k.nama_madrasah || ''));

    const dinilai = rows.filter(r => r.nilaiAkhir != null);
    const rataKKMA = dinilai.length ? dinilai.reduce((s, r) => s + r.nilaiAkhir, 0) / dinilai.length : null;
    const tertinggi = dinilai.length ? dinilai.reduce((a, b) => a.nilaiAkhir > b.nilaiAkhir ? a : b) : null;
    const terendah = dinilai.length ? dinilai.reduce((a, b) => a.nilaiAkhir < b.nilaiAkhir ? a : b) : null;

    // Agregat per komponen di seluruh KKMA
    const KOMP = window.PKKM_KOMPONEN_META || window.PKKM_KOMPONEN || [];
    const komponenAgg = KOMP.map(km => {
      const vals = [];
      for (const r of dinilai) {
        if (!r.detail) continue;
        const d = r.detail.find(x => x.code === km.code);
        if (d && d.nilai != null) vals.push(d.nilai);
      }
      const rata = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
      return { code: km.code, label: km.label, no: km.no, bobot: km.bobot_default || 20, rata, n: vals.length };
    });

    // Identifikasi sub-aspek terendah lintas KKMA (top 5)
    const subAggMap = {};
    const KOMP_LIST = window.PKKM_INSTRUMEN_PENGAWAS || window.PKKM_KOMPONEN || [];
    for (const r of dinilai) {
      const pen = r.penilaian;
      if (!pen) continue;
      for (const k of KOMP_LIST) {
        if (!isFourYear && k.code === 'HK') continue;
        for (const a of (k.aspek || [])) {
          const ha = window.hitungNilaiAspek(pen.id, k.code, a.kode);
          if (ha.terisi > 0 && ha.nilai != null) {
            const key = `${k.code}|${a.kode}`;
            if (!subAggMap[key]) subAggMap[key] = { komponen: k.label, kode: a.kode, unsur: a.unsur, vals: [] };
            subAggMap[key].vals.push(ha.nilai);
          }
        }
      }
    }
    const subAggList = Object.values(subAggMap).map(x => ({ ...x, rata: x.vals.reduce((s, v) => s + v, 0) / x.vals.length })).sort((a, b) => a.rata - b.rata);

    const pengawas = window.Meta.get('identitas_pengawas', { nama: '', nip: '' });
    const pokjawas = window.Meta.get('identitas_ketua_pokjawas', { nama: 'SUBARIYANTO, S.Pd, M.Pd.I', nip: '197002122005011004' });
    const tempat = window.Meta.get('lokasi_ttd', 'Jember');

    return {
      kkma, periode, kamadList, rows, dinilai, rataKKMA, tertinggi, terendah,
      komponenAgg, subAggList, pengawas, pokjawas, tempat, isFourYear,
    };
  }

  // ===== Section builders =====

  function buildCover(ctx) {
    return `
      <section class="ll-page ll-cover">
        <div class="ll-cover-inner">
          <div class="ll-cover-top">
            <div class="ll-cover-instansi">KEMENTERIAN AGAMA REPUBLIK INDONESIA<br>KANTOR KEMENTERIAN AGAMA KABUPATEN JEMBER<br>POKJAWAS MADRASAH</div>
          </div>
          <div class="ll-cover-mid">
            <h1 class="ll-cover-title">LAPORAN<br>PENILAIAN KINERJA<br>KEPALA MADRASAH<br>(PKKM)</h1>
            <div class="ll-cover-sub">${escapeHTML(ctx.kkma)}</div>
            <div class="ll-cover-identitas">
              <div>Periode</div>
              <div class="ll-cover-nama">${escapeHTML(ctx.periode.label || '-')}</div>
              <div class="mt-3">Tanggal Pelaksanaan: ${escapeHTML(fmtTanggalLengkap(ctx.periode.tanggal_penilaian || ''))}</div>
              <div>Jumlah Kepala Madrasah Binaan: <strong>${ctx.kamadList.length}</strong></div>
            </div>
          </div>
          <div class="ll-cover-bot">
            <div>Disusun oleh Pengawas Bina:</div>
            <div class="ll-cover-pengawas"><strong>${escapeHTML(ctx.pengawas.nama || '..............................')}</strong></div>
            <div>NIP. ${escapeHTML(ctx.pengawas.nip || '-')}</div>
            <div class="mt-2"><strong>POKJAWAS MADRASAH KAB. JEMBER</strong></div>
            <div>TAHUN ${new Date().getFullYear()}</div>
          </div>
        </div>
      </section>`;
  }

  function buildPengesahan(ctx) {
    const tglStr = fmtTanggalLengkap(ctx.periode.tanggal_penilaian || new Date().toISOString());
    return `
      <section class="ll-page">
        <h2 class="ll-h">LEMBAR PENGESAHAN</h2>
        <p style="text-indent:2em;">Laporan Penilaian Kinerja Kepala Madrasah (PKKM) Periode <strong>${escapeHTML(ctx.periode.label || '-')}</strong> pada wilayah binaan <strong>${escapeHTML(ctx.kkma)}</strong> telah disusun oleh:</p>
        <table class="ll-id-table">
          <tr><td width="200">Nama</td><td>: ${escapeHTML(ctx.pengawas.nama || '-')}</td></tr>
          <tr><td>NIP</td><td>: ${escapeHTML(ctx.pengawas.nip || '-')}</td></tr>
          <tr><td>Jabatan</td><td>: Pengawas Madrasah</td></tr>
          <tr><td>Wilayah Binaan</td><td>: ${escapeHTML(ctx.kkma)}</td></tr>
          <tr><td>Jumlah Kamad Binaan</td><td>: ${ctx.kamadList.length} orang (${ctx.dinilai.length} dinilai)</td></tr>
        </table>
        <p style="text-indent:2em;">Laporan ini dinyatakan sah sebagai dokumen resmi pelaksanaan PKKM untuk diteruskan kepada Kepala Kantor Kementerian Agama Kabupaten Jember melalui Pokjawas Madrasah, dan dapat digunakan sebagai bahan pembinaan, evaluasi, serta pengembangan keprofesian Kepala Madrasah secara berkelanjutan.</p>

        <div class="ll-ttd-grid mt-5">
          <div class="ll-ttd-box">
            <div>Mengetahui,</div>
            <div>Ketua Pokjawas Madrasah Kab. Jember</div>
            <div class="ll-ttd-spacer"></div>
            <div class="ll-ttd-name">${escapeHTML(ctx.pokjawas.nama || '..............................')}</div>
            <div>NIP. ${escapeHTML(ctx.pokjawas.nip || '-')}</div>
          </div>
          <div class="ll-ttd-box">
            <div>${escapeHTML(ctx.tempat)}, ${escapeHTML(tglStr)}</div>
            <div>Pengawas Bina,</div>
            <div class="ll-ttd-spacer"></div>
            <div class="ll-ttd-name">${escapeHTML(ctx.pengawas.nama || '..............................')}</div>
            <div>NIP. ${escapeHTML(ctx.pengawas.nip || '-')}</div>
          </div>
        </div>
      </section>`;
  }

  function buildKataPengantar(ctx) {
    const tglStr = fmtTanggalLengkap(ctx.periode.tanggal_penilaian || new Date().toISOString());
    return `
      <section class="ll-page">
        <h2 class="ll-h">KATA PENGANTAR</h2>
        <p style="text-indent:2em;">Puji syukur ke hadirat Allah SWT yang telah melimpahkan rahmat, taufik, dan hidayah-Nya sehingga laporan Penilaian Kinerja Kepala Madrasah (PKKM) ini dapat tersusun dengan baik. Shalawat serta salam senantiasa tercurah kepada Nabi Muhammad SAW, keluarga, sahabat, dan para pengikutnya hingga akhir zaman.</p>
        <p style="text-indent:2em;">Penilaian Kinerja Kepala Madrasah merupakan amanat regulasi yang bertujuan menjamin mutu kepemimpinan madrasah, meningkatkan akuntabilitas pengelolaan pendidikan, serta menjadi dasar pembinaan dan pengembangan keprofesian Kepala Madrasah secara berkelanjutan. PKKM dilaksanakan oleh Pengawas Bina dengan melibatkan unsur guru, tenaga kependidikan, komite, dan stakeholder lainnya pada penilaian empat tahunan.</p>
        <p style="text-indent:2em;">Laporan ini disusun sebagai dokumentasi resmi pelaksanaan PKKM pada wilayah binaan <strong>${escapeHTML(ctx.kkma)}</strong> periode <strong>${escapeHTML(ctx.periode.label || '-')}</strong>. Cakupan laporan meliputi <strong>${ctx.kamadList.length} Kepala Madrasah</strong> yang berada dalam tanggung jawab pengawas bina. Penyusunan laporan berpedoman pada KMA Nomor 624 Tahun 2021 tentang Pedoman Penilaian Kinerja Kepala Madrasah serta Permenpan RB Nomor 6 Tahun 2022 tentang Pengelolaan Kinerja Pegawai ASN.</p>
        <p style="text-indent:2em;">Penyusun menyampaikan terima kasih kepada Kepala Kantor Kementerian Agama Kabupaten Jember, Ketua Pokjawas Madrasah, rekan-rekan pengawas, kepala madrasah, dewan guru, tenaga kependidikan, komite, serta seluruh pihak yang telah mendukung kelancaran proses penilaian ini. Saran dan masukan untuk perbaikan laporan sangat penyusun harapkan demi peningkatan kualitas penilaian di masa mendatang.</p>
        <p style="text-indent:2em;">Semoga laporan ini bermanfaat sebagai bahan refleksi dan acuan pembinaan kepala madrasah di lingkungan Kementerian Agama Kabupaten Jember.</p>
        <div class="text-end mt-4">
          <div>${escapeHTML(ctx.tempat)}, ${escapeHTML(tglStr)}</div>
          <div>Penyusun,</div>
          <div class="mt-5"><strong><u>${escapeHTML(ctx.pengawas.nama || '..............................')}</u></strong></div>
          <div>NIP. ${escapeHTML(ctx.pengawas.nip || '-')}</div>
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
          <tr><td class="ps-4">A. Daftar Kepala Madrasah Binaan</td><td class="text-end">7</td></tr>
          <tr><td class="ps-4">B. Rekapitulasi Nilai per Kepala Madrasah</td><td class="text-end">8</td></tr>
          <tr><td class="ps-4">C. Rata-rata KKMA per Komponen</td><td class="text-end">9</td></tr>
          <tr><td class="ps-4">D. Pembahasan</td><td class="text-end">9</td></tr>
          <tr><td><strong>BAB V PENUTUP</strong></td><td class="text-end">10</td></tr>
          <tr><td class="ps-4">A. Simpulan</td><td class="text-end">10</td></tr>
          <tr><td class="ps-4">B. Rekomendasi Pembinaan</td><td class="text-end">10</td></tr>
          <tr><td><strong>LAMPIRAN A: Daftar Kepala Madrasah Binaan</strong></td><td class="text-end">11</td></tr>
          <tr><td><strong>LAMPIRAN B: Rincian Skor per Kamad (per Komponen)</strong></td><td class="text-end">12</td></tr>
        </table>
      </section>`;
  }

  function buildBabI(ctx) {
    return `
      <section class="ll-page">
        <h2 class="ll-h">BAB I<br>PENDAHULUAN</h2>

        <h3 class="ll-h3">A. Latar Belakang</h3>
        <p style="text-indent:2em;">Kepala Madrasah memegang peran strategis dalam mewujudkan madrasah yang bermutu, berdaya saing, dan berkarakter. Kualitas kepemimpinan kepala madrasah berbanding lurus dengan mutu proses pendidikan dan capaian peserta didik. Untuk menjamin mutu kepemimpinan tersebut, diperlukan mekanisme penilaian kinerja yang sistematis, terukur, akuntabel, dan dilaksanakan secara berkelanjutan.</p>
        <p style="text-indent:2em;">Pengawas Madrasah selaku Pengawas Bina memiliki tanggung jawab melaksanakan Penilaian Kinerja Kepala Madrasah (PKKM) terhadap seluruh kepala madrasah dalam wilayah binaannya. Laporan ini menyajikan hasil PKKM atas <strong>${ctx.kamadList.length} Kepala Madrasah</strong> di wilayah binaan <strong>${escapeHTML(ctx.kkma)}</strong> sebagai bahan pembinaan, evaluasi, dan tindak lanjut yang dikonsolidasikan di tingkat KKMA.</p>
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
          <li>Mengukur capaian kinerja seluruh kepala madrasah dalam wilayah binaan ${escapeHTML(ctx.kkma)} pada lima komponen utama PKKM;</li>
          <li>Memberikan umpan balik objektif sebagai bahan refleksi dan perbaikan;</li>
          <li>Menyediakan data dasar pembinaan dan pengembangan keprofesian berkelanjutan (PKB) di tingkat KKMA;</li>
          <li>Menjadi bahan pertimbangan kebijakan kepegawaian, termasuk perpanjangan masa tugas dan promosi;</li>
          <li>Mendorong peningkatan mutu pengelolaan madrasah secara berkelanjutan.</li>
        </ol>

        <h3 class="ll-h3">D. Sasaran dan Ruang Lingkup</h3>
        <p style="text-indent:2em;">Sasaran penilaian ini adalah seluruh Kepala Madrasah pada wilayah binaan <strong>${escapeHTML(ctx.kkma)}</strong> sejumlah <strong>${ctx.kamadList.length} orang</strong>, pada periode <strong>${escapeHTML(ctx.periode.label || '-')}</strong>. Ruang lingkup penilaian mencakup lima komponen PKKM (Pengembangan Madrasah, Manajerial, Kewirausahaan, Supervisi GTK, dan Hasil Kinerja Kepala Madrasah) dengan instrumen yang berpedoman pada KMA 624 Tahun 2021. Komponen Hasil Kinerja Kepala Madrasah dilaksanakan secara khusus pada penilaian empat tahunan.</p>
      </section>`;
  }

  function buildBabII() {
    return `
      <section class="ll-page">
        <h2 class="ll-h">BAB II<br>LANDASAN TEORI DAN REGULASI</h2>

        <h3 class="ll-h3">A. Konsep Penilaian Kinerja Kepala Madrasah</h3>
        <p style="text-indent:2em;">Penilaian Kinerja Kepala Madrasah merupakan proses pengumpulan, pengolahan, dan analisis data terhadap pelaksanaan tugas pokok dan fungsi kepala madrasah dalam mengelola lembaga pendidikan. PKKM bersifat formatif (untuk pembinaan) dan sumatif (untuk pengambilan keputusan), serta dilaksanakan secara berkala oleh Pengawas Bina dengan melibatkan stakeholder pendidikan.</p>
        <p style="text-indent:2em;">Hasil PKKM diharapkan dapat memberi gambaran utuh tentang capaian kepemimpinan kepala madrasah, baik pada aspek manajerial maupun supervisi akademik, sekaligus mengidentifikasi area pengembangan profesional yang masih perlu ditingkatkan, baik pada level individu maupun pada level kelompok kerja madrasah (KKMA).</p>

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
    return `
      <section class="ll-page">
        <h2 class="ll-h">BAB III<br>PELAKSANAAN PENILAIAN</h2>

        <h3 class="ll-h3">A. Waktu dan Tempat</h3>
        <p style="text-indent:2em;">Penilaian Kinerja Kepala Madrasah dilaksanakan pada periode <strong>${escapeHTML(ctx.periode.label || '-')}</strong> dengan tanggal pelaksanaan <strong>${escapeHTML(fmtTanggalLengkap(ctx.periode.tanggal_penilaian || ''))}</strong>. Lokasi pelaksanaan adalah madrasah binaan masing-masing kepala madrasah pada wilayah <strong>${escapeHTML(ctx.kkma)}</strong>.</p>

        <h3 class="ll-h3">B. Tim Penilai</h3>
        <p>${ctx.isFourYear
          ? 'Penilaian empat tahunan ini dilaksanakan oleh tim penilai lengkap yang melibatkan unsur Pengawas (I dan II), Guru (I dan II), Tenaga Kependidikan (I dan II), Komite (I dan II), Kepala Seksi/Ketua Yayasan, dan Kepala Bidang.'
          : 'Penilaian tahunan ini dilaksanakan oleh Pengawas Madrasah I dan II selaku Pengawas Bina pada wilayah ' + escapeHTML(ctx.kkma) + '.'}</p>
        <p>Pengawas Bina utama yang menyusun laporan ini:</p>
        <table class="ll-id-table">
          <tr><td width="200">Nama</td><td>: <strong>${escapeHTML(ctx.pengawas.nama || '-')}</strong></td></tr>
          <tr><td>NIP</td><td>: ${escapeHTML(ctx.pengawas.nip || '-')}</td></tr>
          <tr><td>Wilayah Binaan</td><td>: ${escapeHTML(ctx.kkma)}</td></tr>
        </table>

        <h3 class="ll-h3">C. Instrumen dan Prosedur</h3>
        <p style="text-indent:2em;">Instrumen yang digunakan adalah instrumen baku PKKM yang merujuk pada KMA 624 Tahun 2021, terdiri atas <strong>5 komponen, 29 sub-aspek, dan 108 indikator</strong>. Setiap indikator dinilai dengan skala 1-4 (Kurang, Cukup, Baik, Amat Baik) berdasarkan bukti dokumen, hasil observasi langsung, serta wawancara dengan kepala madrasah dan stakeholder terkait.</p>
        <p>Prosedur penilaian meliputi:</p>
        <ol class="ll-ol">
          <li><strong>Pra-penilaian</strong> — koordinasi jadwal, penyiapan instrumen, sosialisasi kepada kepala madrasah pada forum KKMA.</li>
          <li><strong>Pelaksanaan</strong> — pengumpulan data melalui telaah dokumen, observasi, dan wawancara terstruktur di masing-masing madrasah binaan.</li>
          <li><strong>Pengolahan</strong> — pemberian skor per indikator, perhitungan nilai sub-aspek, nilai komponen, dan nilai akhir terbobot per kepala madrasah, dilanjutkan agregasi tingkat KKMA.</li>
          <li><strong>Pelaporan</strong> — penyusunan laporan KKMA, klarifikasi hasil, serta penyampaian rekomendasi pembinaan dan PKB pada forum KKMA.</li>
        </ol>
      </section>`;
  }

  function buildBabIV(ctx) {
    const KOMP = window.PKKM_KOMPONEN_META || window.PKKM_KOMPONEN || [];

    // Tabel daftar kamad binaan (sebagai konteks BAB IV-A)
    const rowsKamad = ctx.kamadList.map((k, i) => `
      <tr>
        <td class="text-center">${i+1}</td>
        <td>${escapeHTML(k.nama || '-')}<div class="text-tiny" style="font-size:9pt;color:#555">NIP. ${escapeHTML(k.nip || '-')}</div></td>
        <td>${escapeHTML(k.nama_madrasah || '-')}<div class="text-tiny" style="font-size:9pt;color:#555">${escapeHTML(k.alamat || '')}</div></td>
        <td class="text-center">${escapeHTML(k.jenjang || '-')}</td>
      </tr>`).join('');

    // Tabel rekap nilai per kamad
    const rowsRekap = ctx.rows.map((r, i) => {
      const seb = r.sebutan;
      return `<tr>
        <td class="text-center">${i+1}</td>
        <td>${escapeHTML(r.k.nama || '-')}<div style="font-size:9pt;color:#555">${escapeHTML(r.k.nama_madrasah || '-')}</div></td>
        <td class="text-end fw-bold">${fmtNilai(r.nilaiAkhir)}</td>
        <td class="text-center">${seb ? seb.label : (r.nilaiAkhir == null ? '<em style="color:#888">belum dinilai</em>' : '-')}</td>
      </tr>`;
    }).join('');

    // Tabel rata-rata KKMA per komponen
    const rowsKomp = ctx.komponenAgg.map(km => {
      const seb = safeSebutan(km.rata);
      return `<tr>
        <td class="text-center">${km.no}</td>
        <td>${escapeHTML(km.label)}</td>
        <td class="text-end">${km.bobot}%</td>
        <td class="text-end">${fmtNilai(km.rata)}</td>
        <td class="text-center">${seb ? seb.label : '-'}</td>
      </tr>`;
    }).join('');

    const top3 = ctx.subAggList.slice(0, 5);
    const sebRata = safeSebutan(ctx.rataKKMA);

    return `
      <section class="ll-page">
        <h2 class="ll-h">BAB IV<br>HASIL DAN PEMBAHASAN</h2>

        <h3 class="ll-h3">A. Daftar Kepala Madrasah Binaan</h3>
        <table class="ll-table">
          <thead>
            <tr><th width="40">No</th><th>Nama Kepala Madrasah</th><th>Madrasah</th><th class="text-center" width="80">Jenjang</th></tr>
          </thead>
          <tbody>${rowsKamad || '<tr><td colspan="4" class="text-center"><em>Tidak ada kamad terdaftar pada KKMA ini.</em></td></tr>'}</tbody>
        </table>

        <h3 class="ll-h3">B. Rekapitulasi Nilai per Kepala Madrasah</h3>
        <table class="ll-table">
          <thead>
            <tr><th width="40">No</th><th>Nama / Madrasah</th><th class="text-end" width="100">Nilai Akhir</th><th class="text-center" width="120">Sebutan</th></tr>
          </thead>
          <tbody>${rowsRekap || '<tr><td colspan="4" class="text-center"><em>Belum ada data penilaian.</em></td></tr>'}</tbody>
          <tfoot>
            <tr class="ll-row-total">
              <th colspan="2" class="text-end">RATA-RATA KKMA (${ctx.dinilai.length}/${ctx.kamadList.length} dinilai)</th>
              <th class="text-end">${fmtNilai(ctx.rataKKMA)}</th>
              <th class="text-center"><strong>${sebRata ? sebRata.label : '-'}</strong></th>
            </tr>
          </tfoot>
        </table>

        <h3 class="ll-h3">C. Rata-rata KKMA per Komponen</h3>
        <table class="ll-table">
          <thead>
            <tr><th width="40">No</th><th>Komponen</th><th class="text-end" width="80">Bobot</th><th class="text-end" width="100">Rata-rata</th><th class="text-center" width="120">Sebutan</th></tr>
          </thead>
          <tbody>${rowsKomp}</tbody>
        </table>

        <h3 class="ll-h3">D. Pembahasan</h3>
        <p style="text-indent:2em;">Berdasarkan rekapitulasi di atas, wilayah binaan <strong>${escapeHTML(ctx.kkma)}</strong> memperoleh nilai rata-rata <strong>${fmtNilai(ctx.rataKKMA)}</strong> dengan sebutan <strong>${sebRata ? sebRata.label : '-'}</strong>${ctx.dinilai.length < ctx.kamadList.length ? ` (dari ${ctx.dinilai.length} dari total ${ctx.kamadList.length} kamad yang sudah dinilai)` : ''}. ${ctx.tertinggi ? `Capaian tertinggi pada wilayah ini diraih oleh <strong>${escapeHTML(ctx.tertinggi.k.nama || '-')}</strong> (${escapeHTML(ctx.tertinggi.k.nama_madrasah || '-')}) dengan nilai <strong>${fmtNilai(ctx.tertinggi.nilaiAkhir)}</strong>${ctx.tertinggi.sebutan ? ` (${ctx.tertinggi.sebutan.label})` : ''}.` : ''} ${ctx.terendah && ctx.tertinggi && ctx.terendah.k.id !== ctx.tertinggi.k.id ? `Sebaliknya, capaian terendah dengan nilai <strong>${fmtNilai(ctx.terendah.nilaiAkhir)}</strong> menjadi prioritas pembinaan agar mencapai sebutan yang lebih baik.` : ''}</p>
        ${top3.length ? `
          <p>Lima sub-aspek dengan capaian terendah lintas KKMA dan menjadi prioritas pembinaan kolektif:</p>
          <ol class="ll-ol">
            ${top3.map(sa => `<li><strong>${escapeHTML(sa.kode)}</strong> ${escapeHTML(sa.unsur)} (${escapeHTML(sa.komponen)}) — rata-rata ${fmtNilai(sa.rata)}.</li>`).join('')}
          </ol>` : ''}
        <p style="text-indent:2em;">Pembinaan terhadap sub-aspek tersebut dilaksanakan secara terstruktur melalui kegiatan Pengembangan Keprofesian Berkelanjutan (PKB) tingkat KKMA, baik berupa workshop, bimbingan teknis, kegiatan kolektif kepala madrasah, maupun pendampingan langsung oleh Pengawas Bina.</p>
      </section>`;
  }

  function buildBabV(ctx) {
    const sebRata = safeSebutan(ctx.rataKKMA);
    const top3 = ctx.subAggList.slice(0, 5);
    return `
      <section class="ll-page">
        <h2 class="ll-h">BAB V<br>PENUTUP</h2>

        <h3 class="ll-h3">A. Simpulan</h3>
        <ol class="ll-ol">
          <li>Penilaian Kinerja Kepala Madrasah pada wilayah binaan <strong>${escapeHTML(ctx.kkma)}</strong> telah dilaksanakan terhadap <strong>${ctx.dinilai.length} dari ${ctx.kamadList.length}</strong> kepala madrasah sesuai pedoman dan instrumen yang berlaku.</li>
          <li>Hasil penilaian menunjukkan rata-rata KKMA sebesar <strong>${fmtNilai(ctx.rataKKMA)}</strong> dengan sebutan <strong>${sebRata ? sebRata.label : '-'}</strong>.</li>
          <li>Capaian tersebut mencerminkan dedikasi dan komitmen para kepala madrasah dalam menjalankan tugas kepemimpinan, sekaligus mengidentifikasi sub-aspek yang masih memerlukan pembinaan kolektif.</li>
        </ol>

        <h3 class="ll-h3">B. Rekomendasi Pembinaan</h3>
        <p>Berdasarkan analisis terhadap sub-aspek dengan capaian terendah, prioritas pembinaan tingkat KKMA diarahkan pada hal-hal berikut:</p>
        ${top3.length ? `
          <ol class="ll-ol">
            ${top3.map(sa => `<li>Penguatan <strong>${escapeHTML(sa.kode)}</strong> ${escapeHTML(sa.unsur)} (${escapeHTML(sa.komponen)}) — rata-rata KKMA ${fmtNilai(sa.rata)}, perlu kegiatan PKB kolektif.</li>`).join('')}
          </ol>` : `
          <ol class="ll-ol">
            <li>Mengikutsertakan kepala madrasah pada diklat penguatan kompetensi yang diselenggarakan Kemenag/Pokjawas;</li>
            <li>Menggiatkan forum KKMA sebagai sarana pertukaran praktik baik antar kepala madrasah binaan;</li>
            <li>Menyusun rencana PKB tahunan yang terstruktur, baik secara individu maupun kolektif.</li>
          </ol>`}
        <p style="text-indent:2em;">Demikian laporan ini disusun untuk dapat dipergunakan sebagaimana mestinya. Semoga laporan ini dapat menjadi bahan refleksi dan dasar pembinaan kepala madrasah pada wilayah binaan ${escapeHTML(ctx.kkma)} dalam meningkatkan kualitas pengelolaan madrasah secara berkelanjutan.</p>
      </section>`;
  }

  function buildLampiranA(ctx) {
    const rows = ctx.kamadList.map((k, i) => `
      <tr>
        <td class="text-center">${i+1}</td>
        <td>${escapeHTML(k.nama || '-')}</td>
        <td>${escapeHTML(k.nip || '-')}</td>
        <td>${escapeHTML(k.nama_madrasah || '-')}</td>
        <td class="text-center">${escapeHTML(k.jenjang || '-')}</td>
        <td>${escapeHTML(k.nsm || '-')}</td>
        <td>${escapeHTML(k.alamat || '')}</td>
      </tr>`).join('');
    return `
      <section class="ll-page">
        <h2 class="ll-h">LAMPIRAN A<br>DAFTAR KEPALA MADRASAH BINAAN</h2>
        <p>Wilayah binaan: <strong>${escapeHTML(ctx.kkma)}</strong> &middot; Periode: <strong>${escapeHTML(ctx.periode.label || '-')}</strong></p>
        <table class="ll-table" style="font-size:10pt;">
          <thead>
            <tr><th width="40">No</th><th>Nama</th><th width="120">NIP</th><th>Madrasah</th><th class="text-center" width="70">Jenjang</th><th width="100">NSM</th><th>Alamat</th></tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="7" class="text-center"><em>Tidak ada data.</em></td></tr>'}</tbody>
        </table>
      </section>`;
  }

  function buildLampiranB(ctx) {
    const KOMP = window.PKKM_KOMPONEN_META || window.PKKM_KOMPONEN || [];
    const showHK = ctx.isFourYear;
    const kompShown = KOMP.filter(k => showHK || k.code !== 'HK');
    const headerKomp = kompShown.map(k => `<th class="text-center" title="${escapeHTML(k.label)}">${escapeHTML(k.code)}</th>`).join('');

    const rows = ctx.rows.map((r, i) => {
      const cellsKomp = kompShown.map(k => {
        if (!r.detail) return `<td class="text-center">-</td>`;
        const d = r.detail.find(x => x.code === k.code);
        return `<td class="text-end">${d && d.nilai != null ? fmtNilai(d.nilai) : '-'}</td>`;
      }).join('');
      return `<tr>
        <td class="text-center">${i+1}</td>
        <td>${escapeHTML(r.k.nama || '-')}<div style="font-size:9pt;color:#555">${escapeHTML(r.k.nama_madrasah || '-')}</div></td>
        ${cellsKomp}
        <td class="text-end fw-bold">${fmtNilai(r.nilaiAkhir)}</td>
        <td class="text-center">${r.sebutan ? r.sebutan.label : '-'}</td>
      </tr>`;
    }).join('');

    return `
      <section class="ll-page">
        <h2 class="ll-h">LAMPIRAN B<br>RINCIAN SKOR PER KAMAD<br>(per Komponen)</h2>
        <p>Wilayah binaan: <strong>${escapeHTML(ctx.kkma)}</strong> &middot; Periode: <strong>${escapeHTML(ctx.periode.label || '-')}</strong></p>
        <p style="font-size:10pt;">Skala penilaian: 1 (Kurang), 2 (Cukup), 3 (Baik), 4 (Amat Baik). Nilai komponen dalam skala 0-100.${!showHK ? ' Komponen HK tidak ditampilkan karena bukan periode 4-tahunan.' : ''}</p>
        <table class="ll-table" style="font-size:10pt;">
          <thead>
            <tr>
              <th width="40">No</th>
              <th>Nama / Madrasah</th>
              ${headerKomp}
              <th class="text-end" width="80">Nilai Akhir</th>
              <th class="text-center" width="100">Sebutan</th>
            </tr>
          </thead>
          <tbody>${rows || `<tr><td colspan="${4 + kompShown.length}" class="text-center"><em>Belum ada data penilaian.</em></td></tr>`}</tbody>
        </table>
      </section>`;
  }

  function buildTTD(ctx) {
    const tglStr = fmtTanggalLengkap(ctx.periode.tanggal_penilaian || new Date().toISOString());
    return `
      <section class="ll-page ll-ttd-page">
        <div class="ll-ttd-grid mt-5">
          <div class="ll-ttd-box">
            <div>Mengetahui,</div>
            <div>Ketua Pokjawas Madrasah Kab. Jember</div>
            <div class="ll-ttd-spacer"></div>
            <div class="ll-ttd-name">${escapeHTML(ctx.pokjawas.nama || '..............................')}</div>
            <div>NIP. ${escapeHTML(ctx.pokjawas.nip || '-')}</div>
          </div>
          <div class="ll-ttd-box">
            <div>${escapeHTML(ctx.tempat)}, ${escapeHTML(tglStr)}</div>
            <div>Pengawas Bina,</div>
            <div class="ll-ttd-spacer"></div>
            <div class="ll-ttd-name">${escapeHTML(ctx.pengawas.nama || '..............................')}</div>
            <div>NIP. ${escapeHTML(ctx.pengawas.nip || '-')}</div>
          </div>
        </div>
      </section>`;
  }

  // ===== Public entry =====

  function renderLaporanLengkapKKMA(kkma, periode_id) {
    if (!kkma) return `<div class="alert alert-warning">KKMA tidak ditentukan.</div>`;
    const ctx = buildContext(kkma, Number(periode_id));
    if (!ctx) return `<div class="alert alert-warning">Periode tidak ditemukan.</div>`;
    if (ctx.kamadList.length === 0) {
      return `<div class="alert alert-info">Tidak ada Kepala Madrasah terdaftar pada KKMA <strong>${escapeHTML(kkma)}</strong>. Silakan tambahkan kamad dengan field KKMA = "${escapeHTML(kkma)}" terlebih dahulu.</div>`;
    }

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
        ${buildLampiranA(ctx)}
        ${buildLampiranB(ctx)}
        ${buildTTD(ctx)}
      </div>`;
  }

  window.renderLaporanLengkapKKMA = renderLaporanLengkapKKMA;
})();
