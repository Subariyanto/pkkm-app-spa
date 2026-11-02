const $ = (id) => document.getElementById(id);
const url = window.PKKM_SUPABASE_URL;
const key = window.PKKM_SUPABASE_KEY;
const api = url + '/rest/v1/rpc/';

let rows = [];          // daftar sesi
let adminKey = '';
let selected = null;    // sesi yang sedang diedit
let draft = [];         // daftar madrasah di modal
let removed = [];       // id madrasah yang dihapus saat modal disimpan

async function rpc(name, body) {
  const r = await fetch(api + name, {
    method: 'POST',
    headers: { apikey: key, Authorization: '***' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw Error('Server ' + r.status + ' ' + (await r.text()));
  return r.json();
}

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function fmt(d) {
  return d ? new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Belum ditentukan';
}

function mapLink(v) {
  if (!v) return '';
  const u = /^https?:\/\//i.test(v) ? v : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(v);
  return `<a class="map-icon" href="${esc(u)}" target="_blank" rel="noopener" title="Buka lokasi di Google Maps" aria-label="Buka lokasi di Google Maps"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z"/></svg></a>`;
}

/* ---------- foto penilai ---------- */
function loadEvaluatorImages() {
  return rpc('pkkm_public_evaluators', {})
    .then((xs) => xs.forEach((x) => { const im = $('evaluator-photo-' + x.slot); if (im && x.image_data) im.src = x.image_data; }))
    .catch(console.warn);
}

function prepareEvaluatorUploads() {
  const files = {};
  for (const slot of [1, 2]) {
    const input = $('upload-evaluator-' + slot);
    if (!input) continue;
    input.onchange = (e) => {
      const f = e.target.files[0];
      if (!f) return;
      if (!f.type.startsWith('image/')) return alert('Pilih file gambar.');
      if (f.size > 8 * 1024 * 1024) return alert('Ukuran foto maksimal 8 MB.');
      const img = new Image();
      const objectUrl = URL.createObjectURL(f);
      img.onload = () => {
        const scale = Math.min(1, 900 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        files[slot] = canvas.toDataURL('image/jpeg', 0.78);
        $('evaluator-photo-' + slot).src = files[slot];
        URL.revokeObjectURL(objectUrl);
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); alert('Foto tidak dapat dibuka.'); };
      img.src = objectUrl;
    };
  }
  $('save-evaluators').onclick = async () => {
    const status = $('evaluator-status');
    try {
      if (!Object.keys(files).length) return alert('Pilih foto terlebih dahulu.');
      status.textContent = 'Menyimpan foto…';
      for (const slot of Object.keys(files)) {
        await rpc('pkkm_admin_save_evaluator', { p_admin_key: adminKey, p_slot: Number(slot), p_image_data: files[slot] });
      }
      for (const k of Object.keys(files)) delete files[k];
      status.textContent = 'Foto penilai berhasil disimpan.';
    } catch (e) {
      status.textContent = 'Gagal menyimpan foto penilai.';
      console.error(e);
    }
  };
  loadEvaluatorImages();
}

/* ---------- render daftar sesi ---------- */
function totalMadrasah() {
  return rows.reduce((n, s) => n + (s.madrasah ? s.madrasah.length : 0), 0);
}

function render() {
  const total = totalMadrasah();
  const terjadwal = rows.filter((s) => s['Tanggal PKKM']).reduce((n, s) => n + (s.madrasah ? s.madrasah.length : 0), 0);
  $('stats').innerHTML = `<div class="stat"><b>${total}</b>Total madrasah</div><div class="stat"><b>${terjadwal}</b>Terjadwal</div><div class="stat"><b>${total - terjadwal}</b>Belum dijadwalkan</div>`;

  const q = $('q').value.toLowerCase();
  const f = $('filter').value;
  const list = rows.filter((s) => {
    const hay = [s.Tempat, s['Tanggal PKKM'], ...(s.madrasah || []).map((m) => m['Nama Madrasah'] + ' ' + m['Nama Kepala Madrasah'])].join(' ');
    if (!hay.toLowerCase().includes(q)) return false;
    if (f === 'yes') return !!s['Tanggal PKKM'];
    if (f === 'no') return !s['Tanggal PKKM'];
    return true;
  });

  if (!list.length) {
    $('cards').innerHTML = '<p class="notice">Belum ada sesi jadwal. Klik “+ Tambah sesi” untuk mulai.</p>';
    return;
  }

  $('cards').innerHTML = list.map((s) => {
    const items = s.madrasah || [];
    return `<article class="schedule day-card">
      <div class="row day-heading"><div class="date">${s['Tanggal PKKM'] ? fmt(s['Tanggal PKKM']) : 'Belum ditentukan'}</div><span class="badge">${items.length} madrasah</span></div>
      <div class="row session-meta"><span class="jam">${s.Jam ? 'Jam: ' + esc(s.Jam) + ' WIB' : 'Jam belum ditentukan'}</span></div>
      <div class="tempat">Ditempatkan di: <b>${s.Tempat ? esc(s.Tempat) : 'belum ditentukan'}</b></div>
      ${s.Lokasi ? `<div class="minor">Lokasi: ${mapLink(s.Lokasi)}</div>` : ''}
      <ol class="school-list">${items.map((m) => `<li><span class="school">${esc(m['Nama Madrasah'])}</span><span class="principal">${esc(m['Nama Kepala Madrasah'])}</span></li>`).join('') || '<li class="minor">Belum ada madrasah</li>'}</ol>
      ${s.Catatan ? `<div class="minor">${esc(s.Catatan)}</div>` : ''}
      <div class="actions"><button class="btn" data-edit="${s.id}">Edit</button><button class="btn light" data-share="${s.id}">Salin tautan</button></div>
    </article>`;
  }).join('');

  document.querySelectorAll('[data-edit]').forEach((b) => { b.onclick = () => edit(b.dataset.edit); });
  document.querySelectorAll('[data-share]').forEach((b) => { b.onclick = () => share(b.dataset.share); });
}

/* ---------- modal sesi ---------- */
function rowHtml(m) {
  return `<div class="mrow" data-row>
    <span class="mrow-no"></span>
    <input class="m-nama" type="text" placeholder="Nama madrasah" value="${esc(m['Nama Madrasah'] || '')}">
    <input class="m-kepala" type="text" placeholder="Nama kepala madrasah" value="${esc(m['Nama Kepala Madrasah'] || '')}">
    <button type="button" class="btn danger tiny" data-drop>×</button>
  </div>`;
}

function paintRows() {
  $('rows').innerHTML = draft.map(rowHtml).join('') || '<p class="minor">Belum ada madrasah. Klik “+ Tambah madrasah”.</p>';
  $('rows').querySelectorAll('[data-row]').forEach((row, i) => {
    row.querySelector('.mrow-no').textContent = i + 1 + '.';
    row.querySelector('[data-drop]').onclick = () => {
      if (draft[i].id) removed.push(draft[i].id);
      readRows();
      draft.splice(i, 1);
      paintRows();
    };
  });
}

function readRows() {
  const nodes = $('rows').querySelectorAll('[data-row]');
  nodes.forEach((node, i) => {
    if (!draft[i]) return;
    draft[i]['Nama Madrasah'] = node.querySelector('.m-nama').value;
    draft[i]['Nama Kepala Madrasah'] = node.querySelector('.m-kepala').value;
  });
}

function edit(id) {
  selected = rows.find((x) => String(x.id) === String(id));
  if (!selected) return;
  draft = (selected.madrasah || []).map((m) => ({ ...m }));
  removed = [];
  $('modal-title').textContent = 'Edit sesi jam ' + (selected.Jam || '-');
  $('del').style.display = '';
  $('date').value = selected['Tanggal PKKM'] || '';
  $('time').value = selected.Jam || '';
  $('place').value = selected.Tempat || '';
  $('location').value = selected.Lokasi || '';
  $('notes').value = selected.Catatan || '';
  paintRows();
  $('modal').style.display = 'flex';
}

function addNew() {
  selected = null;
  draft = [{ 'Nama Madrasah': '', 'Nama Kepala Madrasah': '' }];
  removed = [];
  $('modal-title').textContent = 'Tambah sesi jadwal';
  $('del').style.display = 'none';
  $('date').value = '';
  $('time').value = '';
  $('place').value = '';
  $('location').value = '';
  $('notes').value = '';
  paintRows();
  $('modal').style.display = 'flex';
  $('date').focus();
}

async function share(id) {
  const s = rows.find((r) => String(r.id) === String(id));
  if (!s) return;
  const link = location.origin + location.pathname.replace(/index\.html?$/, '') + 'view.html#' + s.share_id;
  try { await navigator.clipboard.writeText(link); alert('Tautan disalin:\n' + link); }
  catch { prompt('Salin tautan ini:', link); }
}

/* ---------- bootstrap ---------- */
if ($('cards')) {
  $('q').oninput = render;
  $('filter').onchange = render;
  $('cancel').onclick = () => { $('modal').style.display = 'none'; };
  $('modal').onclick = (e) => { if (e.target === $('modal')) $('modal').style.display = 'none'; };

  $('add-row').onclick = () => { readRows(); draft.push({ 'Nama Madrasah': '', 'Nama Kepala Madrasah': '' }); paintRows(); };

  $('save').onclick = async () => {
    readRows();
    const nama = $('place').value.trim();
    const daftar = draft
      .map((m) => ({ id: m.id || null, nama: String(m['Nama Madrasah'] || '').trim(), kepala: String(m['Nama Kepala Madrasah'] || '').trim() }))
      .filter((m) => m.nama || m.kepala);

    if (!daftar.length) return alert('Tambahkan minimal satu madrasah pada sesi ini.');
    const kosong = daftar.find((m) => !m.nama || !m.kepala);
    if (kosong) return alert('Nama madrasah dan nama kepala madrasah harus diisi lengkap.');

    const btn = $('save');
    btn.disabled = true;
    btn.textContent = 'Menyimpan…';
    try {
      const sid = await rpc('pkkm_admin_session_save', {
        p_admin_key: adminKey, p_id: selected ? selected.id : null,
        p_tanggal: $('date').value || null, p_jam: $('time').value,
        p_tempat: nama || daftar[0].nama, p_lokasi: $('location').value, p_catatan: $('notes').value,
      });
      for (const id of removed) {
        await rpc('pkkm_admin_madrasah_delete', { p_admin_key: adminKey, p_id: id });
      }
      for (const m of daftar) {
        await rpc('pkkm_admin_madrasah_save', {
          p_admin_key: adminKey, p_id: m.id, p_session_id: sid,
          p_nama_madrasah: m.nama, p_nama_kepala: m.kepala,
        });
      }
      rows = await rpc('pkkm_admin_list', { p_admin_key: adminKey });
      $('modal').style.display = 'none';
      render();
    } catch (e) {
      alert('Gagal menyimpan: ' + e.message);
      console.error(e);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Simpan perubahan';
    }
  };

  $('del').onclick = async () => {
    if (!selected) return;
    if (!confirm('Hapus seluruh sesi jam ' + (selected.Jam || '-') + ' beserta ' + (selected.madrasah || []).length + ' madrasah di dalamnya?')) return;
    try {
      await rpc('pkkm_admin_session_delete', { p_admin_key: adminKey, p_id: selected.id });
      rows = await rpc('pkkm_admin_list', { p_admin_key: adminKey });
      $('modal').style.display = 'none';
      render();
    } catch (e) {
      alert('Gagal menghapus: ' + e.message);
      console.error(e);
    }
  };

  $('export').onclick = () => {
    const head = ['Tanggal PKKM', 'Jam', 'Ditempatkan di', 'Nama Madrasah', 'Nama Kepala Madrasah', 'Lokasi', 'Catatan'];
    const lines = [head];
    rows.forEach((s) => {
      (s.madrasah || []).forEach((m) => lines.push([s['Tanggal PKKM'] || '', s.Jam || '', s.Tempat || '', m['Nama Madrasah'], m['Nama Kepala Madrasah'], s.Lokasi || '', s.Catatan || '']));
    });
    const csv = lines.map((r) => r.map((v) => '"' + String(v).replaceAll('"', '""') + '"').join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'jadwal-pkkm.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  startAdmin();
} else if ($('card')) {
  const token = (location.hash || '').replace(/^#/, '');
  rpc('pkkm_public_schedule', { p_share_id: token }).then((x) => {
    if (!x || !x.Tempat) throw Error('kosong');
    loadEvaluatorImages();
    document.title = 'Jadwal PKKM · ' + x.Tempat;
    const items = x.madrasah || [];
    $('card').innerHTML = `<div class="minor">JADWAL PENILAIAN KINERJA KEPALA MADRASAH</div>
      <div class="date">${fmt(x['Tanggal PKKM'])}${x.Jam ? ' · Jam: ' + esc(x.Jam) + ' WIB' : ''}</div>
      <p class="principal">Ditempatkan di: <b>${esc(x.Tempat)}</b></p>
      ${x.Lokasi ? `<p><b>Lokasi:</b> ${mapLink(x.Lokasi)}</p>` : ''}
      <ol class="school-list viewer-list">${items.map((m) => `<li><span class="school">${esc(m['Nama Madrasah'])}</span><span class="principal">Kepala Madrasah: ${esc(m['Nama Kepala Madrasah'])}</span></li>`).join('')}</ol>
      ${x.Catatan ? `<p><b>Catatan:</b> ${esc(x.Catatan)}</p>` : ''}
      <p class="minor">KKMA 04 Jember · PKKM 2026</p>`;
  }).catch(() => {
    $('card').innerHTML = '<p class="error">Tautan jadwal tidak valid atau belum tersedia.</p>';
  });
}

async function startAdmin() {
  try {
    adminKey = sessionStorage.getItem('pkkm-admin-key') || prompt('Kata sandi admin tim penilai:') || '';
    if (!adminKey) return;
    rows = await rpc('pkkm_admin_list', { p_admin_key: adminKey });
    sessionStorage.setItem('pkkm-admin-key', adminKey);
    render();
    if ($('upload-evaluator-1')) prepareEvaluatorUploads();
  } catch (e) {
    sessionStorage.removeItem('pkkm-admin-key');
    adminKey = '';
    $('cards').innerHTML = '<p class="error">Gagal memuat jadwal. Periksa koneksi dan kata sandi admin.</p>';
    console.error(e);
  }
}
