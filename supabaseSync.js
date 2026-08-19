// supabaseSync.js - Cross-device license sync via Supabase REST API
// No SDK needed — direct fetch to Supabase REST endpoints.
(function () {
  'use strict';

  var SUPABASE_URL = 'https://jnpstfyexmflbnkwxoqt.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_y2QVBiY1uEIBPzMgBxIoag_a3d4E7ra';
  var TABLE = 'license_codes';
  var TIMEOUT_MS = 8000;

  function timeoutFetch(url, opts, ms) {
    return Promise.race([
      fetch(url, opts),
      new Promise(function (_, reject) {
        setTimeout(function () { reject(new Error('Timeout ' + ms + 'ms')); }, ms);
      })
    ]);
  }

  async function supabaseRequest(method, path, body) {
    var url = SUPABASE_URL + '/rest/v1' + path;
    var headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    };
    if (body) headers['Prefer'] = 'return=representation';
    var res = await timeoutFetch(url, {
      method: method,
      headers: headers,
      body: body ? JSON.stringify(body) : undefined,
    }, TIMEOUT_MS);
    if (!res.ok) {
      var text = await res.text();
      throw new Error('Supabase ' + res.status + ': ' + text);
    }
    return res.json();
  }

  // Check if code exists and is available (not used, not revoked)
  async function isCodeValid(code) {
    try {
      var data = await supabaseRequest('GET', '/' + TABLE + '?code=eq.' + encodeURIComponent(code) + '&limit=1');
      if (!data || data.length === 0) return { valid: false, reason: 'Kode tidak ditemukan di server.' };
      var row = data[0];
      if (row.revoked) return { valid: false, reason: 'Kode telah dicabut admin.' };
      if (row.used_by) return { valid: false, reason: 'Kode sudah digunakan di perangkat lain.' };
      return { valid: true, row: row };
    } catch (e) {
      console.warn('[SupabaseSync] isCodeValid error:', e.message);
      return { valid: null, reason: 'Tidak dapat terhubung ke server (offline). Coba lagi nanti.' };
    }
  }

  // Atomically claim a code for this device (only if not already used)
  async function claimCode(code, deviceInfo) {
    try {
      var updates = {
        used_by: deviceInfo.deviceId || 'unknown',
        used_at: new Date().toISOString(),
        device_info: deviceInfo.userAgent || '',
      };
      // Atomic claim: only update WHERE used_by IS NULL
      var data = await supabaseRequest('PATCH', '/' + TABLE + '?code=eq.' + encodeURIComponent(code) + '&used_by=is.null', updates);
      if (!data || data.length === 0) {
        return { ok: false, reason: 'Kode sudah diklaim perangkat lain (race condition). Coba kode lain.' };
      }
      return { ok: true };
    } catch (e) {
      console.warn('[SupabaseSync] claimCode error:', e.message);
      return { ok: null, reason: 'Tidak dapat terhubung ke server. Coba lagi nanti.' };
    }
  }

  // Generate + store a new code (admin)
  async function generateCode(recipient) {
    try {
      var ch = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      var p = function (n) { var s = ''; for (var i = 0; i < n; i++) s += ch[Math.floor(Math.random() * ch.length)]; return s; };
      var code = 'FULL-' + p(4) + '-' + p(4) + '-' + p(4);
      var data = await supabaseRequest('POST', '/' + TABLE, {
        code: code,
        recipient: recipient || '',
        created_by: 'admin',
        revoked: false,
      });
      if (!data || data.length === 0) throw new Error('Insert gagal');
      return { ok: true, code: code };
    } catch (e) {
      console.warn('[SupabaseSync] generateCode error:', e.message);
      return { ok: false, reason: e.message };
    }
  }

  // List all codes (admin)
  async function listCodes() {
    try {
      var data = await supabaseRequest('GET', '/' + TABLE + '?order=created_at.desc');
      return data || [];
    } catch (e) {
      console.warn('[SupabaseSync] listCodes error:', e.message);
      return [];
    }
  }

  // Revoke a code (admin)
  async function revokeCode(code) {
    try {
      await supabaseRequest('PATCH', '/' + TABLE + '?code=eq.' + encodeURIComponent(code), { revoked: true });
      return { ok: true };
    } catch (e) {
      console.warn('[SupabaseSync] revokeCode error:', e.message);
      return { ok: false, reason: e.message };
    }
  }

  // Update recipient name (admin)
  async function updateRecipient(code, recipient) {
    try {
      await supabaseRequest('PATCH', '/' + TABLE + '?code=eq.' + encodeURIComponent(code), { recipient: recipient });
      return { ok: true };
    } catch (e) {
      console.warn('[SupabaseSync] updateRecipient error:', e.message);
      return { ok: false, reason: e.message };
    }
  }

  // Legacy compat for auth.js
  async function isCodeUsed(code) {
    var r = await isCodeValid(code);
    return r.valid === false && r.reason.indexOf('sudah digunakan') >= 0;
  }

  // Legacy compat for auth.js reportActivation
  async function reportActivation(info) {
    return await claimCode(info.code, { deviceId: info.device_id, userAgent: info.device_info });
  }

  // Online check
  async function isOnline() {
    try {
      var data = await supabaseRequest('GET', '/' + TABLE + '?limit=1');
      return true;
    } catch (e) {
      return false;
    }
  }

  window.SupabaseSync = {
    isCodeValid: isCodeValid,
    claimCode: claimCode,
    generateCode: generateCode,
    listCodes: listCodes,
    revokeCode: revokeCode,
    updateRecipient: updateRecipient,
    isCodeUsed: isCodeUsed,
    reportActivation: reportActivation,
    isOnline: isOnline,
  };
})();
