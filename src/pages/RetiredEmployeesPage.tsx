import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, UserX } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { type Employee } from '../types';
import Button from '../components/ui/Button';

import { useBusiness } from '../contexts/BusinessContext';

export default function RetiredEmployeesPage() {
    const navigate = useNavigate();
    const { currentBusinessId } = useBusiness();
    const [allEmployees, setAllEmployees] = useLocalStorage<Employee[]>('employees', []);

    // 퇴사자 필터링 및 이름순 정렬
    const retiredEmployees = allEmployees
        .filter(e => e.businessId === currentBusinessId && (!e.active || e.isRetired))
        .sort((a, b) => a.name.localeCompare(b.name));

    const handleRestoreEmployee = (empId: string) => {
        if (window.confirm('해당 직원을 복구하시겠습니까?')) {
            setAllEmployees(prev => prev.map(e =>
                e.id === empId
                    ? { ...e, active: true, isRetired: false }
                    : e
            ));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <header className="bg-white sticky top-0 z-10 border-b border-gray-100 px-4 py-4 flex items-center gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-700" />
                </button>
                <h1 className="text-xl font-bold text-gray-900">퇴사자 목록</h1>
            </header>

            <div className="p-4 space-y-4">
                {retiredEmployees.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-4">
                            <UserX className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">퇴사 처리된 직원이 없습니다.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-500 font-medium px-1">
                            총 {retiredEmployees.length}명 (가나다순)
                        </p>
                        {retiredEmployees.map(emp => (
                            <div key={emp.id} className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-100 flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-gray-900 text-lg">{emp.name}</p>
                                    <div className="mt-1 flex flex-col gap-0.5 text-xs text-gray-400">
                                        <span>{emp.bankName} {emp.accountNumber}</span>
                                        <span>시급: {emp.amount.toLocaleString()}원</span>
                                    </div>
                                </div>
                                <Button
                                    variant="secondary"
                                    onClick={() => handleRestoreEmployee(emp.id)}
                                    className="bg-teal-50 text-primary border-teal-100 hover:bg-teal-100 hover:border-teal-200"
                                >
                                    <RotateCcw className="w-4 h-4 mr-1.5" />
                                    복구
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
