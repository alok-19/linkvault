const CACHE_NAME = 'linkvault-v2';
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      self.skipWaiting();
    })
  );
});

// Activate: clean up only OLD caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch: NEVER cache API requests or navigation pages
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests: bypass cache entirely
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Navigation requests: always fetch from network
  if (request.mode === 'navigate') {
    return;
  }

  // Static assets: cache first, network fallback
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            event.waitUntil(
              caches.open(CACHE_NAME).then((cache) => {
                return cache.put(request, clone);
              })
            );
          }
          return response;
        })
        .catch(() => {
          throw new Error('Network request failed');
        });
    })
  );
});
