import { startOfMonth, endOfMonth, isWithinInterval, startOfWeek, endOfWeek, format, isSameDay, isSameMonth } from 'date-fns';
import { type Employee, type WorkLog } from '../types';

/**
 * 특정 월의 급여 정보를 상세 계산합니다.
 * 주휴수당 계산 로직이 포함되어 있습니다.
 */
export interface PayDetail {
    originalPay: number; // 기본 급여 (세전, 주휴 제외)
    holidayAllowance: number; // 주휴수당
    totalBeforeTax: number; // 세전 총액 (기본급 + 주휴)
    taxAmount: number; // 공제액 (원단위 절사)
    finalPay: number; // 실수령액 (세후)

    // 주휴수당 상세 정보 (주차별)
    weeklyDetails: WeeklyDetail[];

    // NEW: 상세 근무 시간 및 수당 내역
    totalWorkHours?: number; // 총 근무 시간
    totalNightWorkHours?: number; // 총 야간 근무 시간
    basePay?: number; // 야간 할증 제외한 순수 기본급
    nightPay?: number; // 야간 할증 수당 (추가된 0.5배분)

    // 가불 내역
    totalAdvances: number; // 총 가불 금액
    netPay: number; // 최종 지급액 (실수령액 - 가불)
}

export interface WeeklyDetail {
    weekRange: string; // 예: "1월 1주 (1.1 ~ 1.7)"
    workHours: number; // 주간 총 근무시간
    hasHolidayAllowance: boolean; // 주휴수당 발생 여부
    allowanceAmount: number; // 발생한 주휴수당 금액
}

