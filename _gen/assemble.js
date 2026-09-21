#!/usr/bin/env node
/* Rakit instrumen MI/MTs/MA v3 (modernisasi Opsi C) dari chunk OUT_*.json.
 * Validasi: 29 aspek, 108 indikator, ID identik dengan instrumen lama, rubrik lengkap. */
const fs = require('fs'), vm = require('vm'), path = require('path');
const DIR = path.join(__dirname);
const APP = path.resolve(__dirname, '..');

// 1) Muat struktur lama sebagai referensi (urutan aspek, unsur, no, jml indikator)
const sb = { console }; sb.window = sb; vm.createContext(sb);
vm.runInContext(fs.readFileSync(path.join(APP, 'instrumen.js'), 'utf8'), sb, { filename: 'instrumen.js' });
const OLD = sb.PKKM_INSTRUMEN_PENGAWAS;
const META = sb.PKKM_KOMPONEN_META;

// 2) Urutan kode yang diharapkan
const order = [];
for (const k of OLD) for (const a of k.aspek) order.push(a.kode);

// 3) Muat chunk
const CHUNKS = ['OUT_E1.json','OUT_E2.json','OUT_E3.json','OUT_E4.json','OUT_E5.json','OUT_C.json'];
const byKode = new Map();
for (const f of CHUNKS) {
  const p = path.join(DIR, f);
  if (!fs.existsSync(p)) { console.log('MISSING '+f); continue; }
  let data;
  try { data = JSON.parse(fs.readFileSync(p,'utf8')); }
  catch (e) { console.log('RUSAK '+f+': '+e.message); continue; }
  for (const a of data) { if (byKode.has(a.kode)) console.log('DUPLIKAT aspek '+a.kode+' di '+f); byKode.set(a.kode, a); }
}

// 4) Validasi kelengkapan aspek
const missing = order.filter(k => !byKode.has(k));
if (missing.length) { console.log('ASPEK KURANG: '+missing.join(', ')); process.exit(2); }
console.log('Semua '+order.length+' aspek tersedia.');

// 5) Rakit per komponen + validasi ID
const build = [];
let totInd = 0, totRub = 0, idMismatch = [];
for (const k of OLD) {
  const kNew = { no: k.no, code: k.code, label: k.label, aspek: [] };
  for (const a of k.aspek) {
    const na = byKode.get(a.kode);
    if (na.no !== a.no) console.log('WARN no aspek beda '+a.kode+' old='+a.no+' new='+na.no);
    if (na.indikator.length !== a.indikator.length) {
      console.log('WARN jumlah indikator beda '+a.kode+' old='+a.indikator.length+' new='+na.indikator.length);
    }
    const asp = { kode: a.kode, no: a.no, unsur: na.unsur !== undefined ? na.unsur : a.unsur, indikator: [] };
    a.indikator.forEach((oldInd, idx) => {
      const n = na.indikator[idx];
      if (!n) { console.log('MISSING indikator '+k.code+'_'+a.kode+'_'+oldInd.no); return; }
      if (n.no !== oldInd.no) idMismatch.push(k.code+'_'+a.kode+'_'+oldInd.no+' vs new.no='+n.no);
      const ind = {
        no: oldInd.no,
        indikator: n.indikator,
        penggalian: n.penggalian || '',
        data: n.data || '',
        bukti: n.bukti || '',
        rubrik: n.rubrik || null
      };
      asp.indikator.push(ind);
      totInd++;
      if (ind.rubrik && ind.rubrik['1'] && ind.rubrik['2'] && ind.rubrik['3'] && ind.rubrik['4']) totRub++;
      else console.log('RUBRIK KURANG '+k.code+'_'+a.kode+'_'+oldInd.no);
    });
    kNew.aspek.push(asp);
  }
  build.push(kNew);
}
if (idMismatch.length) { console.log('ID MISMATCH: '+idMismatch.slice(0,10).join(' | ')); }

console.log('TOTAL indikator='+totInd+' rubrikLengkap='+totRub);
if (totInd !== 108) { console.log('GAGAL: indikator != 108'); process.exit(3); }
if (totRub !== 108) { console.log('GAGAL: rubrik lengkap != 108'); process.exit(4); }
if (idMismatch.length) { console.log('GAGAL: ID mismatch'); process.exit(5); }

// 6) Verifikasi tidak ada istilah usang tersisa (kecuali wajar)
const SUSPECT = [['KTSP',/\bKTSP\b/],['KKM',/\bKKM\b/],['UN',/\bUN\b|Ujian Nasional/],['PAS',/\bPAS\b/],['PAT',/\bPAT\b/],['silabus',/silabus/i],['RPP',/\bRPP\b/]];
for (const k of build) for (const a of k.aspek) for (const i of a.indikator) {
  const blob = i.indikator+' '+i.penggalian+' '+i.data+' '+i.bukti;
  for (const [nm,re] of SUSPECT) if (re.test(blob)) console.log('SISA ISTILAH '+nm+' pada '+k.code+'_'+a.kode+'_'+i.no);
}

// 7) Tulis file hasil
const header = `// instrumen-mi-v3.js — Modernisasi instrumen PKKM MI/MTs/MA (Opsi C)\n` +
`// Regulasi: Kepdirjen 1111/2019 (struktur) + KMA 1503/2025, Kepdirjen 6077/2025 (Panca Cinta),\n` +
`// Permendikdasmen 21/2025, 10/2025, 12/2025, 26/2025, 1/2026.\n` +
`// 5 komponen, 29 aspek, 108 indikator — struktur & bobot TIDAK diubah.\n` +
`window.PKKM_MI_V3_VERSION = '3.0.0';\n` +
`window.PKKM_MI_V3_TIMESTAMP = '${new Date().toISOString()}';\n\n`;
const body = `window.PKKM_INSTRUMEN_MI_V3 = ${JSON.stringify(build, null, 1)};\n\n` +
`// Terapkan sebagai instrumen aktif MI/MTs/MA (RA tetap punya dataset sendiri).\n` +
`// PKKM_KOMPONEN WAJIB ikut di-override: banyak modul (db/app/laporan/excel) membacanya langsung.\n` +
`window.PKKM_INSTRUMEN_PENGAWAS = window.PKKM_INSTRUMEN_MI_V3;\n` +
`window.PKKM_INSTRUMEN_GTK = window.PKKM_INSTRUMEN_MI_V3;\n` +
`window.PKKM_KOMPONEN = window.PKKM_INSTRUMEN_MI_V3;\n` +
`window.PKKM_TOTAL_INDIKATOR = window.PKKM_INSTRUMEN_MI_V3.reduce(\n` +
`  (s, k) => s + k.aspek.reduce((s2, a) => s2 + (a.indikator ? a.indikator.length : 0), 0), 0\n` +
`);\n`;
fs.writeFileSync(path.join(APP, 'instrumen-mi-v3.js'), header + body);
console.log('OK ditulis instrumen-mi-v3.js');
