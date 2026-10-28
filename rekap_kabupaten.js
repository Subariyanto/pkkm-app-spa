// rekap_kabupaten.js — Rekap Kabupaten PKKM
// Fitur: gabungkan berkas backup JSON dari beberapa pengawas menjadi satu
// rekap tingkat kabupaten/kota, lalu cetak/ekspor.
//
// Dimuat SEBELUM app.js. Route didaftarkan di app.js lewat
// window.renderRekapKabupaten.
//
// Catatan penting: berkas backup dari perangkat berbeda memakai id lokal
// masing-masing (kamad id 1 bisa beda madrasah di perangkat lain). Karena itu
// penggabungan memakai KUNCI IDENTITAS, bukan id:
//   kamad      -> NSM, atau nama madrasah + nama kepala madrasah
//   periode    -> tahun + semester + type
//   penilaian  -> kamad + periode + role penilai
//   skor       -> penilaian + indikator_id
// Id lokal lama dipetakan ulang ke id lokal perangkat ini.

(function () {
  'use strict';

  // ---------- util ----------
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

  const num = (n) => (n == null || isNaN(n)) ? '-' : Number(n).toFixed(2);
  const norm = (s) => String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' ');
  const numOr = (v) => (typeof v === 'number' && !isNaN(v) && v > 0) ? v : 0;

  const KOMP_META = () => (window.PKKM_KOMPONEN_META || window.PKKM_KOMPONEN || []);

  function roleLabel(code) {
    const r = (window.PKKM_ROLES || []).find((x) => x.code === code);
    return r ? r.label : (code || 'Pengawas Madrasah');
  }

  function sebutan(nilai) {
    try { return window.getPKKMSebutan ? window.getPKKMSebutan(nilai) : null; }
    catch (e) { return null; }
  }

  // ---------- pencocokan identitas ----------
  function findKamadIndex(list, k) {
    const nsm = String(k.nsm || '').trim();
    if (nsm) {
      const i = list.findIndex((x) => String(x.nsm || '').trim() === nsm);
      if (i >= 0) return i;
    }
    const nm = norm(k.nama_madrasah);
    const pr = norm(k.nama);
    let i = list.findIndex((x) => norm(x.nama_madrasah) === nm && norm(x.nama) === pr);
    if (i >= 0) return i;
    if (nm) {
      i = list.findIndex((x) => norm(x.nama_madrasah) === nm
        && (!String(x.nsm || '').trim() || !nsm));
      if (i >= 0) return i;
    }
    return -1;
  }

  function findPeriodeIndex(list, p) {
    const key = (x) => [x.tahun, x.semester || '1', x.type || 'sumatif'].join('|');
    const k = key(p);
    let i = list.findIndex((x) => key(x) === k);
    if (i >= 0) return i;
    if (p.label) {
      i = list.findIndex((x) => norm(x.label) === norm(p.label));
      if (i >= 0) return i;
    }
    return -1;
  }

  function findPenilaianIndex(list, kamadId, periodeId, role) {
    return list.findIndex((x) => x.kamad_id === kamadId
      && x.periode_id === periodeId
      && (x.role || 'pengawas_1') === (role || 'pengawas_1'));
  }

  // ---------- baca & validasi berkas ----------
  function readPayload(name, raw) {
    let json;
    try { json = JSON.parse(raw); }
    catch (e) { throw new Error(`${name}: bukan JSON yang valid (${e.message})`); }

    // Terima format backup resmi
    if (json && json.schema === 'pkkm_v1' && json.data) return { name, payload: json };

    // Toleransi: kiriman berupa objek data langsung
    if (json && (Array.isArray(json.kamad) || Array.isArray(json.penilaian))) {
      return {
        name,
        payload: { schema: 'pkkm_v1', version: json.version || null, exported_at: json.exported_at || '', data: json },
      };
    }
    throw new Error(`${name}: bukan berkas backup PKKM (schema tidak cocok).`);
  }

  function describeFile(entry) {
    const d = entry.payload.data || {};
    const kamad = d.kamad || [];
    const periode = d.periode || [];
    const penilaian = d.penilaian || [];
    const skor = d.skor || [];
    const pkb = d.pkb || [];
    const meta = d.meta || {};

    const pengawasSet = new Set();
    for (const p of penilaian) {
      if (p.penilai_nama) pengawasSet.add(String(p.penilai_nama).trim());
    }
    const idPgw = meta.identitas_pengawas;
    if (idPgw && idPgw.nama) pengawasSet.add(String(idPgw.nama).trim());

    return {
      name: entry.name,
      exported_at: entry.payload.exported_at || '',
      kab: meta.kabupaten_kota || '',
      pengawas: Array.from(pengawasSet).join(', '),
      counts: {
        kamad: kamad.length,
        periode: periode.length,
        penilaian: penilaian.length,
        skor: skor.length,
        pkb: pkb.length,
      },
    };
  }

  // ---------- rencana penggabungan (tanpa menyimpan) ----------
  // opts.emptyBase = true → gabung berkas-berkas saja (tanpa data perangkat ini),
  // dipakai menu Backup untuk membuat satu berkas JSON gabungan.
  function planMerge(entries, mode, opts) {
    opts = opts || {};
    const cur = opts.emptyBase ? { data: {} } : window.backupAll();
    const base = JSON.parse(JSON.stringify(cur.data || {}));
    base.kamad = base.kamad || [];
    base.periode = base.periode || [];
    base.penilaian = base.penilaian || [];
    base.skor = base.skor || [];
    base.meta = base.meta || {};
    base.instrumen_overrides = base.instrumen_overrides || {};
    base.pkb = base.pkb || [];

    let maxKamad = base.kamad.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0);
    let maxPeriode = base.periode.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0);
    let maxPen = base.penilaian.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0);
    let maxPkb = base.pkb.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0);

    const report = {
      mode,
      files: [],
      added: { kamad: 0, periode: 0, penilaian: 0, skor: 0, pkb: 0 },
      filled: { skor: 0, pkb: 0 },
      replaced: { skor: 0 },
      skipped: { kamad: 0, periode: 0, penilaian: 0, skor: 0, pkb: 0 },
      conflicts: [],
      warnings: [],
    };

    for (const entry of entries) {
      const info = describeFile(entry);
      report.files.push(info);

      const d = entry.payload.data || {};
      const fKamad = d.kamad || [];
      const fPeriode = d.periode || [];
      const fPen = d.penilaian || [];
      const fSkor = d.skor || [];
      const fPkb = d.pkb || [];
      const fMeta = d.meta || {};

      // -- periode --
      const periodeMap = {};
      for (const p of fPeriode) {
        let idx = findPeriodeIndex(base.periode, p);
        if (idx < 0) {
          const obj = Object.assign({}, p, { id: ++maxPeriode });
          base.periode.push(obj);
          periodeMap[p.id] = obj.id;
          report.added.periode++;
        } else {
          periodeMap[p.id] = base.periode[idx].id;
          report.skipped.periode++;
        }
      }

      // -- kamad --
      const kamadMap = {};
      for (const k of fKamad) {
        let idx = findKamadIndex(base.kamad, k);
        if (idx < 0) {
          const obj = Object.assign({}, k, { id: ++maxKamad });
          base.kamad.push(obj);
          kamadMap[k.id] = obj.id;
          report.added.kamad++;
        } else {
          kamadMap[k.id] = base.kamad[idx].id;
          report.skipped.kamad++;
        }
      }

      // -- penilaian --
      const penMap = {};
      for (const p of fPen) {
        const kamadId = kamadMap[p.kamad_id];
        const periodeId = periodeMap[p.periode_id];
        if (kamadId == null || periodeId == null) {
          report.warnings.push(`${entry.name}: 1 penilaian dilewati (kamad/periode tidak ikut di berkas).`);
          continue;
        }
        let idx = findPenilaianIndex(base.penilaian, kamadId, periodeId, p.role);
        if (idx < 0) {
          const obj = Object.assign({}, p, {
            id: ++maxPen,
            kamad_id: kamadId,
            periode_id: periodeId,
          });
          base.penilaian.push(obj);
          penMap[p.id] = obj.id;
          report.added.penilaian++;
        } else {
          const exist = base.penilaian[idx];
          penMap[p.id] = exist.id;
          report.skipped.penilaian++;
          // lengkapi identitas penilai bila kosong
          if (mode !== 'safe') {
            let touched = false;
            for (const f of ['penilai_nama', 'penilai_nip', 'penilai_jabatan', 'penilai_unit', 'catatan_umum', 'rekomendasi']) {
              if (!exist[f] && p[f]) { exist[f] = p[f]; touched = true; }
            }
            if (exist.status !== 'final' && p.status === 'final') { exist.status = 'final'; touched = true; }
            if (touched) { /* hitungan tidak perlu detail */ }
          }
        }
      }

      // -- skor --
      for (const s of fSkor) {
        const penId = penMap[s.penilaian_id];
        if (penId == null) {
          report.warnings.push(`${entry.name}: 1 skor dilewati (penilaian induk tidak ikut).`);
          continue;
        }
        const indId = s.indikator_id || s.aspek_id || '';
        if (!indId) continue;
        const idx = base.skor.findIndex((x) => x.penilaian_id === penId && (x.indikator_id || x.aspek_id || '') === indId);
        if (idx < 0) {
          base.skor.push(Object.assign({}, s, { penilaian_id: penId }));
          report.added.skor++;
          continue;
        }
        const exist = base.skor[idx];
        const baru = numOr(s.skor);
        const lama = numOr(exist.skor);

        if (mode === 'safe') { report.skipped.skor++; continue; }

        if (baru === 0) { report.skipped.skor++; continue; }

        if (lama === 0) {
          exist.skor = s.skor;
          if (s.catatan) exist.catatan = s.catatan;
          if (Array.isArray(s.bukti) && s.bukti.length) exist.bukti = s.bukti;
          report.filled.skor++;
          continue;
        }

        if (lama === baru) {
          if (mode !== 'safe') {
            if (Array.isArray(s.bukti) && Array.isArray(exist.bukti) && s.bukti.length > exist.bukti.length) exist.bukti = s.bukti;
            if (!exist.catatan && s.catatan) exist.catatan = s.catatan;
          }
          report.skipped.skor++;
          continue;
        }

        // nilai berbeda
        if (mode === 'overwrite') {
          exist.skor = s.skor;
          if (s.catatan) exist.catatan = s.catatan;
          if (Array.isArray(s.bukti) && s.bukti.length) exist.bukti = s.bukti;
          report.replaced.skor++;
        } else {
          report.skipped.skor++;
          if (report.conflicts.length < 200) {
            const kam = base.kamad.find((x) => x.id === penIdKamad(base, penId));
            const pen = base.penilaian.find((x) => x.id === penId);
            report.conflicts.push({
              sumber: entry.name,
              madrasah: kam ? (kam.nama_madrasah || kam.nama) : '-',
              penilai: pen ? (pen.penilai_nama || roleLabel(pen.role)) : '-',
              indikator: indId,
              lama,
              baru,
            });
          }
        }
      }

      // -- PKB: kunci kamad + periode + sub_aspek_kode --
      for (const b of fPkb) {
        const kamadId = kamadMap[b.kamad_id];
        const periodeId = periodeMap[b.periode_id];
        if (kamadId == null || periodeId == null) {
          report.warnings.push(`${entry.name}: 1 data PKB dilewati (kamad/periode tidak ikut di berkas).`);
          continue;
        }
        const sub = b.sub_aspek_kode || '';
        const idx = base.pkb.findIndex((x) => x.kamad_id === kamadId
          && x.periode_id === periodeId
          && (x.sub_aspek_kode || '') === sub);
        if (idx < 0) {
          base.pkb.push(Object.assign({}, b, {
            id: ++maxPkb,
            kamad_id: kamadId,
            periode_id: periodeId,
          }));
          report.added.pkb++;
        } else if (mode === 'safe') {
          report.skipped.pkb++;
        } else {
          const exist = base.pkb[idx];
          let touched = false;
          for (const f of ['prioritas', 'unsur_pkb', 'jenis_pkb', 'kegiatan_pkb', 'catatan']) {
            const kosong = exist[f] == null || exist[f] === '';
            if (kosong && b[f] != null && b[f] !== '') { exist[f] = b[f]; touched = true; }
          }
          if (touched) report.filled.pkb++; else report.skipped.pkb++;
        }
      }

      // -- meta: lengkapi kunci yang belum ada --
      for (const k of Object.keys(fMeta || {})) {
        if (k.startsWith('next_')) continue;
        if (base.meta[k] == null || base.meta[k] === '') {
          base.meta[k] = fMeta[k];
        }
      }

      // -- instrumen_overrides --
      const fOv = d.instrumen_overrides || {};
      for (const k of Object.keys(fOv)) {
        if (base.instrumen_overrides[k] == null) base.instrumen_overrides[k] = fOv[k];
      }
    }

    // counter id konsisten
    base.meta.next_kamad = maxKamad + 1;
    base.meta.next_periode = maxPeriode + 1;
    base.meta.next_penilaian = maxPen + 1;
    base.meta.next_pkb = maxPkb + 1;

    return { data: base, report };
  }

  function penIdKamad(base, penId) {
    const p = base.penilaian.find((x) => x.id === penId);
    return p ? p.kamad_id : null;
  }

  function planSize(plan) {
    try { return JSON.stringify(plan.data).length; }
    catch (e) { return 0; }
  }

  function applyPlan(plan) {
    window.restoreAll({
      schema: 'pkkm_v1',
      version: window.PKKM_VERSION || '2.0.0',
      exported_at: window.nowLocal(),
      data: plan.data,
    });
  }

  // ---------- data rekap ----------
  function buildRecap(periodeId) {
    const kamadList = window.Kamad.list();
    const komps = KOMP_META();
    const rows = [];

    for (const k of kamadList) {
      const sessions = window.Penilaian.forKamadPeriode(k.id, periodeId);
      let nilaiAkhir = null;
      let detail = [];
      let persen = 0;

      if (sessions.length) {
        if (sessions.length > 1) {
          try {
            const agg = window.hitungNilaiAgregat(k.id, periodeId);
            if (agg) {
              nilaiAkhir = agg.nilaiAgregat;
              detail = komps.map((km) => {
                const vals = sessions
                  .map((s) => { try { return window.hitungNilaiKomponen(s.id, km.code).nilai; } catch (e) { return 0; } })
                  .filter((v) => v > 0);
                return { code: km.code, label: km.label, nilai: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0 };
              });
            }
          } catch (e) { /* noop */ }
        } else {
          const h = window.hitungNilaiAkhir(sessions[0].id);
          nilaiAkhir = h.nilaiAkhir;
          detail = h.detail;
        }
        const progs = sessions.map((s) => { try { return window.progressPenilaian(s.id).persen; } catch (e) { return 0; } });
        persen = Math.max.apply(null, progs.concat([0]));
      }

      const penilai = sessions
        .map((s) => s.penilai_nama || roleLabel(s.role))
        .filter(Boolean);

      // PKB madrasah pada periode ini
      let pkbList = [];
      try {
        pkbList = (window.PKB && typeof window.PKB.forKamadPeriode === 'function')
          ? window.PKB.forKamadPeriode(k.id, periodeId) : [];
      } catch (e) { pkbList = []; }
      const pkbTerisi = pkbList.filter((x) => (x.kegiatan_pkb || '').trim()).length;

      rows.push({
        k,
        sessions,
        nilaiAkhir,
        detail,
        persen,
        penilai,
        pkbList,
        pkbTerisi,
        sebutan: nilaiAkhir != null ? sebutan(nilaiAkhir) : null,
      });
    }
    return rows;
  }

  // ---------- UI ----------
  let _state = {
    files: [],
    plan: null,
  };

  // ---------- data server (ketua pokjawas / admin, read-only) ----------
  const ADMIN_DATA_URL = '/functions/v1/edusmart-auth/admin-data';
  const isAdminSession = () => !!sessionStorage.getItem('pkkm_admin_key');

  async function fetchServerData() {
    const S = window.SupabaseSync || {};
    if (!S.VPS_URL) throw new Error('Alamat server belum dikonfigurasi.');
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 60000);
    let res;
    try {
      res = await fetch(S.VPS_URL.replace(/\/$/, '') + ADMIN_DATA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: S.VPS_ANON_KEY },
        body: JSON.stringify({ admin_key: sessionStorage.getItem('pkkm_admin_key') || '' }),
        signal: ctrl.signal,
      });
    } finally { clearTimeout(to); }
    const out = await res.json().catch(() => null);
    if (res.status === 403) throw new Error('Sesi admin tidak valid. Logout lalu login ulang sebagai admin.');
    if (!out || out.ok !== true) throw new Error((out && out.error) || ('HTTP ' + res.status));

    // Kelompokkan baris per akun pengawas -> satu "berkas" per akun
    const byUser = {};
    for (const r of out.rows || []) {
      const u = r.username;
      if (!byUser[u]) byUser[u] = { name: r.display_name || u, data: {} };
      byUser[u].data[r.scope] = r.payload;
    }
    const entries = Object.keys(byUser).sort().map((u) => {
      const x = byUser[u];
      // Penilai tanpa nama: pakai nama akun supaya filter pengawas berfungsi
      (x.data.penilaian || []).forEach((p) => {
        if (!p.penilai_nama && String(p.role || 'pengawas_1').startsWith('pengawas')) p.penilai_nama = x.name;
      });
      return { name: x.name + ' (' + u + ')', payload: { schema: 'pkkm_v1', data: x.data } };
    });
    const plan = planMerge(entries, 'fill', { emptyBase: true });
    return { plan, akun: entries.length };
  }

  window.renderRekapKabupaten = function (root) {
    const viewOn = !!(window.pkkmViewActive && window.pkkmViewActive());
    const view = window.__PKKM_VIEW || null;
    const periodeList = window.Periode.list();
    const kab = (window.Meta && typeof window.Meta.kab === 'function') ? window.Meta.kab() : 'Jember';

    const prefPid = Number((location.hash.match(/[?&]p=(\d+)/) || [])[1]) || (periodeList[0] ? periodeList[0].id : 0);
    const selected = periodeList.find((p) => p.id === prefPid) || periodeList[0] || null;

    const rows = selected ? buildRecap(selected.id) : [];
    const dinilai = rows.filter((r) => r.nilaiAkhir != null && r.persen > 0);
    const rata = dinilai.length ? dinilai.reduce((a, r) => a + r.nilaiAkhir, 0) / dinilai.length : null;

    const kkmaSet = Array.from(new Set(rows.map((r) => (r.k.kkma || '').trim()).filter(Boolean))).sort();
    const pgwSet = Array.from(new Set(rows.flatMap((r) => r.penilai.map((n) => n.trim())))).filter(Boolean).sort();

    root.innerHTML = `
      <div class="page-header flex-wrap gap-2 no-print rk-header">
        <h5 class="mb-0"><i class="bi bi-diagram-3"></i> Rekap Kabupaten</h5>
        <div class="rk-header-actions">
          ${periodeList.length ? `
          <select class="form-select form-select-sm" id="rkPeriode" title="Pilih periode">
            ${periodeList.map((p) => `<option value="${p.id}" ${selected && p.id === selected.id ? 'selected' : ''}>${esc(p.label)}</option>`).join('')}
          </select>` : ''}
          <button class="btn btn-sm btn-gradient-excel" id="rkExport" ${rows.length ? '' : 'disabled'}><i class="bi bi-file-earmark-excel"></i> Export Excel</button>
          <button class="btn btn-sm btn-gradient-print" id="rkPrint" ${rows.length ? '' : 'disabled'}><i class="bi bi-printer"></i> Cetak</button>
        </div>
      </div>

      ${isAdminSession() ? `
      <div class="card mb-3 no-print ${viewOn ? 'border-success' : ''}">
        <div class="card-body py-2 d-flex flex-wrap align-items-center gap-2">
          <div class="flex-grow-1 text-tiny">
            ${viewOn
              ? `<i class="bi bi-cloud-check text-success"></i> <strong>Mode data server</strong> — menampilkan data ${view.akun} akun pengawas dari VPS (diambil ${esc(view.at)}). Hanya untuk dilihat, tidak disimpan ke perangkat ini.`
              : `<i class="bi bi-cloud"></i> Ketua pokjawas/admin: ambil data PKKM <strong>semua pengawas</strong> langsung dari server, tanpa perlu kirim file JSON.`}
          </div>
          <button class="btn btn-sm btn-success" id="rkServer"><i class="bi bi-cloud-download"></i> ${viewOn ? 'Muat Ulang dari Server' : 'Ambil Data Semua Pengawas dari Server'}</button>
          ${viewOn ? '<button class="btn btn-sm btn-outline-secondary" id="rkServerOff"><i class="bi bi-x-circle"></i> Kembali ke Data Perangkat</button>' : ''}
        </div>
      </div>` : ''}

      <div class="print-only text-center mb-3" style="display:none;">
        <div style="font-weight:700; font-size:1.05rem;">REKAP PKKM TINGKAT KABUPATEN/KOTA</div>
        <div style="font-weight:600;">POKJAWAS MADRASAH KAB. ${esc(kab.toUpperCase())}</div>
        <div class="text-tiny">${selected ? esc(selected.label) : '-'}</div>
      </div>

      <div class="row g-3 mb-3 no-print">
        <div class="col-6 col-md-3">
          <div class="card h-100"><div class="card-body py-3">
            <div class="text-tiny text-muted">Total Madrasah</div>
            <div class="fs-4 fw-bold">${rows.length}</div>
          </div></div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card h-100"><div class="card-body py-3">
            <div class="text-tiny text-muted">Sudah Dinilai</div>
            <div class="fs-4 fw-bold text-success">${dinilai.length}</div>
          </div></div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card h-100"><div class="card-body py-3">
            <div class="text-tiny text-muted">Belum Dinilai</div>
            <div class="fs-4 fw-bold text-secondary">${Math.max(0, rows.length - dinilai.length)}</div>
          </div></div>
        </div>
        <div class="col-6 col-md-3">
          <div class="card h-100"><div class="card-body py-3">
            <div class="text-tiny text-muted">Rata-rata Kabupaten</div>
            <div class="fs-4 fw-bold text-primary">${rata != null ? num(rata) : '-'}</div>
          </div></div>
        </div>
      </div>

      <div class="card mb-3 no-print" ${viewOn ? 'style="display:none;"' : ''}>
        <div class="card-header">
          <i class="bi bi-collection"></i> Gabung Berkas PKKM dari Pengawas
        </div>
        <div class="card-body">
          <p class="text-tiny text-muted mb-2">
            Kumpulkan berkas <strong>backup JSON</strong> dari setiap pengawas (menu Backup &rarr; Download Backup JSON),
            lalu pilih beberapa berkas sekaligus di sini. Aplikasi akan menggabungkan data kamad, periode,
            penilaian, skor, <strong>dan PKB</strong> berdasarkan
            <em>NSM madrasah + periode + role penilai</em>, bukan berdasarkan nomor id, sehingga data dari
            perangkat berbeda tidak saling menimpa.
          </p>
          <div class="row g-2 align-items-end">
            <div class="col-md-6">
              <label class="form-label text-tiny mb-1">Berkas backup (.json) — bisa pilih banyak</label>
              <input type="file" class="form-control form-control-sm" id="rkFiles" accept=".json,application/json" multiple>
            </div>
            <div class="col-md-3">
              <label class="form-label text-tiny mb-1">Cara gabung</label>
              <select class="form-select form-select-sm" id="rkMode">
                <option value="fill" selected>Lengkapi (aman)</option>
                <option value="safe">Tambah saja</option>
                <option value="overwrite">Timpa dengan berkas</option>
              </select>
            </div>
            <div class="col-md-3 d-flex gap-2">
              <button class="btn btn-sm btn-outline-primary w-50" id="rkPreview"><i class="bi bi-search"></i> Pratinjau</button>
              <button class="btn btn-sm btn-primary w-50" id="rkApply" disabled><i class="bi bi-arrow-down-circle"></i> Gabung</button>
            </div>
          </div>
          <div class="text-tiny text-muted mt-2">
            <strong>Lengkapi</strong>: menambah data baru dan mengisi skor yang masih kosong, tidak menimpa skor yang sudah ada.
            <strong>Tambah saja</strong>: hanya menambah yang belum ada.
            <strong>Timpa</strong>: skor dari berkas dipakai bila berbeda.
          </div>
          <div id="rkPreviewBox" class="mt-3"></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span><i class="bi bi-table"></i> Rekap Gabungan ${selected ? '— ' + esc(selected.label) : ''}</span>
          <div class="d-flex gap-2 no-print">
            <input class="form-control form-control-sm" id="rkSearch" placeholder="Cari madrasah / kepala madrasah" style="min-width:200px;">
            <select class="form-select form-select-sm" id="rkFilterKkma" style="min-width:150px;">
              <option value="">Semua KKMA</option>
              ${kkmaSet.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join('')}
            </select>
            <select class="form-select form-select-sm" id="rkFilterPgw" style="min-width:170px;">
              <option value="">Semua Pengawas</option>
              ${pgwSet.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="card-body p-0">
          ${rows.length ? `
          <div class="table-responsive"><table class="table table-hover mb-0 align-middle" id="rkTable">
            <thead class="table-light">
              <tr>
                <th width="40">#</th>
                <th>Madrasah / Kepala Madrasah</th>
                <th class="text-center">Jenjang</th>
                <th>KKMA</th>
                <th>Pengawas Penilai</th>
                ${KOMP_META().map((k) => `<th class="text-center text-tiny" title="${esc(k.label)}">${esc(k.code)}</th>`).join('')}
                <th class="text-center">Nilai Akhir</th>
                <th class="text-center">Sebutan</th>
                <th class="text-center" title="Jumlah sub-aspek PKB yang sudah diisi kegiatan">PKB</th>
                <th class="text-center no-print">Aksi</th>
              </tr>
            </thead>
            <tbody id="rkBody"></tbody>
          </table></div>` : `
          <div class="p-4 text-center text-muted">
            ${periodeList.length ? 'Belum ada data kepala madrasah.' : 'Belum ada periode penilaian. <a href="#/penilaian">Buat periode dulu</a>.'}
          </div>`}
        </div>
      </div>
    `;

    // ---------- tabel ----------
    const tbody = document.getElementById('rkBody');
    const komps = KOMP_META();

    function renderRows() {
      if (!tbody) return;
      const q = norm((document.getElementById('rkSearch') || {}).value || '');
      const fk = (document.getElementById('rkFilterKkma') || {}).value || '';
      const fp = (document.getElementById('rkFilterPgw') || {}).value || '';

      const view = rows.filter((r) => {
        if (q) {
          const hay = norm(`${r.k.nama} ${r.k.nama_madrasah} ${r.k.nsm}`);
          if (hay.indexOf(q) < 0) return false;
        }
        if (fk && (r.k.kkma || '').trim() !== fk) return false;
        if (fp && !r.penilai.some((n) => n.trim() === fp)) return false;
        return true;
      });

      if (!view.length) {
        tbody.innerHTML = '<tr><td colspan="99" class="text-center text-muted py-4">Tidak ada data yang cocok.</td></tr>';
        return;
      }

      tbody.innerHTML = view.map((r, i) => {
        const detail = r.detail || [];
        const kompCells = komps.map((km) => {
          const d = detail.find((x) => x.code === km.code);
          return `<td class="text-center">${d && d.nilai > 0 ? num(d.nilai) : '-'}</td>`;
        }).join('');
        return `<tr>
          <td>${i + 1}</td>
          <td>
            <div class="fw-semibold">${esc(r.k.nama_madrasah || '-')}</div>
            <div class="text-tiny text-muted">${esc(r.k.nama)}${r.k.nsm ? ' &middot; NSM ' + esc(r.k.nsm) : ''}</div>
          </td>
          <td class="text-center">${esc(r.k.jenjang || '-')}</td>
          <td class="text-tiny">${esc(r.k.kkma || '-')}</td>
          <td class="text-tiny">${r.penilai.length ? esc(r.penilai.join(' · ')) : '<span class="text-muted">-</span>'}</td>
          ${kompCells}
          <td class="text-center fw-bold">${r.nilaiAkhir != null && r.persen > 0 ? num(r.nilaiAkhir) : '-'}
            ${r.sessions.length > 1 ? `<div class="text-tiny text-muted">${r.sessions.length} penilai</div>` : ''}
          </td>
          <td class="text-center">${r.sebutan ? `<span class="${r.sebutan.cssClass || 'badge bg-secondary'}">${esc(r.sebutan.label)}</span>` : '-'}</td>
          <td class="text-center text-tiny">${r.pkbTerisi ? `<span class="badge bg-success">${r.pkbTerisi}</span>` : (r.pkbList.length ? `<span class="badge bg-warning text-dark">0</span>` : '<span class="text-muted">-</span>')}</td>
          <td class="text-center no-print">
            ${r.sessions.length ? `<a href="#/agregat/${r.k.id}/${selected.id}" class="btn btn-sm btn-outline-primary" title="Detail"><i class="bi bi-graph-up"></i></a>` : ''}
          </td>
        </tr>`;
      }).join('');
    }

    renderRows();

    ['rkSearch', 'rkFilterKkma', 'rkFilterPgw'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener(id === 'rkSearch' ? 'input' : 'change', renderRows);
    });

    // ---------- periode & cetak ----------
    const sel = document.getElementById('rkPeriode');
    if (sel) sel.addEventListener('change', (e) => { location.hash = `#/rekap-kabupaten?p=${e.target.value}`; });

    const btnPrint = document.getElementById('rkPrint');
    if (btnPrint) btnPrint.addEventListener('click', () => window.print());

    const btnExport = document.getElementById('rkExport');
    if (btnExport) btnExport.addEventListener('click', () => exportExcel(selected, rows, kab));

    // ---------- data server ----------
    const btnServer = document.getElementById('rkServer');
    if (btnServer) btnServer.addEventListener('click', async () => {
      btnServer.disabled = true;
      btnServer.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Mengambil data…';
      try {
        window.__PKKM_VIEW = null; // planMerge tidak boleh membaca data view lama
        const r = await fetchServerData();
        window.__PKKM_VIEW = { data: r.plan.data, akun: r.akun, at: window.nowLocal() };
        window.toast(r.akun ? `Data ${r.akun} akun pengawas dimuat dari server.` : 'Belum ada data pengawas di server.');
        window.render();
      } catch (e) {
        window.toast('Gagal ambil data server: ' + e.message, 'error');
        btnServer.disabled = false;
        btnServer.innerHTML = '<i class="bi bi-cloud-download"></i> Ambil Data Semua Pengawas dari Server';
      }
    });
    const btnServerOff = document.getElementById('rkServerOff');
    if (btnServerOff) btnServerOff.addEventListener('click', () => {
      window.__PKKM_VIEW = null;
      location.hash = '#/rekap-kabupaten';
      window.render();
    });

    // ---------- gabung berkas ----------
    const inputFiles = document.getElementById('rkFiles');
    const modeSel = document.getElementById('rkMode');
    const btnPreview = document.getElementById('rkPreview');
    const btnApply = document.getElementById('rkApply');
    const box = document.getElementById('rkPreviewBox');

    function resetPlan() {
      _state.plan = null;
      if (btnApply) btnApply.disabled = true;
    }

    if (inputFiles) inputFiles.addEventListener('change', resetPlan);
    if (modeSel) modeSel.addEventListener('change', () => { resetPlan(); box.innerHTML = ''; });

    async function collectFiles() {
      const files = Array.from((inputFiles && inputFiles.files) || []);
      if (!files.length) { window.toast('Pilih berkas backup dulu.', 'error'); return null; }
      const entries = [];
      const errors = [];
      for (const f of files) {
        try {
          const raw = await f.text();
          entries.push(readPayload(f.name, raw));
        } catch (e) {
          errors.push(e.message);
        }
      }
      if (errors.length) {
        box.innerHTML = `<div class="alert alert-danger mb-0 py-2"><strong>Berkas tidak dapat dibaca:</strong><ul class="mb-0">${errors.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div>`;
      }
      if (!entries.length) return null;
      return { entries, errors };
    }

    function renderPreview(plan) {
      const rp = plan.report;
      const bytes = planSize(plan);
      const mb = (bytes / 1048576).toFixed(2);
      const sizeWarn = bytes > 4 * 1048576
        ? `<div class="alert alert-warning py-2 mt-2 mb-0"><i class="bi bi-exclamation-triangle"></i> Ukuran data hasil gabungan <strong>${mb} MB</strong>. Batas penyimpanan browser biasanya 5–10 MB. Pertimbangkan menghapus bukti foto lama bila penyimpanan penuh.</div>`
        : '';

      box.innerHTML = `
        <div class="table-responsive mb-2">
          <table class="table table-sm table-bordered mb-0">
            <thead class="table-light">
              <tr><th>Berkas</th><th>Pengawas</th><th class="text-center">Kamad</th><th class="text-center">Periode</th><th class="text-center">Penilaian</th><th class="text-center">Skor</th><th class="text-center">PKB</th></tr>
            </thead>
            <tbody>
              ${rp.files.map((f) => `<tr>
                <td class="text-tiny">${esc(f.name)}</td>
                <td class="text-tiny">${esc(f.pengawas || '-')}</td>
                <td class="text-center">${f.counts.kamad}</td>
                <td class="text-center">${f.counts.periode}</td>
                <td class="text-center">${f.counts.penilaian}</td>
                <td class="text-center">${f.counts.skor}</td>
                <td class="text-center">${f.counts.pkb || 0}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>

        <div class="d-flex flex-wrap gap-2 mb-2">
          <span class="badge bg-success">+${rp.added.kamad} madrasah baru</span>
          <span class="badge bg-success">+${rp.added.periode} periode baru</span>
          <span class="badge bg-success">+${rp.added.penilaian} penilaian baru</span>
          <span class="badge bg-success">+${rp.added.skor} skor baru</span>
          ${rp.added.pkb ? `<span class="badge bg-success">+${rp.added.pkb} data PKB baru</span>` : ''}
          ${rp.filled.skor ? `<span class="badge bg-info text-dark">${rp.filled.skor} skor dilengkapi</span>` : ''}
          ${rp.filled.pkb ? `<span class="badge bg-info text-dark">${rp.filled.pkb} PKB dilengkapi</span>` : ''}
          ${rp.replaced.skor ? `<span class="badge bg-warning text-dark">${rp.replaced.skor} skor ditimpa</span>` : ''}
          ${rp.conflicts.length ? `<span class="badge bg-danger">${rp.conflicts.length} konflik nilai</span>` : ''}
          <span class="badge bg-secondary">ukuran hasil ${mb} MB</span>
        </div>

        ${rp.conflicts.length ? `
        <details class="mb-2">
          <summary class="text-tiny text-danger fw-semibold">Lihat ${rp.conflicts.length} konflik nilai (skor berbeda, data lama dipertahankan)</summary>
          <div class="table-responsive mt-2" style="max-height:240px; overflow:auto;">
            <table class="table table-sm table-bordered mb-0">
              <thead class="table-light"><tr><th>Madrasah</th><th>Penilai</th><th>Indikator</th><th class="text-center">Lama</th><th class="text-center">Berkas</th></tr></thead>
              <tbody>
                ${rp.conflicts.slice(0, 100).map((c) => `<tr class="text-tiny">
                  <td>${esc(c.madrasah)}</td><td>${esc(c.penilai)}</td><td>${esc(c.indikator)}</td>
                  <td class="text-center">${c.lama}</td><td class="text-center">${c.baru}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
          <div class="text-tiny text-muted mt-1">Bila ingin versi berkas yang dipakai, pilih cara gabung <em>Timpa dengan berkas</em> lalu pratinjau ulang.</div>
        </details>` : ''}

        ${rp.warnings.length ? `<div class="alert alert-warning py-2 text-tiny mb-2">${rp.warnings.slice(0, 8).map(esc).join('<br>')}${rp.warnings.length > 8 ? '<br>…' : ''}</div>` : ''}
        ${sizeWarn}
      `;
    }

    if (btnPreview) btnPreview.addEventListener('click', async () => {
      btnPreview.disabled = true;
      btnPreview.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Membaca…';
      try {
        const res = await collectFiles();
        if (!res) { resetPlan(); return; }
        const plan = planMerge(res.entries, modeSel ? modeSel.value : 'fill');
        _state.plan = plan;
        renderPreview(plan);
        btnApply.disabled = false;
      } catch (e) {
        window.toast('Gagal membaca berkas: ' + e.message, 'error');
        resetPlan();
      } finally {
        btnPreview.disabled = false;
        btnPreview.innerHTML = '<i class="bi bi-search"></i> Pratinjau';
      }
    });

    if (btnApply) btnApply.addEventListener('click', async () => {
      if (!_state.plan) { window.toast('Lakukan pratinjau dulu.', 'error'); return; }
      const rp = _state.plan.report;
      const msg = `Gabungkan ${rp.files.length} berkas ke data perangkat ini?\n\n`
        + `+${rp.added.kamad} madrasah, +${rp.added.penilaian} penilaian, +${rp.added.skor} skor\n`
        + `${rp.filled.skor} skor dilengkapi, ${rp.replaced.skor} ditimpa, ${rp.conflicts.length} konflik dipertahankan.\n\n`
        + `Disarankan unduh backup dulu sebelum menggabung.`;
      if (!window.confirm(msg)) return;

      btnApply.disabled = true;
      btnApply.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Menggabung…';
      try {
        applyPlan(_state.plan);
        window.toast('Berkas berhasil digabung.');
        _state.plan = null;
        setTimeout(() => { if (typeof window.render === 'function') window.render(); }, 400);
      } catch (e) {
        window.toast('Gagal menggabung: ' + e.message, 'error');
        btnApply.disabled = false;
        btnApply.innerHTML = '<i class="bi bi-arrow-down-circle"></i> Gabung';
      }
    });
  };

  // ---------- ekspor Excel ----------
  async function exportExcel(periode, rows, kab) {
    if (window.LIC && window.LIC.getStatus) {
      const s = window.LIC.getStatus();
      if (s && s.isTrial) {
        window.toast('Export Excel hanya untuk akun FULL. Cetak (Ctrl+P) tetap bisa.', 'error');
        return;
      }
    }
    if (typeof ExcelJS === 'undefined') { window.toast('ExcelJS belum siap, coba lagi.', 'error'); return; }

    const komps = KOMP_META();
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Rekap Kabupaten', { views: [{ showGridLines: false }] });

    ws.addRow([`REKAP PKKM TINGKAT KABUPATEN/KOTA`]).font = { bold: true, size: 15, color: { argb: 'FF047A3A' } };
    ws.addRow([`POKJAWAS MADRASAH KAB. ${String(kab).toUpperCase()}`]).font = { bold: true, size: 12 };
    ws.addRow([periode ? periode.label : '-']).font = { size: 11 };
    ws.addRow([]);

    const headers = ['No', 'Nama Madrasah', 'NSM', 'Nama Kepala Madrasah', 'NIP', 'Jenjang', 'KKMA',
      'Pengawas Penilai', ...komps.map((k) => k.label), 'Nilai Akhir', 'Sebutan', 'PKB Terisi', 'Progress (%)'];

    const hr = ws.addRow(headers);
    hr.eachCell((c) => {
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047A3A' } };
      c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });

    rows.forEach((r, i) => {
      const detail = r.detail || [];
      ws.addRow([
        i + 1,
        r.k.nama_madrasah || '',
        r.k.nsm || '',
        r.k.nama || '',
        r.k.nip || '',
        r.k.jenjang || '',
        r.k.kkma || '',
        r.penilai.join(' · '),
        ...komps.map((km) => {
          const d = detail.find((x) => x.code === km.code);
          return d && d.nilai > 0 ? Number(d.nilai.toFixed(2)) : '';
        }),
        r.nilaiAkhir != null && r.persen > 0 ? Number(r.nilaiAkhir.toFixed(2)) : '',
        r.sebutan ? r.sebutan.label : '',
        r.pkbTerisi || '',
        Number((r.persen || 0).toFixed(1)),
      ]);
    });

    ws.columns.forEach((c, i) => { c.width = i === 1 ? 34 : (i === 7 ? 26 : 13); });

    // Sheet ringkasan per pengawas
    const ws2 = wb.addWorksheet('Per Pengawas', { views: [{ showGridLines: false }] });
    ws2.addRow(['REKAP PER PENGAWAS']).font = { bold: true, size: 14, color: { argb: 'FF047A3A' } };
    ws2.addRow([periode ? periode.label : '-']);
    ws2.addRow([]);
    const h2 = ws2.addRow(['Pengawas', 'Jumlah Madrasah Dinilai', 'Rata-rata Nilai']);
    h2.eachCell((c) => {
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047A3A' } };
      c.alignment = { horizontal: 'center' };
    });

    const map = {};
    for (const r of rows) {
      if (r.nilaiAkhir == null || r.persen <= 0) continue;
      const names = r.penilai.length ? r.penilai : ['(tanpa nama)'];
      for (const n of names) {
        map[n] = map[n] || { n: 0, sum: 0 };
        map[n].n++;
        map[n].sum += r.nilaiAkhir;
      }
    }
    Object.keys(map).sort().forEach((n) => {
      const v = map[n];
      ws2.addRow([n, v.n, Number((v.sum / v.n).toFixed(2))]);
    });
    ws2.columns.forEach((c, i) => { c.width = i === 0 ? 34 : 24; });

    // Sheet rekap PKB kabupaten
    const ws3 = wb.addWorksheet('Rekap PKB', { views: [{ showGridLines: false }] });
    ws3.addRow(['REKAP PKB (PENGEMBANGAN KEPROFESIAN BERKELANJUTAN)']).font = { bold: true, size: 14, color: { argb: 'FF047A3A' } };
    ws3.addRow([`POKJAWAS MADRASAH KAB. ${String(kab).toUpperCase()}`]).font = { bold: true, size: 12 };
    ws3.addRow([periode ? periode.label : '-']);
    ws3.addRow([]);
    const h3 = ws3.addRow(['No', 'Nama Madrasah', 'Nama Kepala Madrasah', 'Sub Aspek', 'Prioritas', 'Unsur PKB', 'Jenis PKB', 'Kegiatan PKB', 'Catatan']);
    h3.eachCell((c) => {
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047A3A' } };
      c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });

    let pkbRow = 0;
    let adaPkb = false;
    rows.forEach((r, i) => {
      (r.pkbList || []).forEach((b) => {
        adaPkb = true;
        pkbRow++;
        ws3.addRow([
          i + 1,
          r.k.nama_madrasah || '',
          r.k.nama || '',
          b.sub_aspek_kode || '',
          b.prioritas || '',
          b.unsur_pkb || '',
          b.jenis_pkb || '',
          b.kegiatan_pkb || '',
          b.catatan || '',
        ]);
      });
    });
    if (!adaPkb) {
      ws3.addRow(['', '', '', '', '', '', '', 'Belum ada data PKB pada periode ini.', '']).font = { italic: true, color: { argb: 'FF888888' } };
    }
    ws3.columns.forEach((c, i) => { c.width = i === 1 ? 30 : (i === 7 ? 40 : 16); });

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const tgl = (window.nowLocal ? window.nowLocal() : '').slice(0, 10);
    a.href = url;
    a.download = `rekap-kabupaten-pkkm-${tgl}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    window.toast('Rekap kabupaten diekspor.');
  }

  // ---------- expose ----------
  window.PKKMMerge = {
    planMerge,
    applyPlan,
    planSize,
    readPayload,
    describeFile,
  };
})();
