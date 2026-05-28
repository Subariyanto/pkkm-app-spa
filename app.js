// app.js - PKKM SPA main router & views
// Hash routing: #/, #/kamad, #/kamad/:id, #/penilaian, #/penilaian/:kamadId/:periodeId,
//               #/rekap, #/cetak, #/cetak/:penilaianId, #/instrumen, #/backup, #/pengaturan

const APP_VERSION = window.PKKM_VERSION || '1.0.0';

// === Util ======================================================
function $(sel, root) { return (root||document).querySelector(sel); }
function $$(sel, root) { return Array.from((root||document).querySelectorAll(sel)); }

function escapeHTML(s) {
  if (s == null) return '';
  return String(s)
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

function toast(msg, type='success') {
  const host = $('#toastHost');
  const el = document.createElement('div');
  el.className = `toast-fixed alert alert-${type === 'error' ? 'danger' : type === 'info' ? 'info' : 'success'} shadow-sm`;
  el.style.position = 'fixed';
  el.style.top = '1rem';
  el.style.right = '1rem';
  el.style.zIndex = 1080;
  el.innerHTML = escapeHTML(msg);
  host.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 2200);
  setTimeout(() => el.remove(), 2700);
}

function confirmAction(msg) { return window.confirm(msg); }

// === Bukti dukung helpers ======================================
const MAX_IMG_DIM = 1200;       // resize max width/height (px)
const MAX_IMG_QUALITY = 0.78;
const MAX_BUKTI_BYTES = 1.5 * 1024 * 1024; // 1.5 MB warn threshold per bukti

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error || new Error('read failed'));
    r.readAsDataURL(file);
  });
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_IMG_DIM || height > MAX_IMG_DIM) {
        const scale = Math.min(MAX_IMG_DIM / width, MAX_IMG_DIM / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL('image/jpeg', MAX_IMG_QUALITY);
      resolve({ dataUrl, width, height });
    };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(new Error('image decode failed')); };
    img.src = url;
  });
}

async function fileToBukti(file) {
  const isImage = file.type.startsWith('image/');
  let dataUrl, mime;
  if (isImage) {
    try {
      const c = await compressImage(file);
      dataUrl = c.dataUrl;
      mime = 'image/jpeg';
    } catch (e) {
      // fallback to raw
      dataUrl = await readFileAsDataURL(file);
      mime = file.type || 'image/*';
    }
  } else {
    dataUrl = await readFileAsDataURL(file);
    mime = file.type || 'application/octet-stream';
  }
  return {
    name: file.name,
    mime,
    size: dataUrl.length,        // approx
    dataUrl,
    added_at: nowLocal(),
  };
}

function buktiBadgeHTML(b, index, isFinal) {
  const isImg = (b.mime || '').startsWith('image/');
  const sizeKB = b.size ? Math.round(b.size / 1024) : 0;
  const safeName = escapeHTML(b.name || `bukti-${index+1}`);
  const thumb = isImg
    ? `<img class="bukti-thumb" src="${b.dataUrl}" alt="${safeName}" data-action="open-bukti" data-bukti-idx="${index}" style="cursor:pointer;">`
    : `<a class="btn btn-sm btn-outline-secondary" href="${b.dataUrl}" target="_blank" download="${safeName}"><i class="bi bi-file-earmark-pdf"></i> ${safeName}</a>`;
  const removeBtn = isFinal ? '' : `<button type="button" class="btn btn-sm btn-link text-danger p-0 ms-1" data-action="remove-bukti" data-bukti-idx="${index}" title="Hapus bukti"><i class="bi bi-x-circle"></i></button>`;
  return `<span class="d-inline-flex align-items-center gap-1 me-1" data-bukti-wrapper="${index}" title="${safeName} (${sizeKB} KB)">${thumb}${removeBtn}</span>`;
}

function openPenggalianModal(indikator_id) {
  const info = window.getIndikatorById?.(indikator_id);
  if (!info) {
    // Fallback for legacy aspek_id
    const legacy = window.getAspekById?.(indikator_id);
    if (legacy) return openPenggalianModalLegacy(legacy);
    toast('Indikator tidak ditemukan.', 'error');
    return;
  }
  const k = info.komponen, a = info.aspek, ind = info.indikator;
  const buktiText = (ind.bukti||'').trim();
  const dataText = (ind.data||'').trim();
  const buktiHtml = buktiText
    ? `<pre class="bukti-fisik mb-0 p-2 bg-light rounded" style="white-space:pre-wrap;font-family:inherit;font-size:0.9rem">${escapeHTML(buktiText)}</pre>`
    : `<div class="text-muted text-tiny"><i class="bi bi-info-circle"></i> Belum ada panduan bukti fisik untuk indikator ini.</div>`;
  const html = `
    <div class="modal fade" id="penggalianModal" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header bg-light">
            <div>
              <div class="text-tiny text-muted">${k.no}. ${escapeHTML(k.label)}</div>
              <div class="text-tiny text-muted">${escapeHTML(a.kode)} · ${escapeHTML(a.unsur||'')}</div>
              <h5 class="modal-title mb-0 mt-1"><i class="bi bi-search text-primary"></i> Indikator ${ind.no}</h5>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-primary py-2 mb-3">
              <strong>Indikator Kinerja:</strong><br>${escapeHTML(ind.indikator||'-')}
            </div>
            <div class="mb-3">
              <div class="fw-semibold mb-1"><i class="bi bi-clipboard-data text-success"></i> Data Yang Diharapkan</div>
              <div class="text-tiny">${escapeHTML(dataText) || '<span class="text-muted">-</span>'}</div>
            </div>
            <div class="mb-2">
              <div class="fw-semibold mb-1"><i class="bi bi-folder2-open text-warning"></i> Bukti Fisik / Cara Penggalian Data</div>
              ${buktiHtml}
            </div>
          </div>
          <div class="modal-footer">
            <span class="text-tiny text-muted me-auto"><i class="bi bi-lightbulb"></i> Skor: 1=Kurang, 2=Cukup, 3=Baik, 4=Amat Baik</span>
            <button type="button" class="btn btn-light" data-bs-dismiss="modal">Tutup</button>
          </div>
        </div>
      </div>
    </div>`;
  let host = document.getElementById('penggalianModalHost');
  if (!host) { host = document.createElement('div'); host.id = 'penggalianModalHost'; document.body.appendChild(host); }
  host.innerHTML = html;
  const m = new bootstrap.Modal(document.getElementById('penggalianModal'));
  m.show();
}

// Legacy fallback (v1 aspek_id) - kept for backward compat
function openPenggalianModalLegacy(info) {
  const k = info.komponen, a = info.aspek, p = info.penggalian;
  const renderList = (label, icon, items) => {
    if (!items || !items.length) return '';
    return `<div class="mb-3"><div class="fw-semibold mb-1"><i class="bi ${icon} text-primary"></i> ${label}</div><ul class="mb-0 ps-3 text-tiny">${items.map(t => `<li>${escapeHTML(t)}</li>`).join('')}</ul></div>`;
  };
  const body = p ? `${renderList('Dokumen', 'bi-folder2-open', p.dokumen)}${renderList('Observasi', 'bi-eye', p.observasi)}${renderList('Wawancara', 'bi-chat-dots', p.wawancara)}` : '<div class="text-muted">Tidak ada panduan.</div>';
  const html = `<div class="modal fade" id="penggalianModal" tabindex="-1"><div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"><div class="modal-content"><div class="modal-header"><h5 class="modal-title">${escapeHTML(a.judul||'')}</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body">${body}</div></div></div></div>`;
  let host = document.getElementById('penggalianModalHost');
  if (!host) { host = document.createElement('div'); host.id = 'penggalianModalHost'; document.body.appendChild(host); }
  host.innerHTML = html;
  new bootstrap.Modal(document.getElementById('penggalianModal')).show();
}

function openBuktiPreview(bukti) {
  const isImg = (bukti.mime || '').startsWith('image/');
  const html = `
    <div class="modal fade" id="buktiPreviewModal" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${escapeHTML(bukti.name||'Bukti')}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-center">
            ${isImg
              ? `<img src="${bukti.dataUrl}" class="img-fluid" style="max-height:75vh;">`
              : `<embed src="${bukti.dataUrl}" type="${bukti.mime}" style="width:100%; height:75vh;">`}
          </div>
          <div class="modal-footer">
            <a class="btn btn-outline-primary" href="${bukti.dataUrl}" download="${escapeHTML(bukti.name||'bukti')}"><i class="bi bi-download"></i> Download</a>
            <button type="button" class="btn btn-light" data-bs-dismiss="modal">Tutup</button>
          </div>
        </div>
      </div>
    </div>`;
  let host = document.getElementById('buktiPreviewHost');
  if (!host) { host = document.createElement('div'); host.id = 'buktiPreviewHost'; document.body.appendChild(host); }
  host.innerHTML = html;
  const m = new bootstrap.Modal(document.getElementById('buktiPreviewModal'));
  m.show();
}


function setActiveNav(hash) {
  $$('#mainNav .nav-link').forEach(a => {
    if (a.getAttribute('href') === hash) a.classList.add('active');
    else a.classList.remove('active');
  });
}

// === Router ====================================================
const routes = [];
function route(pattern, handler) {
  // pattern: '#/kamad/:id'
  const re = new RegExp('^' + pattern.replace(/:[^/]+/g, '([^/]+)') + '$');
  const params = (pattern.match(/:[^/]+/g) || []).map(s => s.slice(1));
  routes.push({ pattern, re, params, handler });
}

function navigate(hash) {
  if (location.hash !== hash) location.hash = hash;
  else render();
}

async function render() {
  const hash = location.hash || '#/';
  const root = $('#appRoot');
  setActiveNav(hash.split('/').slice(0,2).join('/'));
  for (const r of routes) {
    const m = hash.match(r.re);
    if (m) {
      const params = {};
      r.params.forEach((p, i) => params[p] = decodeURIComponent(m[i+1]));
      try {
        await r.handler(root, params);
      } catch (e) {
        console.error(e);
        root.innerHTML = `<div class="alert alert-danger">Error: ${escapeHTML(e.message)}</div>`;
      }
      window.scrollTo(0, 0);
      return;
    }
  }
  root.innerHTML = `<div class="alert alert-warning">Halaman tidak ditemukan: ${escapeHTML(hash)} <a href="#/">Kembali ke Beranda</a></div>`;
}

window.addEventListener('hashchange', render);

// === Routes ====================================================

// --- Beranda ---------------------------------------------------
route('#/', (root) => {
  const kamadList = Kamad.list();
  const periodeList = Periode.list();
  const allP = Penilaian.list();
  const totalPenilaian = allP.length;
  const finalCount = allP.filter(p => p.status === 'final').length;

  root.innerHTML = `
    <div class="row g-3">
      <div class="col-12">
        <div class="card border-0">
          <div class="card-body">
            <h4 class="mb-1"><i class="bi bi-mortarboard-fill text-primary"></i> Aplikasi PKKM</h4>
            <p class="text-muted mb-0">Penilaian Kinerja Kepala Madrasah - Pokjawas Kemenag Jember</p>
          </div>
        </div>
      </div>
      <div class="col-md-3 col-6">
        <a href="#/kamad" class="text-decoration-none">
          <div class="card kamad-card h-100">
            <div class="card-body">
              <div class="text-muted text-tiny">Kepala Madrasah</div>
              <div class="display-6 text-primary fw-bold">${kamadList.length}</div>
              <div class="text-tiny"><i class="bi bi-person-badge"></i> Data terdaftar</div>
            </div>
          </div>
        </a>
      </div>
      <div class="col-md-3 col-6">
        <a href="#/penilaian" class="text-decoration-none">
          <div class="card kamad-card h-100">
            <div class="card-body">
              <div class="text-muted text-tiny">Periode</div>
              <div class="display-6 text-primary fw-bold">${periodeList.length}</div>
              <div class="text-tiny"><i class="bi bi-calendar3"></i> Periode penilaian</div>
            </div>
          </div>
        </a>
      </div>
      <div class="col-md-3 col-6">
        <a href="#/penilaian" class="text-decoration-none">
          <div class="card kamad-card h-100">
            <div class="card-body">
              <div class="text-muted text-tiny">Total Penilaian</div>
              <div class="display-6 text-primary fw-bold">${totalPenilaian}</div>
              <div class="text-tiny"><i class="bi bi-clipboard-check"></i> Tersimpan</div>
            </div>
          </div>
        </a>
      </div>
      <div class="col-md-3 col-6">
        <a href="#/rekap" class="text-decoration-none">
          <div class="card kamad-card h-100">
            <div class="card-body">
              <div class="text-muted text-tiny">Sudah Final</div>
              <div class="display-6 text-primary fw-bold">${finalCount}</div>
              <div class="text-tiny"><i class="bi bi-check2-circle"></i> Disahkan</div>
            </div>
          </div>
        </a>
      </div>

      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header"><i class="bi bi-stars"></i> Aksi Cepat</div>
          <div class="card-body d-grid gap-2">
            <a href="#/kamad" class="btn btn-outline-primary"><i class="bi bi-person-plus"></i> Kelola Data Kepala Madrasah</a>
            <a href="#/import" class="btn btn-outline-primary"><i class="bi bi-file-earmark-arrow-up"></i> Import Excel + Integrasi PKG</a>
            <a href="#/penilaian" class="btn btn-outline-primary"><i class="bi bi-clipboard-data"></i> Mulai / Lanjutkan Penilaian</a>
            <a href="#/rekap" class="btn btn-outline-primary"><i class="bi bi-bar-chart"></i> Lihat Rekap Nilai</a>
            <a href="#/rekap-kkma" class="btn btn-outline-primary"><i class="bi bi-diagram-3"></i> Rekap per KKMA</a>
            <a href="#/cetak" class="btn btn-outline-primary"><i class="bi bi-printer"></i> Cetak Laporan</a>
            <a href="#/backup" class="btn btn-outline-secondary"><i class="bi bi-cloud-arrow-down"></i> Backup / Restore</a>
          </div>
        </div>
      </div>

      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header"><i class="bi bi-info-circle"></i> Komponen Penilaian</div>
          <div class="card-body">
            <ol class="mb-0 ps-3">
              ${window.PKKM_KOMPONEN.map(k => `
                <li class="mb-1">
                  <strong>${escapeHTML(k.label)}</strong>
                  <span class="text-tiny text-muted"> (${k.aspek.length} aspek, bobot default ${k.bobot_default}%)</span>
                </li>
              `).join('')}
            </ol>
            <hr>
            <div class="text-tiny text-muted">
              Skor 1-4 per aspek. Nilai komponen = (Σskor / Σmaks) × 100.
              Nilai akhir = Σ(nilai komponen × bobot) / Σbobot.
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
});

// --- Daftar Kamad ----------------------------------------------
route('#/kamad', (root) => {
  const list = Kamad.list();
  root.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0"><i class="bi bi-people"></i> Data Kepala Madrasah</h5>
      <button class="btn btn-primary btn-sm" id="btnAddKamad"><i class="bi bi-plus-lg"></i> Tambah</button>
    </div>
    <div class="card">
      <div class="card-body p-0">
        ${list.length === 0
          ? `<div class="text-center text-muted py-4">Belum ada data. Klik <strong>Tambah</strong> untuk menambah kepala madrasah.</div>`
          : `<div class="table-responsive"><table class="table table-hover mb-0 align-middle">
              <thead class="table-light">
                <tr>
                  <th width="40">#</th>
                  <th>Nama / NIP</th>
                  <th>Madrasah</th>
                  <th width="80">Jenjang</th>
                  <th width="120">Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${list.map((k, i) => `
                  <tr>
                    <td>${i+1}</td>
                    <td>
                      <div class="fw-semibold">${escapeHTML(k.nama)}</div>
                      <div class="text-tiny text-muted">${escapeHTML(k.nip || '-')}</div>
                    </td>
                    <td>
                      <div>${escapeHTML(k.nama_madrasah || '-')}</div>
                      <div class="text-tiny text-muted">${escapeHTML(k.nsm || '')}</div>
                    </td>
                    <td><span class="badge bg-secondary">${escapeHTML(k.jenjang || '-')}</span></td>
                    <td>
                      <a href="#/kamad/${k.id}" class="btn btn-sm btn-outline-primary" title="Edit"><i class="bi bi-pencil"></i></a>
                      <a href="#/riwayat/${k.id}" class="btn btn-sm btn-outline-secondary" title="Riwayat"><i class="bi bi-clock-history"></i></a>
                      <button class="btn btn-sm btn-outline-danger" data-action="del-kamad" data-id="${k.id}"><i class="bi bi-trash"></i></button>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table></div>`}
      </div>
    </div>
  `;
  $('#btnAddKamad').addEventListener('click', () => navigate('#/kamad/new'));
  $$('[data-action="del-kamad"]').forEach(b => b.addEventListener('click', () => {
    const id = Number(b.dataset.id);
    if (confirmAction('Hapus data kepala madrasah ini? Semua penilaian terkait juga akan dihapus.')) {
      Kamad.remove(id);
      toast('Data dihapus.');
      render();
    }
  }));
});

// --- Form Kamad (new/edit) -------------------------------------
route('#/kamad/:id', (root, params) => {
  const isNew = params.id === 'new';
  const k = isNew ? { jenjang: 'MA', jabatan: 'Kepala Madrasah' } : Kamad.get(Number(params.id));
  if (!k) { root.innerHTML = `<div class="alert alert-warning">Kepala madrasah tidak ditemukan.</div>`; return; }

  root.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0"><i class="bi bi-person-badge"></i> ${isNew ? 'Tambah' : 'Edit'} Kepala Madrasah</h5>
      <a href="#/kamad" class="btn btn-sm btn-outline-secondary"><i class="bi bi-arrow-left"></i> Kembali</a>
    </div>
    <form id="kamadForm" class="card">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Nama Lengkap (dengan gelar)*</label>
            <input class="form-control" name="nama" value="${escapeHTML(k.nama||'')}" required>
          </div>
          <div class="col-md-6">
            <label class="form-label">NIP</label>
            <input class="form-control" name="nip" value="${escapeHTML(k.nip||'')}">
          </div>
          <div class="col-md-4">
            <label class="form-label">Jabatan</label>
            <input class="form-control" name="jabatan" value="${escapeHTML(k.jabatan||'Kepala Madrasah')}">
          </div>
          <div class="col-md-4">
            <label class="form-label">Jenjang*</label>
            <select class="form-select" name="jenjang" required>
              ${window.PKKM_JENJANG.map(j => `<option value="${j}" ${k.jenjang===j?'selected':''}>${j}</option>`).join('')}
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label">Masa Jabatan Mulai</label>
            <input class="form-control" type="date" name="masa_jabatan_mulai" value="${escapeHTML(k.masa_jabatan_mulai||'')}">
          </div>
          <div class="col-md-8">
            <label class="form-label">Nama Madrasah*</label>
            <input class="form-control" name="nama_madrasah" value="${escapeHTML(k.nama_madrasah||'')}" required>
          </div>
          <div class="col-md-4">
            <label class="form-label">NSM</label>
            <input class="form-control" name="nsm" value="${escapeHTML(k.nsm||'')}">
          </div>
          <div class="col-md-6">
            <label class="form-label">KKMA / Wilayah Binaan</label>
            <input class="form-control" name="kkma" value="${escapeHTML(k.kkma||'')}" placeholder="contoh: KKMA 04 Sukowono">
          </div>
          <div class="col-12">
            <label class="form-label">Alamat Madrasah</label>
            <textarea class="form-control" name="alamat" rows="2">${escapeHTML(k.alamat||'')}</textarea>
          </div>
          <div class="col-md-6">
            <label class="form-label">Telp / HP</label>
            <input class="form-control" name="telp" value="${escapeHTML(k.telp||'')}">
          </div>
          <div class="col-md-6">
            <label class="form-label">Email</label>
            <input class="form-control" type="email" name="email" value="${escapeHTML(k.email||'')}">
          </div>
        </div>
      </div>
      <div class="card-footer text-end">
        <button type="submit" class="btn btn-primary"><i class="bi bi-save"></i> Simpan</button>
      </div>
    </form>
  `;

  $('#kamadForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const data = {};
    for (const [key, val] of fd.entries()) data[key] = val;
    if (isNew) {
      const obj = Kamad.create(data);
      toast('Data tersimpan.');
      navigate(`#/kamad/${obj.id}`);
    } else {
      Kamad.update(k.id, data);
      toast('Data diperbarui.');
    }
  });
});

