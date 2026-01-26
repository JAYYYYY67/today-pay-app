export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
};
