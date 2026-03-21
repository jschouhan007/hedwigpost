const CACHE_NAME = 'HedwigPost-v2';
const OFFLINE_URL = '/offline.html';
const PRECACHE_URLS = [
    '/',
    '/css/style.css',
    '/js/app.js',
    '/favicon.png',
    '/img/logo.png',
    '/offline.html'
];

// Install - precache core assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(PRECACHE_URLS);
        }).then(() => self.skipWaiting())
    );
});

// Activate - clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch - network first, cache fallback
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    // Skip API requests and admin panel
    if (event.request.url.includes('/api/') || event.request.url.includes('/admin/')) return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Cache successful responses
                if (response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(event.request).then(cached => {
                    if (cached) return cached;
                    // If navigating and nothing cached, show offline page
                    if (event.request.mode === 'navigate') {
                        return caches.match(OFFLINE_URL);
                    }
                    return new Response('', { status: 503, statusText: 'Offline' });
                });
            })
    );
});
