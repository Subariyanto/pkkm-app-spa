// supabaseSync.js - Pusat Lisensi Aplikasi (Supabase RPC)
// Updated: redirect ke Pusat Lisensi terpusat
// Semua operasi via RPC (SECURITY DEFINER) yang bypass RLS.
(function () {
  'use strict';

  // === PUSAT LISENSI APLIKASI ===
  var SUPABASE_URL = 'https://llaukzsztguwrtwdubpm.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_ueDydfaO-kFcHEmJKM-ClQ_gKVHNdbG';
  var APP_SLUG = 'pkkm';
  var TIMEOUT_MS = 10000;

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
    claimLicense: claimLicense,
    verifyLicense: verifyLicense,
    isOnline: isOnline,
    // Admin
    adminGenerateCode: adminGenerateCode,
    adminListCodes: adminListCodes,
    adminRevokeCode: adminRevokeCode,
    adminResetDevice: adminResetDevice,
    adminUpdateRecipient: adminUpdateRecipient,
    adminReactivateCode: adminReactivateCode,
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
