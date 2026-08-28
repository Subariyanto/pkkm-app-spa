// admin-license.js - Panel Admin Pengelolaan Kode Aktivasi PKKM (Tahap 3)
// Route: #/admin/aktivasi — HANYA admin yang punya akses
// Semua operasi via Supabase RPC, tidak ada akses langsung ke tabel
(function () {
  'use strict';

  var ADMIN_KEY_STORAGE = 'pkkm_admin_key'; // sessionStorage only
  var PAGE_SIZE = 25;
  var allCodes = [];
  var filteredCodes = [];
  var currentPage = 1;
  var currentFilter = 'all';
  var currentSearch = '';
  var currentSort = 'newest';

  function esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function fmtDate(s) {
    if (!s) return '-';
    try { return new Date(s).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return s; }
  }

  function shortDevice(d) {
    if (!d) return '-';
    var s = String(d);
    if (s.length <= 16) return esc(s);
    return esc(s.substring(0, 8)) + '...' + esc(s.substring(s.length - 4));
  }

  function isAdmin() {
    // Cek via sessionStorage admin key (Tahap 2 admin panel)
    return !!sessionStorage.getItem(ADMIN_KEY_STORAGE);
  }

  function toast(msg, type) {
    type = type || 'info';
    var bg = type === 'success' ? '#16a34a' : type === 'danger' ? '#dc2626' : '#2563eb';
    var el = document.createElement('div');
    el.className = 'admin-toast';
    el.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;background:' + bg + ';color:#fff;padding:12px 20px;border-radius:8px;font-size:.9rem;box-shadow:0 4px 12px rgba(0,0,0,.15);max-width:350px;word-wrap:break-word;';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(function () { el.remove(); }, 300); }, 3000);
  }

  // ================================================================
  // RENDER PAGE
  // ================================================================
  async function renderPage(root) {
    // Guard: cek admin key
    if (!isAdmin()) {
      root.innerHTML = renderLogin(root);
      bindLogin(root);
      return;
    }

    // Admin sudah login → render panel
    await renderPanel(root);
  }

  function renderLogin(root) {
    var html = '<div class="container py-4" style="max-width:500px">';
    html += '<div class="card shadow-sm"><div class="card-body">';
    html += '<h4 class="card-title mb-3"><i class="bi bi-shield-lock-fill"></i> Admin Login</h4>';
    html += '<p class="text-muted small">Masukkan Admin Key untuk mengakses panel manajemen kode aktivasi.</p>';
    html += '<div class="mb-3"><input type="password" id="adminKeyInput" class="form-control" placeholder="Admin Key" autocomplete="off"></div>';
    html += '<button class="btn btn-primary w-100" id="btnAdminLogin">🔑 Login</button>';
    html += '<div id="loginError" class="text-danger mt-2 small" style="display:none;"></div>';
    html += '</div></div></div>';
    return html;
  }

  function bindLogin(root) {
    var btn = root.querySelector('#btnAdminLogin');
    var input = root.querySelector('#adminKeyInput');
    var errEl = root.querySelector('#loginError');

    var doLogin = async function () {
      var key = (input.value || '').trim();
      if (!key) { errEl.textContent = 'Admin Key tidak boleh kosong.'; errEl.style.display = ''; return; }
      btn.disabled = true; btn.textContent = '⏳ Memverifikasi...';
      try {
        var stats = await window.SupabaseSync.adminGetStats(key);
        if (stats.success === false) {
          errEl.textContent = 'Admin Key salah atau koneksi gagal.';
          errEl.style.display = '';
          btn.disabled = false; btn.textContent = '🔑 Login';
          return;
        }
        // Sukses — simpan key di sessionStorage
        sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
        await renderPanel(root);
      } catch (e) {
        errEl.textContent = 'Terjadi kesalahan: ' + e.message;
        errEl.style.display = '';
        btn.disabled = false; btn.textContent = '🔑 Login';
      }
    };

    btn.addEventListener('click', doLogin);
    input.addEventListener('keypress', function (e) { if (e.key === 'Enter') doLogin(); });
  }

  async function renderPanel(root) {
    var key = sessionStorage.getItem(ADMIN_KEY_STORAGE);
    root.innerHTML = '<div class="container py-3" style="max-width:1200px"><div class="text-center py-4"><div class="spinner-border text-primary"></div><div class="mt-2 text-muted small">Memuat data aktivasi...</div></div></div>';

    try {
      var stats = await window.SupabaseSync.adminGetStats(key);
      var codes = await window.SupabaseSync.adminListCodes(key);
      allCodes = codes || [];
      filteredCodes = allCodes.slice();
    } catch (e) {
      root.innerHTML = '<div class="container py-4"><div class="alert alert-danger">Gagal memuat data: ' + esc(e.message) + '</div></div>';
      return;
    }

    if (!stats || stats.success === false) {
      // Admin key tidak valid → logout
      sessionStorage.removeItem(ADMIN_KEY_STORAGE);
      root.innerHTML = renderLogin(root);
      bindLogin(root);
      return;
    }

    var html = '<div class="container py-3" style="max-width:1200px">';

    // Header
    html += '<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">';
    html += '<div><h4 class="mb-0"><i class="bi bi-shield-lock-fill"></i> Manajemen Kode Aktivasi</h4>';
    html += '<p class="text-muted small mb-0">Kelola kode aktivasi pengguna aplikasi PKKM</p></div>';
    html += '<button class="btn btn-sm btn-outline-danger" id="btnAdminLogout"><i class="bi bi-box-arrow-right"></i> Keluar Admin</button>';
    html += '</div>';

    // Dashboard ringkas
    html += '<div class="row g-2 mb-3">';
    html += renderStatCard('Total Kode', stats.total || 0, 'primary');
    html += renderStatCard('Belum Digunakan', stats.unused || 0, 'success');
    html += renderStatCard('Sudah Digunakan', stats.used || 0, 'info');
    html += renderStatCard('Dinonaktifkan', stats.revoked || 0, 'danger');
    html += '</div>';

    // Toolbar
    html += '<div class="card shadow-sm mb-3"><div class="card-body">';
    html += '<div class="d-flex gap-2 flex-wrap mb-2">';
    html += '<button class="btn btn-primary btn-sm" id="btnCreate"><i class="bi bi-plus-circle"></i> Buat Kode Aktivasi</button>';
    html += '<button class="btn btn-outline-secondary btn-sm" id="btnRefresh"><i class="bi bi-arrow-clockwise"></i> Refresh</button>';
    html += '<button class="btn btn-outline-info btn-sm" id="btnAuditLog"><i class="bi bi-clock-history"></i> Audit Log</button>';
    html += '</div>';

    // Search + Filter
    html += '<div class="row g-2 align-items-center">';
    html += '<div class="col-md-6"><input type="text" id="searchInput" class="form-control form-control-sm" placeholder="Cari kode, catatan, device ID..."></div>';
    html += '<div class="col-md-3"><select id="filterSelect" class="form-select form-select-sm">';
    html += '<option value="all">Semua</option>';
    html += '<option value="unused">Belum Digunakan</option>';
    html += '<option value="used">Sudah Digunakan</option>';
    html += '<option value="revoked">Dinonaktifkan</option>';
    html += '</select></div>';
    html += '<div class="col-md-3"><select id="sortSelect" class="form-select form-select-sm">';
    html += '<option value="newest">Terbaru</option>';
    html += '<option value="oldest">Terlama</option>';
    html += '<option value="code-az">Kode A-Z</option>';
    html += '<option value="status">Status</option>';
    html += '</select></div>';
    html += '</div>'; // row

    html += '</div></div>'; // card

    // Table/card container
    html += '<div id="codesContainer"></div>';

    // Pagination
    html += '<div id="pagination" class="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3"></div>';

    html += '</div>'; // container

    root.innerHTML = html;
    bindToolbar(root);
    applyFilter();
  }

  function renderStatCard(label, value, color) {
    var colors = { primary: 'primary', success: 'success', info: 'info', danger: 'danger' };
    return '<div class="col-6 col-md-3"><div class="card border-' + (colors[color] || 'primary') + '"><div class="card-body text-center py-2 px-1"><div class="h4 mb-0 text-' + (colors[color] || 'primary') + '">' + value + '</div><div class="small text-muted">' + label + '</div></div></div></div>';
  }

  // ================================================================
  // FILTER + SEARCH + SORT
  // ================================================================
  function applyFilter() {
    filteredCodes = allCodes.filter(function (c) {
      // Filter
      if (currentFilter === 'unused' && c.used_by) return false;
      if (currentFilter === 'used' && !c.used_by) return false;
      if (currentFilter === 'revoked' && c.status !== 'revoked') return false;

      // Search
      if (currentSearch) {
        var q = currentSearch.toLowerCase();
        var haystack = ((c.code || '') + ' ' + (c.recipient || '') + ' ' + (c.used_by || '') + ' ' + (c.note || '')).toLowerCase();
        if (haystack.indexOf(q) === -1) return false;
      }
      return true;
    });

    // Sort
    filteredCodes.sort(function (a, b) {
      switch (currentSort) {
        case 'oldest': return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        case 'code-az': return (a.code || '').localeCompare(b.code || '');
        case 'status': return (a.status || '').localeCompare(b.status || '');
        case 'newest':
        default: return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
    });

    currentPage = 1;
    renderCodes();
  }

  // ================================================================
  // RENDER TABLE / CARDS
  // ================================================================
  function renderCodes() {
    var container = document.getElementById('codesContainer');
    if (!container) return;

    var total = filteredCodes.length;
    var pages = Math.ceil(total / PAGE_SIZE);
    if (currentPage > pages) currentPage = pages || 1;
    var start = (currentPage - 1) * PAGE_SIZE;
    var end = Math.min(start + PAGE_SIZE, total);
    var pageData = filteredCodes.slice(start, end);

    if (total === 0) {
      container.innerHTML = '<div class="card shadow-sm"><div class="card-body text-center py-4 text-muted"><i class="bi bi-inbox fs-1"></i><p class="mt-2 mb-3">Belum ada kode aktivasi.</p><button class="btn btn-primary btn-sm" onclick="document.getElementById(\'btnCreate\').click()"><i class="bi bi-plus-circle"></i> Buat Kode Aktivasi</button></div></div>';
      renderPagination();
      return;
    }

    // Deteksi mobile
    var isMobile = window.innerWidth < 768;

    if (isMobile) {
      // Card layout untuk mobile
      var html = '<div class="d-flex flex-column gap-2">';
      pageData.forEach(function (c, idx) {
        var num = start + idx + 1;
        html += renderCard(c, num);
      });
      html += '</div>';
      container.innerHTML = html;
    } else {
      // Table untuk desktop
      var html = '<div class="card shadow-sm"><div class="table-responsive"><table class="table table-sm table-hover mb-0" style="font-size:.85rem">';
      html += '<thead class="table-light"><tr>';
      html += '<th style="width:40px">No</th><th>Kode Aktivasi</th><th>Status</th><th>Perangkat</th><th>Digunakan</th><th>Catatan</th><th style="width:1px" class="text-center">Aksi</th>';
      html += '</tr></thead><tbody>';
      pageData.forEach(function (c, idx) {
        var num = start + idx + 1;
        html += renderRow(c, num);
      });
      html += '</tbody></table></div></div>';
      container.innerHTML = html;
    }

    bindCodeActions(container);
    renderPagination();
  }

  function statusBadge(c) {
    if (c.status === 'revoked') return '<span class="badge bg-danger">Dinonaktifkan</span>';
    if (c.used_by) return '<span class="badge bg-success">Aktif</span>';
    return '<span class="badge bg-info text-dark">Belum Digunakan</span>';
  }

  function renderRow(c, num) {
    var safeCode = esc(c.code);
    var html = '<tr>';
    html += '<td>' + num + '</td>';
    html += '<td><code class="user-select-all">' + safeCode + '</code></td>';
    html += '<td>' + statusBadge(c) + '</td>';
    html += '<td class="small">' + shortDevice(c.used_by) + '</td>';
    html += '<td class="small">' + (c.used_at ? fmtDate(c.used_at) : '-') + '</td>';
    html += '<td class="small">' + esc(c.recipient || c.note || '-') + '</td>';
    html += '<td class="text-center text-nowrap">' + renderActions(c) + '</td>';
    html += '</tr>';
    return html;
  }

  function renderCard(c, num) {
    var safeCode = esc(c.code);
    var html = '<div class="card shadow-sm"><div class="card-body py-2 px-3">';
    html += '<div class="d-flex justify-content-between align-items-start">';
    html += '<div><code class="user-select-all fw-bold">' + safeCode + '</code></div>';
    html += '<div>' + statusBadge(c) + '</div>';
    html += '</div>';
    html += '<div class="small text-muted mt-1">';
    html += '<div><b>Perangkat:</b> ' + shortDevice(c.used_by) + '</div>';
    html += '<div><b>Digunakan:</b> ' + (c.used_at ? fmtDate(c.used_at) : '-') + '</div>';
    if (c.recipient || c.note) html += '<div><b>Catatan:</b> ' + esc(c.recipient || c.note) + '</div>';
    html += '</div>';
    html += '<div class="d-flex gap-1 mt-2 flex-wrap">' + renderActions(c, true) + '</div>';
    html += '</div></div>';
    return html;
  }

  function renderActions(c, isCard) {
    var safeCode = esc(c.code);
    var btns = '';

    // Copy
    btns += '<button class="btn btn-sm btn-outline-secondary" data-copy="' + safeCode + '" title="Salin"><i class="bi bi-clipboard"></i>' + (isCard ? ' Salin' : '') + '</button>';

    // Detail
    btns += '<button class="btn btn-sm btn-outline-info" data-detail="' + safeCode + '" title="Detail"><i class="bi bi-info-circle"></i>' + (isCard ? ' Detail' : '') + '</button>';

    // Edit catatan/penerima (semua kode)
    btns += '<button class="btn btn-sm btn-outline-primary" data-edit="' + safeCode + '" title="Edit Catatan"><i class="bi bi-pencil"></i>' + (isCard ? ' Edit' : '') + '</button>';

    // Reset device (hanya jika used_by ada dan status active)
    if (c.used_by && c.status === 'active') {
      btns += '<button class="btn btn-sm btn-outline-warning" data-reset="' + safeCode + '" title="Reset Perangkat"><i class="bi bi-unlock"></i>' + (isCard ? ' Reset' : '') + '</button>';
    }

    // Nonaktifkan (hanya jika active)
    if (c.status === 'active') {
      btns += '<button class="btn btn-sm btn-outline-danger" data-revoke="' + safeCode + '" title="Nonaktifkan"><i class="bi bi-x-circle"></i>' + (isCard ? ' Nonaktifkan' : '') + '</button>';
    }

    // Aktifkan kembali (hanya jika revoked)
    if (c.status === 'revoked') {
      btns += '<button class="btn btn-sm btn-outline-success" data-reactivate="' + safeCode + '" title="Aktifkan Kembali"><i class="bi bi-arrow-clockwise"></i>' + (isCard ? ' Aktifkan' : '') + '</button>';
    }

    // Hapus (semua kode — konfirmasi ketat untuk yang sudah dipakai)
    btns += '<button class="btn btn-sm btn-outline-danger" data-delete="' + safeCode + '" title="Hapus"><i class="bi bi-trash"></i>' + (isCard ? ' Hapus' : '') + '</button>';

    return btns;
  }

  // ================================================================
  // PAGINATION
  // ================================================================
  function renderPagination() {
    var container = document.getElementById('pagination');
    if (!container) return;
    var total = filteredCodes.length;
    var pages = Math.ceil(total / PAGE_SIZE);
    if (pages <= 1) { container.innerHTML = '<div class="small text-muted">' + total + ' kode</div>'; return; }

    var html = '<div class="small text-muted">Menampilkan ' + ((currentPage - 1) * PAGE_SIZE + 1) + '–' + Math.min(currentPage * PAGE_SIZE, total) + ' dari ' + total + ' kode</div>';
    html += '<div class="d-flex gap-1 align-items-center">';
    if (currentPage > 1) html += '<button class="btn btn-sm btn-outline-secondary" id="prevPage">‹ Sebelumnya</button>';
    html += '<span class="small">Halaman ' + currentPage + ' / ' + pages + '</span>';
    if (currentPage < pages) html += '<button class="btn btn-sm btn-outline-secondary" id="nextPage">Berikutnya ›</button>';
    html += '</div>';
    container.innerHTML = html;

    var prev = document.getElementById('prevPage');
    var next = document.getElementById('nextPage');
    if (prev) prev.addEventListener('click', function () { currentPage--; renderCodes(); });
    if (next) next.addEventListener('click', function () { currentPage++; renderCodes(); });
  }

  // ================================================================
  // BIND TOOLBAR
  // ================================================================
  function bindToolbar(root) {
    var $ = function (s) { return root.querySelector(s); };

    var btnCreate = $('#btnCreate');
    if (btnCreate) btnCreate.addEventListener('click', function () { showCreateModal(root); });

    var btnRefresh = $('#btnRefresh');
    if (btnRefresh) btnRefresh.addEventListener('click', async function () {
      btnRefresh.disabled = true; btnRefresh.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
      await reloadCodes(root);
      btnRefresh.disabled = false; btnRefresh.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refresh';
      toast('Data berhasil dimuat ulang.', 'success');
    });

    var btnAudit = $('#btnAuditLog');
    if (btnAudit) btnAudit.addEventListener('click', function () { showAuditModal(root); });

    var btnLogout = $('#btnAdminLogout');
    if (btnLogout) btnLogout.addEventListener('click', function () {
      if (confirm('Keluar dari panel admin?')) {
        sessionStorage.removeItem(ADMIN_KEY_STORAGE);
        if (typeof navigate === 'function') navigate('#/');
        else location.hash = '#/';
      }
    });

    var searchInput = $('#searchInput');
    if (searchInput) searchInput.addEventListener('input', function () {
      currentSearch = this.value.trim();
      applyFilter();
    });

    var filterSelect = $('#filterSelect');
    if (filterSelect) filterSelect.addEventListener('change', function () {
      currentFilter = this.value;
      applyFilter();
    });

    var sortSelect = $('#sortSelect');
    if (sortSelect) sortSelect.addEventListener('change', function () {
      currentSort = this.value;
      applyFilter();
    });

    // Re-render on resize (mobile/desktop switch)
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { renderCodes(); }, 250);
    });
  }

  // ================================================================
  // BIND CODE ACTIONS (copy, detail, reset, revoke, reactivate, delete)
  // ================================================================
  function bindCodeActions(container) {
    var key = sessionStorage.getItem(ADMIN_KEY_STORAGE);

    container.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var code = btn.getAttribute('data-copy');
        copyToClipboard(code);
        toast('Kode aktivasi berhasil disalin.', 'success');
      });
    });

    container.querySelectorAll('[data-detail]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var code = btn.getAttribute('data-detail');
        var c = allCodes.find(function (x) { return x.code === code; });
        if (c) showDetailModal(c);
      });
    });

    container.querySelectorAll('[data-edit]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var code = btn.getAttribute('data-edit');
        var c = allCodes.find(function (x) { return x.code === code; });
        if (c) showEditModal(c);
      });
    });

    container.querySelectorAll('[data-reset]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var code = btn.getAttribute('data-reset');
        if (!confirm('Reset perangkat untuk kode ' + code + '?\n\nSetelah direset, perangkat lama tidak lagi memiliki hak atas kode ini setelah validasi server berikutnya. Kode dapat digunakan kembali pada perangkat baru.')) return;
        btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        var r = await window.SupabaseSync.adminResetDevice(code, key);
        if (r.success) {
          toast('Perangkat berhasil direset. Kode dapat digunakan kembali.', 'success');
          await reloadCodes(document.getElementById('appRoot') || document.body);
        } else {
          toast('Gagal: ' + (r.reason || 'unknown'), 'danger');
          btn.disabled = false; btn.innerHTML = '<i class="bi bi-unlock"></i> Reset';
        }
      });
    });

    container.querySelectorAll('[data-revoke]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var code = btn.getAttribute('data-revoke');
        if (!confirm('Apakah Anda yakin ingin menonaktifkan kode ' + code + '?\n\nPerangkat yang memakai kode ini akan ditolak pada validasi server berikutnya.')) return;
        btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        var r = await window.SupabaseSync.adminRevokeCode(code, key);
        if (r.success) {
          toast('Kode aktivasi berhasil dinonaktifkan.', 'success');
          await reloadCodes(document.getElementById('appRoot') || document.body);
        } else {
          toast('Gagal: ' + (r.reason || 'unknown'), 'danger');
          btn.disabled = false; btn.innerHTML = '<i class="bi bi-x-circle"></i> Nonaktifkan';
        }
      });
    });

    container.querySelectorAll('[data-reactivate]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var code = btn.getAttribute('data-reactivate');
        if (!confirm('Aktifkan kembali kode ' + code + '?\n\nKode akan kembali berstatus aktif. Jika sebelumnya terikat perangkat, kode tetap untuk perangkat tersebut.')) return;
        btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        var r = await window.SupabaseSync.adminReactivateCode(code, key);
        if (r.success) {
          toast('Kode berhasil diaktifkan kembali.', 'success');
          await reloadCodes(document.getElementById('appRoot') || document.body);
        } else {
          toast('Gagal: ' + (r.reason || 'unknown'), 'danger');
          btn.disabled = false; btn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Aktifkan';
        }
      });
    });

    container.querySelectorAll('[data-delete]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var code = btn.getAttribute('data-delete');
        var c = allCodes.find(function (x) { return x.code === code; });
        var isUsed = c && c.used_by;
        var msg = isUsed
          ? 'PERINGATAN: Kode ' + code + ' SUDAH DIGUNAKAN oleh perangkat ' + shortDevice(c.used_by) + '.\n\nMenghapus kode yang sudah terpakai akan mencabut akses permanen. Perangkat tersebut tidak akan bisa validasi lagi. Tindakan ini TIDAK DAPAT DIBATALKAN.\n\nKetik HAPUS untuk konfirmasi:'
          : 'Kode ' + code + ' belum pernah digunakan. Hapus secara permanen?\n\nKetik HAPUS untuk konfirmasi:';
        var input = prompt(msg);
        if (input !== 'HAPUS') { if (input !== null) toast('Penghapusan dibatalkan — input tidak cocok.', 'info'); return; }
        btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
        var r = isUsed
          ? await window.SupabaseSync.adminDeleteCode(code, key)
          : await window.SupabaseSync.adminDeleteUnusedCode(code, key);
        if (r.success) {
          toast('Kode berhasil dihapus.', 'success');
          await reloadCodes(document.getElementById('appRoot') || document.body);
        } else {
          toast('Gagal: ' + (r.reason || 'unknown'), 'danger');
          btn.disabled = false; btn.innerHTML = '<i class="bi bi-trash"></i> Hapus';
        }
      });
    });
  }

  // ================================================================
  // MODAL: CREATE CODES
  // ================================================================
  function showCreateModal(root) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9998;display:flex;align-items:center;justify-content:center;padding:16px;';
    var html = '<div class="card shadow" style="max-width:500px;width:100%;max-height:90vh;overflow-y:auto;">';
    html += '<div class="card-header d-flex justify-content-between align-items-center"><h6 class="mb-0"><i class="bi bi-plus-circle"></i> Buat Kode Aktivasi</h6><button class="btn-close" id="closeModal"></button></div>';
    html += '<div class="card-body">';
    html += '<div class="mb-3"><label class="form-label">Jumlah Kode</label>';
    html += '<select id="createCount" class="form-select"><option value="1">1 kode</option><option value="5">5 kode</option><option value="10">10 kode</option><option value="20">20 kode</option><option value="50">50 kode</option><option value="custom">Custom...</option></select>';
    html += '<input type="number" id="createCustom" class="form-control mt-2" placeholder="Masukkan jumlah" min="1" max="100" style="display:none;">';
    html += '</div>';
    html += '<div class="mb-3"><label class="form-label">Catatan (opsional)</label>';
    html += '<input type="text" id="createNote" class="form-control" placeholder="Contoh: Batch Agustus 2026"></div>';
    html += '<button class="btn btn-primary w-100" id="btnDoCreate"><i class="bi bi-magic"></i> Buat Kode</button>';
    html += '<div id="createResult" class="mt-3" style="display:none;"></div>';
    html += '</div></div>';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    var closeBtn = overlay.querySelector('#closeModal');
    closeBtn.addEventListener('click', function () { overlay.remove(); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });

    var countSelect = overlay.querySelector('#createCount');
    var customInput = overlay.querySelector('#createCustom');
    countSelect.addEventListener('change', function () {
      customInput.style.display = this.value === 'custom' ? '' : 'none';
    });

    var doBtn = overlay.querySelector('#btnDoCreate');
    doBtn.addEventListener('click', async function () {
      var count = countSelect.value === 'custom' ? parseInt(customInput.value, 10) : parseInt(countSelect.value, 10);
      if (!count || count < 1 || count > 100) { toast('Jumlah tidak valid. Maksimal 100.', 'danger'); return; }
      var note = overlay.querySelector('#createNote').value.trim();
      var key = sessionStorage.getItem(ADMIN_KEY_STORAGE);

      doBtn.disabled = true; doBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Membuat kode...';
      var r = await window.SupabaseSync.adminBatchCreateCodes(count, note, key);
      doBtn.disabled = false; doBtn.innerHTML = '<i class="bi bi-magic"></i> Buat Kode';

      if (r.success && r.codes && r.codes.length) {
        var codes = r.codes;
        var resultHtml = '<div class="alert alert-success py-2"><b>✅ ' + codes.length + ' kode berhasil dibuat.</b></div>';
        resultHtml += '<div class="border rounded p-2 mb-2" style="max-height:200px;overflow-y:auto;font-size:.85rem;">';
        codes.forEach(function (c, i) { resultHtml += '<div class="d-flex justify-content-between align-items-center border-bottom py-1"><code>' + esc(c) + '</code><button class="btn btn-sm btn-outline-secondary py-0" data-copy="' + esc(c) + '"><i class="bi bi-clipboard"></i></button></div>'; });
        resultHtml += '</div>';
        resultHtml += '<button class="btn btn-primary btn-sm w-100" id="btnCopyAll"><i class="bi bi-clipboard-check"></i> Salin Semua</button>';
        var resultDiv = overlay.querySelector('#createResult');
        resultDiv.innerHTML = resultHtml;
        resultDiv.style.display = '';

        // Bind copy buttons
        resultDiv.querySelectorAll('[data-copy]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            copyToClipboard(btn.getAttribute('data-copy'));
            toast('Kode disalin.', 'success');
          });
        });
        overlay.querySelector('#btnCopyAll').addEventListener('click', function () {
          var text = codes.map(function (c, i) { return (i + 1) + '. ' + c; }).join('\n');
          copyToClipboard(text);
          toast(codes.length + ' kode disalin ke clipboard.', 'success');
        });

        toast(codes.length + ' kode aktivasi berhasil dibuat.', 'success');
        // Reload data
        await reloadCodes(document.getElementById('appRoot') || document.body);
      } else {
        toast('Gagal membuat kode: ' + (r.reason || 'unknown'), 'danger');
      }
    });
  }

  // ================================================================
  // MODAL: DETAIL
  // ================================================================
  function showDetailModal(c) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9998;display:flex;align-items:center;justify-content:center;padding:16px;';
    var html = '<div class="card shadow" style="max-width:450px;width:100%;">';
    html += '<div class="card-header d-flex justify-content-between align-items-center"><h6 class="mb-0"><i class="bi bi-info-circle"></i> Detail Kode</h6><button class="btn-close" id="closeDetail"></button></div>';
    html += '<div class="card-body" style="font-size:.9rem;">';
    html += '<div class="mb-2"><b>Kode Aktivasi:</b><br><code class="user-select-all">' + esc(c.code) + '</code></div>';
    html += '<div class="mb-2"><b>Status:</b><br>' + statusBadge(c) + '</div>';
    html += '<div class="mb-2"><b>Device ID:</b><br><code style="font-size:.75rem;word-break:break-all;">' + esc(c.used_by || '-') + '</code></div>';
    html += '<div class="mb-2"><b>Tanggal Dibuat:</b><br>' + fmtDate(c.created_at) + '</div>';
    html += '<div class="mb-2"><b>Tanggal Digunakan:</b><br>' + (c.used_at ? fmtDate(c.used_at) : '-') + '</div>';
    html += '<div class="mb-2"><b>Catatan:</b><br>' + esc(c.recipient || c.note || '-') + '</div>';
    if (c.device_info) html += '<div class="mb-2"><b>Info Perangkat:</b><br><span class="small text-muted">' + esc(c.device_info) + '</span></div>';
    html += '</div></div>';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    overlay.querySelector('#closeDetail').addEventListener('click', function () { overlay.remove(); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
  }

  // ================================================================
  // MODAL: EDIT CATATAN/PENERIMA
  // ================================================================
  function showEditModal(c) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9998;display:flex;align-items:center;justify-content:center;padding:16px;';
    var html = '<div class="card shadow" style="max-width:450px;width:100%;">';
    html += '<div class="card-header d-flex justify-content-between align-items-center"><h6 class="mb-0"><i class="bi bi-pencil"></i> Edit Kode Aktivasi</h6><button class="btn-close" id="closeEdit"></button></div>';
    html += '<div class="card-body" style="font-size:.9rem;">';
    html += '<div class="mb-2"><b>Kode:</b><br><code class="user-select-all">' + esc(c.code) + '</code></div>';
    html += '<div class="mb-2"><b>Status:</b><br>' + statusBadge(c) + '</div>';
    html += '<div class="mb-3"><label class="form-label"><b>Catatan / Penerima</b></label>';
    html += '<input type="text" id="editRecipient" class="form-control" value="' + esc(c.recipient || c.note || '') + '" placeholder="Contoh: MTs Negeri 1 Jember">';
    html += '<div class="form-text small">Catatan untuk identifikasi penerima kode (opsional).</div></div>';
    html += '<button class="btn btn-primary w-100" id="btnSaveEdit"><i class="bi bi-check-circle"></i> Simpan Perubahan</button>';
    html += '<div id="editError" class="text-danger mt-2 small" style="display:none;"></div>';
    html += '</div></div>';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    var closeBtn = overlay.querySelector('#closeEdit');
    closeBtn.addEventListener('click', function () { overlay.remove(); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });

    var input = overlay.querySelector('#editRecipient');
    input.focus();
    input.select();

    var saveBtn = overlay.querySelector('#btnSaveEdit');
    var errEl = overlay.querySelector('#editError');

    var doSave = async function () {
      var recipient = input.value.trim();
      var key = sessionStorage.getItem(ADMIN_KEY_STORAGE);
      saveBtn.disabled = true; saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Menyimpan...';
      try {
        var r = await window.SupabaseSync.adminUpdateRecipient(c.code, recipient, key);
        if (r.success) {
          toast('Catatan berhasil diperbarui.', 'success');
          overlay.remove();
          await reloadCodes(document.getElementById('appRoot') || document.body);
        } else {
          errEl.textContent = 'Gagal: ' + (r.reason || 'unknown');
          errEl.style.display = '';
          saveBtn.disabled = false; saveBtn.innerHTML = '<i class="bi bi-check-circle"></i> Simpan Perubahan';
        }
      } catch (e) {
        errEl.textContent = 'Terjadi kesalahan: ' + e.message;
        errEl.style.display = '';
        saveBtn.disabled = false; saveBtn.innerHTML = '<i class="bi bi-check-circle"></i> Simpan Perubahan';
      }
    };

    saveBtn.addEventListener('click', doSave);
    input.addEventListener('keypress', function (e) { if (e.key === 'Enter') doSave(); });
  }

  // ================================================================
  // MODAL: AUDIT LOG
  // ================================================================
  async function showAuditModal(root) {
    var key = sessionStorage.getItem(ADMIN_KEY_STORAGE);
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9998;display:flex;align-items:center;justify-content:center;padding:16px;';
    overlay.innerHTML = '<div class="card shadow" style="max-width:600px;width:100%;max-height:80vh;"><div class="card-header d-flex justify-content-between align-items-center"><h6 class="mb-0"><i class="bi bi-clock-history"></i> Audit Log</h6><button class="btn-close" id="closeAudit"></button></div><div class="card-body"><div class="text-center py-3"><div class="spinner-border text-primary"></div><div class="mt-2 text-muted small">Memuat audit log...</div></div></div></div>';
    document.body.appendChild(overlay);

    overlay.querySelector('#closeAudit').addEventListener('click', function () { overlay.remove(); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });

    var r = await window.SupabaseSync.adminGetAuditLog(key, 50);
    var body = overlay.querySelector('.card-body');
    if (r.success && r.logs && r.logs.length) {
      var html = '<div style="max-height:60vh;overflow-y:auto;font-size:.85rem;">';
      r.logs.forEach(function (l) {
        var color = l.action === 'DELETE' ? 'danger' : l.action === 'REVOKE' ? 'warning' : l.action === 'RESET_DEVICE' ? 'info' : l.action === 'REACTIVATE' ? 'success' : 'primary';
        html += '<div class="border-bottom py-2"><span class="badge bg-' + color + '">' + esc(l.action) + '</span> <code>' + esc(l.license_code) + '</code>';
        if (l.old_device) html += ' <span class="small text-muted">old: ' + shortDevice(l.old_device) + '</span>';
        if (l.new_device) html += ' <span class="small text-muted">new: ' + shortDevice(l.new_device) + '</span>';
        if (l.detail) html += ' <span class="small text-muted">' + esc(l.detail) + '</span>';
        html += '<div class="small text-muted">' + fmtDate(l.created_at) + '</div></div>';
      });
      html += '</div>';
      body.innerHTML = html;
    } else {
      body.innerHTML = '<p class="text-muted text-center">Belum ada audit log.</p>';
    }
  }

  // ================================================================
  // HELPER: RELOAD CODES
  // ================================================================
  async function reloadCodes(root) {
    var key = sessionStorage.getItem(ADMIN_KEY_STORAGE);
    try {
      var codes = await window.SupabaseSync.adminListCodes(key);
      allCodes = codes || [];
      applyFilter();
    } catch (e) {
      console.warn('[AdminLicense] reload error:', e.message);
    }
  }

  // ================================================================
  // HELPER: CLIPBOARD
  // ================================================================
  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () { fallbackCopy(text); });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
  }

  // ================================================================
  // PUBLIC API
  // ================================================================
  window.AdminLicense = {
    renderPage: renderPage,
    isAdmin: isAdmin,
  };
})();
