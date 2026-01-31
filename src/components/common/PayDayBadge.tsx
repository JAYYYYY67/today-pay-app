import { useMemo } from 'react';
import { differenceInCalendarDays, endOfMonth, getDate, setDate, addMonths } from 'date-fns';
import { cn } from '../../utils/cn';

interface PayDayBadgeProps {
    payDay?: number;
    className?: string;
}

export default function PayDayBadge({ payDay, className }: PayDayBadgeProps) {
    const { dDay, label, colorClass } = useMemo(() => {
        if (!payDay) {
            return { dDay: null, label: '?', colorClass: 'bg-gray-100 text-gray-400' };
        }

        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        // 1. 이번 달의 월급날 계산 (월말일 고려)
        let targetPayDay = payDay;
        const lastDayOfThisMonth = endOfMonth(new Date(currentYear, currentMonth, 1));
        const lastDayOfThisMonthDate = getDate(lastDayOfThisMonth);

        // 99(매월 말일) 처리
        if (payDay === 99) {
            targetPayDay = lastDayOfThisMonthDate;
        }

        let targetDate = new Date(currentYear, currentMonth, targetPayDay);

        if (targetPayDay > lastDayOfThisMonthDate) {
            targetDate = lastDayOfThisMonth;
        }

        // 2. 이미 지났으면 다음 달로 설정
        if (differenceInCalendarDays(targetDate, today) < 0) {
            const nextMonth = addMonths(new Date(currentYear, currentMonth, 1), 1);
            const lastDayOfNextMonth = endOfMonth(nextMonth);
            const lastDayOfNextMonthDate = getDate(lastDayOfNextMonth);

            let nextTargetDay = payDay;

            // 99(매월 말일) 처리
            if (payDay === 99) {
                nextTargetDay = lastDayOfNextMonthDate;
            } else if (payDay > lastDayOfNextMonthDate) {
                nextTargetDay = lastDayOfNextMonthDate;
            }
            targetDate = setDate(nextMonth, nextTargetDay);
        }

        const diffString = differenceInCalendarDays(targetDate, today);
        const diff = Math.max(0, diffString);

        let color = '';
        // 99일 경우 실제 날짜를 표시, 아닐 경우 payDay 표시
        let textLabel = payDay === 99 ? `${getDate(targetDate)}일` : `${payDay}일`;

        if (diff === 0) {
            // D-Day (당일)
            color = 'bg-red-600 text-white animate-pulse ring-2 ring-red-200';
            textLabel = 'D-Day';
        } else if (diff === 1) {
            color = 'bg-red-500 text-white';
        } else if (diff <= 3) { // D-2 ~ D-3
            color = 'bg-red-300 text-red-900';
        } else if (diff <= 5) { // D-4 ~ D-5
            color = 'bg-orange-200 text-orange-800';
        } else {
            // 평소 (6일 이상)
            color = 'bg-teal-50 text-teal-700';
        }

        return {
            dDay: diff,
            label: textLabel,
            colorClass: color
        };
    }, [payDay]);

    return (
        <div className={cn(
            "min-w-10 w-auto h-12 px-1 md:px-3 rounded-xl flex flex-col items-center justify-center shadow-inner transition-all whitespace-nowrap",
            colorClass,
            className
        )}>
            {dDay === null ? (
                <span className="text-xl font-bold">?</span>
            ) : (
                <span className={cn(
                    "font-bold leading-none select-none",
                    dDay === 0
                        ? "text-xs md:text-[11px] font-extrabold tracking-tighter" // Mobile: larger, Bolder, Tighter
                        : "text-lg md:text-xl"
                )}>
                    {label}
                </span>
            )}
        </div>
    );
}
