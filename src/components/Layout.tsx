import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Settings } from 'lucide-react';
import { cn } from '../utils/cn';
import DateNavigator from './common/DateNavigator';

import BusinessSwitcher from './layout/BusinessSwitcher';

export default function Layout() {
    const location = useLocation();

    // 헤더에 날짜 선택기 표시할 경로
    const showDateNavigator = ['/', '/calendar'].includes(location.pathname);

    const navItems = [
        { path: '/', label: '홈', icon: LayoutDashboard },
        { path: '/calendar', label: '근무', icon: Calendar },
        { path: '/employees', label: '직원', icon: Users },
        { path: '/settings', label: '설정', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-gray-100 flex justify-center">
            {/* Mobile container */}
            <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col">
                {/* Header Area */}
                <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 flex justify-between items-center h-[73px]">
                    <BusinessSwitcher />
                    {showDateNavigator && <DateNavigator />}
                </div>

                {/* Content area */}
                <main className="flex-1 overflow-y-auto pb-[150px]">
                    <Outlet />
                </main>

                {/* Bottom Navigation (Floating) */}
                <nav className="fixed bottom-6 left-5 right-5 z-50 bg-white/90 backdrop-blur-md shadow-float rounded-[2rem] border border-white/20 pb-1">
                    <div className="flex justify-around items-center h-[80px] px-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className="flex-1 flex flex-col items-center justify-center h-full group"
                                >
                                    <div className={cn(
                                        "p-1.5 rounded-2xl transition-all duration-300 relative",
                                        isActive ? "text-primary -translate-y-1" : "text-gray-400 group-hover:text-gray-600"
                                    )}>
                                        <Icon className={cn("w-8 h-8 transition-all", isActive && "fill-current")} strokeWidth={isActive ? 0 : 2} />
                                    </div>
                                    <span className={cn(
                                        "text-sm font-bold transition-all duration-300 mt-1",
                                        isActive ? "text-primary opacity-100" : "text-gray-400 opacity-0 h-0 overflow-hidden"
                                    )}>
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            </div>
        </div>
    );
}
