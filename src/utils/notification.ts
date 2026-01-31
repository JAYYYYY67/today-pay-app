import type { Employee } from '../types';

export interface PayDayNotificationResult {
    dDayEmployees: Employee[];
    dMinusOneEmployees: Employee[];
    message: string | null;
}

export const checkPayDayNotifications = (employees: Employee[]): PayDayNotificationResult => {
    const today = new Date();
    const currentDay = today.getDate(); // 1~31

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowDay = tomorrow.getDate();

    // Helper to check if a payday matches target day, considering 99 (End of Month)
    const isPayDayMatch = (payDay: number | undefined, targetDay: number, targetDateObj: Date) => {
        const pDay = payDay || 1;
        if (pDay === 99) {
            // Check if targetDateObj is the last day of its month
            const nextDay = new Date(targetDateObj);
            nextDay.setDate(targetDateObj.getDate() + 1);
            return nextDay.getDate() === 1; // If tomorrow is 1st, today is last day
        }
        return pDay === targetDay;
    };

    // D-Day Employees
    const dDayEmployees = employees.filter(emp => {
        if (!emp.active || emp.isRetired) return false;
        return isPayDayMatch(emp.payDay, currentDay, today);
    });

    // D-1 Employees
    const dMinusOneEmployees = employees.filter(emp => {
        if (!emp.active || emp.isRetired) return false;
        return isPayDayMatch(emp.payDay, tomorrowDay, tomorrow);
    });

    let message: string | null = null;
    const totalCount = dDayEmployees.length + dMinusOneEmployees.length;

    if (totalCount > 0) {
        if (dDayEmployees.length > 0) {
            const names = dDayEmployees.map(e => e.name);
            const title = names[0];
            const extra = names.length > 1 ? ` 외 ${names.length - 1}명` : '';
            message = `오늘(${currentDay}일)은 ${title}님${extra}의 월급날입니다! 💸`;
        } else if (dMinusOneEmployees.length > 0) {
            const names = dMinusOneEmployees.map(e => e.name);
            const title = names[0];
            const extra = names.length > 1 ? ` 외 ${names.length - 1}명` : '';
            message = `내일(${tomorrowDay}일)은 ${title}님${extra}의 월급날입니다. 미리 준비하세요!`;
        }
    }

    return {
        dDayEmployees,
        dMinusOneEmployees,
        message
    };
};

export const sendBrowserNotification = (message: string) => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
        new Notification('오늘월급 알림', {
            body: message,
            icon: '/icon-192.png', // Ensure icon exists or use default
            tag: 'payday-notification' // Prevent duplicate notifications stacking
        });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification('오늘월급 알림', {
                    body: message,
                    icon: '/icon-192.png',
                    tag: 'payday-notification'
                });
            }
        });
    }
};
