// sw.js - Service worker for PKKM SPA
// Strategy: network-first for app code, cache-first for static assets.
const CACHE_VERSION = 'pkkm-v56-2026-11-02-salin-tanpa-nomor';

// Berkas INTI (kode aplikasi) TIDAK boleh pernah diambil dari cache.
// Sejarah: service worker sempat menyajikan admin-license.js versi lama
// berhari-hari walau file di server sudah baru, sehingga perbaikan tidak
// pernah sampai ke pengguna. Untuk berkas di daftar ini kita selalu
// langsung ke jaringan dan tidak menyimpan salinan.
const NO_CACHE = [
  'index.html',
  'app.js',
  'auth.js',
  'admin-license.js',
  'supabaseSync.js',
  'cloudSync.js',
  'license.js',
  'db.js',
  'tools.js',
  'sw.js',
];

const NETWORK_FIRST = [
  'index.html',
  'app.js',
  'db.js',
  'tools.js',
  'instrumen.js',
  'instrumen-ra.js',
  'instrumen-mi-v3.js',
  'instrumen_pdf.js',
  'excel_export.js',
  'laporan_lengkap.js',
  'supabaseSync.js',
  'cloudSync.js',
  'license.js',
  'admin-license.js',
  'rekap_kabupaten.js',
  'style.css',
  'manifest.json',
];

const PRECACHE = [
  './',
  './index.html',
  './style.css',
  './instrumen.js',
  './instrumen-ra.js',
  './instrumen-mi-v3.js',
  './instrumen_pdf.js',
  './db.js',
  './tools.js',
  './excel_export.js',
  './laporan_lengkap.js',
  './rekap_kabupaten.js',
  './app.js',
  './cloudSync.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(
    caches.open(CACHE_VERSION).then(cache =>
      Promise.all(PRECACHE.map(url =>
        cache.add(url).catch(err => console.warn('Cache skip:', url, err.message))
      ))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then(clients => clients.forEach(c => c.postMessage({ type: 'SW_UPDATED' })))
  );
});

function isAppCode(url) {
  const u = new URL(url);
  if (u.origin !== self.location.origin) return false;
  return NETWORK_FIRST.some(name => u.pathname.endsWith('/' + name) || u.pathname === '/' || u.pathname.endsWith('pkkm-app-spa/'));
}

function isNoCache(url) {
  const u = new URL(url);
  if (u.origin !== self.location.origin) return false;
  if (u.pathname === '/' || u.pathname.endsWith('/pkkm-app-spa/')) return true;
  return NO_CACHE.some(name => u.pathname.endsWith('/' + name) || u.pathname.endsWith(name));
}

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET') return;

  // --- Berkas inti: selalu jaringan, cache hanya sebagai jaring darurat ---
  if (isNoCache(req.url)) {
    ev.respondWith(
      fetch(req, { cache: 'no-store' }).then(res => res).catch(() => caches.match(req).then(c => c || Response.error()))
    );
    return;
  }

  if (isAppCode(req.url)) {
    ev.respondWith(
      fetch(req).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(req, clone)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  ev.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(req, clone)).catch(() => {});
        }
        return res;
      }).catch(() => cached);
    })
  );
});
