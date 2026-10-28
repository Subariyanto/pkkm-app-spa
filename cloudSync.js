// cloudSync.js — Sinkronisasi data PKKM ke VPS (api.pokjawasjember.com)
//
// Tujuan: data penilaian bisa dibuka dari PERANGKAT MANA PUN dengan akun
// yang sama. Sebelum ini data PKKM murni localStorage, tanpa backup sama
// sekali — laptop rusak / cache dibersihkan = data hilang permanen.
//
// Prinsip OFFLINE-FIRST (sama seperti e-RHK):
//   * localStorage tetap sumber utama; aplikasi tetap jalan tanpa internet.
//   * VPS hanyalah cermin. Saat login di perangkat baru, data ditarik.
//   * Setiap perubahan lokal dikirim ke VPS (debounce 1,5 detik).
//
// Pemilik data: PKKM menyimpan data tanpa awalan akun (satu perangkat =
// satu pengawas). Karena itu kepemilikan dicatat di pkkm_v1_sync_owner.
// Kalau akun berbeda login di perangkat yang sama, data lama TIDAK dikirim
// ke akun baru — data akun baru ditarik dari server.
(function () {
  'use strict';

  var SCOPES = ['kamad', 'periode', 'penilaian', 'skor', 'meta', 'instrumen_overrides', 'pkb'];
  var KEY_OF = {
    kamad: 'pkkm_v1_kamad',
    periode: 'pkkm_v1_periode',
    penilaian: 'pkkm_v1_penilaian',
    skor: 'pkkm_v1_skor',
    meta: 'pkkm_v1_meta',
    instrumen_overrides: 'pkkm_v1_instrumen_overrides',
    pkb: 'pkkm_v2_pkb'
  };
  var SCOPE_OF_KEY = {};
  SCOPES.forEach(function (s) { SCOPE_OF_KEY[KEY_OF[s]] = s; });

  var META_KEY = 'pkkm_v1_sync_meta';       // kapan tiap bagian terakhir sinkron
  var OWNER_KEY = 'pkkm_v1_sync_owner';     // akun pemilik data di perangkat ini
  var DEBOUNCE_MS = 1500;
  var WATCH_MS = 10000;

  var _queue = {};          // scope -> value
  var _timer = null;
  var _busy = false;
  var _lastUser = '';
  var _status = { state: 'idle', lastAt: null, lastError: null, pushed: 0, pulled: 0 };

  function S() { return window.SupabaseSync || {}; }
  function username() {
    try { return String(localStorage.getItem('pkkm_v1_user_username') || '').trim().toLowerCase(); } catch (e) { return ''; }
  }
  function token() {
    try { return (S().vpsGetToken && S().vpsGetToken()) || ''; } catch (e) { return ''; }
  }
  function canSync() {
    var s = S();
    return !!(s.VPS_URL && s.VPS_ANON_KEY && token() && username());
  }

  function readLocal(scope) {
    try {
      var raw = localStorage.getItem(KEY_OF[scope]);
      return raw === null ? null : JSON.parse(raw);
    } catch (e) { return null; }
  }
  function writeLocal(scope, val) {
    try { localStorage.setItem(KEY_OF[scope], JSON.stringify(val)); return true; }
    catch (e) { console.warn('[CloudSync] gagal tulis lokal', scope, e.message); return false; }
  }

  function readMeta() {
    try { var r = localStorage.getItem(META_KEY); return r ? JSON.parse(r) : { scopes: {} }; }
    catch (e) { return { scopes: {} }; }
  }
  function writeMeta(m) {
    try { localStorage.setItem(META_KEY, JSON.stringify(m)); } catch (e) {}
  }
  function owner() {
    try { return localStorage.getItem(OWNER_KEY) || ''; } catch (e) { return ''; }
  }
  function setOwner(u) {
    try { localStorage.setItem(OWNER_KEY, u || ''); } catch (e) {}
  }

  // ---------- RPC ----------
  function rpc(fn, args) {
    var c = { url: S().VPS_URL, key: S().VPS_ANON_KEY, tok: token() };
    if (!c.url || !c.tok) { _status.lastError = 'no-token'; return Promise.resolve(null); }
    var ctrl = new AbortController();
    var to = setTimeout(function () { ctrl.abort(); }, 15000);
    return fetch(c.url.replace(/\/$/, '') + '/rest/v1/rpc/' + fn, {
      method: 'POST',
      headers: {
        apikey: c.key,
        Authorization: 'Bearer ' + c.tok,
        'Content-Type': 'application/json',
        'Content-Profile': 'edusmart'
      },
      body: JSON.stringify(args || {}),
      signal: ctrl.signal
    }).then(function (r) {
      if (!r.ok) {
        if (r.status === 401) { _status.lastError = 'token-expired'; _status.state = 'need-relogin'; }
        else { _status.lastError = 'http-' + r.status; }
        return null;
      }
      return r.json();
    }).catch(function (e) {
      _status.lastError = e.message;
      return null;
    }).then(function (out) { clearTimeout(to); return out; });
  }

  // ---------- kirim ----------
  function schedule() {
    if (_timer) clearTimeout(_timer);
    _timer = setTimeout(function () { _timer = null; flush(); }, DEBOUNCE_MS);
  }

  function flush() {
    if (_busy) return Promise.resolve(false);
    if (!canSync()) return Promise.resolve(false);
    var names = Object.keys(_queue);
    if (!names.length) return Promise.resolve(true);
    _busy = true;
    var meta = readMeta();
    var ok = 0;
    var chain = Promise.resolve();
    names.forEach(function (scope) {
      chain = chain.then(function () {
        var val = _queue[scope];
        return rpc('fn_data_set', {
          p_scope: scope,
          p_periode: 0,
          p_payload: val,
          p_device: (navigator.userAgent || '').slice(0, 60)
        }).then(function (res) {
          if (res && res.ok === true) {
            ok++;
            delete _queue[scope];
            meta.scopes[scope] = { at: res.updated_at || new Date().toISOString() };
          }
          // gagal -> tetap di antrean, jangan hilang
        });
      });
    });
    return chain.then(function () {
      writeMeta(meta);
      _status.pushed += ok;
      _status.lastAt = new Date().toISOString();
      _status.state = ok ? 'ok' : (_status.state === 'need-relogin' ? 'need-relogin' : 'error');
      _busy = false;
      gambarBadge();
      if (Object.keys(_queue).length) schedule();
      return ok > 0;
    });
  }

  // Hook dari db.js setiap pSave() sukses.
  function onSet(key, val) {
    var scope = SCOPE_OF_KEY[key];
    if (!scope) return;
    if (!canSync()) { gambarBadge(); return; }
    // Kalau data ini milik akun lain, jangan kirim ke akun sekarang.
    var ow = owner();
    if (ow && ow !== username()) { gambarBadge(); return; }
    _queue[scope] = val;
    _status.state = 'menyimpan';
    gambarBadge();
    schedule();
  }

  // ---------- tarik ----------
  function hydrate() {
    if (!canSync()) return Promise.resolve({ ok: false, reason: 'not-applicable' });
    var me = username();
    var ow = owner();
    // Perangkat dipakai akun BERBEDA. Jangan hapus data lama dulu: kalau
    // server tidak terjangkau, data akun sebelumnya harus tetap utuh.
    // Data lama baru dibersihkan SETELAH tarikan berhasil.
    var switching = !!(ow && ow !== me);

    return rpc('fn_data_get', {}).then(function (res) {
      if (!res || res.ok !== true) {
        _status.state = (_status.state === 'need-relogin') ? 'need-relogin' : 'error';
        gambarBadge();
        return { ok: false, reason: _status.lastError || 'network', switching: switching };
      }

      if (switching) {
        // Tarikan berhasil -> baru aman mengosongkan data akun lama.
        SCOPES.forEach(function (s) { try { localStorage.removeItem(KEY_OF[s]); } catch (e) {} });
        setOwner(me);
        try { localStorage.removeItem(META_KEY); } catch (e) {}
      }

      var rows = Array.isArray(res.rows) ? res.rows : [];
      var meta = readMeta();
      var seen = {};
      var applied = 0;

      rows.forEach(function (row) {
        var scope = String(row.scope || '');
        if (SCOPES.indexOf(scope) < 0) return;
        seen[scope] = true;
        var localVal = readLocal(scope);
        var cloudVal = row.payload;
        var same = localVal !== null && JSON.stringify(localVal) === JSON.stringify(cloudVal);
        if (same) { meta.scopes[scope] = { at: row.updated_at }; return; }

        var lastSync = meta.scopes[scope] && meta.scopes[scope].at ? meta.scopes[scope].at : null;
        var serverNewer = !!(lastSync && row.updated_at &&
          new Date(row.updated_at).getTime() > new Date(lastSync).getTime());

        if (localVal === null || serverNewer) {
          // perangkat baru, atau perangkat lain lebih baru -> pakai server
          writeLocal(scope, cloudVal);
          meta.scopes[scope] = { at: row.updated_at };
          applied++;
        } else {
          // lokal lebih baru -> dorong ke server
          _queue[scope] = localVal;
        }
      });

      // Bagian lokal yang belum ada di server -> kirim
      SCOPES.forEach(function (scope) {
        if (seen[scope]) return;
        var v = readLocal(scope);
        if (v !== null) _queue[scope] = v;
      });

      writeMeta(meta);
      if (!ow) setOwner(me);
      _status.pulled += rows.length;
      _status.state = 'ok';
      _status.lastAt = new Date().toISOString();
      if (Object.keys(_queue).length) schedule();
      gambarBadge();
      return { ok: true, pulled: rows.length, applied: applied, switching: switching };
    });
  }

  // ---------- watcher ----------
  // Sesi lama (login sebelum sync VPS aktif) belum punya token VPS.
  // Ambil token otomatis pakai hash password yang tersimpan, supaya
  // pengawas tidak perlu logout/login ulang agar data masuk server.
  var _tokTry = 0;
  function role() {
    try { return localStorage.getItem('pkkm_v1_user_role') || ''; } catch (e) { return ''; }
  }
  function ensureToken() {
    var s = S();
    if (token() || !username() || role() === 'admin') return Promise.resolve(!!token());
    if (!s.vpsLoginHash || Date.now() - _tokTry < 60000) return Promise.resolve(false);
    _tokTry = Date.now();
    var h = '';
    try { h = localStorage.getItem('pkkm_v1_user_password_hash') || ''; } catch (e) {}
    if (!h) { _status.state = 'need-relogin'; gambarBadge(); return Promise.resolve(false); }
    return s.vpsLoginHash(username(), h).then(function (o) {
      if (o && o.data && token()) {
        if (s.markVpsLatched) s.markVpsLatched(username());
        _lastUser = '';
        return true;
      }
      if (o && o.err === 'auth') _status.state = 'need-relogin';
      gambarBadge();
      return false;
    });
  }

  function watch() {
    var me = username();
    if (!me) { _lastUser = ''; return; }
    if (!token() && role() !== 'admin') {
      ensureToken().then(function (ok) { if (ok) watch(); });
      return;
    }
    if (me !== _lastUser) {
      _lastUser = me;
      hydrate().then(function (r) {
        if (r && r.ok && r.applied) {
          // data berubah dari server -> render ulang halaman
          try { if (window.render) window.render(); } catch (e) {}
        }
      });
    }
  }

  // ---------- tombol backup / unduh ----------
  function unduhSalinan(tag) {
    try {
      var bundle = { aplikasi: 'PKKM', akun: username(), dibuat: new Date().toISOString(), data: {} };
      SCOPES.forEach(function (s) {
        var v = readLocal(s);
        if (v !== null) bundle.data[s] = v;
      });
      if (!Object.keys(bundle.data).length) return false;
      var blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (function () {
        var slug = (typeof window.slugBerkas === 'function') ? window.slugBerkas(window.namaMadrasahBackup && window.namaMadrasahBackup()) : '';
        return 'pkkm-backup-' + (slug ? slug + '-' : '') + (username() || 'akun') + '-' + (tag || 'manual') + '.json';
      })();
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      return true;
    } catch (e) { console.warn('[CloudSync] unduh gagal:', e.message); return false; }
  }

  function backupSekarang() {
    // 1. kirim semua bagian yang belum terkirim
    SCOPES.forEach(function (s) {
      var v = readLocal(s);
      if (v !== null) _queue[s] = v;
    });
    return flush().then(function (ok) {
      var file = unduhSalinan('manual');
      return { ok: !!ok, file: file };
    });
  }

  // ---------- badge status ----------
  function badgeState() {
    if (!username()) return { cls: 'bg-secondary', icon: 'cloud-slash', text: 'Lokal', title: 'Belum login.' };
    if (role() === 'admin') {
      return { cls: 'bg-info text-dark', icon: 'cloud', text: 'Admin',
        title: 'Akun admin/ketua pokjawas: data pengawas dibaca dari server lewat menu Rekap Kab. \u2192 Ambil Data Semua Pengawas dari Server.' };
    }
    if (_status.state === 'need-relogin') {
      return { cls: 'bg-danger', icon: 'exclamation-triangle', text: 'Perlu login',
        title: 'Sesi server berakhir. Keluar lalu masuk lagi agar data tersimpan ke server.' };
    }
    if (!canSync()) {
      return { cls: 'bg-secondary', icon: 'cloud-slash', text: 'Lokal saja',
        title: 'Belum terhubung ke server. Data tersimpan di perangkat ini.' };
    }
    if (_status.state === 'menyimpan' || Object.keys(_queue).length || _busy) {
      return { cls: 'bg-warning text-dark', icon: 'arrow-repeat', text: 'Menyimpan…',
        title: 'Perubahan sedang dikirim ke server.' };
    }
    if (_status.state === 'error') {
      return { cls: 'bg-warning text-dark', icon: 'wifi-off', text: 'Tertunda',
        title: 'Server belum bisa dihubungi. Data aman di perangkat, akan dikirim otomatis.' };
    }
    if (_status.state === 'ok') {
      return { cls: 'bg-success', icon: 'cloud-check', text: 'Tersimpan',
        title: 'Semua perubahan sudah tersimpan di server.' };
    }
    return { cls: 'bg-secondary', icon: 'cloud', text: 'Siap', title: 'Menunggu perubahan.' };
  }

  function gambarBadge() {
    var el = document.getElementById('syncBadge');
    if (!el) return;
    var s = badgeState();
    el.className = 'badge ' + s.cls + ' ms-2';
    el.title = s.title;
    var ic = el.querySelector('i');
    if (ic) ic.className = 'bi bi-' + s.icon;
    var tx = document.getElementById('syncBadgeText');
    if (tx) tx.textContent = s.text;
  }

  function panel() {
    var s = badgeState();
    var meta = readMeta();
    var terakhir = _status.lastAt ? new Date(_status.lastAt).toLocaleString('id-ID') : 'belum ada';
    function baris(k, v) {
      return '<div class="d-flex justify-content-between border-bottom py-2"><span class="text-muted">' +
        k + '</span><span class="fw-semibold text-end">' + v + '</span></div>';
    }
    var html = '<div class="small">' +
      baris('Status', '<span class="badge ' + s.cls + '">' + s.text + '</span>') +
      baris('Akun', username() || '-') +
      baris('Menunggu dikirim', Object.keys(_queue).length + ' bagian') +
      baris('Terakhir tersimpan', terakhir) +
      baris('Bagian tersinkron', Object.keys(meta.scopes || {}).length + ' dari ' + SCOPES.length) +
      '<p class="text-muted mt-3 mb-2">Data selalu tersimpan di perangkat ini lebih dulu, lalu dikirim ' +
      'ke server sebagai cadangan. Aplikasi tetap bisa dipakai walau server sedang bermasalah.</p>' +
      '<div class="d-grid gap-2">' +
      '<button class="btn btn-success btn-sm" id="btnBackupPkkm"><i class="bi bi-cloud-arrow-up"></i> Cadangkan sekarang</button>' +
      '<button class="btn btn-outline-secondary btn-sm" id="btnUnduhPkkm"><i class="bi bi-download"></i> Unduh salinan data (file)</button>' +
      '</div></div>';

    if (window.UI && UI.showModal) { UI.showModal('Penyimpanan & Cadangan', html, { onMount: mountPanel }); }
    else { mountFallback(html); }
  }

  function mountPanel(body, close) {
    var b1 = body.querySelector('#btnBackupPkkm');
    var b2 = body.querySelector('#btnUnduhPkkm');
    if (b1) b1.onclick = function () {
      b1.disabled = true;
      b1.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Mencadangkan…';
      backupSekarang().then(function (r) {
        close();
        alert(r.ok ? 'Cadangan tersimpan di server dan file terunduh.' : 'File terunduh. Server belum bisa dihubungi, data tetap aman di perangkat.');
      });
    };
    if (b2) b2.onclick = function () {
      alert(unduhSalinan('manual') ? 'Salinan data terunduh.' : 'Belum ada data untuk diunduh.');
    };
  }

  function mountFallback(html) {
    var w = document.createElement('div');
    w.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
    w.innerHTML = '<div style="background:#fff;border-radius:12px;max-width:460px;width:100%;padding:20px">' +
      '<div class="d-flex justify-content-between align-items-center mb-2"><strong>Penyimpanan &amp; Cadangan</strong>' +
      '<button class="btn btn-sm btn-light" id="xPkkm">&times;</button></div>' + html + '</div>';
    document.body.appendChild(w);
    w.querySelector('#xPkkm').onclick = function () { w.remove(); };
    mountPanel(w, function () { w.remove(); });
  }

  function pasangBadge() {
    var el = document.getElementById('syncBadge');
    if (!el) return;
    el.onclick = panel;
    gambarBadge();
  }

  // ---------- boot ----------
  function start() {
    setInterval(watch, WATCH_MS);
    setInterval(gambarBadge, 3000);
    window.addEventListener('online', function () { _lastUser = ''; watch(); });
    watch();
    pasangBadge();
    // Token TTL 7 hari -> perpanjang diam-diam supaya penyimpanan tidak berhenti.
    setInterval(function () {
      var s = S();
      if (s.vpsTokenSisaJam && s.vpsRefreshToken) {
        var sisa = s.vpsTokenSisaJam();
        if (sisa !== null && sisa < 48) {
          s.vpsRefreshToken().then(function (ok) {
            if (ok && _status.state === 'need-relogin') _status.state = 'ok';
            gambarBadge();
          });
        }
      }
    }, 30 * 60 * 1000);
  }

  window.CloudSyncPkkm = {
    start: start,
    onSet: onSet,
    flush: flush,
    hydrate: hydrate,
    afterLogin: function () {
      _lastUser = '';
      // JANGAN set owner di sini: hydrate() yang menentukan, agar data akun
      // sebelumnya tidak terhapus sebelum tarikan server berhasil.
      return hydrate();
    },
    backupSekarang: backupSekarang,
    unduhSalinan: unduhSalinan,
    pasangBadge: pasangBadge,
    gambarBadge: gambarBadge,
    status: function () {
      return { state: _status.state, lastAt: _status.lastAt, lastError: _status.lastError, queued: Object.keys(_queue).length, owner: owner(), user: username() };
    }
  };
})();
