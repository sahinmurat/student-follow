const CACHE_NAME = 'soru-takip-v4';
const urlsToCache = [
    '/',
    '/login',
    '/signup',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
    // Sadece http/https isteklerini işle (chrome-extension vb. hariç)
    if (!event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Network başarılı ise
                // Yanıt geçerli mi kontrol et
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // Yanıtı klonla ve cache'e at (bir sonraki offline kullanım için)
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                    .then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                return response;
            })
            .catch(() => {
                // Network başarısız ise (offline) cache'den dön
                return caches.match(event.request);
            })
    );
});
