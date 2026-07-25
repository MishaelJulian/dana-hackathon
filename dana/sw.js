/**
 * sw.js — Dana Service Worker
 * Offline-first: caches all static assets, serves from cache when offline
 * ZIM files are large and loaded separately via fetch (not cached in SW)
 */

const CACHE_NAME = 'dana-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/main.css',
  '/css/rtl.css',
  '/css/eink.css',
  '/css/palace.css',
  '/src/core/app.js',
  '/src/core/router.js',
  '/src/features/reading/reader.js',
  '/src/features/reading/eink.js',
  '/src/features/reading/reading-screen.js',
  '/src/features/jester/jester.js',
  '/src/features/garden/garden.js',
  '/src/features/hashtiyeh/hashtiyeh.js',
  '/src/features/hashtiyeh/hashtiyeh-ui.js',
  '/src/features/onboarding/onboarding.js',
  '/src/features/onboarding/onboarding-ui.js',
  '/src/features/transfer/transfer.js',
  '/src/features/palace/palace.js',
  '/node_modules/three/build/three.module.js',
];

// Install: cache all static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for static assets, network-first for ZIM files
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // ZIM files: network-first (large, not cached in SW)
  if (url.pathname.endsWith('.zim')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful ZIM fetches for offline access
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Google Fonts: cache-first with network fallback
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Don't cache failed responses or non-GET
        if (!response.ok) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      });
    })
  );
});
