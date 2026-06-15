// license.js - Trial system 5 hari + Kode FULL untuk Aplikasi PKKM
// Pattern referensi: supervisi-pm-kbc-jember
(function () {
  'use strict';
  const KEY_LICENSE = 'pkkm_v1_license';
  const KEY_CODES = 'pkkm_v1_activation_codes';
  const TRIAL_DAYS = 5;
  const TRIAL_MAX_PENILAIAN = 10;
  const MASTER_CODE = 'FULL-PKKM-POKJAWAS-2026';

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
  function genCode() {
    var ch = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var p = function (n) { var s = ''; for (var i = 0; i < n; i++) s += ch[Math.floor(Math.random() * ch.length)]; return s; };
    return 'FULL-' + p(4) + '-' + p(4) + '-' + p(4);
  }

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

  function redeem(code) {
    var c = String(code || '').trim().toUpperCase();
    if (!c) return { ok: false, reason: 'Kode kosong' };
    if (c === MASTER_CODE) {
      setLicense({ tier: 'full', activatedAt: new Date().toISOString(), activatedWith: c });
      return { ok: true };
    }
    var list = getCodes();
    var idx = list.findIndex(function (x) { return x.code === c && !x.usedBy && !x.revoked; });
    if (idx < 0) return { ok: false, reason: 'Kode tidak valid atau sudah dipakai' };
    list[idx].usedBy = 'device';
    list[idx].usedAt = new Date().toISOString();
    saveCodes(list);
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

  function renderPage(root) {
    var s = getStatus();
    var l = getLicense();
    var codes = getCodes();
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
    html += '<p class="text-muted small">Master code: <code>' + MASTER_CODE + '</code></p>';
    html += '<button class="btn btn-primary btn-sm me-1" id="btnGen1">+ 1 Kode</button>';
    html += '<button class="btn btn-outline-primary btn-sm" id="btnGen5">+ 5 Kode</button>';
    if (codes.length === 0) html += '<p class="text-muted mt-3">Belum ada kode di-generate.</p>';
    else {
      html += '<table class="table table-sm mt-3" style="font-size:.85rem"><thead><tr><th>Kode</th><th class="text-center">Status</th><th class="text-center">Aksi</th></tr></thead><tbody>';
      codes.slice().reverse().forEach(function (c) {
        html += '<tr><td><code>' + c.code + '</code></td><td class="text-center">' + (c.usedBy ? '✅ dipakai' : '🆕 baru') + '</td><td class="text-center">' + (!c.usedBy ? '<button class="btn btn-sm btn-outline-danger" data-revoke="' + c.code + '">🗑</button>' : '-') + '</td></tr>';
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
    if ($('#btnRedeem')) $('#btnRedeem').addEventListener('click', function () {
      var k = $('#redeemKode').value;
      var r = redeem(k);
      if (!r.ok) { alert('❌ ' + r.reason); return; }
      alert('✅ Aktivasi sukses! Sekarang FULL.');
      if (typeof navigate === 'function') navigate('#/lisensi'); else location.reload();
    });
    if ($('#btnGen1')) $('#btnGen1').addEventListener('click', function () { doGen(1, root); });
    if ($('#btnGen5')) $('#btnGen5').addEventListener('click', function () { doGen(5, root); });
    if ($('#btnResetLic')) $('#btnResetLic').addEventListener('click', function () {
      if (!confirm('Reset lisensi ke TRIAL ' + TRIAL_DAYS + ' hari?')) return;
      reset();
      if (typeof navigate === 'function') navigate('#/lisensi'); else location.reload();
    });
    root.querySelectorAll('[data-revoke]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var c = btn.getAttribute('data-revoke');
        if (!confirm('Hapus kode ' + c + '?')) return;
        saveCodes(getCodes().filter(function (x) { return x.code !== c; }));
        if (typeof navigate === 'function') navigate('#/lisensi'); else location.reload();
      });
    });
  }
  function doGen(n, root) {
    var list = getCodes();
    var made = [];
    for (var i = 0; i < n; i++) { var k = genCode(); list.push({ code: k, createdAt: new Date().toISOString() }); made.push(k); }
    saveCodes(list);
    alert('✅ ' + n + ' kode dibuat:\n\n' + made.join('\n'));
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
      var nc = Penilaian.create.bind(Penilaian);
      Penilaian.create = function (d) { if (!guard('create-penilaian')) return null; return nc(d); };
      if (Penilaian.update) { var nu = Penilaian.update.bind(Penilaian); Penilaian.update = function (id, p) { if (!guard('update-penilaian')) return null; return nu(id, p); }; }
      Penilaian.__licWrapped = true;
    }
    if (typeof Skor !== 'undefined' && Skor && Skor.upsert && !Skor.__licWrapped) {
      var us = Skor.upsert.bind(Skor);
      Skor.upsert = function (a, b, c, d) { if (!guard('save-skor')) return null; return us(a, b, c, d); };
      Skor.__licWrapped = true;
    }
  }

  // Try patching on load + small retries (defer scripts may not all be ready)
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
  // Auto-toggle watermark sebelum print + saat boot
  window.addEventListener('beforeprint', function(){try{window.LIC && window.LIC.applyTrialPrintMark && window.LIC.applyTrialPrintMark();}catch(e){}});
  document.addEventListener('DOMContentLoaded', function(){try{window.LIC && window.LIC.applyTrialPrintMark && window.LIC.applyTrialPrintMark();}catch(e){}});
})();
