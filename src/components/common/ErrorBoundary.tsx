import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = async () => {
        if (window.confirm('모든 데이터와 캐시를 초기화하고 앱을 새로고침 하시겠습니까? (서버가 없으므로 저장된 데이터는 사라질 수 있습니다)')) {
            try {
                // 1. Service Worker 해제
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const registration of registrations) {
                        await registration.unregister();
                    }
                }

                // 2. Cache Techologies 삭제
                if ('caches' in window) {
                    const keys = await caches.keys();
                    await Promise.all(keys.map(key => caches.delete(key)));
                }

                // 3. LocalStorage 삭제 (데이터 보호를 위해 선택적으로 할 수도 있지만, 치명적 에러라면 삭제가 안전)
                // 사용자가 백업을 안 했다면 데이터가 날아가므로 신중해야 함.
                // 일단은 캐시 문제일 가능성이 높으므로 localStorage는 남기고 reload만 해볼 수도 있지만,
                // 사용자가 "초기화"를 원한다면 다 지우는 게 맞음.
                // 여기서는 캐시만 지우고 리로드하는 'Soft Reset'과 완전 초기화 'Hard Reset'을 구분하면 좋겠지만
                // 일단은 localStorage는 놔두고 캐시만 날려보자. (데이터 보존 우선)
                // -> 아니야, 흰 화면이면 데이터 구조 문제일 수도 있어.

                // 전략: 일단 캐시만 지우고 리로드. 그래도 안 되면 사용자가 설정 -> 초기화 해야 함.
                // 하지만 흰 화면이라 설정 진입 불가.
                // 버튼을 두 개 만들자. [캐시만 삭제(새로고침)] / [데이터 완전 초기화]

                // 심플하게: "앱 복구 시도 (캐시 삭제)" -> localStorage 유지.
            } catch (e) {
                console.error('Reset failed:', e);
            } finally {
                window.location.href = '/';
            }
        }
    };

    private handleHardReset = () => {
        if (window.confirm('정말 모든 데이터를 삭제하시겠습니까? 복구할 수 없습니다.')) {
            localStorage.clear();
            this.handleReset();
        }
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                    <div className="bg-white p-8 rounded-[2rem] shadow-xl max-w-md w-full text-center space-y-6 border border-gray-100">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500 mb-4">
                            <AlertTriangle className="w-10 h-10" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">오류가 발생했습니다</h1>
                            <p className="text-gray-500 text-sm break-words leading-relaxed">
                                앱을 실행하는 도중 예기치 못한 문제가 발생했습니다.<br />
                                하단의 버튼을 눌러 앱을 복구해보세요.
                            </p>
                            {this.state.error && (
                                <div className="mt-4 p-3 bg-gray-100 rounded-xl text-left overflow-auto max-h-32">
                                    <p className="text-xs text-red-500 font-mono break-all">
                                        {this.state.error.toString()}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3 pt-4">
                            <button
                                onClick={this.handleReset}
                                className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-teal-700 transition-shadow shadow-lg shadow-teal-200 flex items-center justify-center gap-2"
                            >
                                <RotateCcw className="w-5 h-5" />
                                앱 새로고침 (데이터 유지)
                            </button>

                            <button
                                onClick={this.handleHardReset}
                                className="w-full py-4 bg-white border border-gray-200 text-gray-500 rounded-2xl font-bold hover:bg-gray-50 transition-colors text-sm"
                            >
                                데이터 완전 초기화 및 복구
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
