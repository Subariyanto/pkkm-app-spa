// instrumen_pdf.js — Ekspor Instrumen PKKM (per jenjang) ke PDF
// -----------------------------------------------------------------------------
// Dipakai oleh:
//   - Tombol "Download PDF" pada halaman #/instrumen (jenjang yang sedang dipilih)
//   - Halaman #/instrumen-pdf (pilih jenjang + role, lalu unduh)
//
// Catatan:
//   * Memakai getInstrumenByJenjang(jenjang, role) + getIndikatorTampil() sehingga
//     mengikuti override hasil "Edit Instrumen" per jenjang dan varian RA.
//   * Layout digambar manual (tanpa plugin) agar tidak ada ketergantungan tambahan
//     selain jsPDF. Teks panjang otomatis di-wrap, ganti halaman otomatis.
(function () {
  'use strict';

  var JENJANG_LABEL = {
    RA: 'RA (Raudhatul Athfal)',
    MI: 'MI (Madrasah Ibtidaiyah)',
    MTs: 'MTs (Madrasah Tsanawiyah)',
    MA: 'MA (Madrasah Aliyah)',
  };

  var SKOR_LABEL = { 1: 'Kurang', 2: 'Cukup', 3: 'Baik', 4: 'Amat Baik' };

  function safeText(s) {
    return String(s == null ? '' : s)
      .replace(/\r\n|\r/g, '\n')
      .replace(/[\u00b7\u2022\u25cf]/g, '-')
      .replace(/\t/g, '  ')
      .trim();
  }

  function getList(jenjang, role) {
    var list = window.getInstrumenByJenjang ? window.getInstrumenByJenjang(jenjang, role) : null;
    if (list && list.length) return list;
    return window.PKKM_KOMPONEN || [];
  }

  function countsFor(jenjang, role) {
    var list = getList(jenjang, role);
    var aspek = 0, indikator = 0;
    for (var i = 0; i < list.length; i++) {
      aspek += list[i].aspek.length;
      for (var j = 0; j < list[i].aspek.length; j++) indikator += list[i].aspek[j].indikator.length;
    }
    return { komponen: list.length, aspek: aspek, indikator: indikator };
  }

  function getMeta() {
    var kab = 'Jember', pok = { nama: '', nip: '' };
    try {
      if (window.Meta) {
        kab = window.Meta.get('kabupaten_kota', 'Jember') || 'Jember';
        pok = window.Meta.get('identitas_ketua_pokjawas', {}) || pok;
      }
    } catch (e) { /* noop */ }
    return { kab: kab, pok: pok };
  }

  function tanggalPanjang(d) {
    var bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
      'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    try {
      return d.getDate() + ' ' + bulan[d.getMonth()] + ' ' + d.getFullYear();
    } catch (e) { return ''; }
  }

  function generate(jenjang, opts) {
    opts = opts || {};
    var role = opts.role || null;
    var Ctor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!Ctor) throw new Error('Pustaka jsPDF belum termuat. Muat ulang halaman (hard refresh) lalu coba lagi.');

    var list = getList(jenjang, role);
    if (!list.length) throw new Error('Data instrumen kosong untuk jenjang ' + jenjang + '.');

    var meta = getMeta();
    var doc = new Ctor({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    var PAGE_W = doc.internal.pageSize.getWidth();
    var PAGE_H = doc.internal.pageSize.getHeight();
    var ML = 14, MR = 14, MT = 16, MB = 16;
    var CW = PAGE_W - ML - MR;

    var page = 1;
    var y = MT + 6;

    doc.setProperties({
      title: 'Instrumen PKKM - ' + jenjang,
      subject: 'Instrumen Penilaian Kinerja Kepala Madrasah (PKKM)',
      author: 'Aplikasi PKKM - Pokjawas Madrasah Kab. ' + meta.kab,
      creator: 'Aplikasi PKKM',
    });

    function drawFooter() {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(130);
      doc.text('Aplikasi PKKM - Pokjawas Madrasah Kab. ' + meta.kab + '  |  Jenjang ' + jenjang, ML, PAGE_H - 8);
      doc.text('Halaman ' + page, PAGE_W - MR, PAGE_H - 8, { align: 'right' });
      doc.setTextColor(0);
      doc.setDrawColor(210);
      doc.line(ML, PAGE_H - 11.5, PAGE_W - MR, PAGE_H - 11.5);
    }

    function newPage() {
      drawFooter();
      doc.addPage();
      page++;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(130);
      doc.text('Instrumen PKKM - Jenjang ' + jenjang + ' - Pokjawas Madrasah Kab. ' + meta.kab, ML, MT - 5);
      doc.setTextColor(0);
      y = MT + 2;
    }

    function space(h) {
      if (y + h > PAGE_H - MB) newPage();
    }

    // Tulis teks (auto-wrap). y = baseline baris berikutnya.
    function line(str, o) {
      o = o || {};
      var size = o.size || 9;
      var style = o.style || 'normal';
      var indent = o.indent || 0;
      var gap = o.gap != null ? o.gap : 1.4;
      var color = o.color || null;
      var align = o.align || 'left';
      var lh = size * 0.42;
      // Set font/size DULU agar pengukuran lebar teks (splitTextToSize) akurat,
      // kalau tidak, baris panjang bisa meluber keluar margin.
      doc.setFont('helvetica', style);
      doc.setFontSize(size);
      var lines = doc.splitTextToSize(safeText(str), CW - indent);
      for (var i = 0; i < lines.length; i++) {
        space(lh);
        doc.setFont('helvetica', style);
        doc.setFontSize(size);
        if (color) doc.setTextColor(color[0], color[1], color[2]); else doc.setTextColor(0);
        var x = align === 'center' ? (ML + CW / 2) : (ML + indent);
        doc.text(lines[i], x, y, align === 'center' ? { align: 'center' } : undefined);
        y += lh + 0.8;
      }
      y += gap;
    }

    function divider(gap) {
      space(4);
      doc.setDrawColor(225);
      doc.line(ML, y - 1.5, ML + CW, y - 1.5);
      y += (gap != null ? gap : 3);
    }

    // ===== Kop / judul =====
    line('INSTRUMEN PENILAIAN KINERJA KEPALA MADRASAH (PKKM)', { size: 13, style: 'bold', align: 'center', gap: 0.6 });
    line('Jenjang ' + (JENJANG_LABEL[jenjang] || jenjang), { size: 11.5, style: 'bold', align: 'center', gap: 0.6 });
    line('Kelompok Kerja Pengawas (Pokjawas) Madrasah Kabupaten ' + meta.kab, { size: 9.5, align: 'center', gap: 0.4 });
    var c = countsFor(jenjang, role);
    line(c.komponen + ' komponen  |  ' + c.aspek + ' sub-aspek  |  ' + c.indikator + ' indikator  |  skor 1-4',
      { size: 8.5, align: 'center', color: [90, 90, 90], gap: 0.8 });
    line('Diunduh: ' + tanggalPanjang(new Date()), { size: 8, align: 'center', color: [120, 120, 120], gap: 2 });
    divider(4);

    // ===== Isi per komponen =====
    for (var ki = 0; ki < list.length; ki++) {
      var k = list[ki];
      var totalIndK = 0;
      for (var ai0 = 0; ai0 < k.aspek.length; ai0++) totalIndK += k.aspek[ai0].indikator.length;

      space(10);
      doc.setFillColor(238, 243, 248);
      doc.rect(ML, y - 4.4, CW, 6.4, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(10, 60, 30);
      doc.text(safeText(k.no + '. ' + k.label), ML + 2, y);
      doc.setTextColor(0);
      y += 8.5;

      for (var ai = 0; ai < k.aspek.length; ai++) {
        var a = k.aspek[ai];
        space(8);
        line(a.kode + '  ' + (a.unsur || ''), { size: 9.6, style: 'bold', color: [20, 80, 45], gap: 1.2 });

        for (var ii = 0; ii < a.indikator.length; ii++) {
          var ind = a.indikator[ii];
          var id = k.code + '_' + a.kode + '_' + ind.no;
          var r = (window.getIndikatorTampil ? window.getIndikatorTampil(ind, id, jenjang) : ind) || {};

          space(9);
          line(a.kode + '.' + ind.no + '  ' + (r.indikator || ''), { size: 9, style: 'bold', gap: 0.6 });

          if (r.data) {
            line('Data yang diharapkan: ' + r.data, { size: 8.5, indent: 4.5, color: [55, 55, 55], gap: 0.5 });
          }
          if (r.penggalian) {
            line('Fokus penggalian: ' + r.penggalian, { size: 8.5, indent: 4.5, color: [55, 55, 55], gap: 0.5 });
          }
          if (r.bukti) {
            line('Bukti / cara penggalian: ' + r.bukti, { size: 8.5, indent: 4.5, color: [55, 55, 55], gap: 0.5 });
          }

          var rub = r.rubrik || ind.rubrik || null;
          if (rub && (rub[1] || rub[2] || rub[3] || rub[4])) {
            line('Rubrik skor:', { size: 8.4, style: 'italic', indent: 4.5, color: [70, 70, 70], gap: 0.3 });
            for (var v = 4; v >= 1; v--) {
              if (rub[v]) {
                line('Skor ' + v + ' (' + SKOR_LABEL[v] + '): ' + rub[v], { size: 8.2, indent: 7.5, color: [95, 95, 95], gap: 0.2 });
              }
            }
          }
          y += 1.2;
          divider(3);
        }
      }
    }

    // ===== Catatan sumber =====
    space(12);
    divider(4);
    line('Sumber instrumen: Aplikasi PKKM Excel v.110820 (Sarjono & Ida Syam, Pengawas Kemenag Lamongan), ' +
      'disesuaikan konteks PKKM Kemenag dan jenjang RA.', { size: 7.8, color: [120, 120, 120], gap: 0.4 });
    line('Skor: 1 = Kurang, 2 = Cukup, 3 = Baik, 4 = Amat Baik. Bobot komponen diatur pada menu Pengaturan aplikasi.',
      { size: 7.8, color: [120, 120, 120], gap: 0.4 });
    if (meta.pok && meta.pok.nama) {
      line('Ketua Pokjawas Madrasah: ' + meta.pok.nama + (meta.pok.nip ? ' (NIP ' + meta.pok.nip + ')' : ''),
        { size: 7.8, color: [120, 120, 120], gap: 0.4 });
    }

    drawFooter();
    return doc;
  }

  function fileName(jenjang, role) {
    var tgl = new Date();
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    var stamp = tgl.getFullYear() + p(tgl.getMonth() + 1) + p(tgl.getDate());
    var suffix = role === 'gtk' ? '-GTK' : '';
    return 'Instrumen-PKKM-' + jenjang + suffix + '-' + stamp + '.pdf';
  }

  function download(jenjang, opts) {
    opts = opts || {};
    var doc = generate(jenjang, opts);
    doc.save(opts.filename || fileName(jenjang, opts.role));
    return doc;
  }

  window.InstrumenPDF = {
    generate: generate,
    download: download,
    countsFor: countsFor,
    fileName: fileName,
    JENJANG_LABEL: JENJANG_LABEL,
  };
})();
