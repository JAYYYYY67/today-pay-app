import { useState } from 'react';
import { Plus, Trash2, User, CreditCard, Pencil } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { type Employee, type WorkLog } from '../types';
import EmployeeForm from '../components/employees/EmployeeForm';
import { formatCurrency } from '../utils/format';
import Button from '../components/ui/Button';
import { generateId } from '../utils/id';
import { useBusiness } from '../contexts/BusinessContext';
import { format } from 'date-fns';

export default function EmployeeManage() {
    const { currentBusinessId } = useBusiness();
    const [allEmployees, setAllEmployees] = useLocalStorage<Employee[]>('employees', []);
    const [, setAllWorkLogs] = useLocalStorage<WorkLog[]>('workLogs', []);

    const [isAdding, setIsAdding] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>(undefined);

    const handleSaveEmployee = (data: Omit<Employee, 'id' | 'createdAt'>) => {
        try {
            if (editingEmployee) {
                // 수정 모드
                setAllEmployees((prev) => prev.map(emp =>
                    emp.id === editingEmployee.id
                        ? { ...emp, ...data } // 기존 ID, createdAt 유지하고 데이터만 업데이트
                        : emp
                ));
                alert('직원 정보가 수정되었습니다!');
                setEditingEmployee(undefined);
            } else {
                // 추가 모드
                const newEmployee: Employee = {
                    ...data,
                    id: generateId(),
                    createdAt: Date.now(),
                    businessId: currentBusinessId, // Assign current business
                };
                setAllEmployees((prev) => [...prev, newEmployee]);
                alert('직원이 성공적으로 추가되었습니다!');
            }
            setIsAdding(false);
        } catch (error) {
            console.error('Save Employee Error:', error);
            alert('오류가 발생했습니다: ' + error);
        }
    };

    const handleTransferEmployee = (targetBusinessId: string, targetBusinessName: string) => {
        if (!editingEmployee) return;

        if (window.confirm(`${editingEmployee.name} 직원을 [${targetBusinessName}]으로 이동하시겠습니까?\n\n이동 시 현재 지점에서의 미래 근무 일정(오늘 포함)은 자동 삭제됩니다.\n(과거 근무 기록은 유지됩니다)`)) {
            const empId = editingEmployee.id;
            const today = format(new Date(), 'yyyy-MM-dd');

            // 1. 미래 근무 기록 삭제 (오늘 포함)
            // 현재 지점의 기록만 삭제하는 것이 안전하지만, businessId가 어차피 타겟으로 바뀌므로 
            // '이 직원의 모든 미래 기록'을 지우는게 아니라 '현재 지점에 잡혀있는' 것을 지워야 함.
            // 하지만 workLogs에는 businessId가 있음.
            setAllWorkLogs(prev => prev.filter(log => {
                // 해당 직원의 기록이면서 && 현재 지점 기록인가? (중요) -> 전근 가는 거니까 현재 지점 껄 지워야 함.
                // 또는 직원의 미래 스케줄은 지점에서 수행 불가능하므로 지점 불문 삭제? -> 현 지점 명시가 안전.
                if (log.employeeId === empId) {
                    // 날짜 비교 (문자열 비교: yyyy-MM-dd라 가능)
                    if (log.date >= today) {
                        return false; // 삭제
                    }
                }
                return true; // 유지
            }));

            // 2. 직원 정보 업데이트 (businessId 변경)
            setAllEmployees(prev => prev.map(emp =>
                emp.id === empId
                    ? { ...emp, businessId: targetBusinessId }
                    : emp
            ));

            alert(`직원이 [${targetBusinessName}]으로 이동되었습니다.\n현재 지점의 미래 근무 일정이 정리되었습니다.`);
            setIsAdding(false);
            setEditingEmployee(undefined);
        }
    };

    const handleEditClick = (employee: Employee) => {
        setEditingEmployee(employee);
        setIsAdding(true);
        // 모바일 UX: 수정 버튼 누르면 폼이 있는 상단으로 스크롤 이동
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteEmployee = (id: string) => {
        if (window.confirm('해당 직원을 퇴사 처리하시겠습니까?\n\n[주의] 퇴사 처리 시, 오늘을 포함한 이후의 모든 근무 일정이 자동으로 삭제됩니다.\n(어제까지의 과거 기록은 안전하게 유지됩니다)')) {
            const today = format(new Date(), 'yyyy-MM-dd');

            // 1. 미래 근무 기록 삭제 (오늘 포함)
            setAllWorkLogs(prev => prev.filter(log => {
                if (log.employeeId === id) {
                    if (log.date >= today) {
                        return false; // 삭제
                    }
                }
                return true; // 유지
            }));

            // 2. 직원 퇴사 상태 업데이트
            setAllEmployees((prev) => prev.map(e =>
                e.id === id ? { ...e, active: false, isRetired: true } : e
            ));
        }
    };

    const getPaymentLabel = (type: string) => {
        switch (type) {
            case 'HOURLY': return '시급';
            case 'DAILY': return '일당';
            case 'PER_TASK': return '건별';
            default: return '';
        }
    };

    // 퇴사하지 않은 직원만 표시 및 가나다 순 정렬 (현재 사업장 필터링)
    const activeEmployeesList = allEmployees
        .filter(e => e.businessId === currentBusinessId && !e.isRetired)
        .sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="p-5 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">직원 관리</h1>
                {!isAdding && (
                    <button
                        onClick={() => {
                            setEditingEmployee(undefined);
                            setIsAdding(true);
                        }}
                        className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                    >
                        <Plus className="w-6 h-6 text-gray-700" />
                    </button>
                )}
            </div>

            {isAdding ? (
                <div className="absolute inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-bottom-4">
                    {/* 상단 헤더 영역 (고정) */}
                    <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">
                            {editingEmployee ? '직원 정보 수정' : '새로운 직원 등록'}
                        </h2>
                        <button
                            onClick={() => {
                                setIsAdding(false);
                                setEditingEmployee(undefined);
                            }}
                            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        >
                            <span className="sr-only">닫기</span>
                            {/* X Icon manually or just reuse standard close button logic inside form if needed, but here a simple close is good UX */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                    </div>

                    {/* 폼 컨텐츠 영역 (스크롤 가능) */}
                    <div className="flex-1 overflow-y-auto p-6 pb-20 custom-scrollbar">
                        <EmployeeForm
                            key={editingEmployee?.id || 'new'} // form reset을 위한 key
                            initialData={editingEmployee}
                            onSubmit={handleSaveEmployee}
                            onTransfer={handleTransferEmployee}
                            onCancel={() => {
                                setIsAdding(false);
                                setEditingEmployee(undefined);
                            }}
                        />
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {activeEmployeesList.length === 0 ? (
                        <div className="text-center py-20 bg-white/50 rounded-[2rem] border border-dashed border-gray-300">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
                                <User className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-gray-500 font-medium">등록된 직원이 없습니다</p>
                            <Button
                                variant="ghost"
                                className="mt-4 text-primary font-bold hover:bg-gray-100 rounded-xl px-6"
                                onClick={() => {
                                    setEditingEmployee(undefined);
                                    setIsAdding(true);
                                }}
                            >
                                + 첫 직원 등록하기
                            </Button>
                        </div>
                    ) : (
                        activeEmployeesList.map((employee) => (
                            <div key={employee.id} className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-100 relative group transition-all hover:shadow-md hover:border-teal-100">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-primary flex items-center justify-center font-bold text-lg shadow-inner">
                                            {employee.name[0]}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{employee.name}</h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="bg-gray-100 text-gray-600 text-[11px] px-1.5 py-0.5 rounded font-medium">
                                                    {getPaymentLabel(employee.paymentType)}
                                                </span>
                                                <span className="text-primary font-bold text-sm">
                                                    {formatCurrency(employee.amount)}원
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleEditClick(employee)}
                                            className="text-gray-400 hover:text-primary transition-colors p-2.5 rounded-xl hover:bg-teal-50"
                                        >
                                            <Pencil className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteEmployee(employee.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-2.5 rounded-xl hover:bg-red-50"
                                            title="퇴사 처리"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                                    <CreditCard className="w-4 h-4 text-gray-400" />
                                    <span className="font-medium text-gray-600">{employee.bankName} {employee.accountNumber}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
