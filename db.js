// db.js - localStorage data layer for PKKM SPA (v2.0 - per-indikator)
// Schema:
//   kamad:     { id, nama, nip, jabatan, jenjang, nsm, nama_madrasah, alamat, masa_jabatan_mulai, telp, email, foto, created_at }
//   periode:   { id, tahun, tahun_ke (1|2|3|4), label, type, tanggal_penilaian }
//   penilaian: { id, kamad_id, periode_id, role ('pengawas_1'|'pengawas_2'|'guru_1'|'guru_2'|'komite'), status, tanggal, catatan_umum, rekomendasi }
//   skor:      { penilaian_id, indikator_id ('PM_1.1_1'), skor (1-4), catatan, bukti: [...] }
//                Legacy aspek_id (v1) entries di-migrasi otomatis (tidak di-load).
//   meta:      { next_kamad, next_periode, next_penilaian, bobot_overrides, identitas_pengawas, identitas_ketua_pokjawas, app_settings }

const PKKM_KEYS = {
  kamad: 'pkkm_v1_kamad',
  periode: 'pkkm_v1_periode',
  penilaian: 'pkkm_v1_penilaian',
  skor: 'pkkm_v1_skor',
  meta: 'pkkm_v1_meta',
  instrumen_overrides: 'pkkm_v1_instrumen_overrides',
};

function pLoad(key, def) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : def;
  } catch (e) {
    console.error('localStorage load error:', key, e);
    return def;
  }
}

function pSave(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    return true;
  } catch (e) {
    console.error('localStorage save error:', key, e);
    if (e.name === 'QuotaExceededError') {
      alert('Penyimpanan browser penuh. Lakukan Backup → Export, lalu hapus penilaian/bukti lama.');
    }
    return false;
  }
}

function pNextId(table) {
  const meta = pLoad(PKKM_KEYS.meta, {});
  const cur = meta[`next_${table}`] || 1;
  meta[`next_${table}`] = cur + 1;
  pSave(PKKM_KEYS.meta, meta);
  return cur;
}

function nowLocal() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// === Kepala Madrasah ===========================================
const Kamad = {
  list() {
    return pLoad(PKKM_KEYS.kamad, []).slice().sort((a,b)=> (a.nama||'').localeCompare(b.nama||''));
  },
  get(id) {
    return pLoad(PKKM_KEYS.kamad, []).find(x => x.id === id) || null;
  },
  create(data) {
    const all = pLoad(PKKM_KEYS.kamad, []);
    const obj = {
      id: pNextId('kamad'),
      nama: data.nama || '',
      nip: data.nip || '',
      jabatan: data.jabatan || 'Kepala Madrasah',
      jenjang: data.jenjang || 'MA',
      kkma: data.kkma || '',
      nsm: data.nsm || '',
      nama_madrasah: data.nama_madrasah || '',
      alamat: data.alamat || '',
      masa_jabatan_mulai: data.masa_jabatan_mulai || '',
      telp: data.telp || '',
      email: data.email || '',
      foto: data.foto || null,
      created_at: nowLocal(),
    };
    all.push(obj);
    pSave(PKKM_KEYS.kamad, all);
    return obj;
  },
  update(id, patch) {
    const all = pLoad(PKKM_KEYS.kamad, []);
    const i = all.findIndex(x => x.id === id);
    if (i < 0) return null;
    all[i] = { ...all[i], ...patch, id };
    pSave(PKKM_KEYS.kamad, all);
    return all[i];
  },
  remove(id) {
    const all = pLoad(PKKM_KEYS.kamad, []).filter(x => x.id !== id);
    pSave(PKKM_KEYS.kamad, all);
    // cascade: hapus penilaian + skor terkait
    const penilaians = pLoad(PKKM_KEYS.penilaian, []);
    const targetIds = penilaians.filter(p => p.kamad_id === id).map(p => p.id);
    pSave(PKKM_KEYS.penilaian, penilaians.filter(p => p.kamad_id !== id));
    if (targetIds.length) {
      const skor = pLoad(PKKM_KEYS.skor, []).filter(s => !targetIds.includes(s.penilaian_id));
      pSave(PKKM_KEYS.skor, skor);
    }
    return true;
  },
};

