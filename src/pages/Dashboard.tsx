import { useMemo, useState } from 'react';
import { startOfMonth, endOfMonth, isWithinInterval, format, startOfYear, endOfYear } from 'date-fns';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { type Employee, type WorkLog } from '../types';
import { formatCurrency } from '../utils/format';
import { getBankCode } from '../utils/banks';
import { calculatePay, type WeeklyDetail, type PayDetail } from '../utils/pay';
import { Send, Lock, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '../components/ui/Button';
import { cn } from '../utils/cn';
import { useDateFilter } from '../contexts/DateFilterContext';

import { useBusiness } from '../contexts/BusinessContext';

export default function Dashboard() {
    const { currentBusinessId } = useBusiness();
    const [allEmployees] = useLocalStorage<Employee[]>('employees', []);
    const [allWorkLogs, setAllWorkLogs] = useLocalStorage<WorkLog[]>('workLogs', []);

    // Filter by Current Business
    const employees = allEmployees.filter(e => e.businessId === currentBusinessId);
    const workLogs = allWorkLogs.filter(l => l.businessId === currentBusinessId);

    const { year, month } = useDateFilter();

    // UI State for expanding Base Pay details
    const [expandedBasePayItems, setExpandedBasePayItems] = useState<Set<string>>(new Set());

    const toggleBasePay = (id: string) => {
        setExpandedBasePayItems(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // UI State for expanding Holiday Allowance details
    const [expandedHolidayPayItems, setExpandedHolidayPayItems] = useState<Set<string>>(new Set());

    const toggleHolidayPay = (id: string) => {
        setExpandedHolidayPayItems(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Calculate pay
    const employeePayMap = useMemo(() => {
        // Determine date range based on filter
        let start: Date, end: Date;

        if (month === 'ALL') {
            const date = new Date(year, 0, 1);
            start = startOfYear(date);
            end = endOfYear(date);
        } else {
            const date = new Date(year, month - 1, 1);
            start = startOfMonth(date);
            end = endOfMonth(date);
        }

        const filteredLogs = workLogs.filter(log => {
            const logDate = new Date(log.date);
            return isWithinInterval(logDate, { start, end });
        });

        const payMap: Record<string, number> = {};

        // Simple estimation for sorting
        filteredLogs.forEach(log => {
            // 중요: 현재 소속(employees)이 아니라 전체 직원(allEmployees)에서 찾아야 함
            const emp = allEmployees.find(e => e.id === log.employeeId);
            if (!emp) return;

            let pay = 0;
            // 스냅샷 반영된 추정치 계산
            const hourlyRate = log.snapshot?.hourlyRate ?? emp.amount;

            if (emp.paymentType === 'HOURLY') {
                let rate = hourlyRate;
                if (log.isNightShift) rate *= 1.5;
                pay = (log.hours || 0) * rate;
            } else if (emp.paymentType === 'DAILY') {
                pay = hourlyRate;
            } else if (emp.paymentType === 'PER_TASK') {
                pay = (log.count || 1) * hourlyRate;
            }
            payMap[log.employeeId] = (payMap[log.employeeId] || 0) + pay;
        });

        return payMap;
    }, [workLogs, allEmployees, employees, year, month]); // employees 의존성은 유지 (타 지점 비교용)

    const totalPay = Object.values(employeePayMap).reduce((a, b) => a + b, 0);

    // 표시할 직원 목록: 현재 소속 직원 + (현재 소속은 아니지만 급여 내역이 있는 직원)
    const displayedEmployees = useMemo(() => {
        const payExistIds = Object.keys(employeePayMap);
        const uniqueSet = new Set([...employees.map(e => e.id), ...payExistIds]);

        return Array.from(uniqueSet).map(id => allEmployees.find(e => e.id === id)).filter((e): e is Employee => !!e);
    }, [employees, employeePayMap, allEmployees]);

    const handleTransfer = (emp: Employee, amount: number) => {
        if (amount <= 0) {
            alert('지급할 급여가 없습니다.');
            return;
        }

        const bankCode = getBankCode(emp.bankName);
        if (!bankCode) {
            alert('지원하지 않는 은행 이름입니다. 정확한 은행명을 입력해주세요 (예: 국민, 토스, 신한)');
            return;
        }

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
            const tossUrl = `supertoss://send?bankCode=${bankCode}&accountNo=${emp.accountNumber}&amount=${amount}&originAuth=Y`;
            window.location.href = tossUrl;
        } else {
            alert(`[PC 시뮬레이션]\n\n토스 앱으로 연결합니다.\n----------------\n받는분: ${emp.name}\n은행: ${emp.bankName} (${bankCode})\n계좌: ${emp.accountNumber}\n금액: ${formatCurrency(amount)}원`);
        }
    };

    const sortedEmployees = [...displayedEmployees].sort((a, b) => {
        const payA = employeePayMap[a.id] || 0;
        const payB = employeePayMap[b.id] || 0;
        return payB - payA; // Higher pay first
    });

    // 타겟 날짜 (계산 로직 전달용, 월간 조회 시 사용)
    const targetDate = useMemo(() => {
        if (month === 'ALL') return new Date(year, 0, 1);
        return new Date(year, month - 1, 1);
    }, [year, month]);

    const handleCompletePayment = (emp: Employee) => {
        if (month === 'ALL') return;

        if (!window.confirm(`${month}월 급여 지급을 완료처리 하시겠습니까?\n\n완료 후에는 해당 월의 근무 기록을 수정하거나 삭제할 수 없습니다.`)) {
            return;
        }

        const start = startOfMonth(targetDate);
        const end = endOfMonth(targetDate);

        setAllWorkLogs(prev => prev.map(log => {
            const logDate = new Date(log.date);
            if (
                log.employeeId === emp.id &&
                isWithinInterval(logDate, { start, end })
            ) {
                return { ...log, isLocked: true };
            }
            return log;
        }));
    };

    const isMonthLocked = (empId: string) => {
        if (month === 'ALL') return false;

        const start = startOfMonth(targetDate);
        const end = endOfMonth(targetDate);

        const targetLogs = workLogs.filter(log => {
            return log.employeeId === empId && isWithinInterval(new Date(log.date), { start, end });
        });

        if (targetLogs.length === 0) return false;
        return targetLogs.every(log => log.isLocked);
    };

    const dateLabel = month === 'ALL'
        ? `${year}년 전체`
        : `${year}년 ${month}월`;

    return (
        <div className="p-5 pb-24 space-y-6">
            {/* Header / Summary Card */}
            <div className="bg-white rounded-3xl p-6 shadow-toss border border-gray-100/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <div className="w-32 h-32 bg-teal-500 rounded-full blur-3xl" />
                </div>
                <h2 className="text-gray-500 font-medium text-sm mb-1 relative z-10">
                    {dateLabel} 지급 예상 급여
                </h2>
                <div className="flex items-baseline gap-1 relative z-10">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                        {formatCurrency(totalPay)}
                    </h1>
                    <span className="text-xl font-medium text-gray-400">원</span>
                </div>
            </div>

            {/* Pay List */}
            <div className="space-y-4">
                <div className="flex justify-between items-center px-1 pt-2">
                    <h3 className="font-bold text-lg text-gray-800">직원별 급여</h3>
                    {month !== 'ALL' && (
                        <span className="text-xs font-medium text-primary bg-teal-50 px-2.5 py-1 rounded-full">
                            {format(startOfMonth(targetDate), 'M.d')} ~ {format(endOfMonth(targetDate), 'd')}
                        </span>
                    )}
                </div>

                {sortedEmployees.length === 0 ? (
                    <div className="text-center py-16 bg-white/50 rounded-3xl border border-dashed border-gray-300">
                        <p className="text-gray-400 font-medium">등록된 직원이 없습니다.</p>
                    </div>
                ) : (
                    sortedEmployees.map((emp) => {
                        let payDetail: PayDetail;

                        if (month === 'ALL') {
                            // 연간 합산 로직
                            let totalOriginal = 0;
                            let totalHoliday = 0;
                            let totalTax = 0;
                            let totalFinal = 0;
                            let totalBase = 0;
                            let totalNight = 0;
                            let totalHours = 0;
                            let totalNightHours = 0;

                            // 1월부터 12월까지 순회하여 합산
                            for (let m = 0; m < 12; m++) {
                                const d = new Date(year, m, 1);
                                const monthly = calculatePay(emp, workLogs, d);
                                totalOriginal += monthly.originalPay;
                                totalHoliday += monthly.holidayAllowance;
                                totalTax += monthly.taxAmount;
                                totalFinal += monthly.finalPay;
                                totalBase += monthly.basePay || 0;
                                totalNight += monthly.nightPay || 0;
                                totalHours += monthly.totalWorkHours || 0;
                                totalNightHours += monthly.totalNightWorkHours || 0;
                            }

                            payDetail = {
                                originalPay: totalOriginal,
                                holidayAllowance: totalHoliday,
                                totalBeforeTax: totalOriginal + totalHoliday,
                                taxAmount: totalTax,
                                finalPay: totalFinal,
                                weeklyDetails: [], // 연간 뷰에선 상세 주휴 내역 생략
                                basePay: totalBase,
                                nightPay: totalNight,
                                totalWorkHours: totalHours,
                                totalNightWorkHours: totalNightHours
                            };
                        } else {
                            // 월간 조회
                            payDetail = calculatePay(emp, workLogs, targetDate);
                        }

                        const { originalPay, holidayAllowance, taxAmount, finalPay, weeklyDetails, basePay, nightPay, totalWorkHours, totalNightWorkHours } = payDetail;
                        const taxRate = emp.taxRate || 0;

                        // 타지점/퇴사 여부 확인
                        const isOtherBusiness = emp.businessId !== currentBusinessId;

                        return (
                            <div key={emp.id} className={cn(
                                "bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-100 flex flex-col gap-5 transition-all hover:shadow-md",
                                (emp.isRetired || isOtherBusiness) && "opacity-80 bg-gray-50/50"
                            )}>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shadow-inner",
                                            emp.isRetired ? "bg-gray-200 text-gray-400" : "bg-teal-50 text-primary"
                                        )}>
                                            {emp.name[0]}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                                {emp.name}
                                                {emp.isRetired && <span className="text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded font-medium">퇴사</span>}
                                                {isOtherBusiness && !emp.isRetired && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium border border-gray-200">타지점</span>}
                                                {holidayAllowance > 0 && (
                                                    <span className="text-[10px] bg-teal-50 text-primary px-1.5 py-0.5 rounded font-bold">
                                                        주휴포함
                                                    </span>
                                                )}
                                            </h4>
                                            <p className="text-xs text-gray-400 font-medium mt-0.5">{emp.bankName} {emp.accountNumber}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-bold text-xl text-gray-900 tracking-tight whitespace-nowrap">{formatCurrency(finalPay)}원</p>
                                        <p className="text-xs text-gray-400 font-medium mt-0.5 whitespace-nowrap">실수령액</p>
                                    </div>
                                </div>

                                {/* Pay Details Accordion / Summary */}
                                <div className="bg-gray-50 rounded-2xl p-5 space-y-4 text-base border border-gray-100/50">
                                    {/* 1. Basic Pay */}
                                    {/* 1. Basic Pay & Work Hours Summary */}
                                    <div className="space-y-1">
                                        <div
                                            className={cn(
                                                "flex justify-between items-center text-gray-600 font-medium transition-colors p-1 -m-1 rounded-lg",
                                                (totalNightWorkHours || 0) > 0 ? "cursor-pointer hover:bg-gray-100" : ""
                                            )}
                                            onClick={() => (totalNightWorkHours || 0) > 0 && toggleBasePay(emp.id)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>기본 급여</span>
                                                {(totalNightWorkHours || 0) > 0 && (
                                                    expandedBasePayItems.has(emp.id)
                                                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                                                        : <ChevronDown className="w-4 h-4 text-gray-400" />
                                                )}
                                            </div>
                                            <span className="text-gray-900 font-bold text-lg">{formatCurrency(originalPay)}원</span>
                                        </div>

                                        {/* Total Work Hours Summary */}
                                        {(totalWorkHours || 0) > 0 && (
                                            <div className="text-xs text-gray-400 font-medium px-1">
                                                총 {Number(totalWorkHours?.toFixed(1))}시간
                                                <span className="text-gray-300 mx-1">|</span>
                                                (주간 {Number(((totalWorkHours || 0) - (totalNightWorkHours || 0)).toFixed(1))}h / 야간 {Number(totalNightWorkHours?.toFixed(1))}h)
                                            </div>
                                        )}

                                        {/* Detailed Breakdown (Accordion) */}
                                        {expandedBasePayItems.has(emp.id) && (totalNightWorkHours || 0) > 0 && (
                                            <div className="pl-3 border-l-2 border-teal-100 space-y-1.5 py-1 my-2 text-xs text-gray-500 animate-in fade-in slide-in-from-top-1 duration-200">
                                                {/* Daytime */}
                                                <div className="flex justify-between">
                                                    <span>
                                                        주간 {Number(((totalWorkHours || 0) - (totalNightWorkHours || 0)).toFixed(1))}시간
                                                        x {formatCurrency(emp.amount)}원
                                                    </span>
                                                    <span>
                                                        {formatCurrency((basePay || 0) - ((nightPay || 0) * 2))}원
                                                    </span>
                                                </div>
                                                {/* Nighttime */}
                                                <div className="flex justify-between text-orange-600 font-medium">
                                                    <span>
                                                        야간 {Number(totalNightWorkHours?.toFixed(1))}시간
                                                        x {formatCurrency(emp.amount)}원 x 1.5
                                                    </span>
                                                    <span>
                                                        {formatCurrency((nightPay || 0) * 3)}원
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* 2. Holiday Allowance */}
                                    {emp.applyHolidayAllowance && (
                                        <div className="space-y-1">
                                            <div
                                                className={cn(
                                                    "flex justify-between items-center text-gray-600 font-medium transition-colors p-1 -m-1 rounded-lg",
                                                    weeklyDetails.length > 0 && month !== 'ALL' ? "cursor-pointer hover:bg-gray-100" : ""
                                                )}
                                                onClick={() => weeklyDetails.length > 0 && month !== 'ALL' && toggleHolidayPay(emp.id)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span>주휴수당</span>
                                                    {weeklyDetails.length > 0 && month !== 'ALL' && (
                                                        expandedHolidayPayItems.has(emp.id)
                                                            ? <ChevronUp className="w-4 h-4 text-gray-400" />
                                                            : <ChevronDown className="w-4 h-4 text-gray-400" />
                                                    )}
                                                    {weeklyDetails.length > 0 && (
                                                        <span className="text-xs bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-md">
                                                            {month === 'ALL' ? '연간 합산' : `${weeklyDetails.length}주`}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-primary font-bold text-lg">+{formatCurrency(holidayAllowance)}원</span>
                                            </div>

                                            {/* Weekly Holiday Details (Accordion) - Hide in Annual View */}
                                            {month !== 'ALL' && holidayAllowance > 0 && expandedHolidayPayItems.has(emp.id) && (
                                                <div className="pl-3 border-l-2 border-teal-100 space-y-1.5 py-1 my-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                                    {weeklyDetails.map((week: WeeklyDetail, idx: number) => (
                                                        <div key={idx} className="flex justify-between text-xs text-gray-500">
                                                            <span>{week.weekRange} ({week.workHours}h)</span>
                                                            <span>{week.hasHolidayAllowance ? `+${formatCurrency(week.allowanceAmount)}` : '-'}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 3. Tax */}
                                    {taxAmount > 0 && (
                                        <>
                                            <div className="h-px bg-gray-200/60 my-2" />
                                            <div className="flex justify-between items-center text-gray-600 font-medium">
                                                <span>세금 공제 ({taxRate}%)</span>
                                                <span className="text-red-500 font-bold text-lg">-{formatCurrency(taxAmount)}원</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    {month !== 'ALL' && finalPay > 0 && (
                                        <Button
                                            onClick={() => handleCompletePayment(emp)}
                                            disabled={isMonthLocked(emp.id)}
                                            variant="secondary"
                                            className={cn(
                                                "flex-1 py-3.5 border-transparent bg-gray-100 hover:bg-gray-200 text-gray-600 shadow-none",
                                                isMonthLocked(emp.id) && "bg-gray-200 text-gray-400 cursor-not-allowed"
                                            )}
                                        >
                                            {isMonthLocked(emp.id) ? (
                                                <>
                                                    <Lock className="w-5 h-5" />
                                                    지급 완료됨
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="w-5 h-5" />
                                                    지급 완료
                                                </>
                                            )}
                                        </Button>
                                    )}
                                    <Button
                                        onClick={() => handleTransfer(emp, finalPay)}
                                        disabled={finalPay <= 0}
                                        className={cn(
                                            "flex-[2] py-3.5 shadow-lg shadow-teal-500/20 text-lg",
                                            finalPay <= 0 ? "bg-gray-100 text-gray-400 shadow-none" : "bg-primary text-white"
                                        )}
                                    >
                                        <Send className="w-5 h-5" />
                                        {finalPay > 0 ? '송금하기' : '지급액 없음'}
                                    </Button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
