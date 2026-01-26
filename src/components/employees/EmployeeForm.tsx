import { useState } from 'react';
import { type Employee, type PaymentType, BANK_LIST } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { cn } from '../../utils/cn';
import { ChevronDown, X, Building2, ArrowRightLeft } from 'lucide-react';
import { useBusiness } from '../../contexts/BusinessContext';

interface EmployeeFormProps {
    onSubmit: (data: Omit<Employee, 'id' | 'createdAt'>) => void;
    onCancel: () => void;
    onTransfer?: (targetBusinessId: string, targetBusinessName: string) => void;
    initialData?: Employee;
}

export default function EmployeeForm({ onSubmit, onCancel, onTransfer, initialData }: EmployeeFormProps) {
    const { businesses, currentBusinessId } = useBusiness();
    const [name, setName] = useState(initialData?.name || '');
    const [paymentType, setPaymentType] = useState<PaymentType>(initialData?.paymentType || 'HOURLY');
    const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
    const [applyHolidayAllowance, setApplyHolidayAllowance] = useState(initialData?.applyHolidayAllowance ?? true);

    // 세금 설정 state
    const [taxOption, setTaxOption] = useState<'NONE' | '3.3' | 'CUSTOM'>(() => {
        const rate = initialData?.taxRate ?? 0;
        if (rate === 0) return 'NONE';
        if (rate === 3.3) return '3.3';
        return 'CUSTOM';
    });
    const [customTaxRate, setCustomTaxRate] = useState(() => {
        const rate = initialData?.taxRate ?? 0;
        return (rate !== 0 && rate !== 3.3) ? rate.toString() : '';
    });

    const [bankName, setBankName] = useState(initialData?.bankName || '');
    const [accountNumber, setAccountNumber] = useState(initialData?.accountNumber || '');
    const [isBankSelectorOpen, setIsBankSelectorOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Transfer Logic
    const [targetBusinessId, setTargetBusinessId] = useState('');

    const handleSubmit = async () => {
        if (isSubmitting) return;

        if (!name) {
            alert('이름을 입력해주세요.');
            return;
        }
        if (!amount) {
            alert('금액을 입력해주세요.');
            return;
        }
        if (!bankName) {
            alert('은행을 선택해주세요.');
            return;
        }
        if (!accountNumber) {
            alert('계좌번호를 입력해주세요.');
            return;
        }

        // 공제율 결정
        let finalTaxRate = 0;
        if (taxOption === '3.3') {
            finalTaxRate = 3.3;
        } else if (taxOption === 'CUSTOM') {
            finalTaxRate = parseFloat(customTaxRate) || 0;
        }

        try {
            setIsSubmitting(true);
            // 약간의 지연을 주어 UI 반응을 확실하게 보여줌 (UX 개선)
            await new Promise(resolve => setTimeout(resolve, 300));

            onSubmit({
                name,
                paymentType,
                amount: parseInt(amount, 10),
                bankName,
                accountNumber,
                taxRate: finalTaxRate,
                applyHolidayAllowance,
                active: true,
            } as any);
        } catch (error) {
            console.error('Form Submission Error:', error);
            alert('저장 중 오류가 발생했습니다: ' + error);
            setIsSubmitting(false);
        }
    };

    const handleTransferClick = () => {
        if (!targetBusinessId) {
            alert('이동할 지점을 선택해주세요.');
            return;
        }
        if (onTransfer) {
            const targetName = businesses.find(b => b.id === targetBusinessId)?.name || '알 수 없음';
            onTransfer(targetBusinessId, targetName);
        }
    };

    const paymentTypes: { value: PaymentType; label: string }[] = [
        { value: 'HOURLY', label: '시급' },
        { value: 'DAILY', label: '일당' },
        { value: 'PER_TASK', label: '건별' },
    ];

    const isEditMode = !!initialData;
    const canTransfer = isEditMode && businesses.length > 1 && onTransfer;

    return (
        <div className="space-y-6 pt-2">
            <div className="space-y-4">
                <Input
                    label="이름"
                    placeholder="홍길동"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSubmitting}
                />

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 ml-1">급여 형태</label>
                    <div className="grid grid-cols-3 gap-2">
                        {paymentTypes.map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => setPaymentType(type.value)}
                                className={cn(
                                    "py-3 rounded-xl text-sm font-medium transition-all border",
                                    paymentType === type.value
                                        ? "bg-primary/10 border-primary text-primary"
                                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50",
                                    isSubmitting && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>

                <Input
                    label={paymentType === 'HOURLY' ? '시급' : paymentType === 'DAILY' ? '일당' : '건당 금액'}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="10000"
                    value={amount}
                    onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setAmount(val);
                    }}
                    disabled={isSubmitting}
                />

                {/* Holiday Allowance Setting */}
                {paymentType === 'HOURLY' && (
                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={applyHolidayAllowance}
                                onChange={(e) => setApplyHolidayAllowance(e.target.checked)}
                                className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <div>
                                <span className="font-bold text-gray-800 text-sm block">주휴수당 자동 계산</span>
                                <span className="text-xs text-gray-500 mt-0.5 block">
                                    주 15시간 이상 근무 시 법정 주휴수당을 자동으로 계산하여 급여에 포함합니다.
                                </span>
                            </div>
                        </label>
                    </div>
                )}

                {/* Tax Settings */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1">세금 / 공제 설정</label>
                    <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
                        {/* Radio Options */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="taxOption"
                                    value="NONE"
                                    checked={taxOption === 'NONE'}
                                    onChange={() => setTaxOption('NONE')}
                                    className="w-5 h-5 text-primary focus:ring-primary border-gray-300"
                                />
                                <span className="text-sm font-medium text-gray-700">공제 없음 (0%)</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="taxOption"
                                    value="3.3"
                                    checked={taxOption === '3.3'}
                                    onChange={() => setTaxOption('3.3')}
                                    className="w-5 h-5 text-primary focus:ring-primary border-gray-300"
                                />
                                <span className="text-sm font-medium text-gray-700">3.3% (프리랜서, 사업소득)</span>
                            </label>

                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="taxOption"
                                        value="CUSTOM"
                                        checked={taxOption === 'CUSTOM'}
                                        onChange={() => setTaxOption('CUSTOM')}
                                        className="w-5 h-5 text-primary focus:ring-primary border-gray-300"
                                    />
                                    <span className="text-sm font-medium text-gray-700">직접 입력</span>
                                </label>

                                {taxOption === 'CUSTOM' && (
                                    <div className="flex items-center gap-1 ml-auto">
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={customTaxRate}
                                            onChange={(e) => setCustomTaxRate(e.target.value)}
                                            placeholder="0"
                                            className="w-16 px-2 py-1 rounded-lg border border-gray-300 text-right text-sm font-medium focus:outline-none focus:border-primary"
                                        />
                                        <span className="text-sm text-gray-600">%</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                        <div className="flex flex-col gap-1.5 w-full">
                            <label className="text-sm font-semibold text-gray-700 ml-1">
                                은행
                            </label>
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => setIsBankSelectorOpen(true)}
                                className={cn(
                                    'w-full px-3 py-3.5 pr-8 rounded-2xl bg-gray-50 border border-transparent font-medium text-gray-900 text-left relative',
                                    'focus:bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all',
                                    'disabled:opacity-60 disabled:cursor-not-allowed whitespace-normal break-keep',
                                    !bankName && 'text-gray-500'
                                )}
                            >
                                {bankName || '선택'}
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    </div>
                    <div className="col-span-2">
                        <Input
                            label="계좌번호"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="1234567890"
                            value={accountNumber}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setAccountNumber(val);
                            }}
                            disabled={isSubmitting}
                        />
                    </div>
                </div>
            </div>

            {/* Business Transfer Section */}
            {canTransfer && (
                <div className="pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-2">
                    <label className="text-sm font-semibold text-gray-700 ml-1 flex items-center gap-1.5 mb-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        소속 지점 이동 (전근)
                    </label>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200">
                        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                            직원을 다른 지점으로 이동시킵니다.<br />
                            <strong className="text-blue-600 block mb-1">직원의 소속만 변경되며, 과거 근무 기록은 유지됩니다.</strong>
                            <strong className="text-red-500 text-[11px]">※ 단, 현재 지점에 잡혀있는 오늘 이후의 모든 근무 일정은 자동으로 삭제됩니다.</strong>
                        </p>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <select
                                    value={targetBusinessId}
                                    onChange={(e) => setTargetBusinessId(e.target.value)}
                                    className="w-full appearance-none bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-primary focus:border-primary block p-3 pr-8"
                                >
                                    <option value="">이동할 지점 선택</option>
                                    {businesses
                                        .filter(b => b.id !== currentBusinessId)
                                        .map(business => (
                                            <option key={business.id} value={business.id}>
                                                {business.name}
                                            </option>
                                        ))
                                    }
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleTransferClick}
                                disabled={!targetBusinessId}
                                className="whitespace-nowrap bg-white hover:bg-teal-50 hover:text-primary hover:border-teal-200 border-gray-200"
                            >
                                <ArrowRightLeft className="w-4 h-4 mr-1.5" />
                                이동
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-100 mt-2">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                    className="flex-1"
                    disabled={isSubmitting}
                >
                    취소
                </Button>
                <Button
                    type="button"
                    onClick={handleSubmit}
                    className={cn(
                        "flex-[2]",
                        isEditMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "" // 수정 모드일 때 색상 변경
                    )}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? '저장 중...' : (isEditMode ? '수정 완료' : '저장하기')}
                </Button>
            </div>

            {/* Bank Selection Modal/Drawer */}
            {isBankSelectorOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 animate-in fade-in duration-200">
                    <div
                        className="bg-white w-full max-w-sm sm:rounded-3xl rounded-t-3xl max-h-[80vh] flex flex-col shadow-xl animate-in slide-in-from-bottom-10 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-bold ml-1">은행 선택</h3>
                            <button
                                onClick={() => setIsBankSelectorOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-4 grid grid-cols-2 gap-3">
                            {BANK_LIST.map((bank) => (
                                <button
                                    key={bank}
                                    onClick={() => {
                                        setBankName(bank);
                                        setIsBankSelectorOpen(false);
                                    }}
                                    className={cn(
                                        "py-3 px-3 rounded-xl text-left font-medium transition-all whitespace-normal break-keep h-full flex items-center",
                                        bankName === bank
                                            ? "bg-primary/10 text-primary border border-primary/20"
                                            : "bg-gray-50 text-gray-800 hover:bg-gray-100"
                                    )}
                                >
                                    {bank}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Backdrop click handler */}
                    <div className="absolute inset-0 -z-10" onClick={() => setIsBankSelectorOpen(false)} />
                </div>
            )}
        </div>
    );
}