// --- Import / Export Excel kamad + Integrasi PKG --------------
route('#/import', (root) => {
  const ringkas = window.PKKMTools.getRingkasanPkg();
  root.innerHTML = `
    <h5 class="mb-3"><i class="bi bi-file-earmark-arrow-up"></i> Import Data &amp; Integrasi PKG</h5>
    <div class="row g-3">
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header"><i class="bi bi-people"></i> Import Kepala Madrasah (Excel)</div>
          <div class="card-body">
            <p class="text-tiny text-muted mb-2">
              Unduh template, isi datanya, lalu upload kembali. Format yang didukung: <code>.xlsx</code> / <code>.xlsm</code>.
            </p>
            <div class="d-flex gap-2 flex-wrap mb-2">
              <button class="btn btn-sm btn-outline-primary" id="btnTemplateKamad"><i class="bi bi-download"></i> Download Template</button>
            </div>
            <hr>
            <div class="mb-2">
              <label class="form-label text-tiny mb-1">File Excel</label>
              <input type="file" class="form-control form-control-sm" id="importKamadFile" accept=".xlsx,.xlsm,.xls">
            </div>
            <div class="mb-2">
              <label class="form-label text-tiny mb-1">Mode</label>
              <select class="form-select form-select-sm" id="importKamadMode">
                <option value="create">Tambah baru saja (skip duplikat)</option>
                <option value="update">Tambah baru + update yang sudah ada (match NIP/Nama+Madrasah)</option>
              </select>
            </div>
            <button class="btn btn-sm btn-primary" id="btnImportKamad"><i class="bi bi-upload"></i> Proses Import</button>
            <div id="importKamadResult" class="mt-2 text-tiny"></div>
          </div>
        </div>
      </div>

      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header"><i class="bi bi-link-45deg"></i> Integrasi Rata-rata PKG Madrasah</div>
          <div class="card-body">
            <p class="text-tiny text-muted mb-2">
              Upload file <strong>backup JSON</strong> dari PKG App SPA. Aplikasi akan menghitung rata-rata nilai PKG
              per madrasah dan menyimpannya untuk digunakan sebagai saran skor pada komponen <em>Hasil Kinerja</em>.
            </p>
            <div class="mb-2">
              <label class="form-label text-tiny mb-1">File backup PKG (.json)</label>
              <input type="file" class="form-control form-control-sm" id="pkgFile" accept=".json,application/json">
            </div>
            <button class="btn btn-sm btn-primary" id="btnPkgImport"><i class="bi bi-cloud-arrow-up"></i> Proses</button>
            <div id="pkgResult" class="mt-2 text-tiny"></div>
            ${ringkas ? `
              <hr>
              <div class="text-tiny text-muted">Ringkasan PKG terakhir di-update: ${escapeHTML(ringkas.generated_at||'-')}</div>
              <div class="table-responsive mt-2" style="max-height: 300px; overflow:auto;">
                <table class="table table-sm mb-0">
                  <thead class="table-light"><tr><th>Madrasah</th><th class="text-end">Guru</th><th class="text-end">Dinilai</th><th class="text-end">Rata PKG</th><th class="text-end">Saran Skor</th></tr></thead>
                  <tbody>
                    ${(ringkas.rows||[]).map(r => `
                      <tr>
                        <td>${escapeHTML(r.madrasah)}</td>
                        <td class="text-end">${r.jumlah_guru}</td>
                        <td class="text-end">${r.guru_dinilai}</td>
                        <td class="text-end">${r.rata_pkg!=null?fmtNilai(r.rata_pkg):'-'}</td>
                        <td class="text-end">${window.PKKMTools.suggestSkorFromPkg(r.rata_pkg) ?? '-'}</td>
                      </tr>`).join('')}
                  </tbody>
                </table>
              </div>
              <button class="btn btn-sm btn-outline-danger mt-2" id="btnClearPkg"><i class="bi bi-x-circle"></i> Hapus Ringkasan PKG</button>
            ` : `<div class="text-tiny text-muted mt-2"><i class="bi bi-info-circle"></i> Belum ada data PKG terhubung.</div>`}
          </div>
        </div>
      </div>

      <div class="col-12">
        <div class="card">
          <div class="card-header"><i class="bi bi-info-circle"></i> Catatan</div>
          <div class="card-body text-tiny text-muted">
            <ul class="mb-0">
              <li>Saran skor PKG hanya digunakan sebagai <strong>referensi</strong> untuk aspek <em>Capaian Mutu Pembelajaran</em>; pengawas tetap memberi skor final.</li>
              <li>Skala saran: rata PKG &gt; 90 → skor 4, &gt; 75 → 3, &gt; 60 → 2, selainnya 1.</li>
              <li>Pencocokan madrasah dilakukan berdasarkan field <code>nama_madrasah</code> di PKG App.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;

  $('#btnTemplateKamad')?.addEventListener('click', () => window.PKKMTools.downloadTemplateKamad());

  $('#btnImportKamad')?.addEventListener('click', async () => {
    const f = $('#importKamadFile').files[0];
    if (!f) { toast('Pilih file Excel dulu.', 'error'); return; }
    const mode = $('#importKamadMode').value;
    const out = $('#importKamadResult');
    out.innerHTML = '<div class="text-muted"><i class="bi bi-arrow-repeat"></i> Memproses...</div>';
    try {
      const rows = await window.PKKMTools.parseImportKamad(f);
      if (!rows.length) { out.innerHTML = '<div class="alert alert-warning">Tidak ada data terbaca.</div>'; return; }
      const result = window.PKKMTools.applyImportKamad(rows, { mode });
      out.innerHTML = `
        <div class="alert alert-success py-2">
          <strong>Selesai.</strong> Tambah baru: ${result.created}, update: ${result.updated}, dilewati: ${result.skipped}.
          ${result.errors.length ? `<div class="text-danger mt-1">Error: ${result.errors.length} baris</div>` : ''}
        </div>`;
      toast(`Import selesai: +${result.created} baru, ${result.updated} update.`);
    } catch (e) {
      out.innerHTML = `<div class="alert alert-danger py-2">Gagal: ${escapeHTML(e.message)}</div>`;
    }
  });

  $('#btnPkgImport')?.addEventListener('click', async () => {
    const f = $('#pkgFile').files[0];
    if (!f) { toast('Pilih file backup PKG dulu.', 'error'); return; }
    const out = $('#pkgResult');
    out.innerHTML = '<div class="text-muted"><i class="bi bi-arrow-repeat"></i> Memproses...</div>';
    try {
      const json = await window.PKKMTools.importPkgBackupJson(f);
      const rows = window.PKKMTools.ringkasanPkgPerMadrasah(json);
      if (!rows.length) { out.innerHTML = '<div class="alert alert-warning">Tidak ada data guru terbaca.</div>'; return; }
      window.PKKMTools.saveRingkasanPkg(rows);
      out.innerHTML = `<div class="alert alert-success py-2">Berhasil: ${rows.length} madrasah ter-ringkas.</div>`;
      toast('Ringkasan PKG tersimpan.');
      setTimeout(() => render(), 600);
    } catch (e) {
      out.innerHTML = `<div class="alert alert-danger py-2">Gagal: ${escapeHTML(e.message)}</div>`;
    }
  });

  $('#btnClearPkg')?.addEventListener('click', () => {
    if (!confirmAction('Hapus ringkasan PKG?')) return;
    window.Meta.set('ringkasan_pkg', null);
    toast('Ringkasan PKG dihapus.');
    render();
  });
});

// --- Penilaian: pilih kamad + periode --------------------------
route('#/penilaian', (root) => {
  const kamadList = Kamad.list();
  const periodeList = Periode.list();

  root.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0"><i class="bi bi-clipboard-data"></i> Penilaian Kinerja</h5>
      <div class="btn-group">
        <button class="btn btn-sm btn-outline-primary" id="btnAddPeriode"><i class="bi bi-calendar-plus"></i> Periode Baru</button>
      </div>
    </div>

    <div class="row g-3">
      <div class="col-md-3">
        <div class="card h-100">
          <div class="card-header py-2"><i class="bi bi-calendar3"></i> Periode</div>
          <div class="card-body p-0">
            ${periodeList.length === 0
              ? `<div class="text-center text-muted py-4 px-2"><span class="text-tiny">Belum ada periode.</span><br><button class="btn btn-sm btn-primary mt-2" id="btnAddPeriode2"><i class="bi bi-plus"></i> Buat Periode</button></div>`
              : `<ul class="list-group list-group-flush" id="periodeList">
                  ${periodeList.map(p => `
                    <li class="list-group-item d-flex justify-content-between align-items-start cursor-pointer py-2" data-periode="${p.id}">
                      <div class="flex-grow-1" style="min-width:0">
                        <div class="fw-semibold text-truncate" title="${escapeHTML(p.label)}">${escapeHTML(p.label)}</div>
                        <div class="text-tiny text-muted text-truncate">${escapeHTML(p.tanggal_penilaian||'-')} · ${escapeHTML(p.type)}</div>
                      </div>
                      <button class="btn btn-sm btn-link text-danger p-0 ms-1 flex-shrink-0" data-action="del-periode" data-id="${p.id}" title="Hapus periode"><i class="bi bi-x-circle"></i></button>
                    </li>`).join('')}
                </ul>`}
          </div>
        </div>
      </div>

      <div class="col-md-9">
        <div class="card h-100">
          <div class="card-header"><i class="bi bi-people"></i> Kepala Madrasah</div>
          <div class="card-body p-0">
            ${kamadList.length === 0
              ? `<div class="text-center text-muted py-4">Belum ada kepala madrasah. <a href="#/kamad">Tambah dulu di sini</a>.</div>`
              : `<div class="table-responsive"><table class="table table-hover mb-0 align-middle" id="kamadPenilaianTable">
                  <thead class="table-light">
                    <tr><th>Nama / Madrasah</th><th width="120">Status</th><th width="100">Aksi</th></tr>
                  </thead>
                  <tbody>
                    ${kamadList.map(k => `
                      <tr>
                        <td>
                          <div class="fw-semibold">${escapeHTML(k.nama)}</div>
                          <div class="text-tiny text-muted">${escapeHTML(k.nama_madrasah||'-')} &middot; ${escapeHTML(k.jenjang||'-')}</div>
                        </td>
                        <td><span class="text-tiny text-muted" data-status-for="${k.id}">-</span></td>
                        <td><button class="btn btn-sm btn-primary" data-action="open-penilaian" data-kamad="${k.id}"><i class="bi bi-pencil-square"></i> Nilai</button></td>
                      </tr>`).join('')}
                  </tbody>
                </table></div>`}
          </div>
        </div>
      </div>
    </div>
  `;

  function selectedPeriodeId() {
    const item = $('#periodeList .active');
    return item ? Number(item.dataset.periode) : (periodeList[0]?.id || null);
  }

  // pilih periode pertama by default
  const first = $('#periodeList li');
  if (first) first.classList.add('active');

  $$('#periodeList li').forEach(li => {
    li.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="del-periode"]')) return;
      $$('#periodeList li').forEach(x => x.classList.remove('active'));
      li.classList.add('active');
      refreshKamadStatus();
    });
  });

  function refreshKamadStatus() {
    const pid = selectedPeriodeId();
    $$('[data-status-for]').forEach(el => {
      const kid = Number(el.dataset.statusFor);
      if (!pid) { el.innerHTML = '<span class="text-muted">Pilih periode</span>'; return; }
      const sessions = Penilaian.forKamadPeriode(kid, pid);
      if (!sessions.length) { el.innerHTML = '<span class="badge badge-status-belum">Belum mulai</span>'; return; }
      const groupCount = { pengawas: 0, gtk: 0, komite: 0 };
      let allFinal = true;
      let totalProg = 0;
      for (const s of sessions) {
        const r = s.role || 'pengawas_1';
        if (r.startsWith('pengawas')) groupCount.pengawas++;
        else if (r.startsWith('guru')) groupCount.gtk++;
        else if (r === 'komite') groupCount.komite++;
        if (s.status !== 'final') allFinal = false;
        const prog = progressPenilaian(s.id);
        totalProg += prog.persen;
      }
      const avgProg = totalProg / sessions.length;
      const sb = statusBadge(avgProg);
      const finalTag = allFinal ? ' <span class="badge bg-success">FINAL</span>' : '';
      el.innerHTML = `<span class="badge ${sb.cls}">${sb.text}</span>` +
        ` <span class="text-tiny text-muted">${sessions.length} penilai</span>${finalTag}`;
    });
  }

  refreshKamadStatus();

  $$('[data-action="open-penilaian"]').forEach(b => b.addEventListener('click', () => {
    const pid = selectedPeriodeId();
    if (!pid) { toast('Buat periode dulu.', 'error'); return; }
    const kid = Number(b.dataset.kamad);
    openPilihRoleModal(kid, pid);
  }));

  $$('[data-action="del-periode"]').forEach(b => b.addEventListener('click', (e) => {
    e.stopPropagation();
    const id = Number(b.dataset.id);
    if (confirmAction('Hapus periode ini? Semua penilaian dalam periode ini akan ikut terhapus.')) {
      Periode.remove(id);
      render();
    }
  }));

  function bindAdd(btn) {
    if (!btn) return;
    btn.addEventListener('click', () => {
      openPeriodeModal();
    });
  }
  bindAdd($('#btnAddPeriode'));
  bindAdd($('#btnAddPeriode2'));
});

