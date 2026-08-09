/**
 * sw.js — Dana Service Worker
 * Offline-first: caches all static assets, serves from cache when offline
 * ZIM files are large and loaded separately via fetch (not cached in SW)
 */

const CACHE_NAME = 'dana-v3';
// Precache only paths stable across dev and a Vite production build (build
// output hashes JS chunk filenames, so they can't be hardcoded here). JS/CSS
// module chunks still end up offline-capable: the generic fetch handler
// below caches every same-origin GET the first time it's fetched online, and
// a normal app visit fetches every chunk it needs before the user ever goes
// offline. ponytail: relies on cache-on-first-visit rather than a build-time
// manifest plugin (e.g. vite-plugin-pwa) — upgrade to that if precache needs
// to survive without a full first visit.
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/main.css',
  '/css/rtl.css',
  '/css/eink.css',
  '/css/palace.css',
  '/css/fonts.css',
  '/fonts/Vazirmatn-Regular.ttf',
  '/fonts/Vazirmatn-Medium.ttf',
  '/fonts/Vazirmatn-Bold.ttf',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
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

  // Skip Vite dev server requests (HMR, dep optimization, etc.)
  if (url.searchParams.has('v') || url.pathname.includes('/.vite/')) {
    return;
  }

  // Skip chrome-extension and other non-http schemes
  if (!url.protocol.startsWith('http')) return;

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

  // Static assets (incl. self-hosted fonts): cache-first
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
