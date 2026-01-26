const CACHE_NAME = 'today-pay-v6';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json'
];

// Install: 캐시 초기화 및 자원 캐싱 + 즉시 대기열 건너뛰기
self.addEventListener('install', (event) => {
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch: 요청 가로채기 및 캐시 반환 (SPA Fallback Strategy)
self.addEventListener('fetch', (event) => {
    // 1. Navigation Request (HTML 페이지 요청) -> index.html 반환
    if (event.request.mode === 'navigate') {
        event.respondWith(
            caches.match('./index.html')
                .then((response) => {
                    return response || fetch(event.request).catch(() => {
                        // 오프라인이거나 네트워크 실패 시 캐시된 index.html 반환 (이미 위에서 체크하지만 안전장치)
                        return caches.match('./index.html');
                    });
                })
        );
        return;
    }

    // 2. Static Assets (이미지, JS, CSS 등) -> Cache First
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                return response || fetch(event.request);
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
