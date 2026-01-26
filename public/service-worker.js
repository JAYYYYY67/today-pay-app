const CACHE_NAME = 'today-pay-v3';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json'
];

// Install: 캐시 초기화 및 자원 캐싱 + 즉시 대기열 건너뛰기
self.addEventListener('install', (event) => {
    // 즉시 활성화 (대기 상태 너뛰기)
    self.skipWaiting();

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
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// Activate: 오래된 캐시 정리 + 즉시 클라이언트 제어
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];

    // 즉시 페이지 제어권 가져오기 (새로고침 없이 갱신)
    event.waitUntil(clients.claim());

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