// === Periode ===================================================
const Periode = {
  list() {
    return pLoad(PKKM_KEYS.periode, []).slice().sort((a,b)=>{
      if (a.tahun !== b.tahun) return b.tahun - a.tahun;
      return (b.semester||'').localeCompare(a.semester||'');
    });
  },
  get(id) { return pLoad(PKKM_KEYS.periode, []).find(x => x.id === id) || null; },
  create(data) {
    const all = pLoad(PKKM_KEYS.periode, []);
    const obj = {
      id: pNextId('periode'),
      tahun: data.tahun || new Date().getFullYear(),
      semester: data.semester || '1',
      type: data.type || 'sumatif',
      label: data.label || `${data.type === 'formatif' ? 'Formatif' : 'Sumatif'} ${data.tahun || new Date().getFullYear()}`,
      tanggal_penilaian: data.tanggal_penilaian || nowLocal().slice(0,10),
    };
    all.push(obj);
    pSave(PKKM_KEYS.periode, all);
    return obj;
  },
  update(id, patch) {
    const all = pLoad(PKKM_KEYS.periode, []);
    const i = all.findIndex(x => x.id === id);
    if (i < 0) return null;
    all[i] = { ...all[i], ...patch, id };
    pSave(PKKM_KEYS.periode, all);
    return all[i];
  },
  remove(id) {
    const all = pLoad(PKKM_KEYS.periode, []).filter(x => x.id !== id);
    pSave(PKKM_KEYS.periode, all);
    const penilaians = pLoad(PKKM_KEYS.penilaian, []);
    const targetIds = penilaians.filter(p => p.periode_id === id).map(p => p.id);
    pSave(PKKM_KEYS.penilaian, penilaians.filter(p => p.periode_id !== id));
    if (targetIds.length) {
      const skor = pLoad(PKKM_KEYS.skor, []).filter(s => !targetIds.includes(s.penilaian_id));
      pSave(PKKM_KEYS.skor, skor);
    }
    return true;
  },
};

// === Penilaian (header) ========================================
const Penilaian = {
  list() { return pLoad(PKKM_KEYS.penilaian, []); },
  forKamad(kamad_id) { return this.list().filter(p => p.kamad_id === kamad_id); },
  byKamadPeriode(kamad_id, periode_id) {
    return this.list().find(p => p.kamad_id === kamad_id && p.periode_id === periode_id) || null;
  },
  get(id) { return this.list().find(p => p.id === id) || null; },
  ensure(kamad_id, periode_id) {
    let p = this.byKamadPeriode(kamad_id, periode_id);
    if (p) return p;
    const all = this.list();
    p = {
      id: pNextId('penilaian'),
      kamad_id,
      periode_id,
      role: 'pengawas_1',
      status: 'draft',
      tanggal: nowLocal().slice(0,10),
      catatan_umum: '',
      rekomendasi: '',
    };
    all.push(p);
    pSave(PKKM_KEYS.penilaian, all);
    return p;
  },
  update(id, patch) {
    const all = this.list();
    const i = all.findIndex(x => x.id === id);
    if (i < 0) return null;
    all[i] = { ...all[i], ...patch, id };
    pSave(PKKM_KEYS.penilaian, all);
    return all[i];
  },
  remove(id) {
    pSave(PKKM_KEYS.penilaian, this.list().filter(p => p.id !== id));
    pSave(PKKM_KEYS.skor, pLoad(PKKM_KEYS.skor, []).filter(s => s.penilaian_id !== id));
  },
};