export function calculatePay(
    employee: Employee,
    logs: WorkLog[],
    targetDate: Date = new Date()
): PayDetail {
    const monthStart = startOfMonth(targetDate);
    const monthEnd = endOfMonth(targetDate);

    // 1. 이번 달 근무 기록 필터링
    const monthLogs = logs.filter(log => {
        const logDate = new Date(log.date);
        return isWithinInterval(logDate, { start: monthStart, end: monthEnd }) && log.employeeId === employee.id;
    });

    // 2. 기본 급여 및 시간 계산
    let originalPay = 0;

    // 상세 내역 집계 변수
    let totalWorkHours = 0;
    let totalNightWorkHours = 0;
    let basePayAmount = 0; // 기본 시급에 해당하는 금액 (주간 + 야간의 1.0배)
    let nightPayAmount = 0; // 야간 수당 (야간의 0.5배)

    monthLogs.forEach(log => {
        // 스냅샷이 있으면 스냅샷의 시급/금액 사용, 없으면 현재 직원 정보 사용
        const hourlyRate = log.snapshot?.hourlyRate ?? employee.amount;

        if (employee.paymentType === 'HOURLY') {
            const hours = log.hours || 0;
            totalWorkHours += hours;

            if (log.isNightShift) {
                totalNightWorkHours += hours;
                // 야간: 1.5배 (기본 1.0 + 할증 0.5)
                basePayAmount += hours * hourlyRate;
                nightPayAmount += hours * hourlyRate * 0.5;
                originalPay += hours * hourlyRate * 1.5;
            } else {
                basePayAmount += hours * hourlyRate;
                originalPay += hours * hourlyRate;
            }
        } else if (employee.paymentType === 'DAILY') {
            originalPay += hourlyRate;
            basePayAmount += hourlyRate;
            // 일당제는 시간 집계가 애매하므로 count 1로 취급하거나 hours 미반영
        } else if (employee.paymentType === 'PER_TASK') {
            originalPay += (log.count || 1) * hourlyRate;
            basePayAmount += (log.count || 1) * hourlyRate;
        }
    });

    // 3. 주휴수당 계산 (시급제이면서 설정이 켜져있는 경우만)
    let holidayAllowance = 0;
    const weeklyDetails: WeeklyDetail[] = [];

    if (employee.paymentType === 'HOURLY' && employee.applyHolidayAllowance) {
        // ... (주간 계산 로직)
        // 주의: 주휴수당 계산 시의 '시급'은 현재 직원 설정값(통상임금)을 따르는 것이 보편적이나,
        // 데이터 무결성을 위해선 해당 주의 '주된 시급'을 써야 함.
        // 여기서는 복잡도를 낮추기 위해, 스냅샷이 있다면 '최근 로그의 시급'을 쓰거나, 
        // 그냥 employee.amount(현재 시급)를 사용하여 주휴수당을 계산함.
        // (주휴수당은 미래에 시급이 올라도 과거 것이 변하면 안 되는데...)
        // TODO: 주휴수당용 시급 결정 로직 고도화 필요. 일단은 employee.amount 유지.

        const weeks: { start: Date; end: Date }[] = [];
        let currentIterDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endOfIterDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

        while (currentIterDate <= endOfIterDate) {
            weeks.push({
                start: currentIterDate,
                end: currentIterDate
            });
            currentIterDate = new Date(currentIterDate.setDate(currentIterDate.getDate() + 7));
        }

        weeks.forEach((weekStartObj) => {
            const weekStart = weekStartObj.start;
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

            // 이 주간의 근무 로그 찾기
            const weekLogs = logs.filter(log => {
                const d = new Date(log.date);
                return isSameDay(d, weekStart) || isSameDay(d, weekEnd) || isWithinInterval(d, { start: weekStart, end: weekEnd });
            }).filter(log => log.employeeId === employee.id);

            const weeklyHours = weekLogs.reduce((acc, log) => acc + (log.hours || 0), 0);

            let allowance = 0;
            let hasAllowance = false;

            if (weeklyHours >= 15) {
                hasAllowance = true;
                const calcHours = Math.min(weeklyHours, 40);
                allowance = (calcHours / 40) * 8 * employee.amount; // TODO: 스냅샷 시급 반영 고려
            }

            const weekSunday = weekEnd;
            const isWeekBelongToThisMonth = isSameMonth(weekSunday, targetDate);

            if (isWeekBelongToThisMonth) {
                holidayAllowance += allowance;

                if (weeklyHours > 0) {
                    weeklyDetails.push({
                        weekRange: `${format(weekStart, 'M.d')}~${format(weekEnd, 'M.d')}`,
                        workHours: weeklyHours,
                        hasHolidayAllowance: hasAllowance,
                        allowanceAmount: allowance
                    });
                }
            }
        });
    }

    const totalBeforeTax = originalPay + holidayAllowance;

    // 세금 계산
    // 월별 세율 적용: 해당 월의 마지막 로그에 담긴 스냅샷 세율을 우선 사용 (과거 기록 보존)
    // 로그가 없으면 현재 직원 설정 세율 사용
    let appliedTaxRate = employee.taxRate || 0;
    if (monthLogs.length > 0) {
        // 날짜순 정렬 후 마지막 로그 확인
        const sortedLogs = [...monthLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const lastLog = sortedLogs[sortedLogs.length - 1];
        if (lastLog.snapshot?.taxRate !== undefined) {
            appliedTaxRate = lastLog.snapshot.taxRate;
        }
    }

    const taxAmount = Math.floor((totalBeforeTax * (appliedTaxRate / 100)) / 10) * 10; // 1원 단위 절사
    const finalPay = totalBeforeTax - taxAmount;

    // 4. 가불 계산 (NEW)
    // 이번 달에 해당하는 가불 내역만 합산
    const targetAdvances = employee.advances?.filter(adv => {
        const advDate = new Date(adv.date);
        return isWithinInterval(advDate, { start: monthStart, end: monthEnd });
    }) || [];

    const totalAdvances = targetAdvances.reduce((acc, adv) => acc + adv.amount, 0);
    const netPay = finalPay - totalAdvances;

    return {
        originalPay,
        holidayAllowance,
        totalBeforeTax,
        taxAmount,
        finalPay,
        weeklyDetails,
        // 상세 내역
        totalWorkHours,
        totalNightWorkHours,
        basePay: basePayAmount,
        nightPay: nightPayAmount,
        // 가불
        totalAdvances,
        netPay
    };
}
