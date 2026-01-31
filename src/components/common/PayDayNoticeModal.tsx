import { useState, useEffect } from 'react';
import type { Employee, WorkLog } from '../../types';
import { X, Calendar, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import { calculatePay } from '../../utils/pay';

interface PayDayNoticeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDontShowToday: () => void;
    dDayEmployees: Employee[];
    dMinusOneEmployees: Employee[];
    workLogs: WorkLog[];
}

export default function PayDayNoticeModal({
    isOpen,
    onClose,
    onDontShowToday,
    dDayEmployees,
    dMinusOneEmployees,
    workLogs
}: PayDayNoticeModalProps) {
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAnimate(true);
            // Prevent background scrolling
            document.body.style.overflow = 'hidden';
        } else {
            setAnimate(false);
            // Restore background scrolling
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const totalCount = dDayEmployees.length + dMinusOneEmployees.length;
    const now = new Date();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className={`bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden transform transition-all duration-500 ease-out ${animate ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}`}
            >
                {/* Header */}
                <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-6 pt-8 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-md shadow-lg ring-4 ring-white/10">
                            <span className="text-4xl">💰</span>
                        </div>
                        <h2 className="text-2xl font-bold mb-1">드디어 월급날!</h2>
                        <p className="text-teal-100 font-medium opacity-90">
                            총 {totalCount}명의 급여를 챙겨주세요
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-4 overscroll-contain">
                        {dDayEmployees.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-teal-600 flex items-center gap-1.5 uppercase tracking-wider">
                                    <Calendar className="w-4 h-4" />
                                    오늘 월급 ({dDayEmployees.length}명)
                                </h3>
                                {dDayEmployees.map(emp => {
                                    const payDetail = calculatePay(emp, workLogs, now);
                                    return (
                                        <div key={emp.id} className="flex items-center justify-between p-4 bg-teal-50/50 rounded-2xl border border-teal-100/50">
                                            <p className="font-bold text-gray-900 text-lg">{emp.name}</p>
                                            <p className="font-bold text-teal-600 text-lg">
                                                {formatCurrency(payDetail.finalPay)}원
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {dMinusOneEmployees.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-amber-600 flex items-center gap-1.5 uppercase tracking-wider mt-2">
                                    <Calendar className="w-4 h-4" />
                                    내일 월급 ({dMinusOneEmployees.length}명)
                                </h3>
                                {dMinusOneEmployees.map(emp => {
                                    const payDetail = calculatePay(emp, workLogs, now);
                                    return (
                                        <div key={emp.id} className="flex items-center justify-between p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50 opacity-80">
                                            <p className="font-bold text-gray-900 text-lg">{emp.name}</p>
                                            <p className="font-bold text-amber-600 text-lg">
                                                {formatCurrency(payDetail.finalPay)}원
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col gap-2">
                    <button
                        onClick={onClose}
                        className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-teal-200/50 active:scale-[0.98]"
                    >
                        확인했습니다
                    </button>
                    <button
                        onClick={onDontShowToday}
                        className="w-full py-3 text-sm text-gray-400 font-medium hover:text-gray-600 transition-colors flex items-center justify-center gap-1"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        오늘 하루 그만 보기
                    </button>
                </div>
            </div>
        </div>
    );
}
