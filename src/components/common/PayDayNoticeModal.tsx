import { useState, useEffect } from 'react';
import type { Employee } from '../../types';
import { X, Calendar, CreditCard, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

interface PayDayNoticeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDontShowToday: () => void;
    dDayEmployees: Employee[];
    dMinusOneEmployees: Employee[];
}

export default function PayDayNoticeModal({
    isOpen,
    onClose,
    onDontShowToday,
    dDayEmployees,
    dMinusOneEmployees
}: PayDayNoticeModalProps) {
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAnimate(true);
        } else {
            setAnimate(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const totalCount = dDayEmployees.length + dMinusOneEmployees.length;

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
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-4">
                        {dDayEmployees.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-teal-600 flex items-center gap-1.5 uppercase tracking-wider">
                                    <Calendar className="w-4 h-4" />
                                    오늘 월급 ({dDayEmployees.length}명)
                                </h3>
                                {dDayEmployees.map(emp => (
                                    <div key={emp.id} className="flex items-center justify-between p-3.5 bg-teal-50/50 rounded-2xl border border-teal-100/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold shadow-sm">
                                                {emp.name[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{emp.name}</p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <CreditCard className="w-3 h-3" />
                                                    {emp.bankName}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="block font-bold text-teal-600 text-sm">
                                                {formatCurrency(emp.amount)}원
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-medium bg-white px-1.5 py-0.5 rounded border border-gray-100 inline-block mt-0.5">
                                                {emp.paymentType === 'HOURLY' ? '시급' : emp.paymentType === 'DAILY' ? '일당' : '건별'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {dMinusOneEmployees.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-amber-600 flex items-center gap-1.5 uppercase tracking-wider mt-2">
                                    <Calendar className="w-4 h-4" />
                                    내일 월급 ({dMinusOneEmployees.length}명)
                                </h3>
                                {dMinusOneEmployees.map(emp => (
                                    <div key={emp.id} className="flex items-center justify-between p-3.5 bg-amber-50/50 rounded-2xl border border-amber-100/50 opacity-80">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shadow-sm">
                                                {emp.name[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{emp.name}</p>
                                                <p className="text-xs text-gray-500">D-1</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="block font-bold text-gray-600 text-sm">
                                                준비중
                                            </span>
                                        </div>
                                    </div>
                                ))}
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