// Generator catatan umum & rekomendasi pembinaan otomatis
// Berdasarkan hasil penilaian: nilai akhir, sebutan, komponen tertinggi/terendah, sub-aspek terendah
// Periode tahunan (tahun_1/2/3/formatif/sumatif): komponen HK (Hasil Kinerja) di-skip karena hanya dinilai di Tahun 4
function generateCatatanRekomendasi(penilaian_id, kamad, periode) {
  const akhir = hitungNilaiAkhir(penilaian_id);
  const sebutan = window.getPKKMSebutan(akhir.nilaiAkhir);
  const sebutanLabel = sebutan ? sebutan.label : '-';
  const nilai = fmtNilai(akhir.nilaiAkhir);
  const isFourYear = periode?.type === 'tahun_4';

  // Komponen tertinggi & terendah — untuk penilaian tahunan, skip HK (Hasil Kinerja Kepala Madrasah)
  const detailFiltered = isFourYear ? [...akhir.detail] : akhir.detail.filter(d => d.code !== 'HK');
  const detailSorted = [...detailFiltered].sort((a, b) => b.nilai - a.nilai);
  const tertinggi = detailSorted[0];
  const terendah = detailSorted[detailSorted.length - 1];

  // Sub-aspek nilai terendah top 3 — juga skip komponen HK kalau bukan 4-tahunan
  const subAspeks = [];
  for (const k of (window.PKKM_INSTRUMEN_PENGAWAS || window.PKKM_KOMPONEN || [])) {
    if (!isFourYear && k.code === 'HK') continue;
    for (const a of k.aspek) {
      const ha = hitungNilaiAspek(penilaian_id, k.code, a.kode);
      if (ha.terisi > 0) {
        subAspeks.push({
          komponen: k.label,
          kode: a.kode,
          unsur: a.unsur,
          nilai: ha.nilai,
        });
      }
    }
  }
  subAspeks.sort((a, b) => a.nilai - b.nilai);
  const top3Rendah = subAspeks.slice(0, 3);

  // Catatan Umum
  const namaKamad = kamad?.nama || 'Kepala Madrasah';
  const namaMadrasah = kamad?.nama_madrasah || 'madrasah binaan';
  let catatan = `Berdasarkan hasil Penilaian Kinerja Kepala Madrasah, Saudara ${namaKamad} selaku Kepala ${namaMadrasah} memperoleh nilai akhir ${nilai} dengan sebutan "${sebutanLabel}". `;
  if (tertinggi) {
    catatan += `Komponen dengan capaian tertinggi adalah ${tertinggi.label} (nilai ${fmtNilai(tertinggi.nilai)}), menunjukkan kekuatan yang perlu dipertahankan dan dijadikan praktik baik. `;
  }
  if (terendah && tertinggi && terendah.code !== tertinggi.code) {
    catatan += `Sementara itu, komponen ${terendah.label} (nilai ${fmtNilai(terendah.nilai)}) menjadi area yang memerlukan perhatian dan pengembangan lebih lanjut. `;
  }
  catatan += `Secara keseluruhan, kinerja yang bersangkutan menunjukkan dedikasi dan komitmen dalam menjalankan tugas sebagai Kepala Madrasah.`;

  // Rekomendasi Pembinaan
  let rekomendasi = '';
  if (akhir.nilaiAkhir > 90) {
    rekomendasi = `Mempertahankan kinerja yang sudah amat baik dan menjadi mentor bagi kepala madrasah lain. `;
  } else if (akhir.nilaiAkhir > 75) {
    rekomendasi = `Meningkatkan kinerja dari kategori "Baik" menuju "Amat Baik" melalui pengembangan keprofesian berkelanjutan. `;
  } else if (akhir.nilaiAkhir > 60) {
    rekomendasi = `Diperlukan pembinaan terstruktur untuk meningkatkan kinerja dari kategori "Cukup" menuju "Baik". `;
  } else {
    rekomendasi = `Diperlukan pendampingan intensif dan pembinaan menyeluruh untuk meningkatkan kinerja kepala madrasah. `;
  }
  rekomendasi += `Fokus pengembangan diarahkan pada:\n`;
  if (top3Rendah.length) {
    top3Rendah.forEach((sa, i) => {
      rekomendasi += `${i + 1}. ${sa.unsur} (${sa.komponen}) — nilai ${fmtNilai(sa.nilai)}.\n`;
    });
  } else {
    rekomendasi += `1. Pengembangan kompetensi manajerial dan kepemimpinan.\n2. Peningkatan kualitas supervisi guru dan tenaga kependidikan.\n3. Inovasi dalam pengelolaan madrasah.\n`;
  }
  rekomendasi += `\nDirekomendasikan mengikuti kegiatan PKB (Pengembangan Keprofesian Berkelanjutan) sesuai prioritas yang telah ditetapkan, serta aktif dalam forum KKMA/MGMP untuk pertukaran praktik baik.`;

  return { catatan, rekomendasi };
}

function openPilihRoleModal(kamad_id, periode_id) {
  const kamad = Kamad.get(kamad_id);
  const periode = Periode.get(periode_id);
  if (!kamad || !periode) { toast('Data tidak lengkap.', 'error'); return; }
  const sessions = Penilaian.forKamadPeriode(kamad_id, periode_id);
  const sessByRole = {};
  for (const s of sessions) sessByRole[s.role || 'pengawas_1'] = s;
  const roles = (window.getRolesForPeriode ? window.getRolesForPeriode(periode.type) : (window.PKKM_ROLES || []));
  const isFourYear = periode.type === 'tahun_4';
  const groupTitle = { pengawas: 'Pengawas Madrasah', gtk: 'Guru &amp; Tendik', km_kb_ks: 'Komite, Kasi/Yayasan, Kabid' };
  const grouped = {};
  for (const r of roles) {
    const g = r.group || 'pengawas';
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(r);
  }
  const groupOrder = ['pengawas', 'gtk', 'km_kb_ks'].filter(g => grouped[g] && grouped[g].length);

  const html = `
    <div class="modal fade" id="pilihRoleModal" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header bg-light">
            <div>
              <div class="text-tiny text-muted">${escapeHTML(kamad.nama_madrasah||'')} · ${escapeHTML(periode.label||'')}</div>
              <h5 class="modal-title mb-0"><i class="bi bi-person-check"></i> Pilih Penilai untuk ${escapeHTML(kamad.nama)}</h5>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="alert ${isFourYear ? 'alert-warning' : 'alert-info'} py-2 text-tiny mb-3">
              <i class="bi bi-info-circle"></i>
              ${isFourYear
                ? '<strong>Penilaian 4 Tahunan</strong> — melibatkan 10 penilai (Pengawas I/II, Guru I/II, Tendik I/II, Komite I/II, Kasi/Yayasan, Kabid). Hasil akan diagregat berdasarkan kelompok dengan bobot Pengawas 50% · GTK 30% · Komite/KKKS 20%.'
                : '<strong>Penilaian Tahunan</strong> — hanya Pengawas I &amp; II yang menilai. Untuk 4 Tahunan (Tahun 4), buat periode dengan jenis “Tahun Keempat” agar 10 penilai aktif.'}
            </div>
            ${groupOrder.map(g => `
              <h6 class="text-uppercase text-muted text-tiny fw-bold mt-3 mb-2">${groupTitle[g] || g}</h6>
              <div class="list-group mb-2">
                ${grouped[g].map(r => {
                  const s = sessByRole[r.code];
                  const prog = s ? progressPenilaian(s.id) : null;
                  const sbCls = !s ? 'badge-status-belum' : (prog.persen >= 100 ? 'badge-status-selesai' : (prog.persen > 0 ? 'badge-status-sebagian' : 'badge-status-belum'));
                  const sbTxt = !s ? 'Belum dimulai' : (prog.persen >= 100 ? 'Selesai' : (prog.persen > 0 ? `${Math.round(prog.persen)}%` : 'Belum dimulai'));
                  const finalTag = s && s.status === 'final' ? ' <span class="badge bg-success ms-1">FINAL</span>' : '';
                  return `
                    <button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" data-role="${r.code}">
                      <div>
                        <div class="fw-semibold">${escapeHTML(r.label)}</div>
                        <div class="text-tiny text-muted">Instrumen: ${r.instrumen === 'gtk' ? 'Guru/Tendik &amp; Komite' : 'Pengawas'}</div>
                      </div>
                      <div class="text-end">
                        <span class="badge ${sbCls}">${sbTxt}</span>${finalTag}
                        <i class="bi bi-chevron-right ms-2"></i>
                      </div>
                    </button>`;
                }).join('')}
              </div>`).join('')}
            <div class="mt-3 text-end">
              <a href="#/agregat/${kamad_id}/${periode_id}" class="btn btn-sm btn-outline-primary"><i class="bi bi-graph-up"></i> Lihat Rekap Agregat</a>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-light" data-bs-dismiss="modal">Tutup</button>
          </div>
        </div>
      </div>
    </div>`;
  let host = document.getElementById('pilihRoleModalHost');
  if (!host) { host = document.createElement('div'); host.id = 'pilihRoleModalHost'; document.body.appendChild(host); }
  host.innerHTML = html;
  const m = new bootstrap.Modal(document.getElementById('pilihRoleModal'));
  m.show();
  document.querySelectorAll('#pilihRoleModal [data-role]').forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.dataset.role;
      Penilaian.ensureRole(kamad_id, periode_id, role);
      m.hide();
      navigate(`#/penilaian/${kamad_id}/${periode_id}/${role}`);
    });
  });
}

