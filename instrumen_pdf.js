// instrumen_pdf.js — Ekspor Instrumen PKKM (per jenjang) ke PDF
// -----------------------------------------------------------------------------
// Dua mode:
//   1. mode: 'instrumen' (default)
//      Lembar instrumen lengkap: indikator + data + fokus penggalian + bukti +
//      rubrik skor 1-4. Dipakai pengawas sebagai acuan/panduan.
//   2. mode: 'formulir'
//      FORMULIR PENILAIAN MANUAL: identitas penilai, daftar indikator, dan
//      kotak skor 1 2 3 4 KOSONG untuk dicentang pengawas. Setelah dinilai di
//      lapangan, hasilnya tinggal diinput ke aplikasi PKKM.
//
// Dipakai oleh:
//   - Tombol "Download Formulir" / "Download PDF" pada halaman #/instrumen
//   - Halaman #/instrumen-pdf (pilih jenjang + penilai + mode)
//
// Catatan:
//   * Memakai getInstrumenByJenjang(jenjang, role) + getIndikatorTampil()
//     sehingga mengikuti override hasil "Edit Instrumen" per jenjang & varian RA.
//   * Layout digambar manual (hanya butuh jsPDF, tanpa plugin tambahan).
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
      .replace(/\n+/g, ' ')
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
    var out = {
      kab: 'Jember',
      pok: { nama: '', nip: '' },
      pengawas: { nama: '', nip: '', jabatan: 'Pengawas Madrasah', unit: '' },
    };
    try {
      if (window.Meta) {
        out.kab = window.Meta.get('kabupaten_kota', 'Jember') || 'Jember';
        out.pok = window.Meta.get('identitas_ketua_pokjawas', {}) || out.pok;
        out.pengawas = window.Meta.get('identitas_pengawas', {}) || out.pengawas;
      }
    } catch (e) { /* noop */ }
    if (!out.pengawas.unit) out.pengawas.unit = 'Kemenag Kabupaten ' + out.kab;
    if (!out.pengawas.jabatan) out.pengawas.jabatan = 'Pengawas Madrasah';
    return out;
  }

  function roleLabel(code) {
    var list = window.PKKM_ROLES || [];
    var f = list.filter(function (r) { return r.code === code; })[0];
    return f ? f.label : (code || 'Penilai');
  }

  function tanggalPanjang(d) {
    var bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
      'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    try {
      return d.getDate() + ' ' + bulan[d.getMonth()] + ' ' + d.getFullYear();
    } catch (e) { return ''; }
  }

  // ==========================================================================
  // Konteks dokumen (pembungkus jsPDF + helper tulis/ganti halaman)
  // ==========================================================================
  function makeCtx(jenjang, headerLabel) {
    var Ctor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!Ctor) throw new Error('Pustaka jsPDF belum termuat. Muat ulang halaman (hard refresh) lalu coba lagi.');

    var doc = new Ctor({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    var W = doc.internal.pageSize.getWidth();
    var H = doc.internal.pageSize.getHeight();
    var ML = 14, MR = 14, MT = 16, MB = 16;

    var ctx = {
      doc: doc,
      jenjang: jenjang,
      page: 1,
      y: MT + 6,
      W: W, H: H, ML: ML, MR: MR, MT: MT, MB: MB,
      CW: W - ML - MR,
      headerLabel: headerLabel || '',
    };

    ctx.drawFooter = function () {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(130);
      doc.text(ctx.headerLabel, ML, H - 8);
      doc.text('Halaman ' + ctx.page, W - MR, H - 8, { align: 'right' });
      doc.setTextColor(0);
      doc.setDrawColor(210);
      doc.line(ML, H - 11.5, W - MR, H - 11.5);
    };

    ctx.newPage = function () {
      ctx.drawFooter();
      doc.addPage();
      ctx.page++;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(130);
      doc.text(ctx.headerLabel, ML, MT - 5);
      doc.setTextColor(0);
      ctx.y = MT + 2;
    };

    ctx.space = function (h) {
      if (ctx.y + h > H - MB) ctx.newPage();
    };

    // Tulis teks auto-wrap. ctx.y = baseline baris berikutnya.
    ctx.line = function (str, o) {
      o = o || {};
      var size = o.size || 9;
      var style = o.style || 'normal';
      var indent = o.indent || 0;
      var gap = o.gap != null ? o.gap : 1.4;
      var color = o.color || null;
      var align = o.align || 'left';
      var maxW = o.maxW != null ? o.maxW : (ctx.CW - indent);
      var lh = size * 0.42;
      // Set font DULU agar pengukuran lebar teks akurat.
      doc.setFont('helvetica', style);
      doc.setFontSize(size);
      var lines = doc.splitTextToSize(safeText(str), maxW);
      for (var i = 0; i < lines.length; i++) {
        ctx.space(lh);
        doc.setFont('helvetica', style);
        doc.setFontSize(size);
        if (color) doc.setTextColor(color[0], color[1], color[2]); else doc.setTextColor(0);
        var x = align === 'center' ? (ML + ctx.CW / 2) : (ML + indent);
        doc.text(lines[i], x, ctx.y, align === 'center' ? { align: 'center' } : undefined);
        ctx.y += lh + 0.8;
      }
      ctx.y += gap;
      return lines.length;
    };

    ctx.divider = function (gap) {
      ctx.space(4);
      doc.setDrawColor(225);
      doc.line(ML, ctx.y - 1.5, ML + ctx.CW, ctx.y - 1.5);
      ctx.y += (gap != null ? gap : 3);
    };

    // Kotak skor (kosong / siap dicentang). rightX = tepi kanan blok kotak.
    ctx.scoreBoxes = function (vals, topY, opt) {
      opt = opt || {};
      var w = opt.w || 6.2, h = opt.h || 6.2, gapx = opt.gapx != null ? opt.gapx : 2.2;
      var total = vals.length * w + (vals.length - 1) * gapx;
      var x0 = (opt.rightX != null ? opt.rightX : (ML + ctx.CW)) - total;
      doc.setDrawColor(90);
      doc.setLineWidth(0.25);
      doc.setTextColor(60);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.6);
      for (var i = 0; i < vals.length; i++) {
        var x = x0 + i * (w + gapx);
        doc.rect(x, topY, w, h);
        doc.text(String(vals[i]), x + w / 2, topY + h - 2.0, { align: 'center' });
      }
      doc.setLineWidth(0.2);
      doc.setTextColor(0);
      return total;
    };

    ctx.drawFooter();
    return ctx;
  }

  // ==========================================================================
  // Renderer 1 — INSTRUMEN LENGKAP (dengan rubrik)
  // ==========================================================================
  function buildInstrumen(ctx, jenjang, role) {
    var doc = ctx.doc;
    var meta = getMeta();
    var list = getList(jenjang, role);
    var c = countsFor(jenjang, role);

    ctx.line('INSTRUMEN PENILAIAN KINERJA KEPALA MADRASAH (PKKM)', { size: 13, style: 'bold', align: 'center', gap: 0.6 });
    ctx.line('Jenjang ' + (JENJANG_LABEL[jenjang] || jenjang), { size: 11.5, style: 'bold', align: 'center', gap: 0.6 });
    ctx.line('Kelompok Kerja Pengawas (Pokjawas) Madrasah Kabupaten ' + meta.kab, { size: 9.5, align: 'center', gap: 0.4 });
    ctx.line(c.komponen + ' komponen  |  ' + c.aspek + ' sub-aspek  |  ' + c.indikator + ' indikator  |  skor 1-4',
      { size: 8.5, align: 'center', color: [90, 90, 90], gap: 0.8 });
    ctx.line('Diunduh: ' + tanggalPanjang(new Date()), { size: 8, align: 'center', color: [120, 120, 120], gap: 2 });
    ctx.divider(4);

    for (var ki = 0; ki < list.length; ki++) {
      var k = list[ki];
      ctx.space(10);
      doc.setFillColor(238, 243, 248);
      doc.rect(ctx.ML, ctx.y - 4.4, ctx.CW, 6.4, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(10, 60, 30);
      doc.text(safeText(k.no + '. ' + k.label), ctx.ML + 2, ctx.y);
      doc.setTextColor(0);
      ctx.y += 8.5;

      for (var ai = 0; ai < k.aspek.length; ai++) {
        var a = k.aspek[ai];
        ctx.space(8);
        ctx.line(a.kode + '  ' + (a.unsur || ''), { size: 9.6, style: 'bold', color: [20, 80, 45], gap: 1.2 });

        for (var ii = 0; ii < a.indikator.length; ii++) {
          var ind = a.indikator[ii];
          var id = k.code + '_' + a.kode + '_' + ind.no;
          var r = (window.getIndikatorTampil ? window.getIndikatorTampil(ind, id, jenjang) : ind) || {};

          ctx.space(9);
          ctx.line(a.kode + '.' + ind.no + '  ' + (r.indikator || ''), { size: 9, style: 'bold', gap: 0.6 });

          if (r.data) ctx.line('Data yang diharapkan: ' + r.data, { size: 8.5, indent: 4.5, color: [55, 55, 55], gap: 0.5 });
          if (r.penggalian) ctx.line('Fokus penggalian: ' + r.penggalian, { size: 8.5, indent: 4.5, color: [55, 55, 55], gap: 0.5 });
          if (r.bukti) ctx.line('Bukti / cara penggalian: ' + r.bukti, { size: 8.5, indent: 4.5, color: [55, 55, 55], gap: 0.5 });

          var rub = r.rubrik || ind.rubrik || null;
          if (rub && (rub[1] || rub[2] || rub[3] || rub[4])) {
            ctx.line('Rubrik skor:', { size: 8.4, style: 'italic', indent: 4.5, color: [70, 70, 70], gap: 0.3 });
            for (var v = 4; v >= 1; v--) {
              if (rub[v]) ctx.line('Skor ' + v + ' (' + SKOR_LABEL[v] + '): ' + rub[v], { size: 8.2, indent: 7.5, color: [95, 95, 95], gap: 0.2 });
            }
          }
          ctx.y += 1.2;
          ctx.divider(3);
        }
      }
    }

    ctx.space(12);
    ctx.divider(4);
    ctx.line('Sumber instrumen: Aplikasi PKKM Excel v.110820 (Sarjono & Ida Syam, Pengawas Kemenag Lamongan), ' +
      'disesuaikan konteks PKKM Kemenag dan jenjang RA.', { size: 7.8, color: [120, 120, 120], gap: 0.4 });
    ctx.line('Skor: 1 = Kurang, 2 = Cukup, 3 = Baik, 4 = Amat Baik. Bobot komponen diatur pada menu Pengaturan aplikasi.',
      { size: 7.8, color: [120, 120, 120], gap: 0.4 });
    if (meta.pok && meta.pok.nama) {
      ctx.line('Ketua Pokjawas Madrasah: ' + meta.pok.nama + (meta.pok.nip ? ' (NIP ' + meta.pok.nip + ')' : ''),
        { size: 7.8, color: [120, 120, 120], gap: 0.4 });
    }
  }

  // ==========================================================================
  // Renderer 2 — FORMULIR PENILAIAN MANUAL (kotak skor kosong)
  // ==========================================================================
  function buildFormulir(ctx, jenjang, role, identity, opts) {
    var doc = ctx.doc;
    var meta = getMeta();
    var list = getList(jenjang, role);
    var c = countsFor(jenjang, role);
    identity = identity || {};
    opts = opts || {};

    var BOX_W = 6.4, BOX_GAP = 2.4, BOXES_TOTAL = 4 * BOX_W + 3 * BOX_GAP; // ~32.8
    var TEXT_RIGHT_GAP = BOXES_TOTAL + 4;

    // ---- Judul ----
    ctx.line('FORMULIR PENILAIAN KINERJA KEPALA MADRASAH (PKKM)', { size: 12.5, style: 'bold', align: 'center', gap: 0.5 });
    ctx.line('Jenjang ' + (JENJANG_LABEL[jenjang] || jenjang), { size: 11, style: 'bold', align: 'center', gap: 0.5 });
    ctx.line('Kelompok Kerja Pengawas (Pokjawas) Madrasah Kabupaten ' + meta.kab, { size: 9.2, align: 'center', gap: 0.3 });
    var rl = identity.role_label || roleLabel(identity.role_code) || (role === 'gtk' ? 'Guru / Tenaga Kependidikan' : 'Pengawas Madrasah');
    ctx.line('Lembar Penilaian: ' + rl, { size: 9.5, style: 'bold', align: 'center', color: [20, 80, 45], gap: 1.4 });

    // ---- Identitas (kotak berbingkai, 2 kolom) ----
    var rows = [
      ['Nama Kepala Madrasah', identity.kamad_nama, 'NIP / NIY / NIK', identity.kamad_nip],
      ['Nama Madrasah', identity.kamad_madrasah, 'NSM', identity.kamad_nsm],
      ['Jenjang', (JENJANG_LABEL[jenjang] || jenjang), 'Periode Penilaian', identity.periode],
      ['Nama Penilai', identity.penilai_nama, 'NIP / NIY / NIK Penilai', identity.penilai_nip],
      ['Jabatan', identity.penilai_jabatan, 'Unit Kerja / Madrasah', identity.penilai_unit],
      ['Tanggal Penilaian', identity.tanggal, '', ''],
    ];

    var colGap = 6;
    var colW = (ctx.CW - colGap) / 2;
    var rowH = 9.6;
    ctx.space(rowH * rows.length + 6);
    var boxTop = ctx.y - 5.2;
    doc.setDrawColor(200);
    doc.rect(ctx.ML, boxTop, ctx.CW, rowH * rows.length);

    for (var ri = 0; ri < rows.length; ri++) {
      var ry = boxTop + ri * rowH;
      if (ri > 0) { doc.setDrawColor(226); doc.line(ctx.ML, ry, ctx.ML + ctx.CW, ry); }
      doc.setDrawColor(226); doc.line(ctx.ML + colW + colGap / 2, ry, ctx.ML + colW + colGap / 2, ry + rowH);
      for (var ci = 0; ci < 2; ci++) {
        var label = rows[ri][ci * 2], val = rows[ri][ci * 2 + 1];
        if (!label) continue;
        var cx = ctx.ML + (ci === 0 ? 0 : colW + colGap) + 2;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(110);
        doc.text(safeText(label), cx, ry + 3.6);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(0);
        var v = safeText(val);
        var vx = cx + 34;
        if (v) doc.text(v, vx, ry + 7.3);
        else { doc.setDrawColor(140); doc.line(vx, ry + 7.6, cx + colW - 4, ry + 7.6); }
      }
    }
    doc.setTextColor(0);
    ctx.y = boxTop + rowH * rows.length + 5;

    // ---- Petunjuk ----
    ctx.line('Petunjuk: berilah tanda centang (V) pada kotak skor 1 / 2 / 3 / 4 sesuai penilaian Anda. ' +
      'Skor: 1 = Kurang, 2 = Cukup, 3 = Baik, 4 = Amat Baik. Setelah selesai, masukkan skor ke aplikasi PKKM.',
      { size: 8, color: [90, 90, 90], gap: 1.5 });

    // ---- Daftar indikator ----
    for (var ki = 0; ki < list.length; ki++) {
      var k = list[ki];
      var indK = 0;
      for (var ai0 = 0; ai0 < k.aspek.length; ai0++) indK += k.aspek[ai0].indikator.length;

      ctx.space(12);
      doc.setFillColor(226, 236, 245);
      doc.rect(ctx.ML, ctx.y - 4.6, ctx.CW, 7, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(10, 60, 30);
      doc.text(safeText(k.no + '. ' + k.label), ctx.ML + 2, ctx.y);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(60);
      doc.text('Jumlah indikator: ' + indK + '   |   Nilai Komponen: ____________', ctx.ML + ctx.CW - 2, ctx.y, { align: 'right' });
      doc.setTextColor(0);
      ctx.y += 8.5;

      for (var ai = 0; ai < k.aspek.length; ai++) {
        var a = k.aspek[ai];
        ctx.space(9);
        // Header sub-aspek
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9.4); doc.setTextColor(20, 80, 45);
        var hdr = safeText(a.kode + '  ' + (a.unsur || ''));
        var hdrLines = doc.splitTextToSize(hdr, ctx.CW - 30);
        for (var hl = 0; hl < hdrLines.length; hl++) {
          ctx.space(5);
          doc.setFont('helvetica', 'bold'); doc.setFontSize(9.4); doc.setTextColor(20, 80, 45);
          doc.text(hdrLines[hl], ctx.ML, ctx.y);
          if (hl === 0) {
            doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(110);
            doc.text('(' + a.indikator.length + ' indikator)', ctx.ML + ctx.CW, ctx.y, { align: 'right' });
          }
          ctx.y += 4.4;
        }
        doc.setTextColor(0);
        ctx.y += 1.2;

        for (var ii = 0; ii < a.indikator.length; ii++) {
          var ind = a.indikator[ii];
          var id = k.code + '_' + a.kode + '_' + ind.no;
          var r = (window.getIndikatorTampil ? window.getIndikatorTampil(ind, id, jenjang) : ind) || {};

          var numW = 9;
          var textMaxW = ctx.CW - numW - TEXT_RIGHT_GAP;
          doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
          var lines = doc.splitTextToSize(safeText(r.indikator || ''), textMaxW);
          var blockH = lines.length * (9 * 0.42 + 0.8);
          var boxH = 6.4;
          var needH = Math.max(blockH, boxH) + 3.2;
          ctx.space(needH);

          var startY = ctx.y;
          // Kotak skor sejajar baris pertama
          ctx.scoreBoxes([1, 2, 3, 4], startY - 4.4, { w: BOX_W, h: boxH, gapx: BOX_GAP });

          doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(70);
          doc.text(a.kode + '.' + ind.no, ctx.ML, startY);
          doc.setTextColor(0);
          for (var li = 0; li < lines.length; li++) {
            doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(0);
            doc.text(lines[li], ctx.ML + numW, startY + li * (9 * 0.42 + 0.8));
          }
          ctx.y = startY + Math.max(blockH, boxH) + 2.2;

          // Catatan kecil (opsional) — bantu pengawas ingat data yang digali
          if (opts.withNotes && (r.data || r.penggalian)) {
            var note = (r.data ? 'Data: ' + r.data + '  ' : '') + (r.penggalian ? 'Gali: ' + r.penggalian : '');
            ctx.line(note, { size: 7.4, indent: numW, color: [125, 125, 125], gap: 0.4, maxW: textMaxW });
          }
          ctx.divider(2.4);
        }
      }
    }

    // ---- Rekapitulasi ----
    var tW0 = ctx.CW;
    var rowH2 = 8;
    // Jaga judul + tabel tetap satu halaman (hindari judul menggantung di akhir halaman).
    ctx.space(6 + rowH2 * (list.length + 2) + 8);
    ctx.y += 2;
    ctx.line('REKAPITULASI NILAI (diisi setelah seluruh indikator dinilai / diinput ke aplikasi)',
      { size: 9.5, style: 'bold', gap: 2 });

    var bobot = (window.Meta && window.Meta.bobot) ? window.Meta.bobot() : {};
    var cols = [
      { label: 'Komponen', w: 0.46, align: 'left' },
      { label: 'Jml Indikator', w: 0.16, align: 'center' },
      { label: 'Bobot (%)', w: 0.14, align: 'center' },
      { label: 'Nilai (0-100)', w: 0.12, align: 'center' },
      { label: 'Nilai Tertimbang', w: 0.12, align: 'center' },
    ];
    var tW = ctx.CW;
    ctx.space(rowH2 * (list.length + 3));
    var tTop = ctx.y - 4.6;

    function colX(i, align, textWidth) {
      var x = ctx.ML;
      for (var c2 = 0; c2 < i; c2++) x += cols[c2].w * tW;
      var w = cols[i].w * tW;
      if (align === 'center') return x + w / 2;
      if (align === 'right') return x + w - 2;
      return x + 2;
    }

    doc.setDrawColor(190);
    doc.setFillColor(238, 243, 248);
    doc.rect(ctx.ML, tTop, tW, rowH2, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(20, 60, 40);
    for (var hci = 0; hci < cols.length; hci++) {
      doc.text(cols[hci].label, colX(hci, hci === 0 ? 'left' : 'center'), tTop + 5.3, { align: hci === 0 ? 'left' : 'center' });
    }
    doc.setTextColor(0);
    var ty = tTop + rowH2;
    for (var ri2 = 0; ri2 < list.length; ri2++) {
      var kk = list[ri2];
      var n2 = 0;
      for (var ax = 0; ax < kk.aspek.length; ax++) n2 += kk.aspek[ax].indikator.length;
      doc.setDrawColor(210);
      doc.rect(ctx.ML, ty, tW, rowH2);
      for (var cxi = 1; cxi < cols.length; cxi++) {
        var xLine = ctx.ML;
        for (var c3 = 0; c3 < cxi; c3++) xLine += cols[c3].w * tW;
        doc.line(xLine, ty, xLine, ty + rowH2);
      }
      var cy = ty + 5.3;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.4);
      doc.text(safeText(kk.no + '. ' + kk.label), ctx.ML + 2, cy);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.4);
      doc.text(String(n2), colX(1, 'center'), cy, { align: 'center' });
      doc.text(String(bobot[kk.code] != null ? bobot[kk.code] : (kk.bobot_default != null ? kk.bobot_default : 20)), colX(2, 'center'), cy, { align: 'center' });
      doc.setTextColor(150); doc.text('-', colX(3, 'center'), cy, { align: 'center' }); doc.setTextColor(0);
      doc.setTextColor(150); doc.text('-', colX(4, 'center'), cy, { align: 'center' }); doc.setTextColor(0);
      ty += rowH2;
    }
    // Baris total
    doc.setFillColor(245, 247, 250);
    doc.rect(ctx.ML, ty, tW, rowH2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.text('NILAI AKHIR (0-100)', colX(0, 'left'), ty + 5.3);
    ctx.y = ty + rowH2 + 2;
    ctx.line('Kategori: 90,01-100 Amat Baik  |  75,01-90 Baik  |  60,01-75 Cukup  |  50,01-60 Sedang  |  <=50 Kurang',
      { size: 7.6, color: [120, 120, 120], gap: 1 });

    // ---- Tanda tangan ----
    ctx.space(34);
    ctx.y += 2;
    var tempat = 'Jember';
    try { tempat = (window.Meta && window.Meta.get('lokasi_ttd', 'Jember')) || 'Jember'; } catch (e) { /* noop */ }
    var half = ctx.CW / 2;
    var sigTop = ctx.y;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(0);
    doc.text('Mengetahui,', ctx.ML + half + 4, sigTop);
    doc.text('Penilai,', ctx.ML + 4, sigTop);
    doc.text(tempat + ', ' + (identity.tanggal || '..........................'), ctx.ML + half + 4, sigTop + 5);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text('Kepala Madrasah', ctx.ML + half + 4, sigTop + 10);
    ctx.y = sigTop + 32;
    doc.setDrawColor(120);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    var namaPenilai = identity.penilai_nama || '';
    var namaKamad = identity.kamad_nama || '';
    doc.text(namaPenilai ? safeText(namaPenilai) : '(..................................................)', ctx.ML + 4, ctx.y, { maxWidth: half - 10 });
    doc.text(namaKamad ? safeText(namaKamad) : '(..................................................)', ctx.ML + half + 4, ctx.y, { maxWidth: half - 10 });
    ctx.y += 4.6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.4); doc.setTextColor(60);
    doc.text('NIP / NIY / NIK: ' + (identity.penilai_nip || '................................'), ctx.ML + 4, ctx.y, { maxWidth: half - 6 });
    doc.text('NIP / NIY / NIK: ' + (identity.kamad_nip || '................................'), ctx.ML + half + 4, ctx.y, { maxWidth: half - 6 });
    ctx.y += 5;
    doc.setTextColor(0);
  }

  // ==========================================================================
  // API publik
  // ==========================================================================
  function generate(jenjang, opts) {
    opts = opts || {};
    var role = opts.role || null;                 // 'pengawas' | 'gtk' | null
    var mode = opts.mode || 'instrumen';          // 'instrumen' | 'formulir'
    var list = getList(jenjang, role);
    if (!list.length) throw new Error('Data instrumen kosong untuk jenjang ' + jenjang + '.');

    var meta = getMeta();
    var isFormulir = mode === 'formulir';
    var headerLabel = (isFormulir ? 'Formulir Penilaian PKKM - Jenjang ' : 'Instrumen PKKM - Jenjang ') + jenjang +
      ' - Pokjawas Madrasah Kab. ' + meta.kab;

    var ctx = makeCtx(jenjang, headerLabel);
    var doc = ctx.doc;

    doc.setProperties({
      title: (isFormulir ? 'Formulir Penilaian PKKM - ' : 'Instrumen PKKM - ') + jenjang,
      subject: 'Instrumen Penilaian Kinerja Kepala Madrasah (PKKM)',
      author: 'Aplikasi PKKM - Pokjawas Madrasah Kab. ' + meta.kab,
      creator: 'Aplikasi PKKM',
    });

    var identity = Object.assign({}, opts.identity || {});
    if (!identity.penilai_nama && meta.pengawas && meta.pengawas.nama) identity.penilai_nama = meta.pengawas.nama;
    if (!identity.penilai_nip && meta.pengawas && meta.pengawas.nip) identity.penilai_nip = meta.pengawas.nip;
    if (!identity.penilai_jabatan) identity.penilai_jabatan = identity.role_label || (meta.pengawas && meta.pengawas.jabatan) || 'Pengawas Madrasah';
    if (!identity.penilai_unit) identity.penilai_unit = (meta.pengawas && meta.pengawas.unit) || ('Kemenag Kabupaten ' + meta.kab);
    if (!identity.tanggal) identity.tanggal = tanggalPanjang(new Date());

    if (isFormulir) buildFormulir(ctx, jenjang, role, identity, opts);
    else buildInstrumen(ctx, jenjang, role);

    ctx.drawFooter();
    return doc;
  }

  function fileName(jenjang, opts) {
    opts = opts || {};
    var tgl = new Date();
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    var stamp = tgl.getFullYear() + p(tgl.getMonth() + 1) + p(tgl.getDate());
    var base = opts.mode === 'formulir' ? 'Formulir-Penilaian-PKKM-' : 'Instrumen-PKKM-';
    var suffix = opts.role === 'gtk' ? '-GTK' : '';
    var rc = opts.identity && opts.identity.role_code ? '-' + opts.identity.role_code : '';
    return base + jenjang + suffix + rc + '-' + stamp + '.pdf';
  }

  function download(jenjang, opts) {
    opts = opts || {};
    var doc = generate(jenjang, opts);
    doc.save(opts.filename || fileName(jenjang, opts));
    return doc;
  }

  window.InstrumenPDF = {
    generate: generate,
    download: download,
    countsFor: countsFor,
    fileName: fileName,
    roleLabel: roleLabel,
    JENJANG_LABEL: JENJANG_LABEL,
  };
})();
