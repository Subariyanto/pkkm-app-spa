// sw.js - Service worker for PKKM SPA
// Strategy: network-first for app code, cache-first for static assets.
const CACHE_VERSION = 'pkkm-v1-2026-05-27-r3';

const NETWORK_FIRST = [
  'index.html',
  'app.js',
  'db.js',
  'tools.js',
  'instrumen.js',
  'style.css',
  'manifest.json',
];

const PRECACHE = [
  './',
  './index.html',
  './style.css',
  './instrumen.js',
  './db.js',
  './tools.js',
  './app.js',
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

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET') return;

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