function openPeriodeModal() {
  const html = `
    <div class="modal fade" id="periodeModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <form id="periodeForm">
            <div class="modal-header">
              <h5 class="modal-title">Periode Penilaian Baru</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="row g-2">
                <div class="col-md-4">
                  <label class="form-label">Tahun</label>
                  <input class="form-control" name="tahun" type="number" value="${new Date().getFullYear()}" required>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Semester</label>
                  <select class="form-select" name="semester">
                    <option value="1">1 (Ganjil)</option>
                    <option value="2">2 (Genap)</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label">Jenis</label>
                  <select class="form-select" name="type">
                    ${window.PKKM_PERIODE_TYPES.map(t => `<option value="${t.code}">${t.label}</option>`).join('')}
                  </select>
                </div>
                <div class="col-md-8">
                  <label class="form-label">Label</label>
                  <input class="form-control" name="label" placeholder="Contoh: Sumatif TP 2025/2026">
                </div>
                <div class="col-md-4">
                  <label class="form-label">Tgl Penilaian</label>
                  <input class="form-control" type="date" name="tanggal_penilaian" value="${nowLocal().slice(0,10)}">
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-light" data-bs-dismiss="modal">Batal</button>
              <button type="submit" class="btn btn-primary">Simpan</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  let host = $('#periodeModalHost');
  if (!host) { host = document.createElement('div'); host.id = 'periodeModalHost'; document.body.appendChild(host); }
  host.innerHTML = html;
  const m = new bootstrap.Modal($('#periodeModal'));
  m.show();
  $('#periodeForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const data = Object.fromEntries(fd.entries());
    data.tahun = Number(data.tahun);
    if (!data.label) {
      const t = window.PKKM_PERIODE_TYPES.find(x => x.code === data.type);
      const tlabel = t ? t.label : data.type;
      data.label = `${tlabel} ${data.tahun} Sem ${data.semester}`;
    }
    Periode.create(data);
    m.hide();
    toast('Periode dibuat.');
    render();
  });
}

// --- Penilaian: form ------------------------------------------
route('#/penilaian/:kamadId/:periodeId', (root, params) => {
  // No role provided: redirect to role chooser modal via penilaian list
  navigate(`#/penilaian`);
  setTimeout(() => openPilihRoleModal(Number(params.kamadId), Number(params.periodeId)), 100);
});
route('#/penilaian/:kamadId/:periodeId/:role', (root, params) => {
  const kamad = Kamad.get(Number(params.kamadId));
  const periode = Periode.get(Number(params.periodeId));
  const role = params.role || 'pengawas_1';
  if (!kamad || !periode) {
    root.innerHTML = `<div class="alert alert-warning">Data kepala madrasah / periode tidak ditemukan. <a href="#/penilaian">Kembali</a></div>`;
    return;
  }
  // Switch instrumen sesuai role
  const roleInfo = (window.PKKM_ROLES||[]).find(x => x.code === role) || { instrumen: 'pengawas', label: role };
  if (typeof window.setInstrumenRole === 'function') window.setInstrumenRole(roleInfo.instrumen);
  const pen = Penilaian.ensureRole(kamad.id, periode.id, role);
  const isFinal = pen.status === 'final';

  function renderKomponenAccordion() {
    const skorRows = Skor.forPenilaian(pen.id);
    const skorMap = {};
    for (const s of skorRows) if (s.indikator_id) skorMap[s.indikator_id] = s;
    // Skip komponen HK utk penilaian tahunan (Tahun 1/2/3/formatif/sumatif)
    const isFourYear = periode.type === 'tahun_4';
    const komponenList = isFourYear
      ? window.PKKM_KOMPONEN
      : window.PKKM_KOMPONEN.filter(k => k.code !== 'HK');

    return komponenList.map((k, idx) => {
      const h = hitungNilaiKomponen(pen.id, k.code);
      return `
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button ${idx===0?'':'collapsed'}" type="button" data-bs-toggle="collapse" data-bs-target="#k_${k.code}">
              <strong class="me-2">${k.no}.</strong> ${escapeHTML(k.label)}
              <span class="ms-auto me-3 text-tiny">
                <span class="badge bg-light text-dark">${h.terisi}/${h.totalIndikator} ind</span>
                <span class="badge bg-primary">Nilai: ${fmtNilai(h.nilai)}</span>
              </span>
            </button>
          </h2>
          <div id="k_${k.code}" class="accordion-collapse collapse ${idx===0?'show':''}">
            <div class="accordion-body p-0">
              ${k.aspek.map((a, ai) => {
                const ha = hitungNilaiAspek(pen.id, k.code, a.kode);
                return `
                  <div class="sub-aspek-block border-bottom">
                    <div class="sub-aspek-header bg-light px-3 py-2">
                      <div class="d-flex justify-content-between align-items-center">
                        <div class="flex-grow-1">
                          <strong>${escapeHTML(a.kode)} · ${escapeHTML(a.unsur||'')}</strong>
                        </div>
                        <span class="text-tiny">
                          <span class="badge bg-light text-dark border">${ha.terisi}/${ha.total} ind</span>
                          <span class="badge bg-secondary">Nilai: ${fmtNilai(ha.nilai)}</span>
                        </span>
                      </div>
                    </div>
                    ${a.indikator.map(ind => {
                      const id = `${k.code}_${a.kode}_${ind.no}`;
                      const cur = skorMap[id] || {};
                      const skor = cur.skor;
                      const buktiList = Array.isArray(cur.bukti) ? cur.bukti : [];
                      // PKG suggestion (only on aspek 5.4 ind 1 = HK Capaian Mutu)
                      let suggestionHtml = '';
                      if (k.code === 'HK' && a.kode === '5.4' && ind.no === 1) {
                        const ringkas = window.PKKMTools?.getRingkasanPkg?.();
                        const rec = ringkas?.rows?.find(rr => (rr.madrasah||'').toLowerCase().trim() === (kamad.nama_madrasah||'').toLowerCase().trim());
                        if (rec && rec.rata_pkg != null) {
                          const sug = window.PKKMTools.suggestSkorFromPkg(rec.rata_pkg);
                          suggestionHtml = `<div class="text-tiny mt-1"><i class="bi bi-magic text-primary"></i> Rata PKG: <strong>${fmtNilai(rec.rata_pkg)}</strong> → saran <strong>${sug}</strong>. <a href="#" data-action="apply-pkg-suggest" data-indikator-id="${id}" data-skor="${sug}">Terapkan</a></div>`;
                        }
                      }
                      return `
                        <div class="aspek-row" data-indikator-id="${id}">
                          <div class="flex-grow-1">
                            <div class="d-flex align-items-start gap-2">
                              <span class="text-muted text-tiny pt-1" style="min-width:24px">${ind.no}.</span>
                              <span class="flex-grow-1">${escapeHTML(ind.indikator||'')}</span>
                              <button type="button" class="btn btn-sm btn-link p-0 text-primary" data-action="open-penggalian" data-indikator-id="${id}" title="Catatan penggalian data"><i class="bi bi-info-circle"></i></button>
                            </div>
                            ${suggestionHtml}
                          </div>
                          <div class="skor-pill" role="group" aria-label="Skor">
                            ${[1,2,3,4].map(v => `
                              <input type="radio" name="skor_${id}" id="skor_${id}_${v}" value="${v}" ${skor===v?'checked':''} ${isFinal?'disabled':''}>
                              <label for="skor_${id}_${v}" class="lbl-${v}" title="${['','Kurang','Cukup','Baik','Amat Baik'][v]}">${v}</label>
                            `).join('')}
                          </div>
                        </div>`;
                    }).join('')}
                  </div>`;
              }).join('')}
            </div>
          </div>
        </div>`;
    }).join('');
  }

  function renderRingkasan() {
    const final = hitungNilaiAkhir(pen.id);
    const sebutan = window.getPKKMSebutan(final.nilaiAkhir);
    return `
      <div class="card sticky-top" style="top: 70px;">
        <div class="card-header"><i class="bi bi-graph-up"></i> Ringkasan Nilai</div>
        <div class="card-body">
          <div class="nilai-akhir-box p-3 mb-3 text-center">
            <div class="text-tiny opacity-75">NILAI AKHIR</div>
            <div class="display-5 fw-bold">${fmtNilai(final.nilaiAkhir)}</div>
            <div class="${sebutan?sebutan.cssClass:''} bg-white rounded px-2 py-1 d-inline-block mt-1">${sebutan?sebutan.label:'-'}</div>
          </div>
          <table class="table table-sm mb-2">
            <thead><tr><th>Komponen</th><th class="text-end">Nilai</th><th class="text-end">Bobot</th></tr></thead>
            <tbody>
              ${final.detail.map(d => `
                <tr>
                  <td><span class="text-tiny">${escapeHTML(d.label)}</span></td>
                  <td class="text-end">${fmtNilai(d.nilai)}</td>
                  <td class="text-end">${d.bobot}%</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr><th colspan="2" class="text-end">Total bobot</th><th class="text-end">${final.totalBobot}%</th></tr>
            </tfoot>
          </table>
          <div class="text-tiny text-muted">
            Skor 1=Kurang, 2=Cukup, 3=Baik, 4=Amat Baik. Atur bobot di <a href="#/pengaturan">Pengaturan</a>.
          </div>
        </div>
      </div>`;
  }

  function fullRender() {
    root.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h5 class="mb-0"><i class="bi bi-pencil-square"></i> Penilaian: ${escapeHTML(kamad.nama)}</h5>
          <div class="text-tiny text-muted">${escapeHTML(kamad.nama_madrasah)} (${escapeHTML(kamad.jenjang||'-')}) &middot; ${escapeHTML(periode.label)}</div>
          <div class="mt-1"><span class="badge bg-primary"><i class="bi bi-person-badge"></i> Penilai: ${escapeHTML(roleInfo.label||role)}</span> <span class="badge bg-light text-dark border ms-1">Instrumen: ${roleInfo.instrumen === 'gtk' ? 'Guru/Tendik &amp; Komite' : 'Pengawas'}</span></div>
        </div>
        <div class="btn-group">
          <a href="#/penilaian" class="btn btn-sm btn-outline-secondary"><i class="bi bi-arrow-left"></i></a>
          <a href="#/cetak/${pen.id}" class="btn btn-sm btn-outline-primary"><i class="bi bi-printer"></i> Cetak</a>
          ${isFinal
            ? `<button class="btn btn-sm btn-warning" id="btnUnfinal"><i class="bi bi-unlock"></i> Buka Final</button>`
            : `<button class="btn btn-sm btn-success" id="btnFinal"><i class="bi bi-check2-circle"></i> Tandai Final</button>`}
        </div>
      </div>

      ${isFinal ? `<div class="alert alert-success py-2 text-tiny"><i class="bi bi-shield-check"></i> Penilaian sudah <strong>FINAL</strong>. Edit dikunci. Buka kembali untuk merevisi.</div>` : ''}

      <div class="row g-3">
        <div class="col-lg-8">
          <div class="accordion" id="komponenAcc">
            ${renderKomponenAccordion()}
          </div>

          <div class="card mt-3">
            <div class="card-header d-flex justify-content-between align-items-center">
              <span><i class="bi bi-chat-left-text"></i> Catatan &amp; Rekomendasi Pengawas</span>
              ${isFinal ? '' : '<button type="button" class="btn btn-sm btn-outline-success" id="btnAutoCatatan" title="Isi otomatis berdasarkan hasil penilaian"><i class="bi bi-magic"></i> Isi Otomatis</button>'}
            </div>
            <div class="card-body">
              <div class="mb-2">
                <label class="form-label text-tiny mb-1">Catatan Umum</label>
                <textarea id="catatanUmum" class="form-control" rows="4" ${isFinal?'disabled':''}>${escapeHTML(pen.catatan_umum||'')}</textarea>
              </div>
              <div>
                <label class="form-label text-tiny mb-1">Rekomendasi Pembinaan</label>
                <textarea id="rekomendasi" class="form-control" rows="4" ${isFinal?'disabled':''}>${escapeHTML(pen.rekomendasi||'')}</textarea>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-4">
          <div id="ringkasanHost">${renderRingkasan()}</div>
        </div>
      </div>
    `;

    // Skor pill change
    $$('.aspek-row').forEach(row => {
      const indikator_id = row.dataset.indikatorId;
      if (!indikator_id) return;
      row.querySelectorAll('input[type=radio]').forEach(r => {
        r.addEventListener('change', () => {
          const v = Number(r.value);
          const cur = Skor.get(pen.id, indikator_id) || {};
          Skor.set(pen.id, indikator_id, { skor: v, catatan: cur.catatan || '', bukti: cur.bukti || [] });
          $('#ringkasanHost').innerHTML = renderRingkasan();
          // refresh badges di header komponen + sub-aspek
          updateAccordionBadges(indikator_id);
        });
      });
    });

    function updateAccordionBadges(indikator_id) {
      // indikator_id format: PM_1.1_1 → komponenCode = first underscore split
      const code = indikator_id.split('_')[0];
      const aspekKode = indikator_id.split('_')[1];
      const h = hitungNilaiKomponen(pen.id, code);
      const headerBtn = document.querySelector(`#komponenAcc [data-bs-target="#k_${code}"]`);
      if (headerBtn) {
        const badges = headerBtn.querySelectorAll('.badge');
        if (badges[0]) badges[0].textContent = `${h.terisi}/${h.totalIndikator} ind`;
        if (badges[1]) badges[1].textContent = `Nilai: ${fmtNilai(h.nilai)}`;
      }
      // sub-aspek badges
      const ha = hitungNilaiAspek(pen.id, code, aspekKode);
      const subBlocks = document.querySelectorAll('.sub-aspek-block');
      subBlocks.forEach(sb => {
        const head = sb.querySelector('.sub-aspek-header strong');
        if (head) {
          const headText = head.textContent.trim();
          // Match kalau text dimulai dengan aspekKode (header sekarang gabung kode + unsur)
          if (headText === aspekKode || headText.startsWith(aspekKode + ' ')) {
            const subBadges = sb.querySelectorAll('.sub-aspek-header .badge');
            if (subBadges[0]) subBadges[0].textContent = `${ha.terisi}/${ha.total} ind`;
            if (subBadges[1]) subBadges[1].textContent = `Nilai: ${fmtNilai(ha.nilai)}`;
          }
        }
      });
    }

    // Bukti dukung handlers
    function rerenderBuktiHost(indikator_id) {
      const host = root.querySelector(`[data-bukti-host="${indikator_id}"]`);
      if (!host) return;
      const cur = Skor.get(pen.id, indikator_id) || {};
      const list = Array.isArray(cur.bukti) ? cur.bukti : [];
      const badges = list.map((b, bi) => buktiBadgeHTML(b, bi, isFinal)).join('');
      const addBtn = isFinal ? '' : `
        <label class="btn btn-sm btn-outline-secondary mb-0" title="Upload bukti dukung">
          <i class="bi bi-paperclip"></i> Bukti
          <input type="file" class="d-none" data-action="upload-bukti" data-indikator-id="${indikator_id}" accept="image/*,application/pdf" multiple>
        </label>`;
      host.innerHTML = badges + addBtn;
    }

    root.addEventListener('change', async (ev) => {
      const inp = ev.target.closest('[data-action="upload-bukti"]');
      if (!inp) return;
      const indikator_id = inp.dataset.indikatorId;
      const files = Array.from(inp.files || []);
      if (!files.length) return;
      const cur = Skor.get(pen.id, indikator_id) || {};
      const arr = Array.isArray(cur.bukti) ? cur.bukti.slice() : [];
      let totalNew = 0;
      for (const f of files) {
        try {
          const b = await fileToBukti(f);
          arr.push(b);
          totalNew += b.size || 0;
          if (b.size > MAX_BUKTI_BYTES) toast(`Bukti "${f.name}" cukup besar (${Math.round(b.size/1024)} KB).`, 'info');
        } catch (e) {
          toast(`Gagal memproses ${f.name}: ${e.message}`, 'error');
        }
      }
      Skor.set(pen.id, indikator_id, { skor: cur.skor ?? null, catatan: cur.catatan || '', bukti: arr });
      inp.value = '';
      rerenderBuktiHost(indikator_id);
      if (totalNew > 0) toast(`Bukti tersimpan (${files.length} file).`);
    });

    root.addEventListener('click', (ev) => {
      const pengBtn = ev.target.closest('[data-action="open-penggalian"]');
      if (pengBtn) {
        ev.preventDefault();
        // support both old (aspek-id) and new (indikator-id)
        const id = pengBtn.dataset.indikatorId || pengBtn.dataset.aspekId;
        openPenggalianModal(id);
        return;
      }
      const remBtn = ev.target.closest('[data-action="remove-bukti"]');
      if (remBtn) {
        const wrapper = remBtn.closest('.aspek-row');
        const indikator_id = wrapper?.dataset.indikatorId;
        const idx = Number(remBtn.dataset.buktiIdx);
        if (!indikator_id || isNaN(idx)) return;
        if (!confirmAction('Hapus bukti ini?')) return;
        const cur = Skor.get(pen.id, indikator_id) || {};
        const arr = Array.isArray(cur.bukti) ? cur.bukti.slice() : [];
        arr.splice(idx, 1);
        Skor.set(pen.id, indikator_id, { skor: cur.skor ?? null, catatan: cur.catatan || '', bukti: arr });
        rerenderBuktiHost(indikator_id);
        return;
      }
      const openImg = ev.target.closest('[data-action="open-bukti"]');
      if (openImg) {
        const wrapper = openImg.closest('.aspek-row');
        const indikator_id = wrapper?.dataset.indikatorId;
        const idx = Number(openImg.dataset.buktiIdx);
        if (!indikator_id || isNaN(idx)) return;
        const cur = Skor.get(pen.id, indikator_id) || {};
        const b = (cur.bukti || [])[idx];
        if (b) openBuktiPreview(b);
      }
      const applySug = ev.target.closest('[data-action="apply-pkg-suggest"]');
      if (applySug) {
        ev.preventDefault();
        if (isFinal) { toast('Penilaian sudah final.', 'error'); return; }
        const indikator_id = applySug.dataset.indikatorId || applySug.dataset.aspekId;
        const v = Number(applySug.dataset.skor);
        if (!indikator_id || !v) return;
        const cur = Skor.get(pen.id, indikator_id) || {};
        Skor.set(pen.id, indikator_id, { skor: v, catatan: cur.catatan || '', bukti: cur.bukti || [] });
        const radio = root.querySelector(`#skor_${indikator_id}_${v}`);
        if (radio) radio.checked = true;
        $('#ringkasanHost').innerHTML = renderRingkasan();
        updateAccordionBadges(indikator_id);
        toast(`Saran skor ${v} diterapkan.`);
      }
    });

    // catatan & rekomendasi
    let t1, t2;
    $('#catatanUmum')?.addEventListener('input', e => {
      clearTimeout(t1); t1 = setTimeout(() => Penilaian.update(pen.id, { catatan_umum: e.target.value }), 350);
    });
    $('#rekomendasi')?.addEventListener('input', e => {
      clearTimeout(t2); t2 = setTimeout(() => Penilaian.update(pen.id, { rekomendasi: e.target.value }), 350);
    });

    // Auto-generate catatan umum & rekomendasi dari hasil penilaian
    $('#btnAutoCatatan')?.addEventListener('click', () => {
      const ta1 = $('#catatanUmum');
      const ta2 = $('#rekomendasi');
      if (!ta1 || !ta2) return;
      const hasIsi = (ta1.value || '').trim() || (ta2.value || '').trim();
      if (hasIsi && !confirmAction('Catatan/rekomendasi yang sudah ada akan diganti. Lanjutkan?')) return;
      const generated = generateCatatanRekomendasi(pen.id, kamad, periode);
      ta1.value = generated.catatan;
      ta2.value = generated.rekomendasi;
      Penilaian.update(pen.id, { catatan_umum: generated.catatan, rekomendasi: generated.rekomendasi });
      toast('Catatan dan rekomendasi terisi otomatis.');
    });

    // final / unfinal
    $('#btnFinal')?.addEventListener('click', () => {
      const prog = progressPenilaian(pen.id);
      if (prog.terisi < prog.total) {
        if (!confirmAction(`Masih ada ${prog.total - prog.terisi} aspek yang belum diisi. Tetap tandai FINAL?`)) return;
      }
      Penilaian.update(pen.id, { status: 'final' });
      toast('Penilaian ditandai final.');
      render();
    });
    $('#btnUnfinal')?.addEventListener('click', () => {
      if (confirmAction('Buka kunci final dan ijinkan revisi?')) {
        Penilaian.update(pen.id, { status: 'draft' });
        toast('Final dibuka. Edit diaktifkan.');
        render();
      }
    });
  }

  fullRender();
});