// === Skor (per indikator) ======================================
// indikator_id format: "PM_1.1_1" (komponen_code + aspek_kode + ind_no)
const Skor = {
  forPenilaian(penilaian_id) {
    return pLoad(PKKM_KEYS.skor, []).filter(s => s.penilaian_id === penilaian_id);
  },
  set(penilaian_id, indikator_id, fields) {
    const all = pLoad(PKKM_KEYS.skor, []);
    const i = all.findIndex(s => s.penilaian_id === penilaian_id && s.indikator_id === indikator_id);
    if (i >= 0) all[i] = { ...all[i], ...fields, penilaian_id, indikator_id };
    else all.push({ penilaian_id, indikator_id, skor: null, catatan: '', bukti: [], ...fields });
    pSave(PKKM_KEYS.skor, all);
  },
  get(penilaian_id, indikator_id) {
    return pLoad(PKKM_KEYS.skor, []).find(s => s.penilaian_id === penilaian_id && s.indikator_id === indikator_id) || null;
  },
  // Legacy compat: lookup by aspek_id (skor lama v1)
  getLegacyByAspek(penilaian_id, aspek_id) {
    return pLoad(PKKM_KEYS.skor, []).find(s => s.penilaian_id === penilaian_id && s.aspek_id === aspek_id) || null;
  },
};

// === Meta / settings ===========================================
const Meta = {
  getAll() { return pLoad(PKKM_KEYS.meta, {}); },
  get(key, def) { return (pLoad(PKKM_KEYS.meta, {})[key]) ?? def; },
  set(key, val) {
    const m = pLoad(PKKM_KEYS.meta, {});
    m[key] = val;
    pSave(PKKM_KEYS.meta, m);
  },
  bobot() {
    const overrides = this.get('bobot_overrides', {});
    const out = {};
    const meta = window.PKKM_KOMPONEN_META || window.PKKM_KOMPONEN;
    for (const k of meta) {
      out[k.code] = (overrides[k.code] != null) ? Number(overrides[k.code]) : (k.bobot_default ?? 20);
    }
    return out;
  },
  setBobot(map) { this.set('bobot_overrides', map); },
};

// === Hitung Nilai (per sub-aspek dari indikator, lalu rata komponen) ===
function hitungNilaiAspek(penilaian_id, komponenCode, aspekKode) {
  const k = window.PKKM_KOMPONEN.find(x => x.code === komponenCode);
  if (!k) return { nilai: 0, total: 0, terisi: 0, sumSkor: 0 };
  const a = k.aspek.find(x => x.kode === aspekKode);
  if (!a) return { nilai: 0, total: 0, terisi: 0, sumSkor: 0 };
  const skorRows = Skor.forPenilaian(penilaian_id);
  let sum = 0, terisi = 0;
  for (const ind of a.indikator) {
    const id = `${k.code}_${a.kode}_${ind.no}`;
    const row = skorRows.find(s => s.indikator_id === id);
    if (row && typeof row.skor === 'number' && row.skor > 0) {
      sum += row.skor;
      terisi++;
    }
  }
  const max = a.indikator.length * 4;
  const nilai = max > 0 ? (sum / max) * 100 : 0;
  return { nilai, total: a.indikator.length, terisi, sumSkor: sum, max };
}

function hitungNilaiKomponen(penilaian_id, komponenCode) {
  const k = window.PKKM_KOMPONEN.find(x => x.code === komponenCode);
  if (!k) return { nilai: 0, totalAspek: 0, aspekTerisi: 0, totalIndikator: 0, terisi: 0 };
  let sumNilaiAspek = 0;
  let aspekTerisi = 0;
  let totalIndikator = 0;
  let indTerisi = 0;
  for (const a of k.aspek) {
    const h = hitungNilaiAspek(penilaian_id, komponenCode, a.kode);
    sumNilaiAspek += h.nilai;
    if (h.terisi > 0) aspekTerisi++;
    totalIndikator += h.total;
    indTerisi += h.terisi;
  }
  // Nilai komponen = rata-rata nilai sub-aspek (Excel pakai pola yang sama)
  const nilai = k.aspek.length > 0 ? (sumNilaiAspek / k.aspek.length) : 0;
  return {
    nilai,
    totalAspek: k.aspek.length,
    aspekTerisi,
    totalIndikator,
    terisi: indTerisi,
  };
}

