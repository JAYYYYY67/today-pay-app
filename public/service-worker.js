const CACHE_NAME = 'today-pay-v2';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json'
];

// Install: 캐시 초기화 및 자원 캐싱
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch: 요청 가로채기 및 캐시 반환 (Cache First Strategy)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // 캐시에 있으면 반환
                if (response) {
                    return response;
                }
                // 없으면 네트워크 요청
                return fetch(event.request);
            })
    );
});

// Activate: 오래된 캐시 정리
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
