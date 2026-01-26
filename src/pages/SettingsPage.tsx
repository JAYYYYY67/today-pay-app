import { useState, useRef } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Employee, WorkLog } from '../types';
import Button from '../components/ui/Button';
import { Download, Upload, Trash2, RotateCcw, UserX, Type, Building2, Pencil, Plus, Check, X } from 'lucide-react';
import { useFontSize } from '../contexts/FontSizeContext';
import { useBusiness } from '../contexts/BusinessContext';
import { cn } from '../utils/cn';

export default function SettingsPage() {
    const { fontSize, setFontSize } = useFontSize();
    const { currentBusiness, addBusiness, updateBusiness, deleteBusiness, businesses } = useBusiness();

    const [allEmployees, setAllEmployees] = useLocalStorage<Employee[]>('employees', []);
    const [allWorkLogs, setAllWorkLogs] = useLocalStorage<WorkLog[]>('workLogs', []);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isRetiredModalOpen, setIsRetiredModalOpen] = useState(false);

    // --- Business Management Logic ---
    const [editingBusinessId, setEditingBusinessId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    // Add Business State
    const [isAddingBusiness, setIsAddingBusiness] = useState(false);
    const [newBusinessName, setNewBusinessName] = useState('');

    const startEditBusiness = (id: string, currentName: string) => {
        setEditingBusinessId(id);
        setEditName(currentName);
    };

    const saveBusinessName = (id: string) => {
        if (editName.trim()) {
            updateBusiness(id, editName.trim());
        }
        setEditingBusinessId(null);
    };

    const handleAddBusiness = () => {
        if (!newBusinessName.trim()) {
            alert('사업장 이름을 입력해주세요.');
            return;
        }
        addBusiness(newBusinessName.trim());
        setIsAddingBusiness(false);
        setNewBusinessName('');
    };

    const handleDeleteBusiness = (id: string) => {
        // 1. 최소 사업장 수 체크
        if (businesses.length <= 1) {
            alert('최소 하나의 사업장은 있어야 합니다.');
            return;
        }

        // 2. 재직 중인 직원 체크
        const activeEmployeesInBusiness = allEmployees.filter(
            e => e.businessId === id && !e.isRetired
        );

        if (activeEmployeesInBusiness.length > 0) {
            alert(`현재 근무 중인 직원이 ${activeEmployeesInBusiness.length}명 있어 삭제할 수 없습니다.\n해당 직원들을 먼저 퇴사 처리하거나 다른 지점으로 이동시켜주세요.`);
            return;
        }

        // 3. 삭제 진행
        deleteBusiness(id);
    };

    // --- Data Management Logic ---
    const handleBackup = () => {
        const data = {
            employees: allEmployees,
            workLogs: allWorkLogs,
            backupDate: new Date().toISOString()
        };
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `todaypay_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // JSON 확장자 체크
        if (!file.name.toLowerCase().endsWith('.json')) {
            alert('JSON 파일(.json)만 선택할 수 있습니다.');
            e.target.value = ''; // Reset input
            return;
        }

        if (!window.confirm('데이터를 복구하면 현재 데이터가 모두 덮어씌워집니다. 계속하시겠습니까?')) {
            e.target.value = ''; // Reset input
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);

                // Simple Validation
                if (!json.employees || !json.workLogs) {
                    throw new Error('올바르지 않은 백업 파일 형식입니다.');
                }

                setAllEmployees(json.employees);
                setAllWorkLogs(json.workLogs);

                alert('데이터 복구가 완료되었습니다. 페이지를 새로고침합니다.');
                window.location.reload();
            } catch (err) {
                console.error(err);
                alert('파일을 읽는 중 오류가 발생했습니다: ' + err);
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset
    };

    const handleReset = () => {
        if (window.confirm('정말로 모든 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다!')) {
            if (window.confirm('진짜 확실하나요? 모든 근무 기록과 직원 정보가 사라집니다.')) {
                localStorage.clear();
                alert('모든 데이터가 초기화되었습니다.');
                window.location.reload();
            }
        }
    };

    // --- Retired Employees Logic ---
    const retiredEmployees = allEmployees.filter(e => e.businessId === currentBusiness?.id && (!e.active || e.isRetired));

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
        <div className="p-6 space-y-8 pb-24">
            <h1 className="text-2xl font-bold text-gray-900">설정</h1>

            {/* Display Settings Section */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold text-gray-800 px-1 flex items-center gap-2">
                    화면 설정
                </h2>
                <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-primary">
                            <Type className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-lg">글자 크기</p>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">화면의 전체적인 글자 크기를 조절합니다</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setFontSize('NORMAL')}
                            className={cn(
                                "py-3 rounded-xl font-bold transition-all border-2",
                                fontSize === 'NORMAL'
                                    ? "bg-teal-50 border-teal-200 text-teal-700 ring-1 ring-teal-200"
                                    : "bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100"
                            )}
                        >
                            기본 (보통)
                        </button>
                        <button
                            onClick={() => setFontSize('LARGE')}
                            className={cn(
                                "py-3 rounded-xl font-bold transition-all border-2 text-lg",
                                fontSize === 'LARGE'
                                    ? "bg-teal-50 border-teal-200 text-teal-700 ring-1 ring-teal-200"
                                    : "bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100"
                            )}
                        >
                            크게 (큰글씨)
                        </button>
                    </div>
                </div>
            </section>

            <div className="h-px bg-gray-200 mx-2" />

            {/* Business Management Section */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold text-gray-800 px-1 flex items-center gap-2">
                    내 사업장 목록
                </h2>
                <div className="space-y-3">
                    {businesses.map(business => {
                        const isEditing = editingBusinessId === business.id;
                        const isCurrent = currentBusiness?.id === business.id;

                        return (
                            <div
                                key={business.id}
                                className={cn(
                                    "bg-white p-4 rounded-[1.5rem] shadow-sm border border-gray-100 flex items-center justify-between transition-all",
                                    isCurrent ? "ring-2 ring-teal-50 border-teal-100" : ""
                                )}
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                                        isCurrent ? "bg-teal-50 text-primary" : "bg-gray-100 text-gray-500"
                                    )}>
                                        <Building2 className="w-6 h-6" />
                                    </div>

                                    <div className="flex-1 w-full">
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="w-full text-lg font-bold text-gray-900 border-b-2 border-primary outline-none bg-transparent py-1"
                                                autoFocus
                                                onBlur={() => saveBusinessName(business.id)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveBusinessName(business.id);
                                                    if (e.key === 'Escape') setEditingBusinessId(null);
                                                }}
                                            />
                                        ) : (
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-gray-900 text-lg">{business.name}</p>
                                                    {isCurrent && (
                                                        <span className="text-[10px] bg-teal-100 text-primary px-1.5 py-0.5 rounded font-bold">
                                                            현재 접속 중
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    직원 {allEmployees.filter(e => e.businessId === business.id && !e.isRetired).length}명 근무 중
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 pl-2">
                                    {isEditing ? (
                                        <button
                                            onClick={() => saveBusinessName(business.id)}
                                            className="p-2.5 bg-primary text-white rounded-xl hover:bg-teal-700 transition-colors"
                                        >
                                            <span className="text-xs font-bold px-1">저장</span>
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => startEditBusiness(business.id, business.name)}
                                                className="p-2.5 text-gray-400 hover:text-primary hover:bg-teal-50 rounded-xl transition-colors"
                                            >
                                                <Pencil className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteBusiness(business.id)}
                                                className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Add Business Inline Form */}
                    {isAddingBusiness ? (
                        <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border-2 border-primary/20 flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-primary flex-shrink-0">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <input
                                    type="text"
                                    value={newBusinessName}
                                    onChange={(e) => setNewBusinessName(e.target.value)}
                                    placeholder="새 사업장 이름 (예: 2호점)"
                                    className="w-full text-lg font-bold text-gray-900 border-b-2 border-primary outline-none bg-transparent py-1 placeholder:text-gray-300 placeholder:font-normal"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddBusiness();
                                        if (e.key === 'Escape') {
                                            setIsAddingBusiness(false);
                                            setNewBusinessName('');
                                        }
                                    }}
                                />
                            </div>
                            <div className="flex items-center gap-1 pl-2">
                                <button
                                    onClick={handleAddBusiness}
                                    className="p-2.5 bg-primary text-white rounded-xl hover:bg-teal-700 transition-colors shadow-sm"
                                >
                                    <Check className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => {
                                        setIsAddingBusiness(false);
                                        setNewBusinessName('');
                                    }}
                                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAddingBusiness(true)}
                            className="w-full py-4 border-2 border-dashed border-gray-200 rounded-[1.5rem] flex items-center justify-center gap-2 text-gray-400 font-bold hover:border-primary hover:text-primary hover:bg-teal-50/50 transition-all group"
                        >
                            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span>새 사업장 추가하기</span>
                        </button>
                    )}
                </div>
            </section>

            <div className="h-px bg-gray-200 mx-2" />

            {/* Data Management Section */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 px-1">
                    데이터 관리
                </h2>
                <div className="grid gap-4">
                    <button
                        onClick={handleBackup}
                        className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-[1.5rem] shadow-sm hover:shadow-md hover:border-teal-100 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <Download className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-gray-900 text-lg">데이터 백업</p>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">현재 데이터를 파일로 저장합니다</p>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => {
                            if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                                fileInputRef.current.click();
                            }
                        }}
                        className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-[1.5rem] shadow-sm hover:shadow-md hover:border-green-100 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                                <Upload className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-gray-900 text-lg">데이터 복구</p>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">백업 파일을 불러와 복원합니다</p>
                            </div>
                        </div>
                    </button>
                    <input
                        key={Date.now()} // Force re-render just in case
                        type="file"
                        ref={fileInputRef}
                        onChange={handleRestore}
                        className="hidden"
                    />

                    <button
                        onClick={handleReset}
                        className="flex items-center justify-between p-5 bg-red-50/50 border border-red-100 rounded-[1.5rem] shadow-sm hover:bg-red-50 hover:shadow-md transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-red-600 text-lg">데이터 초기화</p>
                                <p className="text-xs text-red-400 font-medium mt-0.5">모든 데이터를 영구적으로 삭제합니다</p>
                            </div>
                        </div>
                    </button>
                </div>
            </section>

            <div className="h-px bg-gray-200 mx-2" />

            {/* Employee Management Section */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold text-gray-800 px-1">직원 관리</h2>
                <button
                    onClick={() => setIsRetiredModalOpen(true)}
                    className="w-full flex items-center justify-between p-5 bg-white border border-gray-100 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 group-hover:scale-110 transition-transform">
                            <UserX className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-gray-900 text-lg">퇴사자 목록</p>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                                {retiredEmployees.length > 0
                                    ? `현재 ${retiredEmployees.length}명의 퇴사자가 있습니다`
                                    : '퇴사 처리된 직원이 없습니다'}
                            </p>
                        </div>
                    </div>
                </button>
            </section>

            {/* Retired Employees Modal */}
            {isRetiredModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-2xl relative max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold mb-6 text-gray-900">퇴사자 목록</h3>

                        <div className="flex-1 overflow-y-auto space-y-3 p-1">
                            {retiredEmployees.length === 0 ? (
                                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <p className="text-gray-400 font-medium">퇴사자가 없습니다.</p>
                                </div>
                            ) : (
                                retiredEmployees.map(emp => (
                                    <div key={emp.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div>
                                            <p className="font-bold text-gray-800 text-lg">{emp.name}</p>
                                            <p className="text-xs text-gray-500">{emp.bankName} {emp.accountNumber}</p>
                                        </div>
                                        <Button
                                            variant="secondary"
                                            onClick={() => handleRestoreEmployee(emp.id)}
                                            className="text-xs h-9 px-3 bg-white hover:bg-teal-50 hover:text-primary hover:border-teal-200 shadow-sm"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                                            복구
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>

                        <button
                            onClick={() => setIsRetiredModalOpen(false)}
                            className="w-full mt-6 py-4 bg-gray-100 rounded-2xl text-gray-700 font-bold hover:bg-gray-200 transition-colors"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )}

            <div className="text-center text-xs text-gray-300 pt-8">
                TodayPay v1.0.0
            </div>
        </div>
    );
}
