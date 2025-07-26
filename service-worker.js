const CACHE_NAME = 'memepi-chat-cache-v1.2'; // Increment version for new deployments
const ASSETS_TO_CACHE = [
  './index.html',
  './manifest.json',
  './images/memepi-logo.png',
  './images/memepi-logo-192.png',
  './images/memepi-logo-512.png',
  // Note: CDN scripts (ethers.js, gun.js) will be cached dynamically on first fetch
];

// 1. Install Event: Cache app shell assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch((error) => {
        console.error('[Service Worker] Caching failed:', error);
      })
  );
  self.skipWaiting(); // Force the new service worker to activate immediately
});

// 2. Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control of un-controlled clients (pages)
});

// 3. Fetch Event: Serve from cache, then network (stale-while-revalidate for dynamic/CDN assets)
self.addEventListener('fetch', (event) => {
  // Only handle GET requests for navigation and assets
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Cache hit - return cached response
          if (response) {
            console.log('[Service Worker] Serving from cache:', event.request.url);
            // In the background, fetch the latest version and update cache
            fetch(event.request).then(networkResponse => {
              if (networkResponse && networkResponse.ok) {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(event.request, responseClone);
                  console.log('[Service Worker] Updated cache for:', event.request.url);
                });
              }
            }).catch(error => {
              console.warn('[Service Worker] Background fetch failed for:', event.request.url, error);
            });
            return response;
          }

          // Cache miss - fetch from network
          console.log('[Service Worker] Fetching from network:', event.request.url);
          return fetch(event.request)
            .then((networkResponse) => {
              // Only cache valid responses (not opaque responses or errors)
              if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic' || networkResponse.type === 'opaque') {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, responseClone);
                  console.log('[Service Worker] Cached new asset:', event.request.url);
                });
              }
              return networkResponse;
            })
            .catch((error) => {
              console.error('[Service Worker] Network fetch failed:', event.request.url, error);
              // Fallback for when both cache and network fail (e.g., offline)
              // You could return an offline page here if you had one
              // For now, just re-throw or return a generic error response
              return new Response('<h1>Offline</h1><p>The application is offline and the requested content is not available in cache.</p>', {
                headers: { 'Content-Type': 'text/html' }
              });
            });
        })
    );
  }
});
