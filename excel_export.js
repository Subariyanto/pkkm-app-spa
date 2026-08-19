// excel_export.js - Export hasil PKKM ke format Excel resmi
// Sheet yang diproduksi:
//  1. INPUT_DATA       (identitas kamad + 5 penilai)
//  2. DKN_PKKM         (daftar kumulatif nilai - per indikator + agregat)
//  3. HASIL_KM_KB_KS   (form pernyataan komite I & II)
//  4. HASIL_GTK        (form pernyataan guru/tendik I & II)
//  5. REKAP_TAHUNAN    (rekap nilai 4 tahun + sebutan)
//  6. PROSES_PKB       (proses penetapan PKB - per tahun)
//  7. PRIORITAS_PKB    (5 prioritas PKB tahunan)
//
// Penggunaan: window.exportPKKMExcel(kamad_id) -> generate XLSX, download via FileSaver

(function () {
  'use strict';

  const STYLE_HEADER = {
    font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047A3A' } },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
  };
  const STYLE_TITLE = {
    font: { bold: true, size: 14 },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
  };
  const STYLE_SUB = {
    font: { bold: true, size: 12, italic: true },
    alignment: { horizontal: 'center', vertical: 'middle' },
  };
  const STYLE_TOTAL = {
    font: { bold: true },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } },
    border: { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } },
  };
  const BORDER_ALL = {
    top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' },
  };

  function setBorderRange(ws, fromCol, fromRow, toCol, toRow) {
    for (let r = fromRow; r <= toRow; r++) {
      for (let c = fromCol; c <= toCol; c++) {
        ws.getCell(r, c).border = BORDER_ALL;
      }
    }
  }

  // ===== Sheet builders =====

  function buildSheetInputData(wb, kamad, periodeAggregator) {
    const ws = wb.addWorksheet('INPUT DATA', { views: [{ showGridLines: false }] });
    ws.columns = [
      { width: 5 }, { width: 22 }, { width: 32 }, { width: 5 }, { width: 22 }, { width: 32 },
    ];
    ws.mergeCells('B2:F2');
    ws.getCell('B2').value = 'INPUT DATA PKKM';
    ws.getCell('B2').style = STYLE_TITLE;

    // Identitas Madrasah
    ws.getCell('B4').value = 'IDENTITAS MADRASAH';
    ws.getCell('B4').font = { bold: true };
    const madrasah = [
      ['Nama Madrasah', kamad.nama_madrasah || '-'],
      ['Jenjang', kamad.jenjang || '-'],
      ['NSM', kamad.nsm || '-'],
      ['Alamat', kamad.alamat || '-'],
      ['KKMA / Wilayah Binaan', kamad.kkma || '-'],
    ];
    let row = 5;
    madrasah.forEach(([label, val]) => {
      ws.getCell(`B${row}`).value = label;
      ws.getCell(`C${row}`).value = ': ' + val;
      row++;
    });

    // Identitas Kamad
    ws.getCell('E4').value = 'IDENTITAS KEPALA MADRASAH';
    ws.getCell('E4').font = { bold: true };
    const idKamad = [
      ['Nama', kamad.nama || '-'],
      ['NIP', kamad.nip || '-'],
      ['Pangkat/Gol', kamad.pangkat || '-'],
      ['Jabatan', 'Kepala Madrasah'],
      ['Tahun mulai jabatan', kamad.tahun_mulai || '-'],
    ];
    let r2 = 5;
    idKamad.forEach(([label, val]) => {
      ws.getCell(`E${r2}`).value = label;
      ws.getCell(`F${r2}`).value = ': ' + val;
      r2++;
    });

    // Identitas Penilai
    ws.mergeCells('B12:F12');
    ws.getCell('B12').value = 'IDENTITAS PENILAI';
    ws.getCell('B12').style = STYLE_HEADER;

    const ROLES = window.PKKM_ROLES || [];
    const tahunan = periodeAggregator || {};
    const sessionsByRole = tahunan.sessionsByRole || {};

    let rPenilai = 13;
    for (const role of ROLES) {
      const session = sessionsByRole[role.code];
      ws.getCell(`B${rPenilai}`).value = role.label;
      ws.getCell(`B${rPenilai}`).font = { italic: true };
      ws.mergeCells(`B${rPenilai}:F${rPenilai}`);
      ws.getCell(`B${rPenilai}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
      rPenilai++;
      const idData = [
        ['Nama', session?.penilai_nama || '-'],
        ['NIP/ID', session?.penilai_nip || '-'],
        ['Jabatan', session?.penilai_jabatan || '-'],
        ['Unit Kerja', session?.penilai_unit || '-'],
      ];
      idData.forEach(([k, v]) => {
        ws.getCell(`B${rPenilai}`).value = k;
        ws.getCell(`C${rPenilai}`).value = ': ' + v;
        rPenilai++;
      });
      rPenilai++;
    }
  }

  function buildSheetDKN(wb, kamad, dataPerTahun) {
    const ws = wb.addWorksheet('DKN PKKM', { views: [{ showGridLines: false, state: 'frozen', xSplit: 4, ySplit: 4 }] });
    ws.columns = [
      { width: 5 },           // A
      { width: 8 },           // B (no)
      { width: 12 },          // C (kode)
      { width: 50 },          // D (sub-aspek)
      { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, // E F G H per tahun
      { width: 12 },          // I rata-rata
      { width: 12 },          // J sebutan
    ];
    ws.mergeCells('B2:J2');
    ws.getCell('B2').value = 'DAFTAR KUMULATIF NILAI PKKM';
    ws.getCell('B2').style = STYLE_TITLE;
    ws.mergeCells('B3:J3');
    ws.getCell('B3').value = `${kamad.nama || '-'} \u00b7 ${kamad.nama_madrasah || '-'}`;
    ws.getCell('B3').style = { font: { italic: true }, alignment: { horizontal: 'center' } };

    // Header tabel
    const headers = ['No', 'Kode', 'Sub-Aspek', 'Th 1', 'Th 2', 'Th 3', 'Th 4', 'Rata2', 'Sebutan'];
    headers.forEach((h, i) => {
      const cell = ws.getCell(5, 2 + i);
      cell.value = h;
      cell.style = STYLE_HEADER;
    });

    let r = 6;
    let no = 1;
    const KOMP = window.PKKM_KOMPONEN_META || window.PKKM_KOMPONEN || [];
    const PKKM_BASE = window.PKKM_INSTRUMEN_PENGAWAS || window.PKKM_KOMPONEN || [];

    for (const k of PKKM_BASE) {
      // Header komponen
      ws.mergeCells(`B${r}:J${r}`);
      ws.getCell(`B${r}`).value = `${k.no}. ${k.label}`;
      ws.getCell(`B${r}`).style = {
        font: { bold: true, color: { argb: 'FF047A3A' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } },
      };
      r++;
      for (const a of k.aspek) {
        ws.getCell(r, 2).value = no;
        ws.getCell(r, 3).value = a.kode;
        ws.getCell(r, 4).value = a.unsur;

        // Per tahun
        const vals = [1, 2, 3, 4].map(t => {
          const data = dataPerTahun[`tahun_${t}`];
          if (!data) return null;
          // average across all sessions for that tahun
          const sessVals = data.sessions.map(s => window.hitungNilaiAspek(s.id, k.code, a.kode));
          const filled = sessVals.filter(v => v.terisi > 0);
          if (!filled.length) return null;
          return filled.reduce((acc, v) => acc + v.nilai, 0) / filled.length;
        });
        for (let i = 0; i < 4; i++) {
          ws.getCell(r, 5 + i).value = vals[i] != null ? Number(vals[i].toFixed(2)) : null;
          ws.getCell(r, 5 + i).alignment = { horizontal: 'center' };
        }
        const filled = vals.filter(v => v != null);
        const rata = filled.length ? filled.reduce((a, b) => a + b, 0) / filled.length : null;
        ws.getCell(r, 9).value = rata != null ? Number(rata.toFixed(2)) : null;
        ws.getCell(r, 9).alignment = { horizontal: 'center' };
        ws.getCell(r, 9).font = { bold: true };
        const sebutan = rata != null ? window.getPKKMSebutan(rata) : null;
        ws.getCell(r, 10).value = sebutan ? sebutan.label : '-';
        ws.getCell(r, 10).alignment = { horizontal: 'center' };

        no++;
        r++;
      }
      // Sub-total komponen
      ws.getCell(r, 2).value = '';
      ws.getCell(r, 3).value = `Nilai ${k.code}`;
      ws.getCell(r, 3).font = { bold: true };
      ws.getCell(r, 4).value = `Komponen: ${k.label}`;
      ws.getCell(r, 4).font = { bold: true };
      const compVals = [1, 2, 3, 4].map(t => {
        const data = dataPerTahun[`tahun_${t}`];
        if (!data) return null;
        const sv = data.sessions.map(s => window.hitungNilaiKomponen(s.id, k.code).nilai);
        return sv.length ? sv.reduce((a, b) => a + b, 0) / sv.length : null;
      });
      for (let i = 0; i < 4; i++) {
        ws.getCell(r, 5 + i).value = compVals[i] != null ? Number(compVals[i].toFixed(2)) : null;
        ws.getCell(r, 5 + i).style = STYLE_TOTAL;
      }
      const compRata = compVals.filter(v => v != null).length
        ? compVals.filter(v => v != null).reduce((a, b) => a + b, 0) / compVals.filter(v => v != null).length
        : null;
      ws.getCell(r, 9).value = compRata != null ? Number(compRata.toFixed(2)) : null;
      ws.getCell(r, 9).style = STYLE_TOTAL;
      const compSeb = compRata != null ? window.getPKKMSebutan(compRata) : null;
      ws.getCell(r, 10).value = compSeb ? compSeb.label : '-';
      ws.getCell(r, 10).style = STYLE_TOTAL;
      r++;
    }

    setBorderRange(ws, 2, 5, 10, r - 1);
  }

  function buildSheetHasil(wb, kamad, dataPerTahun, group, tahunCode) {
    // group: 'km_kb_ks' | 'gtk' | 'pengawas'
    const titleMap = {
      km_kb_ks: 'HASIL KM KB KS',
      gtk: 'HASIL GTK',
      pengawas: 'HASIL PENGAWAS',
    };
    const labelMap = {
      km_kb_ks: 'Komite/Kasi-Yayasan/Kabid',
      gtk: 'Guru/Tendik',
      pengawas: 'Pengawas Madrasah',
    };
    // Build code list dynamically dari PKKM_ROLES sesuai group
    const codeMap = {
      pengawas: ['pengawas_1', 'pengawas_2'],
      gtk: ['guru_1', 'guru_2', 'tendik_1', 'tendik_2'],
      km_kb_ks: ['komite_1', 'komite_2', 'kasi_yayasan', 'kabid'],
    };
    const ROLES_DICT = {};
    for (const r of (window.PKKM_ROLES || [])) ROLES_DICT[r.code] = r;
    const tahunLabel = window.PKKM_PERIODE_TYPES.find(x => x.code === tahunCode)?.label || tahunCode;
    const data = dataPerTahun[tahunCode];
    if (!data) return;
    const ws = wb.addWorksheet(titleMap[group], { views: [{ showGridLines: false }] });
    ws.columns = [
      { width: 5 }, { width: 6 }, { width: 30 }, { width: 30 }, { width: 30 }, { width: 12 },
    ];
    let r = 2;

    for (const roleCode of codeMap[group]) {
      const session = data.sessionsByRole?.[roleCode];
      if (!session) continue;
      const roleInfo = ROLES_DICT[roleCode];
      const rolelabel = roleInfo?.label || roleCode;
      ws.mergeCells(`B${r}:F${r}`);
      ws.getCell(`B${r}`).value = `HASIL PKKM ${tahunLabel.toUpperCase()} - PENILAI ${rolelabel.toUpperCase()}`;
      ws.getCell(`B${r}`).style = STYLE_TITLE;
      r += 2;
      ws.getCell(`B${r}`).value = 'Yang bertanda tangan di bawah ini:';
      r++;
      ws.getCell(`B${r}`).value = 'Identitas Penilai';
      ws.getCell(`B${r}`).font = { bold: true };
      r++;
      [
        ['Nama', session.penilai_nama || '-'],
        ['Jabatan', session.penilai_jabatan || '-'],
        ['Unit Kerja', session.penilai_unit || '-'],
      ].forEach(([k, v]) => {
        ws.getCell(`B${r}`).value = k;
        ws.getCell(`C${r}`).value = ': ' + v;
        r++;
      });
      r++;
      ws.getCell(`B${r}`).value = 'Menyatakan bahwa:';
      r++;
      ws.getCell(`B${r}`).value = 'Identitas Kepala Madrasah';
      ws.getCell(`B${r}`).font = { bold: true };
      r++;
      [
        ['Nama', kamad.nama || '-'],
        ['NIP', kamad.nip || '-'],
        ['Pangkat/Gol', kamad.pangkat || '-'],
        ['Jabatan', 'Kepala Madrasah'],
        ['Unit Kerja', kamad.nama_madrasah || '-'],
      ].forEach(([k, v]) => {
        ws.getCell(`B${r}`).value = k;
        ws.getCell(`C${r}`).value = ': ' + v;
        r++;
      });
      r++;
      ws.mergeCells(`B${r}:F${r}`);
      ws.getCell(`B${r}`).value = `Telah dilakukan Penilaian Kinerja ${tahunLabel} dengan hasil sebagai berikut:`;
      r += 2;
      // Tabel komponen
      const headers = ['No', 'Tugas Utama', '', '', '', 'Skor'];
      ws.getRow(r).values = ['', ...headers];
      ws.mergeCells(`C${r}:E${r}`);
      ws.getRow(r).eachCell(c => { c.style = STYLE_HEADER; });
      r++;
      const KOMP = window.PKKM_KOMPONEN_META || [];
      KOMP.forEach((k, i) => {
        ws.getCell(`B${r}`).value = i + 1 + '.';
        ws.mergeCells(`C${r}:E${r}`);
        ws.getCell(`C${r}`).value = k.label;
        const v = window.hitungNilaiKomponen(session.id, k.code).nilai;
        ws.getCell(`F${r}`).value = Number(v.toFixed(2));
        ws.getCell(`F${r}`).alignment = { horizontal: 'center' };
        r++;
      });
      // Jumlah
      ws.mergeCells(`B${r}:E${r}`);
      ws.getCell(`B${r}`).value = 'Rata-rata Nilai Komponen';
      const akhir = window.hitungNilaiAkhir(session.id);
      ws.getCell(`F${r}`).value = Number(akhir.nilaiAkhir.toFixed(2));
      [`B${r}`, `F${r}`].forEach(addr => { ws.getCell(addr).style = STYLE_TOTAL; });
      r += 2;
      // Sebutan
      const seb = window.getPKKMSebutan(akhir.nilaiAkhir);
      ws.getCell(`B${r}`).value = `Sebutan: ${seb ? seb.label : '-'}`;
      ws.getCell(`B${r}`).font = { bold: true, italic: true };
      r += 3;
      // Tanda tangan
      ws.getCell(`F${r}`).value = `${window.Meta.get('lokasi_ttd', 'Jember') || ''}, ${session.tanggal || ''}`;
      r++;
      ws.getCell(`F${r}`).value = 'Penilai,';
      r += 4;
      ws.getCell(`F${r}`).value = session.penilai_nama || '-';
      ws.getCell(`F${r}`).font = { bold: true, underline: true };
      r++;
      ws.getCell(`F${r}`).value = `NIP. ${session.penilai_nip || ''}`;
      r += 3;
    }
  }

  function buildSheetRekapTahunan(wb, kamad, dataPerTahun) {
    const ws = wb.addWorksheet('REKAP TAHUNAN', { views: [{ showGridLines: false }] });
    ws.columns = [
      { width: 5 }, { width: 6 }, { width: 32 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 18 },
    ];
    ws.mergeCells('B2:I2');
    ws.getCell('B2').value = `REKAP NILAI PKKM 4 TAHUN - ${kamad.nama || '-'}`;
    ws.getCell('B2').style = STYLE_TITLE;
    ws.mergeCells('B3:I3');
    ws.getCell('B3').value = kamad.nama_madrasah || '-';
    ws.getCell('B3').style = { font: { italic: true }, alignment: { horizontal: 'center' } };

    const headers = ['No', 'Komponen', 'Th 1', 'Th 2', 'Th 3', 'Th 4', 'Rata2', 'Sebutan'];
    headers.forEach((h, i) => {
      const cell = ws.getCell(5, 2 + i);
      cell.value = h;
      cell.style = STYLE_HEADER;
    });

    const KOMP = window.PKKM_KOMPONEN_META || [];
    let r = 6;
    KOMP.forEach((k, idx) => {
      ws.getCell(r, 2).value = idx + 1;
      ws.getCell(r, 3).value = k.label;
      const vals = [1, 2, 3, 4].map(t => {
        const d = dataPerTahun[`tahun_${t}`];
        if (!d) return null;
        const sv = d.sessions.map(s => window.hitungNilaiKomponen(s.id, k.code).nilai);
        return sv.length ? sv.reduce((a, b) => a + b, 0) / sv.length : null;
      });
      for (let i = 0; i < 4; i++) {
        ws.getCell(r, 4 + i).value = vals[i] != null ? Number(vals[i].toFixed(2)) : null;
        ws.getCell(r, 4 + i).alignment = { horizontal: 'center' };
      }
      const filled = vals.filter(v => v != null);
      const rata = filled.length ? filled.reduce((a, b) => a + b, 0) / filled.length : null;
      ws.getCell(r, 8).value = rata != null ? Number(rata.toFixed(2)) : null;
      ws.getCell(r, 8).alignment = { horizontal: 'center' };
      ws.getCell(r, 8).font = { bold: true };
      const seb = rata != null ? window.getPKKMSebutan(rata) : null;
      ws.getCell(r, 9).value = seb ? seb.label : '-';
      ws.getCell(r, 9).alignment = { horizontal: 'center' };
      r++;
    });

    // Total
    ws.mergeCells(`B${r}:C${r}`);
    ws.getCell(`B${r}`).value = 'NILAI AKHIR PKKM (Rata-rata 4 Tahun)';
    const tahunVals = [1, 2, 3, 4].map(t => {
      const d = dataPerTahun[`tahun_${t}`];
      if (!d) return null;
      if (d.sessions.length > 1) return window.hitungNilaiAgregat(kamad.id, d.periode_id).nilaiAgregat;
      return window.hitungNilaiAkhir(d.sessions[0].id).nilaiAkhir;
    });
    for (let i = 0; i < 4; i++) {
      ws.getCell(r, 4 + i).value = tahunVals[i] != null ? Number(tahunVals[i].toFixed(2)) : null;
      ws.getCell(r, 4 + i).style = STYLE_TOTAL;
    }
    const filled = tahunVals.filter(v => v != null);
    const finalRata = filled.length ? filled.reduce((a, b) => a + b, 0) / filled.length : null;
    ws.getCell(r, 8).value = finalRata != null ? Number(finalRata.toFixed(2)) : null;
    ws.getCell(r, 8).style = STYLE_TOTAL;
    const finalSeb = finalRata != null ? window.getPKKMSebutan(finalRata) : null;
    ws.getCell(r, 9).value = finalSeb ? finalSeb.label : '-';
    ws.getCell(r, 9).style = STYLE_TOTAL;
    [`B${r}`, `C${r}`].forEach(a => { ws.getCell(a).style = STYLE_TOTAL; });
    setBorderRange(ws, 2, 5, 9, r);
  }

  function buildSheetPKB(wb, kamad, dataPerTahun) {
    const ws = wb.addWorksheet('PROSES PKB', { views: [{ showGridLines: false }] });
    ws.columns = [
      { width: 5 }, { width: 6 }, { width: 36 }, { width: 12 }, { width: 22 }, { width: 22 }, { width: 30 }, { width: 30 },
    ];

    ['tahun_1', 'tahun_2', 'tahun_3', 'tahun_4'].forEach((tcode, ti) => {
      const tlabel = window.PKKM_PERIODE_TYPES.find(x => x.code === tcode)?.label || tcode;
      const startRow = 2 + ti * 12;
      ws.mergeCells(`B${startRow}:H${startRow}`);
      ws.getCell(`B${startRow}`).value = `PROSES PENETAPAN PKB - ${tlabel.toUpperCase()}`;
      ws.getCell(`B${startRow}`).style = STYLE_TITLE;

      const headers = ['No', 'Sub-Aspek (Indikator Kompetensi)', 'Nilai', 'Unsur PKB', 'Jenis PKB', 'Kegiatan PKB', 'Catatan'];
      headers.forEach((h, i) => {
        const c = ws.getCell(startRow + 1, 2 + i);
        c.value = h;
        c.style = STYLE_HEADER;
      });

      const data = dataPerTahun[tcode];
      if (!data) {
        ws.mergeCells(`B${startRow + 2}:H${startRow + 2}`);
        ws.getCell(`B${startRow + 2}`).value = '— belum ada data —';
        ws.getCell(`B${startRow + 2}`).font = { italic: true, color: { argb: 'FF999999' } };
        return;
      }
      // PKB list utk periode tahun_X
      const pkbItems = window.PKB.forKamadPeriode(kamad.id, data.periode_id);
      pkbItems.slice(0, 5).forEach((p, i) => {
        const rr = startRow + 2 + i;
        ws.getCell(rr, 2).value = p.prioritas;
        ws.getCell(rr, 3).value = `${p.sub_aspek_kode} \u00b7 ${p.sub_aspek_unsur || '-'}`;
        ws.getCell(rr, 4).value = p.nilai != null ? Number(p.nilai.toFixed(2)) : '-';
        ws.getCell(rr, 4).alignment = { horizontal: 'center' };
        ws.getCell(rr, 5).value = p.unsur_pkb || '-';
        ws.getCell(rr, 6).value = p.jenis_pkb || '-';
        ws.getCell(rr, 7).value = p.kegiatan_pkb || '-';
        ws.getCell(rr, 8).value = p.catatan || '-';
      });
      setBorderRange(ws, 2, startRow + 1, 8, startRow + 2 + Math.max(pkbItems.length, 1) - 1);
    });
  }

  function buildSheetPrioritas(wb, kamad, dataPerTahun) {
    const ws = wb.addWorksheet('PRIORITAS PKB', { views: [{ showGridLines: false }] });
    ws.columns = [
      { width: 5 }, { width: 6 }, { width: 40 }, { width: 22 }, { width: 22 }, { width: 32 },
    ];

    let r = 2;
    ['tahun_1', 'tahun_2', 'tahun_3', 'tahun_4'].forEach(tcode => {
      const tlabel = window.PKKM_PERIODE_TYPES.find(x => x.code === tcode)?.label || tcode;
      const data = dataPerTahun[tcode];
      ws.mergeCells(`B${r}:F${r}`);
      ws.getCell(`B${r}`).value = `PRIORITAS PKB KEPALA MADRASAH (${tlabel.toUpperCase()})`;
      ws.getCell(`B${r}`).style = STYLE_TITLE;
      r++;
      ws.mergeCells(`B${r}:F${r}`);
      ws.getCell(`B${r}`).value = `${kamad.nama || '-'} \u00b7 ${kamad.nama_madrasah || '-'}`;
      ws.getCell(`B${r}`).style = STYLE_SUB;
      r++;

      const headers = ['No', 'Indikator Kompetensi', 'Unsur PKB', 'Jenis PKB', 'Kegiatan PKB'];
      headers.forEach((h, i) => {
        const c = ws.getCell(r, 2 + i);
        c.value = h;
        c.style = STYLE_HEADER;
      });
      r++;

      if (!data) {
        ws.mergeCells(`B${r}:F${r}`);
        ws.getCell(`B${r}`).value = '— belum ada data —';
        ws.getCell(`B${r}`).font = { italic: true, color: { argb: 'FF999999' } };
        r += 2;
        return;
      }
      const pkbItems = window.PKB.forKamadPeriode(kamad.id, data.periode_id);
      pkbItems.slice(0, 5).forEach(p => {
        ws.getCell(r, 2).value = p.prioritas;
        ws.getCell(r, 3).value = `${p.sub_aspek_kode} \u00b7 ${p.sub_aspek_unsur || '-'}`;
        ws.getCell(r, 4).value = p.unsur_pkb || '-';
        ws.getCell(r, 5).value = p.jenis_pkb || '-';
        ws.getCell(r, 6).value = p.kegiatan_pkb || '-';
        r++;
      });
      r += 2;
    });
  }

  // ===== Aggregator =====

  function aggregateDataPerTahun(kamad_id) {
    const allP = window.Periode.list();
    const out = {};
    ['tahun_1', 'tahun_2', 'tahun_3', 'tahun_4'].forEach(tcode => {
      const periodes = allP.filter(p => p.type === tcode);
      for (const p of periodes) {
        const sessions = window.Penilaian.forKamadPeriode(kamad_id, p.id);
        if (!sessions.length) continue;
        const sessionsByRole = {};
        for (const s of sessions) sessionsByRole[s.role || 'pengawas_1'] = s;
        out[tcode] = {
          periode_id: p.id,
          periode_label: p.label,
          tahun_kode: tcode,
          sessions,
          sessionsByRole,
        };
        break; // ambil periode pertama yg punya data
      }
    });
    return out;
  }

  // ===== Public entry =====

  async function exportPKKMExcel(kamad_id) {
    if (window.LIC && window.LIC.getStatus){var s=window.LIC.getStatus();if(s&&s.isTrial){alert('Export Excel hanya tersedia untuk akun FULL. Cetak Preview (Ctrl+P) tetap bisa dengan watermark TRIAL.');return;}}
    if (typeof ExcelJS === 'undefined') {
      window.toast?.('ExcelJS belum siap, coba lagi.', 'error');
      return;
    }
    const kamad = window.Kamad.get(kamad_id);
    if (!kamad) { window.toast?.('Kamad tidak ditemukan.', 'error'); return; }
    const dataPerTahun = aggregateDataPerTahun(kamad_id);
    if (!Object.keys(dataPerTahun).length) {
      window.toast?.('Belum ada data penilaian untuk kamad ini.', 'error');
      return;
    }

    const wb = new ExcelJS.Workbook();
    wb.creator = 'PKKM SPA';
    wb.created = new Date();

    // Pakai data tahun terbaru sebagai aggregator INPUT
    const lastTahun = Object.keys(dataPerTahun).sort().pop();
    const lastData = dataPerTahun[lastTahun];

    buildSheetInputData(wb, kamad, lastData);
    buildSheetDKN(wb, kamad, dataPerTahun);
    buildSheetRekapTahunan(wb, kamad, dataPerTahun);

    // HASIL per group untuk tahun terakhir
    if (lastData) {
      buildSheetHasil(wb, kamad, dataPerTahun, 'pengawas', lastTahun);
      buildSheetHasil(wb, kamad, dataPerTahun, 'gtk', lastTahun);
      buildSheetHasil(wb, kamad, dataPerTahun, 'km_kb_ks', lastTahun);
    }

    buildSheetPKB(wb, kamad, dataPerTahun);
    buildSheetPrioritas(wb, kamad, dataPerTahun);

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const filename = `PKKM_${(kamad.nama || 'kamad').replace(/[^\w]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    if (window.saveAs) {
      window.saveAs(blob, filename);
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    window.toast?.('Export Excel berhasil.');
  }

  window.exportPKKMExcel = exportPKKMExcel;
})();
