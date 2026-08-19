// auth.js - Kode Aktivasi, Registrasi Akun, Login, & PIN Lock untuk PKKM App SPA
// Offline device binding logic + local user management.
// 2 roles supported: Admin (Pokjawas), Pengawas.

(function () {
  'use strict';

  // Constants
  const KEY_PIN_HASH = 'pkkm_v1_pin_hash';
  const KEY_PIN_SALT = 'pkkm_v1_pin_salt';
  const KEY_UNLOCKED = 'pkkm_v1_unlocked';

  // Activation & Account Keys
  const KEY_ACTIVATED = 'pkkm_v1_activated';
  const KEY_ACTIVATION_CODE = 'pkkm_v1_activation_code';
  const KEY_DEVICE_ID = 'pkkm_v1_device_id';
  const KEY_DEVICE_BINDING = 'pkkm_v1_device_binding';
  
  const KEY_USER_ROLE = 'pkkm_v1_user_role'; // admin | pengawas
  const KEY_USER_USERNAME = 'pkkm_v1_user_username';
  const KEY_USER_PASSWORD_HASH = 'pkkm_v1_user_password_hash';
  const KEY_USER_FULLNAME = 'pkkm_v1_user_fullname';
  const KEY_USER_MADRASAH = 'pkkm_v1_user_madrasah';
  
  const KEY_LOGGED_IN = 'pkkm_v1_logged_in'; // sessionStorage

  // Trial Account Constants
  const TRIAL_CODE = 'PKKM-TRIAL-2026';
  const TRIAL_DURATION_MS = 5 * 24 * 60 * 60 * 1000; // 5 hari (259200000 ms)
  const KEY_TRIAL_START = 'pkkm_v1_trial_start';

  // Secret Salt untuk Offline Checksum Kode Aktivasi
  const ACTIVATION_SALT = 'kbc-pokjawasmad-jember-love-2026';

  // TAHAP 2: Tidak ada master code di frontend. Aktivasi via Supabase RPC saja.
  // Admin key tidak disimpan di frontend (hanya di session, diketik user).

  // --- CRYPTO UTILS ---
  async function sha256(text) {
    if (window.crypto && window.crypto.subtle) {
      const buf = new TextEncoder().encode(text);
      const hash = await crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
    return fnv1aHash(text);
  }

  function fnv1aHash(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    let h2 = 0x811c9dc5;
    const s2 = (h >>> 0).toString(16).padStart(8, '0') + str;
    for (let i = 0; i < s2.length; i++) {
      h2 ^= s2.charCodeAt(i);
      h2 = Math.imul(h2, 0x01000193);
    }
    // >>> 0 ensures unsigned 32-bit, so toString(16) never produces a leading '-'
    return (h >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
  }

  function randomSalt() {
    if (window.crypto && window.crypto.getRandomValues) {
      const arr = new Uint8Array(16);
      crypto.getRandomValues(arr);
      return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    let s = '';
    for (let i = 0; i < 32; i++) {
      s += Math.floor(Math.random() * 16).toString(16);
    }
    return s;
  }

  // --- DEVICE ID GENERATION & CHECK ---
  function getDeviceId() {
    let id = localStorage.getItem(KEY_DEVICE_ID);
    if (!id) {
      id = 'DEV-' + randomSalt().substring(0, 16).toUpperCase();
      localStorage.setItem(KEY_DEVICE_ID, id);
    }
    return id;
  }

  // --- OFFLINE ACTIVATION VALIDATOR ---
  function generateActivationCode() {
    const chars = '0123456789ABCDEF';
    let rand = '';
    for (let i = 0; i < 8; i++) {
      rand += chars[Math.floor(Math.random() * 16)];
    }
    const checksum = fnv1aHash(rand + ':' + ACTIVATION_SALT).substring(0, 4).toUpperCase();
    return `PKKM-KBC-${rand}-${checksum}`;
  }

  async function verifyActivationCode(code) {
    const cleanCode = code.trim().toUpperCase();

    // TAHAP 2: Semua kode harus diverifikasi via Supabase RPC. Tidak ada bypass.
    if (!window.SupabaseSync) return 'network_error';

    // Kode FULL-XXXX-XXXX-XXXX → verifikasi via RPC
    if (cleanCode.startsWith('FULL-')) {
      try {
        const deviceId = getDeviceId();
        const v = await window.SupabaseSync.verifyLicense(cleanCode, deviceId);
        if (v.valid === true) return true; // same_device atau masih available
        if (v.valid === false) {
          if (v.reason === 'other_device' || v.reason === 'inactive') return 'used';
          if (v.reason === 'invalid_code') return false;
          if (v.reason === 'not_claimed') return true; // belum di-claim, bisa dipakai
        }
        // network error → FAIL CLOSED (tidak boleh true)
        return 'network_error';
      } catch (e) {
        console.warn('[verifyActivationCode] RPC error:', e.message);
        return 'network_error';
      }
    }

    // Kode PKKM-KBC-XXXXXXXX-XXXX (format lama, lokal hash)
    const match = cleanCode.match(/^PKKM-KBC-([0-9A-F]{8})-([0-9A-F]{4})$/);
    if (!match) return false;
    const rand = match[1];
    const checksum = match[2];
    const expected = fnv1aHash(rand + ':' + ACTIVATION_SALT).substring(0, 4).toUpperCase();
    if (checksum !== expected) return false;

    // Format lama: cek hash lokal (offline format)
    return true;
  }

  // --- TRIAL ACCOUNT LOGIC ---
  function isTrial() {
    // Cek license.js dulu (single source of truth untuk tier)
    if (window.LIC && typeof window.LIC.getStatus === 'function') {
      var s = window.LIC.getStatus();
      if (s.tier === 'full') return false; // Lisensi full = bukan trial
    }
    return localStorage.getItem(KEY_USER_ROLE) === 'trial';
  }

  function isTrialExpired() {
    if (!isTrial()) return false;
    // Sinkron dengan license.js
    if (window.LIC && typeof window.LIC.getStatus === 'function') {
      var s = window.LIC.getStatus();
      if (s.isExpired) return true;
    }
    const start = parseInt(localStorage.getItem(KEY_TRIAL_START) || '0', 10);
    if (!start) return false;
    return Date.now() - start >= TRIAL_DURATION_MS;
  }

  function getTrialDaysLeft() {
    if (!isTrial()) return 0;
    const start = parseInt(localStorage.getItem(KEY_TRIAL_START) || '0', 10);
    if (!start) return 0;
    const remaining = TRIAL_DURATION_MS - (Date.now() - start);
    return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
  }

  async function upgradeFromTrial(code) {
    if (!isTrial()) return { ok: false, msg: 'Akun ini bukan akun trial.' };
    const cleanCode = code.trim().toUpperCase();

    const v = await verifyActivationCode(cleanCode);
    if (v === false) return { ok: false, msg: 'Kode aktivasi tidak valid!' };
    if (v === 'used') return { ok: false, msg: 'Kode aktivasi sudah digunakan di perangkat lain. Hubungi Admin/Ketua Pokjawas.' };

    // Hapus key trial, set aktivasi penuh
    localStorage.removeItem(KEY_TRIAL_START);
    const devId = getDeviceId();
    const binding = fnv1aHash(devId + ':' + cleanCode);

    localStorage.setItem(KEY_ACTIVATED, 'true');
    localStorage.setItem(KEY_ACTIVATION_CODE, cleanCode);
    localStorage.setItem(KEY_DEVICE_BINDING, binding);
    // Upgrade role trial -> pengawas
    if (localStorage.getItem(KEY_USER_ROLE) === 'trial') {
      localStorage.setItem(KEY_USER_ROLE, 'pengawas');
    }

    // Sinkronisasi lisensi ke license.js (single source of truth)
    // LIC.redeem() handles: master code bypass, Supabase validation + atomic claim, set tier=full
    if (window.LIC && typeof window.LIC.redeem === 'function') {
      try {
        const licResult = await window.LIC.redeem(cleanCode);
        if (!licResult.ok) {
          // Rollback auth state jika lisensi gagal
          localStorage.setItem(KEY_USER_ROLE, 'trial');
          localStorage.setItem(KEY_TRIAL_START, String(Date.now()));
          localStorage.setItem(KEY_ACTIVATED, 'false');
          return { ok: false, msg: licResult.reason || 'Aktivasi lisensi gagal.' };
        }
      } catch (e) {
        console.warn('[upgradeFromTrial] LIC.redeem failed:', e.message);
      }
    }

    return { ok: true, msg: 'Akun berhasil di-upgrade ke lisensi penuh!' };
  }

  // --- PIN LOCK LOGIC ---
  async function setPin(pin) {
    if (!/^\d{4,6}$/.test(pin)) throw new Error('PIN harus 4-6 digit angka');
    const salt = randomSalt();
    const hash = await sha256(salt + ':' + pin);
    localStorage.setItem(KEY_PIN_SALT, salt);
    localStorage.setItem(KEY_PIN_HASH, hash);
    sessionStorage.setItem(KEY_UNLOCKED, '1');
  }

  async function verifyPin(pin) {
    const salt = localStorage.getItem(KEY_PIN_SALT);
    const stored = localStorage.getItem(KEY_PIN_HASH);
    if (!salt || !stored) return false;
    const hash = await sha256(salt + ':' + pin);
    return hash === stored;
  }

  function isPinSet() {
    return !!(localStorage.getItem(KEY_PIN_HASH) && localStorage.getItem(KEY_PIN_SALT));
  }

  function clearPin() {
    localStorage.removeItem(KEY_PIN_HASH);
    localStorage.removeItem(KEY_PIN_SALT);
    sessionStorage.removeItem(KEY_UNLOCKED);
  }

  function isUnlocked() {
    if (!isPinSet()) return true;
    return sessionStorage.getItem(KEY_UNLOCKED) === '1';
  }

  function unlock() { sessionStorage.setItem(KEY_UNLOCKED, '1'); }
  function lock() { sessionStorage.removeItem(KEY_UNLOCKED); }

  function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  // --- AUTH STATUS CHECKS ---
  function isActivated() {
    const activated = localStorage.getItem(KEY_ACTIVATED) === 'true';
    if (!activated) return false;
    
    // Verifikasi Device Binding (Mencegah copy data ke device lain)
    const code = localStorage.getItem(KEY_ACTIVATION_CODE);
    const devId = getDeviceId();
    const binding = localStorage.getItem(KEY_DEVICE_BINDING);
    const expectedBinding = fnv1aHash(devId + ':' + code);
    
    return binding === expectedBinding;
  }

  function isLoggedIn() {
    return sessionStorage.getItem(KEY_LOGGED_IN) === 'true';
  }

  function getUserInfo() {
    return {
      role: localStorage.getItem(KEY_USER_ROLE) || 'pengawas',
      username: localStorage.getItem(KEY_USER_USERNAME) || '',
      fullname: localStorage.getItem(KEY_USER_FULLNAME) || '',
      madrasah: localStorage.getItem(KEY_USER_MADRASAH) || '',
      deviceId: getDeviceId()
    };
  }

  // --- VIEWS & RENDER OVERLAYS ---

  // 1. Screen Registrasi & Aktivasi
  function renderActivationScreen() {
    let overlay = document.getElementById('pkkm-auth-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'pkkm-auth-overlay';
      document.body.appendChild(overlay);
    }

    // Isi nama kabupaten/kota dari setting
    let _kabKota = 'Jember';
    try { _kabKota = JSON.parse(localStorage.getItem('pkkm_v1_meta') || '{}').kabupaten_kota || 'Jember'; } catch(e) {}
    const _setRegion = () => overlay.querySelectorAll('.auth-region').forEach(el => el.textContent = _kabKota);
    setTimeout(_setRegion, 0);

    overlay.innerHTML = `
      <style>
        #pkkm-auth-overlay {
          position: fixed; inset: 0; z-index: 3000;
          background: linear-gradient(135deg, #1e40af 0%, #1f5d3a 100%);
          display: flex; align-items: center; justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: 1rem; overflow-y: auto;
        }
        .auth-card {
          background: #fff; border-radius: 12px; padding: 2rem;
          width: 100%; max-width: 480px;
          box-shadow: 0 12px 40px rgba(0,0,0,.25);
        }
        .auth-logo {
          text-align: center; margin-bottom: 1.5rem;
        }
        .auth-logo i { font-size: 3rem; color: #1f5d3a; }
        .auth-logo h2 { margin: 0.5rem 0 0; color: #1f5d3a; font-size: 1.5rem; font-weight: bold; }
        .auth-logo p { margin: 0; color: #666; font-size: 0.85rem; }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.25rem; color: #333; }
        .form-group input, .form-group select {
          width: 100%; padding: 0.6rem; border: 2px solid #ddd; border-radius: 8px; outline: none; font-size: 0.95rem;
        }
        .form-group input:focus, .form-group select:focus { border-color: #1f5d3a; }
        .btn-auth-submit {
          width: 100%; background: #1f5d3a; color: white; border: 0;
          padding: 0.75rem; border-radius: 8px; font-weight: 600; cursor: pointer;
          font-size: 1rem; margin-top: 1rem; transition: background 0.2s;
        }
        .btn-auth-submit:hover { background: #143e26; }
        .auth-err { color: #c0392b; font-size: 0.85rem; min-height: 1.2rem; margin-bottom: 0.5rem; text-align: center; }
        .device-info-text { font-size: 0.75rem; color: #888; text-align: center; margin-top: 1rem; }
      </style>
      <div class="auth-card">
        <div class="auth-logo">
          <i class="bi bi-shield-check"></i>
          <h2>Aktivasi & Registrasi Akun</h2>
          <p>PKKM Pokjawasmad Kab. <span class="auth-region"></span> (KMA 1503)</p>
        </div>
        <div class="auth-err" id="auth-reg-err"></div>
        
        <div class="form-group">
          <label>Kode Aktivasi (FULL-XXXX / PPKM-KBC-XXXX)</label>
          <input id="reg-code" type="text" placeholder="Masukkan kode dari Admin/Ketua Pokjawas" autocomplete="off" style="text-transform: uppercase;">
        </div>
        
        <div class="form-group">
          <label>Nama Pengguna (Username untuk login)</label>
          <input id="reg-username" type="text" placeholder="Contoh: pengawas_jember" autocomplete="off" minlength="4">
        </div>
        
        <div class="form-group">
          <label>Nama Lengkap</label>
          <input id="reg-fullname" type="text" placeholder="Nama Lengkap beserta gelar" autocomplete="off">
        </div>

        <div class="form-group">
          <label>Password</label>
          <input id="reg-password" type="password" placeholder="Minimal 6 karakter" autocomplete="off">
        </div>

        <div class="form-group">
          <label>Konfirmasi Password</label>
          <input id="reg-confirm" type="password" placeholder="Ulangi password" autocomplete="off">
        </div>

        <button class="btn-auth-submit" id="btn-reg-submit">Aktifkan & Daftar Akun</button>
        
        <div style="text-align:center; margin-top:.75rem;">
          <button id="btn-trial" type="button" style="background:transparent; border:2px solid #1f5d3a; color:#1f5d3a; padding:.5rem 1rem; border-radius:8px; cursor:pointer; font-weight:600; font-size:.9rem;">
            🎁 Coba Gratis 3 Hari (Trial)
          </button>
        </div>

        <div class="device-info-text">
          Device ID: ${getDeviceId()}<br>
          Satu Kode Aktivasi hanya berlaku untuk satu perangkat browser ini.
        </div>

        <div style="text-align:center; margin-top:1rem; font-size:.85rem;">
          <a id="link-to-login" style="color:#1f5d3a; cursor:pointer; text-decoration:none; font-weight:600;">Sudah Memiliki Akun? Login di sini</a>
        </div>
      </div>
    `;

    // Semua akun hasil registrasi aplikasi ini menggunakan role Pengawas.
    // Akun Admin hanya melalui kredensial Admin yang telah ditetapkan.
    // Link "Sudah Memiliki Akun" → ke halaman login
    const linkLogin = document.getElementById('link-to-login');
    if (linkLogin) {
      linkLogin.addEventListener('click', () => {
        // Langsung render login screen tanpa reload
        const oldOverlay = document.getElementById('pkkm-auth-overlay');
        if (oldOverlay) oldOverlay.remove();
        renderLoginScreen();
      });
    }

    // Tombol Trial: LANGSUNG buat akun trial tanpa isi form, auto-login ke Beranda
    document.getElementById('btn-trial').addEventListener('click', () => {
      if (!confirm('Aktifkan akun Trial gratis 5 hari?\n\nAkses penuh semua fitur. Dokumen cetak akan ada watermark "TRIAL".\nSetelah 5 hari, hubungi Pengawas untuk kode aktivasi penuh.')) return;

      // Auto-create trial account — tanpa form, tanpa aktivasi
      const code = TRIAL_CODE;
      const devId = getDeviceId();
      const binding = fnv1aHash(devId + ':' + code);
      const passHash = fnv1aHash('trial123');

      localStorage.setItem(KEY_ACTIVATED, 'true');
      localStorage.setItem(KEY_ACTIVATION_CODE, code);
      localStorage.setItem(KEY_DEVICE_BINDING, binding);
      localStorage.setItem(KEY_USER_ROLE, 'trial');
      localStorage.setItem(KEY_USER_USERNAME, 'trial');
      localStorage.setItem(KEY_USER_PASSWORD_HASH, passHash);
      localStorage.setItem(KEY_USER_FULLNAME, 'Pengguna Trial');
      localStorage.setItem(KEY_USER_MADRASAH, 'Madrasah Trial');
      localStorage.setItem(KEY_TRIAL_START, String(Date.now()));

      // Sync lisensi ke license.js (set tier=trial)
      if (window.LIC && typeof window.LIC.reset === 'function') {
        try { window.LIC.reset(); } catch (e) {}
      }

      // Auto-login — langsung masuk tanpa screen login
      sessionStorage.setItem(KEY_LOGGED_IN, 'true');

      // Pastikan hash kosong = Beranda
      location.hash = '#/';
      location.reload();
    });

    document.getElementById('btn-reg-submit').addEventListener('click', async () => {
      const errEl = document.getElementById('auth-reg-err');
      const code = document.getElementById('reg-code').value.trim();
      const isTrialCode = code.toUpperCase() === TRIAL_CODE;
      const role = isTrialCode ? 'trial' : 'pengawas';
      const username = document.getElementById('reg-username').value.trim().toLowerCase();
      const fullname = document.getElementById('reg-fullname').value.trim();
      const madrasah = 'Pokjawas Jember';
      const password = document.getElementById('reg-password').value;
      const confirm = document.getElementById('reg-confirm').value;

      if (!code || !username || !fullname || !password) {
        errEl.textContent = 'Harap isi semua kolom yang wajib!';
        return;
      }

      if (username.length < 4) {
        errEl.textContent = 'Username minimal 4 karakter!';
        return;
      }

      if (password.length < 6) {
        errEl.textContent = 'Password minimal 6 karakter!';
        return;
      }

      if (password !== confirm) {
        errEl.textContent = 'Konfirmasi password tidak cocok!';
        return;
      }

      // Validasi kode aktivasi (trial atau kode penuh)
      let codeValid = isTrialCode;
      if (!isTrialCode) {
        const v = await verifyActivationCode(code);
        if (v === false) {
          errEl.textContent = 'Kode aktivasi tidak valid! Harap hubungi Admin/Ketua Pokjawas.';
          return;
        }
        if (v === 'used') {
          errEl.textContent = 'Kode aktivasi sudah digunakan di perangkat lain. Hubungi Admin/Ketua Pokjawas.';
          return;
        }
        codeValid = true;
      }

      // Generate Device Binding
      const devId = getDeviceId();
      const binding = fnv1aHash(devId + ':' + code);

      // Simpan User & Status Aktivasi
      const passHash = fnv1aHash(password);
      
      localStorage.setItem(KEY_ACTIVATED, 'true');
      localStorage.setItem(KEY_ACTIVATION_CODE, code);
      localStorage.setItem(KEY_DEVICE_BINDING, binding);
      localStorage.setItem(KEY_USER_ROLE, role);
      localStorage.setItem(KEY_USER_USERNAME, username);
      localStorage.setItem(KEY_USER_PASSWORD_HASH, passHash);
      localStorage.setItem(KEY_USER_FULLNAME, fullname);
      localStorage.setItem(KEY_USER_MADRASAH, madrasah);

      // Sinkronisasi lisensi ke license.js (single source of truth untuk tier)
      // LIC.redeem() handles: master code bypass, Supabase validation + atomic claim, set tier=full
      if (!isTrialCode && window.LIC && typeof window.LIC.redeem === 'function') {
        try {
          const licResult = await window.LIC.redeem(code);
          if (!licResult.ok) {
            // Rollback auth state jika lisensi gagal
            localStorage.setItem(KEY_ACTIVATED, 'false');
            errEl.textContent = licResult.reason || 'Aktivasi lisensi gagal.';
            return;
          }
        } catch (e) {
          console.warn('[register] LIC.redeem failed:', e.message);
        }
      }

      // Report aktivasi ke Supabase (cross-device relay). Best-effort.
      if (!isTrialCode && window.SupabaseSync && typeof window.SupabaseSync.reportActivation === 'function') {
        try {
          await window.SupabaseSync.reportActivation({
            code: code,
            nama: fullname,
            username: username,
            madrasah: madrasah,
            role: role,
            device_id: devId,
            device_info: navigator.userAgent || ''
          });
        } catch (e) {
          console.warn('[register] reportActivation failed:', e.message);
        }
      }

      // Jika trial, simpan timestamp mulai trial
      if (isTrialCode) {
        localStorage.setItem(KEY_TRIAL_START, String(Date.now()));
        alert('Akun Trial berhasil dibuat! Akses penuh 5 hari. Silakan login.');
      } else {
        alert('Aktivasi berhasil! Silakan login menggunakan akun yang baru saja dibuat.');
      }
      location.hash = '#/';
      location.reload();
    });
  }

  // 2. Screen Login Akun (Username + Password)
  function renderLoginScreen() {
    let overlay = document.getElementById('pkkm-auth-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'pkkm-auth-overlay';
      document.body.appendChild(overlay);
    }

    // Isi nama kabupaten/kota dari setting
    let _kabKota = 'Jember';
    try { _kabKota = JSON.parse(localStorage.getItem('pkkm_v1_meta') || '{}').kabupaten_kota || 'Jember'; } catch(e) {}
    const _setRegion = () => overlay.querySelectorAll('.auth-region').forEach(el => el.textContent = _kabKota);
    setTimeout(_setRegion, 0);

    const regName = localStorage.getItem(KEY_USER_FULLNAME) || '';
    const regMad = localStorage.getItem(KEY_USER_MADRASAH) || '';

    overlay.innerHTML = `
      <style>
        #pkkm-auth-overlay {
          position: fixed; inset: 0; z-index: 3000;
          background: linear-gradient(135deg, #1f5d3a 0%, #1e40af 100%);
          display: flex; align-items: center; justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: 1rem;
        }
        .auth-card {
          background: #fff; border-radius: 12px; padding: 2rem;
          width: 100%; max-width: 400px;
          box-shadow: 0 12px 40px rgba(0,0,0,.25);
        }
        .auth-logo {
          text-align: center; margin-bottom: 1.5rem;
        }
        .auth-logo i { font-size: 3rem; color: #1e40af; }
        .auth-logo h2 { margin: 0.5rem 0 0; color: #1e40af; font-size: 1.5rem; font-weight: bold; }
        .auth-logo p { margin: 0; color: #666; font-size: 0.85rem; }
        .form-group { margin-bottom: 1.25rem; }
        .form-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.25rem; color: #333; }
        .form-group input {
          width: 100%; padding: 0.65rem; border: 2px solid #ddd; border-radius: 8px; outline: none; font-size: 1rem;
        }
        .form-group input:focus { border-color: #1e40af; }
        .btn-auth-submit {
          width: 100%; background: #1e40af; color: white; border: 0;
          padding: 0.75rem; border-radius: 8px; font-weight: 600; cursor: pointer;
          font-size: 1rem; transition: background 0.2s;
        }
        .btn-auth-submit:hover { background: #17328c; }
        .auth-err { color: #c0392b; font-size: 0.85rem; min-height: 1.2rem; margin-bottom: 0.5rem; text-align: center; }
        .user-reg-info {
          font-size: 0.8rem; background: #f0f4ff; color: #1e40af; padding: 0.5rem; border-radius: 6px; margin-bottom: 1rem; text-align: center;
        }
      </style>
      <div class="auth-card">
        <div class="auth-logo">
          <i class="bi bi-person-lock"></i>
          <h2>Masuk Aplikasi</h2>
          <p>PKKM Pokjawasmad Kab. <span class="auth-region"></span></p>
        </div>
        <div class="user-reg-info">
          Terdaftar: <strong>${escapeHtml(regName)}</strong> (${escapeHtml(regMad)})
        </div>
        <div class="auth-err" id="auth-login-err"></div>
        
        <div class="form-group">
          <label>Nama Pengguna (Username)</label>
          <input id="login-username" type="text" placeholder="Masukkan username" autocomplete="off" required>
        </div>

        <div class="form-group">
          <label>Password</label>
          <input id="login-password" type="password" placeholder="Masukkan password" autocomplete="off" required>
        </div>

        <button class="btn-auth-submit" id="btn-login-submit">Login Masuk</button>

        ${(localStorage.getItem(KEY_USER_ROLE) === 'trial') ? `
        <div style="text-align:center; margin-top:1rem;">
          <button id="btn-trial-quick-login" type="button" style="width:100%; background:transparent; border:2px solid #1f5d3a; color:#1f5d3a; padding:.65rem; border-radius:8px; cursor:pointer; font-weight:600; font-size:.95rem;">
            🎁 Masuk Akun Trial
          </button>
        </div>
        ` : ''}

        <div style="text-align:center; margin-top:1.25rem; font-size:.85rem;">
          <a id="link-to-aktivasi" style="color:#1e40af; cursor:pointer; text-decoration:none;">Buat Akun Baru / Reset Aktivasi</a>
        </div>
      </div>
    `;

    const inputUser = document.getElementById('login-username');
    const inputPass = document.getElementById('login-password');
    const errEl = document.getElementById('auth-login-err');

    setTimeout(() => inputUser.focus(), 50);

    function tryLogin() {
      const username = inputUser.value.trim().toLowerCase();
      const password = inputPass.value;

      if (!username || !password) {
        errEl.textContent = 'Harap isi semua kolom login!';
        return;
      }

      const storedUser = localStorage.getItem(KEY_USER_USERNAME);
      const storedPassHash = localStorage.getItem(KEY_USER_PASSWORD_HASH);

      // Admin bypass: username='admin', password diverifikasi via SHA-256 (tidak plaintext)
      if (username === 'admin') {
        sha256(password).then(function(hash) {
          if (hash === '1fe822ee3c970bb86b48d7519a9bc25eef1d31fa5267a6cf41892d818eb1ef40') {
            // Admin login — set semua flag, skip aktivasi
            sessionStorage.setItem(KEY_LOGGED_IN, 'true');
            localStorage.setItem(KEY_USER_ROLE, 'admin');
            localStorage.setItem(KEY_USER_USERNAME, 'admin');
            localStorage.setItem(KEY_ACTIVATED, 'true');
            sessionStorage.setItem('pkkm_admin_key', 'pokjawas-admin-license-2026');
            var devId = getDeviceId();
            var code = 'ADMIN-FULL-ACCESS';
            localStorage.setItem(KEY_ACTIVATION_CODE, code);
            localStorage.setItem(KEY_DEVICE_BINDING, fnv1aHash(devId + ':' + code));

            location.hash = '#/';
            overlay.remove();
            init().then(function() { if (window.rebuildShell) window.rebuildShell(); if (window.render) window.render(); });
          } else {
            // Bukan admin password → coba regular login
            if (storedUser === username && fnv1aHash(password) === storedPassHash) {
              doRegularLogin();
            } else {
              errEl.textContent = 'Username atau Password salah!';
            }
          }
        }).catch(function() {
          errEl.textContent = 'Gagal verifikasi. Coba lagi.';
        });
        return;
      }

      // Regular login
      if (username !== storedUser || fnv1aHash(password) !== storedPassHash) {
        errEl.textContent = 'Username atau Password salah!';
        return;
      }

      doRegularLogin();

      function doRegularLogin() {
        sessionStorage.setItem(KEY_LOGGED_IN, 'true');
        location.hash = '#/';
        overlay.remove();
        init().then(() => { if (window.rebuildShell) window.rebuildShell(); if (window.render) window.render(); });
      }
    }

    document.getElementById('btn-login-submit').addEventListener('click', tryLogin);
    inputPass.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); tryLogin(); }
    });

    // Tombol quick-login untuk akun trial (tidak perlu input password)
    const btnTrialLogin = document.getElementById('btn-trial-quick-login');
    if (btnTrialLogin) {
      btnTrialLogin.addEventListener('click', () => {
        sessionStorage.setItem(KEY_LOGGED_IN, 'true');
        location.hash = '#/';
        overlay.remove();
        init().then(() => { if (window.rebuildShell) window.rebuildShell(); if (window.render) window.render(); });
      });
    }

    // Link ke halaman aktivasi (Buat Akun Baru / Reset)
    const linkAktivasi = document.getElementById('link-to-aktivasi');
    if (linkAktivasi) {
      linkAktivasi.addEventListener('click', () => {
        if (!confirm('Pindah ke halaman Aktivasi?\n\nJika Anda membuat akun baru, data akun lama di browser ini akan ditimpa.')) return;
        // Langsung render activation screen tanpa reload
        sessionStorage.removeItem(KEY_LOGGED_IN);
        const oldOverlay = document.getElementById('pkkm-auth-overlay');
        if (oldOverlay) oldOverlay.remove();
        renderActivationScreen();
      });
    }
  }

  // 3. Lock screen: full-page overlay untuk PIN
  function renderLockScreen() {
    let overlay = document.getElementById('pkkm-lock-overlay');
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.id = 'pkkm-lock-overlay';
    overlay.innerHTML = `
      <style>
        #pkkm-lock-overlay {
          position: fixed; inset: 0; z-index: 3000;
          background: linear-gradient(135deg, #1f5d3a 0%, #06a04c 100%);
          display: flex; align-items: center; justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        #pkkm-lock-card {
          background: #fff; border-radius: 12px; padding: 2rem;
          width: 90%; max-width: 360px;
          box-shadow: 0 12px 40px rgba(0,0,0,.25);
          text-align: center;
        }
        #pkkm-lock-card .lock-icon {
          font-size: 3rem; color: #1f5d3a;
          width: 80px; height: 80px; line-height: 80px;
          margin: 0 auto 1rem;
          background: #d6efd9; border-radius: 50%;
        }
        #pkkm-lock-card h2 { margin: 0 0 .25rem; color: #1f5d3a; font-size: 1.4rem; }
        #pkkm-lock-card .subtitle { color: #666; font-size: .9rem; margin-bottom: 1.5rem; }
        #pkkm-lock-card input {
          width: 100%; font-size: 1.6rem; text-align: center; letter-spacing: .8rem;
          padding: .6rem; border: 2px solid #d6efd9; border-radius: 8px;
          margin-bottom: 1rem; outline: none;
        }
        #pkkm-lock-card input:focus { border-color: #1f5d3a; }
        #pkkm-lock-card button.btn-primary {
          width: 100%; background: #1f5d3a; color: white; border: 0;
          padding: .65rem; border-radius: 8px; font-weight: 600; cursor: pointer;
          font-size: 1rem;
        }
        #pkkm-lock-card button.btn-primary:hover { background: #143e26; }
        #pkkm-lock-card .err { color: #c0392b; font-size: .85rem; min-height: 1.2rem; margin-bottom: .5rem; }
        #pkkm-lock-card .footer-link { margin-top: 1rem; font-size: .85rem; }
        #pkkm-lock-card .footer-link a { color: #1f5d3a; text-decoration: none; cursor: pointer; }
        #pkkm-lock-card .footer-link a:hover { text-decoration: underline; }
      </style>
      <div id="pkkm-lock-card">
        <div class="lock-icon"><i class="bi bi-shield-lock"></i></div>
        <h2>Aplikasi Terkunci</h2>
        <div class="subtitle">Masukkan PIN untuk melanjutkan</div>
        <input id="pkkm-pin-input" type="password" inputmode="numeric" pattern="\\d*"
               maxlength="6" autocomplete="off" placeholder="\u2022\u2022\u2022\u2022">
        <div class="err" id="pkkm-pin-err"></div>
        <button class="btn-primary" id="pkkm-pin-submit">Buka Aplikasi</button>
        <div class="footer-link">
          <a id="pkkm-pin-forgot">Lupa PIN?</a>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const input = document.getElementById('pkkm-pin-input');
    const submit = document.getElementById('pkkm-pin-submit');
    const err = document.getElementById('pkkm-pin-err');
    const forgot = document.getElementById('pkkm-pin-forgot');

    setTimeout(() => input.focus(), 50);

    async function tryUnlock() {
      const pin = input.value.trim();
      if (!pin) { err.textContent = 'Masukkan PIN terlebih dahulu.'; return; }
      submit.disabled = true;
      const ok = await verifyPin(pin);
      submit.disabled = false;
      if (!ok) {
        err.textContent = 'PIN salah. Coba lagi.';
        input.value = ''; input.focus();
        return;
      }
      unlock();
      hideLockScreen();
      if (typeof window.render === 'function') window.render();
    }

    submit.addEventListener('click', tryUnlock);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); tryUnlock(); }
    });
    forgot.addEventListener('click', () => {
      const ok = confirm(
        'Tidak ada cara recovery PIN. Pilihan satu-satunya adalah RESET semua data, registrasi akun, dan PIN.\n\n' +
        'PASTIKAN sudah backup data terlebih dahulu.\n\n' +
        'Lanjutkan reset?'
      );
      if (!ok) return;
      const ok2 = confirm('Konfirmasi sekali lagi: HAPUS semua data PKKM dan PIN dari browser ini?');
      if (!ok2) return;
      
      const keys = Object.keys(localStorage).filter(k => k.startsWith('pkkm_v1_'));
      for (const k of keys) localStorage.removeItem(k);
      sessionStorage.clear();
      alert('Semua data PKKM dan PIN sudah dihapus. Halaman akan di-reload.');
      location.reload();
    });
  }

  function hideLockScreen() {
    const o = document.getElementById('pkkm-lock-overlay');
    if (o) o.remove();
  }

  // 4. Initial PIN setup
  function promptInitialPinSetup() {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.id = 'pkkm-pin-setup-overlay';
      overlay.innerHTML = `
        <style>
          #pkkm-pin-setup-overlay {
            position: fixed; inset: 0; z-index: 3000;
            background: rgba(0,0,0,.5);
            display: flex; align-items: center; justify-content: center;
          }
          #pkkm-pin-setup-card {
            background: #fff; border-radius: 12px; padding: 1.75rem;
            width: 92%; max-width: 420px;
            box-shadow: 0 12px 40px rgba(0,0,0,.25);
          }
          #pkkm-pin-setup-card h3 { margin: 0 0 .5rem; color: #1f5d3a; }
          #pkkm-pin-setup-card .desc { color: #555; font-size: .9rem; margin-bottom: 1rem; }
          #pkkm-pin-setup-card label { display: block; font-size: .85rem; font-weight: 600; margin-bottom: .25rem; color: #333; }
          #pkkm-pin-setup-card input {
            width: 100%; font-size: 1.4rem; text-align: center; letter-spacing: .6rem;
            padding: .5rem; border: 2px solid #d6efd9; border-radius: 8px;
            margin-bottom: .9rem; outline: none;
          }
          #pkkm-pin-setup-card input:focus { border-color: #1f5d3a; }
          #pkkm-pin-setup-card .row-btn { display: flex; gap: .5rem; margin-top: .75rem; }
          #pkkm-pin-setup-card button {
            flex: 1; padding: .55rem; border-radius: 8px; font-weight: 600; cursor: pointer; border: 0;
          }
          #pkkm-pin-setup-card .btn-primary { background: #1f5d3a; color: white; }
          #pkkm-pin-setup-card .btn-secondary { background: #e9ecef; color: #333; }
          #pkkm-pin-setup-card .err { color: #c0392b; font-size: .85rem; min-height: 1.1rem; }
        </style>
        <div id="pkkm-pin-setup-card">
          <h3><i class="bi bi-shield-lock"></i> Atur PIN Aplikasi</h3>
          <div class="desc">Lindungi data PKKM dengan PIN 4-6 digit. PIN akan diminta setiap kali aplikasi dibuka.</div>
          <label>PIN baru (4-6 digit)</label>
          <input id="pkkm-pin-new" type="password" inputmode="numeric" pattern="\\d*" maxlength="6" placeholder="\u2022\u2022\u2022\u2022">
          <label>Konfirmasi PIN</label>
          <input id="pkkm-pin-confirm" type="password" inputmode="numeric" pattern="\\d*" maxlength="6" placeholder="\u2022\u2022\u2022\u2022">
          <div class="err" id="pkkm-pin-setup-err"></div>
          <div class="row-btn">
            <button class="btn-secondary" id="pkkm-pin-skip">Nanti Saja</button>
            <button class="btn-primary" id="pkkm-pin-save">Simpan PIN</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      const newInput = document.getElementById('pkkm-pin-new');
      const confirmInput = document.getElementById('pkkm-pin-confirm');
      const err = document.getElementById('pkkm-pin-setup-err');
      const skipBtn = document.getElementById('pkkm-pin-skip');
      const saveBtn = document.getElementById('pkkm-pin-save');

      setTimeout(() => newInput.focus(), 50);

      function close(result) {
        overlay.remove();
        resolve(result);
      }

      saveBtn.addEventListener('click', async () => {
        const a = newInput.value.trim();
        const b = confirmInput.value.trim();
        if (!/^\d{4,6}$/.test(a)) { err.textContent = 'PIN harus 4-6 digit angka.'; return; }
        if (a !== b) { err.textContent = 'Konfirmasi PIN tidak cocok.'; return; }
        try {
          await setPin(a);
          close(true);
        } catch (e) {
          err.textContent = e.message || 'Gagal menyimpan PIN.';
        }
      });
      skipBtn.addEventListener('click', () => close(false));
      [newInput, confirmInput].forEach(el => {
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); saveBtn.click(); }
        });
      });
    });
  }

  // Settings view for PIN
  function viewPengaturanPIN(view) {
    const isSet = isPinSet();
    const info = getUserInfo();
    view.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h4 class="mb-0"><i class="bi bi-shield-lock"></i> Pengaturan Akun & PIN</h4>
    </div>
    <div class="row g-3">
      <div class="col-lg-6">
        <div class="card h-100">
          <div class="card-header"><i class="bi bi-person-badge"></i> Profil Pengguna</div>
          <div class="card-body">
            <table class="table table-sm table-borderless">
              <tr><td><strong>Nama Lengkap:</strong></td><td>${escapeHtml(info.fullname)}</td></tr>
              <tr><td><strong>Peran (Role):</strong></td><td><span class="badge bg-primary text-uppercase">${escapeHtml(info.role)}</span></td></tr>
              <tr><td><strong>Madrasah:</strong></td><td>${escapeHtml(info.madrasah)}</td></tr>
              <tr><td><strong>Device ID:</strong></td><td><code class="small">${escapeHtml(info.deviceId)}</code></td></tr>
            </table>
          </div>
        </div>
      </div>
      <div class="col-lg-6">
        <div class="card h-100">
          <div class="card-header"><i class="bi bi-gear"></i> Keamanan PIN</div>
          <div class="card-body">
            <p class="mb-2"><strong>PIN aktif:</strong> ${isSet ? '<span class="text-success">Ya, PIN terpasang.</span>' : '<span class="text-muted">Belum diatur.</span>'}</p>
            <p class="small text-muted mb-3">${isSet
              ? 'Aplikasi terkunci saat dibuka di tab baru.'
              : 'Aktifkan PIN untuk pengamanan ekstra.'}</p>
            ${isSet ? `
              <button id="btn-change-pin" class="btn btn-sm btn-primary w-100 mb-2"><i class="bi bi-key"></i> Ganti PIN</button>
              <button id="btn-remove-pin" class="btn btn-sm btn-outline-danger w-100"><i class="bi bi-shield-slash"></i> Hapus PIN</button>
            ` : `
              <button id="btn-set-pin" class="btn btn-sm btn-success w-100"><i class="bi bi-shield-plus"></i> Aktifkan PIN</button>
            `}
          </div>
        </div>
      </div>
    </div>
    <div class="alert alert-warning mt-3 small">
      <i class="bi bi-exclamation-triangle"></i> <strong>Penting:</strong> Tidak ada cara recovery PIN.
      Jika lupa PIN, harus reset data. Selalu lakukan backup berkala.
    </div>`;

    // --- Trial Upgrade Section ---
    if (isTrial()) {
      const daysLeft = getTrialDaysLeft();
      const expired = isTrialExpired();
      const trialHTML = `
      <div class="card mt-3 ${expired ? 'border-danger' : 'border-warning'}">
        <div class="card-header ${expired ? 'bg-danger text-white' : 'bg-warning'}">
          <i class="bi bi-clock-history"></i> Status Trial
        </div>
        <div class="card-body">
          ${expired
            ? '<p class="text-danger mb-3"><strong>⏰ Masa trial telah berakhir.</strong> Data Anda tetap tersimpan. Input kode aktivasi penuh untuk melanjutkan.</p>'
            : `<p class="mb-3">Sisa masa trial: <strong class="text-warning">${daysLeft} hari</strong>. Dokumen yang dicetak/ekspor memiliki watermark "TRIAL".</p>`}
          <div class="mb-2">
            <label class="form-label small fw-bold">Kode Aktivasi Penuh (FULL-XXXX / PPKM-KBC-XXXX)</label>
            <input id="trial-upgrade-input" type="text" class="form-control" placeholder="Masukkan kode dari Pengawas" style="text-transform:uppercase;" autocomplete="off">
          </div>
          <div id="trial-upgrade-msg" class="small text-danger mb-2" style="min-height:1.2rem;"></div>
          <button id="btn-trial-upgrade" class="btn btn-success w-100"><i class="bi bi-key-fill"></i> Upgrade ke Lisensi Penuh</button>
        </div>
      </div>`;
      view.insertAdjacentHTML('beforeend', trialHTML);
      document.getElementById('btn-trial-upgrade').addEventListener('click', async () => {
        const code = document.getElementById('trial-upgrade-input').value.trim();
        const msgEl = document.getElementById('trial-upgrade-msg');
        if (!code) { msgEl.textContent = 'Masukkan kode aktivasi penuh!'; return; }
        const result = await upgradeFromTrial(code);
        if (result.ok) {
          alert(result.msg + ' Halaman akan di-reload.');
          location.reload();
        } else {
          msgEl.textContent = result.msg;
        }
      });
    }

    if (isSet) {
      document.getElementById('btn-change-pin').addEventListener('click', async () => {
        const old = prompt('Masukkan PIN saat ini untuk verifikasi:');
        if (!old) return;
        const ok = await verifyPin(old.trim());
        if (!ok) { alert('PIN saat ini salah.'); return; }
        const ok2 = await promptInitialPinSetup();
        if (ok2) alert('PIN berhasil diganti.');
      });
      document.getElementById('btn-remove-pin').addEventListener('click', async () => {
        const old = prompt('Masukkan PIN saat ini untuk verifikasi:');
        if (!old) return;
        const ok = await verifyPin(old.trim());
        if (!ok) { alert('PIN salah.'); return; }
        if (!confirm('Hapus PIN?')) return;
        clearPin();
        alert('PIN dihapus.');
        if (typeof window.render === 'function') window.render();
      });
    } else {
      document.getElementById('btn-set-pin').addEventListener('click', async () => {
        const ok = await promptInitialPinSetup();
        if (ok) {
          alert('PIN berhasil diaktifkan.');
          if (typeof window.render === 'function') window.render();
        }
      });
    }
  }

  // --- KELOLA KODE AKTIVASI ---
  const KEY_ACTIVATION_CODES_LIST = 'pkkm_v1_activation_codes_list';

  function listActivationCodes() {
    try {
      const raw = localStorage.getItem(KEY_ACTIVATION_CODES_LIST);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveActivationCodes(list) {
    localStorage.setItem(KEY_ACTIVATION_CODES_LIST, JSON.stringify(list));
  }

  function addActivationCode(notes) {
    const list = listActivationCodes();
    const code = generateActivationCode();
    const newEntry = {
      code,
      notes: notes || '',
      status: 'Active',
      deviceId: null,
      fullname: '',
      madrasah: '',
      dateCreated: new Date().toLocaleString(),
      dateUsed: null
    };
    list.unshift(newEntry);
    saveActivationCodes(list);
    return newEntry;
  }

  function deleteActivationCode(code) {
    let list = listActivationCodes();
    list = list.filter(item => item.code !== code);
    saveActivationCodes(list);
  }

  async function syncActivationCodeFromBackup(backupJson) {
    if (!backupJson || !backupJson.sender || !backupJson.sender.activationCode) return;
    const sender = backupJson.sender;
    const list = listActivationCodes();
    const targetCode = sender.activationCode.trim().toUpperCase();
    
    let item = list.find(x => x.code === targetCode);
    if (!item) {
      if (await verifyActivationCode(targetCode)) {
        item = {
          code: targetCode,
          notes: 'Terdeteksi via Impor Backup',
          status: 'Used',
          deviceId: sender.deviceId,
          fullname: sender.fullname,
          madrasah: sender.madrasah,
          dateCreated: '-',
          dateUsed: backupJson.exported_at ? new Date(backupJson.exported_at).toLocaleString() : new Date().toLocaleString()
        };
        list.push(item);
      }
    } else {
      item.status = 'Used';
      item.deviceId = sender.deviceId;
      item.fullname = sender.fullname;
      item.madrasah = sender.madrasah;
      item.dateUsed = backupJson.exported_at ? new Date(backupJson.exported_at).toLocaleString() : new Date().toLocaleString();
    }
    saveActivationCodes(list);
  }

  // 4. Screen Trial Expired — blokir akses, minta kode aktivasi penuh
  function renderTrialExpiredScreen() {
    let overlay = document.getElementById('pkkm-auth-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'pkkm-auth-overlay';
      document.body.appendChild(overlay);
    }

    // Isi nama kabupaten/kota dari setting
    let _kabKota = 'Jember';
    try { _kabKota = JSON.parse(localStorage.getItem('pkkm_v1_meta') || '{}').kabupaten_kota || 'Jember'; } catch(e) {}
    const _setRegion = () => overlay.querySelectorAll('.auth-region').forEach(el => el.textContent = _kabKota);
    setTimeout(_setRegion, 0);

    overlay.innerHTML = `
      <style>
        #pkkm-auth-overlay {
          position: fixed; inset: 0; z-index: 3000;
          background: linear-gradient(135deg, #c0392b 0%, #1f5d3a 100%);
          display: flex; align-items: center; justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: 1rem; overflow-y: auto;
        }
        .auth-card {
          background: #fff; border-radius: 12px; padding: 2rem;
          width: 100%; max-width: 460px;
          box-shadow: 0 12px 40px rgba(0,0,0,.25);
        }
        .auth-logo { text-align: center; margin-bottom: 1.5rem; }
        .auth-logo i { font-size: 3rem; color: #c0392b; }
        .auth-logo h2 { margin: 0.5rem 0 0; color: #c0392b; font-size: 1.4rem; font-weight: bold; }
        .auth-logo p { margin: 0; color: #666; font-size: 0.85rem; }
        .auth-err { color: #c0392b; font-size: 0.85rem; min-height: 1.2rem; margin-bottom: 0.5rem; text-align: center; }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.25rem; color: #333; }
        .form-group input {
          width: 100%; padding: 0.6rem; border: 2px solid #ddd; border-radius: 8px; outline: none; font-size: 0.95rem;
        }
        .form-group input:focus { border-color: #1f5d3a; }
        .btn-auth-submit {
          width: 100%; background: #1f5d3a; color: white; border: 0;
          padding: 0.75rem; border-radius: 8px; font-weight: 600; cursor: pointer;
          font-size: 1rem; margin-top: 0.5rem; transition: background 0.2s;
        }
        .btn-auth-submit:hover { background: #143e26; }
        .trial-warning {
          background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px;
          padding: 1rem; text-align: center; margin-bottom: 1rem; font-size: 0.9rem; color: #856404;
        }
      </style>
      <div class="auth-card">
        <div class="auth-logo">
          <i class="bi bi-clock-history"></i>
          <h2>Masa Trial Berakhir</h2>
          <p>PKKM Pokjawasmad Kab. <span class="auth-region"></span></p>
        </div>
        <div class="trial-warning">
          <strong>⏰ Masa trial 5 hari telah berakhir.</strong><br>
          Data Anda tetap tersimpan dan tidak hilang.<br>
          Hubungi Pengawas untuk mendapatkan Kode Aktivasi Penuh.
        </div>
        <div class="auth-err" id="auth-trial-err"></div>
        <div class="form-group">
          <label>Kode Aktivasi Penuh (FULL-XXXX / PPKM-KBC-XXXX)</label>
          <input id="trial-upgrade-code" type="text" placeholder="Masukkan kode dari Pengawas" autocomplete="off" style="text-transform: uppercase;">
        </div>
        <button class="btn-auth-submit" id="btn-trial-upgrade">Aktivasi Lisensi Penuh</button>
        <div style="text-align:center; margin-top:1rem;">
          <button id="btn-trial-logout" style="background:transparent; border:0; color:#888; cursor:pointer; font-size:.85rem;">Keluar / Reset</button>
        </div>
      </div>
    `;

    document.getElementById('btn-trial-upgrade').addEventListener('click', async () => {
      const errEl = document.getElementById('auth-trial-err');
      const code = document.getElementById('trial-upgrade-code').value.trim();
      if (!code) { errEl.textContent = 'Masukkan kode aktivasi penuh!'; return; }
      const result = await upgradeFromTrial(code);
      if (result.ok) {
        alert(result.msg + ' Halaman akan di-reload.');
        location.reload();
      } else {
        errEl.textContent = result.msg;
      }
    });

    document.getElementById('btn-trial-logout').addEventListener('click', () => {
      if (!confirm('Reset semua data PKKM di browser ini? Data trial akan dihapus.')) return;
      const keys = Object.keys(localStorage).filter(k => k.startsWith('pkkm_v1_'));
      for (const k of keys) localStorage.removeItem(k);
      sessionStorage.clear();
      location.reload();
    });
  }

  // --- INITIALIZATION ---
  async function init() {
    // 0. Coba tarik codes.json dari gh-pages di background sejak awal boot.
    // Kalau berhasil, window.REMOTE_CODES akan dipakai verifyActivationCode()
    // untuk validasi kode lintas device.
    if (window.GithubSync && typeof window.GithubSync.refreshFromPublic === 'function') {
      try {
        await window.GithubSync.refreshFromPublic();
      } catch (e) {
        console.warn('[init] refreshFromPublic failed:', e.message);
      }
    }

    // 0. Kalau diminta ke halaman aktivasi (dari link 'Buat Akun Baru')
    const forceActivation = localStorage.getItem('pkkm_v1_force_activation') === 'true';
    if (forceActivation) {
      localStorage.removeItem('pkkm_v1_force_activation');
      renderActivationScreen();
      return new Promise(() => {});
    }

    // 0a. Migration: sinkronisasi license.js dengan auth state
    // User yang sudah aktivasi (KEY_ACTIVATED=true, role != trial) tapi license.js masih trial → fix
    if (window.LIC && typeof window.LIC.getStatus === 'function' && typeof window.LIC.redeem === 'function') {
      var licStatus = window.LIC.getStatus();
      var authActivated = localStorage.getItem(KEY_ACTIVATED) === 'true';
      var authRole = localStorage.getItem(KEY_USER_ROLE);
      var authCode = localStorage.getItem(KEY_ACTIVATION_CODE);
      if (authActivated && authRole !== 'trial' && authCode && licStatus.tier !== 'full') {
        // User sudah aktivasi di auth tapi license.js belum full → sync
        try { await window.LIC.redeem(authCode); } catch (e) { console.warn('[init] license migration failed:', e.message); }
      }
    }

    // 0b. Kalau sudah punya akun terdaftar tapi belum aktivasi di device ini → langsung ke login
    const hasAccount = localStorage.getItem(KEY_USER_USERNAME);
    const skipActivation = localStorage.getItem('pkkm_v1_skip_activation') === 'true';
    if (skipActivation || hasAccount) {
      localStorage.removeItem('pkkm_v1_skip_activation');
      if (!isLoggedIn()) {
        renderLoginScreen();
        return new Promise(() => {});
      }
    }

    // 1. Cek Aktivasi — admin skip (sudah set via bypass login)
    const isAdminLogin = localStorage.getItem(KEY_USER_ROLE) === 'admin' && localStorage.getItem(KEY_USER_USERNAME) === 'admin';
    if (!isAdminLogin && !isActivated()) {
      renderActivationScreen();
      return new Promise(() => {}); // Gated forever
    }

    // 1b. Cek Trial Expired — blokir akses
    if (isTrialExpired()) {
      renderTrialExpiredScreen();
      return new Promise(() => {});
    }

    // 2. Cek Login
    if (!isLoggedIn()) {
      renderLoginScreen();
      return new Promise(() => {}); // Gated forever
    }

    // 3. Cek PIN Lock
    if (isPinSet() && !isUnlocked()) {
      renderLockScreen();
      return new Promise((resolve) => {
        const check = setInterval(() => {
          if (isUnlocked() || !isPinSet()) {
            clearInterval(check);
            resolve();
          }
        }, 200);
      });
    }

    // Lolos semua gate
    const overlay = document.getElementById('pkkm-auth-overlay');
    if (overlay) overlay.remove();

    // Tampilkan tombol logout di navbar
    const btnNavLogout = document.getElementById('btnNavLogout');
    if (btnNavLogout) {
      btnNavLogout.style.display = '';
      btnNavLogout.onclick = function () {
        if (confirm('Keluar dari aplikasi? Layar akan terkunci.')) {
          logout();
        }
      };
    }
  }

  function logout() {
    sessionStorage.removeItem(KEY_LOGGED_IN);
    lock();
    location.reload();
  }

  // Expose ke global
  window.PKKMAuth = {
    setPin, verifyPin, isPinSet, clearPin,
    isUnlocked, unlock, lock,
    init, logout,
    isActivated, isLoggedIn, getUserInfo,
    generateActivationCode, verifyActivationCode,
    viewPengaturanPIN,
    escapeHtml,
    TRIAL_CODE,
    isTrial, isTrialExpired, getTrialDaysLeft, upgradeFromTrial,
    listActivationCodes,
    saveActivationCodes,
    addActivationCode,
    deleteActivationCode,
    syncActivationCodeFromBackup
  };

  // Auto boot sequence
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