// --- Rekap -----------------------------------------------------
route('#/rekap', (root) => {
  const periodeList = Periode.list();
  if (periodeList.length === 0) {
    root.innerHTML = `<div class="alert alert-info">Belum ada periode. <a href="#/penilaian">Buat periode dulu</a>.</div>`;
    return;
  }
  const selPid = Number(location.hash.match(/[?&]p=(\d+)/)?.[1]) || periodeList[0].id;
  const periode = Periode.get(selPid);
  const kamadList = Kamad.list();

  const rows = kamadList.map(k => {
    const sessions = Penilaian.forKamadPeriode(k.id, selPid);
    if (!sessions.length) return { k, pen: null, sessions: [], prog: null, akhir: null, sebutan: null, agg: null };
    // Agregat multi-role kalau >1 session, single kalau cuma 1
    let akhir = null;
    let agg = null;
    if (sessions.length > 1) {
      agg = hitungNilaiAgregat(k.id, selPid);
      akhir = { nilaiAkhir: agg.nilaiAgregat, detail: (window.PKKM_KOMPONEN_META||window.PKKM_KOMPONEN).map(km => {
        const vals = sessions.map(s => hitungNilaiKomponen(s.id, km.code).nilai);
        return { code: km.code, label: km.label, nilai: vals.reduce((a,b)=>a+b,0)/vals.length, bobot: 0, kontribusi: 0 };
      }) };
    } else {
      akhir = hitungNilaiAkhir(sessions[0].id);
    }
    const prog = progressPenilaian(sessions[0].id);
    const sebutan = window.getPKKMSebutan(akhir.nilaiAkhir);
    return { k, pen: sessions[0], sessions, prog, akhir, sebutan, agg };
  });

  root.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h5 class="mb-0"><i class="bi bi-bar-chart"></i> Rekap Nilai</h5>
      <div class="d-flex gap-2 align-items-center">
        <label class="text-tiny text-muted mb-0">Periode:</label>
        <select class="form-select form-select-sm" id="periodeSelect" style="min-width: 200px;">
          ${periodeList.map(p => `<option value="${p.id}" ${p.id===selPid?'selected':''}>${escapeHTML(p.label)}</option>`).join('')}
        </select>
        <button class="btn btn-sm btn-outline-primary" id="btnExportRekap"><i class="bi bi-file-earmark-excel"></i> Export Excel</button>
      </div>
    </div>
    <div class="card">
      <div class="card-body p-0">
        <div class="table-responsive"><table class="table table-hover mb-0 align-middle">
          <thead class="table-light">
            <tr>
              <th width="40">#</th>
              <th>Kepala Madrasah / Madrasah</th>
              ${window.PKKM_KOMPONEN.map(k => `<th class="text-center text-tiny" title="${escapeHTML(k.label)}">${k.code}</th>`).join('')}
              <th class="text-center">Nilai Akhir</th>
              <th class="text-center">Sebutan</th>
              <th class="text-center" width="100">Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((r, i) => {
              const detail = r.akhir ? r.akhir.detail : null;
              return `<tr>
                <td>${i+1}</td>
                <td>
                  <div class="fw-semibold">${escapeHTML(r.k.nama)}</div>
                  <div class="text-tiny text-muted">${escapeHTML(r.k.nama_madrasah||'-')} &middot; ${escapeHTML(r.k.jenjang||'-')}</div>
                </td>
                ${window.PKKM_KOMPONEN.map(k => {
                  const d = detail?.find(x => x.code === k.code);
                  return `<td class="text-center">${d ? fmtNilai(d.nilai) : '-'}</td>`;
                }).join('')}
                <td class="text-center fw-bold">${r.akhir ? fmtNilai(r.akhir.nilaiAkhir) : '-'}
                  ${r.sessions.length > 1 ? `<div class="text-tiny text-muted">${r.sessions.length} penilai</div>` : ''}
                </td>
                <td class="text-center">${r.sebutan ? `<span class="${r.sebutan.cssClass}">${r.sebutan.label}</span>` : '-'}</td>
                <td class="text-center">
                  ${r.pen
                    ? `<a href="#/agregat/${r.k.id}/${selPid}" class="btn btn-sm btn-outline-primary" title="Detail Agregat"><i class="bi bi-graph-up"></i></a>
                       <a href="#/cetak/${r.pen.id}" class="btn btn-sm btn-outline-secondary" title="Cetak"><i class="bi bi-printer"></i></a>`
                    : `<button class="btn btn-sm btn-primary" data-action="open-rekap-penilaian" data-kamad="${r.k.id}"><i class="bi bi-play-fill"></i> Mulai</button>`}
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table></div>
      </div>
    </div>
  `;

  $('#periodeSelect').addEventListener('change', e => {
    location.hash = `#/rekap?p=${e.target.value}`;
  });
  $$('[data-action="open-rekap-penilaian"]').forEach(b => b.addEventListener('click', () => {
    openPilihRoleModal(Number(b.dataset.kamad), selPid);
  }));

  $('#btnExportRekap').addEventListener('click', () => exportRekapExcel(periode, rows));
});

async function exportRekapExcel(periode, rows) {
  if (typeof ExcelJS === 'undefined') { toast('ExcelJS belum siap, coba lagi.', 'error'); return; }
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Rekap PKKM');
  const headers = ['No', 'Nama Kepala Madrasah', 'NIP', 'Madrasah', 'Jenjang',
    ...window.PKKM_KOMPONEN.map(k => k.label),
    'Nilai Akhir', 'Sebutan', 'Status'];
  ws.addRow(['Rekap Nilai PKKM']).font = { bold: true, size: 14 };
  ws.addRow([periode.label]);
  ws.addRow([]);
  const headerRow = ws.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FF047A3A' } };
  headerRow.eachCell(c => { c.font = { bold: true, color: { argb:'FFFFFFFF' } }; c.alignment = { horizontal: 'center' }; });

  rows.forEach((r, i) => {
    const detail = r.akhir ? r.akhir.detail : null;
    const compNilai = window.PKKM_KOMPONEN.map(k => {
      const d = detail?.find(x => x.code === k.code);
      return d ? Number(d.nilai.toFixed(2)) : '';
    });
    ws.addRow([
      i+1, r.k.nama, r.k.nip||'', r.k.nama_madrasah||'', r.k.jenjang||'',
      ...compNilai,
      r.akhir ? Number(r.akhir.nilaiAkhir.toFixed(2)) : '',
      r.sebutan ? r.sebutan.label : '',
      r.pen ? r.pen.status : 'belum',
    ]);
  });
  ws.columns.forEach(col => { col.width = 15; });
  ws.getColumn(2).width = 28;
  ws.getColumn(4).width = 28;

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `Rekap_PKKM_${periode.label.replace(/\s+/g,'_')}.xlsx`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// --- Cetak: pilih penilaian ------------------------------------
route('#/cetak', (root) => {
  const periodeList = Periode.list();
  const allPen = Penilaian.list();
  const kamadById = Object.fromEntries(Kamad.list().map(k => [k.id, k]));
  const periodeById = Object.fromEntries(periodeList.map(p => [p.id, p]));

  root.innerHTML = `
    <h5 class="mb-3"><i class="bi bi-printer"></i> Cetak Laporan PKKM</h5>
    <div class="card">
      <div class="card-body p-0">
        ${allPen.length === 0
          ? `<div class="text-center text-muted py-4">Belum ada penilaian.</div>`
          : `<div class="table-responsive"><table class="table table-hover mb-0 align-middle">
              <thead class="table-light">
                <tr><th>Kepala Madrasah</th><th>Periode</th><th>Status</th><th width="120">Aksi</th></tr>
              </thead>
              <tbody>
                ${allPen.map(p => {
                  const k = kamadById[p.kamad_id];
                  const per = periodeById[p.periode_id];
                  const roleInfo = (window.PKKM_ROLES || []).find(r => r.code === (p.role || 'pengawas_1'));
                  const roleBadge = roleInfo ? `<span class="badge bg-light text-dark border ms-1">${escapeHTML(roleInfo.label)}</span>` : '';
                  return `<tr>
                    <td>${escapeHTML(k?.nama||'?')}<div class="text-tiny text-muted">${escapeHTML(k?.nama_madrasah||'')}</div></td>
                    <td>${escapeHTML(per?.label||'?')} ${roleBadge}</td>
                    <td>${p.status === 'final' ? '<span class="badge bg-success">FINAL</span>' : '<span class="badge bg-secondary">Draft</span>'}</td>
                    <td><a class="btn btn-sm btn-primary" href="#/cetak/${p.id}"><i class="bi bi-eye"></i> Lihat</a></td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table></div>`}
      </div>
    </div>
  `;
});

// --- Cetak: detail laporan -------------------------------------
route('#/cetak/:id', (root, params) => {
  const pen = Penilaian.get(Number(params.id));
  if (!pen) { root.innerHTML = `<div class="alert alert-warning">Penilaian tidak ditemukan.</div>`; return; }
  const kamad = Kamad.get(pen.kamad_id);
  const periode = Periode.get(pen.periode_id);
  const akhir = hitungNilaiAkhir(pen.id);
  const sebutan = window.getPKKMSebutan(akhir.nilaiAkhir);
  const skorRows = Skor.forPenilaian(pen.id);
  const skorMap = {}; for (const s of skorRows) if (s.indikator_id) skorMap[s.indikator_id] = s;

  const pengawas = Meta.get('identitas_pengawas', { nama: '', nip: '' });
  const pokjawas = Meta.get('identitas_ketua_pokjawas', { nama: 'SUBARIYANTO, S.Pd, M.Pd.I', nip: '197002122005011004' });
  const tempat = Meta.get('lokasi_ttd', 'Jember');

  root.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3 no-print">
      <a href="#/cetak" class="btn btn-sm btn-outline-secondary"><i class="bi bi-arrow-left"></i> Kembali</a>
      <button class="btn btn-sm btn-primary" onclick="window.print()"><i class="bi bi-printer"></i> Cetak / Save PDF</button>
    </div>

    <div class="card">
      <div class="card-body" id="printArea">
        <div class="print-header text-center">
          <h5 class="mb-1">LAPORAN PENILAIAN KINERJA KEPALA MADRASAH</h5>
          <div>${escapeHTML(periode?.label||'-')}</div>
          <hr>
        </div>

        <table class="print-table mb-3" style="width:100%;">
          <tr><td width="180">Nama</td><td>: ${escapeHTML(kamad?.nama||'-')}</td></tr>
          <tr><td>NIP</td><td>: ${escapeHTML(kamad?.nip||'-')}</td></tr>
          <tr><td>Jabatan</td><td>: ${escapeHTML(kamad?.jabatan||'-')}</td></tr>
          <tr><td>Madrasah</td><td>: ${escapeHTML(kamad?.nama_madrasah||'-')} (${escapeHTML(kamad?.jenjang||'-')})</td></tr>
          <tr><td>NSM</td><td>: ${escapeHTML(kamad?.nsm||'-')}</td></tr>
          <tr><td>Alamat</td><td>: ${escapeHTML(kamad?.alamat||'-')}</td></tr>
          <tr><td>Tanggal Penilaian</td><td>: ${escapeHTML(pen.tanggal||'-')}</td></tr>
        </table>

        <h6>Hasil Penilaian</h6>
        <table class="print-table mb-3" style="width:100%;">
          <thead>
            <tr>
              <th width="50">No</th>
              <th>Komponen</th>
              <th width="80" class="text-center">Bobot</th>
              <th width="80" class="text-center">Nilai</th>
              <th width="100" class="text-center">Kontribusi</th>
            </tr>
          </thead>
          <tbody>
            ${akhir.detail.map((d, i) => `
              <tr>
                <td class="text-center">${i+1}</td>
                <td>${escapeHTML(d.label)}</td>
                <td class="text-center">${d.bobot}%</td>
                <td class="text-center">${fmtNilai(d.nilai)}</td>
                <td class="text-center">${fmtNilai(d.kontribusi)}</td>
              </tr>`).join('')}
            <tr>
              <th colspan="4" class="text-end">Nilai Akhir</th>
              <th class="text-center">${fmtNilai(akhir.nilaiAkhir)}</th>
            </tr>
            <tr>
              <th colspan="4" class="text-end">Sebutan</th>
              <th class="text-center">${sebutan ? sebutan.label : '-'}</th>
            </tr>
          </tbody>
        </table>

        <h6>Detail Skor per Sub-Aspek &amp; Indikator</h6>
        <table class="print-table mb-3" style="width:100%;">
          <thead>
            <tr>
              <th width="50">No</th>
              <th>Sub-Aspek / Indikator</th>
              <th width="60" class="text-center">Skor</th>
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody>
            ${window.PKKM_KOMPONEN.map(k => `
              <tr><td colspan="4" style="background:#f4faf5;"><strong>${k.no}. ${escapeHTML(k.label)}</strong></td></tr>
              ${k.aspek.map(a => {
                const ha = hitungNilaiAspek(pen.id, k.code, a.kode);
                return `
                  <tr><td colspan="4" style="background:#fafafa;"><em>${escapeHTML(a.kode)} ${escapeHTML(a.unsur||'')} — Nilai: ${fmtNilai(ha.nilai)}</em></td></tr>
                  ${a.indikator.map(ind => {
                    const id = `${k.code}_${a.kode}_${ind.no}`;
                    const s = skorMap[id];
                    return `<tr>
                      <td class="text-center">${a.kode}.${ind.no}</td>
                      <td class="text-tiny">${escapeHTML(ind.indikator||'')}</td>
                      <td class="text-center">${s && s.skor != null ? s.skor : '-'}</td>
                      <td class="text-tiny">${escapeHTML(s?.catatan||'')}</td>
                    </tr>`;
                  }).join('')}`;
              }).join('')}
            `).join('')}
          </tbody>
        </table>

        ${pen.catatan_umum ? `<h6>Catatan Umum</h6><p>${escapeHTML(pen.catatan_umum)}</p>` : ''}
        ${pen.rekomendasi ? `<h6>Rekomendasi Pembinaan</h6><p>${escapeHTML(pen.rekomendasi)}</p>` : ''}

        <div class="ttd-grid">
          <div class="ttd-box">
            <div class="ttd-tempat">${escapeHTML(tempat)}, ${escapeHTML(pen.tanggal||nowLocal().slice(0,10))}</div>
            <div class="ttd-jabatan">Pengawas Madrasah,</div>
            <div class="ttd-spacer"></div>
            <div class="ttd-name">${escapeHTML(pengawas.nama||'..............................')}</div>
            <div class="ttd-nip">NIP. ${escapeHTML(pengawas.nip||'..............................')}</div>
          </div>
          <div class="ttd-box">
            <div class="ttd-tempat">&nbsp;</div>
            <div class="ttd-jabatan">Mengetahui,<br>Ketua Pokjawas Madrasah Kab. Jember</div>
            <div class="ttd-spacer"></div>
            <div class="ttd-name">${escapeHTML(pokjawas.nama||'..............................')}</div>
            <div class="ttd-nip">NIP. ${escapeHTML(pokjawas.nip||'..............................')}</div>
          </div>
        </div>
      </div>
    </div>
  `;
});

// --- Rekap Agregat (multi-assessor) ----------------------------
route('#/agregat/:kamadId/:periodeId', (root, params) => {
  const kamad = Kamad.get(Number(params.kamadId));
  const periode = Periode.get(Number(params.periodeId));
  if (!kamad || !periode) {
    root.innerHTML = `<div class="alert alert-warning">Data tidak ditemukan. <a href="#/penilaian">Kembali</a></div>`;
    return;
  }
  const agg = hitungNilaiAgregat(kamad.id, periode.id);
  if (!agg || !agg.sessions.length) {
    root.innerHTML = `
      <h5 class="mb-3"><i class="bi bi-graph-up"></i> Rekap Agregat</h5>
      <div class="alert alert-info">Belum ada penilaian untuk ${escapeHTML(kamad.nama)} di periode ${escapeHTML(periode.label)}.
        <a href="#/penilaian" class="btn btn-sm btn-primary ms-2">Mulai Penilaian</a>
      </div>`;
    return;
  }
  const sebutan = window.getPKKMSebutan(agg.nilaiAgregat);
  const groupLabel = { pengawas: 'Pengawas Madrasah', gtk: 'Guru / Tendik', km_kb_ks: 'Komite / Kasi-Yayasan / Kabid' };

  // Build per-session rows for detail table
  const ROLES = window.PKKM_ROLES || [];
  const roleLabel = (code) => (ROLES.find(r => r.code === code)?.label || code);

  root.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <h5 class="mb-0"><i class="bi bi-graph-up"></i> Rekap Agregat Multi-Penilai</h5>
        <div class="text-tiny text-muted">${escapeHTML(kamad.nama)} · ${escapeHTML(kamad.nama_madrasah||'-')} · ${escapeHTML(periode.label)}</div>
      </div>
      <a href="#/penilaian" class="btn btn-sm btn-outline-secondary"><i class="bi bi-arrow-left"></i> Kembali</a>
    </div>

    <div class="mb-3">
      <a href="#/rekap-tahunan?k=${kamad.id}" class="btn btn-sm btn-outline-primary"><i class="bi bi-calendar3-range"></i> Rekap 4 Tahunan</a>
      <a href="#/pkb/${kamad.id}/${periode.id}" class="btn btn-sm btn-outline-warning"><i class="bi bi-mortarboard"></i> Analisis PKB</a>
      <button class="btn btn-sm btn-success" id="btnAggExportXlsx"><i class="bi bi-file-earmark-excel"></i> Export Excel Resmi</button>
    </div>

    <div class="row g-3">
      <div class="col-lg-5">
        <div class="card">
          <div class="card-body">
            <div class="nilai-akhir-box p-3 mb-3 text-center">
              <div class="text-tiny opacity-75">NILAI AGREGAT</div>
              <div class="display-4 fw-bold">${fmtNilai(agg.nilaiAgregat)}</div>
              <div class="${sebutan?sebutan.cssClass:''} bg-white rounded px-2 py-1 d-inline-block mt-1">${sebutan?sebutan.label:'-'}</div>
            </div>
            <table class="table table-sm mb-0">
              <thead><tr><th>Kelompok</th><th class="text-end">Nilai</th><th class="text-end">Bobot</th><th class="text-end">Penilai</th></tr></thead>
              <tbody>
                ${agg.breakdown.map(b => `
                  <tr>
                    <td>${escapeHTML(groupLabel[b.group]||b.group)}</td>
                    <td class="text-end">${b.nilai != null ? fmtNilai(b.nilai) : '<span class="text-muted">-</span>'}</td>
                    <td class="text-end">${b.bobot}%</td>
                    <td class="text-end">${b.jumlahPenilai}</td>
                  </tr>`).join('')}
              </tbody>
              <tfoot>
                <tr><th colspan="2" class="text-end">Total bobot aktif</th><th class="text-end">${agg.totalBobotRole}%</th><th></th></tr>
              </tfoot>
            </table>
            <div class="text-tiny text-muted mt-2">Bobot kelompok bisa diubah di <a href="#/pengaturan">Pengaturan</a>.</div>
          </div>
        </div>
      </div>

      <div class="col-lg-7">
        <div class="card">
          <div class="card-header"><i class="bi bi-list-ul"></i> Detail per Penilai</div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover mb-0 align-middle">
                <thead class="table-light">
                  <tr><th>Penilai</th><th class="text-end">Nilai Akhir</th><th class="text-center">Status</th><th class="text-end">Aksi</th></tr>
                </thead>
                <tbody>
                  ${agg.sessions.sort((a,b) => (a.role||'').localeCompare(b.role||'')).map(s => {
                    const akhir = hitungNilaiAkhir(s.id);
                    const prog = progressPenilaian(s.id);
                    const sb = statusBadge(prog.persen);
                    return `
                      <tr>
                        <td>
                          <div class="fw-semibold">${escapeHTML(roleLabel(s.role||'pengawas_1'))}</div>
                          <div class="text-tiny text-muted">${escapeHTML(s.tanggal||'-')}</div>
                        </td>
                        <td class="text-end"><strong>${fmtNilai(akhir.nilaiAkhir)}</strong></td>
                        <td class="text-center">
                          <span class="badge ${sb.cls}">${sb.text}</span>
                          ${s.status === 'final' ? '<span class="badge bg-success ms-1">FINAL</span>' : ''}
                        </td>
                        <td class="text-end">
                          <a href="#/penilaian/${kamad.id}/${periode.id}/${s.role||'pengawas_1'}" class="btn btn-sm btn-outline-primary" title="Buka"><i class="bi bi-pencil-square"></i></a>
                          <a href="#/cetak/${s.id}" class="btn btn-sm btn-outline-secondary" title="Cetak"><i class="bi bi-printer"></i></a>
                        </td>
                      </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12">
        <div class="card">
          <div class="card-header"><i class="bi bi-bar-chart"></i> Nilai Komponen per Penilai</div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Komponen</th>
                    ${agg.sessions.map(s => `<th class="text-center text-tiny">${escapeHTML(roleLabel(s.role||'pengawas_1'))}</th>`).join('')}
                    <th class="text-center">Rata-rata</th>
                  </tr>
                </thead>
                <tbody>
                  ${(window.PKKM_KOMPONEN_META || []).map(km => {
                    const vals = agg.sessions.map(s => hitungNilaiKomponen(s.id, km.code).nilai);
                    const rata = vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
                    return `
                      <tr>
                        <td><strong>${km.no}.</strong> ${escapeHTML(km.label)}</td>
                        ${vals.map(v => `<td class="text-center">${fmtNilai(v)}</td>`).join('')}
                        <td class="text-center"><strong>${fmtNilai(rata)}</strong></td>
                      </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btnAggExportXlsx')?.addEventListener('click', async () => {
    if (typeof window.exportPKKMExcel !== 'function') { toast('Modul export belum siap.', 'error'); return; }
    await window.exportPKKMExcel(kamad.id);
  });
});

// --- Riwayat Penilaian per Kamad (multi-periode) --------------
route('#/riwayat/:kamadId', (root, params) => {
  const kamad = Kamad.get(Number(params.kamadId));
  if (!kamad) { root.innerHTML = `<div class="alert alert-warning">Kepala madrasah tidak ditemukan.</div>`; return; }
  const periodeAll = Periode.list();
  const penList = Penilaian.forKamad(kamad.id);
  const rows = penList.map(p => {
    const periode = periodeAll.find(x => x.id === p.periode_id);
    const akhir = hitungNilaiAkhir(p.id);
    const sebutan = window.getPKKMSebutan(akhir.nilaiAkhir);
    const prog = progressPenilaian(p.id);
    return { p, periode, akhir, sebutan, prog };
  }).sort((a,b) => {
    const at = a.periode?.tahun || 0, bt = b.periode?.tahun || 0;
    if (bt !== at) return bt - at;
    return (b.periode?.semester||'').localeCompare(a.periode?.semester||'');
  });

  // Tren per komponen (untuk grafik sederhana)
  const tren = window.PKKM_KOMPONEN.map(k => ({
    code: k.code,
    label: k.label,
    series: rows.slice().reverse().map(r => {
      const d = r.akhir.detail.find(x => x.code === k.code);
      return { period: r.periode?.label || '?', nilai: d?.nilai ?? null };
    }),
  }));

  root.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <h5 class="mb-0"><i class="bi bi-clock-history"></i> Riwayat Penilaian</h5>
        <div class="text-tiny text-muted">${escapeHTML(kamad.nama)} — ${escapeHTML(kamad.nama_madrasah||'-')} (${escapeHTML(kamad.jenjang||'-')})${kamad.kkma ? ' · ' + escapeHTML(kamad.kkma) : ''}</div>
      </div>
      <div class="btn-group">
        <a href="#/kamad/${kamad.id}" class="btn btn-sm btn-outline-secondary"><i class="bi bi-pencil"></i> Edit</a>
        <a href="#/kamad" class="btn btn-sm btn-outline-secondary"><i class="bi bi-arrow-left"></i> Daftar</a>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-header"><i class="bi bi-list-ul"></i> Daftar Penilaian (${rows.length})</div>
      <div class="card-body p-0">
        ${rows.length === 0
          ? `<div class="text-center text-muted py-4">Belum ada riwayat. <a href="#/penilaian">Mulai penilaian</a>.</div>`
          : `<div class="table-responsive"><table class="table table-hover mb-0 align-middle">
              <thead class="table-light">
                <tr>
                  <th>Periode</th>
                  <th class="text-center">Tanggal</th>
                  <th class="text-center">Progres</th>
                  ${window.PKKM_KOMPONEN.map(k => `<th class="text-center text-tiny" title="${escapeHTML(k.label)}">${k.code}</th>`).join('')}
                  <th class="text-center">Nilai</th>
                  <th class="text-center">Sebutan</th>
                  <th class="text-center">Status</th>
                  <th class="text-center" width="110">Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map(r => `
                  <tr>
                    <td>${escapeHTML(r.periode?.label||'?')}<div class="text-tiny text-muted">${escapeHTML(r.periode?.type||'-')}</div></td>
                    <td class="text-center text-tiny">${escapeHTML(r.p.tanggal||'-')}</td>
                    <td class="text-center text-tiny">${r.prog.terisi}/${r.prog.total}</td>
                    ${window.PKKM_KOMPONEN.map(k => {
                      const d = r.akhir.detail.find(x => x.code === k.code);
                      return `<td class="text-center">${d ? fmtNilai(d.nilai) : '-'}</td>`;
                    }).join('')}
                    <td class="text-center fw-bold">${fmtNilai(r.akhir.nilaiAkhir)}</td>
                    <td class="text-center">${r.sebutan ? `<span class="${r.sebutan.cssClass}">${r.sebutan.label}</span>` : '-'}</td>
                    <td class="text-center">${r.p.status === 'final' ? '<span class="badge bg-success">FINAL</span>' : '<span class="badge bg-secondary">Draft</span>'}</td>
                    <td class="text-center">
                      <a href="#/penilaian/${kamad.id}/${r.periode?.id}" class="btn btn-sm btn-outline-primary" title="Buka"><i class="bi bi-pencil-square"></i></a>
                      <a href="#/cetak/${r.p.id}" class="btn btn-sm btn-outline-secondary" title="Cetak"><i class="bi bi-printer"></i></a>
                    </td>
                  </tr>`).join('')}
              </tbody>
            </table></div>`}
      </div>
    </div>

    ${rows.length >= 2 ? `
      <div class="card">
        <div class="card-header"><i class="bi bi-graph-up-arrow"></i> Tren Nilai per Komponen (kronologis)</div>
        <div class="card-body p-0">
          <div class="table-responsive"><table class="table table-sm mb-0">
            <thead class="table-light">
              <tr><th>Komponen</th>${rows.slice().reverse().map(r => `<th class="text-center text-tiny">${escapeHTML(r.periode?.label||'?')}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${tren.map(t => `
                <tr>
                  <td><span class="text-tiny">${escapeHTML(t.label)}</span></td>
                  ${t.series.map(s => `<td class="text-center">${s.nilai!=null?fmtNilai(s.nilai):'-'}</td>`).join('')}
                </tr>`).join('')}
              <tr class="table-light fw-bold">
                <td>Nilai Akhir</td>
                ${rows.slice().reverse().map(r => `<td class="text-center">${fmtNilai(r.akhir.nilaiAkhir)}</td>`).join('')}
              </tr>
            </tbody>
          </table></div>
        </div>
      </div>
    ` : ''}
  `;
});

// --- Rekap KKMA -------------------------------------------------
route('#/rekap-kkma', (root) => {
  const periodeList = Periode.list();
  if (periodeList.length === 0) {
    root.innerHTML = `<div class="alert alert-info">Belum ada periode. <a href="#/penilaian">Buat periode dulu</a>.</div>`;
    return;
  }
  const selPid = Number(location.hash.match(/[?&]p=(\d+)/)?.[1]) || periodeList[0].id;
  const periode = Periode.get(selPid);
  const kamadList = Kamad.list();

  // group by kkma
  const groups = {};
  for (const k of kamadList) {
    const key = (k.kkma || '(Tanpa KKMA)').trim();
    if (!groups[key]) groups[key] = { kkma: key, kamad: [] };
    const pen = Penilaian.byKamadPeriode(k.id, selPid);
    let akhir = null, sebutan = null;
    if (pen) {
      const a = hitungNilaiAkhir(pen.id);
      akhir = a.nilaiAkhir;
      sebutan = window.getPKKMSebutan(akhir);
    }
    groups[key].kamad.push({ k, pen, akhir, sebutan });
  }
  const groupRows = Object.values(groups).map(g => {
    const dinilai = g.kamad.filter(x => x.akhir != null).map(x => x.akhir);
    const rata = dinilai.length ? dinilai.reduce((a,b)=>a+b,0)/dinilai.length : null;
    const tertinggi = dinilai.length ? Math.max(...dinilai) : null;
    const terendah = dinilai.length ? Math.min(...dinilai) : null;
    return { ...g, rata, tertinggi, terendah, dinilai: dinilai.length };
  }).sort((a,b) => a.kkma.localeCompare(b.kkma));

  root.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h5 class="mb-0"><i class="bi bi-diagram-3"></i> Rekap KKMA</h5>
      <div class="d-flex gap-2 align-items-center">
        <label class="text-tiny text-muted mb-0">Periode:</label>
        <select class="form-select form-select-sm" id="periodeSelectKkma" style="min-width: 220px;">
          ${periodeList.map(p => `<option value="${p.id}" ${p.id===selPid?'selected':''}>${escapeHTML(p.label)}</option>`).join('')}
        </select>
        <button class="btn btn-sm btn-outline-primary" id="btnExportKkma"><i class="bi bi-file-earmark-excel"></i> Export Excel</button>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-header"><i class="bi bi-collection"></i> Ringkasan per KKMA — ${escapeHTML(periode.label)}</div>
      <div class="card-body p-0">
        <div class="table-responsive"><table class="table table-hover mb-0 align-middle">
          <thead class="table-light">
            <tr>
              <th>KKMA / Wilayah</th>
              <th class="text-end">Jumlah Kamad</th>
              <th class="text-end">Sudah Dinilai</th>
              <th class="text-end">Rata-rata</th>
              <th class="text-end">Tertinggi</th>
              <th class="text-end">Terendah</th>
              <th class="text-center">Sebutan Rata</th>
            </tr>
          </thead>
          <tbody>
            ${groupRows.map(g => {
              const sb = g.rata != null ? window.getPKKMSebutan(g.rata) : null;
              return `<tr>
                <td><strong>${escapeHTML(g.kkma)}</strong></td>
                <td class="text-end">${g.kamad.length}</td>
                <td class="text-end">${g.dinilai}</td>
                <td class="text-end fw-bold">${g.rata!=null?fmtNilai(g.rata):'-'}</td>
                <td class="text-end">${g.tertinggi!=null?fmtNilai(g.tertinggi):'-'}</td>
                <td class="text-end">${g.terendah!=null?fmtNilai(g.terendah):'-'}</td>
                <td class="text-center">${sb?`<span class="${sb.cssClass}">${sb.label}</span>`:'-'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table></div>
      </div>
    </div>

    ${groupRows.map(g => `
      <div class="card mb-3">
        <div class="card-header bg-primary text-white">
          <i class="bi bi-folder2-open"></i> ${escapeHTML(g.kkma)}
          <span class="badge bg-light text-dark ms-2">${g.kamad.length} kamad</span>
          ${g.rata!=null?`<span class="badge bg-warning text-dark ms-1">Rata: ${fmtNilai(g.rata)}</span>`:''}
        </div>
        <div class="card-body p-0">
          <div class="table-responsive"><table class="table table-sm table-hover mb-0 align-middle">
            <thead class="table-light">
              <tr>
                <th width="40">#</th>
                <th>Kepala Madrasah</th>
                <th>Madrasah</th>
                <th class="text-center">Jenjang</th>
                <th class="text-end">Nilai</th>
                <th class="text-center">Sebutan</th>
                <th class="text-center" width="110">Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${g.kamad.map((row, i) => `
                <tr>
                  <td>${i+1}</td>
                  <td>${escapeHTML(row.k.nama)}<div class="text-tiny text-muted">${escapeHTML(row.k.nip||'-')}</div></td>
                  <td>${escapeHTML(row.k.nama_madrasah||'-')}</td>
                  <td class="text-center"><span class="badge bg-secondary">${escapeHTML(row.k.jenjang||'-')}</span></td>
                  <td class="text-end fw-bold">${row.akhir!=null?fmtNilai(row.akhir):'-'}</td>
                  <td class="text-center">${row.sebutan?`<span class="${row.sebutan.cssClass}">${row.sebutan.label}</span>`:'-'}</td>
                  <td class="text-center">
                    <a href="#/penilaian/${row.k.id}/${selPid}" class="btn btn-sm btn-outline-primary"><i class="bi bi-pencil"></i></a>
                    <a href="#/riwayat/${row.k.id}" class="btn btn-sm btn-outline-secondary"><i class="bi bi-clock-history"></i></a>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table></div>
        </div>
      </div>
    `).join('')}
  `;

  $('#periodeSelectKkma').addEventListener('change', e => {
    location.hash = `#/rekap-kkma?p=${e.target.value}`;
  });

  $('#btnExportKkma').addEventListener('click', async () => {
    if (typeof ExcelJS === 'undefined') { toast('ExcelJS belum siap.', 'error'); return; }
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Rekap KKMA');
    ws.addRow(['Rekap PKKM per KKMA']).font = { bold: true, size: 14 };
    ws.addRow([periode.label]);
    ws.addRow([]);
    const hdr = ws.addRow(['KKMA','Jumlah Kamad','Dinilai','Rata-rata','Tertinggi','Terendah']);
    hdr.eachCell(c => { c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FF047A3A' } }; });
    groupRows.forEach(g => ws.addRow([
      g.kkma, g.kamad.length, g.dinilai,
      g.rata!=null?Number(g.rata.toFixed(2)):'',
      g.tertinggi!=null?Number(g.tertinggi.toFixed(2)):'',
      g.terendah!=null?Number(g.terendah.toFixed(2)):'',
    ]));
    ws.addRow([]);
    ws.addRow(['Detail per Kamad']).font = { bold: true };
    const hdr2 = ws.addRow(['KKMA','Nama','NIP','Madrasah','Jenjang','Nilai Akhir','Sebutan','Status']);
    hdr2.eachCell(c => { c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FF047A3A' } }; });
    groupRows.forEach(g => g.kamad.forEach(row => ws.addRow([
      g.kkma, row.k.nama, row.k.nip||'', row.k.nama_madrasah||'', row.k.jenjang||'',
      row.akhir!=null?Number(row.akhir.toFixed(2)):'',
      row.sebutan?row.sebutan.label:'',
      row.pen?row.pen.status:'belum',
    ])));
    ws.columns.forEach(c => c.width = 18);
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Rekap_KKMA_${periode.label.replace(/\s+/g,'_')}.xlsx`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Rekap KKMA diunduh.');
  });
});

// --- Instrumen viewer ------------------------------------------
route('#/instrumen', (root) => {
  const totalInd = window.PKKM_TOTAL_INDIKATOR || 0;
  root.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0"><i class="bi bi-list-check"></i> Instrumen PKKM</h5>
      <span class="text-tiny text-muted">5 komponen · ${window.PKKM_KOMPONEN.reduce((s,k)=>s+k.aspek.length,0)} sub-aspek · ${totalInd} indikator</span>
    </div>
    <div class="alert alert-info py-2 text-tiny"><i class="bi bi-info-circle"></i> Sumber: Aplikasi PKKM Excel v.110820 (Sarjono &amp; Ida Syam, Pengawas Kemenag Lamongan). Klik ℹ️ untuk panduan penggalian data per indikator.</div>
    ${window.PKKM_KOMPONEN.map(k => {
      const totalIndK = k.aspek.reduce((s,a)=>s+a.indikator.length,0);
      const meta = (window.PKKM_KOMPONEN_META||[]).find(x=>x.code===k.code);
      return `
      <div class="card mb-3 komponen-card">
        <div class="card-header">
          <strong>${k.no}. ${escapeHTML(k.label)}</strong>
          <span class="text-tiny text-muted ms-2">(${k.aspek.length} sub-aspek · ${totalIndK} indikator · bobot default ${meta?.bobot_default ?? 20}%)</span>
        </div>
        <div class="card-body p-0">
          ${k.aspek.map(a => `
            <div class="border-bottom">
              <div class="bg-light px-3 py-2">
                <strong>${escapeHTML(a.kode)}</strong> · ${escapeHTML(a.unsur||'')}
                <span class="text-tiny text-muted ms-2">(${a.indikator.length} indikator)</span>
              </div>
              <table class="table mb-0 table-sm">
                <tbody>
                  ${a.indikator.map(ind => `
                    <tr>
                      <td class="text-center text-muted" width="60">${a.kode}.${ind.no}</td>
                      <td>
                        ${escapeHTML(ind.indikator||'')}
                        <button type="button" class="btn btn-sm btn-link p-0 ms-1 text-primary" data-action="open-penggalian" data-indikator-id="${k.code}_${a.kode}_${ind.no}" title="Panduan penggalian data"><i class="bi bi-info-circle"></i></button>
                        <div class="text-tiny text-muted"><i class="bi bi-clipboard-data"></i> ${escapeHTML(ind.data||'-')}</div>
                      </td>
                    </tr>`).join('')}
                </tbody>
              </table>
            </div>`).join('')}
        </div>
      </div>`;
    }).join('')}
    <div class="text-tiny text-muted">
      Skor 1=Kurang, 2=Cukup, 3=Baik, 4=Amat Baik. Bobot komponen dapat diubah di <a href="#/pengaturan">Pengaturan</a>.
    </div>
  `;
  root.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-action="open-penggalian"]');
    if (b) { ev.preventDefault(); openPenggalianModal(b.dataset.indikatorId || b.dataset.aspekId); }
  });
});

// --- Analisis PKB (Pengembangan Keprofesian Berkelanjutan) ----
const PKB_UNSUR = [
  { code: 'pengembangan_diri', label: 'Pengembangan Diri', jenis: ['Diklat', 'Good Practice', 'Pengembangan Madrasah', 'Kegiatan Kolektif', 'Kajian dan Penelitian Tindakan', 'Pembelajaran Mandiri', 'Pembimbingan/Mentoring'] },
  { code: 'publikasi_ilmiah',  label: 'Publikasi Ilmiah',  jenis: ['Karya Ilmiah', 'Karya Populer', 'Pemakalah/Narasumber'] },
  { code: 'karya_inovatif',    label: 'Karya Inovatif',    jenis: ['Buku, Bahan Diklat, dan Pedoman KM', 'Standar MSDM (buku pedoman/modul)', 'Metode atau Teknologi Kepemimpinan/Manajemen'] },
];

// Mapping default unsur+jenis+kegiatan PKB berdasarkan komponen + sub-aspek
function suggestPKBForSubAspek(komponen_code, sub_aspek_kode, sub_aspek_unsur) {
  const unsur = (sub_aspek_unsur || '').toLowerCase();
  // Default mapping per komponen
  const presetByKomponen = {
    PM: { unsur: 'pengembangan_diri', jenis: 'Pengembangan Madrasah' },
    MJ: { unsur: 'pengembangan_diri', jenis: 'Diklat' },
    KW: { unsur: 'karya_inovatif',    jenis: 'Metode atau Teknologi Kepemimpinan/Manajemen' },
    SP: { unsur: 'pengembangan_diri', jenis: 'Pembimbingan/Mentoring' },
    HK: { unsur: 'publikasi_ilmiah',  jenis: 'Karya Ilmiah' },
  };
  const preset = presetByKomponen[komponen_code] || { unsur: 'pengembangan_diri', jenis: 'Diklat' };

  // Override khusus berdasarkan kata kunci di unsur sub-aspek
  let overrideJenis = null;
  if (/pembelajaran|kurikulum/.test(unsur)) overrideJenis = 'Diklat';
  else if (/supervisi/.test(unsur)) overrideJenis = 'Pembimbingan/Mentoring';
  else if (/manajemen|administrasi|sim|informasi/.test(unsur)) overrideJenis = 'Diklat';
  else if (/kewirausahaan|inovasi/.test(unsur)) overrideJenis = 'Metode atau Teknologi Kepemimpinan/Manajemen';
  else if (/kepemimpinan|kompetensi/.test(unsur)) overrideJenis = 'Pengembangan Madrasah';
  else if (/penelitian|kajian/.test(unsur)) overrideJenis = 'Kajian dan Penelitian Tindakan';
  else if (/publikasi|karya|tulis/.test(unsur)) overrideJenis = 'Karya Ilmiah';
  else if (/komite|hubungan|masyarakat/.test(unsur)) overrideJenis = 'Kegiatan Kolektif';

  if (overrideJenis) {
    // Adjust unsur kalau jenis baru tidak cocok dengan unsur preset
    const findUnsur = PKB_UNSUR.find(u => u.jenis.includes(overrideJenis));
    if (findUnsur) preset.unsur = findUnsur.code;
    preset.jenis = overrideJenis;
  }

  // Generate kegiatan otomatis
  const kegiatan = `Diklat / Bimtek / Pelatihan tentang ${sub_aspek_unsur || 'aspek terkait'}`;
  return { unsur_pkb: preset.unsur, jenis_pkb: preset.jenis, kegiatan_pkb: kegiatan };
}

function openPilihKamadPKB() {
  const kamadList = Kamad.list();
  const periodeList = Periode.list();
  if (!kamadList.length || !periodeList.length) { toast('Tambahkan kepala madrasah dan periode dulu.', 'error'); return; }
  const html = `
    <div class="modal fade" id="pilihPkbModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <form id="pilihPkbForm">
            <div class="modal-header">
              <h5 class="modal-title"><i class="bi bi-mortarboard"></i> Buka Analisis PKB</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="mb-2">
                <label class="form-label text-tiny">Kepala Madrasah</label>
                <select class="form-select" name="kamad_id" required>
                  ${kamadList.map(k => `<option value="${k.id}">${escapeHTML(k.nama)} · ${escapeHTML(k.nama_madrasah||'-')}</option>`).join('')}
                </select>
              </div>
              <div class="mb-2">
                <label class="form-label text-tiny">Periode</label>
                <select class="form-select" name="periode_id" required>
                  ${periodeList.map(p => `<option value="${p.id}">${escapeHTML(p.label)}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-light" data-bs-dismiss="modal">Batal</button>
              <button type="submit" class="btn btn-primary">Lanjut</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;
  let host = document.getElementById('pilihPkbModalHost');
  if (!host) { host = document.createElement('div'); host.id = 'pilihPkbModalHost'; document.body.appendChild(host); }
  host.innerHTML = html;
  const m = new bootstrap.Modal(document.getElementById('pilihPkbModal'));
  m.show();
  document.getElementById('pilihPkbForm').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    m.hide();
    navigate(`#/pkb/${fd.get('kamad_id')}/${fd.get('periode_id')}`);
  });
}

route('#/pkb', (root) => {
  root.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0"><i class="bi bi-mortarboard"></i> Analisis PKB</h5>
      <button class="btn btn-sm btn-outline-primary" id="btnPilihPkb"><i class="bi bi-search"></i> Pilih Kamad / Periode</button>
    </div>
    <div class="alert alert-info py-2 text-tiny">
      <i class="bi bi-info-circle"></i> Halaman ini menetapkan Pengembangan Keprofesian Berkelanjutan berdasarkan 5 sub-aspek dengan nilai terendah dari hasil penilaian kinerja. Pilih kepala madrasah + periode yang sudah punya penilaian.
    </div>
    <h6 class="mt-3">PKB yang sudah ditetapkan</h6>
    <div id="pkbList"></div>
  `;
  document.getElementById('btnPilihPkb').addEventListener('click', openPilihKamadPKB);
  // List existing PKB groups
  const list = window.PKB.list();
  const groups = {};
  for (const p of list) {
    const key = `${p.kamad_id}_${p.periode_id}`;
    if (!groups[key]) groups[key] = { kamad_id: p.kamad_id, periode_id: p.periode_id, items: [] };
    groups[key].items.push(p);
  }
  const grpHtml = Object.values(groups).map(g => {
    const k = Kamad.get(g.kamad_id);
    const p = Periode.get(g.periode_id);
    return `
      <div class="card mb-2">
        <div class="card-body py-2 d-flex justify-content-between align-items-center">
          <div>
            <div class="fw-semibold">${escapeHTML(k?.nama||'-')} · ${escapeHTML(p?.label||'-')}</div>
            <div class="text-tiny text-muted">${g.items.length} prioritas PKB · ${escapeHTML(k?.nama_madrasah||'-')}</div>
          </div>
          <a href="#/pkb/${g.kamad_id}/${g.periode_id}" class="btn btn-sm btn-outline-primary"><i class="bi bi-pencil-square"></i> Buka</a>
        </div>
      </div>`;
  }).join('') || '<div class="text-muted text-tiny">Belum ada PKB tersimpan.</div>';
  document.getElementById('pkbList').innerHTML = grpHtml;
});

route('#/pkb/:kamadId/:periodeId', (root, params) => {
  const kamad = Kamad.get(Number(params.kamadId));
  const periode = Periode.get(Number(params.periodeId));
  if (!kamad || !periode) {
    root.innerHTML = `<div class="alert alert-warning">Data tidak ditemukan. <a href="#/pkb">Kembali</a></div>`;
    return;
  }
  // Auto-detect prioritas (5 sub-aspek terendah) kalau belum ada
  const existing = window.PKB.forKamadPeriode(kamad.id, periode.id);
  if (!existing.length) {
    const auto = window.identifikasiPrioritasPKB(kamad.id, periode.id, 5);
    if (!auto.length) {
      root.innerHTML = `
        <h5 class="mb-3"><i class="bi bi-mortarboard"></i> Analisis PKB</h5>
        <div class="text-tiny text-muted">${escapeHTML(kamad.nama)} · ${escapeHTML(periode.label)}</div>
        <div class="alert alert-warning mt-3">Belum ada penilaian terisi untuk kamad ini di periode ini.
          <a href="#/penilaian" class="btn btn-sm btn-primary ms-2">Mulai Penilaian</a>
        </div>`;
      return;
    }
    // Save auto-detected priorities
    auto.forEach(sa => {
      window.PKB.upsert(kamad.id, periode.id, sa.sub_aspek_kode, {
        prioritas: sa.prioritas,
        komponen_code: sa.komponen_code,
        komponen_label: sa.komponen_label,
        sub_aspek_unsur: sa.sub_aspek_unsur,
        nilai: sa.nilai,
        unsur_pkb: '',
        jenis_pkb: '',
        kegiatan_pkb: '',
        catatan: '',
      });
    });
  }
  renderPKBForm();

  function renderPKBForm() {
    const items = window.PKB.forKamadPeriode(kamad.id, periode.id);
    root.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 class="mb-0"><i class="bi bi-mortarboard"></i> Analisis PKB</h5>
          <div class="text-tiny text-muted">${escapeHTML(kamad.nama)} · ${escapeHTML(kamad.nama_madrasah||'-')} · ${escapeHTML(periode.label)}</div>
        </div>
        <div class="btn-group">
          <a href="#/pkb" class="btn btn-sm btn-outline-secondary"><i class="bi bi-arrow-left"></i></a>
          <button class="btn btn-sm btn-warning" id="btnRefreshPkb" title="Hitung ulang prioritas dari nilai terkini"><i class="bi bi-arrow-clockwise"></i> Refresh Prioritas</button>
          <button class="btn btn-sm btn-success" id="btnAutoPkb" title="Isi unsur/jenis/kegiatan PKB otomatis"><i class="bi bi-magic"></i> Isi Otomatis</button>
          <a href="#/agregat/${kamad.id}/${periode.id}" class="btn btn-sm btn-outline-primary"><i class="bi bi-graph-up"></i> Lihat Nilai</a>
        </div>
      </div>

      <div class="alert alert-success py-2 text-tiny mb-3">
        <i class="bi bi-info-circle"></i> Daftar di bawah adalah <strong>5 sub-aspek dengan nilai terendah</strong> yang menjadi prioritas pengembangan profesi. Tetapkan unsur PKB dan kegiatan rekomendasi.
      </div>

      <div class="row g-3">
        ${items.map(p => {
          const sebutan = window.getPKKMSebutan(p.nilai);
          return `
            <div class="col-12">
              <div class="card pkb-card">
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <span class="badge bg-danger me-2">Prioritas ${p.prioritas}</span>
                      <strong>${escapeHTML(p.sub_aspek_kode)}</strong> · ${escapeHTML(p.sub_aspek_unsur||'-')}
                      <div class="text-tiny text-muted">${escapeHTML(p.komponen_label||'-')}</div>
                    </div>
                    <div class="text-end">
                      <div class="text-tiny text-muted">Nilai</div>
                      <div class="h5 mb-0 fw-bold">${fmtNilai(p.nilai)}</div>
                      ${sebutan ? `<span class="text-tiny ${sebutan.cssClass}">${sebutan.label}</span>` : ''}
                    </div>
                  </div>
                  <form data-pkb-id="${p.id}" data-sub-aspek="${p.sub_aspek_kode}">
                    <div class="row g-2">
                      <div class="col-md-3">
                        <label class="form-label text-tiny mb-1">Unsur PKB</label>
                        <select class="form-select form-select-sm" name="unsur_pkb">
                          <option value="">-- Pilih --</option>
                          ${PKB_UNSUR.map(u => `<option value="${u.code}" ${p.unsur_pkb===u.code?'selected':''}>${escapeHTML(u.label)}</option>`).join('')}
                        </select>
                      </div>
                      <div class="col-md-3">
                        <label class="form-label text-tiny mb-1">Jenis PKB</label>
                        <select class="form-select form-select-sm" name="jenis_pkb" data-jenis-for="${p.id}">
                          <option value="">-- Pilih unsur dulu --</option>
                          ${(() => {
                            const u = PKB_UNSUR.find(x => x.code === p.unsur_pkb);
                            return u ? u.jenis.map(j => `<option value="${escapeHTML(j)}" ${p.jenis_pkb===j?'selected':''}>${escapeHTML(j)}</option>`).join('') : '';
                          })()}
                        </select>
                      </div>
                      <div class="col-md-3">
                        <label class="form-label text-tiny mb-1">Kegiatan PKB</label>
                        <textarea class="form-control form-control-sm" name="kegiatan_pkb" rows="3" placeholder="Contoh: Diklat Kepemimpinan Madrasah">${escapeHTML(p.kegiatan_pkb||'')}</textarea>
                      </div>
                      <div class="col-md-3">
                        <label class="form-label text-tiny mb-1">Catatan / Target</label>
                        <textarea class="form-control form-control-sm" name="catatan" rows="3" placeholder="Target capaian, jadwal, dsb">${escapeHTML(p.catatan||'')}</textarea>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>`;
        }).join('')}
      </div>
    `;

    // Auto-save handler
    root.querySelectorAll('form[data-pkb-id]').forEach(form => {
      const subKode = form.dataset.subAspek;
      let t;
      const save = () => {
        clearTimeout(t);
        t = setTimeout(() => {
          const fd = new FormData(form);
          window.PKB.upsert(kamad.id, periode.id, subKode, {
            unsur_pkb: fd.get('unsur_pkb') || '',
            jenis_pkb: fd.get('jenis_pkb') || '',
            kegiatan_pkb: fd.get('kegiatan_pkb') || '',
            catatan: fd.get('catatan') || '',
          });
        }, 350);
      };
      form.querySelectorAll('input, textarea, select').forEach(el => {
        el.addEventListener('input', save);
        el.addEventListener('change', save);
      });
      // Update jenis options when unsur changes
      const sUnsur = form.querySelector('[name="unsur_pkb"]');
      const sJenis = form.querySelector('[name="jenis_pkb"]');
      sUnsur.addEventListener('change', () => {
        const u = PKB_UNSUR.find(x => x.code === sUnsur.value);
        sJenis.innerHTML = '<option value="">-- Pilih jenis --</option>' + (u ? u.jenis.map(j => `<option value="${escapeHTML(j)}">${escapeHTML(j)}</option>`).join('') : '');
      });
    });

    document.getElementById('btnRefreshPkb').addEventListener('click', () => {
      if (!confirmAction('Hitung ulang prioritas PKB? Data unsur/kegiatan akan dipertahankan untuk sub-aspek yang tetap masuk top 5.')) return;
      const auto = window.identifikasiPrioritasPKB(kamad.id, periode.id, 5);
      if (!auto.length) { toast('Belum ada nilai untuk dianalisis.', 'error'); return; }
      // Save existing user input first
      const old = window.PKB.forKamadPeriode(kamad.id, periode.id);
      const oldMap = {};
      for (const o of old) oldMap[o.sub_aspek_kode] = o;
      // Remove all then re-add with merged user input
      window.PKB.removeAll(kamad.id, periode.id);
      auto.forEach(sa => {
        const prev = oldMap[sa.sub_aspek_kode] || {};
        window.PKB.upsert(kamad.id, periode.id, sa.sub_aspek_kode, {
          prioritas: sa.prioritas,
          komponen_code: sa.komponen_code,
          komponen_label: sa.komponen_label,
          sub_aspek_unsur: sa.sub_aspek_unsur,
          nilai: sa.nilai,
          unsur_pkb: prev.unsur_pkb || '',
          jenis_pkb: prev.jenis_pkb || '',
          kegiatan_pkb: prev.kegiatan_pkb || '',
          catatan: prev.catatan || '',
        });
      });
      toast('Prioritas PKB di-refresh.');
      renderPKBForm();
    });

    document.getElementById('btnAutoPkb').addEventListener('click', () => {
      const items = window.PKB.forKamadPeriode(kamad.id, periode.id);
      if (!items.length) { toast('Belum ada prioritas PKB.', 'error'); return; }
      const sudahTerisi = items.some(p => (p.unsur_pkb || p.jenis_pkb || p.kegiatan_pkb || '').toString().trim());
      if (sudahTerisi && !confirmAction('Beberapa kolom sudah terisi. Isi otomatis akan menimpa. Lanjutkan?')) return;
      items.forEach(p => {
        const sug = suggestPKBForSubAspek(p.komponen_code, p.sub_aspek_kode, p.sub_aspek_unsur);
        const catatan = p.catatan || `Direncanakan agar nilai sub-aspek "${p.sub_aspek_unsur || '-'}" meningkat dari ${p.nilai != null ? Number(p.nilai).toFixed(2) : '-'} menuju kategori Baik/Amat Baik.`;
        window.PKB.upsert(kamad.id, periode.id, p.sub_aspek_kode, {
          unsur_pkb: sug.unsur_pkb,
          jenis_pkb: sug.jenis_pkb,
          kegiatan_pkb: sug.kegiatan_pkb,
          catatan,
        });
      });
      toast('Unsur, jenis, kegiatan, dan catatan PKB terisi otomatis.');
      renderPKBForm();
    });
  }
});

// --- Rekap 4 Tahunan (per kamad) -------------------------------
route('#/rekap-tahunan', (root) => {
  const kamadList = Kamad.list();
  if (!kamadList.length) {
    root.innerHTML = `<div class="alert alert-info">Belum ada kepala madrasah. <a href="#/kamad">Tambah dulu</a>.</div>`;
    return;
  }
  const selKid = Number(location.hash.match(/[?&]k=(\d+)/)?.[1]) || kamadList[0].id;
  const kamad = Kamad.get(selKid);
  if (!kamad) { root.innerHTML = '<div class="alert alert-warning">Kamad tidak ditemukan.</div>'; return; }

  // Cari periode tahun_1..tahun_4 yang punya penilaian utk kamad ini
  const allPeriode = Periode.list();
  const tahunData = ['tahun_1', 'tahun_2', 'tahun_3', 'tahun_4'].map(tcode => {
    const periodes = allPeriode.filter(p => p.type === tcode);
    let nilai = null, periode = null, agg = null;
    for (const p of periodes) {
      const sessions = Penilaian.forKamadPeriode(kamad.id, p.id);
      if (!sessions.length) continue;
      // Pakai periode terbaru kalau ada >1 untuk tahun yg sama
      if (sessions.length > 1) {
        agg = hitungNilaiAgregat(kamad.id, p.id);
        nilai = agg.nilaiAgregat;
      } else {
        nilai = hitungNilaiAkhir(sessions[0].id).nilaiAkhir;
      }
      periode = p;
      break;
    }
    return { code: tcode, label: window.PKKM_PERIODE_TYPES.find(x => x.code === tcode)?.label || tcode, nilai, periode, agg };
  });

  const validNilai = tahunData.filter(t => t.nilai != null).map(t => t.nilai);
  const rataAgregat = validNilai.length ? validNilai.reduce((a,b) => a+b, 0) / validNilai.length : null;
  const sebutanFinal = rataAgregat != null ? window.getPKKMSebutan(rataAgregat) : null;

  root.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h5 class="mb-0"><i class="bi bi-calendar3-range"></i> Rekap 4 Tahunan</h5>
      <div class="d-flex gap-2 align-items-center flex-wrap">
        <select class="form-select form-select-sm" id="kamadSelect" style="min-width: 280px;">
          ${kamadList.map(k => `<option value="${k.id}" ${k.id===selKid?'selected':''}>${escapeHTML(k.nama)} · ${escapeHTML(k.nama_madrasah||'-')}</option>`).join('')}
        </select>
        <button class="btn btn-sm btn-success" id="btnExportXlsx"><i class="bi bi-file-earmark-excel"></i> Export Excel Resmi</button>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-body">
        <div class="row g-3 align-items-center">
          <div class="col-md-4">
            <div class="text-tiny text-muted">Kepala Madrasah</div>
            <div class="fw-semibold">${escapeHTML(kamad.nama)}</div>
            <div class="text-tiny text-muted">NIP: ${escapeHTML(kamad.nip||'-')} · ${escapeHTML(kamad.nama_madrasah||'-')}</div>
          </div>
          <div class="col-md-4 text-center">
            <div class="text-tiny text-muted">Tahun terisi</div>
            <div class="h4 fw-bold mb-0">${validNilai.length} <span class="text-tiny text-muted">/ 4</span></div>
          </div>
          <div class="col-md-4 text-center">
            <div class="text-tiny text-muted">Nilai Rata-Rata 4 Tahun</div>
            <div class="h2 fw-bold mb-0 text-primary">${rataAgregat != null ? fmtNilai(rataAgregat) : '-'}</div>
            ${sebutanFinal ? `<span class="${sebutanFinal.cssClass}">${sebutanFinal.label}</span>` : ''}
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3">
      ${tahunData.map(t => {
        const sb = t.nilai != null ? window.getPKKMSebutan(t.nilai) : null;
        return `
          <div class="col-md-3 col-sm-6">
            <div class="card h-100 ${t.nilai==null ? 'border-light' : ''}">
              <div class="card-body text-center">
                <div class="text-tiny text-muted">${escapeHTML(t.label)}</div>
                ${t.nilai != null
                  ? `<div class="display-6 fw-bold mb-1">${fmtNilai(t.nilai)}</div>
                     <div class="${sb.cssClass} mb-2">${sb.label}</div>
                     <div class="text-tiny text-muted">${escapeHTML(t.periode.label)}</div>
                     <a href="#/agregat/${kamad.id}/${t.periode.id}" class="btn btn-sm btn-outline-primary mt-2"><i class="bi bi-eye"></i> Detail</a>`
                  : `<div class="display-6 fw-bold mb-1 text-muted">-</div>
                     <div class="text-tiny text-muted mb-2">Belum dinilai</div>
                     <a href="#/penilaian" class="btn btn-sm btn-outline-secondary mt-2"><i class="bi bi-plus"></i> Mulai</a>`
                }
              </div>
            </div>
          </div>`;
      }).join('')}
    </div>

    <div class="card mt-3">
      <div class="card-header"><i class="bi bi-bar-chart"></i> Tren Komponen 4 Tahun</div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table mb-0 align-middle">
            <thead class="table-light">
              <tr>
                <th>Komponen</th>
                ${tahunData.map(t => `<th class="text-center text-tiny">${escapeHTML(t.label)}</th>`).join('')}
                <th class="text-center">Rata-rata</th>
              </tr>
            </thead>
            <tbody>
              ${(window.PKKM_KOMPONEN_META || window.PKKM_KOMPONEN).map(km => {
                const vals = tahunData.map(t => {
                  if (!t.periode) return null;
                  const sessions = Penilaian.forKamadPeriode(kamad.id, t.periode.id);
                  if (!sessions.length) return null;
                  if (sessions.length > 1) {
                    const v = sessions.map(s => hitungNilaiKomponen(s.id, km.code).nilai);
                    return v.reduce((a,b)=>a+b,0)/v.length;
                  }
                  return hitungNilaiKomponen(sessions[0].id, km.code).nilai;
                });
                const filled = vals.filter(v => v != null);
                const rata = filled.length ? filled.reduce((a,b)=>a+b,0)/filled.length : null;
                return `
                  <tr>
                    <td><strong>${km.no}.</strong> ${escapeHTML(km.label)}</td>
                    ${vals.map(v => `<td class="text-center">${v != null ? fmtNilai(v) : '<span class="text-muted">-</span>'}</td>`).join('')}
                    <td class="text-center"><strong>${rata != null ? fmtNilai(rata) : '-'}</strong></td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  $('#kamadSelect').addEventListener('change', e => {
    location.hash = `#/rekap-tahunan?k=${e.target.value}`;
  });
  $('#btnExportXlsx').addEventListener('click', async () => {
    if (typeof window.exportPKKMExcel !== 'function') { toast('Modul export belum siap.', 'error'); return; }
    await window.exportPKKMExcel(selKid);
  });
});

// --- Backup / Restore ------------------------------------------
route('#/backup', (root) => {
  root.innerHTML = `
    <h5 class="mb-3"><i class="bi bi-cloud-arrow-down"></i> Backup &amp; Restore</h5>
    <div class="row g-3">
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header"><i class="bi bi-download"></i> Export</div>
          <div class="card-body">
            <p class="text-tiny text-muted">Unduh seluruh data PKKM (kamad, periode, penilaian, skor, pengaturan) sebagai 1 file JSON.</p>
            <button class="btn btn-primary" id="btnExport"><i class="bi bi-download"></i> Download Backup JSON</button>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header"><i class="bi bi-upload"></i> Import</div>
          <div class="card-body">
            <p class="text-tiny text-muted">Restore data dari file backup. Akan menimpa data yang ada.</p>
            <input type="file" class="form-control mb-2" id="restoreFile" accept=".json,application/json">
            <button class="btn btn-warning" id="btnRestore"><i class="bi bi-upload"></i> Restore</button>
          </div>
        </div>
      </div>
      <div class="col-12">
        <div class="card border-danger">
          <div class="card-header bg-danger text-white"><i class="bi bi-exclamation-triangle"></i> Zona Berbahaya</div>
          <div class="card-body">
            <p class="text-tiny text-muted mb-2">Hapus semua data PKKM dari browser ini. Tidak bisa diurungkan.</p>
            <button class="btn btn-outline-danger" id="btnWipe"><i class="bi bi-trash3"></i> Hapus Semua Data</button>
          </div>
        </div>
      </div>
    </div>
  `;

  $('#btnExport').addEventListener('click', () => {
    const data = backupAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `pkkm_backup_${nowLocal().slice(0,10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Backup diunduh.');
  });

  $('#btnRestore').addEventListener('click', async () => {
    const f = $('#restoreFile').files[0];
    if (!f) { toast('Pilih file backup dulu.', 'error'); return; }
    if (!confirmAction('Restore akan menimpa semua data saat ini. Lanjutkan?')) return;
    try {
      const text = await f.text();
      const json = JSON.parse(text);
      restoreAll(json);
      toast('Data berhasil di-restore.');
      setTimeout(() => navigate('#/'), 600);
    } catch (e) {
      toast('Gagal restore: ' + e.message, 'error');
    }
  });

  $('#btnWipe').addEventListener('click', () => {
    if (!confirmAction('Hapus SEMUA data PKKM? Tindakan ini tidak bisa diurungkan.')) return;
    if (!confirmAction('Yakin? Pastikan sudah backup.')) return;
    wipeAll();
    toast('Semua data dihapus.');
    setTimeout(() => navigate('#/'), 600);
  });
});

// --- Pengaturan ------------------------------------------------
route('#/pengaturan', (root) => {
  const bobot = Meta.bobot();
  const bobotRole = window.getBobotRole ? window.getBobotRole() : { pengawas: 50, gtk: 30, komite: 20 };
  const pengawas = Meta.get('identitas_pengawas', { nama: '', nip: '' });
  const pokjawas = Meta.get('identitas_ketua_pokjawas', { nama: 'SUBARIYANTO, S.Pd, M.Pd.I', nip: '197002122005011004' });
  const tempat = Meta.get('lokasi_ttd', 'Jember');

  // Use META komponen list (5 komp) supaya tidak terpengaruh role aktif
  const KOMP_META = window.PKKM_KOMPONEN_META || window.PKKM_KOMPONEN.map(k => ({ no: k.no, code: k.code, label: k.label, bobot_default: 20 }));

  root.innerHTML = `
    <h5 class="mb-3"><i class="bi bi-gear"></i> Pengaturan</h5>
    <div class="row g-3">
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header">Bobot Komponen (%)</div>
          <div class="card-body">
            <form id="bobotForm">
              ${KOMP_META.map(k => `
                <div class="mb-2 row">
                  <label class="col-sm-8 col-form-label col-form-label-sm">${k.no}. ${escapeHTML(k.label)}</label>
                  <div class="col-sm-4">
                    <input class="form-control form-control-sm" type="number" name="${k.code}" min="0" max="100" step="0.01" value="${bobot[k.code]}">
                  </div>
                </div>
              `).join('')}
              <div class="text-tiny text-muted mb-2" id="totalBobot"></div>
              <button class="btn btn-sm btn-primary"><i class="bi bi-save"></i> Simpan</button>
              <button type="button" class="btn btn-sm btn-outline-secondary" id="btnResetBobot">Reset Default</button>
            </form>
          </div>
        </div>

        <div class="card mt-3">
          <div class="card-header">Bobot Penilai (Multi-Assessor)</div>
          <div class="card-body">
            <p class="text-tiny text-muted mb-2">Bobot rata-rata kelompok penilai untuk halaman <strong>Rekap Agregat</strong> (terutama penilaian 4 Tahunan). Default Pengawas 50% · Guru/Tendik 30% · Komite/KKKS 20%.</p>
            <form id="bobotRoleForm">
              <div class="mb-2 row">
                <label class="col-sm-8 col-form-label col-form-label-sm">Pengawas Madrasah (gabungan I &amp; II)</label>
                <div class="col-sm-4"><input class="form-control form-control-sm" type="number" name="pengawas" min="0" max="100" step="1" value="${bobotRole.pengawas}"></div>
              </div>
              <div class="mb-2 row">
                <label class="col-sm-8 col-form-label col-form-label-sm">Guru &amp; Tendik (Guru I/II + Tendik I/II)</label>
                <div class="col-sm-4"><input class="form-control form-control-sm" type="number" name="gtk" min="0" max="100" step="1" value="${bobotRole.gtk}"></div>
              </div>
              <div class="mb-2 row">
                <label class="col-sm-8 col-form-label col-form-label-sm">Komite / Kasi-Yayasan / Kabid</label>
                <div class="col-sm-4"><input class="form-control form-control-sm" type="number" name="km_kb_ks" min="0" max="100" step="1" value="${bobotRole.km_kb_ks}"></div>
              </div>
              <div class="text-tiny text-muted mb-2" id="totalBobotRole"></div>
              <button class="btn btn-sm btn-primary"><i class="bi bi-save"></i> Simpan</button>
              <button type="button" class="btn btn-sm btn-outline-secondary" id="btnResetBobotRole">Reset Default</button>
            </form>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card h-100">
          <div class="card-header">Identitas Tanda Tangan</div>
          <div class="card-body">
            <form id="ttdForm">
              <div class="mb-2">
                <label class="form-label text-tiny mb-1">Lokasi TTD</label>
                <input class="form-control form-control-sm" name="lokasi_ttd" value="${escapeHTML(tempat)}">
              </div>
              <hr>
              <div class="mb-2">
                <label class="form-label text-tiny mb-1">Nama Pengawas</label>
                <input class="form-control form-control-sm" name="pengawas_nama" value="${escapeHTML(pengawas.nama||'')}">
              </div>
              <div class="mb-2">
                <label class="form-label text-tiny mb-1">NIP Pengawas</label>
                <input class="form-control form-control-sm" name="pengawas_nip" value="${escapeHTML(pengawas.nip||'')}">
              </div>
              <hr>
              <div class="mb-2">
                <label class="form-label text-tiny mb-1">Nama Ketua Pokjawas</label>
                <input class="form-control form-control-sm" name="pokjawas_nama" value="${escapeHTML(pokjawas.nama||'')}">
              </div>
              <div class="mb-2">
                <label class="form-label text-tiny mb-1">NIP Ketua Pokjawas</label>
                <input class="form-control form-control-sm" name="pokjawas_nip" value="${escapeHTML(pokjawas.nip||'')}">
              </div>
              <button class="btn btn-sm btn-primary"><i class="bi bi-save"></i> Simpan</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;

  function refreshTotal() {
    let total = 0;
    $$('#bobotForm input[type=number]').forEach(i => total += Number(i.value || 0));
    $('#totalBobot').innerHTML = `Total bobot: <strong>${total.toFixed(2)}%</strong> ${total === 100 ? '<span class="text-success">(ideal)</span>' : '<span class="text-warning">(akan dinormalisasi otomatis)</span>'}`;
  }
  refreshTotal();
  $$('#bobotForm input[type=number]').forEach(i => i.addEventListener('input', refreshTotal));

  $('#bobotForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const map = {};
    for (const [k,v] of fd.entries()) map[k] = Number(v);
    Meta.setBobot(map);
    toast('Bobot disimpan.');
  });

  $('#btnResetBobot').addEventListener('click', () => {
    Meta.setBobot({});
    toast('Bobot direset ke default.');
    render();
  });

  // Bobot role handlers
  function refreshTotalRole() {
    let total = 0;
    $$('#bobotRoleForm input[type=number]').forEach(i => total += Number(i.value || 0));
    $('#totalBobotRole').innerHTML = `Total bobot: <strong>${total.toFixed(0)}%</strong> ${total === 100 ? '<span class="text-success">(ideal)</span>' : '<span class="text-warning">(akan dinormalisasi)</span>'}`;
  }
  refreshTotalRole();
  $$('#bobotRoleForm input[type=number]').forEach(i => i.addEventListener('input', refreshTotalRole));

  $('#bobotRoleForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const map = { pengawas: Number(fd.get('pengawas')), gtk: Number(fd.get('gtk')), km_kb_ks: Number(fd.get('km_kb_ks')) };
    Meta.set('bobot_role', map);
    toast('Bobot penilai disimpan.');
  });

  $('#btnResetBobotRole').addEventListener('click', () => {
    Meta.set('bobot_role', null);
    toast('Bobot penilai direset.');
    render();
  });

  $('#ttdForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    Meta.set('lokasi_ttd', fd.get('lokasi_ttd'));
    Meta.set('identitas_pengawas', { nama: fd.get('pengawas_nama'), nip: fd.get('pengawas_nip') });
    Meta.set('identitas_ketua_pokjawas', { nama: fd.get('pokjawas_nama'), nip: fd.get('pokjawas_nip') });
    toast('Identitas tanda tangan disimpan.');
  });
});

// === Boot ======================================================
$('#appVersionLabel').textContent = `v${APP_VERSION}`;
if (!location.hash) location.hash = '#/';
render();

// Service worker register (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW reg failed:', err));
  });
}
