export type PaymentType = 'HOURLY' | 'DAILY' | 'PER_TASK';

export interface Business {
    id: string;
    name: string;
}

export interface Advance {
    id: string;
    amount: number;
    date: string; // YYYY-MM-DD
    memo?: string;
    createdAt: number;
}

export interface Employee {
    id: string;
    businessId?: string; // 소속 사업장 ID (마이그레이션 후 필수)
    name: string;
    paymentType: PaymentType;
    amount: number; // 시급, 일당, 또는 건당 금액
    bankName: string;
    accountNumber: string;
    taxRate: number; // 세금/공제율 (0 ~ 100), 예: 3.3
    applyHolidayAllowance: boolean; // 주휴수당 적용 여부
    active: boolean;
    isRetired?: boolean; // 퇴사 여부 (Soft Delete)
    payDay?: number; // 월급날 (1~31)
    advances?: Advance[]; // 가불 내역
    createdAt: number;
}

export interface WorkLog {
    id: string;
    businessId?: string; // 소속 사업장 ID
    employeeId: string;
    date: string; // YYYY-MM-DD
    hours?: number; // 시급제일 경우 근무 시간
    count?: number; // 건별일 경우 건수 (기본 1)
    memo?: string;

    // Data Integrity & Features
    snapshot?: {
        hourlyRate: number; // 당시 시급
        taxRate: number;    // 당시 공제율
        employeeName: string; // 당시 이름
    };
    isNightShift?: boolean; // 야간수당 (1.5배) 여부
    isLocked?: boolean;     // 마감 여부 (수정 불가)
    repeatGroupId?: string; // 반복 일정 그룹 ID

    createdAt: number;
}

export const BANK_LIST = [
    '토스뱅크', '카카오뱅크', '국민은행', '신한은행', '우리은행',
    '하나은행', '농협은행', '기업은행', 'SC제일은행', '부산은행',
    '대구은행', '광주은행', '전북은행', '경남은행'
];
