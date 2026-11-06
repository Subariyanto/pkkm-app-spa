// supabaseSync.js - Pusat Lisensi Aplikasi (Supabase RPC)
// Updated: redirect ke Pusat Lisensi terpusat
// Semua operasi via RPC (SECURITY DEFINER) yang bypass RLS.
(function () {
  'use strict';

  // === PUSAT LISENSI APLIKASI ===
  var SUPABASE_URL = 'https://llaukzsztguwrtwdubpm.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsYXVrenN6dGd1d3J0d2R1YnBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxOTI1NDgsImV4cCI6MjEwMjc2ODU0OH0.DqKtA0aus9nOLViMEWjAPvYIAdLS_EKU3H8dYKe_Zhk'; // legacy anon (JWT) — publishable key lama sudah dicabut
  var APP_SLUG = 'pkkm';
  var TIMEOUT_MS = 10000;

  // ===================================================================
  // === VPS (api.pokjawasjember.com) — PENGGANTI PUSAT LISENSI LAMA ===
  // ===================================================================
  // PKKM meng-hash password di browser: sha256(lower(trim(user)) + ':' + pass)
  // -> sama dengan varian 'sha256_userpass' di VPS. Jadi akun lama bisa
  // diverifikasi apa adanya, lalu naik ke bcrypt saat login berikutnya.
  var VPS_URL = 'https://api.pokjawasjember.com';
  var VPS_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzkyOTkxMzgyLCJleHAiOjIxMDgzNTEzODJ9.PLdEjj-1BO106pt04M9Xg5Tlx2PuJIiskJRA1P10FlY';
  var VPS_APP_ID = 'pkkm';
  var VPS_TOKEN_KEY = 'pkkm_vps_token';
  var VPS_LATCH_KEY = 'pkkm_vps_users';   // akun yang sudah pernah sukses di VPS

  function vpsGetToken() {
    try { return localStorage.getItem(VPS_TOKEN_KEY) || ''; } catch (e) { return ''; }
  }
  function vpsSaveToken(t) {
    try { if (t) localStorage.setItem(VPS_TOKEN_KEY, t); } catch (e) {}
  }
  function vpsClearToken() {
    try { localStorage.removeItem(VPS_TOKEN_KEY); } catch (e) {}
  }

  // === LATCH ANTI-FALLBACK ===
  // Begitu akun PERNAH sukses login via VPS, akun itu dikunci ke VPS.
  // Kalau VPS mati, user harus lihat error jujur — bukan diam-diam
  // dilempar ke server lama yang tidak punya data terbarunya.
  function vpsLatchedUsers() {
    try { var r = localStorage.getItem(VPS_LATCH_KEY); return r ? JSON.parse(r) : {}; }
    catch (e) { return {}; }
  }
  function isVpsLatched(username) {
    var u = String(username || '').trim().toLowerCase();
    if (!u) return false;
    return !!vpsLatchedUsers()[u];
  }
  function markVpsLatched(username) {
    var u = String(username || '').trim().toLowerCase();
    if (!u) return;
    try {
      var o = vpsLatchedUsers();
      if (!o[u]) { o[u] = new Date().toISOString(); localStorage.setItem(VPS_LATCH_KEY, JSON.stringify(o)); }
    } catch (e) {}
  }
  function resetVpsLatch(username) {
    try {
      if (!username) { localStorage.removeItem(VPS_LATCH_KEY); return true; }
      var o = vpsLatchedUsers();
      delete o[String(username).trim().toLowerCase()];
      localStorage.setItem(VPS_LATCH_KEY, JSON.stringify(o));
      return true;
    } catch (e) { return false; }
  }

  // Panggil Edge Function VPS. Hasil: { data } | { err:'network' } | { err:'auth' }
  function vpsPost(path, body, bearer) {
    var ctrl = new AbortController();
    var to = setTimeout(function () { ctrl.abort(); }, 15000);
    return fetch(VPS_URL + path, {
      method: 'POST',
      headers: {
        'apikey': VPS_ANON_KEY,
        'Authorization': 'Bearer ' + (bearer || VPS_ANON_KEY),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body || {}),
      signal: ctrl.signal
    }).then(function (r) {
      return r.json().then(function (d) { return { status: r.status, data: d }; })
                     .catch(function () { return { status: r.status, data: null }; });
    }).then(function (o) {
      clearTimeout(to);
      if (o.status === 401) return { err: 'auth', data: o.data };
      if (o.status >= 400) return { err: 'http', status: o.status, data: o.data };
      return { data: o.data };
    }).catch(function (e) {
      clearTimeout(to);
      console.warn('[SupabaseSync] VPS', path, 'error:', e.message);
      return { err: 'network' };
    });
  }

  // Login via VPS dengan PASSWORD ASLI -> server bisa upgrade ke bcrypt.
  function vpsLoginReal(username, password) {
    return vpsPost('/functions/v1/edusmart-auth/login', {
      app_id: VPS_APP_ID, username: username, password: password
    }).then(function (o) {
      if (o.err) return o;
      var d = o.data || {};
      if (!d.ok) return { err: 'auth', data: d };
      if (d.token) vpsSaveToken(d.token);
      return { data: d };
    });
  }

  // Login via VPS dengan HASH (untuk verifikasi sesi berkala, tanpa password).
  function vpsLoginHash(username, passwordHash) {
    return vpsPost('/functions/v1/edusmart-auth/login-hash', {
      app_id: VPS_APP_ID, username: username, password: passwordHash
    }).then(function (o) {
      if (o.err) return o;
      var d = o.data || {};
      if (!d.ok) return { err: 'auth', data: d };
      if (d.token) vpsSaveToken(d.token);
      return { data: d };
    });
  }

  // Aktivasi (daftar akun baru) via VPS dengan hash.
  function vpsActivateHash(code, username, passwordHash, fullname, madrasah) {
    return vpsPost('/functions/v1/edusmart-auth/activate-hash', {
      app_id: VPS_APP_ID, code: code, username: username, password: passwordHash,
      fullname: fullname || '', madrasah: madrasah || '',
      hash_algo: 'sha256_userpass'
    }).then(function (o) {
      if (o.err) return o;
      var d = o.data || {};
      if (!d.ok) return { err: 'auth', data: d };
      if (d.token) vpsSaveToken(d.token);
      return { data: d };
    });
  }

  function vpsPayloadToResult(d) {
    return {
      valid: true,
      reason: 'ok',
      fullname: d.fullname || '',
      madrasah: d.madrasah || '',
      role: d.role || 'pengawas',
      tier: d.tier || null,
      license_code: d.license_code || '',
      via: 'vps'
    };
  }

  // LOGIN CERDAS: VPS dulu, server lama hanya kalau akun BELUM pernah di VPS.
  // Mengembalikan null -> artinya auth.js boleh memakai jalur lama.
  async function loginAccountSmart(username, passwordHash, passwordPlain, deviceInfo) {
    var latched = isVpsLatched(username);
    var o = null;
    if (passwordPlain) {
      o = await vpsLoginReal(username, passwordPlain);
      // Password asli ditolak VPS: bisa jadi akun belum ada di VPS.
      // Kalau belum terkunci, coba jalur hash (akun migrasi masih sha256).
      if (o.err === 'auth' && !latched) o = await vpsLoginHash(username, passwordHash);
    } else {
      o = await vpsLoginHash(username, passwordHash);
    }

    if (o && o.data) {
      markVpsLatched(username);
      return vpsPayloadToResult(o.data);
    }

    // Gagal karena JARINGAN -> jangan hianati akun yang sudah pindah.
    if (o && (o.err === 'network' || o.err === 'http')) {
      if (latched) {
        return {
          valid: null, reason: 'vps_unreachable', via: 'vps',
          message: 'Server sedang tidak dapat dihubungi. Data Anda aman di server, silakan coba beberapa saat lagi.'
        };
      }
      return null;
    }

    // Ditolak tegas (password salah / akun nonaktif).
    if (o && o.err === 'auth') {
      if (latched) {
        return { valid: false, reason: 'invalid_credentials', via: 'vps' };
      }
      return null; // biar server lama yang memutuskan (akun belum pindah)
    }

    return null;
  }

  // DAFTAR CERDAS: coba VPS dulu, gagal jaringan -> server lama.
  async function registerAccountSmart(code, username, passwordHash, fullname, madrasah, deviceInfo) {
    var o = await vpsActivateHash(code, username, passwordHash, fullname, madrasah);
    if (o && o.data) {
      markVpsLatched(username);
      return { success: true, reason: 'claimed', via: 'vps', fullname: o.data.fullname, role: o.data.role };
    }
    if (o && o.err === 'auth') {
      var d = o.data || {};
      var kode = d.code || '';
      var peta = {
        invalid_code: 'invalid_code', code_used: 'code_used',
        account_exists: 'account_exists', expired: 'invalid_code'
      };
      return { success: false, reason: peta[kode] || 'invalid_credentials', message: d.error || '', via: 'vps' };
    }
    return null; // jaringan bermasalah -> coba server lama
  }

  function timeoutFetch(url, opts, ms) {
    return Promise.race([
      fetch(url, opts),
      new Promise(function (_, reject) {
        setTimeout(function () { reject(new Error('Timeout ' + ms + 'ms')); }, ms);
      })
    ]);
  }

  // Call Supabase RPC function
  async function callRpc(fnName, params) {
    var url = SUPABASE_URL + '/rest/v1/rpc/' + fnName;
    var headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    };
    var res = await timeoutFetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(params || {}),
    }, TIMEOUT_MS);
    if (!res.ok) {
      var text = await res.text();
      throw new Error('RPC ' + fnName + ' failed: ' + res.status + ' ' + text);
    }
    return res.json();
  }

  // ================================================================
  // PUBLIC API (untuk license.js)
  // ================================================================

  // Claim kode aktivasi — atomik via RPC
  // Returns: { success: true/false, reason: 'claimed'|'same_device'|'other_device'|'invalid_code'|'inactive' }
  async function claimLicense(code, deviceId, deviceInfo) {
    try {
      var result = await callRpc('claim_license', {
        p_code: code,
        p_app_slug: APP_SLUG,
        p_device_id: deviceId,
        p_device_info: deviceInfo || '',
      });
      return result;
    } catch (e) {
      console.warn('[SupabaseSync] claimLicense error:', e.message);
      return { success: null, reason: 'network_error' };
    }
  }

  // Verifikasi lisensi untuk device ini — via RPC
  // Returns: { valid: true/false, reason: 'same_device'|'other_device'|'invalid_code'|'inactive'|'not_claimed' }
  async function verifyLicense(code, deviceId) {
    try {
      var result = await callRpc('verify_license', {
        p_code: code,
        p_app_slug: APP_SLUG,
        p_device_id: deviceId,
      });
      return result;
    } catch (e) {
      console.warn('[SupabaseSync] verifyLicense error:', e.message);
      return { valid: null, reason: 'network_error' };
    }
  }

  // Cek koneksi online — ping edge function VPS (tanpa efek samping)
  async function isOnline() {
    try {
      var ctrl = new AbortController();
      var to = setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS);
      var res = await fetch(VPS_URL + '/functions/v1/pkkm-api/health', {
        method: 'GET',
        headers: { 'apikey': VPS_ANON_KEY, 'Authorization': 'Bearer ' + VPS_ANON_KEY },
        signal: ctrl.signal,
      });
      clearTimeout(to);
      return res.status < 500;
    } catch (e) {
      return false;
    }
  }

  // ================================================================
  // ADMIN API (butuh admin key — diketik user, tidak persist)
  // ================================================================

  // Admin generate kode baru
  async function adminGenerateCode(adminKey, recipient) {
    try {
      var result = await callRpc('admin_generate_code', {
        p_admin_key: adminKey,
        p_app_slug: APP_SLUG,
        p_recipient: recipient || '',
      });
      return result;
    } catch (e) {
      console.warn('[SupabaseSync] adminGenerateCode error:', e.message);
      return { success: false, reason: 'network_error' };
    }
  }

  // ================================================================
  // ADMIN KODE AKTIVASI — VPS (api.pokjawasjember.com/functions/v1/pkkm-api)
  // Menggantikan RPC Supabase. Tidak ada fallback ke server lama:
  // kalau VPS mati, admin dapat pesan jujur (fail-closed), bukan data basi.
  // ================================================================
  var PKKM_API = VPS_URL + '/functions/v1/pkkm-api';
  var PKKM_ADMIN_TOKEN_KEY = 'pkkm_admin_token';

  function pkkmAdminToken() {
    try { return sessionStorage.getItem(PKKM_ADMIN_TOKEN_KEY) || ''; } catch (e) { return ''; }
  }
  function pkkmSaveAdminToken(t) {
    try { if (t) sessionStorage.setItem(PKKM_ADMIN_TOKEN_KEY, t); } catch (e) {}
  }
  function pkkmClearAdminToken() {
    try { sessionStorage.removeItem(PKKM_ADMIN_TOKEN_KEY); } catch (e) {}
  }

  // Panggil pkkm-api. Hasil: { data } | { err:'network'|'auth'|'http', status, data }
  async function pkkmApi(path, opts) {
    opts = opts || {};
    var method = opts.method || 'GET';
    var headers = { 'apikey': VPS_ANON_KEY, 'Authorization': 'Bearer ' + VPS_ANON_KEY };
    var tok = pkkmAdminToken();
    if (tok) headers['X-Admin-Token'] = tok;
    if (method === 'POST') headers['Content-Type'] = 'application/json';

    var ctrl = new AbortController();
    var to = setTimeout(function () { ctrl.abort(); }, 20000);
    try {
      var res = await fetch(PKKM_API + path, {
        method: method,
        headers: headers,
        body: method === 'POST' ? JSON.stringify(opts.body || {}) : undefined,
        signal: ctrl.signal,
      });
      clearTimeout(to);
      var data = null;
      try { data = await res.json(); } catch (e2) { data = null; }
      if (res.status === 401) { pkkmClearAdminToken(); return { err: 'auth', status: 401, data: data }; }
      if (res.status >= 400) return { err: 'http', status: res.status, data: data };
      return { data: data };
    } catch (e) {
      clearTimeout(to);
      console.warn('[SupabaseSync] pkkm-api', path, 'error:', e.message);
      return { err: 'network' };
    }
  }

  function pkkmReason(o) {
    if (o.err === 'network') return 'network_error';
    if (o.err === 'auth') return 'session_expired';
    var d = o.data || {};
    return d.status || 'server_error';
  }

  // Login admin PKKM: username/password akun admin (edusmart_legacy.app_admins)
  async function adminVpsLogin(username, password) {
    var o = await pkkmApi('/admin-login', { method: 'POST', body: { username: username, password: password } });
    if (o.data && o.data.ok && o.data.token) {
      pkkmSaveAdminToken(o.data.token);
      return { success: true, username: o.data.username, nama: o.data.nama, role: o.data.role };
    }
    return { success: false, reason: pkkmReason(o), message: (o.data && o.data.message) || '' };
  }

  function adminVpsLogout() { pkkmClearAdminToken(); }
  function adminVpsHasSession() { return !!pkkmAdminToken(); }

  // Admin list semua kode (hanya untuk app ini)
  async function adminListCodes(adminKey) {
    var o = await pkkmApi('/admin/list-codes');
    if (o.data && o.data.ok) return o.data.data || [];
    console.warn('[SupabaseSync] adminListCodes gagal:', pkkmReason(o));
    return [];
  }

  // Admin revoke kode
  async function adminRevokeCode(code, adminKey) {
    var o = await pkkmApi('/admin/revoke-code', { method: 'POST', body: { id: code } });
    if (o.data && o.data.ok) return { success: true };
    return { success: false, reason: pkkmReason(o) };
  }

  // Admin reset device binding
  async function adminResetDevice(code, adminKey) {
    try {
      var result = await callRpc('admin_reset_device', {
        p_code: code,
        p_admin_key: adminKey,
      });
      return result;
    } catch (e) {
      console.warn('[SupabaseSync] adminResetDevice error:', e.message);
      return { success: false, reason: 'network_error' };
    }
  }

  // Admin update recipient (catatan kode)
  async function adminUpdateRecipient(code, recipient, adminKey) {
    var o = await pkkmApi('/admin/edit-code', { method: 'POST', body: { id: code, catatan: recipient } });
    if (o.data && o.data.ok) return { success: true };
    return { success: false, reason: pkkmReason(o) };
  }

  // Admin reactivate kode
  async function adminReactivateCode(code, adminKey) {
    var o = await pkkmApi('/admin/reactivate-code', { method: 'POST', body: { id: code } });
    if (o.data && o.data.ok) return { success: true };
    return { success: false, reason: pkkmReason(o) };
  }

  // Admin hapus kode yang belum pernah dipakai
  async function adminDeleteUnusedCode(code, adminKey) {
    var o = await pkkmApi('/admin/delete-code', { method: 'POST', body: { id: code } });
    if (o.data && o.data.ok) return { success: true, reason: 'deleted' };
    return { success: false, reason: pkkmReason(o) };
  }

  // Admin hapus kode (VPS: hanya yang belum dipakai — kode terpakai harus dicabut)
  async function adminDeleteCode(code, adminKey) {
    var o = await pkkmApi('/admin/delete-code', { method: 'POST', body: { id: code } });
    if (o.data && o.data.ok) return { success: true };
    return { success: false, reason: pkkmReason(o) };
  }

  // Admin batch create codes
  var CODE_PATTERN = /^(PKKM|FULL)-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;

  // NOTE: Parameter order di Pusat Lisensi: (p_admin_key, p_count, p_app_slug, p_recipient)
  async function adminBatchCreateCodes(count, recipient, adminKey) {
    try {
      var r = await pkkmApi('/admin/create-codes', { method: 'POST', body: { jumlah: count, catatan: recipient || '' } });

      if (r.data && r.data.ok) {
        var codes = (r.data.data || []).map(function (x) { return x.code; });
        // Guard klien: server VPS dijamin 19 karakter, tapi tetap diperiksa
        var bad = codes.filter(function (c) { return !CODE_PATTERN.test(String(c || '').toUpperCase()); });
        if (bad.length) {
          console.warn('[SupabaseSync] kode cacat terdeteksi:', bad);
          return { success: false, reason: 'invalid_format', codes: codes, badCodes: bad };
        }
        return { success: true, codes: codes };
      }
      return {
        success: false,
        reason: pkkmReason(r),
        message: (r.data && r.data.message) || '',
        codes: [],
      };
    } catch (e) {
      console.warn('[SupabaseSync] adminBatchCreateCodes error:', e.message);
      return { success: false, reason: 'network_error', codes: [] };
    }
  }

  // Admin get stats (hanya untuk app ini)
  async function adminGetStats(adminKey) {
    var o = await pkkmApi('/admin/stats');
    if (o.data && o.data.ok) {
      return {
        success: true,
        total: o.data.total || 0,
        unused: o.data.unused || 0,
        activated: o.data.activated || 0,
        revoked: o.data.revoked || 0,
      };
    }
    return { success: false, reason: pkkmReason(o) };
  }

  // Admin get audit log
  async function adminGetAuditLog(adminKey, limit) {
    var o = await pkkmApi('/admin/audit-log?limit=' + encodeURIComponent(limit || 50));
    if (o.data && o.data.ok) {
      // Normalkan ke bentuk lama agar UI audit tidak perlu diubah
      var logs = (o.data.data || []).map(function (l) {
        var d = l.detail || {};
        return {
          id: l.id,
          action: String(l.action || '').replace(/^pkkm_admin_/, '').toUpperCase(),
          license_code: (d.codes && d.codes[0]) || d.code || d.from || '-',
          old_device: d.from || null,
          new_device: d.to || null,
          detail: d.catatan || (d.count ? d.count + ' kode' : (d.deleted ? d.deleted + ' kode dihapus' : '')),
          created_at: l.created_at,
        };
      });
      return { success: true, logs: logs };
    }
    return { success: false, reason: pkkmReason(o), logs: [] };
  }

  // ================================================================
  // SISTEM AKUN (1 KODE = 1 AKUN)
  // Kode aktivasi diikat ke akun (username), bukan ke perangkat.
  // Akun bisa login dari perangkat mana pun.
  // ================================================================

  // Registrasi akun baru: klaim kode aktivasi untuk sebuah akun
  // Returns: { success, reason: 'claimed'|'account_exists'|'code_used'|'invalid_code'|'inactive'|'username_invalid'|'password_invalid' }
  async function registerAccount(code, username, passwordHash, fullname, madrasah, deviceInfo) {
    try {
      return await callRpc('register_account', {
        p_code: code,
        p_app_slug: APP_SLUG,
        p_username: username,
        p_password_hash: passwordHash,
        p_fullname: fullname || '',
        p_madrasah: madrasah || '',
        p_device_info: deviceInfo || '',
      });
    } catch (e) {
      console.warn('[SupabaseSync] registerAccount error:', e.message);
      return { success: null, reason: 'network_error' };
    }
  }

  // Login akun (sekaligus verifikasi berkala).
  // Returns: { valid, reason: 'ok'|'invalid_credentials'|'revoked'|'invalid_code'|'inactive', ...profil }
  async function loginAccount(username, passwordHash, deviceInfo) {
    try {
      return await callRpc('login_account', {
        p_app_slug: APP_SLUG,
        p_username: username,
        p_password_hash: passwordHash,
        p_device_info: deviceInfo || '',
        p_touch: true,
      });
    } catch (e) {
      console.warn('[SupabaseSync] loginAccount error:', e.message);
      return { valid: null, reason: 'network_error' };
    }
  }

  // Verifikasi sesi akun tanpa menulis last_login (dipakai cek berkala)
  async function verifyAccount(username, passwordHash) {
    try {
      return await callRpc('login_account', {
        p_app_slug: APP_SLUG,
        p_username: username,
        p_password_hash: passwordHash,
        p_device_info: '',
        p_touch: false,
      });
    } catch (e) {
      console.warn('[SupabaseSync] verifyAccount error:', e.message);
      return { valid: null, reason: 'network_error' };
    }
  }

  // ================================================================
  // ADMIN: AKUN PENGGUNA — VPS (konsisten dengan modul admin lain)
  // ----------------------------------------------------------------
  // Sebelumnya fungsi-fungsi ini masih memanggil RPC Supabase lama
  // (admin_list_accounts, dst) yang butuh p_admin_key. Karena login admin
  // sekarang lewat VPS, admin_key tidak pernah cocok -> RPC menjawab
  // "invalid_admin_key" -> daftar akun selalu kosong (stat card 0).
  // Sekarang semuanya lewat pkkm-api + token sesi admin (X-Admin-Token),
  // sama seperti adminListCodes/adminGetStats di atas.
  // ================================================================

  // Admin: daftar semua akun pengguna aplikasi ini
  async function adminListAccounts(adminKey) {
    var o = await pkkmApi('/admin/list-accounts');
    if (o.data && o.data.ok) return o.data.accounts || o.data.data || [];
    console.warn('[SupabaseSync] adminListAccounts gagal:', pkkmReason(o));
    return [];
  }

  // Admin: statistik akun (normalkan ke bentuk yang dipakai UI)
  async function adminGetAccountStats(adminKey) {
    var o = await pkkmApi('/admin/account-stats');
    if (o.data && o.data.ok) {
      var d = o.data.data || o.data;
      return {
        success: true,
        total_accounts: d.total_accounts || 0,
        active_accounts: d.active_accounts || 0,
        revoked_accounts: d.revoked_accounts || 0,
        codes_with_account: d.codes_with_account || 0,
      };
    }
    return { success: false, reason: pkkmReason(o) };
  }

  // Admin: nonaktifkan akun
  async function adminRevokeAccount(accountId, adminKey) {
    var o = await pkkmApi('/admin/revoke-account', { method: 'POST', body: { id: accountId } });
    if (o.data && o.data.ok) return { success: true };
    return { success: false, reason: pkkmReason(o) };
  }

  // Admin: aktifkan kembali akun
  async function adminReactivateAccount(accountId, adminKey) {
    var o = await pkkmApi('/admin/reactivate-account', { method: 'POST', body: { id: accountId } });
    if (o.data && o.data.ok) return { success: true };
    return { success: false, reason: pkkmReason(o) };
  }

  // Admin: hapus akun (kode bebas dipakai akun baru)
  async function adminDeleteAccount(accountId, adminKey) {
    var o = await pkkmApi('/admin/delete-account', { method: 'POST', body: { id: accountId } });
    if (o.data && o.data.ok) return { success: true };
    return { success: false, reason: pkkmReason(o) };
  }

  // Admin: reset password akun
  async function adminResetAccountPassword(accountId, newPasswordHash, adminKey) {
    var o = await pkkmApi('/admin/reset-account-password', {
      method: 'POST',
      body: { id: accountId, password_hash: newPasswordHash },
    });
    if (o.data && o.data.ok) return { success: true };
    return { success: false, reason: pkkmReason(o) };
  }

  // Reset password mandiri (lupa password) — verifikasi via username + kode aktivasi.
  // Returns: { success, reason: 'password_reset'|'invalid_credentials'|'revoked'|'username_invalid'|'password_invalid'|'not_available'|'network_error' }
  async function resetAccountPassword(username, licenseCode, newPasswordHash) {
    try {
      return await callRpc('reset_account_password', {
        p_app_slug: APP_SLUG,
        p_username: username,
        p_license_code: licenseCode,
        p_new_password_hash: newPasswordHash,
      });
    } catch (e) {
      var msg = String(e && e.message || '');
      // Fungsi belum di-deploy di server (migration belum dijalankan)
      if (msg.indexOf('404') >= 0 || msg.indexOf('PGRST202') >= 0) {
        return { success: false, reason: 'not_available' };
      }
      console.warn('[SupabaseSync] resetAccountPassword error:', msg);
      return { success: null, reason: 'network_error' };
    }
  }

  // ================================================================
  // ADMIN LOGIN APLIKASI (VPS — menggantikan RPC Supabase admin_login)
  // ================================================================
  // Dipakai layar login aplikasi PKKM saat username = 'admin'.
  // Memakai password ASLI (bukan hash) karena hash PKKM berbeda-beda
  // antar versi; server yang menghitung.
  // Hasil sukses menyimpan token sesi admin (sessionStorage, 7 hari)
  // sehingga menu Aktivasi terbuka otomatis tanpa login kedua.
  //
  // CATATAN: TIDAK ada fallback ke Supabase. Kredensial admin PKKM
  // hanya ada di VPS; menyimpannya di dua tempat justru sumber kebingungan
  // (pernah terjadi: hash di server lama beda dengan VPS -> "password salah"
  // padahal passwordnya benar). Kalau VPS mati, jawabnya jujur.
  // Returns: { success, reason, admin_key?, username?, fullname?, message? }
  async function adminLogin(username, passwordHash, passwordPlain) {
    var vps = await adminVpsLogin(username, passwordPlain);
    if (vps.success) {
      return { success: true, via: 'vps', admin_key: pkkmAdminToken(), username: vps.username || username };
    }
    return {
      success: false,
      via: 'vps',
      reason: vps.reason || 'network_error',
      message: vps.message || (vps.reason === 'network_error'
        ? 'Server tidak dapat dihubungi. Coba beberapa saat lagi.'
        : 'Username atau Password salah!'),
    };
  }

  // Admin: ganti admin key (butuh key lama)
  async function adminChangeKey(oldKey, newKey) {
    try {
      return await callRpc('admin_change_key', { p_old_key: oldKey, p_new_key: newKey });
    } catch (e) {
      console.warn('[SupabaseSync] adminChangeKey error:', e.message);
      return { success: false, reason: 'network_error' };
    }
  }

  // Admin: ganti password admin (butuh admin key)
  async function adminChangePassword(adminKey, newPasswordHash) {
    try {
      return await callRpc('admin_change_password', {
        p_admin_key: adminKey,
        p_app_slug: APP_SLUG,
        p_new_password_hash: newPasswordHash,
      });
    } catch (e) {
      console.warn('[SupabaseSync] adminChangePassword error:', e.message);
      return { success: false, reason: 'network_error' };
    }
  }

  // ================================================================
  // LEGACY COMPAT (deprecated — redirect ke API baru)
  // ================================================================
  async function isCodeValid(code) {
    var deviceId = localStorage.getItem('pkkm_v1_device_id') || 'unknown';
    var v = await verifyLicense(code, deviceId);
    if (v.valid === true) return { valid: true, row: { used_by: deviceId } };
    if (v.valid === false) return { valid: false, reason: v.reason };
    return { valid: null, reason: 'network_error' };
  }

  async function claimCode(code, deviceInfo) {
    var r = await claimLicense(code, deviceInfo.deviceId || 'unknown', deviceInfo.userAgent || '');
    if (r.success === true) return { ok: true };
    if (r.success === false) return { ok: false, reason: r.reason };
    return { ok: null, reason: 'network_error' };
  }

  async function isCodeUsed(code) {
    var deviceId = localStorage.getItem('pkkm_v1_device_id') || 'unknown';
    var v = await verifyLicense(code, deviceId);
    return v.reason === 'other_device';
  }

  async function reportActivation(info) {
    return await claimCode(info.code, { deviceId: info.device_id, userAgent: info.device_info });
  }

  // Public API
  window.SupabaseSync = {
    // Public
    VPS_URL: VPS_URL,
    VPS_ANON_KEY: VPS_ANON_KEY,
    VPS_APP_ID: VPS_APP_ID,
    vpsGetToken: vpsGetToken,
    vpsLoginHash: vpsLoginHash,
    vpsClearToken: vpsClearToken,
    loginAccountSmart: loginAccountSmart,
    registerAccountSmart: registerAccountSmart,
    isVpsLatched: isVpsLatched,
    markVpsLatched: markVpsLatched,
    resetVpsLatch: resetVpsLatch,
    vpsLatchedUsers: vpsLatchedUsers,
    backendInfo: function () {
      return {
        mode: 'vps-first',
        vps_url: VPS_URL,
        app_id: VPS_APP_ID,
        latched: Object.keys(vpsLatchedUsers()),
        has_token: !!vpsGetToken()
      };
    },
    claimLicense: claimLicense,
    verifyLicense: verifyLicense,
    isOnline: isOnline,
    // Akun (1 kode = 1 akun)
    registerAccount: registerAccount,
    loginAccount: loginAccount,
    verifyAccount: verifyAccount,
    resetAccountPassword: resetAccountPassword,
    adminListAccounts: adminListAccounts,
    adminGetAccountStats: adminGetAccountStats,
    // Admin login & kredensial (server-side)
    adminLogin: adminLogin,
    adminChangeKey: adminChangeKey,
    adminChangePassword: adminChangePassword,
    adminRevokeAccount: adminRevokeAccount,
    adminReactivateAccount: adminReactivateAccount,
    adminDeleteAccount: adminDeleteAccount,
    adminResetAccountPassword: adminResetAccountPassword,
    // Admin
    adminGenerateCode: adminGenerateCode,
    adminVpsLogin: adminVpsLogin,
    adminVpsLogout: adminVpsLogout,
    adminVpsHasSession: adminVpsHasSession,
    adminListCodes: adminListCodes,
    adminRevokeCode: adminRevokeCode,
    adminResetDevice: adminResetDevice,
    adminUpdateRecipient: adminUpdateRecipient,
    adminReactivateCode: adminReactivateCode,
    adminDeleteUnusedCode: adminDeleteUnusedCode,
    adminDeleteCode: adminDeleteCode,
    adminBatchCreateCodes: adminBatchCreateCodes,
    adminGetStats: adminGetStats,
    adminGetAuditLog: adminGetAuditLog,
    // Legacy compat
    isCodeValid: isCodeValid,
    claimCode: claimCode,
    isCodeUsed: isCodeUsed,
    reportActivation: reportActivation,
    // Deprecated old admin functions
    generateCode: function (recipient) {
      console.warn('[SupabaseSync] generateCode deprecated, use adminGenerateCode');
      return { ok: false, reason: 'Deprecated. Admin key required.' };
    },
    listCodes: function () {
      console.warn('[SupabaseSync] listCodes deprecated, use adminListCodes');
      return [];
    },
    revokeCode: function () {
      console.warn('[SupabaseSync] revokeCode deprecated, use adminRevokeCode');
      return { ok: false, reason: 'Deprecated. Admin key required.' };
    },
    updateRecipient: function () {
      console.warn('[SupabaseSync] updateRecipient deprecated, use adminUpdateRecipient');
      return { ok: false, reason: 'Deprecated. Admin key required.' };
    },
  };
})();
