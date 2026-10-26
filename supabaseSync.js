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

  // Cek koneksi online — gunakan verify_license dengan dummy data (aman, tidak ada side effect)
  async function isOnline() {
    try {
      // Pakai admin_get_stats sebagai ping (error jika offline, response jika online)
      var result = await callRpc('admin_get_stats', { p_admin_key: '__ping__' });
      // Jika sampai sini berarti server merespon (meskipun key salah)
      return true;
    } catch (e) {
      // Network error = offline; RPC error lain = online tapi key salah
      if (e.message && e.message.indexOf('Timeout') >= 0) return false;
      if (e.message && e.message.indexOf('Failed to fetch') >= 0) return false;
      // RPC returned error (bukan network) = online
      return true;
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

  // Admin list semua kode (hanya untuk app ini)
  async function adminListCodes(adminKey) {
    try {
      var result = await callRpc('admin_list_codes', {
        p_admin_key: adminKey,
        p_app_slug: APP_SLUG,
      });
      if (result && result.success) return result.codes || [];
      return [];
    } catch (e) {
      console.warn('[SupabaseSync] adminListCodes error:', e.message);
      return [];
    }
  }

  // Admin revoke kode
  async function adminRevokeCode(code, adminKey) {
    try {
      var result = await callRpc('admin_revoke_code', {
        p_code: code,
        p_admin_key: adminKey,
      });
      return result;
    } catch (e) {
      console.warn('[SupabaseSync] adminRevokeCode error:', e.message);
      return { success: false, reason: 'network_error' };
    }
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

  // Admin update recipient
  async function adminUpdateRecipient(code, recipient, adminKey) {
    try {
      var result = await callRpc('admin_update_recipient', {
        p_code: code,
        p_recipient: recipient,
        p_admin_key: adminKey,
      });
      return result;
    } catch (e) {
      console.warn('[SupabaseSync] adminUpdateRecipient error:', e.message);
      return { success: false, reason: 'network_error' };
    }
  }

  // Admin reactivate kode
  async function adminReactivateCode(code, adminKey) {
    try {
      return await callRpc('admin_reactivate_code', { p_code: code, p_admin_key: adminKey });
    } catch (e) {
      console.warn('[SupabaseSync] adminReactivateCode error:', e.message);
      return { success: false, reason: 'network_error' };
    }
  }

  // Admin hapus kode yang belum pernah dipakai
  async function adminDeleteUnusedCode(code, adminKey) {
    try {
      return await callRpc('admin_delete_unused_code', { p_code: code, p_admin_key: adminKey });
    } catch (e) {
      console.warn('[SupabaseSync] adminDeleteUnusedCode error:', e.message);
      return { success: false, reason: 'network_error' };
    }
  }

  // Admin hapus kode APA PUN (termasuk yang sudah terpakai) — akses permanen dicabut
  async function adminDeleteCode(code, adminKey) {
    try {
      return await callRpc('admin_delete_code', { p_code: code, p_admin_key: adminKey });
    } catch (e) {
      console.warn('[SupabaseSync] adminDeleteCode error:', e.message);
      return { success: false, reason: 'network_error' };
    }
  }

  // Admin batch create codes
  // NOTE: Parameter order di Pusat Lisensi: (p_admin_key, p_count, p_app_slug, p_recipient)
  async function adminBatchCreateCodes(count, recipient, adminKey) {
    try {
      return await callRpc('admin_batch_create_codes', {
        p_admin_key: adminKey,
        p_count: count,
        p_app_slug: APP_SLUG,
        p_recipient: recipient || '',
      });
    } catch (e) {
      console.warn('[SupabaseSync] adminBatchCreateCodes error:', e.message);
      return { success: false, reason: 'network_error', codes: [] };
    }
  }

  // Admin get stats (hanya untuk app ini)
  async function adminGetStats(adminKey) {
    try {
      return await callRpc('admin_get_stats', { p_admin_key: adminKey, p_app_slug: APP_SLUG });
    } catch (e) {
      console.warn('[SupabaseSync] adminGetStats error:', e.message);
      return { success: false, reason: 'network_error' };
    }
  }

  // Admin get audit log
  async function adminGetAuditLog(adminKey, limit) {
    try {
      return await callRpc('admin_get_audit_log', { p_admin_key: adminKey, p_limit: limit || 50, p_app_slug: APP_SLUG });
    } catch (e) {
      console.warn('[SupabaseSync] adminGetAuditLog error:', e.message);
      return { success: false, reason: 'network_error', logs: [] };
    }
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

  // Admin: daftar semua akun
  async function adminListAccounts(adminKey) {
    try {
      var r = await callRpc('admin_list_accounts', { p_admin_key: adminKey, p_app_slug: APP_SLUG });
      if (r && r.success) return r.accounts || [];
      return [];
    } catch (e) {
      console.warn('[SupabaseSync] adminListAccounts error:', e.message);
      return [];
    }
  }

  // Admin: statistik akun
  async function adminGetAccountStats(adminKey) {
    try {
      return await callRpc('admin_get_account_stats', { p_admin_key: adminKey, p_app_slug: APP_SLUG });
    } catch (e) {
      console.warn('[SupabaseSync] adminGetAccountStats error:', e.message);
      return { success: false, reason: 'network_error' };
    }
  }

  // Admin: nonaktifkan akun
  async function adminRevokeAccount(accountId, adminKey) {
    try {
      return await callRpc('admin_revoke_account', { p_admin_key: adminKey, p_account_id: accountId });
    } catch (e) {
      console.warn('[SupabaseSync] adminRevokeAccount error:', e.message);
      return { success: false, reason: 'network_error' };
    }
  }

  // Admin: aktifkan kembali akun
  async function adminReactivateAccount(accountId, adminKey) {
    try {
      return await callRpc('admin_reactivate_account', { p_admin_key: adminKey, p_account_id: accountId });
    } catch (e) {
      console.warn('[SupabaseSync] adminReactivateAccount error:', e.message);
      return { success: false, reason: 'network_error' };
    }
  }

  // Admin: hapus akun (kode bebas dipakai akun baru)
  async function adminDeleteAccount(accountId, adminKey) {
    try {
      return await callRpc('admin_delete_account', { p_admin_key: adminKey, p_account_id: accountId });
    } catch (e) {
      console.warn('[SupabaseSync] adminDeleteAccount error:', e.message);
      return { success: false, reason: 'network_error' };
    }
  }

  // Admin: reset password akun
  async function adminResetAccountPassword(accountId, newPasswordHash, adminKey) {
    try {
      return await callRpc('admin_reset_account_password', {
        p_admin_key: adminKey,
        p_account_id: accountId,
        p_new_password_hash: newPasswordHash,
      });
    } catch (e) {
      console.warn('[SupabaseSync] adminResetAccountPassword error:', e.message);
      return { success: false, reason: 'network_error' };
    }
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
  // ADMIN LOGIN (server-side, tanpa password/kunci di file publik)
  // ================================================================
  // Verifikasi admin di server. Kunci admin didapat dari server dan
  // hanya disimpan per-sesi (sessionStorage) oleh pemanggil.
  // Returns: { success, reason, admin_key?, username?, fullname? }
  async function adminLogin(username, passwordHash) {
    try {
      return await callRpc('admin_login', {
        p_app_slug: APP_SLUG,
        p_username: username,
        p_password_hash: passwordHash,
      });
    } catch (e) {
      console.warn('[SupabaseSync] adminLogin error:', e.message);
      return { success: false, reason: 'network_error' };
    }
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
