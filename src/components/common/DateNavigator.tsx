import { useState, useEffect } from 'react';
import { useDateFilter } from '../../contexts/DateFilterContext';
import { cn } from '../../utils/cn';
import { ChevronDown, Check } from 'lucide-react';

export default function DateNavigator() {
    const { year, month, setYear, setMonth } = useDateFilter();
    const [openYear, setOpenYear] = useState(false);
    const [openMonth, setOpenMonth] = useState(false);

    // Generate years dynamically (current year - 3 to current year + 3)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);

    // Generate months (1-12)
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    // Close dropdowns on outside click (simple backdrop strategy)
    useEffect(() => {
        const close = () => {
            setOpenYear(false);
            setOpenMonth(false);
        };
        if (openYear || openMonth) {
            window.addEventListener('click', close);
        }
        return () => window.removeEventListener('click', close);
    }, [openYear, openMonth]);

    return (
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100 shadow-sm relative z-30" onClick={e => e.stopPropagation()}>
            {/* Year Selector */}
            <div className="relative">
                <button
                    onClick={() => {
                        setOpenYear(!openYear);
                        setOpenMonth(false);
                    }}
                    className="flex items-center gap-1 bg-gray-50 text-gray-700 font-bold py-1.5 px-3 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                >
                    {year}년
                    <ChevronDown className={cn("w-4 h-4 transition-transform", openYear && "rotate-180")} />
                </button>

                {openYear && (
                    <div className="absolute top-full left-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100 z-50">
                        <div className="max-h-[300px] overflow-y-auto">
                            {years.map(y => (
                                <button
                                    key={y}
                                    onClick={() => {
                                        setYear(y);
                                        setOpenYear(false);
                                    }}
                                    className={cn(
                                        "w-full text-left px-4 py-2 text-sm font-medium flex items-center justify-between",
                                        year === y ? "bg-primary/5 text-primary" : "text-gray-600 hover:bg-gray-50"
                                    )}
                                >
                                    {y}년
                                    {year === y && <Check className="w-4 h-4" />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="h-6 w-px bg-gray-200" />

            {/* Month Selector */}
            <div className="relative">
                <button
                    onClick={() => {
                        setOpenMonth(!openMonth);
                        setOpenYear(false);
                    }}
                    className={cn(
                        "flex items-center gap-1 font-bold py-1.5 px-3 rounded-lg text-sm transition-colors min-w-[100px] justify-between",
                        month === 'ALL' ? "bg-primary text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    )}
                >
                    {month === 'ALL' ? '전체 (연간)' : `${month}월`}
                    <ChevronDown className={cn("w-4 h-4 transition-transform", openMonth && "rotate-180")} />
                </button>

                {openMonth && (
                    <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100 z-50">
                        <div className="max-h-[300px] overflow-y-auto">
                            <button
                                onClick={() => {
                                    setMonth('ALL');
                                    setOpenMonth(false);
                                }}
                                className={cn(
                                    "w-full text-left px-4 py-3 text-sm font-bold border-b border-gray-50 flex items-center justify-between",
                                    month === 'ALL' ? "text-primary bg-primary/5" : "text-gray-600 hover:bg-gray-50"
                                )}
                            >
                                전체 (연간)
                                {month === 'ALL' && <Check className="w-4 h-4" />}
                            </button>

                            {months.map(m => (
                                <button
                                    key={m}
                                    onClick={() => {
                                        setMonth(m);
                                        setOpenMonth(false);
                                    }}
                                    className={cn(
                                        "w-full text-left px-4 py-2 text-sm font-medium flex items-center justify-between",
                                        month === m ? "bg-primary/5 text-primary" : "text-gray-600 hover:bg-gray-50"
                                    )}
                                >
                                    {m}월
                                    {month === m && <Check className="w-4 h-4" />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Backdrop for mobile to ensure closing on outside touch */}
            {(openYear || openMonth) && (
                <div className="fixed inset-0 z-40 bg-transparent" />
            )}
        </div>
    );
}