function hitungNilaiAkhir(penilaian_id) {
  const bobot = Meta.bobot();
  const totalBobot = Object.values(bobot).reduce((a,b)=>a+Number(b||0),0);
  let nilaiTertimbang = 0;
  const detail = [];
  for (const k of window.PKKM_KOMPONEN) {
    const h = hitungNilaiKomponen(penilaian_id, k.code);
    const w = Number(bobot[k.code] || 0);
    const kontrib = (h.nilai * w) / 100;
    nilaiTertimbang += kontrib;
    detail.push({ code: k.code, label: k.label, nilai: h.nilai, bobot: w, kontribusi: kontrib, terisi: h.terisi, total: h.totalAspek });
  }
  // normalisasi jika totalBobot != 100
  const nilaiAkhir = totalBobot > 0 ? (nilaiTertimbang * 100) / totalBobot : 0;
  return { nilaiAkhir, detail, totalBobot };
}

function progressPenilaian(penilaian_id) {
  const skorRows = Skor.forPenilaian(penilaian_id);
  const total = window.PKKM_TOTAL_INDIKATOR || 0;
  const terisi = skorRows.filter(s => s.indikator_id && typeof s.skor === 'number' && s.skor > 0).length;
  return { terisi, total, persen: total > 0 ? (terisi/total)*100 : 0 };
}

function statusBadge(persen) {
  if (persen >= 100) return { cls: 'badge-status-selesai', text: 'Selesai' };
  if (persen > 0)    return { cls: 'badge-status-sebagian', text: 'Sebagian' };
  return { cls: 'badge-status-belum', text: 'Belum' };
}

// === Backup / Restore =========================================
function backupAll() {
  const out = {
    schema: 'pkkm_v1',
    version: window.PKKM_VERSION,
    exported_at: nowLocal(),
    data: {
      kamad: pLoad(PKKM_KEYS.kamad, []),
      periode: pLoad(PKKM_KEYS.periode, []),
      penilaian: pLoad(PKKM_KEYS.penilaian, []),
      skor: pLoad(PKKM_KEYS.skor, []),
      meta: pLoad(PKKM_KEYS.meta, {}),
      instrumen_overrides: pLoad(PKKM_KEYS.instrumen_overrides, {}),
    },
  };
  return out;
}

function restoreAll(payload) {
  if (!payload || payload.schema !== 'pkkm_v1') throw new Error('Format backup tidak valid (schema mismatch).');
  const d = payload.data || {};
  if (d.kamad) pSave(PKKM_KEYS.kamad, d.kamad);
  if (d.periode) pSave(PKKM_KEYS.periode, d.periode);
  if (d.penilaian) pSave(PKKM_KEYS.penilaian, d.penilaian);
  if (d.skor) pSave(PKKM_KEYS.skor, d.skor);
  if (d.meta) pSave(PKKM_KEYS.meta, d.meta);
  if (d.instrumen_overrides) pSave(PKKM_KEYS.instrumen_overrides, d.instrumen_overrides);
  return true;
}

function wipeAll() {
  for (const k of Object.values(PKKM_KEYS)) localStorage.removeItem(k);
}

// === Expose ====================================================
window.PKKM_KEYS = PKKM_KEYS;
window.Kamad = Kamad;
window.Periode = Periode;
window.Penilaian = Penilaian;
window.Skor = Skor;
window.Meta = Meta;
window.hitungNilaiAspek = hitungNilaiAspek;
window.hitungNilaiKomponen = hitungNilaiKomponen;
window.hitungNilaiAkhir = hitungNilaiAkhir;
window.progressPenilaian = progressPenilaian;
window.statusBadge = statusBadge;
window.backupAll = backupAll;
window.restoreAll = restoreAll;
window.wipeAll = wipeAll;
window.nowLocal = nowLocal;
