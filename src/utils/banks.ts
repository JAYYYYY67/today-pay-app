export const BANK_CODES: Record<string, string> = {
    '산업': '02',
    '기업': '03',
    '국민': '04',
    '수협': '07',
    '농협': '11',
    '단위농협': '12',
    '우리': '20',
    'SC': '23',
    'SC제일': '23',
    '대구': '31',
    '부산': '32',
    '광주': '34',
    '제주': '35',
    '전북': '37',
    '경남': '39',
    '새마을': '45',
    '신협': '48',
    '저축': '50',
    '우체국': '71',
    '하나': '81',
    '신한': '88',
    '케이': '89',
    '케이뱅크': '89',
    '카카오': '90',
    '카카오뱅크': '90',
    '토스': '92',
    '토스뱅크': '92',
};

export function getBankCode(bankName: string): string | undefined {
    if (!bankName) return undefined;

    // 1. Remove spaces
    // 2. Remove '은행' suffix if present
    const normalized = bankName.replace(/\s+/g, '').replace(/은행$/, '');

    // 3. Check exact match in map
    if (BANK_CODES[normalized]) {
        return BANK_CODES[normalized];
    }

    // 4. Check for partial matches (e.g. user typed "KB국민" -> we check if it contains "국민")
    // This is a bit looser. Let's try to match keys that are contained in the input
    const foundKey = Object.keys(BANK_CODES).find(key => normalized.includes(key));
    if (foundKey) {
        return BANK_CODES[foundKey];
    }

    return undefined;
}
