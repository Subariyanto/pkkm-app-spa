// tools.js - PKKM helpers: import xlsm batch kamad, integrasi PKG, template export
// Loaded after db.js, used by app.js routes.

(function(){

  // ===== Template kamad (Excel) =====
  async function downloadTemplateKamad() {
    if (typeof ExcelJS === 'undefined') { alert('ExcelJS belum siap.'); return; }
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Kepala Madrasah');
    const headers = ['nama','nip','jabatan','jenjang','kkma','nsm','nama_madrasah','alamat','masa_jabatan_mulai','telp','email'];
    const headerLabels = ['Nama Lengkap (dengan gelar)','NIP','Jabatan','Jenjang (MI/MTs/MA/RA)','KKMA / Wilayah','NSM','Nama Madrasah','Alamat','Masa Jabatan Mulai (YYYY-MM-DD)','Telp/HP','Email'];

    ws.addRow(['Template Import Kepala Madrasah - PKKM App']).font = { bold: true, size: 14 };
    ws.addRow(['Petunjuk: Jangan ubah baris header (baris 4). Mulai isi data dari baris 5.']);
    ws.addRow([]);
    const headerRow = ws.addRow(headerLabels);
    headerRow.eachCell(c => {
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047A3A' } };
      c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });

    // Contoh row
    ws.addRow([
      'SUBARIYANTO, S.Pd, M.Pd.I',
      '197002122005011004',
      'Kepala Madrasah',
      'MA',
      'KKMA 04 Sukowono',
      '131135090001',
      'MA Contoh Sukowono',
      'Jl. Contoh No. 1, Sukowono, Jember',
      '2023-01-01',
      '081234567890',
      'kamad@example.sch.id',
    ]);

    // Worksheet kedua: mapping kolom (untuk dokumentasi import)
    const ws2 = wb.addWorksheet('_meta');
    ws2.addRow(['Kolom internal','Header tampil']).font = { bold: true };
    headers.forEach((k, i) => ws2.addRow([k, headerLabels[i]]));

    ws.columns.forEach((c, i) => { c.width = i < 2 ? 30 : 20; });
    ws.getRow(4).height = 30;

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'Template_Import_Kamad_PKKM.xlsx';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function parseImportKamad(file) {
    if (typeof ExcelJS === 'undefined') throw new Error('ExcelJS belum siap.');
    const wb = new ExcelJS.Workbook();
    const arr = await file.arrayBuffer();
    await wb.xlsx.load(arr);
    const ws = wb.worksheets[0];
    if (!ws) throw new Error('Sheet pertama tidak ditemukan.');

    // Cari header row: deteksi baris yang mengandung "Nama" dan "NIP"
    let headerRowNum = 4; // default sesuai template
    let detected = null;
    for (let r = 1; r <= Math.min(ws.rowCount, 10); r++) {
      const cells = ws.getRow(r).values || [];
      const joined = cells.join('|').toLowerCase();
      if (joined.includes('nama') && joined.includes('nip') && joined.includes('madrasah')) {
        headerRowNum = r;
        detected = cells;
        break;
      }
    }
    if (!detected) {
      // Coba pakai baris ke-4
      detected = ws.getRow(4).values || [];
    }

    // Mapping kolom -> field internal
    const FIELD_MAP = {
      'nama': 'nama',
      'nama lengkap': 'nama',
      'nip': 'nip',
      'jabatan': 'jabatan',
      'jenjang': 'jenjang',
      'kkma': 'kkma',
      'wilayah': 'kkma',
      'wilayah binaan': 'kkma',
      'nsm': 'nsm',
      'nama madrasah': 'nama_madrasah',
      'madrasah': 'nama_madrasah',
      'alamat': 'alamat',
      'masa jabatan': 'masa_jabatan_mulai',
      'masa jabatan mulai': 'masa_jabatan_mulai',
      'telp': 'telp',
      'hp': 'telp',
      'telepon': 'telp',
      'email': 'email',
    };

    const colMap = {}; // colIdx -> field
    detected.forEach((label, idx) => {
      if (!label) return;
      const norm = String(label).toLowerCase().trim();
      // Direct match
      if (FIELD_MAP[norm]) { colMap[idx] = FIELD_MAP[norm]; return; }
      // Strip parenthetical
      const stripped = norm.replace(/\(.*?\)/g, '').trim();
      if (FIELD_MAP[stripped]) { colMap[idx] = FIELD_MAP[stripped]; return; }
      // Fuzzy: cari yang dimulai sama
      for (const key of Object.keys(FIELD_MAP)) {
        if (stripped.startsWith(key) || stripped.includes(key)) { colMap[idx] = FIELD_MAP[key]; break; }
      }
    });

    if (!Object.values(colMap).includes('nama') || !Object.values(colMap).includes('nama_madrasah')) {
      throw new Error('Header tidak dikenali. Pastikan ada kolom "Nama" dan "Nama Madrasah" (gunakan template).');
    }

    const rows = [];
    for (let r = headerRowNum + 1; r <= ws.rowCount; r++) {
      const cells = ws.getRow(r).values || [];
      const obj = {};
      let hasData = false;
      for (const [idxStr, field] of Object.entries(colMap)) {
        const idx = Number(idxStr);
        let v = cells[idx];
        if (v && typeof v === 'object' && v.text) v = v.text; // hyperlink/rich text
        if (v && v instanceof Date) v = v.toISOString().slice(0,10);
        if (v != null && String(v).trim() !== '') {
          obj[field] = String(v).trim();
          hasData = true;
        }
      }
      if (hasData && obj.nama) rows.push(obj);
    }
    return rows;
  }

  function applyImportKamad(rows, opts={}) {
    const result = { created: 0, updated: 0, skipped: 0, errors: [] };
    const validJenjang = (window.PKKM_JENJANG || ['MI','MTs','MA','RA']);
    const existing = window.Kamad.list();
    for (const r of rows) {
      try {
        if (!r.nama || !r.nama_madrasah) { result.skipped++; continue; }
        // Normalize jenjang
        if (r.jenjang) {
          const j = r.jenjang.toUpperCase().replace(/[^A-Z]/g, '');
          if (validJenjang.map(x=>x.toUpperCase()).includes(j)) {
            r.jenjang = validJenjang.find(x => x.toUpperCase() === j);
          } else if (j.startsWith('MI')) r.jenjang = 'MI';
          else if (j.startsWith('MTS') || j.startsWith('MT')) r.jenjang = 'MTs';
          else if (j.startsWith('MA')) r.jenjang = 'MA';
          else if (j.startsWith('RA')) r.jenjang = 'RA';
          else r.jenjang = 'MA';
        } else { r.jenjang = 'MA'; }

        // Match by NIP atau (nama+nama_madrasah)
        let match = null;
        if (r.nip) match = existing.find(k => (k.nip||'').replace(/\D/g,'') === String(r.nip).replace(/\D/g,'') && r.nip);
        if (!match) match = existing.find(k => (k.nama||'').toLowerCase() === r.nama.toLowerCase() && (k.nama_madrasah||'').toLowerCase() === (r.nama_madrasah||'').toLowerCase());

        if (match) {
          if (opts.mode === 'update' || opts.mode === 'replace') {
            window.Kamad.update(match.id, r);
            result.updated++;
          } else {
            result.skipped++;
          }
        } else {
          window.Kamad.create(r);
          result.created++;
        }
      } catch (e) {
        result.errors.push({ row: r, message: e.message });
      }
    }
    return result;
  }

  // ===== Integrasi rata-rata PKG =====
  // Sumber: localStorage key `pkg_v1_*` (kalau user menggunakan PKG App SPA di domain yang sama).
  // Karena PKKM dan PKG di-deploy di subariyanto.github.io domain yang sama tapi di path berbeda,
  // localStorage tidak otomatis ter-share. Solusi: import file backup PKG (JSON) lalu hitung rata-rata.

  async function importPkgBackupJson(file) {
    const text = await file.text();
    const json = JSON.parse(text);
    if (!json || !json.schema || !json.schema.startsWith('pkg_v1')) {
      // tetap proses, mungkin format lain
    }
    return json;
  }

  function ringkasanPkgPerMadrasah(pkgPayload) {
    // Cari list guru + penilaian + skor di payload PKG
    const data = pkgPayload?.data || pkgPayload || {};
    const guru = data.guru || [];
    const penilaian = data.penilaian || [];
    const skor = data.skor || [];
    if (!guru.length) return [];

    // Kelompokkan guru per madrasah (heuristik dari field nama_madrasah / unit_kerja)
    const groups = {};
    for (const g of guru) {
      const key = (g.nama_madrasah || g.unit_kerja || g.madrasah || g.satuan || '-').trim() || '-';
      if (!groups[key]) groups[key] = { madrasah: key, guru: [] };
      groups[key].guru.push(g);
    }

    // Untuk tiap guru, hitung nilai akhir penilaian terakhir (kalau ada)
    function nilaiGuru(g) {
      const penList = penilaian.filter(p => p.guru_id === g.id);
      if (!penList.length) return null;
      // ambil yang paling baru
      const target = penList.sort((a,b) => (b.tanggal||'').localeCompare(a.tanggal||''))[0];
      const sk = skor.filter(s => s.penilaian_id === target.id);
      if (!sk.length) return null;
      // PKG umumnya skor 0-2 atau 0-4; nilai akhir disimpan di penilaian.nilai_akhir kalau ada
      if (typeof target.nilai_akhir === 'number') return target.nilai_akhir;
      const sum = sk.reduce((a,s) => a + (Number(s.skor)||0), 0);
      const max = sk.length * (g.role_max || 4);
      return max > 0 ? (sum/max)*100 : null;
    }

    const out = [];
    for (const key of Object.keys(groups)) {
      const arr = groups[key].guru.map(nilaiGuru).filter(v => v != null && !isNaN(v));
      const rata = arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null;
      out.push({
        madrasah: key,
        jumlah_guru: groups[key].guru.length,
        guru_dinilai: arr.length,
        rata_pkg: rata,
      });
    }
    return out.sort((a,b) => a.madrasah.localeCompare(b.madrasah));
  }

  // Simpan ringkasan PKG ke meta agar bisa dipakai sebagai suggestion di komponen HK
  function saveRingkasanPkg(rows) {
    window.Meta.set('ringkasan_pkg', { generated_at: window.nowLocal(), rows });
  }
  function getRingkasanPkg() {
    return window.Meta.get('ringkasan_pkg', null);
  }

  // Suggestion skor 1-4 untuk komponen HK aspek "Capaian Mutu Pembelajaran"
  // berdasarkan rata-rata PKG madrasah
  function suggestSkorFromPkg(rataPkg) {
    if (rataPkg == null || isNaN(rataPkg)) return null;
    if (rataPkg > 90) return 4;
    if (rataPkg > 75) return 3;
    if (rataPkg > 60) return 2;
    return 1;
  }

  // ===== Expose =====
  window.PKKMTools = {
    downloadTemplateKamad,
    parseImportKamad,
    applyImportKamad,
    importPkgBackupJson,
    ringkasanPkgPerMadrasah,
    saveRingkasanPkg,
    getRingkasanPkg,
    suggestSkorFromPkg,
  };

})();
