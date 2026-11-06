// berita_acara.js — Berita Acara + Daftar Hadir PKKM (Tahunan & 4 Tahunan)
// Menghasilkan PDF (jsPDF) dan Word (.doc, HTML-based agar ringan & offline-friendly).
// Sumber data otomatis dari Kamad, Penilaian, Periode, dan Meta (Pengaturan).
(function () {
  'use strict';

  // ---------------------------------------------------------------- util
  function titik(n) { return new Array(n + 1).join('.'); }
  function isi(v, n) {
    v = (v == null ? '' : String(v)).trim();
    return v || titik(n || 40);
  }
  function koma(v) { return v ? String(v) : ''; }

  function tanggalIndonesia(iso, opsi) {
    opsi = opsi || {};
    if (!iso) return titik(30);
    var bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return titik(30);
    var dd = d.getDate(), mm = d.getMonth(), yy = d.getFullYear();
    if (opsi.angkaPenuh) return dd + ' ' + bulan[mm] + ' ' + yy;
    return dd + ' ' + bulan[mm] + ' ' + yy;
  }

  function tahunHuruf(tahun) {
    var satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
    function t(n) {
      if (n < 12) return satuan[n];
      if (n < 20) return t(n - 10) + ' belas';
      if (n < 100) return t(Math.floor(n / 10)) + ' puluh' + (n % 10 ? ' ' + t(n % 10) : '');
      if (n < 200) return 'seratus' + (n % 100 ? ' ' + t(n % 100) : '');
      if (n < 1000) return t(Math.floor(n / 100)) + ' ratus' + (n % 100 ? ' ' + t(n % 100) : '');
      if (n < 2000) return 'seribu' + (n % 1000 ? ' ' + t(n % 1000) : '');
      return t(Math.floor(n / 1000)) + ' ribu' + (n % 1000 ? ' ' + t(n % 1000) : '');
    }
    return t(Number(tahun) || 2026);
  }

  function namaKab() {
    try {
      var k = (window.Meta && window.Meta.kab) ? window.Meta.kab() : 'Jember';
      return k || titik(24);
    } catch (e) { return titik(24); }
  }

  function tempatTtd() {
    try {
      return (window.Meta && window.Meta.get('lokasi_ttd', '')) || namaKab();
    } catch (e) { return namaKab(); }
  }

  // Kecamatan biasanya tertulis di dalam KKM, mis. "KKM 04 Sukowono".
  // Ambil kata terakhir sebagai dugaan kecamatan; kalau tidak ada, kosongkan.
  function dugaanKecamatan(kamad) {
    if (!kamad) return '';
    var kkma = (kamad.kkma || '').trim();
    if (!kkma) return '';
    var m = kkma.match(/KK[MA]?\s*\d*\s+(.+)$/i);
    if (m && m[1]) return m[1].replace(/\s*\(.*?\)\s*/g, '').trim();
    return '';
  }

  // ---------------------------------------------------------------- data
  // Susun data berita acara dari penilaian yang dipilih.
  function kumpulkan(penilaianId, opts) {
    opts = opts || {};
    var pen = window.Penilaian ? window.Penilaian.get(penilaianId) : null;
    if (!pen) throw new Error('Penilaian tidak ditemukan.');

    var kamad = window.Kamad ? window.Kamad.get(pen.kamad_id) : null;
    var periode = window.Periode ? window.Periode.get(pen.periode_id) : null;
    if (!kamad) throw new Error('Data kepala madrasah tidak ditemukan.');

    // Semua sesi penilaian pada periode yang sama (untuk mengisi Penilai 1 & 2)
    var sesi = window.Penilaian.forKamadPeriode(kamad.id, pen.periode_id) || [];
    var penilaiAll = [];
    for (var i = 0; i < sesi.length; i++) {
      var s = sesi[i];
      var nama = (s.penilai_nama || '').trim();
      var nip = (s.penilai_nip || '').trim();
      // Fallback ke identitas pengawas di Pengaturan bila sesi belum diisi nama.
      if (!nama) {
        var pg = (window.Meta && window.Meta.get('identitas_pengawas', {})) || {};
        var r = (s.role || 'pengawas_1');
        if (r === 'pengawas_1') { nama = (pg.pengawas_1 && pg.pengawas_1.nama) || pg.nama || ''; nip = nip || (pg.pengawas_1 && pg.pengawas_1.nip) || pg.nip || ''; }
        else if (r === 'pengawas_2') { nama = (pg.pengawas_2 && pg.pengawas_2.nama) || ''; nip = nip || (pg.pengawas_2 && pg.pengawas_2.nip) || ''; }
      }
      penilaiAll.push({ role: s.role || 'pengawas_1', nama: nama, nip: nip });
    }
    // Utamakan pengawas 1 & 2 untuk kolom tanda tangan.
    var p1 = penilaiAll.filter(function (x) { return x.role === 'pengawas_1'; })[0] || penilaiAll[0] || { nama: '', nip: '' };
    var p2 = penilaiAll.filter(function (x) { return x.role === 'pengawas_2'; })[0] || penilaiAll[1] || { nama: '', nip: '' };

    var tahunPeriode = (periode && periode.tahun) || new Date().getFullYear();
    var tanggal = opts.tanggal || (periode && periode.tanggal_penilaian) || '';
    var is4Tahunan = (periode && periode.type === 'tahun_4') || opts.jenis === '4tahunan';

    return {
      jenis: is4Tahunan ? '4tahunan' : 'tahunan',
      tahun: tahunPeriode,
      tanggal: tanggal,
      kamad: {
        nama: kamad.nama || '',
        nip: kamad.nip || '',
        jabatan: kamad.jabatan || (kamad.jenjang === 'RA' ? 'Kepala RA' : 'Kepala Madrasah'),
        jenjang: kamad.jenjang || '',
        nsm: kamad.nsm || '',
        npsn: kamad.npsn || '',
        madrasah: kamad.nama_madrasah || '',
        alamat: kamad.alamat || '',
        kecamatan: dugaanKecamatan(kamad),
        kabupaten: namaKab(),
        kkma: kamad.kkma || '',
      },
      penilai1: { nama: p1.nama || '', nip: p1.nip || '' },
      penilai2: { nama: p2.nama || '', nip: p2.nip || '' },
      nomorSuratTugas: (opts.nomorSuratTugas || '').trim(),
      tanggalSuratTugas: (opts.tanggalSuratTugas || '').trim(),
      pukulMulai: (opts.pukulMulai || '').trim(),
      pukulSelesai: (opts.pukulSelesai || '').trim(),
      tempat: tempatTtd(),
      periodeLabel: periode ? periode.label : '',
    };
  }

  // ---------------------------------------------------------------- PDF
  function pdfData(d, opts) {
    var Ctor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!Ctor) throw new Error('Pustaka jsPDF belum termuat. Hard refresh (Ctrl+Shift+R) lalu coba lagi.');

    var doc = new Ctor({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    var W = doc.internal.pageSize.getWidth();
    var H = doc.internal.pageSize.getHeight();
    var ML = 20, MR = 20, MT = 18, MB = 16;
    var CW = W - ML - MR;
    var y = MT;
    var is4 = d.jenis === '4tahunan';

    function garisBawah(x1, x2, yy) {
      doc.setDrawColor(0);
      doc.setLineWidth(0.2);
      doc.line(x1, yy, x2, yy);
    }
    function tebal(size) { doc.setFont('times', 'bold'); doc.setFontSize(size); }
    function biasa(size) { doc.setFont('times', 'normal'); doc.setFontSize(size); }

    // ---- Kop / judul
    tebal(14);
    doc.text('BERITA ACARA PELAKSANAAN', W / 2, y, { align: 'center' }); y += 6.2;
    doc.text('PENILAIAN KINERJA KEPALA MADRASAH', W / 2, y, { align: 'center' }); y += 6.2;
    biasa(12);
    var subJudul = is4
      ? ('MADRASAH ' + (d.kamad.jenjang || '') + ' KABUPATEN ' + (d.kamad.kabupaten || '').toUpperCase())
      : ('DI LINGKUNGAN KANTOR KEMENTERIAN AGAMA KABUPATEN ' + (d.kamad.kabupaten || '').toUpperCase());
    doc.text(subJudul, W / 2, y, { align: 'center' }); y += 6;
    doc.text('TAHUN ' + d.tahun, W / 2, y, { align: 'center' }); y += 9;

    // Garis kop
    garisBawah(ML, W - MR, y); y += 4;

    // ---- Paragraf pembuka
    biasa(11.5);
    var tglTxt = tanggalIndonesia(d.tanggal);
    var thHuruf = tahunHuruf(d.tahun);
    var pukul = d.pukulMulai || titik(8);
    var pukul2 = d.pukulSelesai || titik(8);
    var pembuka = 'Pada hari ini ' + titik(14) + ' tanggal ' + titik(12) + ' bulan ' + titik(14) +
      ' tahun ' + thHuruf + ' pukul ' + pukul + ' s.d ' + pukul2 + ' WIB, bertempat di:';
    var lines = doc.splitTextToSize(pembuka, CW);
    for (var i = 0; i < lines.length; i++) { doc.text(lines[i], ML, y); y += 5.2; }
    y += 1.5;

    // ---- Identitas madrasah (label titik dua sejajar)
    var lx = ML + 4, cx = ML + 42;
    function kv(label, nilai) {
      biasa(11.5);
      doc.text(label, lx, y);
      doc.text(':', cx - 3, y);
      var nl = doc.splitTextToSize(nilai, W - MR - cx);
      for (var j = 0; j < nl.length; j++) {
        doc.text(nl[j], cx, y);
        y += 5.2;
      }
      if (!nl.length) y += 5.2;
    }
    kv('Nama Madrasah', isi(d.kamad.madrasah, 60));
    kv('NSM / NPSN', isi(d.kamad.nsm, 26) + ' / ' + isi(d.kamad.npsn, 20));
    kv('Alamat Madrasah', isi(d.kamad.alamat, 60));
    kv('Kecamatan', isi(d.kamad.kecamatan, 45));
    kv('Kabupaten', isi(d.kamad.kabupaten, 45));
    y += 3;

    // ---- Isi
    var noST = d.nomorSuratTugas ? d.nomorSuratTugas : titik(50);
    var tglST = d.tanggalSuratTugas ? tanggalIndonesia(d.tanggalSuratTugas) : titik(28);

    if (!is4) {
      // Versi Tahunan: blok surat tugas + dua penilai
      var t1 = 'berdasarkan surat tugas yang dikeluarkan oleh Kantor Kementerian Agama Kabupaten ' +
        (d.kamad.kabupaten || '') + ' Nomor: ' + noST + ' Tanggal ' + tglST +
        ', TIM Penilai terdiri atas:';
      lines = doc.splitTextToSize(t1, CW);
      for (var a = 0; a < lines.length; a++) { doc.text(lines[a], ML, y); y += 5.2; }
      y += 3;

      biasa(11.5);
      doc.text('1. ' + isi(d.penilai1.nama, 48), lx, y);
      doc.text('(Sebagai Penilai-1)', W - MR - 34, y);
      y += 6;
      doc.text('2. ' + isi(d.penilai2.nama, 48), lx, y);
      doc.text('(Sebagai Penilai-2)', W - MR - 34, y);
      y += 7;

      var t2 = 'Telah dilaksanakan visitasi ke madrasah dalam rangka Penilaian Kinerja Kepala Madrasah (PKKM) Tahunan.';
      lines = doc.splitTextToSize(t2, CW);
      for (var b = 0; b < lines.length; b++) { doc.text(lines[b], ML, y); y += 5.2; }
      y += 2;
    } else {
      // Versi 4 Tahunan: pernyataan visitasi + surat tugas menyatu
      var t3 = 'Telah dilaksanakan visitasi ke madrasah dalam rangka Penilaian Kinerja Kepala Madrasah (PKKM) 4 Tahunan.';
      lines = doc.splitTextToSize(t3, CW);
      for (var c = 0; c < lines.length; c++) { doc.text(lines[c], ML, y); y += 5.2; }
      y += 2;
      var t4 = 'Visitasi PKKM dilakukan oleh Tim Penilai berdasarkan surat tugas yang dikeluarkan oleh Kantor Kementerian Agama Kabupaten ' +
        (d.kamad.kabupaten || '') + ' Nomor ' + noST + ' Tahun ' + d.tahun + ' Tanggal ' + tglST +
        ' tentang TIM Penilai Kinerja Kepala Madrasah.';
      lines = doc.splitTextToSize(t4, CW);
      for (var e = 0; e < lines.length; e++) { doc.text(lines[e], ML, y); y += 5.2; }
      y += 3;
    }

    var t5 = 'Kegiatan visitasi dilakukan melalui telaah data, observasi lapangan, dan wawancara dengan warga madrasah dalam rangka verifikasi, serta validasi terhadap data dan informasi yang diberikan oleh madrasah melalui instrumen Penilaian Kinerja Kepala Madrasah.';
    lines = doc.splitTextToSize(t5, CW);
    for (var f = 0; f < lines.length; f++) { doc.text(lines[f], ML, y); y += 5.2; }
    y += 2;

    var t6 = 'Demikian berita acara ini dibuat dengan sesungguhnya, untuk dapat digunakan sebagaimana mestinya.';
    lines = doc.splitTextToSize(t6, CW);
    for (var g = 0; g < lines.length; g++) { doc.text(lines[g], ML, y); y += 5.2; }
    y += 8;

    // ---- Tanda tangan
    // Ruang tanda tangan sengaja dikosongkan (tanpa titik-titik) agar bisa
    // ditandatangani langsung setelah dicetak. Jarak tetap dijaga.
    function blokTtd(x, lebar, judul, nama, nipLabel, nipVal) {
      var yy = y;
      biasa(11.5);
      doc.text(judul, x, yy); yy += 5.2;
      yy += 5.2 * 3 + 4;   // ruang kosong untuk tanda tangan
      if (nama) {
        tebal(11.5);
        doc.text(nama, x, yy);
      }
      yy += 5.2;
      biasa(11);
      if (nipVal) doc.text(nipLabel + nipVal, x, yy);
    }

    if (!is4) {
      var colW = CW / 3;
      blokTtd(ML, colW, 'Kepala Madrasah,', d.kamad.nama, 'NIP. ', d.kamad.nip);
      blokTtd(ML + colW, colW, 'Penilai 1,', d.penilai1.nama, 'NIP. ', d.penilai1.nip);
      blokTtd(ML + colW * 2, colW, 'Penilai 2,', d.penilai2.nama, 'NIP. ', d.penilai2.nip);
    } else {
      var colW2 = CW / 2;
      blokTtd(ML, colW2, 'Kepala Madrasah,', d.kamad.nama, 'NIP. ', d.kamad.nip);
      var yy2 = y;
      biasa(11.5);
      doc.text('Wakil Tim Penilai', ML + colW2, yy2); yy2 += 5.2;
      doc.text('Penilai 1,', ML + colW2, yy2); yy2 += 5.2;
      yy2 += 5.2 * 3 + 4;  // ruang kosong untuk tanda tangan
      if (d.penilai1.nama) {
        tebal(11.5);
        doc.text(d.penilai1.nama, ML + colW2, yy2);
      }
      yy2 += 5.2;
      biasa(11);
      if (d.penilai1.nip) doc.text('NIP. ' + d.penilai1.nip, ML + colW2, yy2);
    }

    // ---- Halaman 2: Daftar Hadir
    doc.addPage();
    y = MT;

    tebal(14);
    doc.text('DAFTAR HADIR', W / 2, y, { align: 'center' }); y += 6;
    doc.text('PENILAIAN KINERJA KEPALA MADRASAH', W / 2, y, { align: 'center' }); y += 6;
    biasa(12);
    doc.text('TAHUN ' + d.tahun, W / 2, y, { align: 'center' }); y += 8;

    biasa(11);
    var lx2 = ML + 2, cx2 = ML + 40;
    function kv2(label, nilai) {
      doc.text(label, lx2, y);
      doc.text(':', cx2 - 4, y);
      doc.text(nilai, cx2, y);
      y += 5.4;
    }
    kv2('Nama Kepala Madrasah', isi(d.kamad.nama, 45));
    kv2('Nama Madrasah', isi(d.kamad.madrasah, 45));
    kv2('Alamat Madrasah', isi(d.kamad.alamat, 45));
    kv2('Penilaian Tahun ke-', isi(String(d.tahun), 10));
    y += 4;

    // Tabel daftar hadir
    var tW = CW;
    var colNo = 12, colTtd = 40;
    var colNama = (tW - colNo - colTtd) * 0.45;
    var colJab = tW - colNo - colTtd - colNama;
    var rowH = 8.6;
    var tTop = y;

    doc.setFillColor(235, 240, 245);
    doc.setDrawColor(80);
    doc.setLineWidth(0.25);
    doc.rect(ML, tTop, tW, rowH, 'FD');
    doc.setFont('times', 'bold'); doc.setFontSize(10.5);
    doc.text('No.', ML + colNo / 2, tTop + 5.7, { align: 'center' });
    doc.text('Nama', ML + colNo + colNama / 2, tTop + 5.7, { align: 'center' });
    doc.text('Jabatan', ML + colNo + colNama + colJab / 2, tTop + 5.7, { align: 'center' });
    doc.text('Tanda Tangan', ML + colNo + colNama + colJab + colTtd / 2, tTop + 5.7, { align: 'center' });
    y = tTop + rowH;

    var jmlBaris = 16;
    doc.setFont('times', 'normal'); doc.setFontSize(10.5);
    for (var r = 0; r < jmlBaris; r++) {
      doc.rect(ML, y, tW, rowH);
      doc.line(ML + colNo, y, ML + colNo, y + rowH);
      doc.line(ML + colNo + colNama, y, ML + colNo + colNama, y + rowH);
      doc.line(ML + colNo + colNama + colJab, y, ML + colNo + colNama + colJab, y + rowH);
      doc.text(String(r + 1) + '.', ML + colNo / 2, y + 5.7, { align: 'center' });
      y += rowH;
    }
    y += 8;

    // Tanda tangan daftar hadir
    if (!is4) {
      var cw = CW / 3;
      blokTtd(ML, cw, 'Kepala Madrasah,', d.kamad.nama, 'NIP. ', d.kamad.nip);
      blokTtd(ML + cw, cw, 'Penilai 1,', d.penilai1.nama, 'NIP. ', d.penilai1.nip);
      blokTtd(ML + cw * 2, cw, 'Penilai 2,', d.penilai2.nama, 'NIP. ', d.penilai2.nip);
    } else {
      // Versi 4 tahunan: tempat & tanggal di atas
      var ytmp = y;
      biasa(11);
      doc.text(d.tempat + ', ' + tanggalIndonesia(d.tanggal), ML + 2, ytmp);
      y = ytmp + 8;
      var cw2 = CW / 2;
      blokTtd(ML, cw2, 'Kepala Madrasah,', d.kamad.nama, 'NIP. ', d.kamad.nip);
      blokTtd(ML + cw2, cw2, 'Penilai 1,', d.penilai1.nama, 'NIP. ', d.penilai1.nip);
    }

    // Footer halaman
    var total = doc.internal.getNumberOfPages();
    for (var pg = 1; pg <= total; pg++) {
      doc.setPage(pg);
      doc.setFont('times', 'normal'); doc.setFontSize(8.5); doc.setTextColor(120);
      doc.text('Berita Acara PKKM ' + (is4 ? '4 Tahunan' : 'Tahunan') + ' - ' + (d.kamad.madrasah || ''),
        ML, H - 10);
      doc.text('Halaman ' + pg + ' dari ' + total, W - MR, H - 10, { align: 'right' });
      doc.setTextColor(0);
    }

    return doc;
  }

  // ---------------------------------------------------------------- Word
  // Pakai HTML ber-ekstensi .doc supaya tidak butuh pustaka tambahan dan
  // tetap bisa dibuka/diedit di Word, LibreOffice, maupun Google Docs.
  function wordHTML(d) {
    var is4 = d.jenis === '4tahunan';
    function esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function t(n) { return esc(titik(n)); }
    function val(v, n) { return esc((v == null ? '' : String(v)).trim() || titik(n)); }
    // Untuk area tanda tangan: kosong = kosong (tanpa titik-titik), agar bisa
    // ditandatangani langsung setelah dicetak.
    function ttdVal(v) { return esc((v == null ? '' : String(v)).trim()); }
    function ttdNip(v) { var s = (v == null ? '' : String(v)).trim(); return s ? 'NIP. ' + esc(s) : ''; }
    var T = '<td style="border:1px solid #000;padding:3px 5px;">';
    var baris = '';
    for (var r = 1; r <= 16; r++) {
      baris += '<tr>' + T + 'text-align:center;width:8%;">' + r + '.</td>' +
        T + 'height:26px;"></td>' + T + '</td>' + T + '</td></tr>';
    }

    var identitas = [
      ['Nama Madrasah', val(d.kamad.madrasah, 55)],
      ['NSM / NPSN', val(d.kamad.nsm, 26) + ' / ' + val(d.kamad.npsn, 18)],
      ['Alamat Madrasah', val(d.kamad.alamat, 55)],
      ['Kecamatan', val(d.kamad.kecamatan, 40)],
      ['Kabupaten', val(d.kamad.kabupaten, 40)],
    ].map(function (kv) {
      return '<tr><td width="30%">' + esc(kv[0]) + '</td><td width="3%">:</td><td>' + kv[1] + '</td></tr>';
    }).join('');

    var subJudul = is4
      ? 'MADRASAH ' + esc(d.kamad.jenjang || '') + ' KABUPATEN ' + esc((d.kamad.kabupaten || '').toUpperCase())
      : 'DI LINGKUNGAN KANTOR KEMENTERIAN AGAMA KABUPATEN ' + esc((d.kamad.kabupaten || '').toUpperCase());

    var noST = val(d.nomorSuratTugas, 50);
    var tglST = d.tanggalSuratTugas ? esc(tanggalIndonesia(d.tanggalSuratTugas)) : t(28);

    var isiTengah = is4
      ? '<p style="text-align:justify;">Telah dilaksanakan visitasi ke madrasah dalam rangka Penilaian Kinerja Kepala Madrasah (PKKM) 4 Tahunan.</p>' +
        '<p style="text-align:justify;">Visitasi PKKM dilakukan oleh Tim Penilai berdasarkan surat tugas yang dikeluarkan oleh Kantor Kementerian Agama Kabupaten ' +
        esc(d.kamad.kabupaten) + ' Nomor ' + noST + ' Tahun ' + esc(d.tahun) + ' Tanggal ' + tglST +
        ' tentang TIM Penilai Kinerja Kepala Madrasah.</p>'
      : '<p style="text-align:justify;">berdasarkan surat tugas yang dikeluarkan oleh Kantor Kementerian Agama Kabupaten ' +
        esc(d.kamad.kabupaten) + ' Nomor: ' + noST + ' Tanggal ' + tglST + ', TIM Penilai terdiri atas:</p>' +
        '<table style="width:100%;"><tr><td width="6%">1.</td><td>' + val(d.penilai1.nama, 45) +
        '</td><td width="22%">(Sebagai Penilai-1)</td></tr>' +
        '<tr><td>2.</td><td>' + val(d.penilai2.nama, 45) + '</td><td>(Sebagai Penilai-2)</td></tr></table>' +
        '<p style="text-align:justify;">Telah dilaksanakan visitasi ke madrasah dalam rangka Penilaian Kinerja Kepala Madrasah (PKKM) Tahunan.</p>';

    var ttd = is4
      ? '<table style="width:100%;margin-top:24px;"><tr>' +
        '<td width="50%" style="text-align:center;">Kepala Madrasah,<br><br><br><br><br>' +
        '<b>' + ttdVal(d.kamad.nama) + '</b><br>' + ttdNip(d.kamad.nip) + '</td>' +
        '<td width="50%" style="text-align:center;">Wakil Tim Penilai<br>Penilai 1,<br><br><br><br><br>' +
        '<b>' + ttdVal(d.penilai1.nama) + '</b><br>' + ttdNip(d.penilai1.nip) + '</td>' +
        '</tr></table>'
      : '<table style="width:100%;margin-top:24px;"><tr>' +
        '<td width="33%" style="text-align:center;">Kepala Madrasah,<br><br><br><br><br>' +
        '<b>' + ttdVal(d.kamad.nama) + '</b><br>' + ttdNip(d.kamad.nip) + '</td>' +
        '<td width="33%" style="text-align:center;">Penilai 1,<br><br><br><br><br>' +
        '<b>' + ttdVal(d.penilai1.nama) + '</b><br>' + ttdNip(d.penilai1.nip) + '</td>' +
        '<td width="33%" style="text-align:center;">Penilai 2,<br><br><br><br><br>' +
        '<b>' + ttdVal(d.penilai2.nama) + '</b><br>' + ttdNip(d.penilai2.nip) + '</td>' +
        '</tr></table>';

    var ttdDafdir = is4
      ? '<p>' + esc(d.tempat) + ', ' + esc(tanggalIndonesia(d.tanggal)) + '</p>' +
        '<table style="width:100%;"><tr>' +
        '<td width="50%" style="text-align:center;">Kepala Madrasah,<br><br><br><br><br>' +
        '<b>' + ttdVal(d.kamad.nama) + '</b><br>' + ttdNip(d.kamad.nip) + '</td>' +
        '<td width="50%" style="text-align:center;">Penilai 1,<br><br><br><br><br>' +
        '<b>' + ttdVal(d.penilai1.nama) + '</b><br>' + ttdNip(d.penilai1.nip) + '</td>' +
        '</tr></table>'
      : '<table style="width:100%;"><tr>' +
        '<td width="33%" style="text-align:center;">Kepala Madrasah,<br><br><br><br><br>' +
        '<b>' + ttdVal(d.kamad.nama) + '</b><br>' + ttdNip(d.kamad.nip) + '</td>' +
        '<td width="33%" style="text-align:center;">Penilai 1,<br><br><br><br><br>' +
        '<b>' + ttdVal(d.penilai1.nama) + '</b><br>' + ttdNip(d.penilai1.nip) + '</td>' +
        '<td width="33%" style="text-align:center;">Penilai 2,<br><br><br><br><br>' +
        '<b>' + ttdVal(d.penilai2.nama) + '</b><br>' + ttdNip(d.penilai2.nip) + '</td>' +
        '</tr></table>';

    var html =
      '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
      '<head><meta charset="utf-8"><title>Berita Acara PKKM</title>' +
      '<style>' +
      '@page { size: A4; margin: 2cm 2cm 2cm 2cm; }' +
      'body { font-family: "Times New Roman", Times, serif; font-size: 12pt; }' +
      'h1 { font-size: 14pt; text-align: center; margin: 0; font-weight: bold; }' +
      'h2 { font-size: 12pt; text-align: center; margin: 0 0 6pt 0; font-weight: normal; }' +
      'p { margin: 4pt 0; text-align: justify; }' +
      'table { border-collapse: collapse; }' +
      '</style></head><body>' +
      '<h1>BERITA ACARA PELAKSANAAN</h1>' +
      '<h1>PENILAIAN KINERJA KEPALA MADRASAH</h1>' +
      '<h2>' + subJudul + '</h2>' +
      '<h2>TAHUN ' + esc(d.tahun) + '</h2>' +
      '<hr>' +
      '<p>Pada hari ini ' + t(14) + ' tanggal ' + t(12) + ' bulan ' + t(14) + ' tahun ' +
      esc(tahunHuruf(d.tahun)) + ' pukul ' + val(d.pukulMulai, 8) + ' s.d ' + val(d.pukulSelesai, 8) +
      ' WIB, bertempat di:</p>' +
      '<table style="width:100%;">' + identitas + '</table>' +
      isiTengah +
      '<p style="text-align:justify;">Kegiatan visitasi dilakukan melalui telaah data, observasi lapangan, dan wawancara dengan warga madrasah dalam rangka verifikasi, serta validasi terhadap data dan informasi yang diberikan oleh madrasah melalui instrumen Penilaian Kinerja Kepala Madrasah.</p>' +
      '<p style="text-align:justify;">Demikian berita acara ini dibuat dengan sesungguhnya, untuk dapat digunakan sebagaimana mestinya.</p>' +
      ttd +
      '<br clear="all" style="page-break-before:always">' +
      '<h1>DAFTAR HADIR</h1>' +
      '<h1>PENILAIAN KINERJA KEPALA MADRASAH</h1>' +
      '<h2>TAHUN ' + esc(d.tahun) + '</h2>' +
      '<table style="width:100%;margin-bottom:8pt;">' +
      '<tr><td width="30%">Nama Kepala Madrasah</td><td width="3%">:</td><td>' + val(d.kamad.nama, 45) + '</td></tr>' +
      '<tr><td>Nama Madrasah</td><td>:</td><td>' + val(d.kamad.madrasah, 45) + '</td></tr>' +
      '<tr><td>Alamat Madrasah</td><td>:</td><td>' + val(d.kamad.alamat, 45) + '</td></tr>' +
      '<tr><td>Penilaian Tahun ke-</td><td>:</td><td>' + esc(d.tahun) + '</td></tr>' +
      '</table>' +
      '<table style="width:100%;">' +
      '<tr><th style="border:1px solid #000;padding:4px;background:#e8eef4;">No.</th>' +
      '<th style="border:1px solid #000;padding:4px;background:#e8eef4;">Nama</th>' +
      '<th style="border:1px solid #000;padding:4px;background:#e8eef4;">Jabatan</th>' +
      '<th style="border:1px solid #000;padding:4px;background:#e8eef4;">Tanda Tangan</th></tr>' +
      baris + '</table>' +
      ttdDafdir +
      '</body></html>';

    return html;
  }

  function unduhWord(d) {
    var html = wordHTML(d);
    // Pakai MIME Word + BOM agar karakter Indonesia aman di Word.
    var blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    var namaFile = 'Berita-Acara-PKKM-' + (d.jenis === '4tahunan' ? '4Tahunan' : 'Tahunan') + '-' +
      (d.kamad.madrasah || 'madrasah').replace(/[^\w\-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') +
      '-' + d.tahun + '.doc';
    a.href = url;
    a.download = namaFile;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    return namaFile;
  }

  function namaBerkas(d, ext) {
    var m = (d.kamad.madrasah || 'madrasah').replace(/[^\w\-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    return 'Berita-Acara-PKKM-' + (d.jenis === '4tahunan' ? '4Tahunan' : 'Tahunan') + '-' + m + '-' + d.tahun + '.' + ext;
  }

  function unduhPDF(d) {
    var doc = pdfData(d);
    doc.save(namaBerkas(d, 'pdf'));
    return doc;
  }

  window.BeritaAcara = {
    kumpulkan: kumpulkan,
    unduhPDF: unduhPDF,
    unduhWord: unduhWord,
    pdfData: pdfData,
    wordHTML: wordHTML,
    namaBerkas: namaBerkas,
  };
})();
