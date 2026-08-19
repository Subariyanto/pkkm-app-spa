// license.js - Trial system 5 hari + Kode FULL untuk Aplikasi PKKM
// v2.0: Cross-device license sync via Supabase (supabaseSync.js)
(function () {
  'use strict';
  const KEY_LICENSE = 'pkkm_v1_license';
  const KEY_CODES = 'pkkm_v1_activation_codes'; // local cache fallback
  const TRIAL_DAYS = 5;
  const TRIAL_MAX_PENILAIAN = 10;
  const MASTER_CODE = 'FULL-PKKM-POKJAWAS-2026';
  const ADMIN_MASTER_CODE = 'POKJAWAS-JEMBER-SUPER-2026'; // dari auth.js

  function load(k, def) { try { var r = localStorage.getItem(k); return r ? JSON.parse(r) : def; } catch (e) { return def; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }

  function getLicense() {
    var l = load(KEY_LICENSE, null);
    if (!l) {
      l = { tier: 'trial', startedAt: new Date().toISOString(), trialExpiresAt: new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString(), activatedWith: null };
      save(KEY_LICENSE, l);
    }
    return l;
  }
  function setLicense(l) { save(KEY_LICENSE, l); }
  function getCodes() { return load(KEY_CODES, []); }
  function saveCodes(c) { save(KEY_CODES, c); }

  function getStatus() {
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
    if (s.isExpired) return { ok: false, reason: 'Masa trial ' + TRIAL_DAYS + ' hari sudah habis. Hubungi admin (WA 0823-3064-7698) untuk Kode FULL.' };
    if (kind === 'create-penilaian' && s.limitReached) return { ok: false, reason: 'Trial dibatasi maksimal ' + TRIAL_MAX_PENILAIAN + ' penilaian. Aktivasi FULL untuk lanjut.' };
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

  // === REDEEM (async — cek Supabase untuk kode generate) ===
  // Master code: lokal bypass, tidak perlu Supabase.
  // Kode generate (FULL-XXXX-XXXX-XXXX): cek + claim via Supabase.
  async function redeem(code) {
    var c = String(code || '').trim().toUpperCase();
    if (!c) return { ok: false, reason: 'Kode kosong' };

    // Master code — lokal, unlimited, tidak butuh Supabase
    if (c === MASTER_CODE || c === ADMIN_MASTER_CODE) {
      setLicense({ tier: 'full', activatedAt: new Date().toISOString(), activatedWith: c });
      return { ok: true };
    }

    // Kode generate — validasi via Supabase
    if (!window.SupabaseSync) {
      return { ok: false, reason: 'Modul sync belum termuat. Refresh halaman.' };
    }

    var valid = await window.SupabaseSync.isCodeValid(c);
    if (valid.valid === false) return { ok: false, reason: valid.reason };
    if (valid.valid === null) {
      // Offline / tidak bisa connect Supabase — cek local cache
      var localList = getCodes();
      var localIdx = localList.findIndex(function (x) { return x.code === c && !x.usedBy && !x.revoked; });
      if (localIdx < 0) return { ok: false, reason: 'Offline & kode tidak ada di cache lokal. Hubungi admin.' };
      localList[localIdx].usedBy = 'device-offline';
      localList[localIdx].usedAt = new Date().toISOString();
      saveCodes(localList);
      setLicense({ tier: 'full', activatedAt: new Date().toISOString(), activatedWith: c });
      return { ok: true, warning: 'Aktivasi offline (cache lokal). Saat online, kode akan di-sync ke server.' };
    }

    // Claim kode di Supabase (atomic)
    var deviceId = localStorage.getItem('pkkm_v1_device_id') || 'unknown';
    var claim = await window.SupabaseSync.claimCode(c, { deviceId: deviceId, userAgent: navigator.userAgent || '' });
    if (claim.ok === false) return { ok: false, reason: claim.reason };
    if (claim.ok === null) {
      // Race: tidak bisa konfirmasi claim — tetap aktifkan lokal, sync nanti
      setLicense({ tier: 'full', activatedAt: new Date().toISOString(), activatedWith: c });
      return { ok: true, warning: 'Aktivasi tersimpan lokal. Sinkronisasi server tertunda.' };
    }

    setLicense({ tier: 'full', activatedAt: new Date().toISOString(), activatedWith: c });
    return { ok: true };
  }

  function reset() {
    setLicense({ tier: 'trial', startedAt: new Date().toISOString(), trialExpiresAt: new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString(), activatedWith: null });
  }

  function bannerHtml() {
    var s = getStatus();
    if (s.tier === 'full') return '<div class="alert alert-success py-2 px-3 mb-3" style="font-size:.85rem"><b>✅ Lisensi FULL</b> aktif.</div>';
    var cls, icon, msg;
    if (s.isExpired) { cls = 'alert-danger'; icon = '⛔'; msg = '<b>Trial habis.</b> Aplikasi sekarang read-only. Aktivasi kode FULL untuk lanjut.'; }
    else if (s.limitReached) { cls = 'alert-warning'; icon = '⚠️'; msg = '<b>Limit ' + TRIAL_MAX_PENILAIAN + ' penilaian tercapai.</b> Aktivasi FULL untuk menambah.'; }
    else { cls = 'alert-warning'; icon = '🆓'; msg = 'Mode <b>TRIAL</b> · sisa <b>' + s.daysLeft + ' hari</b> · sudah <b>' + s.count + '/' + TRIAL_MAX_PENILAIAN + '</b> penilaian.'; }
    return '<div class="alert ' + cls + ' py-2 px-3 mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2" style="font-size:.85rem"><span>' + icon + ' ' + msg + '</span><a href="#/lisensi" class="btn btn-sm btn-primary">Aktivasi FULL</a></div>';
  }

  // === RENDER PAGE (async — fetch kode dari Supabase) ===
  async function renderPage(root) {
    var s = getStatus();
    var l = getLicense();

    // Loading state
    root.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div><div class="mt-2 text-muted small">Memuat data lisensi...</div></div>';

    // Fetch codes from Supabase (fallback to local cache)
    var codes = [];
    if (window.SupabaseSync) {
      codes = await window.SupabaseSync.listCodes();
    }
    if (!codes || codes.length === 0) {
      codes = getCodes().map(function (c) {
        return { code: c.code, recipient: c.recipient || '', used_by: c.usedBy || null, revoked: c.revoked || false, created_at: c.createdAt || '' };
      });
    }

    var html = '<div class="card shadow-sm mb-3"><div class="card-body">';
    html += '<h5 class="card-title">🔑 Lisensi / Aktivasi</h5>';
    html += '<div class="bg-light p-3 rounded mb-3" style="font-size:.9rem">';
    html += '<b>Status:</b> ' + (s.tier === 'full' ? '<span class="text-success">FULL ✅</span>' : 'TRIAL ' + (s.isExpired ? '(habis)' : '')) + '<br>';
    if (s.isTrial) html += '<b>Sisa hari:</b> ' + s.daysLeft + '<br><b>Pemakaian:</b> ' + s.count + ' / ' + TRIAL_MAX_PENILAIAN + ' penilaian<br>';
    if (l.activatedWith) html += '<b>Kode aktivasi:</b> <code>' + l.activatedWith + '</code><br>';
    html += '</div>';
    if (s.tier === 'full') {
      html += '<p class="text-success">Akun aktif penuh. Tidak perlu kode aktivasi.</p>';
    } else {
      html += '<div class="mb-3"><label class="form-label">Kode Aktivasi FULL</label><input type="text" id="redeemKode" class="form-control text-uppercase" placeholder="FULL-XXXX-XXXX-XXXX"></div>';
      html += '<button class="btn btn-primary" id="btnRedeem">🔓 Aktifkan</button>';
      html += '<div class="alert alert-warning mt-3" style="font-size:.8rem"><b>Belum punya kode FULL?</b> Hubungi admin WA <b>0823-3064-7698</b>.</div>';
    }
    html += '</div></div>';

    html += '<div class="card shadow-sm mb-3"><div class="card-body">';
    html += '<h5 class="card-title">🎟️ Generate Kode FULL (Admin)</h5>';
    html += '<p class="text-muted small">Master code: <code>' + MASTER_CODE + '</code> (lokal, unlimited)</p>';
    html += '<p class="text-muted small">Kode generate disimpan di <b>Supabase</b> (cross-device, 1x pakai per perangkat).</p>';
    html += '<button class="btn btn-primary btn-sm me-1" id="btnGen1">+ 1 Kode</button>';
    html += '<button class="btn btn-outline-primary btn-sm" id="btnGen5">+ 5 Kode</button>';
    html += ' <button class="btn btn-outline-secondary btn-sm" id="btnRefresh" title="Refresh dari server">🔄 Refresh</button>';
    if (codes.length === 0) html += '<p class="text-muted mt-3">Belum ada kode di-generate.</p>';
    else {
      html += '<table class="table table-sm mt-3" style="font-size:.85rem"><thead><tr><th>Kode</th><th>Penerima</th><th class="text-center">Status</th><th class="text-center">Aksi</th></tr></thead><tbody>';
      codes.forEach(function (c) {
        var recipient = c.recipient || '';
        var safeCode = String(c.code).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
        var statusText = c.revoked ? '⛔ dicabut' : (c.used_by ? '✅ dipakai' : '🆕 baru');
        var actions = '<button class="btn btn-sm btn-outline-secondary me-1" data-copy="' + safeCode + '" title="Copy kode">📋</button>';
        if (!c.used_by && !c.revoked) {
          actions += '<button class="btn btn-sm btn-outline-primary me-1" data-edit-recipient="' + safeCode + '" title="Edit penerima">✏️</button>';
          actions += '<button class="btn btn-sm btn-success me-1" data-activate-code="' + safeCode + '" title="Aktifkan di perangkat ini">🔓</button>';
          actions += '<button class="btn btn-sm btn-outline-danger" data-revoke="' + safeCode + '" title="Cabut">🗑</button>';
        }
        html += '<tr><td><code>' + safeCode + '</code></td><td>' + (recipient ? '<span>' + recipient.replace(/</g, '&lt;') + '</span>' : '<span class="text-muted">Belum ditentukan</span>') + '</td><td class="text-center">' + statusText + '</td><td class="text-center text-nowrap">' + actions + '</td></tr>';
      });
      html += '</tbody></table>';
    }
    html += '</div></div>';

    html += '<div class="card shadow-sm mb-3"><div class="card-body">';
    html += '<h5 class="card-title">⬇️ Reset Lisensi (Testing)</h5>';
    html += '<p class="text-muted small">Reset ke TRIAL ' + TRIAL_DAYS + ' hari. Data tidak dihapus.</p>';
    html += '<button class="btn btn-outline-danger btn-sm" id="btnResetLic">Reset</button>';
    html += '</div></div>';

    root.innerHTML = html;
    var $ = function (sel) { return root.querySelector(sel); };

    if ($('#btnRedeem')) $('#btnRedeem').addEventListener('click', async function () {
      var btn = this;
      var k = $('#redeemKode').value;
      btn.disabled = true; btn.textContent = '⏳ Memeriksa...';
      var r = await redeem(k);
      btn.disabled = false; btn.textContent = '🔓 Aktifkan';
      if (!r.ok) { alert('❌ ' + r.reason); return; }
      alert('✅ Aktivasi sukses! Sekarang FULL.' + (r.warning ? '\n\n⚠️ ' + r.warning : ''));
      if (typeof navigate === 'function') navigate('#/lisensi'); else location.reload();
    });
    if ($('#btnGen1')) $('#btnGen1').addEventListener('click', function () { doGen(1, root); });
    if ($('#btnGen5')) $('#btnGen5').addEventListener('click', function () { doGen(5, root); });
    if ($('#btnRefresh')) $('#btnRefresh').addEventListener('click', function () { renderPage(root); });
    if ($('#btnResetLic')) $('#btnResetLic').addEventListener('click', function () {
      if (!confirm('Reset lisensi ke TRIAL ' + TRIAL_DAYS + ' hari?')) return;
      reset();
      if (typeof navigate === 'function') navigate('#/lisensi'); else location.reload();
    });
    root.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var code = btn.getAttribute('data-copy');
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(function () { alert('✅ Kode berhasil disalin.'); });
        else { var ta = document.createElement('textarea'); ta.value = code; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); alert('✅ Kode berhasil disalin.'); }
      });
    });
    root.querySelectorAll('[data-edit-recipient]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var code = btn.getAttribute('data-edit-recipient');
        var recipient = prompt('Nama penerima kode aktivasi:', '');
        if (recipient === null) return;
        recipient = recipient.trim();
        if (window.SupabaseSync) {
          var r = await window.SupabaseSync.updateRecipient(code, recipient);
          if (!r.ok) { alert('❌ Gagal update: ' + r.reason); return; }
        }
        // Update local cache too
        var list = getCodes();
        var item = list.find(function (x) { return x.code === code; });
        if (item) { item.recipient = recipient; saveCodes(list); }
        renderPage(root);
      });
    });
    root.querySelectorAll('[data-activate-code]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var code = btn.getAttribute('data-activate-code');
        if (!confirm('Aktifkan kode ini pada perangkat/browser saat ini?')) return;
        var result = await redeem(code);
        if (!result.ok) { alert('❌ ' + result.reason); return; }
        alert('✅ Lisensi FULL berhasil diaktifkan.' + (result.warning ? '\n\n⚠️ ' + result.warning : ''));
        renderPage(root);
      });
    });
    root.querySelectorAll('[data-revoke]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var c = btn.getAttribute('data-revoke');
        if (!confirm('Cabut/hapus kode ' + c + '?')) return;
        if (window.SupabaseSync) {
          var r = await window.SupabaseSync.revokeCode(c);
          if (!r.ok) { alert('❌ Gagal: ' + r.reason); return; }
        }
        saveCodes(getCodes().filter(function (x) { return x.code !== c; }));
        renderPage(root);
      });
    });
  }

  async function doGen(n, root) {
    if (!window.SupabaseSync) { alert('❌ Modul sync belum termuat.'); return; }
    var made = [];
    var failed = 0;
    for (var i = 0; i < n; i++) {
      var r = await window.SupabaseSync.generateCode('');
      if (r.ok) made.push(r.code);
      else failed++;
    }
    if (made.length) alert('✅ ' + made.length + ' kode dibuat di Supabase:\n\n' + made.join('\n'));
    if (failed) alert('⚠️ ' + failed + ' kode gagal dibuat (mungkin duplikat, coba lagi).');
    renderPage(root);
  }

  // === Patch DB layer once it's available ===
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
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { tryPatch(10); });
  } else {
    tryPatch(10);
  }

  // Public API
  window.LIC = { getStatus: getStatus, bannerHtml: bannerHtml, renderPage: renderPage, guard: guard, redeem: redeem, applyTrialPrintMark: function(){try{var s=getStatus();document.body.classList.toggle('is-trial-print', !!(s&&s.isTrial));}catch(e){}} };
  window.addEventListener('beforeprint', function(){try{window.LIC && window.LIC.applyTrialPrintMark && window.LIC.applyTrialPrintMark();}catch(e){}});
  document.addEventListener('DOMContentLoaded', function(){try{window.LIC && window.LIC.applyTrialPrintMark && window.LIC.applyTrialPrintMark();}catch(e){}});
})();
