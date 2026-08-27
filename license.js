// license.js - PKKM License System (Tahap 2: Server = Source of Truth)
// TIDAK ADA master code. TIDAK ADA offline bypass FULL.
// Aktivasi pertama WAJIB server verification. Setelah aktif, boleh offline.
(function () {
  'use strict';

  var KEY_LICENSE = 'pkkm_v1_license';
  var KEY_CODES = 'pkkm_v1_activation_codes'; // local cache fallback (read-only)
  var TRIAL_DAYS = 5;
  var TRIAL_MAX_PENILAIAN = 10;

  // Load/save helpers
  function load(k, def) { try { var r = localStorage.getItem(k); return r ? JSON.parse(r) : def; } catch (e) { return def; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

  // Get device_id — stable, sekali buat tidak re-create
  function getDeviceId() {
    var id = localStorage.getItem('pkkm_v1_device_id');
    if (!id) {
      // Generate dengan crypto.randomUUID() jika tersedia
      if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        id = 'PKKM-' + window.crypto.randomUUID();
      } else {
        // Fallback: crypto.getRandomValues (lebih aman dari Math.random)
        var arr = new Uint8Array(16);
        if (window.crypto && window.crypto.getRandomValues) {
          window.crypto.getRandomValues(arr);
        } else {
          for (var i = 0; i < 16; i++) arr[i] = Math.floor(Math.random() * 256);
        }
        id = 'PKKM-' + Array.from(arr).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
      }
      localStorage.setItem('pkkm_v1_device_id', id);
    }
    return id;
  }

  function getLicense() {
    var l = load(KEY_LICENSE, null);
    if (!l) {
      l = { tier: 'trial', startedAt: new Date().toISOString(), trialExpiresAt: new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString(), activatedWith: null, deviceId: getDeviceId(), activatedAt: null, lastVerifiedAt: null };
      save(KEY_LICENSE, l);
    }
    // Pastikan deviceId selalu ada
    if (!l.deviceId) {
      l.deviceId = getDeviceId();
      save(KEY_LICENSE, l);
    }
    return l;
  }

  function setLicense(l) { save(KEY_LICENSE, l); }

  function getStatus() {
    // Admin bypass — admin selalu full access (admin key di sessionStorage)
    if (sessionStorage.getItem('pkkm_admin_key')) {
      return { tier: 'full', isTrial: false, isExpired: false, daysLeft: Infinity, count: 0, limitReached: false };
    }
    var l = getLicense();
    if (l.tier === 'full') return { tier: 'full', isTrial: false, isExpired: false, daysLeft: Infinity, count: 0, limitReached: false };
    var ms = new Date(l.trialExpiresAt).getTime() - Date.now();
    var daysLeft = Math.ceil(ms / 86400000);
    var isExpired = ms <= 0;
    var count = 0;
    try { count = (load('pkkm_v1_penilaian', []) || []).length; } catch (e) {}
    return { tier: 'trial', isTrial: true, isExpired: isExpired, daysLeft: Math.max(0, daysLeft), count: count, limitReached: count >= TRIAL_MAX_PENILAIAN };
  }

  function canMutate(kind) {
    var s = getStatus();
    if (!s.isTrial) return { ok: true };
    if (s.isExpired) return { ok: false, reason: 'Masa trial ' + TRIAL_DAYS + ' hari sudah habis. Hubungi admin (WA 0823-3064-7698) untuk Kode Aktivasi.' };
    if (kind === 'create-penilaian' && s.limitReached) return { ok: false, reason: 'Trial dibatasi maksimal ' + TRIAL_MAX_PENILAIAN + ' penilaian. Aktivasi untuk lanjut.' };
    return { ok: true };
  }

  function guard(kind) {
    var c = canMutate(kind);
    if (!c.ok) {
      if (typeof toast === 'function') toast(c.reason, 'danger', 6000);
      else alert('🔒 ' + c.reason);
      return false;
    }
    return true;
  }

  // ================================================================
  // REDEEM — Claim kode via Supabase RPC (atomik)
  // FAIL CLOSED: jika server tidak bisa dihubungi & belum pernah aktif → TOLAK
  // ================================================================
  async function redeem(code) {
    var c = String(code || '').trim().toUpperCase();
    if (!c) return { ok: false, reason: 'Kode kosong' };

    var deviceId = getDeviceId();
    var deviceInfo = navigator.userAgent || '';

    // Cek apakah sudah pernah aktif di device ini
    var existing = getLicense();
    if (existing.tier === 'full' && existing.activatedWith === c && existing.deviceId === deviceId) {
      // Sudah aktif di device ini — validasi server berkala
      var verify = await verifyWithServer(c, deviceId);
      if (verify.valid === false) {
        // Server bilang tidak valid untuk device ini → revoke lokal
        if (verify.reason === 'other_device' || verify.reason === 'inactive' || verify.reason === 'invalid_code') {
          setLicense({ tier: 'trial', startedAt: new Date().toISOString(), trialExpiresAt: new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString(), activatedWith: null, deviceId: deviceId, activatedAt: null, lastVerifiedAt: null });
          return { ok: false, reason: getReasonMessage(verify.reason) };
        }
      }
      return { ok: true };
    }

    // Aktivasi pertama atau kode berbeda → WAJIB server
    if (!window.SupabaseSync) {
      return { ok: false, reason: 'Modul sync belum termuat. Refresh halaman.' };
    }

    var result = await window.SupabaseSync.claimLicense(c, deviceId, deviceInfo);

    // Network error & belum pernah aktif → FAIL CLOSED
    if (result.success === null) {
      return { ok: false, reason: 'Aktivasi membutuhkan koneksi internet. Periksa koneksi internet Anda kemudian coba kembali.' };
    }

    // Claim berhasil
    if (result.success === true && result.reason === 'claimed') {
      setLicense({
        tier: 'full',
        activatedAt: new Date().toISOString(),
        activatedWith: c,
        deviceId: deviceId,
        lastVerifiedAt: new Date().toISOString()
      });
      return { ok: true, message: 'Aktivasi Berhasil. Perangkat ini telah berhasil diaktifkan.' };
    }

    // Same device — sudah terdaftar di device ini
    if (result.success === true && result.reason === 'same_device') {
      setLicense({
        tier: 'full',
        activatedAt: existing.activatedAt || new Date().toISOString(),
        activatedWith: c,
        deviceId: deviceId,
        lastVerifiedAt: new Date().toISOString()
      });
      return { ok: true, message: 'Perangkat ini sudah terdaftar. Lisensi aktif.' };
    }

    // Ditolak — other_device, invalid_code, inactive
    if (result.success === false) {
      return { ok: false, reason: getReasonMessage(result.reason) };
    }

    return { ok: false, reason: 'Terjadi kesalahan tidak diketahui. Coba lagi.' };
  }

  // Verifikasi lisensi ke server (validasi berkala)
  async function verifyWithServer(code, deviceId) {
    if (!window.SupabaseSync) return { valid: null, reason: 'no_sync' };
    try {
      var result = await window.SupabaseSync.verifyLicense(code, deviceId);
      if (result.valid === true) {
        // Update lastVerifiedAt
        var l = getLicense();
        l.lastVerifiedAt = new Date().toISOString();
        setLicense(l);
      }
      return result;
    } catch (e) {
      console.warn('[LIC] verifyWithServer error:', e.message);
      return { valid: null, reason: 'network_error' };
    }
  }

  // Map reason code → pesan user-friendly
  function getReasonMessage(reason) {
    switch (reason) {
      case 'invalid_code':
        return 'Kode aktivasi tidak valid. Periksa kembali kode yang Anda masukkan.';
      case 'inactive':
        return 'Kode aktivasi sudah dinonaktifkan. Silakan hubungi Admin.';
      case 'other_device':
        return 'Kode aktivasi ini sudah digunakan pada perangkat lain. Silakan meminta kode aktivasi baru kepada Admin.';
      case 'not_claimed':
        return 'Kode belum diaktivasi. Lakukan aktivasi pertama terlebih dahulu.';
      case 'network_error':
        return 'Aktivasi membutuhkan koneksi internet. Periksa koneksi internet Anda kemudian coba kembali.';
      default:
        return 'Aktivasi gagal. Silakan coba lagi.';
    }
  }

  // Reset lisensi ke trial (untuk testing)
  function reset() {
    var deviceId = getDeviceId();
    setLicense({
      tier: 'trial',
      startedAt: new Date().toISOString(),
      trialExpiresAt: new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString(),
      activatedWith: null,
      deviceId: deviceId,
      activatedAt: null,
      lastVerifiedAt: null
    });
  }

  function bannerHtml() {
    var s = getStatus();
    if (s.tier === 'full') return '<div class="alert alert-success py-2 px-3 mb-3" style="font-size:.85rem"><b>✅ Lisensi Aktif</b> — perangkat terdaftar.</div>';
    var cls, icon, msg;
    if (s.isExpired) { cls = 'alert-danger'; icon = '⛔'; msg = '<b>Trial habis.</b> Aplikasi read-only. Aktivasi kode untuk lanjut.'; }
    else if (s.limitReached) { cls = 'alert-warning'; icon = '⚠️'; msg = '<b>Limit ' + TRIAL_MAX_PENILAIAN + ' penilaian tercapai.</b> Aktivasi untuk menambah.'; }
    else { cls = 'alert-warning'; icon = '🆓'; msg = 'Mode <b>TRIAL</b> · sisa <b>' + s.daysLeft + ' hari</b> · sudah <b>' + s.count + '/' + TRIAL_MAX_PENILAIAN + '</b> penilaian.'; }
    return '<div class="alert ' + cls + ' py-2 px-3 mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2" style="font-size:.85rem"><span>' + icon + ' ' + msg + '</span><a href="#/lisensi" class="btn btn-sm btn-primary">Aktivasi</a></div>';
  }

  // ================================================================
  // RENDER PAGE — Halaman Lisensi/Aktivasi
  // ================================================================
  async function renderPage(root) {
    var s = getStatus();
    var l = getLicense();

    // Loading state
    root.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div><div class="mt-2 text-muted small">Memuat data lisensi...</div></div>';

    var html = '<div class="card shadow-sm mb-3"><div class="card-body">';
    html += '<h5 class="card-title">🔑 Lisensi / Aktivasi</h5>';
    html += '<div class="bg-light p-3 rounded mb-3" style="font-size:.9rem">';
    html += '<b>Status:</b> ' + (s.tier === 'full' ? '<span class="text-success">AKTIF ✅</span>' : 'TRIAL ' + (s.isExpired ? '(habis)' : '')) + '<br>';
    if (s.isTrial) html += '<b>Sisa hari:</b> ' + s.daysLeft + '<br><b>Pemakaian:</b> ' + s.count + ' / ' + TRIAL_MAX_PENILAIAN + ' penilaian<br>';
    if (l.activatedWith) html += '<b>Kode aktivasi:</b> <code>' + escapeHtmlLocal(l.activatedWith) + '</code><br>';
    if (l.deviceId) html += '<b>Device ID:</b> <code style="font-size:.75rem">' + escapeHtmlLocal(l.deviceId.substring(0, 20)) + '...</code><br>';
    if (l.lastVerifiedAt) html += '<b>Terakhir diverifikasi:</b> ' + new Date(l.lastVerifiedAt).toLocaleString('id-ID') + '<br>';
    html += '</div>';

    if (s.tier === 'full') {
      html += '<p class="text-success">Perangkat ini sudah aktif. Tidak perlu kode aktivasi lagi.</p>';
      html += '<button class="btn btn-outline-danger btn-sm" id="btnResetLic">Reset Lisensi (Testing)</button>';
    } else {
      html += '<div class="mb-3"><label class="form-label">Kode Aktivasi</label>';
      html += '<input type="text" id="redeemKode" class="form-control text-uppercase" placeholder="FULL-XXXX-XXXX-XXXX" autocomplete="off"></div>';
      html += '<button class="btn btn-primary" id="btnRedeem">🔓 Aktifkan</button>';
      html += '<div class="alert alert-info mt-3" style="font-size:.8rem"><b>Belum punya kode?</b> Hubungi admin WA <b>0823-3064-7698</b>.</div>';
    }
    html += '</div></div>';

    // Admin panel — butuh admin key
    html += '<div class="card shadow-sm mb-3"><div class="card-body">';
    html += '<h5 class="card-title">🛡️ Admin Panel</h5>';
    html += '<p class="text-muted small">Masukkan Admin Key untuk generate kode, revoke, reset device.</p>';
    html += '<div class="mb-3"><input type="password" id="adminKeyInput" class="form-control" placeholder="Admin Key" autocomplete="off"></div>';
    html += '<button class="btn btn-primary btn-sm me-1" id="btnAdminLogin">🔑 Login Admin</button>';
    html += '<div id="adminPanel" style="display:none;" class="mt-3">';
    html += '<button class="btn btn-primary btn-sm me-1" id="btnGen1">+ 1 Kode</button>';
    html += '<button class="btn btn-outline-primary btn-sm me-1" id="btnGen5">+ 5 Kode</button>';
    html += '<button class="btn btn-outline-secondary btn-sm me-1" id="btnRefresh">🔄 Refresh</button>';
    html += '<div id="codesTable" class="mt-3"></div>';
    html += '</div>';
    html += '</div></div>';

    root.innerHTML = html;
    var $ = function (sel) { return root.querySelector(sel); };

    // Redeem
    if ($('#btnRedeem')) $('#btnRedeem').addEventListener('click', async function () {
      var btn = this;
      var k = $('#redeemKode').value;
      btn.disabled = true; btn.textContent = '⏳ Memverifikasi...';
      var r = await redeem(k);
      btn.disabled = false; btn.textContent = '🔓 Aktifkan';
      if (!r.ok) { alert('❌ ' + r.reason); return; }
      alert('✅ ' + (r.message || 'Aktivasi sukses!'));
      if (typeof navigate === 'function') navigate('#/lisensi'); else location.reload();
    });

    // Reset lisensi
    if ($('#btnResetLic')) $('#btnResetLic').addEventListener('click', function () {
      if (!confirm('Reset lisensi ke TRIAL ' + TRIAL_DAYS + ' hari? Data PKKM tidak dihapus.')) return;
      reset();
      if (typeof navigate === 'function') navigate('#/lisensi'); else location.reload();
    });

    // Admin login
    if ($('#btnAdminLogin')) $('#btnAdminLogin').addEventListener('click', async function () {
      var btn = this;
      var key = $('#adminKeyInput').value.trim();
      if (!key) { alert('Masukkan Admin Key.'); return; }
      btn.disabled = true; btn.textContent = '⏳ Memverifikasi...';
      // Test admin key by listing codes
      var codes = await window.SupabaseSync.adminListCodes(key);
      btn.disabled = false; btn.textContent = '🔑 Login Admin';
      if (codes.length === 0 && !window.SupabaseSync._lastAdminOk) {
        // Cek apakah network error atau key salah
        // Jika array kosong tapi tidak error → mungkin belum ada kode
      }
      // Simpan admin key di session (tidak persist di localStorage)
      sessionStorage.setItem('pkkm_admin_key', key);
      $('#adminPanel').style.display = '';
      btn.textContent = '✅ Admin Aktif';
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-success');
      await renderCodesTable(root, key);
    });

    // Cek apakah admin sudah login (session)
    var savedKey = sessionStorage.getItem('pkkm_admin_key');
    if (savedKey) {
      $('#adminKeyInput').value = '';
      $('#adminPanel').style.display = '';
      var btnLogin = $('#btnAdminLogin');
      if (btnLogin) {
        btnLogin.textContent = '✅ Admin Aktif';
        btnLogin.classList.remove('btn-primary');
        btnLogin.classList.add('btn-success');
      }
      await renderCodesTable(root, savedKey);
    }

    if ($('#btnGen1')) $('#btnGen1').addEventListener('click', function () { doGen(1, root); });
    if ($('#btnGen5')) $('#btnGen5').addEventListener('click', function () { doGen(5, root); });
    if ($('#btnRefresh')) $('#btnRefresh').addEventListener('click', function () { renderCodesTable(root, sessionStorage.getItem('pkkm_admin_key')); });
  }

  async function renderCodesTable(root, adminKey) {
    var container = root.querySelector('#codesTable');
    if (!container) return;
    container.innerHTML = '<div class="text-center py-2"><div class="spinner-border spinner-border-sm text-primary"></div></div>';
    var codes = await window.SupabaseSync.adminListCodes(adminKey);
    if (!codes || codes.length === 0) {
      container.innerHTML = '<p class="text-muted mt-2">Belum ada kode.</p>';
      return;
    }
    var html = '<table class="table table-sm" style="font-size:.85rem"><thead><tr><th>Kode</th><th>Penerima</th><th class="text-center">Status</th><th class="text-center">Aksi</th></tr></thead><tbody>';
    codes.forEach(function (c) {
      var safeCode = String(c.code).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
      var statusText = c.status === 'revoked' ? '⛔ dicabut' : (c.used_by ? '✅ dipakai' : '🆕 baru');
      var actions = '<button class="btn btn-sm btn-outline-secondary me-1" data-copy="' + safeCode + '" title="Copy">📋</button>';
      if (c.used_by && c.status === 'active') {
        actions += '<button class="btn btn-sm btn-outline-warning me-1" data-reset="' + safeCode + '" title="Reset device">🔓</button>';
      }
      if (c.status === 'active') {
        actions += '<button class="btn btn-sm btn-outline-danger" data-revoke="' + safeCode + '" title="Cabut">🗑</button>';
      }
      html += '<tr><td><code>' + safeCode + '</code></td><td>' + (c.recipient ? '<span>' + String(c.recipient).replace(/</g, '&lt;') + '</span>' : '<span class="text-muted">-</span>') + '</td><td class="text-center">' + statusText + '</td><td class="text-center text-nowrap">' + actions + '</td></tr>';
    });
    html += '</tbody></table>';
    container.innerHTML = html;

    // Bind actions
    container.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var code = btn.getAttribute('data-copy');
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(function () { alert('✅ Kode disalin.'); });
        else { var ta = document.createElement('textarea'); ta.value = code; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); alert('✅ Kode disalin.'); }
      });
    });
    container.querySelectorAll('[data-reset]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var code = btn.getAttribute('data-reset');
        if (!confirm('Reset binding device untuk kode ' + code + '? Kode bisa dipakai di perangkat baru.')) return;
        var r = await window.SupabaseSync.adminResetDevice(code, adminKey);
        if (!r.success) { alert('❌ Gagal: ' + (r.reason || 'unknown')); return; }
        alert('✅ Device binding direset. Kode bisa dipakai lagi.');
        renderCodesTable(root, adminKey);
      });
    });
    container.querySelectorAll('[data-revoke]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var c = btn.getAttribute('data-revoke');
        if (!confirm('Cabut kode ' + c + '?')) return;
        var r = await window.SupabaseSync.adminRevokeCode(c, adminKey);
        if (!r.success) { alert('❌ Gagal: ' + (r.reason || 'unknown')); return; }
        alert('✅ Kode dicabut.');
        renderCodesTable(root, adminKey);
      });
    });
  }

  async function doGen(n, root) {
    var adminKey = sessionStorage.getItem('pkkm_admin_key');
    if (!adminKey) { alert('Login admin dulu.'); return; }
    var made = [];
    var failed = 0;
    for (var i = 0; i < n; i++) {
      var r = await window.SupabaseSync.adminGenerateCode(adminKey, '');
      if (r.success && r.code) made.push(r.code);
      else failed++;
    }
    if (made.length) alert('✅ ' + made.length + ' kode dibuat:\n\n' + made.join('\n'));
    if (failed) alert('⚠️ ' + failed + ' kode gagal dibuat.');
    renderCodesTable(root, adminKey);
  }

  function escapeHtmlLocal(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ================================================================
  // VALIDASI BERKALA — cek server saat online
  // ================================================================
  var _verifyTimer = null;
  function scheduleVerification() {
    // Clear existing
    if (_verifyTimer) clearTimeout(_verifyTimer);
    // Cek setiap 30 menit
    _verifyTimer = setTimeout(async function () {
      // Skip verification untuk admin (tidak perlu verify ke server)
      if (sessionStorage.getItem('pkkm_admin_key')) { scheduleVerification(); return; }
      var l = getLicense();
      if (l.tier !== 'full' || !l.activatedWith) { scheduleVerification(); return; }
      // Hanya verifikasi jika online
      if (!window.SupabaseSync) { scheduleVerification(); return; }
      var online = await window.SupabaseSync.isOnline();
      if (!online) { scheduleVerification(); return; }
      var result = await verifyWithServer(l.activatedWith, l.deviceId);
      if (result.valid === false) {
        // Server bilang tidak valid → revoke lokal
        console.warn('[LIC] Server revoked license:', result.reason);
        reset();
        if (typeof toast === 'function') toast('Lisensi Anda tidak lagi valid. Hubungi admin.', 'danger', 8000);
        if (typeof navigate === 'function') navigate('#/lisensi');
      }
      scheduleVerification();
    }, 30 * 60 * 1000); // 30 menit
  }

  // ================================================================
  // PATCH DB LAYER — guard trial
  // ================================================================
  function patchDb() {
    if (typeof Kamad !== 'undefined' && Kamad && !Kamad.__licWrapped) {
      var origCreate = Kamad.create.bind(Kamad);
      var origUpdate = Kamad.update.bind(Kamad);
      Kamad.create = function (d) { if (!guard('create-kamad')) return null; return origCreate(d); };
      Kamad.update = function (id, p) { if (!guard('update-kamad')) return null; return origUpdate(id, p); };
      Kamad.__licWrapped = true;
    }
    if (typeof Periode !== 'undefined' && Periode && !Periode.__licWrapped) {
      var pc = Periode.create.bind(Periode), pu = Periode.update.bind(Periode);
      Periode.create = function (d) { if (!guard('create-periode')) return null; return pc(d); };
      Periode.update = function (id, p) { if (!guard('update-periode')) return null; return pu(id, p); };
      Periode.__licWrapped = true;
    }
    if (typeof Penilaian !== 'undefined' && Penilaian && !Penilaian.__licWrapped) {
      var ensureName = typeof Penilaian.ensureRole === 'function' ? 'ensureRole' : (typeof Penilaian.ensure === 'function' ? 'ensure' : null);
      if (ensureName) {
        var ne = Penilaian[ensureName].bind(Penilaian);
        Penilaian[ensureName] = function () { if (!guard('create-penilaian')) return null; return ne.apply(Penilaian, arguments); };
      }
      if (typeof Penilaian.update === 'function') {
        var nu = Penilaian.update.bind(Penilaian);
        Penilaian.update = function (id, p) { if (!guard('update-penilaian')) return null; return nu(id, p); };
      }
      Penilaian.__licWrapped = true;
    }
    if (typeof Skor !== 'undefined' && Skor && Skor.upsert && !Skor.__licWrapped) {
      var us = Skor.upsert.bind(Skor);
      Skor.upsert = function (a, b, c, d) { if (!guard('save-skor')) return null; return us(a, b, c, d); };
      Skor.__licWrapped = true;
    }
  }

  function tryPatch(retries) {
    patchDb();
    if (retries > 0) setTimeout(function () { tryPatch(retries - 1); }, 100);
  }

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { tryPatch(10); scheduleVerification(); });
  } else {
    tryPatch(10);
    scheduleVerification();
  }

  // Public API
  window.LIC = {
    getStatus: getStatus,
    bannerHtml: bannerHtml,
    renderPage: renderPage,
    guard: guard,
    redeem: redeem,
    reset: reset,
    getDeviceId: getDeviceId,
    verifyWithServer: verifyWithServer,
    applyTrialPrintMark: function () { try { var s = getStatus(); document.body.classList.toggle('is-trial-print', !!(s && s.isTrial)); } catch (e) {} }
  };
  window.addEventListener('beforeprint', function () { try { window.LIC && window.LIC.applyTrialPrintMark && window.LIC.applyTrialPrintMark(); } catch (e) {} });
  document.addEventListener('DOMContentLoaded', function () { try { window.LIC && window.LIC.applyTrialPrintMark && window.LIC.applyTrialPrintMark(); } catch (e) {} });
})();
