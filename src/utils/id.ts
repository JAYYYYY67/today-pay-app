/**
 * 고유 ID를 생성합니다.
 * crypto.randomUUID가 없는 환경(일부 모바일 브라우저, 비보안 컨텍스트)을 위해
 * Date.now()와 Math.random()을 조합하여 대체 구현합니다.
 */
export function generateId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    // Fallback for environments where crypto.randomUUID is not available
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
