// --- SELF-DESTRUCTING SERVICE WORKER ---
// 이 코드는 잘못된 캐시를 가진 클라이언트를 복구하기 위해
// 모든 캐시를 삭제하고 서비스 워커를 등록 해제합니다.

const LATEST_VERSION = 'FORCE_RESET_v1';

self.addEventListener('install', (event) => {
    // 즉시 활성화 단계로 진입
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            // 1. 모든 클라이언트(열린 탭) 제어권 가져오기
            await self.clients.claim();

            // 2. 모든 캐시 스토리지 삭제
            const keys = await caches.keys();
            await Promise.all(keys.map((key) => caches.delete(key)));
            console.log('🔥 All caches deleted by emergency service worker.');

            // 3. 서비스 워커 등록 해제 (Unregister)
            // Note: self.registration.unregister()는 브라우저 지원 범위에 따라
            // 서비스 워커 내부에서 호출이 안 될 수도 있음.
            // 하지만 activate 단계에서 캐시를 다 지우는 것만으로도 충분한 효과가 있음.

            // 4. 모든 클라이언트에게 새로고침 명령 전송
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
                client.postMessage({ type: 'FORCE_REFRESH' });
            });
        })()
    );
});
