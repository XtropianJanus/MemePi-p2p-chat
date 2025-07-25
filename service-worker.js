const CACHE_NAME = 'memepi-chat-v3'; // Incremented cache version
const urlsToCache = [
    './', // Caches the root (index.html)
    './index.html',
    './images/memepi-logo.png',
    './images/memepi-logo-192.png',
    './images/memepi-logo-512.png',
    'https://cdn.ethers.io/lib/ethers-5.7.umd.min.js',
    'https://cdn.jsdelivr.net/npm/gun/gun.js',
    'https://cdn.jsdelivr.net/npm/gun/lib/not.js',
    'https://cdn.jsdelivr.net/npm/gun/lib/webrtc.js',
    'https://cdn.jsdelivr.net/npm/gun/sea.js',
    'https://cdn.jsdelivr.net/npm/gun-indexeddb/gun-indexeddb.js'
];

// Install event: Caches all essential assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event: Serve cached content when offline, or fetch from network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                // No cache hit - fetch from network
                return fetch(event.request);
            })
    );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
